import JSZip from 'jszip';
import { Book, Chapter } from '../types';

export async function parseEpubFile(file: File): Promise<Book> {
  const zip = await JSZip.loadAsync(file);

  // 1. Locate container.xml to find the root OPF file
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: META-INF/container.xml not found.');
  }

  const containerXml = await containerFile.async('text');
  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: ${opfPath} not found.`);
  }

  const opfXml = await opfFile.async('text');
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  // Extract Metadata
  const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const title = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.epub$/i, '');

  const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown Author';

  // Extract Manifest Items
  const manifestItems: Record<string, string> = {};
  const manifestRegex = /<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = manifestRegex.exec(opfXml)) !== null) {
    manifestItems[match[1]] = match[2];
  }

  // Extract Spine Order
  const spineIds: string[] = [];
  const spineRegex = /<itemref[^>]+idref="([^"]+)"[^>]*>/gi;
  while ((match = spineRegex.exec(opfXml)) !== null) {
    spineIds.push(match[1]);
  }

  // Parse HTML/XHTML chapters
  const chapters: Chapter[] = [];
  let chapterIndex = 1;

  for (const id of spineIds) {
    const relativeHref = manifestItems[id];
    if (!relativeHref) continue;

    const fullHref = opfDir + relativeHref;
    const chapterFile = zip.file(fullHref) || zip.file(relativeHref);
    if (!chapterFile) continue;

    const htmlContent = await chapterFile.async('text');

    // Parse HTML into text paragraphs
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Remove script, style, and navigation elements
    doc.querySelectorAll('script, style, nav').forEach(el => el.remove());

    const paragraphs: string[] = [];
    const elements = doc.querySelectorAll('p, h1, h2, h3, blockquote');

    elements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 5) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length > 0) {
      // Calculate word count
      const totalWords = paragraphs.reduce(
        (acc, p) => acc + p.split(/\s+/).filter(w => w.length > 0).length,
        0
      );

      // Chapter title extraction
      const heading = doc.querySelector('h1, h2, h3')?.textContent?.trim();
      const chapterTitle = heading && heading.length < 60
        ? heading
        : `Chapter ${chapterIndex}`;

      chapters.push({
        id: `local-ch-${chapterIndex}`,
        title: chapterTitle,
        chapterNumber: chapterIndex,
        wordCount: totalWords,
        content: paragraphs
      });

      chapterIndex++;
    }
  }

  // If no spine chapters detected, fall back to simple text extraction
  if (chapters.length === 0) {
    chapters.push({
      id: 'local-ch-1',
      title: 'Chapter 1: Full Document',
      chapterNumber: 1,
      wordCount: 1500,
      content: ['Loaded custom EPUB file. Begin reading to track your time and earn points.']
    });
  }

  // Extract Cover Image if available
  let coverImage = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg';
  try {
    let coverHref: string | null = null;
    let coverMediaType: string | null = null;

    // 1. Check item with properties="cover-image"
    const propCoverMatch = opfXml.match(/<item\b[^>]+properties=["'][^"']*cover-image[^"']*["'][^>]*>/i);
    if (propCoverMatch) {
      const hrefMatch = propCoverMatch[0].match(/href=["']([^"']+)["']/i);
      const mediaMatch = propCoverMatch[0].match(/media-type=["']([^"']+)["']/i);
      if (hrefMatch) {
        coverHref = hrefMatch[1];
        coverMediaType = mediaMatch ? mediaMatch[1] : null;
      }
    }

    // 2. Check meta name="cover"
    if (!coverHref) {
      const metaMatch = opfXml.match(/<meta\b[^>]*\b(?:name=["']cover["'][^>]*\bcontent=["']([^"']+)["']|content=["']([^"']+)["'][^>]*\bname=["']cover["'])/i);
      const coverId = metaMatch ? (metaMatch[1] || metaMatch[2]) : null;
      if (coverId && manifestItems[coverId]) {
        coverHref = manifestItems[coverId];
      }
    }

    // 3. Check item id="cover" or id="cover-image"
    if (!coverHref) {
      const coverId = Object.keys(manifestItems).find(id => /^(cover|cover-image|book-cover)$/i.test(id));
      if (coverId) {
        coverHref = manifestItems[coverId];
      }
    }

    // 4. Check manifest item with href containing "cover" and an image extension
    if (!coverHref) {
      const coverId = Object.keys(manifestItems).find(id => {
        const href = manifestItems[id];
        return /cover/i.test(href) && /\.(jpe?g|png|webp|gif)$/i.test(href);
      });
      if (coverId) {
        coverHref = manifestItems[coverId];
      }
    }

    if (coverHref) {
      const decodedCoverHref = decodeURIComponent(coverHref);
      const fullCoverPath = (opfDir + decodedCoverHref).replace(/\\/g, '/');
      const parts: string[] = [];
      for (const part of fullCoverPath.split('/')) {
        if (part === '..') parts.pop();
        else if (part !== '.' && part !== '') parts.push(part);
      }
      const resolvedPath = parts.join('/');

      const fileInZip = zip.file(resolvedPath) || zip.file(fullCoverPath) || zip.file(decodedCoverHref);
      if (fileInZip) {
        const b64 = await fileInZip.async('base64');
        const ext = resolvedPath.split('.').pop()?.toLowerCase();
        let mime = coverMediaType || 'image/jpeg';
        if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'gif') mime = 'image/gif';
        coverImage = `data:${mime};base64,${b64}`;
      }
    }

    // 5. Fallback: check zip files for any file matching cover
    if (coverImage.startsWith('http')) {
      const allFiles = Object.keys(zip.files);
      const coverFileInZip =
        allFiles.find(f => /cover/i.test(f) && /\.(jpe?g|png|webp|gif)$/i.test(f)) ||
        allFiles.find(f => /\.(jpe?g|png|webp|gif)$/i.test(f));

      if (coverFileInZip) {
        const fileInZip = zip.file(coverFileInZip);
        if (fileInZip) {
          const b64 = await fileInZip.async('base64');
          const ext = coverFileInZip.split('.').pop()?.toLowerCase();
          let mime = 'image/jpeg';
          if (ext === 'png') mime = 'image/png';
          else if (ext === 'webp') mime = 'image/webp';
          coverImage = `data:${mime};base64,${b64}`;
        }
      }
    }
  } catch (err) {
    console.warn('Could not extract cover image from client EPUB:', err);
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const canonicalId = `local-file-${encodeURIComponent(safeFilename)}`;

  return {
    id: canonicalId,
    title,
    author,
    category: 'book',
    coverImage,
    description: `Locally parsed EPUB document with ${chapters.length} chapters. Safe client-side reading with full rewards tracking.`,
    genre: ['EPUB', 'Custom Book', 'Offline'],
    rating: 5.0,
    pointsPerChapter: 2.0,
    chapters
  };
}

export async function parseEpubFromUrl(url: string): Promise<Book> {
  const res = await fetch('/api/books/fetch-epub', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to download EPUB from the specified URL.');
  }

  const blob = await res.blob();
  const filename = url.split('/').pop()?.split('?')[0] || 'remote_book.epub';
  const file = new File([blob], filename, { type: 'application/epub+zip' });

  return parseEpubFile(file);
}
