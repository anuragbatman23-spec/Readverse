export interface MangaKatanaChapter {
  id: string; // e.g. "mk-berserk.1087/c1"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface MangaKatanaSeries {
  id: string; // e.g. "berserk.1087"
  url: string;
  title: string;
  coverImage: string;
  description: string;
  genres: string[];
  isManhwa: boolean;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Searches MangaKatana by title
 */
export async function searchMangaKatana(title: string): Promise<MangaKatanaSeries[]> {
  try {
    const cleanTitle = title
      .replace(/[^\w\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanTitle) return [];

    const url = `https://mangakatana.com/?search=${encodeURIComponent(cleanTitle)}&search_by=book_name`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Only extract items inside #book_list! MangaKatana displays unrelated trending manga in #col_right when no results found.
    const startIdx = html.indexOf('id="book_list"');
    if (startIdx === -1) return [];

    const rightColIdx = html.indexOf('id="col_right"', startIdx);
    const bookListHtml = rightColIdx !== -1 ? html.slice(startIdx, rightColIdx) : html.slice(startIdx);

    if (bookListHtml.includes('Not found any results')) {
      return [];
    }

    const blocks = bookListHtml.split('<div class="item');
    const results: MangaKatanaSeries[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      const linkMatch = block.match(/<h3 class="title">[\s\S]*?<a href="https:\/\/mangakatana\.com\/manga\/([^"]+)"[^>]*>([^<]+)<\/a>/);
      const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);
      const descMatch = block.match(/<div class="summary[^"]*">([\s\S]*?)<\/div>/);
      const genreMatches = Array.from(block.matchAll(/<a href="https:\/\/mangakatana\.com\/genre\/[^"]+"[^>]*>([^<]+)<\/a>/g)).map(m => m[1]);

      if (linkMatch) {
        const fullSlug = linkMatch[1]; // e.g. "berserk.1087"
        const titleText = linkMatch[2].trim();
        const coverImage = imgMatch ? imgMatch[1] : '';
        const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const isManhwa =
          genreMatches.some(g => {
            const lg = g.toLowerCase().trim();
            return lg === 'manhwa' || lg === 'webtoon' || lg === 'webtoons' || lg === 'manhua' || lg === 'long strip';
          }) ||
          /unordinary|tower of god|solo leveling|lookism|beginning after the end|eleceed|wind breaker|omniscient|god of highschool|bastard|sweet home|nano machine/i.test(titleText);

        results.push({
          id: fullSlug,
          url: `https://mangakatana.com/manga/${fullSlug}`,
          title: titleText,
          coverImage,
          description,
          genres: genreMatches.slice(0, 3),
          isManhwa
        });
      }
    }

    // Filter results so unrelated titles are never returned
    const queryWords = cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    const filtered = results.filter(r => {
      const rLower = r.title.toLowerCase();
      if (rLower.includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(rLower)) return true;
      if (queryWords.length > 0 && queryWords.every(w => new RegExp('\\b' + w + '\\b', 'i').test(rLower))) return true;
      return false;
    });

    return filtered;
  } catch (err) {
    console.warn('MangaKatana search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters of a series from MangaKatana
 */
export async function getMangaKatanaChapters(seriesSlugOrId: string): Promise<MangaKatanaChapter[]> {
  try {
    const cleanSlug = seriesSlugOrId.replace(/^mk-/, '').replace(/^https:\/\/mangakatana\.com\/manga\//, '');
    const url = `https://mangakatana.com/manga/${cleanSlug}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const tableMatch = html.match(/<div class="chapters">([\s\S]*?)<\/div>\s*<\/div>/);
    if (!tableMatch) return [];

    const chapterMatches = Array.from(
      tableMatch[1].matchAll(/<div class="chapter">\s*<a href="https:\/\/mangakatana\.com\/manga\/([^"]+)"[^>]*>([^<]+)<\/a>/g)
    );

    if (chapterMatches.length === 0) return [];

    // Chapters are sorted latest to oldest, reverse to start from Chapter 1
    const reversed = [...chapterMatches].reverse();

    return reversed.map((m, index) => {
      const chapterPath = m[1]; // e.g. "berserk.1087/c1"
      const title = m[2].trim();
      const chMatch = title.match(/(?:chapter|ch\.?|ep\.?|episode)\s*(\d+(?:\.\d+)?)/i);
      const seasonMatch = title.match(/(?:s\d+|season\s*\d+)\s*[-:]\s*(?:chapter|ch\.?|ep\.?|episode)?\s*(\d+(?:\.\d+)?)/i);
      const leadingMatch = title.match(/^\s*(?:#\s*)?(\d+(?:\.\d+)?)/);
      const firstNumMatch = title.match(/\b(\d+(?:\.\d+)?)\b/);
      const numMatch = chMatch || seasonMatch || leadingMatch || firstNumMatch;
      const chapterNumber = numMatch ? parseFloat(numMatch[1]) : index + 1;

      return {
        id: `mk-${chapterPath}`,
        title: title || `Chapter ${chapterNumber}`,
        chapterNumber,
        content: []
      };
    });
  } catch (err) {
    console.warn('MangaKatana getChapters error:', err);
    return [];
  }
}

/**
 * Fetches pages for a MangaKatana chapter
 */
export async function getMangaKatanaPages(chapterIdOrPath: string): Promise<string[]> {
  try {
    const cleanPath = chapterIdOrPath.replace(/^mk-/, '').replace(/^https:\/\/mangakatana\.com\/manga\//, '');
    const url = `https://mangakatana.com/manga/${cleanPath}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const jsImgs = html.match(/var\s+thzq\s*=\s*\[([\s\S]*?)\];/);
    if (!jsImgs) return [];

    const rawUrls = jsImgs[1]
      .split(',')
      .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(s => s.startsWith('http'));

    // Route through image-proxy to supply the required Referer: https://mangakatana.com/
    return rawUrls.map(u => `/api/manga/image-proxy?url=${encodeURIComponent(u)}`);
  } catch (err) {
    console.warn('MangaKatana getPages error:', err);
    return [];
  }
}
