import { NextResponse } from 'next/server';
import { getMangaPillPages } from '@/utils/mangapill';
import { getWebtoonsPages } from '@/utils/webtoons';
import { getSoloLevelingPages } from '@/utils/sololeveling';
import { searchWeebCentral, getWeebCentralChapters, getWeebCentralPages } from '@/utils/weebcentral';
import { searchMangaKatana, getMangaKatanaChapters, getMangaKatanaPages } from '@/utils/mangakatana';
import { searchTCBScans, getTCBScansChapters, getTCBScansPages } from '@/utils/tcbscans';
import { searchFlameComics, getFlameComicsChapters, getFlameComicsPages } from '@/utils/flamecomics';
import { searchToonGod, getToonGodChapters, getToonGodPages } from '@/utils/toongod';
import { searchManhwaBuddy, getManhwaBuddyChapters, getManhwaBuddyPages } from '@/utils/manhwabuddy';
import { getMangaDistrictPages } from '@/utils/mangadistrict';

// In-memory cache for resolved chapter pages
const mangaPagesCache = new Map<string, { pages: string[]; source: string }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get('chapterId');
  const mangaTitle = (searchParams.get('title') || '').trim();
  const cleanTitle = mangaTitle.replace(/\s*\([^)]*\)/g, '').trim();
  const chapterNumberStr = searchParams.get('chapterNumber');
  const chapterNumber = chapterNumberStr ? parseFloat(chapterNumberStr) : undefined;

  if (!chapterId && !mangaTitle) {
    return NextResponse.json({ error: 'chapterId or title is required' }, { status: 400 });
  }

  // Check in-memory cache
  if (chapterId && mangaPagesCache.has(chapterId)) {
    const cached = mangaPagesCache.get(chapterId)!;
    return NextResponse.json(
      { pages: cached.pages, source: cached.source },
      { headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } }
    );
  }

  // 1. Dedicated Source: Solo Leveling
  if (chapterId && (chapterId.startsWith('sl-ch-') || chapterId.startsWith('ss-ch-'))) {
    try {
      const pages = await getSoloLevelingPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'sololeveling' });
      }
    } catch (err) {
      console.warn('Failed to fetch Solo Leveling pages:', err);
    }
  }

  // 2. WeebCentral (Official Scans Mirror)
  if (chapterId && chapterId.startsWith('wc-')) {
    try {
      const pages = await getWeebCentralPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'weebcentral' });
      }
    } catch (err) {
      console.warn('Failed to fetch WeebCentral pages:', err);
    }
  }

  // 2B. TCB Scans (Ultra HQ Shonen Scans)
  if (chapterId && chapterId.startsWith('tcb-')) {
    try {
      const pages = await getTCBScansPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'tcbscans' });
      }
    } catch (err) {
      console.warn('Failed to fetch TCB Scans pages:', err);
    }
  }

  // 2C. Flame Comics (Elite Manhwa & Scans)
  if (chapterId && chapterId.startsWith('fc-')) {
    try {
      const pages = await getFlameComicsPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'flamecomics' });
      }
    } catch (err) {
      console.warn('Failed to fetch Flame Comics pages:', err);
    }
  }

  // 2D. ToonGod (Korean Manhwa / Webtoons)
  if (chapterId && chapterId.startsWith('tg-')) {
    try {
      const pages = await getToonGodPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'toongod' });
      }
    } catch (err) {
      console.warn('Failed to fetch ToonGod pages:', err);
    }
  }

  // 2E. ManhwaBuddy (Dedicated Korean Manhwa Hub)
  if (chapterId && chapterId.startsWith('mb-')) {
    try {
      const pages = await getManhwaBuddyPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'manhwabuddy' });
      }
    } catch (err) {
      console.warn('Failed to fetch ManhwaBuddy pages:', err);
    }
  }

  // 2F. MangaDistrict (Full Manga & Manhwa Catalog)
  if (chapterId && chapterId.startsWith('md-')) {
    try {
      const pages = await getMangaDistrictPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'mangadistrict' });
      }
    } catch (err) {
      console.warn('Failed to fetch MangaDistrict pages:', err);
    }
  }

  // 3. MangaKatana (Massive 40k+ Catalog)
  if (chapterId && chapterId.startsWith('mk-')) {
    try {
      const pages = await getMangaKatanaPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'mangakatana' });
      }
    } catch (err) {
      console.warn('Failed to fetch MangaKatana pages:', err);
    }
  }

  // 4. LINE Webtoons (Korean Manhwa)
  if (chapterId && chapterId.startsWith('wt-')) {
    try {
      const pages = await getWebtoonsPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'webtoons' });
      }
    } catch (err) {
      console.warn('Failed to fetch Webtoons pages:', err);
    }
  }

  // 5. MangaPill (Japanese Manga)
  if (chapterId && chapterId.startsWith('mp-')) {
    try {
      const pages = await getMangaPillPages(chapterId);
      if (pages.length > 0) {
        return NextResponse.json({ pages, source: 'mangapill' });
      }
    } catch (err) {
      console.warn('Failed to fetch MangaPill pages:', err);
    }
  }

  // 6. MangaDex @home
  if (chapterId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId)) {
    try {
      const pagesUrl = `https://api.mangadex.org/at-home/server/${chapterId}`;
      const pagesRes = await fetch(pagesUrl, {
        headers: { 'User-Agent': 'ReadVerse/1.0 (readverse.app)' }
      });

      if (pagesRes.ok) {
        const atHomeData = await pagesRes.json();
        const baseUrl = atHomeData.baseUrl;
        const hash = atHomeData.chapter?.hash;
        const dataFiles = atHomeData.chapter?.data || atHomeData.chapter?.dataSaver || [];

        const pages = dataFiles.map(
          (filename: string) => `${baseUrl}/data/${hash}/${filename}`
        );

        if (pages.length > 0) {
          return NextResponse.json({ pages, source: 'mangadex' });
        }
      }
    } catch (err) {
      console.warn('MangaDex pages error:', err);
    }
  }

  // 7. Dynamic Failover by Title & Chapter Number
  const targetTitle = cleanTitle || mangaTitle;
  if (targetTitle && chapterNumber !== undefined) {
    // Try TCB Scans
    try {
      const tcbSeries = await searchTCBScans(targetTitle);
      if (tcbSeries.length > 0) {
        const chapters = await getTCBScansChapters(tcbSeries[0].id);
        const match = chapters.find(c => c.chapterNumber === chapterNumber);
        if (match) {
          const pages = await getTCBScansPages(match.id);
          if (pages.length > 0) {
            return NextResponse.json({ pages, source: 'tcbscans' });
          }
        }
      }
    } catch (err) {
      console.warn('Failover TCB Scans search pages error:', err);
    }

    // Try Flame Comics
    try {
      const fcSeries = await searchFlameComics(targetTitle);
      if (fcSeries.length > 0) {
        const chapters = await getFlameComicsChapters(fcSeries[0].id);
        const match = chapters.find(c => c.chapterNumber === chapterNumber);
        if (match) {
          const pages = await getFlameComicsPages(match.id);
          if (pages.length > 0) {
            return NextResponse.json({ pages, source: 'flamecomics' });
          }
        }
      }
    } catch (err) {
      console.warn('Failover Flame Comics search pages error:', err);
    }

    // Try ToonGod
    try {
      const tgSeries = await searchToonGod(targetTitle);
      if (tgSeries.length > 0) {
        const chapters = await getToonGodChapters(tgSeries[0].id);
        const match = chapters.find(c => c.chapterNumber === chapterNumber);
        if (match) {
          const pages = await getToonGodPages(match.id);
          if (pages.length > 0) {
            return NextResponse.json({ pages, source: 'toongod' });
          }
        }
      }
    } catch (err) {
      console.warn('Failover ToonGod search pages error:', err);
    }

    // Try ManhwaBuddy
    try {
      const mbSeries = await searchManhwaBuddy(targetTitle);
      if (mbSeries.length > 0) {
        const chapters = await getManhwaBuddyChapters(mbSeries[0].id);
        const match = chapters.find(c => c.chapterNumber === chapterNumber);
        if (match) {
          const pages = await getManhwaBuddyPages(match.id);
          if (pages.length > 0) {
            return NextResponse.json({ pages, source: 'manhwabuddy' });
          }
        }
      }
    } catch (err) {
      console.warn('Failover ManhwaBuddy search pages error:', err);
    }

    // Try WeebCentral
    try {
      const wcSeries = await searchWeebCentral(targetTitle);
      if (wcSeries.length > 0) {
        const chapters = await getWeebCentralChapters(wcSeries[0].id);
        const match = chapters.find(c => c.chapterNumber === chapterNumber);
        if (match) {
          const pages = await getWeebCentralPages(match.id);
          if (pages.length > 0) {
            return NextResponse.json({ pages, source: 'weebcentral' });
          }
        }
      }
    } catch (err) {
      console.warn('Failover WeebCentral search pages error:', err);
    }

    // Try MangaKatana
    try {
      const mkSeries = await searchMangaKatana(targetTitle);
      if (mkSeries.length > 0) {
        const chapters = await getMangaKatanaChapters(mkSeries[0].id);
        const match = chapters.find(c => c.chapterNumber === chapterNumber);
        if (match) {
          const pages = await getMangaKatanaPages(match.id);
          if (pages.length > 0) {
            return NextResponse.json({ pages, source: 'mangakatana' });
          }
        }
      }
    } catch (err) {
      console.warn('Failover MangaKatana search pages error:', err);
    }
  }

  // Pure authentic response - no fake stock images
  return NextResponse.json(
    { error: 'No pages found for this chapter. The mirror may be updating or unavailable.' },
    { status: 404 }
  );
}
