export interface TCBScansChapter {
  id: string; // e.g. "tcb-8011"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface TCBScansSeries {
  id: string; // e.g. "tcb-5-one-piece"
  rawId: string; // "5"
  slug: string; // "one-piece"
  title: string;
  coverImage: string;
  isManhwa: boolean;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let cachedProjects: TCBScansSeries[] | null = null;
let lastProjectsFetch = 0;
const PROJECTS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches the project catalog from TCB Scans
 */
export async function getTCBScansProjects(): Promise<TCBScansSeries[]> {
  const now = Date.now();
  if (cachedProjects && now - lastProjectsFetch < PROJECTS_CACHE_TTL) {
    return cachedProjects;
  }

  try {
    const url = 'https://tcbonepiecechapters.com/projects';
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return cachedProjects || [];

    const html = await res.text();
    // Matches: <a href="/mangas/5/one-piece"><img src="..." alt="One Piece " ...
    const matches = Array.from(
      html.matchAll(
        /<a[^>]+href="\/mangas\/(\d+)\/([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g
      )
    );

    const projects: TCBScansSeries[] = [];
    const seen = new Set<string>();

    for (const m of matches) {
      const rawId = m[1];
      const slug = m[2];
      const coverImage = m[3];
      const title = m[4].replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();

      if (seen.has(rawId)) continue;
      seen.add(rawId);

      const isManhwa = /manhwa|webtoon/i.test(title);

      projects.push({
        id: `tcb-${rawId}-${slug}`,
        rawId,
        slug,
        title,
        coverImage,
        isManhwa
      });
    }

    if (projects.length > 0) {
      cachedProjects = projects;
      lastProjectsFetch = now;
    }

    return projects;
  } catch (err) {
    console.warn('TCB Scans getProjects error:', err);
    return cachedProjects || [];
  }
}

/**
 * Searches TCB Scans projects by title query
 */
export async function searchTCBScans(query: string): Promise<TCBScansSeries[]> {
  try {
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^\w\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanQuery) return [];

    const projects = await getTCBScansProjects();
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length >= 2);

    return projects.filter(p => {
      const pTitle = p.title.toLowerCase();
      const pSlug = p.slug.toLowerCase().replace(/-/g, ' ');

      if (pTitle.includes(cleanQuery) || cleanQuery.includes(pTitle)) return true;
      if (pSlug.includes(cleanQuery) || cleanQuery.includes(pSlug)) return true;

      if (queryWords.length > 0) {
        const matchesAll = queryWords.every(
          w => pTitle.includes(w) || pSlug.includes(w)
        );
        if (matchesAll) return true;
      }

      return false;
    });
  } catch (err) {
    console.warn('TCB Scans search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters for a TCB Scans manga
 */
export async function getTCBScansChapters(seriesIdOrPath: string): Promise<TCBScansChapter[]> {
  try {
    // Expected seriesIdOrPath: "tcb-5-one-piece" or "5/one-piece" or "5"
    let path = seriesIdOrPath.replace(/^tcb-/, '');
    if (!path.includes('/')) {
      const match = path.match(/^(\d+)-(.+)$/);
      if (match) {
        path = `${match[1]}/${match[2]}`;
      } else {
        // Find in projects
        const projects = await getTCBScansProjects();
        const found = projects.find(p => p.rawId === path || p.id === `tcb-${path}`);
        if (found) {
          path = `${found.rawId}/${found.slug}`;
        }
      }
    }

    const url = `https://tcbonepiecechapters.com/mangas/${path}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Matches: <a href="/chapters/8011/one-piece-chapter-1197" class="..."><div class="text-lg font-bold">...</div>...
    const matches = Array.from(
      html.matchAll(
        /<a href="\/chapters\/(\d+)\/[^"]+"[^>]*>[\s\S]*?<div class="text-lg font-bold">([^<]+)<\/div>(?:[\s\S]*?<div class="text-gray-500">([^<]*)<\/div>)?/g
      )
    );

    if (matches.length === 0) return [];

    // TCB lists chapters newest first, reverse them to start from chapter 1
    const reversed = [...matches].reverse();

    return reversed.map((m, index) => {
      const chapterId = m[1];
      const rawTitle = m[2].replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
      const subtitle = (m[3] || '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();

      const numMatch = rawTitle.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i) || rawTitle.match(/\b(\d+(?:\.\d+)?)\b/);
      const chapterNumber = numMatch ? parseFloat(numMatch[1]) : index + 1;

      const displayTitle = subtitle
        ? `${rawTitle} - ${subtitle}`
        : rawTitle;

      return {
        id: `tcb-${chapterId}`,
        title: displayTitle,
        chapterNumber,
        content: []
      };
    });
  } catch (err) {
    console.warn('TCB Scans getChapters error:', err);
    return [];
  }
}

/**
 * Fetches all page image URLs for a TCB Scans chapter
 */
export async function getTCBScansPages(chapterId: string): Promise<string[]> {
  try {
    const cleanId = chapterId.replace(/^tcb-(?:ch-)?/, '');
    const url = `https://tcbonepiecechapters.com/chapters/${cleanId}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const matches = Array.from(
      html.matchAll(/<img[^>]+class="fixed-ratio-content"[^>]+src="([^"]+)"/g)
    ).map(m => m[1]);

    // Fallback if class differs
    let pages = matches;
    if (pages.length === 0) {
      pages = Array.from(
        html.matchAll(/https:\/\/cdn\.onepiecechapters\.com\/file\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)/g)
      ).map(m => m[0]);
    }

    // Deduplicate
    const uniquePages: string[] = [];
    const seen = new Set<string>();
    for (const p of pages) {
      if (!seen.has(p)) {
        seen.add(p);
        uniquePages.push(p);
      }
    }

    return uniquePages;
  } catch (err) {
    console.warn('TCB Scans getPages error:', err);
    return [];
  }
}
