import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import { Book, Chapter } from '@/types';

export interface LocalLNEntry {
  id: string;
  relativePath: string;
  seriesName: string;
  cleanTitle: string;
  volumeNumber: number;
  publisher?: string;
  fileName: string;
  fullPath: string;
}

// In-memory cache singleton
let cachedIndex: LocalLNEntry[] | null = null;
let lastIndexedTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache for parsed EPUB chapters to ensure instant offline reading
const chaptersCache = new Map<string, Chapter[]>();

// Known light novel web/plugin slugs to local series directory aliases
const LN_ALIASES: Record<string, string> = {
  'to-be-a-power-in-the-shadows': 'The Eminence in Shadow',
  'to be a power in the shadows': 'The Eminence in Shadow',
  'the eminence in shadow': 'The Eminence in Shadow',
  'kage-no-jitsuryokusha-ni-naritakute': 'The Eminence in Shadow',
  'mushoku-tensei': 'Mushoku Tensei - Jobless Reincarnation',
  'mushoku tensei': 'Mushoku Tensei - Jobless Reincarnation',
  'mushoku tensei jobless reincarnation': 'Mushoku Tensei - Jobless Reincarnation',
  'classroom-of-the-elite': 'Classroom of the Elite',
  'classroom of the elite': 'Classroom of the Elite',
  'youkoso-jitsuryoku': 'Classroom of the Elite',
  'cote': 'Classroom of the Elite',
  'overlord-light-novel': 'Overlord',
  'overlord': 'Overlord',
  '86': '86--EIGHTY-SIX',
  'eighty six': '86--EIGHTY-SIX',
  'eighty-six': '86--EIGHTY-SIX',
  '86-eighty-six': '86--EIGHTY-SIX',
  're-zero': 'Re-ZERO -Starting Life in Another World-',
  're:zero': 'Re-ZERO -Starting Life in Another World-',
  're zero': 'Re-ZERO -Starting Life in Another World-',
  'slime': 'That Time I Got Reincarnated as a Slime',
  'that time i got reincarnated as a slime': 'That Time I Got Reincarnated as a Slime',
  'tensei-shitara-slime-datta-ken': 'That Time I Got Reincarnated as a Slime',
  'danmachi': 'Is It Wrong to Try to Pick Up Girls in a Dungeon',
  'is it wrong to try to pick up girls in a dungeon': 'Is It Wrong to Try to Pick Up Girls in a Dungeon',
  'sword-art-online': 'Sword Art Online',
  'sword art online': 'Sword Art Online',
  'sao': 'Sword Art Online',
  'konosuba': "KonoSuba - God's Blessing on This Wonderful World!",
  'tanya': 'The Saga of Tanya the Evil',
  'youjo-senki': 'The Saga of Tanya the Evil',
  'alya': 'Alya Sometimes Hides Her Feelings in Russian',
  'alya sometimes hides her feelings in russian': 'Alya Sometimes Hides Her Feelings in Russian',
  'roshidere': 'Alya Sometimes Hides Her Feelings in Russian',
  'spice-and-wolf': 'Spice and Wolf',
  'toradora': 'Toradora',
  'solo-leveling': 'Solo Leveling',
  'solo leveling': 'Solo Leveling',
  'shadow-slave': 'Shadow Slave',
  'lord-of-the-mysteries': 'Lord of the Mysteries'
};

