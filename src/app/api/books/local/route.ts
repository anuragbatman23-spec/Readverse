import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { Book } from '@/types';
import { searchLocalLightNovels } from '@/utils/localLightNovelsService';

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
    ensureLocalDir();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim() || '';
    const userParamRaw = searchParams.get('user')?.toLowerCase().trim() || '';
    const userParam = userParamRaw ? resolveUserEmail(userParamRaw) : '';

    const uploadsMap = getUserUploadsMap();
    const files = fs.readdirSync(LOCAL_BOOKS_DIR);
    const books: Book[] = [];

    for (const file of files) {
      // If userParam is specified, filter so users only see their own uploaded books
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
        // If owned by someone else, hide from this user's profile shelf
        if (isOwnedByOther && !isOwner) {
          continue;
        }
      }

      const fullPath = path.join(LOCAL_BOOKS_DIR, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      const cached = localBookCache.get(fullPath);
      if (cached && cached.mtime === stat.mtimeMs) {
        books.push(cached.book);
        continue;
      }

      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const bookData = JSON.parse(content) as Book;
          localBookCache.set(fullPath, { mtime: stat.mtimeMs, book: bookData });
          books.push(bookData);
        } catch (err) {
          console.error(`Error reading local json ${file}:`, err);
        }
      } else if (file.endsWith('.epub')) {
        try {
          const epubBook = await parseLocalEpub(fullPath, file);
          localBookCache.set(fullPath, { mtime: stat.mtimeMs, book: epubBook });
          books.push(epubBook);
        } catch (err) {
          console.error(`Error reading local epub ${file}:`, err);
        }
      }
    }

    const filtered = query
      ? books.filter(
          b =>
            b.title.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query) ||
            b.genre.some(g => g.toLowerCase().includes(query))
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

// POST endpoint to upload and save an EPUB file into local-books/
export async function POST(request: Request) {
  try {
    ensureLocalDir();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const savePath = path.join(LOCAL_BOOKS_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(savePath, Buffer.from(arrayBuffer));

    const parsedBook = await parseLocalEpub(savePath, filename);

    // Track user ownership if userEmail is supplied
    const userEmail = (formData.get('userEmail') as string | null)?.toLowerCase().trim();
    if (userEmail) {
      const map = getUserUploadsMap();
      const list = map[userEmail] || [];
      if (!list.includes(filename)) {
        list.push(filename);
        map[userEmail] = list;
        saveUserUploadsMap(map);
      }
    }

    return NextResponse.json({
      success: true,
      message: `File saved to ${savePath}`,
      book: parsedBook
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
