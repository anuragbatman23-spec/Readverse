import { NextResponse } from 'next/server';
import { KNOWN_CLASSIC_COVERS } from '@/utils/imageOptimizer';

const FALLBACK_CATEGORY_COVERS: Record<string, string> = {
  manhwa: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  manga: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  webnovel: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  lightnovel: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg',
  book: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
};

const ROYAL_ROAD_KNOWN_COVERS: Record<string, string> = {
  hewhofightswithmonsters: 'https://www.royalroadcdn.com/public/covers-large/26294-he-who-fights-with-monsters.jpg',
  defianceofthefall: 'https://www.royalroadcdn.com/public/covers-full/24709-defiance-of-the-fall.jpg',
  motheroflearning: 'https://www.royalroadcdn.com/public/covers-full/21220-mother-of-learning.jpg',
  theperfectrun: 'https://www.royalroadcdn.com/public/covers-full/33143-the-perfect-run.jpg',
  bewareofchicken: 'https://www.royalroadcdn.com/public/covers-full/39408-beware-of-chicken.jpg',
  chrysalis: 'https://www.royalroadcdn.com/public/covers-full/22518-chrysalis.jpg',
  supersupportive: 'https://www.royalroadcdn.com/public/covers-full/63759-super-supportive.jpg',
  azarinthhealer: 'https://www.royalroadcdn.com/public/covers-full/16946-azarinth-healer.jpg',
  thewanderinginn: 'https://www.royalroadcdn.com/public/covers-full/10073-the-wandering-inn.jpg',
  beneaththedragoneyemoons: 'https://www.royalroadcdn.com/public/covers-full/36299-beneath-the-dragoneye-moons.jpg',
  therunesmith: 'https://www.royalroadcdn.com/public/covers-full/33844-the-runesmith.jpg'
};

