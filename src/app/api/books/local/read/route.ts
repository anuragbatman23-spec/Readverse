import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Book } from '@/types';
import { resolveSafeLNPath, parseLocalLNEpubChapters } from '@/utils/localLightNovelsService';
import { parseArchiveEpubChapters } from '@/utils/archiveOrgService';
import { downloadEpubFromAdminDrive, parseEpubBufferToChapters, parseEpubBufferMetadata } from '@/lib/gdriveStorage';
import { getStorageObject } from '@/lib/d1Client';

const LOCAL_BOOKS_DIR = path.join(process.cwd(), 'local-books');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId') || searchParams.get('id');

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    // 1. Check if it's an Archive.org stream (e.g. "archive-ln-...")
    if (bookId.startsWith('archive-ln-')) {
      const relPath = decodeURIComponent(bookId.replace('archive-ln-', ''));
      try {
        const chapters = await parseArchiveEpubChapters(relPath);
        const fileName = relPath.split('/').pop() || relPath;
        const cleanTitle = fileName.replace(/\.epub$/i, '').replace(/\[[^\]]+\]/g, '').trim();

        const book: Partial<Book> = {
          id: bookId,
          title: cleanTitle,
          category: 'lightnovel',
          chapters
        };

        return NextResponse.json(
          { chapters, book },
          { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
        );
      } catch (err: any) {
        console.error('Archive.org stream error:', err);
        return NextResponse.json({ error: `Failed to stream light novel from Archive.org: ${err.message}` }, { status: 502 });
      }
    }

    // 2. Check if it's a locally stored Light Novel (e.g. "local-ln-Overlord%2FOverlord...")
    if (bookId.startsWith('local-ln-')) {
      const relPath = decodeURIComponent(bookId.replace('local-ln-', ''));
      const filePath = resolveSafeLNPath(relPath);

      if (filePath && fs.existsSync(filePath)) {
        const chapters = await parseLocalLNEpubChapters(filePath);
        const fileName = path.basename(filePath);
        const cleanTitle = fileName.replace(/\.epub$/i, '').replace(/\s*\[[^\]]+\]/g, '').trim();

        const book: Partial<Book> = {
          id: bookId,
          title: cleanTitle,
          category: 'lightnovel',
          chapters
        };

        return NextResponse.json(
          { chapters, book },
          { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
        );
      }

      // Cloud fallback: If file is missing locally (e.g. on Vercel), stream from Archive.org
      try {
        const chapters = await parseArchiveEpubChapters(relPath);
        const fileName = relPath.split('/').pop() || relPath;
        const cleanTitle = fileName.replace(/\.epub$/i, '').replace(/\[[^\]]+\]/g, '').trim();

        const book: Partial<Book> = {
          id: bookId,
          title: cleanTitle,
          category: 'lightnovel',
          chapters
        };

        return NextResponse.json(
          { chapters, book },
          { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
        );
      } catch (cloudErr: any) {
        return NextResponse.json({ error: `Light novel file not found locally or on Archive.org: ${relPath}` }, { status: 404 });
      }
    }

    // 2. Check if it's a JSON book file (e.g. "local-atomic-habits")
    if (fs.existsSync(LOCAL_BOOKS_DIR)) {
      const files = fs.readdirSync(LOCAL_BOOKS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const fullPath = path.join(LOCAL_BOOKS_DIR, file);
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const bookData = JSON.parse(content) as Book;
            if (bookData.id === bookId || `local-${file.replace('.json', '')}` === bookId) {
              return NextResponse.json({
                chapters: bookData.chapters,
                book: bookData
              });
            }
          } catch {}
        }
      }
    }

    // 3. Check if it's a Google Drive stored book (e.g. "gdrive-1AbCdEf...")
    if (bookId.startsWith('gdrive-')) {
      const fileId = bookId.replace('gdrive-', '');
      try {
        const { buffer } = await downloadEpubFromAdminDrive(fileId);
        const chapters = await parseEpubBufferToChapters(buffer);
        const meta = await parseEpubBufferMetadata(buffer, `book_${fileId}.epub`);
        const book: Partial<Book> = {
          id: bookId,
          title: meta.title,
          category: 'book',
          coverImage: meta.coverImage,
          chapters
        };
        return NextResponse.json(
          { chapters, book },
          { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
        );
      } catch (err: any) {
        console.error('[GDrive Read] Failed to stream from Google Drive:', err);
        return NextResponse.json({ error: `Failed to stream from Google Drive: ${err.message}` }, { status: 502 });
      }
    }

    // 4. Check if it's an EPUB file in local-books/ (e.g. "local-file-my_book.epub")
    if (bookId.startsWith('local-file-')) {
      const decodedFilename = decodeURIComponent(bookId.replace('local-file-', ''));
      const filePath = path.join(LOCAL_BOOKS_DIR, decodedFilename);

      if (!fs.existsSync(filePath)) {
        // Fallback 1: Check Cloudflare D1 for Google Drive cloud link
        try {
          const d1Epubs = (await getStorageObject<any[]>('custom_epubs')) || [];
          const found = d1Epubs.find(b => b.id === bookId || b.id === `gdrive-${b.gdriveFileId}`);
          if (found?.gdriveFileId) {
            const { buffer } = await downloadEpubFromAdminDrive(found.gdriveFileId);
            const chapters = await parseEpubBufferToChapters(buffer);
            return NextResponse.json(
              { chapters, book: { ...found, chapters } },
              { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
            );
          }
        } catch {}

        // Fallback 2: Check LN directory as well
        const lnFallback = resolveSafeLNPath(decodedFilename);
        if (lnFallback && fs.existsSync(lnFallback)) {
          const chapters = await parseLocalLNEpubChapters(lnFallback);
          const cleanTitle = path.basename(lnFallback).replace(/\.epub$/i, '').replace(/_/g, ' ');
          const book: Partial<Book> = {
            id: bookId,
            title: cleanTitle,
            category: 'book',
            coverImage: `/api/books/local/cover?file=${encodeURIComponent(decodedFilename)}`,
            chapters
          };
          return NextResponse.json(
            { chapters, book },
            { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
          );
        }
        return NextResponse.json({ error: `File ${decodedFilename} not found` }, { status: 404 });
      }

      const chapters = await parseLocalLNEpubChapters(filePath);
      const cleanTitle = decodedFilename.replace(/\.epub$/i, '').replace(/_/g, ' ');
      const book: Partial<Book> = {
        id: bookId,
        title: cleanTitle,
        category: 'book',
        coverImage: `/api/books/local/cover?file=${encodeURIComponent(decodedFilename)}`,
        chapters
      };
      return NextResponse.json({ chapters, book });
    }

    return NextResponse.json({ error: 'Book not found on local server' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
