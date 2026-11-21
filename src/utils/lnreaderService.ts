import { createRuntime, type Runtime } from '@lnreader/plugin-runtime';
import * as cheerio from 'cheerio';
import { Book, Chapter } from '../types';

let runtimeInstance: Runtime | null = null;
let runtimePromise: Promise<Runtime> | null = null;

export async function getLNRuntime(): Promise<Runtime> {
  if (runtimeInstance) return runtimeInstance;
  if (!runtimePromise) {
    runtimePromise = createRuntime().then(rt => {
      runtimeInstance = rt;
      return rt;
    });
  }
  return runtimePromise;
}

export function cleanHtmlToParagraphs(rawHtml: string): string[] {
  if (!rawHtml) return [];
  const $ = cheerio.load(rawHtml);

  // Remove non-narrative elements
  $('script, style, iframe, noscript, .ads, .ad, [class*="ad-"], [id*="ad-"], .advertisement, [class*="app-promo"]').remove();

  const paragraphs: string[] = [];

  $('body').find('h1, h2, h3, h4, h5, h6, p, hr, img, blockquote').each((_, el) => {
    const tag = el.tagName.toLowerCase();

    if (tag === 'img') {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !/spacer|pixel|blank/i.test(src)) {
        paragraphs.push(`[image: ${src}]`);
      }
      return;
    }

    if (tag === 'hr') {
      if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] !== '---') {
        paragraphs.push('---');
      }
      return;
    }

    if (tag.startsWith('h')) {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt) paragraphs.push(`### ${txt}`);
      return;
    }

    if (tag === 'p' || tag === 'blockquote') {
      const nestedImg = $(el).find('img');
      if (nestedImg.length > 0) {
        const src = nestedImg.attr('src') || nestedImg.attr('data-src');
        if (src && !/spacer|pixel|blank/i.test(src)) {
          paragraphs.push(`[image: ${src}]`);
          return;
        }
      }

      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;

      if (/^(\*|\-|_|•|◆|♦|✦|\~|\#){3,}$/i.test(text) || text === '* * *' || text === '***') {
        if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] !== '---') {
          paragraphs.push('---');
        }
        return;
      }

      paragraphs.push(text);
    }
  });

  if (paragraphs.length === 0) {
    // If no tags, split text by double newlines or breaks
    $('br').replaceWith('\n');
    const fullText = $('body').text() || $.text();
    const parts = fullText
      .split(/\n\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return parts;
  }

  return paragraphs;
}

export interface WebnovelSourceInfo {
  id: string;
  name: string;
  site: string;
  description: string;
}

