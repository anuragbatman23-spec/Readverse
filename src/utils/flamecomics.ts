export interface FlameComicsChapter {
  id: string; // e.g. "fc-ch-154-a3d9264649d97c7e"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface FlameComicsSeries {
  id: string; // e.g. "fc-154"
  seriesId: number;
  title: string;
  description: string;
  coverImage: string;
  isManhwa: boolean;
  genres: string[];
}

interface RawFlameComicsSeries {
  series_id?: number;
  title?: string;
  description?: string;
  type?: string;
  categories?: string[];
  cover?: string;
  author?: string[];
}

interface RawFlameComicsChapter {
  chapter_id?: number;
  series_id?: number;
  chapter?: string;
  title?: string;
  token?: string;
  edit_time?: number;
  release_date?: number;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let cachedCatalog: FlameComicsSeries[] | null = null;
let lastCatalogFetch = 0;
const CATALOG_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches the complete comic catalog from Flame Comics
 */
export async function getFlameComicsCatalog(): Promise<FlameComicsSeries[]> {
  const now = Date.now();
  if (cachedCatalog && now - lastCatalogFetch < CATALOG_CACHE_TTL) {
    return cachedCatalog;
  }

  try {
    const url = 'https://flamecomics.xyz/browse';
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return cachedCatalog || [];

    const html = await res.text();
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/
    );
    if (!nextDataMatch) return cachedCatalog || [];

    const parsed = JSON.parse(nextDataMatch[1]);
    const rawList: RawFlameComicsSeries[] =
      parsed.props?.pageProps?.series || [];

    const comics: FlameComicsSeries[] = [];
    for (const s of rawList) {
      if (!s.series_id || !s.title) continue;

      const type = (s.type || '').toLowerCase();
      const isManhwa = type === 'manhwa' || type === 'manhua' || type === 'webtoon';
      const coverImage = s.cover
        ? `https://cdn.flamecomics.xyz/uploads/images/series/${s.series_id}/${s.cover}`
        : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

      comics.push({
        id: `fc-${s.series_id}`,
        seriesId: s.series_id,
        title: s.title.trim(),
        description: s.description || 'Official English high-resolution release via Flame Comics.',
        coverImage,
        isManhwa,
        genres: Array.isArray(s.categories) ? s.categories.slice(0, 4) : ['Action', 'Fantasy']
      });
    }

    if (comics.length > 0) {
      cachedCatalog = comics;
      lastCatalogFetch = now;
    }

    return comics;
  } catch (err) {
    console.warn('Flame Comics getCatalog error:', err);
    return cachedCatalog || [];
  }
}

/**
 * Searches Flame Comics catalog by title query
 */
export async function searchFlameComics(query: string): Promise<FlameComicsSeries[]> {
  try {
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^\w\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanQuery) return [];

    const catalog = await getFlameComicsCatalog();
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length >= 2);

    return catalog.filter(c => {
      const cTitle = c.title.toLowerCase();
      if (cTitle.includes(cleanQuery) || cleanQuery.includes(cTitle)) return true;

      if (queryWords.length > 0) {
        const matchesAll = queryWords.every(w => cTitle.includes(w));
        if (matchesAll) return true;
      }

      return false;
    });
  } catch (err) {
    console.warn('Flame Comics search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters of a Flame Comics series
 */
export async function getFlameComicsChapters(seriesIdOrSlug: string): Promise<FlameComicsChapter[]> {
  try {
    const cleanSeriesId = seriesIdOrSlug.replace(/^fc-/, '');
    const url = `https://flamecomics.xyz/series/${cleanSeriesId}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/
    );
    if (!nextDataMatch) return [];

    const parsed = JSON.parse(nextDataMatch[1]);
    const rawChapters: RawFlameComicsChapter[] =
      parsed.props?.pageProps?.chapters || [];

    if (rawChapters.length === 0) return [];

    // Chapters usually arrive newest first, sort or reverse ascending
    const sorted = [...rawChapters].sort((a, b) => {
      const numA = parseFloat(a.chapter || '0');
      const numB = parseFloat(b.chapter || '0');
      return numA - numB;
    });

    return sorted.map((ch, index) => {
      const chNum = parseFloat(ch.chapter || `${index + 1}`);
      const title = ch.title
        ? `Chapter ${chNum}: ${ch.title}`
        : `Chapter ${chNum}`;

      return {
        id: `fc-ch-${ch.series_id || cleanSeriesId}-${ch.token}`,
        title,
        chapterNumber: chNum,
        content: []
      };
    });
  } catch (err) {
    console.warn('Flame Comics getChapters error:', err);
    return [];
  }
}

/**
 * Fetches all page image URLs for a Flame Comics chapter
 */
export async function getFlameComicsPages(chapterId: string): Promise<string[]> {
  try {
    // Format: "fc-ch-{seriesId}-{token}"
    const cleanId = chapterId.replace(/^fc-(?:ch-)?/, '');
    const parts = cleanId.split('-');
    if (parts.length < 2) return [];

    const seriesId = parts[0];
    const token = parts.slice(1).join('-');

    const url = `https://flamecomics.xyz/series/${seriesId}/${token}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/
    );
    if (!nextDataMatch) return [];

    const parsed = JSON.parse(nextDataMatch[1]);
    const chapter = parsed.props?.pageProps?.chapter;
    if (!chapter) return [];

    const imagesDict: Record<string, { name: string }> = chapter.images || {};
    const timestamp = chapter.edit_time || chapter.release_date || '';

    // Sort by numerical keys 0, 1, 2, ...
    const sortedIndices = Object.keys(imagesDict).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );

    const pages: string[] = [];
    for (const key of sortedIndices) {
      const img = imagesDict[key];
      if (img && img.name) {
        const fullUrl = `https://cdn.flamecomics.xyz/uploads/images/series/${seriesId}/${token}/${img.name}${
          timestamp ? `?${timestamp}` : ''
        }`;
        pages.push(fullUrl);
      }
    }

    return pages;
  } catch (err) {
    console.warn('Flame Comics getPages error:', err);
    return [];
  }
}
