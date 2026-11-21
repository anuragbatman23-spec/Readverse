import { NextResponse } from 'next/server';
import { searchMangaPill, getMangaPillChapters } from '@/utils/mangapill';
import { searchWebtoons, getWebtoonsChapters } from '@/utils/webtoons';
import { getSoloLevelingChapters } from '@/utils/sololeveling';
import { searchWeebCentral, getWeebCentralChapters } from '@/utils/weebcentral';
import { searchMangaKatana, getMangaKatanaChapters } from '@/utils/mangakatana';
import { searchTCBScans, getTCBScansChapters } from '@/utils/tcbscans';
import { searchFlameComics, getFlameComicsChapters } from '@/utils/flamecomics';
import { searchToonGod, getToonGodChapters } from '@/utils/toongod';
import { searchManhwaBuddy, getManhwaBuddyChapters } from '@/utils/manhwabuddy';
import { searchMangaDistrict, getMangaDistrictChapters } from '@/utils/mangadistrict';
import { extractSmartSearchQueries } from '@/utils/searchHelper';

interface MangaDexRawChapter {
  id: string;
  attributes?: {
    chapter?: string;
    title?: string;
    pages?: number;
    translatedLanguage?: string;
    externalUrl?: string | null;
  };
}

interface MangaDexTag {
  attributes?: {
    name?: {
      en?: string;
    };
  };
}

interface MangaDexItem {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    originalLanguage?: string;
    tags?: MangaDexTag[];
  };
}