// Top verified high-speed webnovel and light novel scrapers
export const ACTIVE_WEBNOVEL_SOURCES: WebnovelSourceInfo[] = [
  {
    id: 'royalroad',
    name: 'Royal Road',
    site: 'https://www.royalroad.com/',
    description: 'Premier home of original English fantasy, sci-fi, LitRPG, and progression fiction.'
  },
  {
    id: 'novelbuddy',
    name: 'NovelBuddy',
    site: 'https://novelbuddy.me/',
    description: 'Premier webnovel catalog with complete thousands-chapter archives.'
  },
  {
    id: 'anf.net',
    name: 'AllNovelFull',
    site: 'https://novgo.net/',
    description: 'High-speed mirror with extensive translations of Asian webnovels.'
  },
  {
    id: 'novelfire',
    name: 'Novel Fire',
    site: 'https://novelfire.net/',
    description: 'Modern reading platform with clean formatting and ongoing releases.'
  },
  {
    id: 'novelarchive',
    name: 'Novel Archive',
    site: 'https://novelarchive.cc',
    description: 'Huge digital archive of light novels and cultivation sagas.'
  },
  {
    id: 'novelcool',
    name: 'NovelCool',
    site: 'https://novelcool.com/',
    description: 'Global light novel library with daily chapter updates.'
  },
  {
    id: 'asuralightnovel',
    name: 'Asura Light Novels',
    site: 'https://srankmanga.com/',
    description: 'Dedicated source for Korean action and necromancy webnovels.'
  },
  {
    id: 'cotereader',
    name: 'COTE Reader',
    site: 'https://cote-reader.me/',
    description: 'Specialized source for Japanese school and psychological light novels.'
  },
  {
    id: 'lightnovelto',
    name: 'LightNovel.to',
    site: 'https://lightnovel.to/',
    description: 'Premier Japanese light novel archive with official volume translations and high-speed delivery.'
  },
  {
    id: 'bakatsuki',
    name: 'Baka-Tsuki',
    site: 'https://www.baka-tsuki.org/project/',
    description: 'Legendary community-translated Japanese light novel archive.'
  },
  {
    id: 'novelight',
    name: 'Novelight',
    site: 'https://novelight.net/',
    description: 'Fast Japanese light novel releases with volume illustrations and clean reader formatting.'
  },
  {
    id: 'novelping',
    name: 'Novel Ping',
    site: 'https://novelping.com/',
    description: 'Extensive library of licensed and fan-translated Japanese light novel series.'
  },
  {
    id: 'readnovelfull',
    name: 'ReadNovelFull',
    site: 'https://readnovelfull.com/',
    description: 'Comprehensive catalog of translated light novels and ongoing fantasy sagas.'
  },
  {
    id: 'konkon',
    name: 'Konkon',
    site: 'https://konkon.ink',
    description: 'Specialized Japanese isekai, fantasy, and magic light novel translations.'
  },
  {
    id: 'ReLib',
    name: 'Re:Library',
    site: 'https://re-library.com',
    description: 'Prominent fan translation library for authentic Japanese light novel series.'
  },
  {
    id: 'lnheaven',
    name: 'LightNovelHeaven',
    site: 'https://lightnovelheaven.com/',
    description: 'High-speed light novel mirror with clean typesetting and volume chapters.'
  },
  {
    id: 'sylthorian',
    name: 'The Sylthorian',
    site: 'https://thesylthorian.com',
    description: 'Premier translator for Japanese magic academy and reincarnation sagas.'
  },
  {
    id: 'sleeptTLS',
    name: 'SleepyTranslations',
    site: 'https://sleepytranslations.com/',
    description: 'Dedicated source for Japanese academy, school, and fantasy light novels.'
  },
  {
    id: 'tinytranslation',
    name: 'TinyTranslation',
    site: 'https://www.tinytranslation.xyz',
    description: 'Japanese dungeon crawl, progression, and level-up fantasy series.'
  },
  {
    id: 'hiraethtranslation',
    name: 'Hiraeth Translation',
    site: 'https://hiraethtranslation.com/',
    description: 'Japanese romantic fantasy and high-magic power light novels.'
  },
  {
    id: 'novelib',
    name: 'NovelLib',
    site: 'https://novelib.com',
    description: 'Modern light novel catalog with complete story arcs and clean formatting.'
  },
  {
    id: 'novelninja',
    name: 'Novel Ninja',
    site: 'https://novelninja.xyz/',
    description: 'Japanese crafting, production skills, and slice-of-life fantasy translations.'
  },
  {
    id: 'pawread',
    name: 'PawRead',
    site: 'https://m.pawread.com/',
    description: 'Popular fantasy and action light novels with rapid release schedules.'
  },
  {
    id: 'chikari',
    name: 'Chikari',
    site: 'https://chikari.moe',
    description: 'Action, martial arts, and swordsmanship light novel series.'
  },
  {
    id: 'borntobenovel',
    name: 'BornToBeNovel',
    site: 'https://borntobenovel.com',
    description: 'Dedicated source for academy, swordmaster, and magical progression series.'
  },
  {
    id: 'dragonholic',
    name: 'Dragonholic',
    site: 'https://dragonholictranslations.com',
    description: 'Master magician and dragon fantasy light novel translations.'
  },
  {
    id: 'dreamyTranslations',
    name: 'Dreamy Translations',
    site: 'https://dreamy-translations.com',
    description: 'Magical girl and villainess game reincarnation light novels.'
  },
  {
    id: 'inoveltranslation',
    name: 'iNovelTranslation',
    site: 'https://inoveltranslation.com',
    description: 'High-speed fantasy, witch, and cheat-skill light novel translations.'
  },
  {
    id: 'wetriedtls',
    name: 'We Tried TLS',
    site: 'https://wetriedtls.com',
    description: 'Korean and Japanese magic academy survival and action novels.'
  },
  {
    id: 'pasteltales',
    name: 'Pastel Tales',
    site: 'https://pasteltales.com/',
    description: 'Otome game, villainess escape, and romance light novels.'
  },
  {
    id: 'WTRLAB',
    name: 'WTR-LAB',
    site: 'https://wtr-lab.com/',
    description: 'Massive library of thousands of fantasy and fanfiction sagas.'
  },
  {
    id: 'atsumaru',
    name: 'Atsumaru',
    site: 'https://atsu.moe',
    description: 'Community-driven Asian light novel and web serial reading platform.'
  },
  {
    id: 'wuxiaworld.site',
    name: 'WuxiaWorld.Site',
    site: 'https://wuxiaworld.site/',
    description: 'Extensive multi-volume archive of fantasy world wars and magic epics.'
  }
];