export function getLocalLNDirectory(): string | null {
  if (process.env.LOCAL_LIGHTNOVELS_DIR && fs.existsSync(process.env.LOCAL_LIGHTNOVELS_DIR)) {
    return process.env.LOCAL_LIGHTNOVELS_DIR;
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const defaultDocPath = path.join(home, 'Documents', 'Officially Translated Light Novels');
  if (fs.existsSync(defaultDocPath)) {
    return defaultDocPath;
  }
  const localLnPath = path.join(process.cwd(), 'local-books', 'lightnovels');
  if (fs.existsSync(localLnPath)) {
    return localLnPath;
  }
  const fallbackLocalBooks = path.join(process.cwd(), 'local-books');
  if (fs.existsSync(fallbackLocalBooks)) {
    return fallbackLocalBooks;
  }
  return null;
}

export function resolveSafeLNPath(relativePath: string): string | null {
  const baseDir = getLocalLNDirectory();
  if (!baseDir) return null;

  const resolved = path.resolve(baseDir, relativePath);
  const normalizedBase = path.resolve(baseDir);

  if (resolved !== normalizedBase && !resolved.startsWith(normalizedBase + path.sep)) {
    return null; // traversal attempt
  }

  if (fs.existsSync(resolved)) {
    return resolved;
  }

  // Also check local-books as secondary fallback
  const altBase = path.join(process.cwd(), 'local-books');
  const altResolved = path.resolve(altBase, relativePath);
  if (altResolved.startsWith(path.resolve(altBase)) && fs.existsSync(altResolved)) {
    return altResolved;
  }

  return null;
}

/**
 * Indexes the light novels directory into an in-memory list
 */
export async function getLocalLNIndex(): Promise<LocalLNEntry[]> {
  const now = Date.now();
  if (cachedIndex && now - lastIndexedTime < CACHE_TTL_MS) {
    return cachedIndex;
  }

  const baseDir = getLocalLNDirectory();
  if (!baseDir || !fs.existsSync(baseDir)) {
    return [];
  }

  const entries: LocalLNEntry[] = [];

  try {
    const rootItems = fs.readdirSync(baseDir);

    for (const item of rootItems) {
      if (item.startsWith('.')) continue;
      const fullItemPath = path.join(baseDir, item);

      let stat;
      try {
        stat = fs.statSync(fullItemPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        const seriesName = item;
        let files: string[] = [];
        try {
          files = fs.readdirSync(fullItemPath).filter(f => f.endsWith('.epub') && !f.startsWith('.'));
        } catch {
          continue;
        }

        for (const file of files) {
          const filePath = path.join(fullItemPath, file);
          const relPath = path.join(seriesName, file);
          const clean = file.replace(/\.epub$/i, '').replace(/\s*\[[^\]]+\]/g, '').trim();

          const pubMatch = file.match(
            /\[(Yen Press|Seven Seas|J-Novel Club|VIZ|Cross Infinite World|Vertical|Square Enix|One Peace Books|Kodansha)[^\]]*\]/i
          );
          const publisher = pubMatch ? pubMatch[1] : undefined;

          const volMatch = file.match(/Vol(?:ume)?\s*(\d+(?:\.\d+)?)/i);
          const volumeNumber = volMatch ? parseFloat(volMatch[1]) : 1;

          entries.push({
            id: `local-ln-${encodeURIComponent(relPath)}`,
            relativePath: relPath,
            seriesName,
            cleanTitle: clean || seriesName,
            volumeNumber,
            publisher,
            fileName: file,
            fullPath: filePath
          });
        }
      } else if (stat.isFile() && item.endsWith('.epub')) {
        const clean = item.replace(/\.epub$/i, '').replace(/\s*\[[^\]]+\]/g, '').trim();
        const pubMatch = item.match(
          /\[(Yen Press|Seven Seas|J-Novel Club|VIZ|Cross Infinite World|Vertical|Square Enix|One Peace Books|Kodansha)[^\]]*\]/i
        );
        const publisher = pubMatch ? pubMatch[1] : undefined;
        const volMatch = item.match(/Vol(?:ume)?\s*(\d+(?:\.\d+)?)/i);
        const volumeNumber = volMatch ? parseFloat(volMatch[1]) : 1;

        entries.push({
          id: `local-ln-${encodeURIComponent(item)}`,
          relativePath: item,
          seriesName: clean,
          cleanTitle: clean,
          volumeNumber,
          publisher,
          fileName: item,
          fullPath: fullItemPath
        });
      }
    }

    cachedIndex = entries;
    lastIndexedTime = now;
  } catch (err) {
    console.error('Error indexing local light novels:', err);
  }

  return entries;
}

/**
 * Searches local light novels by title, series, author, or publisher
 */