// Helper to dynamically fetch an authentic backup cover from Royal Road, Open Library, or AniList by title if primary fails
async function fetchBackupCoverByTitle(title: string): Promise<Response | null> {
  const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check known Classic covers
  if (normTitle) {
    let matchedClassicUrl: string | undefined = KNOWN_CLASSIC_COVERS[normTitle];
    if (!matchedClassicUrl) {
      for (const [key, url] of Object.entries(KNOWN_CLASSIC_COVERS)) {
        if (key.length >= 5 && (normTitle.includes(key) || key.includes(normTitle))) {
          matchedClassicUrl = url;
          break;
        }
      }
    }

    if (matchedClassicUrl) {
      try {
        const cRes = await fetch(matchedClassicUrl, { redirect: 'follow' });
        if (cRes.ok) {
          const contentType = cRes.headers.get('content-type') || 'image/jpeg';
          const buffer = await cRes.arrayBuffer();
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch {
        // Fall through
      }
    }
  }

  // 2. Check known Royal Road CDN webnovel covers first
  if (normTitle) {
    let matchedRrUrl: string | undefined = ROYAL_ROAD_KNOWN_COVERS[normTitle];
    if (!matchedRrUrl) {
      for (const [key, url] of Object.entries(ROYAL_ROAD_KNOWN_COVERS)) {
        if (normTitle.includes(key) || key.includes(normTitle)) {
          matchedRrUrl = url;
          break;
        }
      }
    }

    if (matchedRrUrl) {
      try {
        const rrRes = await fetch(matchedRrUrl, {
          headers: { 'Referer': 'https://www.royalroad.com/', 'User-Agent': 'Mozilla/5.0' }
        });
        if (rrRes.ok) {
          const contentType = rrRes.headers.get('content-type') || 'image/jpeg';
          const buffer = await rrRes.arrayBuffer();
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch {
        // Fall through to AniList
      }
    }
  }

  // 3. Query Open Library for Books / Classic Literature
  try {
    const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`, {
      headers: { 'User-Agent': 'ReadVerse/1.0' }
    });
    if (olRes.ok) {
      const olData = await olRes.json();
      const coverId = olData.docs?.[0]?.cover_i;
      if (coverId) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        const imgRes = await fetch(coverUrl, { redirect: 'follow' });
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          const buffer = await imgRes.arrayBuffer();
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }
  } catch {
    // Fall through to AniList
  }

  // 4. Query AniList for Manga / Manhwa / Light Novels
  try {
    const q = `query ($search: String) { Media(search: $search, type: MANGA) { coverImage { extraLarge large } } }`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, variables: { search: title } })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const coverUrl = data.data?.Media?.coverImage?.extraLarge || data.data?.Media?.coverImage?.large;
    if (!coverUrl) return null;

    const imgRes = await fetch(coverUrl, {
      headers: { 'User-Agent': 'ReadVerse/1.0 (readverse.app)' }
    });
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await imgRes.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const title = searchParams.get('title') || '';
  const allowCoverFallback = searchParams.get('fallback') === 'cover';

  if (!imageUrl) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  // Fast redirect for Gutenberg covers to reliable Open Library high-res mirrors
  if (imageUrl.includes('gutenberg.org')) {
    const gbMatch = imageUrl.match(/epub\/(\d+)\//);
    if (gbMatch && gbMatch[1] && KNOWN_CLASSIC_COVERS[gbMatch[1]]) {
      return Response.redirect(KNOWN_CLASSIC_COVERS[gbMatch[1]], 302);
    }
    if (title) {
      const norm = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (KNOWN_CLASSIC_COVERS[norm]) {
        return Response.redirect(KNOWN_CLASSIC_COVERS[norm], 302);
      }
    }
  }

  try {
    const u = imageUrl.toLowerCase();
    let referer = 'https://mangadex.org/';

    if (u.includes('mangadex.network') || u.includes('mangadex.org')) {
      referer = 'https://mangadex.org/';
    } else if (u.includes('webtoon') || u.includes('pstatic.net')) {
      referer = 'https://www.webtoons.com/';
    } else if (u.includes('readsololeveling.org')) {
      referer = 'https://readsololeveling.org/';
    } else if (u.includes('mangakatana.com') || u.includes('mkklcdn')) {
      referer = 'https://mangakatana.com/';
    } else if (
      u.includes('weebcentral.com') ||
      u.includes('planeptune.us') ||
      u.includes('lowee.us') ||
      u.includes('compsci88.com')
    ) {
      referer = 'https://weebcentral.com/';
    } else if (u.includes('mangapill.com') || u.includes('mpcdn.top') || u.includes('readdetectiveconan.com')) {
      referer = 'https://mangapill.com/';
    } else if (u.includes('flamecomics.xyz') || u.includes('flamecomics.me')) {
      referer = 'https://flamecomics.xyz/';
    } else if (u.includes('onepiecechapters.com') || u.includes('tcbscans') || u.includes('tcbonepiecechapters')) {
      referer = 'https://tcbonepiecechapters.com/';
    } else if (u.includes('toongod.cc')) {
      referer = 'https://toongod.cc/';
    } else if (u.includes('manhwabuddy.com')) {
      referer = 'https://manhwabuddy.com/';
    } else if (u.includes('novelbuddy.me')) {
      referer = 'https://novelbuddy.me/';
    } else if (u.includes('novelfire.net')) {
      referer = 'https://novelfire.net/';
    } else if (u.includes('royalroad.com') || u.includes('royalroadcdn.com')) {
      referer = 'https://www.royalroad.com/';
    } else if (u.includes('anilist.co') || u.includes('anili.st')) {
      referer = 'https://anilist.co/';
    } else if (u.includes('gutenberg.org')) {
      referer = 'https://www.gutenberg.org/';
    }

    const isMangaDex = u.includes('mangadex.network') || u.includes('mangadex.org');

    const headers: Record<string, string> = {
      'User-Agent': isMangaDex
        ? 'ReadVerse/1.0 (readverse.app)'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    };

    if (referer) {
      headers['Referer'] = referer;
    }

    let res = await fetch(imageUrl, { headers });

    // If initial fetch gets 403 Forbidden, retry without spoofed browser user-agent
    if (res.status === 403 && !isMangaDex) {
      res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'ReadVerse/1.0 (readverse.app)',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
    }

    if (!res.ok) {
      // Dynamic cross-source fallback: If MangaDex or primary source is down, fetch cover from AniList
      if (title) {
        const backupRes = await fetchBackupCoverByTitle(title);
        if (backupRes) return backupRes;
      }

      if (allowCoverFallback) {
        const fallbackUrl = FALLBACK_CATEGORY_COVERS.default;
        const fbRes = await fetch(fallbackUrl);
        if (fbRes.ok) {
          const fbBuffer = await fbRes.arrayBuffer();
          return new Response(fbBuffer, {
            status: 200,
            headers: {
              'Content-Type': fbRes.headers.get('content-type') || 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
      return new Response(null, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: unknown) {
    if (title) {
      const backupRes = await fetchBackupCoverByTitle(title);
      if (backupRes) return backupRes;
    }
    if (allowCoverFallback) {
      try {
        const fbRes = await fetch(FALLBACK_CATEGORY_COVERS.default);
        if (fbRes.ok) {
          const fbBuffer = await fbRes.arrayBuffer();
          return new Response(fbBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch {}
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
