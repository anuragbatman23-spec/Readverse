import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { Book } from '@/types';
import { searchLocalLightNovels } from '@/utils/localLightNovelsService';
import { uploadEpubToAdminDrive, parseEpubBufferMetadata } from '@/lib/gdriveStorage';
import { getStorageObject, setStorageObject } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

const LOCAL_BOOKS_DIR = path.join(process.cwd(), 'local-books');
const USER_UPLOADS_FILE = path.join(process.cwd(), 'local-data', 'user_uploads.json');

function resolveUserEmail(identifier: string): string {
  const norm = identifier.toLowerCase().trim();
  if (norm.includes('@')) return norm;
  try {
    const usersFile = path.join(process.cwd(), 'local-data', 'users.json');
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (Array.isArray(users)) {
        const found = users.find(
          (u: any) =>
            u.id?.toLowerCase() === norm ||
            u.name?.toLowerCase() === norm ||
            u.email?.toLowerCase() === norm
        );
        if (found?.email) return found.email.toLowerCase();
      }
    }
  } catch {}
  return norm;
}

function getUserUploadsMap(): Record<string, string[]> {
  try {
    if (fs.existsSync(USER_UPLOADS_FILE)) {
      const raw = fs.readFileSync(USER_UPLOADS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

function saveUserUploadsMap(map: Record<string, string[]>) {
  try {
    const dir = path.dirname(USER_UPLOADS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USER_UPLOADS_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save user uploads map:', err);
  }
}

// In-memory cache for parsed local books keyed by full path and file mtime
interface LocalBookCacheEntry {
  mtime: number;
  book: Book;
}
const localBookCache = new Map<string, LocalBookCacheEntry>();

// Helper to ensure the directory exists
function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_BOOKS_DIR)) {
    fs.mkdirSync(LOCAL_BOOKS_DIR, { recursive: true });
  }
}

// Parse EPUB on server
async function parseLocalEpub(filePath: string, filename: string): Promise<Book> {
  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  // 1. Locate container.xml
  const containerFile = zip.file('META-INF/container.xml');
  let opfPath = 'OEBPS/content.opf';
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const match = containerXml.match(/full-path="([^"]+)"/i);
    if (match) opfPath = match[1];
  }

  const opfFile = zip.file(opfPath);
  let title = filename.replace(/\.epub$/i, '');
  let author = 'Local Author';
  let chaptersCount = 1;

  if (opfFile) {
    const opfXml = await opfFile.async('text');
    const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    if (authorMatch) author = authorMatch[1].trim();

    // Count itemrefs in spine
    const spineMatches = opfXml.match(/<itemref[^>]+idref="([^"]+)"/gi);
    if (spineMatches) chaptersCount = Math.max(1, spineMatches.length);
  }

  return {
    id: `local-file-${encodeURIComponent(filename)}`,
    title,
    author,
    category: 'book',
    coverImage: `/api/books/local/cover?file=${encodeURIComponent(filename)}`,
    description: `Stored locally on your server in local-books/${filename}. Includes ${chaptersCount} chapters with reading progress tracking.`,
    genre: ['Local Server', 'Custom Book', 'Offline'],
    rating: 5.0,
    pointsPerChapter: 2.0,
    chapters: []
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim() || '';
    const userParamRaw = searchParams.get('user')?.toLowerCase().trim() || '';
    const userParam = userParamRaw ? resolveUserEmail(userParamRaw) : '';

    const books: Book[] = [];
    const seenTitles = new Set<string>();

    // 1. Load books from Cloudflare D1 persistent cloud storage
    try {
      const d1Epubs = (await getStorageObject<any[]>('custom_epubs')) || [];
      for (const item of d1Epubs) {
        if (userParam && item.uploadedBy && item.uploadedBy.toLowerCase() !== userParam && !item.isPublic) {
          continue;
        }
        const norm = item.title?.toLowerCase().trim();
        if (norm && !seenTitles.has(norm)) {
          seenTitles.add(norm);
          books.push(item);
        }
      }
    } catch (d1Err) {
      console.warn('[Local Books API] D1 read notice:', d1Err);
    }

    // 2. Load from local filesystem if available (in local development)
    try {
      ensureLocalDir();
      const uploadsMap = getUserUploadsMap();
      if (fs.existsSync(LOCAL_BOOKS_DIR)) {
        const files = fs.readdirSync(LOCAL_BOOKS_DIR);
        for (const file of files) {
          if (userParam) {
            let isOwner = false;
            let isOwnedByOther = false;
            for (const [ownerEmail, userFiles] of Object.entries(uploadsMap)) {
              if (Array.isArray(userFiles) && userFiles.includes(file)) {
                if (ownerEmail.toLowerCase() === userParam) {
                  isOwner = true;
                } else {
                  isOwnedByOther = true;
                }
              }
            }
            if (isOwnedByOther && !isOwner) continue;
          }

          const fullPath = path.join(LOCAL_BOOKS_DIR, file);
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) continue;

          if (file.endsWith('.json')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const bookData = JSON.parse(content) as Book;
            const norm = bookData.title?.toLowerCase().trim();
            if (norm && !seenTitles.has(norm)) {
              seenTitles.add(norm);
              books.push(bookData);
            }
          } else if (file.endsWith('.epub')) {
            const epubBook = await parseLocalEpub(fullPath, file);
            const norm = epubBook.title?.toLowerCase().trim();
            if (norm && !seenTitles.has(norm)) {
              seenTitles.add(norm);
              books.push(epubBook);
            }
          }
        }
      }
    } catch {}

    const filtered = query
      ? books.filter(
          b =>
            b.title.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query) ||
            b.genre?.some(g => g.toLowerCase().includes(query))
        )
      : books;

    // If searching, also include matching locally stored light novels
    let localLN: Book[] = [];
    if (query) {
      try {
        localLN = await searchLocalLightNovels(query, 20);
      } catch {}
    }

    const merged = [...filtered, ...localLN];

    return NextResponse.json(
      {
        books: merged,
        count: merged.length,
        directory: LOCAL_BOOKS_DIR
      },
      {
        headers: {
          'Cache-Control': query ? 'private, no-cache' : 'public, s-maxage=60, stale-while-revalidate=120'
        }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST endpoint to upload an EPUB file into Google Drive and local storage
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userEmail = (formData.get('userEmail') as string | null)?.toLowerCase().trim();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse book metadata from buffer
    const parsedBook = await parseEpubBufferMetadata(buffer, filename);

    // 2. Upload to central Admin Google Drive folder
    let gdriveFileId: string | undefined;
    try {
      const uploadRes = await uploadEpubToAdminDrive({
        filename,
        buffer,
        mimeType: file.type || 'application/epub+zip'
      });
      gdriveFileId = uploadRes.fileId;
      parsedBook.id = `gdrive-${gdriveFileId}`;
      (parsedBook as any).gdriveFileId = gdriveFileId;
      (parsedBook as any).downloadUrl = `/api/books/gdrive/read?fileId=${gdriveFileId}`;
    } catch (gdriveErr: any) {
      console.warn('[Local Books API] Google Drive upload notice:', gdriveErr?.message || gdriveErr);
    }

    // 3. Persist book record to Cloudflare D1
    try {
      const existingList = (await getStorageObject<any[]>('custom_epubs')) || [];
      const filtered = existingList.filter(b => b.id !== parsedBook.id && b.title !== parsedBook.title);
      filtered.unshift({
        ...parsedBook,
        uploadedBy: userEmail || 'anonymous',
        uploadedAt: new Date().toISOString()
      });
      await setStorageObject('custom_epubs', filtered);
    } catch (d1Err) {
      console.warn('[Local Books API] D1 save notice:', d1Err);
    }

    // 4. In local dev, optionally save to disk (safely ignored on serverless EROFS)
    try {
      ensureLocalDir();
      const savePath = path.join(LOCAL_BOOKS_DIR, filename);
      fs.writeFileSync(savePath, buffer);

      if (userEmail) {
        const map = getUserUploadsMap();
        const list = map[userEmail] || [];
        if (!list.includes(filename)) {
          list.push(filename);
          map[userEmail] = list;
          saveUserUploadsMap(map);
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: gdriveFileId
        ? `Book uploaded and backed up to your Google Drive folder.`
        : `Book processed and saved to library.`,
      book: parsedBook,
      gdriveFileId
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
