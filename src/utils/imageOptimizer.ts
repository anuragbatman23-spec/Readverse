/**
 * Image Optimizer (Passthrough)
 * AI upscaling has been removed. Book covers load directly from their native source URLs.
 */

export function isLowResThumbnailUrl(_url: string | undefined): boolean {
  void _url;
  return false;
}

export function getUpscaledCoverUrl(
  url: string | undefined,
  _width: number = 600,
  _force: boolean = false
): string {
  void _width;
  void _force;
  if (!url || typeof url !== 'string') return '';
  return url.trim();
}

export const DEFAULT_LIGHT_NOVEL_COVER = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg';

export const KNOWN_CLASSIC_COVERS: Record<string, string> = {
  // Classic Titles (Normalized)
  'dracula': 'https://covers.openlibrary.org/b/id/12216503-L.jpg',
  'frankenstein': 'https://covers.openlibrary.org/b/id/12356249-L.jpg',
  'frankensteinorthemodernprometheus': 'https://covers.openlibrary.org/b/id/12356249-L.jpg',
  'theadventuresofsherlockholmes': 'https://covers.openlibrary.org/b/id/6717853-L.jpg',
  'sherlockholmes': 'https://covers.openlibrary.org/b/id/6717853-L.jpg',
  'prideandprejudice': 'https://covers.openlibrary.org/b/id/14348537-L.jpg',
  'thegreatgatsby': 'https://covers.openlibrary.org/b/id/10590366-L.jpg',
  'thetimemachine': 'https://covers.openlibrary.org/b/id/9009316-L.jpg',
  'alicesadventuresinwonderland': 'https://covers.openlibrary.org/b/id/10527843-L.jpg',
  'aliceinwonderland': 'https://covers.openlibrary.org/b/id/10527843-L.jpg',
  'mobydick': 'https://covers.openlibrary.org/b/id/10544254-L.jpg',
  'mobydickorthewhale': 'https://covers.openlibrary.org/b/id/10544254-L.jpg',
  'thepictureofdoriangray': 'https://covers.openlibrary.org/b/id/14314858-L.jpg',
  'doriangray': 'https://covers.openlibrary.org/b/id/14314858-L.jpg',
  'thewaroftheworlds': 'https://covers.openlibrary.org/b/id/36314-L.jpg',
  'waroftheworlds': 'https://covers.openlibrary.org/b/id/36314-L.jpg',
  'themetamorphosis': 'https://covers.openlibrary.org/b/id/12820198-L.jpg',
  'metamorphosis': 'https://covers.openlibrary.org/b/id/12820198-L.jpg',
  'crimeandpunishment': 'https://covers.openlibrary.org/b/id/9411873-L.jpg',
  'thecountofmontecristo': 'https://covers.openlibrary.org/b/id/14566393-L.jpg',
  'countofmontecristo': 'https://covers.openlibrary.org/b/id/14566393-L.jpg',
  'theartofwar': 'https://covers.openlibrary.org/b/id/4849549-L.jpg',
  'artofwar': 'https://covers.openlibrary.org/b/id/4849549-L.jpg',
  'meditations': 'https://covers.openlibrary.org/b/id/13202688-L.jpg',
  'janeeyre': 'https://covers.openlibrary.org/b/id/8235363-L.jpg',
  'janeeyreanautobiography': 'https://covers.openlibrary.org/b/id/8235363-L.jpg',
  'ataleoftwocities': 'https://covers.openlibrary.org/b/id/13301713-L.jpg',
  'taleoftwocities': 'https://covers.openlibrary.org/b/id/13301713-L.jpg',
  'thestrangecaseofdrjekyllandmrhyde': 'https://covers.openlibrary.org/b/id/295773-L.jpg',
  'drjekyllandmrhyde': 'https://covers.openlibrary.org/b/id/295773-L.jpg',
  'twentythousandleaguesunderthesea': 'https://covers.openlibrary.org/b/id/12539130-L.jpg',
  'twentytwothousandleaguesunderthesea': 'https://covers.openlibrary.org/b/id/12539130-L.jpg',
  'journeytothecenteroftheearth': 'https://covers.openlibrary.org/b/id/10543632-L.jpg',
  'theislandofdoctormoreau': 'https://covers.openlibrary.org/b/id/8936307-L.jpg',
  'carmilla': 'https://covers.openlibrary.org/b/id/10940428-L.jpg',
  'thekinginyellow': 'https://covers.openlibrary.org/b/id/9410103-L.jpg',

  // Gutenberg ID keys
  '345': 'https://covers.openlibrary.org/b/id/12216503-L.jpg',
  '84': 'https://covers.openlibrary.org/b/id/12356249-L.jpg',
  '1661': 'https://covers.openlibrary.org/b/id/6717853-L.jpg',
  '1342': 'https://covers.openlibrary.org/b/id/14348537-L.jpg',
  '64317': 'https://covers.openlibrary.org/b/id/10590366-L.jpg',
  '35': 'https://covers.openlibrary.org/b/id/9009316-L.jpg',
  '11': 'https://covers.openlibrary.org/b/id/10527843-L.jpg',
  '2701': 'https://covers.openlibrary.org/b/id/10544254-L.jpg',
  '174': 'https://covers.openlibrary.org/b/id/14314858-L.jpg',
  '36': 'https://covers.openlibrary.org/b/id/36314-L.jpg',
  '5200': 'https://covers.openlibrary.org/b/id/12820198-L.jpg',
  '2554': 'https://covers.openlibrary.org/b/id/9411873-L.jpg',
  '1184': 'https://covers.openlibrary.org/b/id/14566393-L.jpg',
  '2763': 'https://covers.openlibrary.org/b/id/4849549-L.jpg',
  '17405': 'https://covers.openlibrary.org/b/id/4849549-L.jpg',
  '2680': 'https://covers.openlibrary.org/b/id/13202688-L.jpg',
  '1260': 'https://covers.openlibrary.org/b/id/8235363-L.jpg',
  '98': 'https://covers.openlibrary.org/b/id/13301713-L.jpg',
  '43': 'https://covers.openlibrary.org/b/id/295773-L.jpg',
  '164': 'https://covers.openlibrary.org/b/id/12539130-L.jpg',
  '18857': 'https://covers.openlibrary.org/b/id/10543632-L.jpg',
  '159': 'https://covers.openlibrary.org/b/id/8936307-L.jpg',
  '10007': 'https://covers.openlibrary.org/b/id/10940428-L.jpg',
  '8492': 'https://covers.openlibrary.org/b/id/9410103-L.jpg'
};

