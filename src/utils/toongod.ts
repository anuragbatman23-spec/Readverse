export interface ToonGodChapter {
  id: string; // e.g. "tg-ch-nano-machine-240"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface ToonGodSeries {
  id: string; // e.g. "tg-nano-machine"
  slug: string;
  title: string;
  coverImage: string;
  isManhwa: boolean;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Searches ToonGod for Korean webtoons/manhwa
 */
export async function searchToonGod(query: string): Promise<ToonGodSeries[]> {
  try {
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^\w\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanQuery) return [];

    const url = `https://toongod.cc/search/?s=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Matches: <a href="/webtoon/solo-leveling-ragnarok/" title="Solo Leveling: Ragnarok"><img src="..." ...
    const matches = Array.from(
      html.matchAll(
        /<a href="\/webtoon\/([^\"]+)\/"[^>]*title="([^\"]+)">\s*<img[^>]+src="([^\"]+)"/g
      )
    );

    const results: ToonGodSeries[] = [];
    const seen = new Set<string>();

    for (const m of matches) {
      const slug = m[1].trim();
      const rawTitle = m[2].replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
      let coverImage = m[3].trim();

      if (seen.has(slug)) continue;
      seen.add(slug);

      if (coverImage.startsWith('/')) {
        coverImage = `https://toongod.cc${coverImage}`;
      }

      results.push({
        id: `tg-${slug}`,
        slug,
        title: rawTitle,
        coverImage,
        isManhwa: true
      });
    }

    return results;
  } catch (err) {
    console.warn('ToonGod search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters of a ToonGod webtoon
 */
export async function getToonGodChapters(seriesIdOrSlug: string): Promise<ToonGodChapter[]> {
  try {
    const slug = seriesIdOrSlug.replace(/^tg-/, '');
    const url = `https://toongod.cc/webtoon/${slug}/`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Matches: href="/webtoon/tomb-raider-king/chapter-411/"
    const matches = Array.from(
      html.matchAll(
        new RegExp(`href="(/webtoon/${slug}/chapter-([^/"]+)/?)"`, 'g')
      )
    );

    if (matches.length === 0) return [];

    // Deduplicate and reverse ascending
    const seen = new Set<string>();
    const uniqueMatches: Array<{ rawNum: string; num: number }> = [];

    for (const m of matches) {
      const rawNum = m[2].trim();
      if (!seen.has(rawNum)) {
        seen.add(rawNum);
        const parsed = parseFloat(rawNum);
        uniqueMatches.push({ rawNum, num: isNaN(parsed) ? 0 : parsed });
      }
    }

    // Sort ascending by chapter number
    uniqueMatches.sort((a, b) => a.num - b.num);

    return uniqueMatches.map(m => {
      return {
        id: `tg-ch-${slug}-${m.rawNum}`,
        title: `Chapter ${m.rawNum}`,
        chapterNumber: m.num,
        content: []
      };
    });
  } catch (err) {
    console.warn('ToonGod getChapters error:', err);
    return [];
  }
}

/**
 * Fetches all page image URLs for a ToonGod chapter
 */
export async function getToonGodPages(chapterId: string): Promise<string[]> {
  try {
    // Expected chapterId: "tg-ch-{slug}-{chapterNum}"
    const cleanId = chapterId.replace(/^tg-(?:ch-)?/, '');
    const lastDash = cleanId.lastIndexOf('-');
    if (lastDash === -1) return [];

    const slug = cleanId.substring(0, lastDash);
    const chapterNum = cleanId.substring(lastDash + 1);

    const url = `https://toongod.cc/webtoon/${slug}/chapter-${chapterNum}/`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const idx = html.indexOf('reading-content');
    const targetHtml = idx !== -1 ? html.substring(idx) : html;

    const matches = Array.from(
      targetHtml.matchAll(/<img[^>]+src="([^"]+)"/g)
    ).map(m => m[1]);

    const pages: string[] = [];
    const seen = new Set<string>();

    for (const img of matches) {
      if (
        (img.includes('img01') ||
          img.includes('img02') ||
          img.includes('img03') ||
          img.includes('toongod.cc/chapters') ||
          img.includes('chapters/')) &&
        !seen.has(img)
      ) {
        seen.add(img);
        pages.push(img);
      }
    }

    return pages;
  } catch (err) {
    console.warn('ToonGod getPages error:', err);
    return [];
  }
}
