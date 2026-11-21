export interface ManhwaBuddyChapter {
  id: string; // e.g. "mb-ch-solo-leveling-200"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface ManhwaBuddySeries {
  id: string; // e.g. "mb-solo-leveling"
  slug: string;
  title: string;
  coverImage: string;
  isManhwa: boolean;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Searches ManhwaBuddy for Korean webtoons/manhwa
 */
export async function searchManhwaBuddy(query: string): Promise<ManhwaBuddySeries[]> {
  try {
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^\w\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanQuery) return [];

    const url = `https://manhwabuddy.com/search/?s=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Matches: <a href="/manhwa/the-demon-kings-channel/" title="The Demon King’s Channel"><img src="..." ...
    const matches = Array.from(
      html.matchAll(
        /<a href="\/manhwa\/([^\"]+)\/"[^>]*title="([^\"]+)">\s*<img[^>]+src="([^\"]+)"/g
      )
    );

    const results: ManhwaBuddySeries[] = [];
    const seen = new Set<string>();

    for (const m of matches) {
      const slug = m[1].trim();
      const rawTitle = m[2].replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
      let coverImage = m[3].trim();

      if (seen.has(slug)) continue;
      seen.add(slug);

      if (coverImage.startsWith('/')) {
        coverImage = `https://manhwabuddy.com${coverImage}`;
      }

      results.push({
        id: `mb-${slug}`,
        slug,
        title: rawTitle,
        coverImage,
        isManhwa: true
      });
    }

    return results;
  } catch (err) {
    console.warn('ManhwaBuddy search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters of a ManhwaBuddy series
 */
export async function getManhwaBuddyChapters(seriesIdOrSlug: string): Promise<ManhwaBuddyChapter[]> {
  try {
    const slug = seriesIdOrSlug.replace(/^mb-/, '');
    const url = `https://manhwabuddy.com/manhwa/${slug}/`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Matches: href="/manhwa/solo-leveling/chapter-200-5/" or "/manhwa/solo-leveling/chapter-200/"
    const matches = Array.from(
      html.matchAll(
        new RegExp(`href="(/manhwa/${slug}/chapter-([^/"]+)/?)"`, 'g')
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
        const parsed = parseFloat(rawNum.replace(/-/g, '.'));
        uniqueMatches.push({ rawNum, num: isNaN(parsed) ? 0 : parsed });
      }
    }

    // Sort ascending by chapter number
    uniqueMatches.sort((a, b) => a.num - b.num);

    return uniqueMatches.map(m => {
      const displayTitle = `Chapter ${m.rawNum.replace(/-/g, '.')}`;
      return {
        id: `mb-ch-${slug}-${m.rawNum}`,
        title: displayTitle,
        chapterNumber: m.num,
        content: []
      };
    });
  } catch (err) {
    console.warn('ManhwaBuddy getChapters error:', err);
    return [];
  }
}

/**
 * Fetches all page image URLs for a ManhwaBuddy chapter
 */
export async function getManhwaBuddyPages(chapterId: string): Promise<string[]> {
  try {
    // Expected chapterId: "mb-ch-{slug}-{chapterNum}"
    const cleanId = chapterId.replace(/^mb-(?:ch-)?/, '');
    const lastDash = cleanId.lastIndexOf('-');
    if (lastDash === -1) return [];

    const slug = cleanId.substring(0, lastDash);
    const chapterNum = cleanId.substring(lastDash + 1);

    const url = `https://manhwabuddy.com/manhwa/${slug}/chapter-${chapterNum}/`;
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
          img.includes('manhwabuddy.com/chapters') ||
          img.includes('chapters/')) &&
        !seen.has(img)
      ) {
        seen.add(img);
        pages.push(img);
      }
    }

    return pages;
  } catch (err) {
    console.warn('ManhwaBuddy getPages error:', err);
    return [];
  }
}