export const KNOWN_LIGHT_NOVEL_COVERS: Record<string, string> = {
  'acaveking': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119518-W0uUHej9hS3h.jpg',
  'acavekingsroadtoparadise': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119518-W0uUHej9hS3h.jpg',
  'caveking': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119518-W0uUHej9hS3h.jpg',
  'toradora': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx34368-BCouTUMs4GmM.jpg',
  'theangelnextdoorspoilsmerotten': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122337-vy8L0b1ySIQr.jpg',
  'angelnextdoor': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122337-vy8L0b1ySIQr.jpg',
  'otonarinotenshi': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122337-vy8L0b1ySIQr.jpg',
  'bottomtiercharactertomozaki': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100807-zgNgjsRdCTHG.jpg',
  'tomozaki': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100807-zgNgjsRdCTHG.jpg',
  'hyouka': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx71629-b1McvLSvE9X9.jpg',
  'kokoroconnect': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx54380-J4ayyutGfRXr.jpg',
  'gekkou': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx40072-lMM7dQ5YhVjc.png',
  'goldentime': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx36873-10m1VvQW5E6r.jpg',
  'dayswithmystepsister': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx126268-c3BmsZ0LlJWr.png',
  'gimaiseikatsu': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx126268-c3BmsZ0LlJWr.png',
  'thedreamingboyisarealist': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx132664-JToaSpWFE3Jk.jpg',
  'yumemirudanshi': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx132664-JToaSpWFE3Jk.jpg',
  'alyasometimeshidesherfeelingsinrussian': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx152404-7mQ6l6vDfgJ5.jpg',
  'roshidere': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx152404-7mQ6l6vDfgJ5.jpg',
  'chitoseisintheramunebottle': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx124700-HR0Q2P47WJxY.jpg',
  'chiramune': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx124700-HR0Q2P47WJxY.jpg',
  'thewayofchoices': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/101409-ZD0EylMhydPc.jpg',
  'zetianji': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/101409-ZD0EylMhydPc.jpg',
  'mushokutensei': 'https://rs.novelbuddy.me/covers/mushoku-tensei.png',
  'mushokutenseijoblessreincarnation': 'https://rs.novelbuddy.me/covers/mushoku-tensei.png',
  'overlord': 'https://rs.novelbuddy.me/covers/overlord-light-novel.png',
  'classroomoftheelite': 'https://rs.novelbuddy.me/covers/classroom-of-the-elite.png',
  'classroomoftheeliteyear2': 'https://lightnovel.to/uploads/novel-covers/classroom-of-the-elite-year-2-393d52d6.webp',
  'theeminenceinshadow': 'https://rs.novelbuddy.me/covers/to-be-a-power-in-the-shadows.png',
  'tobeapowerintheshadows': 'https://rs.novelbuddy.me/covers/to-be-a-power-in-the-shadows.png',
  'rezero': 'https://rs.novelbuddy.me/covers/re-zero-kara-hajimeru-isekai-seikatsu.png',
  'rezerostartinglifeinanotherworld': 'https://rs.novelbuddy.me/covers/re-zero-kara-hajimeru-isekai-seikatsu.png',
  'swordartonline': 'https://rs.novelbuddy.me/covers/sword-art-online.png',
  'nogamenolife': 'https://rs.novelbuddy.me/covers/no-game-no-life.png',
  '86': 'https://rs.novelbuddy.me/covers/86.png',
  '86eightysix': 'https://rs.novelbuddy.me/covers/86.png',
  'acertainmagicalindex': 'https://rs.novelbuddy.me/covers/toaru-majutsu-no-index.png',
  'therisingoftheshieldhero': 'https://rs.novelbuddy.me/covers/tate-no-yuusha-no-nariagari.png',
  'theirregularatmagichighschool': 'https://rs.novelbuddy.me/covers/mahouka-koukou-no-rettousei.png',
  'thattimeigotreincarnatedasaslime': 'https://lightnovel.to/uploads/novel-covers/tensei-shitara-slime-datta-ken-ln-67980c11.webp',
  'slime': 'https://lightnovel.to/uploads/novel-covers/tensei-shitara-slime-datta-ken-ln-67980c11.webp',
  'konosuba': 'https://lightnovel.to/uploads/novel-covers/konosuba-gods-blessing-on-this-wonderful-world-light-novel-vol-1-17-2cabd571.webp',
  'konosubagod': 'https://lightnovel.to/uploads/novel-covers/konosuba-gods-blessing-on-this-wonderful-world-light-novel-vol-1-17-2cabd571.webp',
  'ascendanceofabookworm': 'https://rs.novelbuddy.me/covers/ascendance-of-a-bookworm.png',
  'danmachi': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85161-imb5doG2etVP.jpg',
  'isitwrongtotrytopickupgirlsinadungeon': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85161-imb5doG2etVP.jpg',
  'spiceandwolf': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx39115-2uLgBuM30i1b.jpg',
  'oregairu': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx70171-SjwD5wlgUpJV.jpg',
  'myyouthromanticcomedyiswrong': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx70171-SjwD5wlgUpJV.jpg',
  'rascaldoesnotdreamofbunnygirlsenpai': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx99199-Y40cR2bIYcNc.jpg',
  'tortureprincess': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108608-Yuns3HW06XQI.jpg',
  'grimgaroffantasyandash': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85465-hktQpYUMQhHz.jpg',
  'infinitedendrogram': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/87484-9N9Q4jEKVKPI.jpg',
  'failureframe': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg',
  'berserkofgluttony': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx104683-y444RjjIJZv1.jpg',
  'loghorizon': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx76024-asSsUMwFm5O8.jpg',
  'goblinslayer': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx87321-ijdB0SNr1JSs.jpg',
  'chivalryofafailedknight': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85370-jf3QsOKMnpyq.jpg',
  'hewhofightswithmonsters': 'https://www.royalroadcdn.com/public/covers-large/26294-he-who-fights-with-monsters.jpg'
};

