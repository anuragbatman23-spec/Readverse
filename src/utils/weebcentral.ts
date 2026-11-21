export interface WeebCentralChapter {
  id: string; // e.g. "wc-01J76XZ1BXVF936JYNCR7GFKKQ"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface WeebCentralSeries {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  isManhwa: boolean;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Searches WeebCentral for series matching a title query
 */
export async function searchWeebCentral(query: string): Promise<WeebCentralSeries[]> {
  try {
    const cleanQuery = query
      .replace(/[^\w\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanQuery) return [];

    const url = `https://weebcentral.com/search/data?text=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'HX-Request': 'true'
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const articles = html.split('<article class="bg-base-300');
    const results: WeebCentralSeries[] = [];

    for (let i = 1; i < articles.length; i++) {
      const art = articles[i];
      const match = art.match(/href="https:\/\/weebcentral\.com\/series\/([0-9A-Z]+)\/([^"]+)"/);
      const titleMatch = art.match(/alt="([^"]+)\s+cover"/);
      const imgMatch = art.match(/<source srcset="([^"]+)"/);

      if (match && titleMatch) {
        const id = match[1];
        const slug = match[2];
        const title = titleMatch[1].trim();
        const coverImage = imgMatch ? imgMatch[1] : `https://temp.compsci88.com/cover/normal/${id}.webp`;
        const badgeMatch = art.match(/data-tip="([^"]+)"/i);
        const badgeType = badgeMatch ? badgeMatch[1].trim().toLowerCase() : '';

        // WeebCentral series cards carry explicit badges: Manga, Manhwa, Manhua, OEL
        let isManhwa = false;
        if (badgeType === 'manga') {
          isManhwa = false;
        } else if (['manhwa', 'manhua', 'oel', 'webtoon'].includes(badgeType)) {
          isManhwa = true;
        } else {
          isManhwa = /unordinary|tower of god|solo leveling|lookism|beginning after the end|eleceed|wind breaker|omniscient|god of highschool|bastard|sweet home|nano machine/i.test(title);
        }

        results.push({
          id,
          slug,
          title,
          coverImage,
          isManhwa
        });
      }
    }

    // Filter results so unrelated titles are never returned
    const queryWords = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    const filtered = results.filter(r => {
      const rLower = r.title.toLowerCase();
      if (rLower.includes(cleanQuery.toLowerCase()) || cleanQuery.toLowerCase().includes(rLower)) return true;
      if (queryWords.length > 0 && queryWords.every(w => new RegExp('\\b' + w + '\\b', 'i').test(rLower))) return true;
      return false;
    });

    return filtered;
  } catch (err) {
    console.warn('WeebCentral search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters of a WeebCentral series by its seriesId
 */
export async function getWeebCentralChapters(seriesId: string): Promise<WeebCentralChapter[]> {
  try {
    const cleanSeriesId = seriesId.replace(/^wc-/, '');
    const url = `https://weebcentral.com/series/${cleanSeriesId}/full-chapter-list`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'HX-Request': 'true'
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const rawMatches = Array.from(
      html.matchAll(/href="\/chapters\/([0-9A-Z]+)"[^>]*>[\s\S]*?<span class="">([^<]+)<\/span>/g)
    );

    if (rawMatches.length === 0) return [];

    // rawMatches are ordered newest to oldest, reverse them to get chapter 1 first
    const reversed = [...rawMatches].reverse();

    return reversed.map((m, index) => {
      const chapterId = m[1];
      const title = m[2].trim();
      const chMatch = title.match(/(?:chapter|ch\.?|ep\.?|episode)\s*(\d+(?:\.\d+)?)/i);
      const seasonMatch = title.match(/(?:s\d+|season\s*\d+)\s*[-:]\s*(?:chapter|ch\.?|ep\.?|episode)?\s*(\d+(?:\.\d+)?)/i);
      const leadingMatch = title.match(/^\s*(?:#\s*)?(\d+(?:\.\d+)?)/);
      const firstNumMatch = title.match(/\b(\d+(?:\.\d+)?)\b/);
      const numMatch = chMatch || seasonMatch || leadingMatch || firstNumMatch;
      const chapterNumber = numMatch ? parseFloat(numMatch[1]) : index + 1;

      return {
        id: `wc-${chapterId}`,
        title: title || `Chapter ${chapterNumber}`,
        chapterNumber,
        content: []
      };
    });
  } catch (err) {
    console.warn('WeebCentral getChapters error:', err);
    return [];
  }
}

/**
 * Fetches all page image URLs for a WeebCentral chapter
 */
export async function getWeebCentralPages(chapterId: string): Promise<string[]> {
  try {
    const cleanId = chapterId.replace(/^wc-/, '');
    const url = `https://weebcentral.com/chapters/${cleanId}/images?reading_style=long_strip`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'HX-Request': 'true'
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const matches = Array.from(html.matchAll(/src="(https:\/\/[^"]+)"/g))
      .map(m => m[1])
      .filter(url => !url.endsWith('.js') && !url.endsWith('.css') && !url.includes('tailwindcss') && !url.includes('jsdelivr'));

    // Deduplicate sequential identical images
    const seen = new Set<string>();
    const pages: string[] = [];

    for (const imgUrl of matches) {
      if (!seen.has(imgUrl)) {
        seen.add(imgUrl);
        pages.push(imgUrl);
      }
    }

    return pages;
  } catch (err) {
    console.warn('WeebCentral getPages error:', err);
    return [];
  }
}
