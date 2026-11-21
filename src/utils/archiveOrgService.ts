import archiveCatalog from '@/data/archiveCatalog.json';
import { Book, Chapter } from '@/types';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import path from 'path';

export interface ArchiveEpubEntry {
  path: string;
  size: number;
}

const ARCHIVE_ITEM_ID = 'offtllnls';
const ARCHIVE_BASE_DOWNLOAD_URL = `https://archive.org/download/${ARCHIVE_ITEM_ID}`;

// In-memory cache for parsed chapters from Archive.org
const archiveChaptersCache = new Map<string, { timestamp: number; chapters: Chapter[] }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cleanTitle(rawPath: string): { series: string; title: string; volumeNumber?: number } {
  const fileName = rawPath.split('/').pop() || rawPath;
  const withoutExt = fileName.replace(/\.epub$/i, '');
  
  // Clean release tags like [Yen Press][Kobo][1r0n]
  const clean = withoutExt
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Try extracting series name from folder or title
  const parts = rawPath.split('/');
  const series = parts.length > 1 ? parts[0].trim() : clean;

  const volMatch = clean.match(/(?:vol(?:ume)?|v)\.?\s*(\d+)/i);
  const volumeNumber = volMatch ? parseInt(volMatch[1], 10) : undefined;

  return { series, title: clean, volumeNumber };
}