/**
 * Resolves any cover URL, routing hotlink-protected sources (like MangaDex)
 * through our secure proxy with spoofed internal referer headers.
 * Replaces dummy Unsplash placeholders for light novels with verified authentic artwork.
 */
export function resolveCoverUrl(url: string | undefined, title?: string, category?: string): string {
  const normTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check known classic literature catalog covers
  if (category === 'book' || (url && url.includes('gutenberg.org')) || normTitle) {
    if (normTitle && KNOWN_CLASSIC_COVERS[normTitle]) {
      return KNOWN_CLASSIC_COVERS[normTitle];
    }
    if (normTitle) {
      for (const [key, cover] of Object.entries(KNOWN_CLASSIC_COVERS)) {
        if (key.length >= 5 && (normTitle.includes(key) || key.includes(normTitle))) {
          return cover;
        }
      }
    }
    if (url && url.includes('gutenberg.org')) {
      const gbMatch = url.match(/epub\/(\d+)\//);
      if (gbMatch && gbMatch[1] && KNOWN_CLASSIC_COVERS[gbMatch[1]]) {
        return KNOWN_CLASSIC_COVERS[gbMatch[1]];
      }
    }
  }

  // Check known catalog covers
  if (category === 'lightnovel' || category === 'webnovel' || !category) {
    if (normTitle) {
      if (KNOWN_LIGHT_NOVEL_COVERS[normTitle]) {
        return KNOWN_LIGHT_NOVEL_COVERS[normTitle];
      }
      for (const [key, cover] of Object.entries(KNOWN_LIGHT_NOVEL_COVERS)) {
        if (normTitle.includes(key) || key.includes(normTitle)) {
          return cover;
        }
      }
    }
  }

  if (!url || typeof url !== 'string') {
    return category === 'lightnovel' ? DEFAULT_LIGHT_NOVEL_COVER : '';
  }

  const trimmed = url.trim();

  // If it is a dummy stock photo from unsplash for a light novel, replace with real artwork
  if (trimmed.includes('unsplash.com') && (category === 'lightnovel' || trimmed.includes('1544716278'))) {
    return DEFAULT_LIGHT_NOVEL_COVER;
  }

  if (trimmed.includes('mangadex.org')) {
    const titleParam = title ? `&title=${encodeURIComponent(title)}` : '';
    return `/api/manga/image-proxy?url=${encodeURIComponent(trimmed)}${titleParam}`;
  }

  // Route Gutenberg images through proxy if not resolved so they don't break on Gutenberg 503
  if (trimmed.includes('gutenberg.org')) {
    const titleParam = title ? `&title=${encodeURIComponent(title)}` : '';
    return `/api/manga/image-proxy?url=${encodeURIComponent(trimmed)}${titleParam}`;
  }

  return trimmed;
}