export async function searchLocalLightNovels(query: string, maxResults = 25): Promise<Book[]> {
  const index = await getLocalLNIndex();
  if (!index || index.length === 0) return [];

  const qTrim = query.trim().toLowerCase();

  // If no query, return Volume 1 of popular curated / alphabetical series
  if (!qTrim) {
    const popularKeys = [
      'overlord',
      '86',
      'mushoku tensei',
      'classroom of the elite',
      'sword art online',
      're zero',
      'danmachi',
      'slime',
      'konosuba',
      'tanya',
      'rascal does not dream'
    ];

    const popularMatches: LocalLNEntry[] = [];
    const seenSeries = new Set<string>();

    for (const key of popularKeys) {
      const match = index.find(
        e => e.seriesName.toLowerCase().includes(key) && e.volumeNumber === 1 && !seenSeries.has(e.seriesName)
      );
      if (match) {
        popularMatches.push(match);
        seenSeries.add(match.seriesName);
      }
    }

    // Fill remaining with other vol 1 entries
    for (const e of index) {
      if (popularMatches.length >= maxResults) break;
      if (e.volumeNumber === 1 && !seenSeries.has(e.seriesName)) {
        popularMatches.push(e);
        seenSeries.add(e.seriesName);
      }
    }

    return popularMatches.map(toBook);
  }

  const cleanQ = qTrim.replace(/[^a-z0-9]+/g, ' ').trim();
  const rawTerms = cleanQ.split(/\s+/).filter(Boolean);
  const terms = rawTerms.filter(w => w.length > 1 || rawTerms.length === 1);

  // Check alias dictionary for known slug translations
  const aliasTarget = LN_ALIASES[qTrim] || LN_ALIASES[cleanQ] || (rawTerms.length > 0 ? LN_ALIASES[rawTerms.join('-')] : undefined);
  const normAlias = aliasTarget ? aliasTarget.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
  const normQ = cleanQ.replace(/[^a-z0-9]/g, '');

  interface ScoredEntry {
    entry: LocalLNEntry;
    score: number;
  }

  const scored: ScoredEntry[] = [];

  for (const entry of index) {
    const sLower = entry.seriesName.toLowerCase();
    const tLower = entry.cleanTitle.toLowerCase();
    const fLower = entry.fileName.toLowerCase();
    const sNorm = sLower.replace(/[^a-z0-9]/g, '');

    // Check alias direct match
    if (normAlias && (sNorm === normAlias || sNorm.includes(normAlias) || normAlias.includes(sNorm))) {
      scored.push({ entry, score: 300 - entry.volumeNumber });
      continue;
    }

    // Exact normalized matches
    if (sNorm === normQ) {
      scored.push({ entry, score: 250 - entry.volumeNumber });
      continue;
    }

    // Count matching search tokens
    let matchedTerms = 0;
    for (const term of terms) {
      if (sLower.includes(term) || tLower.includes(term) || fLower.includes(term)) {
        matchedTerms++;
      }
    }

    if (matchedTerms === 0) continue;

    // Must match at least majority of significant query terms
    const minRequired = terms.length <= 2 ? terms.length : Math.ceil(terms.length * 0.6);
    if (matchedTerms < minRequired && !sNorm.includes(normQ) && !normQ.includes(sNorm)) {
      continue;
    }

    let score = (matchedTerms / terms.length) * 100;

    if (sNorm.includes(normQ) || (normQ.length >= 6 && normQ.includes(sNorm))) score += 80;
    if (matchedTerms === terms.length) score += 60; // All words found!

    // Check volume queries (e.g. "vol 2" or "2")
    const volNumInQuery = qTrim.match(/vol(?:ume)?\s*(\d+)/i);
    if (volNumInQuery) {
      const requestedVol = parseInt(volNumInQuery[1], 10);
      if (entry.volumeNumber === requestedVol) {
        score += 80;
      }
    } else {
      // If user searched series without volume number, boost Vol 1 as starting point
      if (entry.volumeNumber === 1) {
        score += 25;
      }
    }

    // Small bonus for official publisher presence
    if (entry.publisher) score += 5;

    scored.push({ entry, score });
  }

  // Sort by score descending, then volume number ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.volumeNumber - b.entry.volumeNumber;
  });

  return scored.slice(0, maxResults).map(s => toBook(s.entry));
}

/**
 * Finds a matching local light novel entry and parses its chapters (for failover / fallback)
 */
