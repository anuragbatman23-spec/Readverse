import JSZip from 'jszip';
import { Book, Chapter } from '../types';

function resolveZipFile(zip: JSZip, opfDir: string, relHref: string) {
  const cleanRel = decodeURIComponent(relHref).replace(/\\/g, '/');
  const fullRaw = (opfDir + cleanRel).replace(/\\/g, '/');
  const segments: string[] = [];
  for (const seg of fullRaw.split('/')) {
    if (seg === '..') segments.pop();
    else if (seg !== '.' && seg !== '') segments.push(seg);
  }
  const normalized = segments.join('/');

  return (
    zip.file(normalized) ||
    zip.file(fullRaw) ||
    zip.file(cleanRel) ||
    zip.file(relHref) ||
    zip.file(opfDir + relHref) ||
    zip.file(decodeURIComponent(relHref))
  );
}

function extractChapterContent(htmlContent: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Strip non-content nodes
  doc.querySelectorAll('script, style, nav, noscript, svg').forEach(el => el.remove());

  // Find candidate chapter title
  let chapterTitle = '';
  const specificHeader = doc.querySelector(
    '.chapter-title, [class*="chapter-title"], [class*="chapter_title"], h1, h2, h3, title'
  );
  if (specificHeader && specificHeader.textContent) {
    const clean = specificHeader.textContent.replace(/\s+/g, ' ').trim();
    if (clean.length > 1 && clean.length < 100 && !/table of contents|contents|copyright/i.test(clean)) {
      chapterTitle = clean;
    }
  }

  // Extract structured paragraphs
  const paragraphs: string[] = [];
  const blockElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, hr, li');

  blockElements.forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'hr') {
      if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] !== '---') {
        paragraphs.push('---');
      }
      return;
    }
    if (tag.startsWith('h')) {
      const text = el.textContent?.replace(/\s+/g, ' ').trim();
      if (text && text.length > 0 && text !== chapterTitle && !/table of contents|contents|copyright/i.test(text)) {
        paragraphs.push(`### ${text}`);
      }
      return;
    }
    const text = el.textContent?.replace(/\s+/g, ' ').trim();
    if (text && text.length > 0) {
      paragraphs.push(text);
    }
  });

  // Fallback: if standard block elements produced no text, check div and section tags
  if (paragraphs.length === 0) {
    const divs = doc.querySelectorAll('div, section');
    divs.forEach(div => {
      if (div.querySelector('p, div, section')) return;
      const text = div.textContent?.replace(/\s+/g, ' ').trim();
      if (text && text.length > 0) {
        paragraphs.push(text);
      }
    });
  }

  // Deep fallback: raw text split by lines
  if (paragraphs.length === 0 && doc.body && doc.body.textContent) {
    const rawLines = doc.body.textContent.split(/\n+/);
    for (const line of rawLines) {
      const t = line.replace(/\s+/g, ' ').trim();
      if (t.length > 0) {
        paragraphs.push(t);
      }
    }
  }

  return { chapterTitle, paragraphs };
}

