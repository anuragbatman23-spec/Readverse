import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { resolveSafeLNPath } from '@/utils/localLightNovelsService';
import { KNOWN_LIGHT_NOVEL_COVERS, DEFAULT_LIGHT_NOVEL_COVER } from '@/utils/imageOptimizer';

const LOCAL_BOOKS_DIR = path.join(process.cwd(), 'local-books');

// Helper to extract cover buffer and mime-type from an EPUB
async function extractEpubCover(filePath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!fs.existsSync(filePath)) return null;

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(fileBuffer);

    // 1. Locate container.xml to find the root OPF file
    const container = zip.file('META-INF/container.xml');
    let opfPath = 'OEBPS/content.opf';
    if (container) {
      const cxml = await container.async('text');
      const m = cxml.match(/full-path=["']([^"']+)["']/i);
      if (m) opfPath = m[1];
    }

    const opfFile = zip.file(opfPath);
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

    let coverHref: string | null = null;
    let coverMediaType: string | null = null;

    if (opfFile) {
      const opfXml = await opfFile.async('text');

      // Parse manifest items
      const items: Record<string, { href: string; mediaType: string; properties: string }> = {};
      const itemRegex = /<item\b([^>]+)>/gi;
      let match;
      while ((match = itemRegex.exec(opfXml)) !== null) {
        const attrs = match[1];
        const id = (attrs.match(/\bid=["']([^"']+)["']/i) || [])[1];
        const href = (attrs.match(/\bhref=["']([^"']+)["']/i) || [])[1];
        const mediaType = (attrs.match(/\bmedia-type=["']([^"']+)["']/i) || [])[1];
        const properties = (attrs.match(/\bproperties=["']([^"']+)["']/i) || [])[1] || '';
        if (id && href) {
          items[id] = { href, mediaType, properties };
        }
      }

      // Check 1: item with properties containing "cover-image"
      for (const [, item] of Object.entries(items)) {
        if (item.properties.includes('cover-image')) {
          coverHref = item.href;
          coverMediaType = item.mediaType;
          break;
        }
      }

      // Check 2: <meta name="cover" content="..."/>
      if (!coverHref) {
        const metaMatch = opfXml.match(/<meta\b[^>]*\b(?:name=["']cover["'][^>]*\bcontent=["']([^"']+)["']|content=["']([^"']+)["'][^>]*\bname=["']cover["'])/i);
        const coverId = metaMatch ? (metaMatch[1] || metaMatch[2]) : null;
        if (coverId && items[coverId]) {
          coverHref = items[coverId].href;
          coverMediaType = items[coverId].mediaType;
        }
      }

      // Check 3: item id="cover" or id="cover-image"
      if (!coverHref) {
        for (const [id, item] of Object.entries(items)) {
          if (/^(cover|cover-image|book-cover)$/i.test(id) && item.mediaType && item.mediaType.startsWith('image/')) {
            coverHref = item.href;
            coverMediaType = item.mediaType;
            break;
          }
        }
      }

      // Check 4: item href containing "cover" and media-type is image
      if (!coverHref) {
        for (const [, item] of Object.entries(items)) {
          if (/cover/i.test(item.href) && item.mediaType && item.mediaType.startsWith('image/')) {
            coverHref = item.href;
            coverMediaType = item.mediaType;
            break;
          }
        }
      }
    }

    // Try resolving coverHref if found
    if (coverHref) {
      const decodedCoverHref = decodeURIComponent(coverHref);
      const fullCoverPath = (opfDir + decodedCoverHref).replace(/\\/g, '/');
      const parts: string[] = [];
      for (const part of fullCoverPath.split('/')) {
        if (part === '..') parts.pop();
        else if (part !== '.' && part !== '') parts.push(part);
      }
      const resolvedPath = parts.join('/');

      const file = zip.file(resolvedPath) || zip.file(fullCoverPath) || zip.file(decodedCoverHref);
      if (file) {
        const buffer = await file.async('nodebuffer');
        const ext = resolvedPath.split('.').pop()?.toLowerCase();
        let ct = coverMediaType || 'image/jpeg';
        if (ext === 'png') ct = 'image/png';
        else if (ext === 'webp') ct = 'image/webp';
        else if (ext === 'gif') ct = 'image/gif';
        else if (ext === 'jpg' || ext === 'jpeg') ct = 'image/jpeg';
        return { buffer, contentType: ct };
      }
    }

    // Fallback: look for any image in zip matching cover or first image
    const allFiles = Object.keys(zip.files);
    const coverFileInZip =
      allFiles.find(f => /cover/i.test(f) && /\.(jpe?g|png|webp|gif)$/i.test(f)) ||
      allFiles.find(f => /\.(jpe?g|png|webp|gif)$/i.test(f));

    if (coverFileInZip) {
      const file = zip.file(coverFileInZip);
      if (file) {
        const buffer = await file.async('nodebuffer');
        const ext = coverFileInZip.split('.').pop()?.toLowerCase();
        let ct = 'image/jpeg';
        if (ext === 'png') ct = 'image/png';
        else if (ext === 'webp') ct = 'image/webp';
        else if (ext === 'gif') ct = 'image/gif';
        return { buffer, contentType: ct };
      }
    }

    return null;
  } catch (err) {
    console.error('Error extracting cover from EPUB:', err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'file parameter is required' }, { status: 400 });
  }

  // 1. Check in local light novels directory first
  let filePath = resolveSafeLNPath(file);

  // 2. Fallback to local-books directory
  if (!filePath) {
    const safeFilename = path.basename(file);
    const localBooksPath = path.join(LOCAL_BOOKS_DIR, safeFilename);
    if (fs.existsSync(localBooksPath)) {
      filePath = localBooksPath;
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  if (filePath.endsWith('.epub')) {
    const cover = await extractEpubCover(filePath);
    if (cover) {
      return new Response(new Uint8Array(cover.buffer), {
        status: 200,
        headers: {
          'Content-Type': cover.contentType,
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Resolve against known official light novel artwork before falling back to default
  const normFile = path.basename(file).toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, coverUrl] of Object.entries(KNOWN_LIGHT_NOVEL_COVERS)) {
    if (normFile.includes(key) || key.includes(normFile)) {
      return NextResponse.redirect(coverUrl, 307);
    }
  }

  return NextResponse.redirect(DEFAULT_LIGHT_NOVEL_COVER, 307);
}