const MANGA_HOSTED_MAPPING: Record<string, string> = {
  'aa6c76f7-5f5f-46b6-a800-911145f81b9b': '199a4cdf-d807-4e3d-ae80-61e4fbc3c50e', // My Dress-Up Darling
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get('mangaId');
  const mangaTitle = (searchParams.get('title') || '').trim();
  const requestedSource = (searchParams.get('source') || 'auto').toLowerCase().trim();

  if (!mangaId) {
    return NextResponse.json({ error: 'mangaId is required' }, { status: 400 });
  }

  const standardAvailableSources = [
    { id: 'weebcentral', name: 'WeebCentral (HQ Scans)' },
    { id: 'mangadistrict', name: 'MangaDistrict (Full Archive)' },
    { id: 'toongod', name: 'ToonGod (Korean Manhwa)' },
    { id: 'manhwabuddy', name: 'ManhwaBuddy (Manhwa Hub)' },
    { id: 'flamecomics', name: 'Flame Comics (Elite Manhwa & Scans)' },
    { id: 'tcbscans', name: 'TCB Scans (Ultra HQ Manga)' },
    { id: 'webtoons', name: 'LINE Webtoons (Official Manhwa)' },
    { id: 'mangapill', name: 'MangaPill (Fast Mirror)' },
    { id: 'mangakatana', name: 'MangaKatana (Deep Archive)' },
    { id: 'mangadex', name: 'MangaDex (Catalog)' }
  ];

  // 1. Dedicated Source for Solo Leveling
  const isSoloLeveling =
    mangaId === '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0' ||
    mangaId === 'solo-sovereign' ||
    mangaTitle.toLowerCase().includes('solo leveling');

  if (isSoloLeveling && (requestedSource === 'auto' || requestedSource === 'sololeveling')) {
    try {
      const slChapters = await getSoloLevelingChapters();
      return NextResponse.json({
        chapters: slChapters,
        source: 'sololeveling',
        sourceName: 'Solo Leveling Official Mirror',
        availableSources: [
          { id: 'sololeveling', name: 'Official Mirror (200 Chapters)' },
          { id: 'weebcentral', name: 'WeebCentral (HQ Scans)' },
          { id: 'mangakatana', name: 'MangaKatana' }
        ],
        title: 'Solo Leveling',
        isManhwa: true,
        category: 'manhwa'
      });
    } catch (err) {
      console.warn('Solo Leveling fetch error:', err);
    }
  }

  // 2. Direct Source: WeebCentral ID
  if (mangaId.startsWith('wc-')) {
    try {
      const wcChapters = await getWeebCentralChapters(mangaId);
      if (wcChapters.length > 0) {
        return NextResponse.json({
          chapters: wcChapters,
          source: 'weebcentral',
          sourceName: 'WeebCentral (HQ Scans)',
          availableSources: standardAvailableSources,
          title: mangaTitle
        });
      }
    } catch (err) {
      console.warn('WeebCentral chapters error:', err);
    }
  }

  // 2B. Direct Source: TCB Scans ID (tcb-{rawId}-{slug})
  if (mangaId.startsWith('tcb-')) {
    try {
      const tcbChapters = await getTCBScansChapters(mangaId);
      if (tcbChapters.length > 0) {
        return NextResponse.json({
          chapters: tcbChapters,
          source: 'tcbscans',
          sourceName: 'TCB Scans (Ultra HQ Manga)',
          availableSources: standardAvailableSources,
          title: mangaTitle,
          isManhwa: false,
          category: 'manga'
        });
      }
    } catch (err) {
      console.warn('TCB Scans chapters error:', err);
    }
  }

  // 2C. Direct Source: Flame Comics ID (fc-{seriesId})
  if (mangaId.startsWith('fc-')) {
    try {
      const fcChapters = await getFlameComicsChapters(mangaId);
      if (fcChapters.length > 0) {
        return NextResponse.json({
          chapters: fcChapters,
          source: 'flamecomics',
          sourceName: 'Flame Comics (Elite Manhwa & Scans)',
          availableSources: standardAvailableSources,
          title: mangaTitle,
          isManhwa: true,
          category: 'manhwa'
        });
      }
    } catch (err) {
      console.warn('Flame Comics chapters error:', err);
    }
  }

  // 2D. Direct Source: ToonGod ID (tg-{slug})
  if (mangaId.startsWith('tg-')) {
    try {
      const tgChapters = await getToonGodChapters(mangaId);
      if (tgChapters.length > 0) {
        return NextResponse.json({
          chapters: tgChapters,
          source: 'toongod',
          sourceName: 'ToonGod (Korean Manhwa)',
          availableSources: standardAvailableSources,
          title: mangaTitle,
          isManhwa: true,
          category: 'manhwa'
        });
      }
    } catch (err) {
      console.warn('ToonGod chapters error:', err);
    }
  }

  // 2E. Direct Source: ManhwaBuddy ID (mb-{slug})
  if (mangaId.startsWith('mb-')) {
    try {
      const mbChapters = await getManhwaBuddyChapters(mangaId);
      if (mbChapters.length > 0) {
        return NextResponse.json({
          chapters: mbChapters,
          source: 'manhwabuddy',
          sourceName: 'ManhwaBuddy (Manhwa Hub)',
          availableSources: standardAvailableSources,
          title: mangaTitle,
          isManhwa: true,
          category: 'manhwa'
        });
      }
    } catch (err) {
      console.warn('ManhwaBuddy chapters error:', err);
    }
  }

  // 2F. Direct Source: MangaDistrict ID (md-{slug})
  if (mangaId.startsWith('md-')) {
    try {
      const mdChapters = await getMangaDistrictChapters(mangaId);
      if (mdChapters.length > 0) {
        return NextResponse.json({
          chapters: mdChapters,
          source: 'mangadistrict',
          sourceName: 'MangaDistrict (Full Archive)',
          availableSources: standardAvailableSources,
          title: mangaTitle
        });
      }
    } catch (err) {
      console.warn('MangaDistrict chapters error:', err);
    }
  }

  // 3. Direct Source: MangaKatana ID
  if (mangaId.startsWith('mk-')) {
    try {
      const mkChapters = await getMangaKatanaChapters(mangaId);
      if (mkChapters.length > 0) {
        return NextResponse.json({
          chapters: mkChapters,
          source: 'mangakatana',
          sourceName: 'MangaKatana (Deep Archive)',
          availableSources: standardAvailableSources,
          title: mangaTitle
        });
      }
    } catch (err) {
      console.warn('MangaKatana chapters error:', err);
    }
  }

  // 4. Direct Source: LINE Webtoons ID (wt-{genre}-{slug}-{titleNo})
  if (mangaId.startsWith('wt-')) {
    try {
      const parts = mangaId.replace(/^wt-/, '').split('-');
      if (parts.length >= 3) {
        const titleNo = parts.pop()!;
        const genre = parts.shift()!;
        const slug = parts.join('-');
        const wtChapters = await getWebtoonsChapters(genre, slug, titleNo);
        if (wtChapters.length > 0) {
          return NextResponse.json({
            chapters: wtChapters,
            source: 'webtoons',
            sourceName: 'LINE Webtoons (Official Manhwa)',
            availableSources: standardAvailableSources,
            title: mangaTitle || slug.replace(/-/g, ' '),
            isManhwa: true,
            category: 'manhwa'
          });
        }
      }
    } catch (err) {
      console.warn('Webtoons chapters error:', err);
    }
  }

  // 5. Direct Source: MangaPill ID (mp-{mangaPath})
  if (mangaId.startsWith('mp-')) {
    try {
      const cleanPath = mangaId.replace(/^mp-/, '');
      const mpChapters = await getMangaPillChapters(cleanPath);
      if (mpChapters.length > 0) {
        return NextResponse.json({
          chapters: mpChapters,
          source: 'mangapill',
          sourceName: 'MangaPill (Fast Mirror)',
          availableSources: standardAvailableSources,
          title: mangaTitle,
          isManhwa: false,
          category: 'manga'
        });
      }
    } catch (err) {
      console.warn('MangaPill chapters error:', err);
    }
  }

  // Resolve Search Title and Queries
  const isMangaDexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
  let resolvedTitle = mangaTitle;
  let isManhwaFromMangaDex = false;

  if (isMangaDexUuid) {
    try {
      const detailRes = await fetch(`https://api.mangadex.org/manga/${mangaId}`, {
        headers: { 'User-Agent': 'ReadVerse/1.0 (readverse.app)' }
      });
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        const attr = detailData.data?.attributes;
        const titleObj = attr?.title || {};
        const enAlt = (attr?.altTitles || []).find((at: Record<string, string>) => at.en)?.en;
        if (!resolvedTitle) {
          resolvedTitle = titleObj.en || enAlt || Object.values(titleObj)[0] || '';
        }
        const origLang = (attr?.originalLanguage || '').toLowerCase();
        const tags = (attr?.tags || []).map((t: MangaDexTag) => t.attributes?.name?.en || '');
        isManhwaFromMangaDex = ['ko', 'zh', 'zh-hk'].includes(origLang) || tags.includes('Long Strip') || tags.includes('Web Comic') || tags.includes('Webtoon');
      }
    } catch {}
  }

  if (!resolvedTitle && !isMangaDexUuid) {
    resolvedTitle = mangaId.replace(/-/g, ' ');
  }

  const cleanSearchTitle = resolvedTitle.replace(/\s*\([^)]*\)/g, '').trim() || resolvedTitle;
  const searchQueries = extractSmartSearchQueries(cleanSearchTitle);

  // User specifically requested WeebCentral
  if (requestedSource === 'weebcentral') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const wcResults = await searchWeebCentral(q);
        if (wcResults.length > 0) {
          const wcChapters = await getWeebCentralChapters(wcResults[0].id);
          if (wcChapters.length > 0) {
            return NextResponse.json({
              chapters: wcChapters,
              source: 'weebcentral',
              sourceName: 'WeebCentral (HQ Scans)',
              availableSources: standardAvailableSources,
              title: wcResults[0].title,
              isManhwa: wcResults[0].isManhwa,
              category: wcResults[0].isManhwa ? 'manhwa' : 'manga'
            });
          }
        }
      } catch (err) {
        console.warn('WeebCentral specific fetch error:', err);
      }
    }
  }

  // User specifically requested TCB Scans
  if (requestedSource === 'tcbscans') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const tcbResults = await searchTCBScans(q);
        if (tcbResults.length > 0) {
          const tcbChapters = await getTCBScansChapters(tcbResults[0].id);
          if (tcbChapters.length > 0) {
            return NextResponse.json({
              chapters: tcbChapters,
              source: 'tcbscans',
              sourceName: 'TCB Scans (Ultra HQ Manga)',
              availableSources: standardAvailableSources,
              title: tcbResults[0].title,
              isManhwa: tcbResults[0].isManhwa,
              category: tcbResults[0].isManhwa ? 'manhwa' : 'manga'
            });
          }
        }
      } catch (err) {
        console.warn('TCB Scans specific fetch error:', err);
      }
    }
  }

  // User specifically requested Flame Comics
  if (requestedSource === 'flamecomics') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const fcResults = await searchFlameComics(q);
        if (fcResults.length > 0) {
          const fcChapters = await getFlameComicsChapters(fcResults[0].id);
          if (fcChapters.length > 0) {
            return NextResponse.json({
              chapters: fcChapters,
              source: 'flamecomics',
              sourceName: 'Flame Comics (Elite Manhwa & Scans)',
              availableSources: standardAvailableSources,
              title: fcResults[0].title,
              isManhwa: fcResults[0].isManhwa,
              category: fcResults[0].isManhwa ? 'manhwa' : 'manga'
            });
          }
        }
      } catch (err) {
        console.warn('Flame Comics specific fetch error:', err);
      }
    }
  }

  // User specifically requested ToonGod
  if (requestedSource === 'toongod') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const tgResults = await searchToonGod(q);
        if (tgResults.length > 0) {
          const tgChapters = await getToonGodChapters(tgResults[0].id);
          if (tgChapters.length > 0) {
            return NextResponse.json({
              chapters: tgChapters,
              source: 'toongod',
              sourceName: 'ToonGod (Korean Manhwa)',
              availableSources: standardAvailableSources,
              title: tgResults[0].title,
              isManhwa: true,
              category: 'manhwa'
            });
          }
        }
      } catch (err) {
        console.warn('ToonGod specific fetch error:', err);
      }
    }
  }

  // User specifically requested ManhwaBuddy
  if (requestedSource === 'manhwabuddy') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const mbResults = await searchManhwaBuddy(q);
        if (mbResults.length > 0) {
          const mbChapters = await getManhwaBuddyChapters(mbResults[0].id);
          if (mbChapters.length > 0) {
            return NextResponse.json({
              chapters: mbChapters,
              source: 'manhwabuddy',
              sourceName: 'ManhwaBuddy (Manhwa Hub)',
              availableSources: standardAvailableSources,
              title: mbResults[0].title,
              isManhwa: true,
              category: 'manhwa'
            });
          }
        }
      } catch (err) {
        console.warn('ManhwaBuddy specific fetch error:', err);
      }
    }
  }

  // User specifically requested MangaDistrict
  if (requestedSource === 'mangadistrict') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const mdResults = await searchMangaDistrict(q);
        if (mdResults.length > 0) {
          const normTitle = mangaTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
          const best =
            mdResults.find(r => r.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle) ||
            mdResults.find(r => {
              const rNorm = r.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              return (normTitle.length >= 4 && rNorm.includes(normTitle)) || (rNorm.length >= 4 && normTitle.includes(rNorm));
            }) ||
            mdResults[0];

          const mdChapters = await getMangaDistrictChapters(best.id);
          if (mdChapters.length > 0) {
            return NextResponse.json({
              chapters: mdChapters,
              source: 'mangadistrict',
              sourceName: 'MangaDistrict (Full Archive)',
              availableSources: standardAvailableSources,
              title: best.title || mangaTitle
            });
          }
        }
      } catch (err) {
        console.warn('MangaDistrict specific fetch error:', err);
      }
    }
  }

  // User specifically requested LINE Webtoons
  if (requestedSource === 'webtoons') {
    try {
      const wtSeries = await searchWebtoons(cleanSearchTitle);
      if (wtSeries) {
        const wtChapters = await getWebtoonsChapters(
          wtSeries.genre,
          wtSeries.slug,
          wtSeries.titleNo
        );
        if (wtChapters.length > 0) {
          return NextResponse.json({
            chapters: wtChapters,
            source: 'webtoons',
            sourceName: 'LINE Webtoons (Official Manhwa)',
            availableSources: standardAvailableSources,
            title: wtSeries.title,
            isManhwa: true,
            category: 'manhwa'
          });
        }
      }
    } catch (err) {
      console.warn('Webtoons specific fetch error:', err);
    }
  }

  // User specifically requested MangaPill
  if (requestedSource === 'mangapill') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const mpPath = await searchMangaPill(q);
        if (mpPath) {
          const mpChapters = await getMangaPillChapters(mpPath);
          if (mpChapters.length > 0) {
            return NextResponse.json({
              chapters: mpChapters,
              source: 'mangapill',
              sourceName: 'MangaPill (Fast Mirror)',
              availableSources: standardAvailableSources,
              title: cleanSearchTitle,
              isManhwa: false,
              category: 'manga'
            });
          }
        }
      } catch (err) {
        console.warn('MangaPill specific fetch error:', err);
      }
    }
  }

  // User specifically requested MangaKatana
  if (requestedSource === 'mangakatana') {
    for (const q of searchQueries.slice(0, 3)) {
      try {
        const mkResults = await searchMangaKatana(q);
        if (mkResults.length > 0) {
          const mkChapters = await getMangaKatanaChapters(mkResults[0].id);
          if (mkChapters.length > 0) {
            return NextResponse.json({
              chapters: mkChapters,
              source: 'mangakatana',
              sourceName: 'MangaKatana (Deep Archive)',
              availableSources: standardAvailableSources,
              title: mkResults[0].title
            });
          }
        }
      } catch (err) {
        console.warn('MangaKatana specific fetch error:', err);
      }
    }
  }

  // User specifically requested MangaDex
  if (requestedSource === 'mangadex') {
    const targetMangaId = MANGA_HOSTED_MAPPING[mangaId] || mangaId;
    if (isMangaDexUuid) {
      const mdChapters = await fetchMangaDexChapters(targetMangaId);
      if (mdChapters.length > 0) {
        return NextResponse.json({
          chapters: mdChapters,
          source: 'mangadex',
          sourceName: 'MangaDex (Official Catalog)',
          availableSources: standardAvailableSources,
          title: resolvedTitle
        });
      }
    }
  }

  // 6. Primary Strategy:
  // If mangaId is an exact MangaDex UUID, check if MangaDex hosts authentic English chapters starting from Chapter 1
  if (isMangaDexUuid && (requestedSource === 'auto' || requestedSource === 'mangadex')) {
    const targetMangaId = MANGA_HOSTED_MAPPING[mangaId] || mangaId;
    const mdChapters = await fetchMangaDexChapters(targetMangaId);
    const firstChapterNum = mdChapters.length > 0 ? mdChapters[0].chapterNumber : 999;

    if (mdChapters.length > 0 && firstChapterNum <= 2) {
      let isManhwa = false;
      try {
        const detailRes = await fetch(`https://api.mangadex.org/manga/${targetMangaId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const origLang = (detailData.data?.attributes?.originalLanguage || '').toLowerCase();
          const tags = (detailData.data?.attributes?.tags || []).map((t: MangaDexTag) => t.attributes?.name?.en || '');
          const isKoreanOrChinese = ['ko', 'zh', 'zh-hk'].includes(origLang);
          isManhwa = isKoreanOrChinese || tags.includes('Long Strip') || tags.includes('Web Comic') || tags.includes('Webtoon');
        }
      } catch {}

      return NextResponse.json({
        chapters: mdChapters,
        source: 'mangadex',
        sourceName: 'MangaDex (Official Catalog)',
        isManhwa,
        category: isManhwa ? 'manhwa' : 'manga',
        availableSources: standardAvailableSources,
        title: resolvedTitle
      });
    }
  }

  // Step 6A: Dedicated MangaDex search for adult manhwa (prioritized over mainstream manga mirrors)
  const isAdultManhwa =
    /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|touch to unlock|jinx|bj alex|painter of the night|pearl boy/i.test(cleanSearchTitle) ||
    /secret-class|boarding-diary|silent-war|circles|sweet-guy|bad-thinking|stepmother/i.test(mangaId);

  if (isAdultManhwa) {
    for (const q of searchQueries.slice(0, 4)) {
      try {
        const mdSearchUrl = `https://api.mangadex.org/manga?limit=10&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&title=${encodeURIComponent(q)}`;
        const mdRes = await fetch(mdSearchUrl, {
          headers: { 'User-Agent': 'ReadVerse/1.0 (readverse.app)' }
        });
        if (!mdRes.ok) continue;
        const mdData = await mdRes.json();
        const items: MangaDexItem[] = mdData.data || [];
        const qNorm = q.toLowerCase().replace(/[^a-z0-9]/g, '');
        const qWords = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

        let matchedItem: MangaDexItem | null = null;

        // 1. Exact normalized match
        for (const item of items) {
          const titles = [
            ...Object.values(item.attributes?.title || {}),
            ...(item.attributes?.altTitles || []).flatMap((at: Record<string, string>) => Object.values(at))
          ].map((t: string) => String(t).toLowerCase().replace(/[^a-z0-9]/g, ''));

          if (titles.includes(qNorm)) {
            matchedItem = item;
            break;
          }
        }

        // 2. Word overlap match (e.g. "Stepmother Friends" vs "Stepmother's Friends")
        if (!matchedItem && qWords.length > 0) {
          for (const item of items) {
            const allTitleStrs = [
              ...Object.values(item.attributes?.title || {}),
              ...(item.attributes?.altTitles || []).flatMap((at: Record<string, string>) => Object.values(at))
            ].map((t: string) => String(t).toLowerCase());

            if (allTitleStrs.some(str => qWords.every(w => str.includes(w)))) {
              matchedItem = item;
              break;
            }
          }
        }

        if (matchedItem) {
          const mdChs = await fetchMangaDexChapters(matchedItem.id);
          if (mdChs.length > 0) {
            const origLang = (matchedItem.attributes?.originalLanguage || '').toLowerCase();
            const tags = (matchedItem.attributes?.tags || []).map((t: MangaDexTag) => t.attributes?.name?.en || '');
            const isKoreanOrChinese = ['ko', 'zh', 'zh-hk'].includes(origLang);
            const isManhwa = isKoreanOrChinese || tags.includes('Long Strip') || tags.includes('Web Comic') || tags.includes('Webtoon') || isAdultManhwa;

            return NextResponse.json({
              chapters: mdChs,
              source: 'mangadex',
              sourceName: 'MangaDex (Official Catalog)',
              isManhwa,
              category: isManhwa ? 'manhwa' : 'manga',
              availableSources: standardAvailableSources,
              title: Object.values(matchedItem.attributes?.title || {})[0] || resolvedTitle
            });
          }
        }
      } catch (err) {
        console.warn('MangaDex adult manhwa search error:', err);
      }
    }
  }

  // Step 6B: WeebCentral (Complete chapters from Chapter 1 for popular manga/manhwa)
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const wcResults = await searchWeebCentral(q);
      if (wcResults.length > 0) {
        const wcChapters = await getWeebCentralChapters(wcResults[0].id);
        if (wcChapters.length > 0) {
          const isManhwa =
            wcResults[0].isManhwa ||
            /unordinary|tower of god|solo leveling|lookism|beginning after the end|eleceed|wind breaker|omniscient|god of highschool|bastard|sweet home|nano machine/i.test(wcResults[0].title);
          return NextResponse.json({
            chapters: wcChapters,
            source: 'weebcentral',
            sourceName: 'WeebCentral (HQ Scans)',
            isManhwa,
            category: isManhwa ? 'manhwa' : 'manga',
            availableSources: standardAvailableSources,
            title: wcResults[0].title
          });
        }
      }
    } catch (err) {
      console.warn('WeebCentral search error:', err);
    }
  }

  // Step 6B2: TCB Scans (Ultra HQ Shonen & mainstream manga)
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const tcbResults = await searchTCBScans(q);
      if (tcbResults.length > 0) {
        const tcbChapters = await getTCBScansChapters(tcbResults[0].id);
        if (tcbChapters.length > 0) {
          return NextResponse.json({
            chapters: tcbChapters,
            source: 'tcbscans',
            sourceName: 'TCB Scans (Ultra HQ Manga)',
            isManhwa: tcbResults[0].isManhwa,
            category: tcbResults[0].isManhwa ? 'manhwa' : 'manga',
            availableSources: standardAvailableSources,
            title: tcbResults[0].title
          });
        }
      }
    } catch (err) {
      console.warn('TCB Scans failover error:', err);
    }
  }

  // Step 6B3: Flame Comics (Elite Manhwa & Scans)
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const fcResults = await searchFlameComics(q);
      if (fcResults.length > 0) {
        const fcChapters = await getFlameComicsChapters(fcResults[0].id);
        if (fcChapters.length > 0) {
          return NextResponse.json({
            chapters: fcChapters,
            source: 'flamecomics',
            sourceName: 'Flame Comics (Elite Manhwa & Scans)',
            isManhwa: fcResults[0].isManhwa,
            category: fcResults[0].isManhwa ? 'manhwa' : 'manga',
            availableSources: standardAvailableSources,
            title: fcResults[0].title
          });
        }
      }
    } catch (err) {
      console.warn('Flame Comics failover error:', err);
    }
  }

  // Step 6B4: ToonGod (Korean Manhwa / Webtoon Archive)
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const tgResults = await searchToonGod(q);
      if (tgResults.length > 0) {
        const tgChapters = await getToonGodChapters(tgResults[0].id);
        if (tgChapters.length > 0) {
          return NextResponse.json({
            chapters: tgChapters,
            source: 'toongod',
            sourceName: 'ToonGod (Korean Manhwa)',
            isManhwa: true,
            category: 'manhwa',
            availableSources: standardAvailableSources,
            title: tgResults[0].title
          });
        }
      }
    } catch (err) {
      console.warn('ToonGod failover error:', err);
    }
  }

  // Step 6B5: ManhwaBuddy (Dedicated Manhwa Hub)
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const mbResults = await searchManhwaBuddy(q);
      if (mbResults.length > 0) {
        const mbChapters = await getManhwaBuddyChapters(mbResults[0].id);
        if (mbChapters.length > 0) {
          return NextResponse.json({
            chapters: mbChapters,
            source: 'manhwabuddy',
            sourceName: 'ManhwaBuddy (Manhwa Hub)',
            isManhwa: true,
            category: 'manhwa',
            availableSources: standardAvailableSources,
            title: mbResults[0].title
          });
        }
      }
    } catch (err) {
      console.warn('ManhwaBuddy failover error:', err);
    }
  }

  // Step 6C: MangaKatana (Massive 40k+ library)
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const mkResults = await searchMangaKatana(q);
      if (mkResults.length > 0) {
        const mkChapters = await getMangaKatanaChapters(mkResults[0].id);
        if (mkChapters.length > 0) {
          const isManhwa =
            mkResults[0].isManhwa ||
            /unordinary|tower of god|solo leveling|lookism|beginning after the end|eleceed|wind breaker|omniscient|god of highschool|bastard|sweet home|nano machine/i.test(mkResults[0].title);
          return NextResponse.json({
            chapters: mkChapters,
            source: 'mangakatana',
            sourceName: 'MangaKatana (Fast Mirror)',
            isManhwa,
            category: isManhwa ? 'manhwa' : 'manga',
            availableSources: standardAvailableSources,
            title: mkResults[0].title
          });
        }
      }
    } catch (err) {
      console.warn('MangaKatana failover error:', err);
    }
  }

  // Step 6C: MangaDex Catalog (Exact UUID or Title Search across all ratings including 18+ adult manhwa)
  if (isMangaDexUuid) {
    const targetMangaId = MANGA_HOSTED_MAPPING[mangaId] || mangaId;
    const mdChapters = await fetchMangaDexChapters(targetMangaId);
    if (mdChapters.length > 0) {
      const isManhwa =
        isManhwaFromMangaDex ||
        /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|solo leveling|lookism|tower of god|eleceed|wind breaker|nano machine|touch to unlock|jinx|bj alex|painter of the night|pearl boy|mercenary enrollment|villain to kill/i.test(resolvedTitle);
      return NextResponse.json({
        chapters: mdChapters,
        source: 'mangadex',
        sourceName: 'MangaDex (Official Catalog)',
        isManhwa,
        category: isManhwa ? 'manhwa' : 'manga',
        availableSources: standardAvailableSources,
        title: resolvedTitle
      });
    }
  }

  // Search MangaDex by Title with full adult / erotica / webtoon coverage
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const mdSearchUrl = `https://api.mangadex.org/manga?limit=10&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&title=${encodeURIComponent(q)}`;
      const mdRes = await fetch(mdSearchUrl, {
        headers: { 'User-Agent': 'ReadVerse/1.0 (readverse.app)' }
      });
      if (!mdRes.ok) continue;
      const mdData = await mdRes.json();
      const items: MangaDexItem[] = mdData.data || [];
      const qNorm = q.toLowerCase().replace(/[^a-z0-9]/g, '');
      const qWords = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

      let matchedItem: MangaDexItem | null = null;

      // 1. Exact normalized match
      for (const item of items) {
        const titles = [
          ...Object.values(item.attributes?.title || {}),
          ...(item.attributes?.altTitles || []).flatMap((at: Record<string, string>) => Object.values(at))
        ].map((t: string) => String(t).toLowerCase().replace(/[^a-z0-9]/g, ''));

        if (titles.includes(qNorm)) {
          matchedItem = item;
          break;
        }
      }

      // 2. Word overlap match (e.g. "Stepmother Friends" vs "Stepmother's Friends")
      if (!matchedItem && qWords.length > 0) {
        for (const item of items) {
          const allTitleStrs = [
            ...Object.values(item.attributes?.title || {}),
            ...(item.attributes?.altTitles || []).flatMap((at: Record<string, string>) => Object.values(at))
          ].map((t: string) => String(t).toLowerCase());

          if (allTitleStrs.some(str => qWords.every(w => str.includes(w)))) {
            matchedItem = item;
            break;
          }
        }
      }

      if (matchedItem) {
        const mdChs = await fetchMangaDexChapters(matchedItem.id);
        if (mdChs.length > 0) {
          const origLang = (matchedItem.attributes?.originalLanguage || '').toLowerCase();
          const tags = (matchedItem.attributes?.tags || []).map((t: MangaDexTag) => t.attributes?.name?.en || '');
          const isKoreanOrChinese = ['ko', 'zh', 'zh-hk'].includes(origLang);
          const isManhwa = isKoreanOrChinese || tags.includes('Long Strip') || tags.includes('Web Comic') || tags.includes('Webtoon');

          return NextResponse.json({
            chapters: mdChs,
            source: 'mangadex',
            sourceName: 'MangaDex (Official Catalog)',
            isManhwa,
            category: isManhwa ? 'manhwa' : 'manga',
            availableSources: standardAvailableSources,
            title: Object.values(matchedItem.attributes?.title || {})[0] || resolvedTitle
          });
        }
      }
    } catch (err) {
      console.warn('MangaDex title search error:', err);
    }
  }

  // Step 6D: LINE Webtoons (Korean Manhwa official strips)
  try {
    const wtSeries = await searchWebtoons(cleanSearchTitle);
    if (wtSeries) {
      const wtChapters = await getWebtoonsChapters(
        wtSeries.genre,
        wtSeries.slug,
        wtSeries.titleNo
      );
      if (wtChapters.length > 0) {
        return NextResponse.json({
          chapters: wtChapters,
          source: 'webtoons',
          sourceName: 'LINE Webtoons Official',
          isManhwa: true,
          category: 'manhwa',
          availableSources: standardAvailableSources,
          title: wtSeries.title
        });
      }
    }
  } catch (err) {
    console.warn('Webtoons failover error:', err);
  }

  // Step 6E: MangaPill (Japanese Manga only - skip if clearly a manhwa or adult manhwa)
  const isLikelyManhwa =
    mangaId.includes('manhwa') ||
    mangaId.startsWith('companion-') ||
    /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|touch to unlock|jinx|bj alex|painter of the night|pearl boy/i.test(cleanSearchTitle);

  if (!isLikelyManhwa) {
    try {
      const mpPath = await searchMangaPill(cleanSearchTitle);
      if (mpPath) {
        const mpChapters = await getMangaPillChapters(mpPath);
        if (mpChapters.length > 0) {
          return NextResponse.json({
            chapters: mpChapters,
            source: 'mangapill',
            sourceName: 'MangaPill Mirror',
            isManhwa: false,
            category: 'manga',
            availableSources: standardAvailableSources,
            title: cleanSearchTitle
          });
        }
      }
    } catch (err) {
      console.warn('MangaPill failover error:', err);
    }
  }

  // No sources yielded chapters - return clean empty response (never fake Unsplash stubs)
  return NextResponse.json({
    chapters: [],
    source: 'none',
    sourceName: 'Unavailable',
    availableSources: standardAvailableSources,
    title: resolvedTitle
  });
}