export async function findLocalLightNovel(
  queryOrPath: string,
  altTitle?: string,
  altId?: string
): Promise<{ book: Book; chapters: Chapter[] } | null> {
  const index = await getLocalLNIndex();
  if (!index || index.length === 0) return null;

  const candidates = [queryOrPath, altTitle, altId]
    .filter((s): s is string => Boolean(s && typeof s === 'string' && s.trim().length > 0));

  let match: LocalLNEntry | undefined;

  for (const candidate of candidates) {
    const cleanKey = candidate.replace(/^local-ln-/, '').replace(/^ln-[^:]+:/, '').trim();
    const decoded = decodeURIComponent(cleanKey);

    // 1. Direct path / ID / filename match
    match = index.find(e => e.relativePath === decoded || e.id === candidate || e.fileName === decoded || e.seriesName === decoded);
    if (match) break;

    // 2. Check alias dictionary
    const normKey = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const alias = LN_ALIASES[normKey] || LN_ALIASES[decoded.toLowerCase()];
    if (alias) {
      match = index.find(e => e.seriesName.toLowerCase() === alias.toLowerCase() && e.volumeNumber === 1) ||
              index.find(e => e.seriesName.toLowerCase().includes(alias.toLowerCase()));
      if (match) break;
    }

    // 3. Normalized fuzzy search
    const results = await searchLocalLightNovels(decoded, 1);
    if (results.length > 0) {
      const foundId = results[0].id;
      match = index.find(e => e.id === foundId);
      if (match) break;
    }
  }

  if (match) {
    try {
      const chapters = await parseLocalLNEpubChapters(match.fullPath);
      const book = toBook(match);
      // If the caller requested an altId (e.g. from catalog/spotlight), preserve it for router consistency
      if (altId && !altId.startsWith('local-ln-')) {
        book.id = altId;
      }
      book.chapters = chapters;
      return { book, chapters };
    } catch (err) {
      console.warn('Failed to parse local fallback light novel:', err);
    }
  }

  return null;
}

function toBook(entry: LocalLNEntry): Book {
  const publisherTag = entry.publisher ? `[${entry.publisher}]` : '';
  return {
    id: entry.id,
    title: entry.cleanTitle,
    author: entry.publisher ? `${entry.seriesName} (${entry.publisher})` : entry.seriesName,
    category: 'lightnovel',
    coverImage: `/api/books/local/cover?file=${encodeURIComponent(entry.relativePath)}`,
    description: `Official translation of ${entry.seriesName} ${publisherTag}. Stored locally on server with complete offline chapters and reading rewards.`,
    genre: ['Light Novel', 'Official Translation', 'Local EPUB', ...(entry.publisher ? [entry.publisher] : [])],
    rating: 4.95,
    pointsPerChapter: 2.0,
    wordCountPerPoint: 1200,
    chapters: []
  };
}

/**
 * Parses all chapters from a local light novel EPUB file
 */
