export interface MangaPillChapter {
  id: string; // e.g. "mp-4080-10001000/sono-bisque-doll-wa-koi-wo-suru-chapter-1"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface MangaPillSearchResult {
  id: string; // e.g. "mp-2/one-piece"
  mangaPath: string; // e.g. "2/one-piece"
  title: string;
  coverImage: string;
  isManhwa: boolean;
}

export async function searchMangaPillDetailed(title: string): Promise<MangaPillSearchResult[]> {
  try {
    const cleanTitle = title
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanTitle) return [];

    const searchUrl = `https://mangapill.com/search?q=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const cardRegex =
      /<a[^>]*href="\/manga\/([0-9]+\/([^"]+))"[^>]*>[\s\S]*?<img[^>]*data-src="([^"]+)"[^>]*alt="([^"]+)"/g;
    const matches = Array.from(html.matchAll(cardRegex));
    const results: MangaPillSearchResult[] = [];
    const seen = new Set<string>();

    for (const m of matches) {
      const mangaPath = m[1];
      const slug = m[2];
      const cover = m[3];
      let rawTitle = m[4].trim();
      const halfLen = Math.floor(rawTitle.length / 2);
      if (rawTitle.length >= 6 && rawTitle.slice(0, halfLen).trim() === rawTitle.slice(halfLen).trim()) {
        rawTitle = rawTitle.slice(0, halfLen).trim();
      }

      if (seen.has(mangaPath)) continue;
      seen.add(mangaPath);

      const isManhwa =
        /manhwa|webtoon|solo|tower|leveling|reincarnation|system/i.test(slug) ||
        /manhwa|webtoon/i.test(rawTitle);

      results.push({
        id: `mp-${mangaPath}`,
        mangaPath,
        title: rawTitle,
        coverImage: cover,
        isManhwa
      });
    }

    return results;
  } catch (err) {
    console.warn('MangaPill detailed search failed:', err);
    return [];
  }
}

export async function searchMangaPill(title: string): Promise<string | null> {
  try {
    // Clean up title for search (remove punctuation / extra words)
    const cleanTitle = title
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const searchUrl = `https://mangapill.com/search?q=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return null;

    const html = await res.text();
    const matches = Array.from(html.matchAll(/href="\/manga\/([0-9]+\/([^"]+))"/g));
    if (matches.length === 0) return null;

    const queryWords = cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length >= 2);

    // Only accept result if the manga slug contains all significant search query keywords
    for (const match of matches) {
      const path = match[1];
      const slug = match[2].toLowerCase();

      if (queryWords.every(w => slug.includes(w))) {
        return path;
      }
    }

    return null;
  } catch (err) {
    console.warn('MangaPill search failed:', err);
    return null;
  }
}

export async function getMangaPillChapters(mangaPath: string): Promise<MangaPillChapter[]> {
  try {
    const mangaUrl = `https://mangapill.com/manga/${mangaPath}`;
    const res = await fetch(mangaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const chapterMatches = Array.from(
      html.matchAll(/href="\/chapters\/([0-9]+-[^"]+)"[^>]*title="([^"]*)"/g)
    );

    if (chapterMatches.length === 0) return [];

    // MangaPill lists latest chapters first, so reverse to ascending
    const reversed = [...chapterMatches].reverse();

    return reversed.map((match, idx) => {
      const slug = match[1];
      const rawTitle = match[2]?.trim() || `Chapter ${idx + 1}`;
      
      // Extract chapter number
      const numMatch = slug.match(/chapter-([0-9.]+)/i);
      const chNum = numMatch ? parseFloat(numMatch[1]) : idx + 1;

      return {
        id: `mp-${slug}`,
        title: rawTitle.startsWith('Chapter') ? rawTitle : `Chapter ${chNum}`,
        chapterNumber: chNum,
        content: []
      };
    });
  } catch (err) {
    console.warn('MangaPill get chapters failed:', err);
    return [];
  }
}

export async function getMangaPillPages(chapterSlug: string): Promise<string[]> {
  try {
    const cleanSlug = chapterSlug.replace(/^mp-/, '');
    const chapterUrl = `https://mangapill.com/chapters/${cleanSlug}`;

    const res = await fetch(chapterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const matches = Array.from(html.matchAll(/data-src="([^"]+)"/g));

    return matches.map(m => {
      const originalUrl = m[1];
      return `/api/manga/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    });
  } catch (err) {
    console.warn('MangaPill get pages failed:', err);
    return [];
  }
}
