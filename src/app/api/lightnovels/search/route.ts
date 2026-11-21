import { NextResponse } from 'next/server';
import { searchLNWebnovels, ACTIVE_WEBNOVEL_SOURCES } from '@/utils/lnreaderService';
import { FAMOUS_LIGHT_NOVELS } from '@/data/famousCatalog';
import { searchLocalLightNovels } from '@/utils/localLightNovelsService';
import { Book } from '@/types';

// In-memory cache for live searches (TTL: 5 minutes)
interface LightnovelSearchCacheEntry {
  timestamp: number;
  books: Book[];
}
const lightnovelSearchCache = new Map<string, LightnovelSearchCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const source = searchParams.get('source') || 'all';

  // For the home screen (empty query), return exclusively verified famous Japanese light novels
  if (!query) {
    return NextResponse.json(
      {
        books: FAMOUS_LIGHT_NOVELS,
        activeSources: ACTIVE_WEBNOVEL_SOURCES.map(s => s.name)
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );
  }

  // Check in-memory query cache
  const cacheKey = `${query.toLowerCase()}_${source}`;
  const cached = lightnovelSearchCache.get(cacheKey);
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

  // 1. Search locally stored light novels first (offline resilient, instant, 100% full chapters)
  let localMatches: Book[] = [];
  try {
    localMatches = await searchLocalLightNovels(query, 25);
  } catch (localErr) {
    console.warn('Local light novel search warning:', localErr);
  }

  // 2. Query live online light novel sources with timeout and failure tolerance
  let liveNovels: Book[] = [];
  let liveError = false;

  try {
    liveNovels = await searchLNWebnovels(query, source);
  } catch (err: unknown) {
    liveError = true;
    const errorMsg = err instanceof Error ? err.message : 'Unknown source error';
    console.warn('Live light novel source failed/crashed, falling back to local storage:', errorMsg);
  }

  // Mark category as lightnovel
  const categorizedLive = liveNovels.map(b => ({
    ...b,
    category: 'lightnovel' as const
  }));

  // Curated fallback matches from FAMOUS_LIGHT_NOVELS
  const qLower = query.toLowerCase();
  const curatedMatches = FAMOUS_LIGHT_NOVELS.filter(
    b =>
      b.title.toLowerCase().includes(qLower) ||
      b.author.toLowerCase().includes(qLower) ||
      b.genre.some(g => g.toLowerCase().includes(qLower))
  );

  // If live source crashed out or timed out or returned no results:
  if (liveError || categorizedLive.length === 0) {
    if (localMatches.length > 0) {
      lightnovelSearchCache.set(cacheKey, { timestamp: Date.now(), books: localMatches });
      return NextResponse.json({
        books: localMatches,
        activeSources: ['Local Offline Storage (Auto-Fallback)'],
        isFallback: true
      });
    }

    if (curatedMatches.length > 0) {
      lightnovelSearchCache.set(cacheKey, { timestamp: Date.now(), books: curatedMatches });
      return NextResponse.json({
        books: curatedMatches,
        activeSources: ['Curated Classics (Fallback)'],
        isFallback: true
      });
    }

    return NextResponse.json({
      books: [],
      activeSources: []
    });
  }

  // If live sources responded: Merge local matches at the top (fastest, most reliable) + live results
  const seenIds = new Set<string>();
  const merged: Book[] = [];

  for (const b of [...localMatches, ...curatedMatches, ...categorizedLive]) {
    if (!seenIds.has(b.id)) {
      seenIds.add(b.id);
      merged.push(b);
    }
  }

  lightnovelSearchCache.set(cacheKey, { timestamp: Date.now(), books: merged });

  return NextResponse.json(
    {
      books: merged,
      activeSources: ['Local Offline Storage', ...ACTIVE_WEBNOVEL_SOURCES.map(s => s.name)]
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}
