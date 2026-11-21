import { NextResponse } from 'next/server';
import { searchWeebCentral } from '@/utils/weebcentral';
import { searchMangaKatana } from '@/utils/mangakatana';
import { searchWebtoonsDetailed } from '@/utils/webtoons';
import { searchMangaPillDetailed } from '@/utils/mangapill';
import { searchAniListManga } from '@/utils/anilistManga';
import { searchTCBScans } from '@/utils/tcbscans';
import { searchFlameComics } from '@/utils/flamecomics';
import { searchToonGod } from '@/utils/toongod';
import { searchManhwaBuddy } from '@/utils/manhwabuddy';
import { searchMangaDistrict } from '@/utils/mangadistrict';
import { FAMOUS_MANHWA, FAMOUS_MANGA } from '@/data/famousCatalog';
import { Book } from '@/types';

interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: {
    fileName?: string;
    name?: string;
  };
}

// In-memory cache for live searches (TTL: 5 minutes)
interface MangaSearchCacheEntry {
  timestamp: number;
  books: Book[];
}
const mangaSearchCache = new Map<string, MangaSearchCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface MangaDexItem {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    description?: Record<string, string>;
    originalLanguage?: string;
    tags?: Array<{ attributes?: { name?: { en?: string } } }>;
  };
  relationships?: MangaDexRelationship[];
}

// Resilient fallback catalog when external APIs are down or rate-limited
const BACKUP_MANGA_CATALOG: Book[] = [
  {
    id: '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0',
    title: 'Solo Leveling',
    author: 'Chugong, DUBU (REDICE)',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg',
    description: '10 years ago, after the Gate opened, some ordinary people received the power to hunt monsters. Sung Jin-woo, an E-rank hunter known as the weakest, unlocks the Player System.',
    genre: ['Action', 'Fantasy', 'Supernatural'],
    rating: 4.95,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'tower-of-god',
    title: 'Tower of God',
    author: 'SIU',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85143-23oup3ETbFJk.jpg',
    description: 'What do you desire? Money and wealth? Honor and pride? Authority and power? Whatever you desire is atop the Tower.',
    genre: ['Fantasy', 'Action', 'Adventure'],
    rating: 4.9,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'omniscient-readers-viewpoint',
    title: 'Omniscient Reader\'s Viewpoint',
    author: 'sing N song, Sleepy-C',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg',
    description: 'Only I know the end of this world. One day, our protagonist finds himself stuck in the world of his favorite apocalyptic webnovel.',
    genre: ['Action', 'Fantasy', 'Isekai'],
    rating: 4.92,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'beginning-after-the-end',
    title: 'The Beginning After The End',
    author: 'TurtleMe, Fuyuki23',
    category: 'manhwa',
    coverImage: 'https://uploads.mangadex.org/covers/4ada20eb-085a-491a-8c49-477ab42014d7/4298e756-edf0-4bd6-9b83-340bfdb27771.jpg.512.jpg',
    description: 'King Grey has unrivaled strength, wealth, and prestige. Reborn into a new world filled with magic and monsters, the king has a second chance to relive his life.',
    genre: ['Action', 'Fantasy', 'Reincarnation'],
    rating: 4.94,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'eleceed-manhwa',
    title: 'Eleceed',
    author: 'Son Jeho, ZHENA',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106929-flAUvHZDUz5v.jpg',
    description: 'Jiwoo is a kind-hearted young man with lightning-quick reflexes. Kayden is a secret agent stuck in the body of a fat, fluffy street cat.',
    genre: ['Action', 'Supernatural', 'Comedy'],
    rating: 4.91,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'wind-breaker-manhwa',
    title: 'Wind Breaker',
    author: 'Jo Yongseok',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx135083-TQbNFWKGJJHW.jpg',
    description: 'Jay is an honors student pressured by his parents, until he is introduced to high-speed street biking.',
    genre: ['Sports', 'Drama', 'Action'],
    rating: 4.89,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'berserk-manga',
    title: 'Berserk',
    author: 'Kentaro Miura',
    category: 'manga',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg',
    description: 'Guts, a former mercenary now known as the "Black Swordsman," is out for revenge. He journeys across a dark medieval world armed with a titanic sword.',
    genre: ['Dark Fantasy', 'Action', 'Gothic'],
    rating: 4.98,
    pointsPerChapter: 1.0,
    chapters: []
  },
  {
    id: 'one-piece-manga',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    category: 'manga',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-BeslEMqiPhlk.jpg',
    description: 'Gol D. Roger, the King of the Pirates, left the greatest treasure in the world: One Piece. Monkey D. Luffy sets out across the Grand Line.',
    genre: ['Adventure', 'Fantasy', 'Shounen'],
    rating: 4.96,
    pointsPerChapter: 1.0,
    chapters: []
  },
  {
    id: 'jujutsu-kaisen-manga',
    title: 'Jujutsu Kaisen',
    author: 'Gege Akutami',
    category: 'manga',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg',
    description: 'Yuji Itadori swallows a cursed talisman—the finger of a demon—and becomes cursed himself. He enters a shaman school to track down the demon\'s other body parts.',
    genre: ['Action', 'Supernatural', 'Dark Fantasy'],
    rating: 4.93,
    pointsPerChapter: 1.0,
    chapters: []
  },
  {
    id: 'chainsaw-man-manga',
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    category: 'manga',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png',
    description: 'Denji was a small-time devil hunter just trying to survive in a harsh world. After being killed on a job, he is revived by his pet devil Pochita with chainsaw powers.',
    genre: ['Action', 'Gore', 'Supernatural'],
    rating: 4.92,
    pointsPerChapter: 1.0,
    chapters: []
  }
];