export interface RoyalRoadFiction {
  id: string;
  syndicationId: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  genre: string[];
  novelfirePath?: string;
}

export const ROYAL_ROAD_CLASSICS: RoyalRoadFiction[] = [
  {
    id: 'rr-21220',
    syndicationId: '21220',
    title: 'Mother of Learning',
    author: 'nobody103',
    coverImage: 'https://www.royalroadcdn.com/public/covers-full/21220-mother-of-learning.jpg',
    description: 'Zorian is a teenage mage of humble birth and slightly above-average skill, attending his third year of education at Cyoria’s magical academy. A web of mysteries trapped inside a time loop.',
    genre: ['Time Loop', 'Fantasy', 'Progression', 'Mystery'],
    novelfirePath: 'book/mother-of-learning'
  },
  {
    id: 'rr-39408',
    syndicationId: '39408',
    title: 'Beware of Chicken',
    author: 'CasualFarmer',
    coverImage: 'https://www.royalroadcdn.com/public/covers-full/39408-beware-of-chicken.jpg',
    description: 'A laugh-out-loud, slice-of-life cultivation comedy about a reincarnated Canadian farm boy who decides to reject sect politics and start farming with his extraordinary rooster.',
    genre: ['Comedy', 'Cultivation', 'Slice of Life', 'Fantasy'],
    novelfirePath: 'book/beware-of-chicken'
  },
  {
    id: 'rr-36104',
    syndicationId: '36104',
    title: 'The Primal Hunter',
    author: 'Zogarth',
    coverImage: 'https://novelfire.net/server-1/the-primal-hunter.jpg',
    description: 'A LitRPG progression fantasy following Jake, an ordinary office worker who thrives when humanity is thrust into a multiverse-wide system tutorial.',
    genre: ['LitRPG', 'Action', 'Adventure', 'Progression'],
    novelfirePath: 'book/the-primal-hunter'
  },
  {
    id: 'rr-24709',
    syndicationId: '24709',
    title: 'Defiance of the Fall',
    author: 'TheFirstDefier',
    coverImage: 'https://www.royalroadcdn.com/public/covers-full/24709-defiance-of-the-fall.jpg',
    description: 'Zac was alone in the woods when the world changed, bringing a violent system apocalypse, alien incursions, and the path to cosmic power.',
    genre: ['LitRPG', 'Apocalypse', 'Cultivation', 'Action'],
    novelfirePath: 'book/defiance-of-the-fall'
  },
  {
    id: 'rr-33143',
    syndicationId: '33143',
    title: 'The Perfect Run',
    author: 'Void Herald',
    coverImage: 'https://www.royalroadcdn.com/public/covers-full/33143-the-perfect-run.jpg',
    description: 'Ryan "Quicksave" Romano can create a save point in time and return whenever he dies. In a super-powered post-apocalyptic Rome, he wants to achieve the one perfect run.',
    genre: ['Sci-Fi', 'Comedy', 'Superpowers', 'Time Loop'],
    novelfirePath: 'book/the-perfect-run'
  },
  {
    id: 'rr-63759',
    syndicationId: '63759',
    title: 'Super Supportive',
    author: 'Sleyca',
    coverImage: 'https://www.royalroadcdn.com/public/covers-full/63759-super-supportive.jpg',
    description: 'An expansive slow-burn progression superhero fantasy about a young boy pursuing a supportive magical bond with cosmic extradimensional entities.',
    genre: ['Progression', 'Superhero', 'Urban Fantasy', 'Drama']
  },
  {
    id: 'rr-22518',
    syndicationId: '22518',
    title: 'Chrysalis',
    author: 'RinoZ',
    coverImage: 'https://www.royalroadcdn.com/public/covers-full/22518-chrysalis.jpg',
    description: 'Anthony is reincarnated as a lowly monstrous ant in a subterranean fantasy dungeon. Guided by colony pride, he evolves into a terrifying giant protector.',
    genre: ['LitRPG', 'Monster Evolution', 'Comedy', 'Fantasy'],
    novelfirePath: 'book/chrysalis'
  },
  {
    id: 'rr-26294',
    syndicationId: '26294',
    title: 'He Who Fights With Monsters',
    author: 'Shirtaloon',
    coverImage: 'https://www.royalroadcdn.com/public/covers-large/26294-he-who-fights-with-monsters.jpg',
    description: 'Jason wakes up naked in a hedge maze in a strange fantasy world of magic, outsmarting cultists and unlocking sinister shadow powers.',
    genre: ['Isekai', 'LitRPG', 'Adventure', 'Fantasy'],
    novelfirePath: 'book/he-who-fights-with-monsters'
  },
  {
    id: 'rr-16930',
    syndicationId: '16930',
    title: 'Azarinth Healer',
    author: 'Rhaegar',
    coverImage: 'https://novelfire.net/server-1/azarinth-healer.jpg',
    description: 'Ilea discovers a forgotten ancient monastery and becomes a battle healer, punching mythical beasts while self-healing from lethal blows.',
    genre: ['LitRPG', 'Action', 'Adventure', 'Female Lead'],
    novelfirePath: 'book/azarinth-healer'
  },
  {
    id: 'rr-29358',
    syndicationId: '29358',
    title: 'Dungeon Crawler Carl',
    author: 'Matt Dinniman',
    coverImage: 'https://upload.wikimedia.org/wikipedia/en/f/f9/DungeonCrawlerCarlBook1.png',
    description: 'Carl and his ex-girlfriend’s Persian cat Princess Donut must survive an 18-level underground dungeon broadcast live across the galaxy for alien entertainment.',
    genre: ['LitRPG', 'Dark Comedy', 'Survival', 'Action'],
    novelfirePath: 'book/dungeon-crawler-carl'
  }
];

