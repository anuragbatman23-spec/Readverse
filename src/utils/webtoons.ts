export interface WebtoonsChapter {
  id: string; // e.g. "wt-action-omniscient-reader-2154-1"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface WebtoonsSeries {
  genre: string;
  slug: string;
  titleNo: string;
  title: string;
  listUrl: string;
}

export interface WebtoonsSearchResult {
  id: string; // e.g. "wt-action-omniscient-reader-2154"
  genre: string;
  slug: string;
  titleNo: string;
  title: string;
  coverImage: string;
  isManhwa: true;
}

export async function searchWebtoonsDetailed(title: string): Promise<WebtoonsSearchResult[]> {
  try {
    const cleanTitle = title.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanTitle) return [];

    const searchUrl = `https://www.webtoons.com/en/search?keyword=${encodeURIComponent(cleanTitle)}`;
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
      /<a[^>]*href="([^"]*\/en\/([^/]+)\/([^/]+)\/list\?title_no=([0-9]+))"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<strong class="title">([^<]+)<\/strong>/g;

    const results: WebtoonsSearchResult[] = [];
    const seen = new Set<string>();

    for (const match of Array.from(html.matchAll(cardRegex))) {
      const genre = match[2];
      const slug = match[3];
      const titleNo = match[4];
      const cover = match[5];
      const itemTitle = match[6]?.trim() || '';

      if (genre.toLowerCase() === 'canvas') continue;
      if (seen.has(titleNo)) continue;
      seen.add(titleNo);

      results.push({
        id: `wt-${genre}-${slug}-${titleNo}`,
        genre,
        slug,
        titleNo,
        title: itemTitle,
        coverImage: cover,
        isManhwa: true
      });
    }

    return results;
  } catch (err) {
    console.warn('Webtoons detailed search failed:', err);
    return [];
  }
}

function normalizeTitle(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getSearchVariants(title: string): string[] {
  const variants = new Set<string>();
  const clean = title.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  if (clean) variants.add(clean);

  // Strip common manhwa/webtoon subtitles or suffixes
  const stripped = clean
    .replace(/\b(s\s*viewpoint|viewpoint|manhwa|manga|webtoon|novel|comic|official|remake)\b/gi, '')
    .replace(/\bseason\s*\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped && stripped !== clean) {
    variants.add(stripped);
  }

  // If title has more than 3 words, try the first 2 and 3 words
  const words = clean.split(' ');
  if (words.length > 3) {
    variants.add(words.slice(0, 2).join(' '));
    variants.add(words.slice(0, 3).join(' '));
  }

  return Array.from(variants);
}

/**
 * Searches LINE Webtoons for official English manhwa releases
 */
export async function searchWebtoons(title: string): Promise<WebtoonsSeries | null> {
  try {
    const variants = getSearchVariants(title);

    for (const query of variants) {
      const searchUrl = `https://www.webtoons.com/en/search?keyword=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 3600 }
      });

      if (!res.ok) continue;

      const html = await res.text();
      const regex =
        /<a[^>]*href="([^"]*\/en\/([^/]+)\/([^/]+)\/list\?title_no=([0-9]+))"[^>]*>[\s\S]*?<strong class="title">([^<]+)<\/strong>/g;

      const candidates: WebtoonsSeries[] = [];
      for (const match of Array.from(html.matchAll(regex))) {
        const listUrl = match[1];
        const genre = match[2];
        const slug = match[3];
        const titleNo = match[4];
        const itemTitle = match[5]?.trim() || '';

        // Skip unofficial indie canvas uploads
        if (genre.toLowerCase() === 'canvas') continue;

        candidates.push({ genre, slug, titleNo, title: itemTitle, listUrl });
      }

      if (candidates.length === 0) continue;

      const cleanQ = normalizeTitle(query);

      // 1. Exact title match
      const exact = candidates.find(c => normalizeTitle(c.title) === cleanQ);
      if (exact) return exact;

      // 2. Starts with / prefix match
      const prefix = candidates.find(c => {
        const cleanC = normalizeTitle(c.title);
        return cleanC.startsWith(cleanQ) || cleanQ.startsWith(cleanC);
      });
      if (prefix) return prefix;

      // 3. Substring match
      const substring = candidates.find(c => {
        const cleanC = normalizeTitle(c.title);
        return cleanC.includes(cleanQ) || cleanQ.includes(cleanC);
      });
      if (substring) return substring;
    }

    return null;
  } catch (err) {
    console.warn('Webtoons search failed:', err);
    return null;
  }
}

/**
 * Gets all episodes for a Webtoons manhwa series
 */
export async function getWebtoonsChapters(
  genre: string,
  slug: string,
  titleNo: string
): Promise<WebtoonsChapter[]> {
  try {
    const listUrl = `https://www.webtoons.com/en/${genre}/${slug}/list?title_no=${titleNo}`;
    const res = await fetch(listUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Extract latest episode number from the page
    const epMatches = Array.from(html.matchAll(/data-episode-no="([0-9]+)"/g));
    const epNums = epMatches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n));
    const maxEpisode = epNums.length > 0 ? Math.max(...epNums) : 10;

    // Build ascending chapters (Episode 1 .. Episode N)
    const chapters: WebtoonsChapter[] = [];
    for (let ep = 1; ep <= maxEpisode; ep++) {
      chapters.push({
        id: `wt-${genre}-${slug}-${titleNo}-${ep}`,
        title: `Episode ${ep}`,
        chapterNumber: ep,
        content: []
      });
    }

    return chapters;
  } catch (err) {
    console.warn('Webtoons get chapters failed:', err);
    return [];
  }
}

/**
 * Gets vertical strip pages for a specific Webtoons episode
 */
export async function getWebtoonsPages(chapterId: string): Promise<string[]> {
  try {
    // Expected chapterId format: wt-{genre}-{slug}-{titleNo}-{ep}
    const cleanId = chapterId.replace(/^wt-/, '');
    const parts = cleanId.split('-');
    if (parts.length < 4) return [];

    const ep = parts.pop()!;
    const titleNo = parts.pop()!;
    const genre = parts.shift()!;
    const slug = parts.join('-');

    const viewerUrl = `https://www.webtoons.com/en/${genre}/${slug}/episode-${ep}/viewer?title_no=${titleNo}&episode_no=${ep}`;

    const res = await fetch(viewerUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow',
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    let rawUrls: string[] = [];

    const imageListMatch = html.match(/<div[^>]*id="_imageList"[^>]*>([\s\S]*?)<\/div>/);
    if (imageListMatch) {
      const matches = Array.from(imageListMatch[1].matchAll(/data-url="([^"]+)"/g));
      rawUrls = matches.map(m => m[1]);
    } else {
      const matches = Array.from(html.matchAll(/data-url="([^"]+webtoon-phinf\.pstatic\.net[^"]+)"/g));
      rawUrls = matches.map(m => m[1]);
    }

    if (rawUrls.length === 0) return [];

    // Route each image through our streaming image proxy to preserve referer & bypass hotlink locks
    return rawUrls.map(imgUrl => `/api/manga/image-proxy?url=${encodeURIComponent(imgUrl)}`);
  } catch (err) {
    console.warn('Webtoons get pages failed:', err);
    return [];
  }
}
