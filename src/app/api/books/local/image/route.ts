import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { resolveSafeLNPath } from '@/utils/localLightNovelsService';

const LOCAL_BOOKS_DIR = path.join(process.cwd(), 'local-books');

// In-memory cache for extracted image buffers to ensure lightning-fast subsequent loads
const imageBufferCache = new Map<string, { buffer: Buffer; contentType: string }>();

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.jpg':
    case '.jpeg':
    default:
      return 'image/jpeg';
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathParam = searchParams.get('filePath');
    const bookId = searchParams.get('bookId');
    const src = searchParams.get('src');

    if (!src) {
      return NextResponse.json({ error: 'src parameter is required' }, { status: 400 });
    }

    let epubFilePath: string | null = null;

    if (filePathParam) {
      // Validate safe path
      const resolved = resolveSafeLNPath(filePathParam);
      if (resolved && fs.existsSync(resolved)) {
        epubFilePath = resolved;
      } else if (fs.existsSync(filePathParam)) {
        // Direct absolute path verification
        const home = process.env.HOME || process.env.USERPROFILE || '';
        const defaultDocPath = path.join(home, 'Documents', 'Officially Translated Light Novels');
        if (filePathParam.startsWith(defaultDocPath) || filePathParam.startsWith(LOCAL_BOOKS_DIR)) {
          epubFilePath = filePathParam;
        }
      }
    } else if (bookId) {
      if (bookId.startsWith('local-ln-')) {
        const relPath = decodeURIComponent(bookId.replace('local-ln-', ''));
        epubFilePath = resolveSafeLNPath(relPath);
      } else if (bookId.startsWith('local-file-')) {
        const decoded = decodeURIComponent(bookId.replace('local-file-', ''));
        const direct = path.join(LOCAL_BOOKS_DIR, decoded);
        epubFilePath = fs.existsSync(direct) ? direct : resolveSafeLNPath(decoded);
      }
    }

    if (!epubFilePath || !fs.existsSync(epubFilePath)) {
      return NextResponse.json({ error: 'Valid EPUB file not found' }, { status: 404 });
    }

    // Clean src inside zip (remove leading slashes, decode)
    const cleanZipSrc = decodeURIComponent(src).replace(/^[/\\]+/, '').replace(/\\/g, '/');
    const cacheKey = `${epubFilePath}:${cleanZipSrc}`;

    if (imageBufferCache.has(cacheKey)) {
      const cached = imageBufferCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cached.buffer), {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400, immutable'
        }
      });
    }

    const fileBuffer = fs.readFileSync(epubFilePath);
    const zip = await JSZip.loadAsync(fileBuffer);

    let zipFile = zip.file(cleanZipSrc);
    if (!zipFile) {
      // Try fuzzy search in zip
      const allFiles = Object.keys(zip.files);
      const baseName = path.basename(cleanZipSrc);
      const foundKey = allFiles.find(k => k.endsWith(baseName) || k.toLowerCase().endsWith(baseName.toLowerCase()));
      if (foundKey) {
        zipFile = zip.file(foundKey);
      }
    }

    if (!zipFile) {
      return NextResponse.json({ error: `Image not found inside EPUB: ${cleanZipSrc}` }, { status: 404 });
    }

    const imgBuffer = await zipFile.async('nodebuffer');
    const contentType = getContentType(cleanZipSrc);

    // Limit cache size to 100 images
    if (imageBufferCache.size > 100) {
      const firstKey = imageBufferCache.keys().next().value;
      if (firstKey) imageBufferCache.delete(firstKey);
    }
    imageBufferCache.set(cacheKey, { buffer: imgBuffer, contentType });

    return new NextResponse(new Uint8Array(imgBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable'
      }
    });
  } catch (err: any) {
    console.error('Error serving local EPUB image:', err);
    return NextResponse.json({ error: 'Internal server error extracting image' }, { status: 500 });
  }
}