export async function getRoyalRoadSyndication(syndicationId: string): Promise<{
  title: string;
  author: string;
  chapters: Chapter[];
} | null> {
  try {
    const res = await fetch(`https://www.royalroad.com/fiction/syndication/${syndicationId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse-Reader/1.0',
        'Accept': 'application/rss+xml, text/xml, */*'
      }
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const rawTitle = $('channel > title').first().text().trim() || 'Royal Road Story';

    const items: Array<{ title: string; content: string[] }> = [];
    $('item').each((_, el) => {
      const itemTitle = $(el).find('title').text().trim();
      const descHtml = $(el).find('description').text();
      const paras = cleanHtmlToParagraphs(descHtml);
      if (paras.length > 0) {
        items.push({
          title: itemTitle.replace(`${rawTitle} - `, '').trim() || itemTitle,
          content: paras
        });
      }
    });

    const chronological = items.reverse();
    const chapters: Chapter[] = chronological.map((item, idx) => {
      const wordCount = item.content.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);
      return {
        id: `rr-${syndicationId}-ch-${idx + 1}`,
        title: item.title,
        chapterNumber: idx + 1,
        content: item.content,
        wordCount: wordCount || 1500,
        pluginId: 'royalroad',
        path: `rr:${syndicationId}:${idx + 1}`
      };
    });

    return {
      title: rawTitle,
      author: 'Royal Road Author',
      chapters
    };
  } catch (e) {
    console.error('Error fetching Royal Road syndication:', e);
    return null;
  }
}

// In-memory cache for fast repeat access
const novelDetailsCache = new Map<string, Book>();
const chapterContentCache = new Map<string, { content: string[]; wordCount: number }>();

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveCoverUrl(
  cover: string | undefined,
  site: string | undefined
): string {
  if (!cover || typeof cover !== 'string') return '';
  let trimmed = cover.trim();

  // Strip lossy downsampling query parameters from Novel Archive
  if (trimmed.includes('novelarchive.cc') || trimmed.includes('/api/novels/')) {
    trimmed = trimmed.split('?')[0];
  }

  // Upgrade AllNovelFull (novgo.net / allnovelfull) tiny 100x136 blurry thumbnails to full high-res covers
  // Maps /uploads/thumbs/<slug>-<32-hex-hash>.<ext> -> /uploads/novel/<slug>.<ext>
  if (trimmed.includes('uploads/thumbs/')) {
    trimmed = trimmed.replace(
      /\/uploads\/thumbs\/(.+?)-[a-f0-9]{32}\.(jpg|jpeg|png|webp)($|\?.*)/i,
      '/uploads/novel/$1.$2'
    );
  }

  // Upgrade Novel Ping (novelping.com) blurry 200x89 thumbnails to full high-res covers
  // Maps /novel_200_89/<slug>.jpg -> /novel/<slug>.jpg
  if (trimmed.includes('novelping.com') || trimmed.includes('/novel_')) {
    trimmed = trimmed.replace(/\/novel_\d+_\d+\//i, '/novel/');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (site) {
    const base = site.replace(/\/+$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${path}`;
  }
  return trimmed;
}

// Edge-safe direct fetch scraper for NovelBuddy (runs in pure JS without eval or VM)
export async function fetchNovelBuddyDirect(query: string): Promise<Book[]> {
  try {
    const url = `https://novelbuddy.me/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return [];
    const json = JSON.parse(match[1]);
    const items = json.props?.pageProps?.ssrItems || [];
    return items.map((item: any) => ({
      id: `ln-novelbuddy:${item.slug}`,
      title: item.name,
      author: item.authors?.[0]?.name || 'Webnovel Author',
      category: 'webnovel' as const,
      coverImage: item.cover || 'https://rs.novelbuddy.me/covers/default.png',
      description: item.summary ? item.summary.replace(/<[^>]+>/g, '').trim() : 'Serialized webnovel.',
      genre: (item.genres || []).map((g: any) => g.name || g),
      rating: item.rating ? Number((item.rating).toFixed(1)) : 4.8,
      pointsPerChapter: 2.0,
      chapters: []
    }));
  } catch (err) {
    console.warn('NovelBuddy direct edge search failed:', err);
    return [];
  }
}

export async function getNovelBuddyDetailsDirect(slug: string): Promise<Book | null> {
  try {
    const cleanSlug = slug.replace(/^ln-[^:]+:/, '').replace(/^\/+/, '');
    const url = `https://novelbuddy.me/${cleanSlug}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return null;
    const json = JSON.parse(match[1]);
    const m = json.props?.pageProps?.initialManga;
    if (!m) return null;

    let rawChapters: any[] = [];
    if (m.id) {
      try {
        const chRes = await fetch(`https://api.novelbuddy.me/titles/${m.id}/chapters`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse/1.0',
            'Accept': 'application/json'
          }
        });
        if (chRes.ok) {
          const chData = await chRes.json();
          if (chData.success && Array.isArray(chData.data?.chapters) && chData.data.chapters.length > 0) {
            rawChapters = chData.data.chapters;
          }
        }
      } catch (e) {
        console.warn('NovelBuddy full chapters API fetch failed, falling back to page chapters:', e);
      }
    }

    if (rawChapters.length === 0) {
      rawChapters = Array.isArray(m.chapters) && m.chapters.length > 0 ? m.chapters : (m.latestChapters || []);
    }

    // Sort chapters ascending so Chapter 1 is at index 0
    const sortedChapters = [...rawChapters].sort((a: any, b: any) => {
      const numA = typeof a.number === 'number' ? a.number : 0;
      const numB = typeof b.number === 'number' ? b.number : 0;
      if (numA !== numB) return numA - numB;
      return 0;
    });

    const chapters: Chapter[] = sortedChapters.map((ch: any, idx: number) => ({
      id: `nb-${m.slug}-ch-${ch.number ?? (idx + 1)}`,
      title: ch.name || `Chapter ${ch.number ?? (idx + 1)}`,
      chapterNumber: typeof ch.number === 'number' && ch.number > 0 ? ch.number : (idx + 1),
      path: ch.url || `/${cleanSlug}/${ch.slug}`,
      wordCount: 1800,
      content: [],
      pluginId: 'novelbuddy'
    }));

    return {
      id: `ln-novelbuddy:${m.slug}`,
      title: m.name,
      author: m.authors?.[0]?.name || 'Webnovel Author',
      category: 'webnovel',
      coverImage: m.cover || 'https://rs.novelbuddy.me/covers/default.png',
      description: m.summary ? m.summary.replace(/<[^>]+>/g, '').trim() : 'Serialized webnovel on ReadVerse.',
      genre: (m.genres || []).map((g: any) => g.name || g),
      rating: m.rating ? Number((m.rating).toFixed(1)) : 4.88,
      pointsPerChapter: 2.0,
      wordCountPerPoint: 1200,
      chapters,
      pluginId: 'novelbuddy',
      sourcePath: cleanSlug
    };
  } catch (err) {
    console.warn('NovelBuddy details direct failed:', err);
    return null;
  }
}

