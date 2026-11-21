import { NextResponse } from 'next/server';
import { searchLNWebnovels, ACTIVE_WEBNOVEL_SOURCES } from '@/utils/lnreaderService';
import { FAMOUS_WEBNOVELS } from '@/data/famousCatalog';
import { Book } from '@/types';

// In-memory cache for live searches (TTL: 5 minutes)
interface WebnovelSearchCacheEntry {
  timestamp: number;
  books: Book[];
}
const webnovelSearchCache = new Map<string, WebnovelSearchCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const source = searchParams.get('source') || 'all';

  // Return available sources list if requested
  if (searchParams.get('info') === 'sources') {
    return NextResponse.json({ sources: ACTIVE_WEBNOVEL_SOURCES });
  }

  // When on the home screen (no active query), return exclusively verified famous webnovels
  if (!query) {
    return NextResponse.json(
      {
        books: FAMOUS_WEBNOVELS,
        activeSources: ACTIVE_WEBNOVEL_SOURCES.map(s => s.name)
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );
  }

  // Check cache for active query
  const cacheKey = `${query.toLowerCase()}_${source}`;
  const cached = webnovelSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        books: cached.books,
        activeSources: ACTIVE_WEBNOVEL_SOURCES.map(s => s.name),
        cached: true
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  }

  try {
    // Multi-source parallel search powered by LNReader engine
    const liveNovels = await searchLNWebnovels(query, source);
    webnovelSearchCache.set(cacheKey, { timestamp: Date.now(), books: liveNovels });
    return NextResponse.json(
      {
        books: liveNovels,
        activeSources: ACTIVE_WEBNOVEL_SOURCES.map(s => s.name)
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown search error';
    console.error('Live webnovel search error:', errorMsg);
    return NextResponse.json({ books: [] });
  }
}
