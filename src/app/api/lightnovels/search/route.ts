import { NextResponse } from 'next/server';
import { searchLNWebnovels, ACTIVE_WEBNOVEL_SOURCES } from '@/utils/lnreaderService';
import { FAMOUS_LIGHT_NOVELS } from '@/data/famousCatalog';
import { searchLocalLightNovels } from '@/utils/localLightNovelsService';
import { searchArchiveLightNovels } from '@/utils/archiveOrgService';
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

  // 1. Search locally stored light novels (if on local dev)
  let localMatches: Book[] = [];
  try {
    localMatches = await searchLocalLightNovels(query, 25);
  } catch (localErr) {
    console.warn('Local light novel search warning:', localErr);
  }

  // 2. Search Archive.org 5,846 Light Novel Library
  let archiveMatches: Book[] = [];
  try {
    archiveMatches = await searchArchiveLightNovels(query, 30);
  } catch (archErr) {
    console.warn('Archive.org light novel search warning:', archErr);
  }

  const combinedLibraryMatches = [...localMatches, ...archiveMatches];

  // 3. Query live online light novel sources with timeout and failure tolerance
  let liveNovels: Book[] = [];
  let liveError = false;

  try {
    liveNovels = await searchLNWebnovels(query, source);
  } catch (err: unknown) {
    liveError = true;
    const errorMsg = err instanceof Error ? err.message : 'Unknown source error';
    console.warn('Live light novel source failed/crashed, falling back to archive:', errorMsg);
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
    if (combinedLibraryMatches.length > 0) {
      lightnovelSearchCache.set(cacheKey, { timestamp: Date.now(), books: combinedLibraryMatches });
      return NextResponse.json({
        books: combinedLibraryMatches,
        activeSources: ['Archive.org 5,846 Library', 'Local Storage'],
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

  // Merge library matches at the top (fastest, authentic official volumes) + live results
  const seenIds = new Set<string>();
  const merged: Book[] = [];

  for (const b of [...combinedLibraryMatches, ...curatedMatches, ...categorizedLive]) {
    if (!seenIds.has(b.id)) {
      seenIds.add(b.id);
      merged.push(b);
    }
  }

  lightnovelSearchCache.set(cacheKey, { timestamp: Date.now(), books: merged });

  return NextResponse.json(
    {
      books: merged,
      activeSources: ['Archive.org Library (5,846 Books)', ...ACTIVE_WEBNOVEL_SOURCES.map(s => s.name)]
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}