export async function parseEpubFile(file: File): Promise<Book> {
  const zip = await JSZip.loadAsync(file);

  // 1. Locate container.xml to find the root OPF file
  const containerFile = zip.file('META-INF/container.xml') || zip.file('meta-inf/container.xml');
  let opfPath = 'OEBPS/content.opf';
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const opfPathMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (opfPathMatch) opfPath = opfPathMatch[1];
  }

  // Find OPF file or fallback to any .opf file in the zip
  let opfFile = zip.file(opfPath) || zip.file(decodeURIComponent(opfPath));
  if (!opfFile) {
    const allFiles = Object.keys(zip.files);
    const candidateOpf = allFiles.find(f => f.toLowerCase().endsWith('.opf'));
    if (candidateOpf) {
      opfPath = candidateOpf;
      opfFile = zip.file(candidateOpf);
    }
  }

  if (!opfFile) {
    throw new Error(`Invalid EPUB: content.opf file not found.`);
  }

  const opfXml = await opfFile.async('text');
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  // Extract Metadata (robust to arbitrary namespaces like dc:title, opf:title, etc.)
  const titleMatch = opfXml.match(/<(?:[a-zA-Z0-9_-]+:)?title[^>]*>([^<]+)<\/(?:[a-zA-Z0-9_-]+:)?title>/i);
  const title = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.epub$/i, '').replace(/_/g, ' ');

  const authorMatch = opfXml.match(/<(?:[a-zA-Z0-9_-]+:)?creator[^>]*>([^<]+)<\/(?:[a-zA-Z0-9_-]+:)?creator>/i);
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown Author';

  // Extract Manifest Items regardless of attribute ordering or quotes
  const manifestItems: Record<string, { href: string; mediaType?: string }> = {};
  const itemRegex = /<item\b([^>]+)>/gi;
  let match;
  while ((match = itemRegex.exec(opfXml)) !== null) {
    const attrs = match[1];
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    const mediaMatch = attrs.match(/\bmedia-type=["']([^"']+)["']/i);
    if (idMatch && hrefMatch) {
      manifestItems[idMatch[1]] = {
        href: hrefMatch[1],
        mediaType: mediaMatch ? mediaMatch[1] : undefined
      };
    }
  }

  // Extract Spine Order
  const spineIds: string[] = [];
  const spineRegex = /<itemref\b[^>]*\bidref=["']([^"']+)["']/gi;
  while ((match = spineRegex.exec(opfXml)) !== null) {
    spineIds.push(match[1]);
  }

  // Parse HTML/XHTML chapters
  const chapters: Chapter[] = [];
  let chapterIndex = 1;

  for (const id of spineIds) {
    const item = manifestItems[id];
    if (!item?.href) continue;

    const chapterFile = resolveZipFile(zip, opfDir, item.href);
    if (!chapterFile) continue;

    const htmlContent = await chapterFile.async('text');
    const { chapterTitle, paragraphs } = extractChapterContent(htmlContent);

    if (paragraphs.length > 0) {
      const totalWords = paragraphs.reduce(
        (acc, p) => acc + p.split(/\s+/).filter(w => w.length > 0).length,
        0
      );

      chapters.push({
        id: `local-ch-${chapterIndex}`,
        title: chapterTitle || `Chapter ${chapterIndex}`,
        chapterNumber: chapterIndex,
        wordCount: totalWords,
        content: paragraphs
      });

      chapterIndex++;
    }
  }

  // If spine extraction produced no chapters, search zip for any HTML/XHTML files
  if (chapters.length === 0) {
    const htmlFiles = Object.keys(zip.files)
      .filter(f => /\.(x?html|htm)$/i.test(f) && !/toc|nav/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const f of htmlFiles) {
      const fileInZip = zip.file(f);
      if (!fileInZip) continue;

      const htmlContent = await fileInZip.async('text');
      const { chapterTitle, paragraphs } = extractChapterContent(htmlContent);

      if (paragraphs.length > 0) {
        const totalWords = paragraphs.reduce(
          (acc, p) => acc + p.split(/\s+/).filter(w => w.length > 0).length,
          0
        );

        chapters.push({
          id: `local-ch-${chapterIndex}`,
          title: chapterTitle || `Chapter ${chapterIndex}`,
          chapterNumber: chapterIndex,
          wordCount: totalWords,
          content: paragraphs
        });

        chapterIndex++;
      }
    }
  }

  // Extract Cover Image if available
  let coverImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
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
      const metaMatch = opfXml.match(
        /<meta\b[^>]*\b(?:name=["']cover["'][^>]*\bcontent=["']([^"']+)["']|content=["']([^"']+)["'][^>]*\bname=["']cover["'])/i
      );
      const coverId = metaMatch ? metaMatch[1] || metaMatch[2] : null;
      if (coverId && manifestItems[coverId]) {
        coverHref = manifestItems[coverId].href;
      }
    }

    // 3. Check item id="cover" or id="cover-image"
    if (!coverHref) {
      const coverId = Object.keys(manifestItems).find(id => /^(cover|cover-image|book-cover)$/i.test(id));
      if (coverId) {
        coverHref = manifestItems[coverId].href;
      }
    }

    // 4. Check manifest item with href containing "cover" and an image extension
    if (!coverHref) {
      const coverId = Object.keys(manifestItems).find(id => {
        const href = manifestItems[id].href;
        return /cover/i.test(href) && /\.(jpe?g|png|webp|gif)$/i.test(href);
      });
      if (coverId) {
        coverHref = manifestItems[coverId].href;
      }
    }

    if (coverHref) {
      const fileInZip = resolveZipFile(zip, opfDir, coverHref);
      if (fileInZip) {
        const b64 = await fileInZip.async('base64');
        const ext = coverHref.split('.').pop()?.toLowerCase();
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