/**
 * Helper to fetch English hosted chapters from MangaDex
 */
async function fetchMangaDexChapters(targetMangaId: string) {
  try {
    const feedUrl = `https://api.mangadex.org/manga/${targetMangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
    const feedRes = await fetch(feedUrl, {
      headers: { 'User-Agent': 'ReadVerse/1.0 (readverse.app)' },
      cache: 'no-store'
    });

    if (!feedRes.ok) return [];

    const feedData = await feedRes.json();
    const allChapters: MangaDexRawChapter[] = feedData.data || [];

    const rawChapters = allChapters.filter(
      c =>
        c.attributes?.translatedLanguage === 'en' &&
        (c.attributes?.pages ?? 0) > 0 &&
        !c.attributes?.externalUrl
    );

    // Deduplicate duplicate chapter uploads from different scanlation groups
    const dedupedMap = new Map<number, MangaDexRawChapter>();
    for (const c of rawChapters) {
      const num = parseFloat(c.attributes?.chapter || '0');
      const existing = dedupedMap.get(num);
      if (!existing || (c.attributes?.pages ?? 0) > (existing.attributes?.pages ?? 0)) {
        dedupedMap.set(num, c);
      }
    }
    const dedupedChapters = Array.from(dedupedMap.values());

    // Sort ascending
    dedupedChapters.sort((a, b) => {
      const numA = parseFloat(a.attributes?.chapter || '0');
      const numB = parseFloat(b.attributes?.chapter || '0');
      return numA - numB;
    });

    return dedupedChapters.map((c, index) => {
      const chNum = parseFloat(c.attributes?.chapter || `${index + 1}`);
      const chTitle = c.attributes?.title
        ? `Chapter ${chNum}: ${c.attributes.title}`
        : `Chapter ${chNum}`;

      return {
        id: c.id,
        title: chTitle,
        chapterNumber: chNum || index + 1,
        content: []
      };
    });
  } catch (err) {
    console.warn('MangaDex fetch chapters error:', err);
    return [];
  }
}