// Generate cover art URL based on series name
function getCoverForSeries(series: string): string {
  const norm = series.toLowerCase();
  if (norm.includes('overlord')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85061-vR7UfA02a5U1.jpg';
  if (norm.includes('solo leveling')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg';
  if (norm.includes('slime') || norm.includes('tensei')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86358-18e3q3X3p3.jpg';
  if (norm.includes('re:zero') || norm.includes('re-zero')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85737-XhL3aL94yB2c.jpg';
  if (norm.includes('classroom of the elite')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86470-s4vF8r4N2o6r.jpg';
  if (norm.includes('mushoku')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85547-M5g1Q77X133k.jpg';
  if (norm.includes('86') || norm.includes('eighty-six')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101752-h5b0G56H1N.jpg';
  if (norm.includes('sword art online') || norm.includes('sao')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31092-2Z0mZf3Zp3.jpg';
  if (norm.includes('bookworm') || norm.includes('honzuki')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86506-69x3p5Q7vN.jpg';
  if (norm.includes('danmachi') || norm.includes('pick up girls')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85161-0L08sO2R2P3.jpg';
  if (norm.includes('eminence in shadow') || norm.includes('kage no jitsuryokusha')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106758-a8d0F5N8q.jpg';
  if (norm.includes('konosuba')) return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86238-X8g1P77N3.jpg';
  
  // High aesthetic fallback cover
  return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
}

export async function searchArchiveLightNovels(query: string, limit: number = 30): Promise<Book[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const catalog = archiveCatalog as ArchiveEpubEntry[];
  const matches: ArchiveEpubEntry[] = [];

  for (const item of catalog) {
    if (item.path.toLowerCase().includes(q)) {
      matches.push(item);
      if (matches.length >= limit) break;
    }
  }

  return matches.map((item) => {
    const { series, title } = cleanTitle(item.path);
    return {
      id: `archive-ln-${encodeURIComponent(item.path)}`,
      title,
      author: series,
      category: 'lightnovel',
      coverImage: getCoverForSeries(series),
      description: `Official English Translated Light Novel preserved on Archive.org. Unabridged high quality edition.`,
      genre: ['Light Novel', 'Official Translation', 'Fantasy'],
      rating: 4.95,
      pointsPerChapter: 10,
      chapters: []
    };
  });
}

export function getArchiveDownloadUrl(relativePath: string): string {
  // Properly URL-encode every path segment
  const encodedSegments = relativePath.split('/').map(encodeURIComponent).join('/');
  return `${ARCHIVE_BASE_DOWNLOAD_URL}/${encodedSegments}`;
}

export async function parseArchiveEpubChapters(relativePath: string): Promise<Chapter[]> {
  const cached = archiveChaptersCache.get(relativePath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.chapters;
  }

  const downloadUrl = getArchiveDownloadUrl(relativePath);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for Archive.org streaming

  const res = await fetch(downloadUrl, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse-Reader/2.0',
      'Accept': 'application/epub+zip,application/octet-stream,*/*'
    }
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Failed to download from Archive.org (${res.status}): ${downloadUrl}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml
  const containerFile = zip.file('META-INF/container.xml');
  let opfPath = 'OEBPS/content.opf';
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const match = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (match) opfPath = match[1];
  }

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error('Invalid EPUB: content.opf not found');
  }

  const opfXml = await opfFile.async('text');
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Extract Manifest Items
  const manifestItems: Record<string, string> = {};
  const manifestRegex = /<item\b([^>]+)>/gi;
  let match;
  while ((match = manifestRegex.exec(opfXml)) !== null) {
    const attrs = match[1];
    const id = (attrs.match(/\bid=["']([^"']+)["']/i) || [])[1];
    const href = (attrs.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (id && href) {
      manifestItems[id] = href;
    }
  }

  // 3. Extract Spine
  const spineIds: string[] = [];
  const spineRegex = /<itemref[^>]+idref=["']([^"']+)["']/gi;
  while ((match = spineRegex.exec(opfXml)) !== null) {
    spineIds.push(match[1]);
  }

  const chapters: Chapter[] = [];
  let chapterIdx = 1;

  for (const id of spineIds) {
    const relativeHref = manifestItems[id];
    if (!relativeHref) continue;

    const fullHref = (opfDir + relativeHref).replace(/\\/g, '/');
    const chapterFile = zip.file(fullHref) || zip.file(relativeHref) || zip.file(decodeURIComponent(fullHref));
    if (!chapterFile) continue;

    const html = await chapterFile.async('text');
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();

    let headingTitle = '';
    const specificHeader = $('.chapter-title, [class*="chapter-title"], [class*="chapter_title"]').first();
    if (specificHeader.length) {
      const cleanH = specificHeader.text().replace(/\s+/g, ' ').trim();
      if (cleanH.length > 2 && cleanH.length < 120) {
        headingTitle = cleanH;
      }
    }

    if (!headingTitle) {
      const headerCandidates = $('h1, h2, h3, title');
      headerCandidates.each((_, el) => {
        if (headingTitle) return;
        const txt = $(el).text().replace(/\s+/g, ' ').trim();
        if (txt.length > 2 && txt.length < 100 && !/table of contents|contents|copyright|cover|^$|license|newsletter/i.test(txt)) {
          headingTitle = txt;
        }
      });
    }

    const contentBlocks: string[] = [];
    $('body').find('h1, h2, h3, h4, h5, h6, p, hr, blockquote').each((_, el) => {
      const tag = el.tagName.toLowerCase();

      if (tag === 'hr') {
        if (contentBlocks.length > 0 && contentBlocks[contentBlocks.length - 1] !== '---') {
          contentBlocks.push('---');
        }
        return;
      }

      if (tag.startsWith('h')) {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 0 && text !== headingTitle && !/table of contents|contents|copyright|cover/i.test(text)) {
          contentBlocks.push(`### ${text}`);
        }
        return;
      }

      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 0) {
        contentBlocks.push(text);
      }
    });

    if (contentBlocks.length > 0) {
      const title = headingTitle || `Chapter ${chapterIdx}`;
      const wordCount = contentBlocks.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);

      chapters.push({
        id: `arch-${encodeURIComponent(relativePath)}-ch-${chapterIdx}`,
        title,
        chapterNumber: chapterIdx,
        wordCount,
        content: contentBlocks
      });
      chapterIdx++;
    }
  }

  archiveChaptersCache.set(relativePath, { timestamp: Date.now(), chapters });
  return chapters;
}