export async function parseLocalLNEpubChapters(filePath: string): Promise<Chapter[]> {
  if (chaptersCache.has(filePath)) {
    return chaptersCache.get(filePath)!;
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

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

  // Extract Manifest Items
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

  // Extract Spine Order
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

    // Look for high-specificity chapter title first (e.g. h1.chapter-title, .chapter-title, or first h1/h2)
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

    const chapterDir = fullHref.includes('/') ? fullHref.slice(0, fullHref.lastIndexOf('/') + 1) : '';
    const contentBlocks: string[] = [];

    // Traverse body elements in document order
    $('body').find('h1, h2, h3, h4, h5, h6, p, hr, img, image, div.image_full, blockquote').each((_, el) => {
      const tag = el.tagName.toLowerCase();

      // Images / Illustrations
      if (tag === 'img' || tag === 'image') {
        const rawSrc = $(el).attr('src') || $(el).attr('xlink:href') || $(el).attr('href');
        if (rawSrc) {
          const zipImgPath = path.posix.normalize(path.posix.join(chapterDir, rawSrc)).replace(/^\/+/, '');
          if (!/spacer|pixel|blank|art_sborn|art_star/i.test(zipImgPath)) {
            const imgUrl = `/api/books/local/image?filePath=${encodeURIComponent(filePath)}&src=${encodeURIComponent(zipImgPath)}`;
            contentBlocks.push(`[image: ${imgUrl}]`);
          } else {
            // Ornamental divider image
            if (contentBlocks.length > 0 && contentBlocks[contentBlocks.length - 1] !== '---') {
              contentBlocks.push('---');
            }
          }
        }
        return;
      }

      // Horizontal / Scene rule
      if (tag === 'hr') {
        if (contentBlocks.length > 0 && contentBlocks[contentBlocks.length - 1] !== '---') {
          contentBlocks.push('---');
        }
        return;
      }

      // Section Subheadings
      if (tag.startsWith('h')) {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 0 && text !== headingTitle && !/table of contents|contents|copyright|cover/i.test(text)) {
          contentBlocks.push(`### ${text}`);
        }
        return;
      }

      // Paragraphs & Blockquotes
      if (tag === 'p' || tag === 'blockquote') {
        // Check for inline images
        const nestedImg = $(el).find('img, image');
        if (nestedImg.length > 0) {
          const rawSrc = nestedImg.attr('src') || nestedImg.attr('xlink:href') || nestedImg.attr('href');
          if (rawSrc) {
            const zipImgPath = path.posix.normalize(path.posix.join(chapterDir, rawSrc)).replace(/^\/+/, '');
            if (!/spacer|pixel|blank|art_sborn|art_star/i.test(zipImgPath)) {
              const imgUrl = `/api/books/local/image?filePath=${encodeURIComponent(filePath)}&src=${encodeURIComponent(zipImgPath)}`;
              contentBlocks.push(`[image: ${imgUrl}]`);
              return;
            } else {
              if (contentBlocks.length > 0 && contentBlocks[contentBlocks.length - 1] !== '---') {
                contentBlocks.push('---');
              }
              return;
            }
          }
        }

        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (!text) return;

        // Scene dividers
        if (/^(\*|\-|_|•|◆|♦|✦|\~|\#){3,}$/i.test(text) || text === '* * *' || text === '***' || $(el).hasClass('orn') || $(el).hasClass('space-break')) {
          if (contentBlocks.length > 0 && contentBlocks[contentBlocks.length - 1] !== '---') {
            contentBlocks.push('---');
          }
          return;
        }

        // Standalone section numbers ("1", "Part 1", "Act I")
        if (/^(?:[0-9]{1,3}|[IVXLCDM]{1,6}|Part\s+[0-9IVX]+|Act\s+[0-9IVX]+|Section\s+[0-9]+)$/i.test(text)) {
          contentBlocks.push(`### ${text}`);
          return;
        }

        contentBlocks.push(text);
      }
    });

    // Fallback if no specific tags matched
    if (contentBlocks.length === 0) {
      $('p, div').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 15) {
          contentBlocks.push(text);
        }
      });
    }

    const hasIllustrations = contentBlocks.some(b => b.startsWith('[image: '));
    const textBlocks = contentBlocks.filter(b => !b.startsWith('[image: ') && !b.startsWith('###') && b !== '---');
    const wordCount = textBlocks.reduce((acc, p) => acc + p.split(/\s+/).length, 0);

    // Keep if it has illustrations, or sufficient narrative text
    if (hasIllustrations || wordCount > 25 || contentBlocks.length >= 2) {
      // Clean up multiple consecutive dividers
      const cleanedBlocks: string[] = [];
      for (const b of contentBlocks) {
        if (b === '---' && cleanedBlocks[cleanedBlocks.length - 1] === '---') continue;
        cleanedBlocks.push(b);
      }

      let resolvedTitle = headingTitle;
      if (hasIllustrations && textBlocks.length === 0) {
        resolvedTitle = `Illustration Plate ${chapterIdx}`;
      } else if (!resolvedTitle) {
        resolvedTitle = `Chapter ${chapterIdx}`;
      }

      chapters.push({
        id: `ln-ch-${chapterIdx}`,
        title: resolvedTitle,
        chapterNumber: chapterIdx,
        wordCount: wordCount || (hasIllustrations ? 300 : 1200),
        content: cleanedBlocks
      });
      chapterIdx++;
    }
  }

  chaptersCache.set(filePath, chapters);
  return chapters;
}