export async function getNovelBuddyChapterContentDirect(chapterPath: string): Promise<{ content: string[]; wordCount: number }> {
  try {
    const cleanPath = chapterPath.replace(/^\/+/, '');
    const url = `https://novelbuddy.me/${cleanPath}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return { content: ['Content unavailable at this time.'], wordCount: 0 };
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return { content: ['Content could not be parsed.'], wordCount: 0 };
    const json = JSON.parse(match[1]);
    const ch = json.props?.pageProps?.initialChapter;
    if (!ch || !ch.content) return { content: ['Chapter content is empty.'], wordCount: 0 };
    const paragraphs = cleanHtmlToParagraphs(ch.content);
    const totalWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);
    return {
      content: paragraphs,
      wordCount: totalWords || 1500
    };
  } catch (err) {
    console.warn('NovelBuddy chapter content direct failed:', err);
    return { content: ['Failed to load chapter content from remote mirror.'], wordCount: 0 };
  }
}

/**
 * Searches for webnovels across multiple verified LNReader plugins in parallel
 */
export async function searchLNWebnovels(
  query: string,
  preferredPlugin: string = 'all'
): Promise<Book[]> {
  try {
    const rt = await getLNRuntime();

    // Determine target plugins to query
    const targetPlugins =
      preferredPlugin && preferredPlugin !== 'all'
        ? [preferredPlugin]
        : [
            'novelbuddy',
            'lightnovelto',
            'novelight',
            'novelping',
            'readnovelfull',
            'konkon',
            'ReLib',
            'lnheaven',
            'novelib',
            'pawread',
            'anf.net',
            'novelfire',
            'novelarchive'
          ];

    const searchPromises = targetPlugins.map(async pluginId => {
      try {
        const plugin = await rt.loader.load(pluginId);
        if (!plugin) return [];

        let items: Array<{ name: string; path: string; cover?: string }> = [];

        if (query && query.trim()) {
          // 3.5s timeout per plugin to ensure search never hangs
          items = await Promise.race([
            plugin.searchNovels(query.trim(), 1),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Search timeout')), 3500)
            )
          ]);
        } else {
          items = await Promise.race([
            plugin.popularNovels(1, { showLatestNovels: false }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Popular timeout')), 3500)
            )
          ]);
        }

        if (!items || !Array.isArray(items)) return [];

        const sourceName = plugin.entry?.name || pluginId;
        const siteUrl = plugin.entry?.site || ACTIVE_WEBNOVEL_SOURCES.find(s => s.id === pluginId)?.site;

        return items.map(item => {
          const bookId = `ln-${pluginId}:${encodeURIComponent(item.path)}`;
          const resolvedCover = resolveCoverUrl(item.cover, siteUrl);
          return {
            id: bookId,
            title: item.name || 'Untitled Webnovel',
            author: `${sourceName} Contributor`,
            category: 'webnovel' as const,
            coverImage:
              resolvedCover ||
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: `Streamed live from ${sourceName}. Real full chapters with word count verification and rewards.`,
            genre: ['Webnovel', 'Light Novel', 'Fantasy'],
            rating: 4.9,
            pointsPerChapter: 2.0,
            wordCountPerPoint: 1200,
            chapters: [],
            pluginId,
            sourcePath: item.path
          };
        });
      } catch (e) {
        console.warn(`Search error with plugin ${pluginId}:`, e);
        return [];
      }
    });

    const settled = await Promise.all(searchPromises);
    const combined = settled.flat();

    // Curated Royal Road English progression fiction matches
    const qLower = query.toLowerCase().trim();
    const rrMatches: Book[] = ROYAL_ROAD_CLASSICS.filter(item => {
      if (!qLower) return preferredPlugin === 'all' || preferredPlugin === 'royalroad';
      return (
        item.title.toLowerCase().includes(qLower) ||
        item.author.toLowerCase().includes(qLower) ||
        item.genre.some(g => g.toLowerCase().includes(qLower))
      );
    }).map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      category: 'webnovel' as const,
      coverImage: item.coverImage,
      description: item.description,
      genre: item.genre,
      rating: 4.96,
      pointsPerChapter: 2.0,
      wordCountPerPoint: 1200,
      chapters: [],
      pluginId: 'royalroad',
      sourcePath: item.id
    }));

    // Prepend Royal Road matches
    const allCandidates = [...rrMatches, ...combined];

    // Deduplicate identical titles while keeping the richest/first result
    const seenTitles = new Set<string>();
    const deduplicated: Book[] = [];

    for (const b of allCandidates) {
      const norm = normalizeTitle(b.title);
      if (!norm || seenTitles.has(norm)) continue;
      seenTitles.add(norm);
      deduplicated.push(b);
    }

    if (deduplicated.length > 0) {
      return deduplicated;
    }

    // Direct edge fallback
    return await fetchNovelBuddyDirect(query);
  } catch (err) {
    console.warn(`Plugin runtime search unavailable, falling back to direct edge scraper:`, err);
    return await fetchNovelBuddyDirect(query);
  }
}

/**
 * Loads a novel's full details and chapter list
 */
export async function getLNWebnovelDetails(
  pluginId: string,
  novelPath: string
): Promise<Book | null> {
  const cacheKey = `${pluginId}:${novelPath}`;
  if (novelDetailsCache.has(cacheKey)) {
    return novelDetailsCache.get(cacheKey)!;
  }

  // Handle Royal Road novels
  if (pluginId === 'royalroad' || novelPath.startsWith('rr-')) {
    const rawId = novelPath.replace('rr-', '');
    const foundClassic = ROYAL_ROAD_CLASSICS.find(c => c.id === novelPath || c.syndicationId === rawId);

    // If it has a novelfire mirror path, attempt loading hundreds of full chapters
    if (foundClassic?.novelfirePath) {
      try {
        const fullNovel = await getLNWebnovelDetails('novelfire', foundClassic.novelfirePath);
        if (fullNovel && fullNovel.chapters.length > 0) {
          const enriched: Book = {
            ...fullNovel,
            id: foundClassic.id,
            title: foundClassic.title,
            author: foundClassic.author,
            coverImage: foundClassic.coverImage || fullNovel.coverImage,
            description: foundClassic.description || fullNovel.description,
            genre: foundClassic.genre || fullNovel.genre,
            pluginId: 'royalroad'
          };
          novelDetailsCache.set(cacheKey, enriched);
          return enriched;
        }
      } catch (err) {
        console.warn('Novelfire mirror fallback failed, falling back to Royal Road syndication:', err);
      }
    }

    // Direct Royal Road syndication feed
    const syndicationId = foundClassic?.syndicationId || rawId;
    const syndicationData = await getRoyalRoadSyndication(syndicationId);
    if (syndicationData) {
      const book: Book = {
        id: foundClassic?.id || `rr-${syndicationId}`,
        title: foundClassic?.title || syndicationData.title,
        author: foundClassic?.author || syndicationData.author,
        category: 'webnovel',
        coverImage: foundClassic?.coverImage || 'https://www.royalroad.com/icons/favicon-196x196.png',
        description: foundClassic?.description || `${syndicationData.title}. Original English web serial fiction from Royal Road.`,
        genre: foundClassic?.genre || ['Royal Road', 'Progression', 'Fantasy'],
        rating: 4.96,
        pointsPerChapter: 2.0,
        wordCountPerPoint: 1200,
        chapters: syndicationData.chapters,
        pluginId: 'royalroad',
        sourcePath: novelPath
      };
      novelDetailsCache.set(cacheKey, book);
      return book;
    }
  }

  // Direct high-speed native handler for NovelBuddy
  if (pluginId === 'novelbuddy') {
    const direct = await getNovelBuddyDetailsDirect(novelPath);
    if (direct && direct.chapters && direct.chapters.length > 0) {
      novelDetailsCache.set(cacheKey, direct);
      return direct;
    }
  }

  try {
    const rt = await getLNRuntime();
    const plugin = await rt.loader.load(pluginId);
    if (!plugin) return null;

    const details = await plugin.parseNovel(novelPath);
    if (!details) return null;

    const chapters: Chapter[] = (details.chapters || []).map((ch, idx) => ({
      id: `ch-${idx + 1}`,
      title: ch.name || `Chapter ${idx + 1}`,
      chapterNumber: ch.chapterNumber ?? idx + 1,
      content: [], // Loaded on demand for performance
      wordCount: 1800,
      path: ch.path,
      pluginId
    }));

    const bookId = `ln-${pluginId}:${encodeURIComponent(novelPath)}`;
    const sourceName = plugin.entry?.name || pluginId;
    const siteUrl = plugin.entry?.site || ACTIVE_WEBNOVEL_SOURCES.find(s => s.id === pluginId)?.site;
    const resolvedCover = resolveCoverUrl(details.cover, siteUrl);

    const book: Book = {
      id: bookId,
      title: details.name || 'Untitled Webnovel',
      author: details.author || `${sourceName} Author`,
      category: 'webnovel',
      coverImage:
        resolvedCover ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      description:
        details.summary?.slice(0, 450) ||
        `Streamed live from ${sourceName}. Real chapters with word count tracking and rewards.`,
      genre: details.genres
        ? typeof details.genres === 'string'
          ? details.genres.split(', ')
          : details.genres
        : ['Webnovel', 'Fantasy'],
      rating: 4.92,
      pointsPerChapter: 2.0,
      wordCountPerPoint: 1200,
      chapters,
      pluginId,
      sourcePath: novelPath
    };

    novelDetailsCache.set(cacheKey, book);
    return book;
  } catch (err) {
    console.warn(`Error fetching novel details for ${novelPath}, trying edge direct fallback:`, err);
    return await getNovelBuddyDetailsDirect(novelPath);
  }
}

/**
 * Loads and parses a single chapter's content
 */
export async function getLNWebnovelChapterContent(
  pluginId: string,
  chapterPath: string
): Promise<{ content: string[]; wordCount: number }> {
  const cacheKey = `${pluginId}:${chapterPath}`;
  if (chapterContentCache.has(cacheKey)) {
    return chapterContentCache.get(cacheKey)!;
  }

  // Support Royal Road chapter resolution
  if (pluginId === 'royalroad') {
    if (chapterPath.includes('/') || chapterPath.startsWith('book/')) {
      return getLNWebnovelChapterContent('novelfire', chapterPath);
    }

    const cachedBooks = Array.from(novelDetailsCache.values());
    for (const cachedBook of cachedBooks) {
      const foundCh = (cachedBook.chapters || []).find(
        (c: Chapter) => c.path === chapterPath || c.id === chapterPath
      );
      if (foundCh && foundCh.content && foundCh.content.length > 0) {
        const wordCount =
          foundCh.wordCount ||
          foundCh.content.reduce((sum: number, p: string) => sum + p.split(/\s+/).filter(Boolean).length, 0);
        return {
          content: foundCh.content,
          wordCount: wordCount || 1500
        };
      }
    }
  }

  // Direct high-speed native handler for NovelBuddy chapter content
  if (pluginId === 'novelbuddy') {
    const directContent = await getNovelBuddyChapterContentDirect(chapterPath);
    if (directContent && directContent.content && directContent.content.length > 0 && directContent.content[0] !== 'Content unavailable at this time.') {
      chapterContentCache.set(cacheKey, directContent);
      return directContent;
    }
  }

  try {
    const rt = await getLNRuntime();
    const plugin = await rt.loader.load(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const rawHtml = await plugin.parseChapter(chapterPath);
    const paragraphs = cleanHtmlToParagraphs(rawHtml);
    const totalWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);

    const result = {
      content: paragraphs,
      wordCount: totalWords || 1500
    };

    chapterContentCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`Error fetching chapter content for ${chapterPath}, trying edge direct fallback:`, err);
    return await getNovelBuddyChapterContentDirect(chapterPath);
  }
}
