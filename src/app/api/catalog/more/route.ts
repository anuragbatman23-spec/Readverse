import { NextResponse } from 'next/server';
import { Book, ContentCategory } from '@/types';
import { normalizeTitle, isHomePageBook } from '@/utils/puterRecommendationEngine';
import { searchLNWebnovels } from '@/utils/lnreaderService';
import { KNOWN_CLASSIC_COVERS } from '@/utils/imageOptimizer';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  timestamp: number;
  books: Book[];
}

const shelfMoreCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cleanHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

interface AniListMedia {
  id: number;
  title?: {
    english?: string;
    romaji?: string;
  };
  countryOfOrigin?: string;
  format?: string;
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  description?: string;
  genres?: string[];
  averageScore?: number;
}

const WEBNOVEL_PAGE_KEYWORDS = [
  'system',
  'cultivation',
  'isekai',
  'magic',
  'progression',
  'reincarnation',
  'dungeon',
  'apocalypse',
  'necromancer',
  'fantasy',
  'adventure',
  'overpowered'
];

async function fetchAniListCatalog(
  category: 'manhwa' | 'manga' | 'lightnovel',
  page: number,
  perPage = 20
): Promise<Book[]> {
  const isManhwa = category === 'manhwa';
  const isNovel = category === 'lightnovel';

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(
          type: MANGA,
          ${isManhwa ? 'countryOfOrigin: "KR",' : isNovel ? 'format: NOVEL,' : 'format: MANGA, countryOfOrigin: "JP",'}
          sort: [POPULARITY_DESC]
        ) {
          id
          title { english romaji }
          countryOfOrigin
          format
          coverImage { extraLarge large }
          description
          genres
          averageScore
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ReadVerse/1.0'
      },
      body: JSON.stringify({
        query,
        variables: { page, perPage }
      }),
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const json = await res.json();
    const mediaList: AniListMedia[] = json?.data?.Page?.media || [];

    const books: Book[] = [];
    for (const m of mediaList) {
      const rawTitle = (m.title?.english || m.title?.romaji || '').trim();
      if (!rawTitle) continue;
      if (isHomePageBook(rawTitle)) continue;

      const cover =
        m.coverImage?.extraLarge ||
        m.coverImage?.large ||
        'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg';

      const desc = cleanHtml(m.description) || `Popular series in ${category}.`;
      const rating = m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : 4.88;
      const genres = m.genres?.length ? m.genres : ['Action', 'Fantasy'];

      books.push({
        id: `anilist-${m.id}`,
        title: rawTitle,
        author: isManhwa ? 'Korean Webtoon Studio' : isNovel ? 'Light Novel Author' : 'Manga Creator',
        category,
        coverImage: cover,
        description: desc,
        genre: genres,
        rating,
        pointsPerChapter: isManhwa ? 1.5 : isNovel ? 2.0 : 1.0,
        chapters: []
      });
    }

    return books;
  } catch (err) {
    console.warn(`AniList catalog fetch error for ${category}:`, err);
    return [];
  }
}

async function fetchGutenbergBooks(page: number): Promise<Book[]> {
  try {
    const url = `https://gutendex.com/books/?languages=en&page=${page}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ReadVerse/1.0',
        Accept: 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const items = Array.isArray(data.results) ? data.results : [];
    const books: Book[] = [];

    for (const item of items) {
      if (!item.id || !item.title) continue;
      if (isHomePageBook(item.title)) continue;

      const author = item.authors?.[0]?.name
        ? item.authors[0].name.split(',').reverse().join(' ').trim()
        : 'Classic Author';

      const coverImage =
        (item.id && KNOWN_CLASSIC_COVERS[String(item.id)]) ||
        item.formats?.['image/jpeg'] ||
        `https://covers.openlibrary.org/b/id/12216503-L.jpg`;

      const desc =
        item.summaries?.[0] ||
        `${item.title} by ${author}. A timeless literary classic from Project Gutenberg.`;

      books.push({
        id: `gutenberg-${item.id}`,
        title: item.title,
        author,
        category: 'book',
        coverImage,
        description: desc,
        genre: ['Classic', 'Literature'],
        rating: 4.89,
        pointsPerChapter: 1.5,
        chapters: []
      });
    }

    return books;
  } catch (err) {
    console.warn('Gutenberg fetch error:', err);
    return [];
  }
}

async function fetchWebnovelsMore(page: number): Promise<Book[]> {
  const keyword = WEBNOVEL_PAGE_KEYWORDS[(page - 2) % WEBNOVEL_PAGE_KEYWORDS.length] || 'fantasy';
  try {
    const live = await searchLNWebnovels(keyword, 'all');
    return live.map(b => ({
      ...b,
      category: 'webnovel' as const
    }));
  } catch (err) {
    console.warn(`Webnovels fetch error for keyword "${keyword}":`, err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') || 'manhwa') as ContentCategory;
  const page = Math.max(2, parseInt(searchParams.get('page') || '2', 10));

  const cacheKey = `${category}__p${page}`;
  const cached = shelfMoreCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ books: cached.books, page, cached: true });
  }

  let results: Book[] = [];

  if (category === 'manhwa' || category === 'manga' || category === 'lightnovel') {
    results = await fetchAniListCatalog(category, page);
  } else if (category === 'book') {
    results = await fetchGutenbergBooks(page);
  } else if (category === 'webnovel') {
    results = await fetchWebnovelsMore(page);
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const uniqueBooks: Book[] = [];
  for (const b of results) {
    const norm = normalizeTitle(b.title);
    if (!norm || seen.has(norm) || isHomePageBook(b.title)) continue;
    seen.add(norm);
    uniqueBooks.push(b);
  }

  shelfMoreCache.set(cacheKey, { timestamp: Date.now(), books: uniqueBooks });

  return NextResponse.json(
    {
      books: uniqueBooks,
      page,
      hasMore: uniqueBooks.length > 0
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
      }
    }
  );
}