function resolveEnglishTitle(
  titleObj: Record<string, string> = {},
  altTitles: Array<Record<string, string>> = []
): string {
  if (titleObj.en && titleObj.en.trim()) {
    return titleObj.en.trim();
  }

  const altEn = altTitles.find(a => a.en && typeof a.en === 'string' && a.en.trim())?.en;
  if (altEn && altEn.trim()) {
    return altEn.trim();
  }

  for (const [k, v] of Object.entries(titleObj)) {
    if (k.toLowerCase().startsWith('en') && v && v.trim()) {
      return v.trim();
    }
  }
  for (const a of altTitles) {
    for (const [k, v] of Object.entries(a)) {
      if (k.toLowerCase().startsWith('en') && v && typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
  }

  const romanizedKeys = ['ja-ro', 'ko-ro', 'zh-ro'];
  for (const rk of romanizedKeys) {
    if (titleObj[rk] && titleObj[rk].trim()) return titleObj[rk].trim();
  }
  for (const a of altTitles) {
    for (const rk of romanizedKeys) {
      if (a[rk] && typeof a[rk] === 'string' && a[rk].trim()) return a[rk].trim();
    }
  }

  return Object.values(titleObj)[0]?.trim() || 'Untitled Manga';
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || 'all';
  const source = (searchParams.get('source') || 'all').toLowerCase().trim();

  // For the home screen (no active search query), exclusively return verified famous titles
  if (!query) {
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
    };
    if (category === 'manhwa') {
      return NextResponse.json({ books: FAMOUS_MANHWA }, { headers: cacheHeaders });
    }
    if (category === 'manga') {
      return NextResponse.json({ books: FAMOUS_MANGA }, { headers: cacheHeaders });
    }
    return NextResponse.json({ books: [...FAMOUS_MANHWA, ...FAMOUS_MANGA] }, { headers: cacheHeaders });
  }

  // Check in-memory query cache (only if cached result had actual books)
  const cacheKey = `${query.toLowerCase()}_${category}_${source}`;
  const cached = mangaSearchCache.get(cacheKey);
  if (cached && cached.books.length > 0 && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { books: cached.books, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  }

  const collectedBooks: Book[] = [];
  const booksByNorm = new Map<string, Book>();

  function registerOrMergeBook(norm: string, book: Book) {
    if (!norm) return;
    if (source !== 'all') {
      // When searching a specific source, keep all candidate variations so users can pick their preferred edition
      if (!collectedBooks.some(b => b.id === book.id)) {
        collectedBooks.push(book);
      }
      return;
    }

    const existing = booksByNorm.get(norm);
    if (existing) {
      // If the existing book has an empty or invalid cover and the new book has a real cover, adopt it as primary
      if ((!existing.coverImage || existing.coverImage.includes('unsplash.com')) && book.coverImage && !book.coverImage.includes('unsplash.com')) {
        existing.coverImage = book.coverImage;
      } else if (book.coverImage && book.coverImage !== existing.coverImage && !book.coverImage.includes('unsplash.com')) {
        if (!existing.alternativeCovers) {
          existing.alternativeCovers = [];
        }
        if (!existing.alternativeCovers.includes(book.coverImage)) {
          existing.alternativeCovers.push(book.coverImage);
        }
      }

      // Also merge any alternativeCovers from the incoming book
      if (book.alternativeCovers && book.alternativeCovers.length > 0) {
        if (!existing.alternativeCovers) {
          existing.alternativeCovers = [];
        }
        for (const alt of book.alternativeCovers) {
          if (alt && alt !== existing.coverImage && !existing.alternativeCovers.includes(alt) && !alt.includes('unsplash.com')) {
            existing.alternativeCovers.push(alt);
          }
        }
      }
      return;
    }

    booksByNorm.set(norm, book);
    collectedBooks.push(book);
  }

  // 1. Primary Source: MangaDex (skip if another specific source was requested)
  if (source === 'all' || source === 'mangadex') {
    try {
      let url = `https://api.mangadex.org/manga?limit=16&includes[]=cover_art&includes[]=author&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&availableTranslatedLanguage[]=en`;

      if (category === 'manhwa') {
        url += `&originalLanguage[]=ko`;
      } else if (category === 'manga') {
        url += `&originalLanguage[]=ja`;
      }

      if (query) {
        url += `&title=${encodeURIComponent(query)}`;
      } else {
        url += `&order[followedCount]=desc`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ReadVerse/1.0 (readverse.app)'
        },
        next: { revalidate: 300 }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        for (const m of (data.data || []) as MangaDexItem[]) {
          const title = resolveEnglishTitle(m.attributes?.title, m.attributes?.altTitles);
          const norm = normalizeTitle(title);
          if (!norm) continue;

          const desc =
            m.attributes?.description?.en?.split('\n\n---')[0]?.slice(0, 240) ||
            'No synopsis available for this title.';

          const coverRel = m.relationships?.find((r: MangaDexRelationship) => r.type === 'cover_art');
          const coverFileName = coverRel?.attributes?.fileName;
          const coverImage = coverFileName
            ? `https://uploads.mangadex.org/covers/${m.id}/${coverFileName}.512.jpg`
            : '';

          const authorRel = m.relationships?.find((r: MangaDexRelationship) => r.type === 'author');
          const author = authorRel?.attributes?.name || 'MangaDex Artist';

          const tags = (m.attributes?.tags || []).map((t: { attributes?: { name?: { en?: string } } }) => t.attributes?.name?.en || '');
          const origLang = (m.attributes?.originalLanguage || '').toLowerCase();
          const isJapanese = origLang === 'ja';
          const hasLongStrip = tags.includes('Long Strip');
          const isKoreanOrChinese = ['ko', 'zh', 'zh-hk'].includes(origLang);
          const isKnownWebtoon = /unordinary|tower of god|solo leveling|lookism|beginning after the end|eleceed|wind breaker|omniscient|god of highschool|bastard|sweet home|nano machine/i.test(title);

          const isManhwa = !isJapanese
            ? (isKoreanOrChinese || hasLongStrip || tags.includes('Webtoon') || isKnownWebtoon)
            : hasLongStrip;

          registerOrMergeBook(norm, {
            id: m.id,
            title,
            author,
            category: isManhwa ? 'manhwa' : 'manga',
            coverImage,
            alternativeCovers: [],
            description: desc,
            genre: tags.slice(0, 3),
            rating: 4.8,
            pointsPerChapter: isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }
    } catch (err) {
      console.warn('MangaDex API error in search:', err);
    }
  }

  // 2. Parallel Secondary Sources: WeebCentral, MangaKatana, LINE Webtoons, MangaPill, TCB Scans, Flame Comics, ToonGod, ManhwaBuddy & AniList
  if (query && source !== 'mangadex') {
    try {
      const runAll = source === 'all';
      const emptyResolved = Promise.resolve([]);

      const [wcResults, mkResults, wtResults, mpResults, alResults, tcbResults, fcResults, tgResults, mbResults, mdResults] = await Promise.allSettled([
        runAll || source === 'weebcentral' ? searchWeebCentral(query) : emptyResolved,
        runAll || source === 'mangakatana' ? searchMangaKatana(query) : emptyResolved,
        runAll || source === 'webtoons' ? searchWebtoonsDetailed(query) : emptyResolved,
        runAll || source === 'mangapill' ? searchMangaPillDetailed(query) : emptyResolved,
        runAll || source === 'anilist' ? searchAniListManga(query, category) : emptyResolved,
        runAll || source === 'tcbscans' ? searchTCBScans(query) : emptyResolved,
        runAll || source === 'flamecomics' ? searchFlameComics(query) : emptyResolved,
        runAll || source === 'toongod' ? searchToonGod(query) : emptyResolved,
        runAll || source === 'manhwabuddy' ? searchManhwaBuddy(query) : emptyResolved,
        runAll || source === 'mangadistrict' ? searchMangaDistrict(query) : emptyResolved
      ]);

      // WeebCentral HQ Scans
      if (wcResults.status === 'fulfilled') {
        for (const s of wcResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: `wc-${s.id}`,
            title: s.title,
            author: 'WeebCentral Scans',
            category: s.isManhwa ? 'manhwa' : 'manga',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Official English high-resolution scanlation from the WeebCentral catalog.`,
            genre: s.isManhwa ? ['Manhwa', 'Webtoon'] : ['Manga', 'Action'],
            rating: 4.9,
            pointsPerChapter: s.isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }

      // LINE Webtoons (Official Manhwa Strips)
      if (wtResults.status === 'fulfilled') {
        for (const s of wtResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'LINE Webtoon Original',
            category: 'manhwa',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Official English digital release on LINE Webtoon (${s.genre.toUpperCase()}).`,
            genre: [s.genre.charAt(0).toUpperCase() + s.genre.slice(1), 'Manhwa', 'Webtoon'],
            rating: 4.92,
            pointsPerChapter: 1.5,
            chapters: []
          });
        }
      }

      // MangaPill (Fast Japanese Manga Mirror)
      if (mpResults.status === 'fulfilled') {
        for (const s of mpResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'MangaPill Scans',
            category: s.isManhwa ? 'manhwa' : 'manga',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Complete digital tankobon edition indexed via MangaPill.`,
            genre: s.isManhwa ? ['Manhwa', 'Webtoon'] : ['Manga', 'Action'],
            rating: 4.88,
            pointsPerChapter: s.isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }

      // MangaKatana (Massive 40k+ Deep Archive)
      if (mkResults.status === 'fulfilled') {
        for (const s of mkResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: `mk-${s.id}`,
            title: s.title,
            author: 'MangaKatana',
            category: s.isManhwa ? 'manhwa' : 'manga',
            coverImage: s.coverImage || '',
            alternativeCovers: [],
            description: s.description || 'Full catalog edition available with complete chapter archive via MangaKatana.',
            genre: s.genres.length > 0 ? s.genres : ['Manga'],
            rating: 4.85,
            pointsPerChapter: s.isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }

      // TCB Scans (Ultra HQ Shonen & Mainstream Scans)
      if (tcbResults.status === 'fulfilled') {
        for (const s of tcbResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'TCB Scans',
            category: s.isManhwa ? 'manhwa' : 'manga',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Ultra-high-definition official release & scanlation from TCB Scans.`,
            genre: s.isManhwa ? ['Manhwa', 'Action'] : ['Manga', 'Shounen', 'Action'],
            rating: 4.96,
            pointsPerChapter: s.isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }

      // Flame Comics (Premier Manhwa & Manga Scans)
      if (fcResults.status === 'fulfilled') {
        for (const s of fcResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'Flame Comics',
            category: s.isManhwa ? 'manhwa' : 'manga',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: s.description,
            genre: s.genres.length > 0 ? s.genres : ['Manhwa', 'Action'],
            rating: 4.92,
            pointsPerChapter: s.isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }

      // ToonGod (Massive Korean Webtoon / Manhwa Archive)
      if (tgResults.status === 'fulfilled') {
        for (const s of tgResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'ToonGod Webtoons',
            category: 'manhwa',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Complete digital webtoon edition indexed via ToonGod.`,
            genre: ['Manhwa', 'Webtoon', 'Action'],
            rating: 4.89,
            pointsPerChapter: 1.5,
            chapters: []
          });
        }
      }

      // ManhwaBuddy (Dedicated Korean Manhwa Hub)
      if (mbResults.status === 'fulfilled') {
        for (const s of mbResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'ManhwaBuddy',
            category: 'manhwa',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Full manhwa release archive available via ManhwaBuddy.`,
            genre: ['Manhwa', 'Webtoon', 'Fantasy'],
            rating: 4.91,
            pointsPerChapter: 1.5,
            chapters: []
          });
        }
      }

      // MangaDistrict (Full Manga & Manhwa Catalog)
      if (mdResults.status === 'fulfilled') {
        for (const s of mdResults.value) {
          const norm = normalizeTitle(s.title);
          registerOrMergeBook(norm, {
            id: s.id,
            title: s.title,
            author: 'MangaDistrict Scans',
            category: s.isManhwa ? 'manhwa' : 'manga',
            coverImage: s.coverImage,
            alternativeCovers: [],
            description: `Full digital edition available via MangaDistrict with complete chapter archive.`,
            genre: s.isManhwa ? ['Manhwa', 'Webtoon', 'Action'] : ['Manga', 'Action'],
            rating: 4.88,
            pointsPerChapter: s.isManhwa ? 1.5 : 1.0,
            chapters: []
          });
        }
      }

      // AniList (Global Comprehensive Manga & 18+ Manhwa Catalog)
      if (alResults.status === 'fulfilled') {
        for (const b of alResults.value) {
          const norm = normalizeTitle(b.title);
          registerOrMergeBook(norm, b);
        }
      }
    } catch (err) {
      console.warn('Secondary sources search error:', err);
    }
  }

  // Filter by category only if searching all sources (preserve all source-specific results)
  const finalBooks =
    category === 'all' || source !== 'all'
      ? collectedBooks
      : collectedBooks.filter(b => b.category === category);

  if (finalBooks.length > 0) {
    mangaSearchCache.set(cacheKey, { timestamp: Date.now(), books: finalBooks });
    return NextResponse.json(
      { books: finalBooks },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  }

  // If a specific source was requested and had 0 results, return empty array without injecting backup catalog
  if (source !== 'all') {
    return NextResponse.json({ books: [] });
  }

  // Multi-source fallback: Return backup catalog filtered by query and category
  const filtered = BACKUP_MANGA_CATALOG.filter(b => {
    const matchesCategory = category === 'all' || b.category === category;
    const matchesQuery =
      !query ||
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const resultBooks = filtered.length > 0 ? filtered : BACKUP_MANGA_CATALOG;
  mangaSearchCache.set(cacheKey, { timestamp: Date.now(), books: resultBooks });
  return NextResponse.json({
    books: resultBooks,
    source: 'backup-mirror'
  });
}
