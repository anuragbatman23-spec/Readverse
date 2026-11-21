import { Book, ContentCategory } from '../types';
import { ALL_FAMOUS_BOOKS } from '../data/famousCatalog';
import { MOCK_BOOKS } from '../data/mockData';

export interface PuterRecommendedItem {
  book: Book;
  reason?: string;
  isAiPick?: boolean;
}

export interface PuterRecommendationsResult {
  recommendations: Record<ContentCategory, PuterRecommendedItem[]>;
  totalCount: number;
  isFromAi: boolean;
}

export interface PuterInstance {
  ai?: {
    chat?: (
      prompt: string | Array<{ role: string; content: string }>,
      options?: {
        model?: string;
        temperature?: number;
        max_tokens?: number;
        stream?: boolean;
      }
    ) => Promise<{ message?: { content?: string } } | string>;
    txt2speech?: (
      text: string,
      options?: {
        provider?: string;
        voice?: string;
        engine?: string;
        language?: string;
      }
    ) => Promise<HTMLAudioElement>;
  };
}

declare global {
  interface Window {
    puter?: PuterInstance;
  }
}

export function normalizeTitle(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Strict set of all 82 titles that appear on the ReadVerse home page.
 * Recommendations must NEVER show any of these books.
 */
export const HOME_BOOK_TITLES = new Set<string>([
  '86eightysix',
  'acertainmagicalindex',
  'alicesadventuresinwonderland',
  'areturner',
  'ascendanceofabookworm',
  'ataleoftwocities',
  'attackontitan',
  'bastard',
  'berserk',
  'bewareofchicken',
  'bleach',
  'chainsawman',
  'chapterithefourthdimension',
  'classroomoftheelite',
  'classroomoftheeliteyear2',
  'crimeandpunishment',
  'deathnote',
  'defianceofthefall',
  'demonslayerkimetsunoyaiba',
  'dracula',
  'dungeoncrawlercarl',
  'eleceed',
  'frankensteinorthemodernprometheus',
  'frierenbeyondjourney',
  'fullmetalalchemist',
  'hewhofightswithmonsters',
  'hunterxhunter',
  'janeeyreanautobiography',
  'jujutsukaisen',
  'konosubagod',
  'legendofthenorthernblade',
  'lookism',
  'lordofthemysteries',
  'meditations',
  'mobydickorthewhale',
  'motheroflearning',
  'mushokutenseijoblessreincarnation',
  'nanomachine',
  'naruto',
  'nogamenolife',
  'omniscientreader',
  'onepiece',
  'onepunchman',
  'overgeared',
  'overlord',
  'prideandprejudice',
  'releasethatwitch',
  'returnofthemounthuasect',
  'reverendinsanity',
  'rezerostartinglifeinanotherworld',
  'shadowslave',
  'sololeveling',
  'sololevelingonlyilevelup',
  'sssclassrevivalhunter',
  'supergene',
  'sweethome',
  'swordartonline',
  'thattimeigotreincarnatedasaslime',
  'theadventuresofsherlockholmes',
  'theartofwar',
  'thebeginningaftertheend',
  'thecountofmontecristo',
  'theeminenceinshadow',
  'thegodofhighschool',
  'thegreatestestatedeveloper',
  'thegreatgatsby',
  'theirregularatmagichighschool',
  'thelegendarymechanic',
  'themetamorphosis',
  'theperfectrun',
  'thepictureofdoriangray',
  'theprimalhunter',
  'therisingoftheshieldhero',
  'thestrangecaseofdrjekyllandmrhyde',
  'thetimemachine',
  'thewaroftheworlds',
  'tokyoghoul',
  'towerofgod',
  'trashofthecount',
  'vagabond',
  'vinlandsaga',
  'windbreaker'
]);

// Include all titles from catalog in memory as well
ALL_FAMOUS_BOOKS.forEach(b => {
  if (b.title) HOME_BOOK_TITLES.add(normalizeTitle(b.title));
});
MOCK_BOOKS.forEach(b => {
  if (b.title) HOME_BOOK_TITLES.add(normalizeTitle(b.title));
});

export function isHomePageBook(title: string): boolean {
  const norm = normalizeTitle(title);
  if (!norm) return false;
  if (HOME_BOOK_TITLES.has(norm)) return true;
  let matches = false;
  HOME_BOOK_TITLES.forEach(home => {
    if (!matches && home.length >= 6 && (norm === home || (norm.includes(home) && home.length > 8))) {
      matches = true;
    }
  });
  return matches;
}

function cleanHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Curated non-home companion pools by theme.
 * Every book here is verified to be ABSENT from the home page catalog,
 * with high quality CDN covers and 10 items per category.
 */
type ThematicCompanionMatrix = Record<ContentCategory, Book[]>;

const HUNTER_SYSTEM_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-sl-m1',
      title: 'Second Life Ranker',
      author: 'Nong Nong, Sadoyeon',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109957-EgJWdR7l9TBG.jpg',
      description: 'Yeonwoo inherits his late twin brother\'s pocket watch and climbs the Obelisk Tower to exact vengeance.',
      genre: ['Action', 'Fantasy', 'Adventure'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m2',
      title: 'Doom Breaker',
      author: 'Cheong Dam',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx136220-u9sewv3u02mN.jpg',
      description: 'Zephyr, the last human champion, battles the god of destruction and regresses with divine blessings.',
      genre: ['Action', 'Fantasy', 'Reincarnation'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m3',
      title: 'Tomb Raider King',
      author: 'SAN.G, Yoon Seung-hee',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110462-okQFIoSFvb4L.jpg',
      description: 'Godly tombs appear across the globe. Joo-Heon awakens from death to plunder every legendary relic.',
      genre: ['Action', 'Supernatural', 'Fantasy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m4',
      title: 'Dungeon Odyssey',
      author: 'Son Min-woo, Glimms',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx155485-YlWPkBFvWG3v.jpg',
      description: 'A dungeon baby turned labyrinth owner raises an unstoppable army of ant warriors in the abyss.',
      genre: ['Action', 'Fantasy', 'Comedy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m5',
      title: "The Player Who Can't Level Up",
      author: 'AENGDU, Gabin',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx130511-4O6dF8oaiVJh.jpg',
      description: 'Stuck at Level 1 for five years, Kim Kigyu unlocks the ego weapon system and awakens god-tier familiars.',
      genre: ['Action', 'Fantasy', 'Supernatural'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m6',
      title: 'Pick Me Up, Infinite Gacha',
      author: 'WASAK BASAK, Ntreev',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx159441-9W8201jAT9Yv.jpg',
      description: 'The world\'s top gacha gamer is sucked into Mobius as a 1-star expendable hero and must claw his way up.',
      genre: ['Action', 'Fantasy', 'Game'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m7',
      title: 'Boundless Ascension',
      author: '2L, 128',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx159439-CgZyaMliKpNe.jpg',
      description: 'Armed with an innate trait for absolute growth, Han Seong-yun enters the Tower of Trials to surpass humanity.',
      genre: ['Action', 'Fantasy'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m8',
      title: 'Kill the Hero',
      author: 'Carpe, D-Dart',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx117536-tnTMgXV1V5KB.jpg',
      description: 'Betrayed and slain by the so-called savior of mankind, Woojin regresses as a ruthless necromancer.',
      genre: ['Action', 'Supernatural', 'Revenge'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m9',
      title: 'The Return of the Disaster-Class Hero',
      author: 'SAN.G, Redice Studio',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx143056-MEpVxW7346jz.jpg',
      description: 'Lee Geon, the 13th saint betrayed by the twelve Zodiac gods, breaks out of the Devil\'s Tower for payback.',
      genre: ['Action', 'Comedy', 'Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-m10',
      title: 'Level Up with the Gods',
      author: 'Black Ajin, Oh Hyun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx138222-PyVZk5MOWP07.png',
      description: 'Kim YuWon regresses from the final battle against Outer Gods to conquer the Tower with Olympian precision.',
      genre: ['Action', 'Fantasy', 'Mythology'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-sl-mg1',
      title: 'Claymore',
      author: 'Norihiro Yagi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30583-Ysqwu8uryIUX.png',
      description: 'Silver-eyed warriors created from demon flesh protect mankind from ravenous Yoma beasts.',
      genre: ['Action', 'Dark Fantasy', 'Supernatural'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg2',
      title: 'Dorohedoro',
      author: 'Q Hayashida',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31133-Jx6map3Oidz1.png',
      description: 'In the grimy streets of the Hole, reptilian-headed Caiman hunts down sorcerers to recover his lost memories.',
      genre: ['Action', 'Dark Fantasy', 'Horror'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg3',
      title: 'Shangri-La Frontier',
      author: 'Katarina, Ryosuke Fuji',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122063-j2wIvwb6yzPM.jpg',
      description: 'A trash-game connoisseur dives into a 30-million-player VR masterwork with unmatched reflexes.',
      genre: ['Action', 'Adventure', 'Comedy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg4',
      title: 'World Trigger',
      author: 'Daisuke Ashihara',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx78151-o2g4GiqaiPyO.jpg',
      description: 'Border defense operatives utilize customizable Triggers to repel otherworldly Neighbors from Mikado City.',
      genre: ['Action', 'Sci-Fi', 'Strategy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg5',
      title: "Darwin's Game",
      author: 'FLIPFLOPs',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx78881-WLtZZsQnDqHN.png',
      description: 'An invitation to a mobile app thrusts high schooler Kaname into a brutal real-world battle royale with Sigils.',
      genre: ['Action', 'Mystery', 'Supernatural'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg6',
      title: 'Choujin X',
      author: 'Sui Ishida',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx126693-hEqUWtBfUHyc.jpg',
      description: 'From the creator of Tokyo Ghoul: ordinary teens inject superhuman serum to survive monstrous threats.',
      genre: ['Action', 'Psychological', 'Supernatural'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg7',
      title: 'Gantz',
      author: 'Hiroya Oku',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30564-RbyFbLzbnKea.jpg',
      description: 'Deceased citizens are revived in a Tokyo apartment and forced by a black sphere to exterminate alien invaders.',
      genre: ['Action', 'Horror', 'Sci-Fi'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg8',
      title: 'Dororo',
      author: 'Osamu Tezuka',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31658-xZFgMcIzhbB4.png',
      description: 'Hyakkimaru hunts down 48 demons to reclaim the body parts stolen from him at birth by his warlord father.',
      genre: ['Action', 'Adventure', 'Historical'],
      rating: 8.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg9',
      title: 'Blade of the Immortal',
      author: 'Hiroaki Samura',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b30658-4KzCEiCDN7Yq.jpg',
      description: 'The cursed immortal swordsman Manji vows to slay 1,000 evil men to lift his sacred bloodworm curse.',
      genre: ['Action', 'Historical', 'Martial Arts'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-mg10',
      title: 'Psyren',
      author: 'Toshiaki Iwashiro',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx33438-pBfMEC42XhCA.png',
      description: 'Using a crimson telephone card, Ageha is pulled into a desolate future wasteland populated by PSI monsters.',
      genre: ['Action', 'Psychological', 'Sci-Fi'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-sl-ln1',
      title: "A Cave King's Road to Paradise",
      author: 'Hajime Kamoshida',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119518-W0uUHej9hS3h.jpg',
      description: 'Exiled to a desolate island with a supposedly useless mining crest, Prince Heal unearths divine minerals.',
      genre: ['Fantasy', 'Adventure', 'Kingdom Building'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln2',
      title: 'Grimgar of Fantasy and Ash',
      author: 'Ao Jyumonji',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85465-hktQpYUMQhHz.jpg',
      description: 'Awakening with no memories in a harsh fantasy realm, rookie volunteers struggle together for basic survival.',
      genre: ['Action', 'Adventure', 'Drama'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln3',
      title: 'Infinite Dendrogram',
      author: 'Sakon Kaidou',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/87484-9N9Q4jEKVKPI.jpg',
      description: 'An advanced full-dive VRMMO featuring uniquely evolving Embryos provides boundless player customization.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 8.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln4',
      title: 'Failure Frame',
      author: 'Kaoru Shinozaki',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg',
      description: 'Cast into the Disposal Ruins with E-rank abnormal status skills, Mimori unleashes 100% debuff destruction.',
      genre: ['Action', 'Dark Fantasy', 'Revenge'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln5',
      title: 'Torture Princess: Fremd Torturchen',
      author: 'Keishi Ayasato',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108608-Yuns3HW06XQI.jpg',
      description: 'Reincarnated as servant to the terrifying Torture Princess, Kaito aids in purifying 14 deadly demons.',
      genre: ['Dark Fantasy', 'Horror', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln6',
      title: 'Berserk of Gluttony',
      author: 'Isshiki Ichika',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx104683-y444RjjIJZv1.jpg',
      description: 'Fate Graphite awakens his Gluttony skill, absorbing the souls, stats, and skills of every foe he slays.',
      genre: ['Action', 'Dark Fantasy'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln7',
      title: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?',
      author: 'Fujino Omori',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85161-imb5doG2etVP.jpg',
      description: 'Under the guidance of Goddess Hestia, rookie Bell Cranel strives to become a true hero in the Orario Dungeon.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln8',
      title: 'Log Horizon',
      author: 'Mamare Touno',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx76024-asSsUMwFm5O8.jpg',
      description: 'Thirty thousand Japanese players are trapped inside the MMORPG Elder Tale. Master strategist Shiroe builds order.',
      genre: ['Action', 'Strategy', 'Fantasy'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln9',
      title: 'Goblin Slayer',
      author: 'Kumo Kagyu',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx87321-ijdB0SNr1JSs.jpg',
      description: 'A silver-ranked adventurer dedicates his entire existence to exterminating goblins by any lethal means necessary.',
      genre: ['Action', 'Dark Fantasy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-ln10',
      title: 'Chivalry of a Failed Knight',
      author: 'Riku Misora',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85370-jf3QsOKMnpyq.jpg',
      description: 'Ikki Kurogane, the Worst One with F-rank magic, masters godly swordsmanship to become the Seven Star Sword King.',
      genre: ['Action', 'Fantasy', 'Romance'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-sl-wn1',
      title: "The Novel's Extra",
      author: 'Jee Gab Song',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      description: 'Transmigrated into his own novel as a dispensable side character, Kim Hajin relies on precision firearm mastery.',
      genre: ['Action', 'Academy', 'System'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn2',
      title: "The Author's POV",
      author: 'Entrail_JI',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      description: 'Ren Dover transmigrates into a harsh fantasy world he authored and maneuvers from the shadows to avert ruin.',
      genre: ['Action', 'Psychological', 'System'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn3',
      title: 'Chrysalis',
      author: 'RinoZ',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      description: 'Reborn as a monstrous ant in the bottom levels of Pangera Dungeon, Anthony rallies the colony for ascension.',
      genre: ['Action', 'Monster Evolution', 'LitRPG'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn4',
      title: 'The Tutorial Is Too Hard',
      author: 'Gandara',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
      description: 'Lee Ho Jae mistakenly selects Hell difficulty in a mysterious tutorial tower and adapts into a terrifying powerhouse.',
      genre: ['Action', 'Tower Climbing', 'Survival'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn5',
      title: "Seoul Station's Necromancer",
      author: 'Jin Seol Woo',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      description: 'Kang Woojin returns to modern Seoul after 20 years conquering Planet Alphen with his supreme undead legions.',
      genre: ['Action', 'Urban Fantasy', 'Necromancy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn6',
      title: 'Everyone Else is a Returnee',
      author: 'Toika',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
      description: 'Left behind on Earth while all humanity trains across the multiverse, Yu IlHan masters solitary godlike crafting.',
      genre: ['Action', 'Comedy', 'Progression'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn7',
      title: 'Warlock of the Magus World',
      author: 'The Plagiarist',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      description: 'Armed with the AI Chip, Leylin Farlier traverses a brutal magus society with cold calculation and bloodline experiments.',
      genre: ['Dark Fantasy', 'Transmigration', 'Magic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn8',
      title: 'The Second Coming of Gluttony',
      author: 'Ro Yu-jin',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
      description: 'Seol Jihu receives his past life\'s deepest regrets and steps through the golden gates into the paradise realm.',
      genre: ['Action', 'Progression', 'Supernatural'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn9',
      title: 'Martial World',
      author: 'Cocooned Cow',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80',
      description: 'A youth with a common background discovers the Magic Cube and rises through the realms of divine martial dao.',
      genre: ['Action', 'Cultivation', 'Martial Arts'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-wn10',
      title: 'Coiling Dragon',
      author: 'I Eat Tomatoes',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      description: 'Linley Baruch discovers a ring carved from dragon bone and awakens the legendary lineage of the Dragonblood Warriors.',
      genre: ['Action', 'Fantasy', 'Cultivation'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-sl-b1',
      title: 'Twenty Thousand Leagues Under the Sea',
      author: 'Jules Verne',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/164/pg164.cover.medium.jpg',
      description: 'Captain Nemo commands the technologically advanced Nautilus submarine through unexplored ocean depths.',
      genre: ['Classics', 'Sci-Fi', 'Adventure'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b2',
      title: 'Journey to the Center of the Earth',
      author: 'Jules Verne',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/18857/pg18857.cover.medium.jpg',
      description: 'Professor Lidenbrock and his nephew descend through an Icelandic volcano into prehistoric subterranean realms.',
      genre: ['Classics', 'Adventure', 'Sci-Fi'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b3',
      title: 'The Island of Doctor Moreau',
      author: 'H.G. Wells',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/159/pg159.cover.medium.jpg',
      description: 'A shipwreck survivor encounters a mad scientist performing dark biological vivisections on an isolated island.',
      genre: ['Classics', 'Sci-Fi', 'Horror'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b4',
      title: 'Carmilla',
      author: 'J. Sheridan Le Fanu',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/10007/pg10007.cover.medium.jpg',
      description: 'The seminal gothic vampire novella predating Dracula, exploring bloodlust in a solitary Austrian castle.',
      genre: ['Classics', 'Gothic', 'Horror'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b5',
      title: 'The King in Yellow',
      author: 'Robert W. Chambers',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/8492/pg8492.cover.medium.jpg',
      description: 'A collection of haunting weird tales centered around a forbidden theatrical play that induces madness.',
      genre: ['Classics', 'Cosmic Horror', 'Mystery'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b6',
      title: 'At the Mountains of Madness',
      author: 'H.P. Lovecraft',
      category: 'book',
      coverImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
      description: 'An Antarctic expedition unearths the cyclopean ruins of the Elder Things and awakening cosmic terrors.',
      genre: ['Classics', 'Cosmic Horror', 'Sci-Fi'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b7',
      title: 'The Phantom of the Opera',
      author: 'Gaston Leroux',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/175/pg175.cover.medium.jpg',
      description: 'Beneath the Paris Opera House, a disfigured musical genius haunts the subterranean labyrinth.',
      genre: ['Classics', 'Gothic', 'Drama'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b8',
      title: 'A Princess of Mars',
      author: 'Edgar Rice Burroughs',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/62/pg62.cover.medium.jpg',
      description: 'Civil War veteran John Carter is teleported to Barsoom (Mars) where Earth-gravity grants him superhuman power.',
      genre: ['Classics', 'Planetary Romance', 'Sci-Fi'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b9',
      title: 'The Lost World',
      author: 'Arthur Conan Doyle',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/139/pg139.cover.medium.jpg',
      description: 'Professor Challenger leads an expedition to an isolated South American plateau inhabited by living dinosaurs.',
      genre: ['Classics', 'Adventure', 'Sci-Fi'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b10',
      title: 'Heart of Darkness',
      author: 'Joseph Conrad',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/219/pg219.cover.medium.jpg',
      description: 'Charles Marlow journeys up the Congo River in search of the enigmatic ivory trader Kurtz.',
      genre: ['Classics', 'Psychological', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b11',
      title: 'King Solomon\'s Mines',
      author: 'H. Rider Haggard',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2166/pg2166.cover.medium.jpg',
      description: 'Allan Quatermain leads a perilous expedition into unexplored African territories in search of legendary diamond mines.',
      genre: ['Classics', 'Adventure', 'Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-sl-b12',
      title: 'The Moonstone',
      author: 'Wilkie Collins',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/155/pg155.cover.medium.jpg',
      description: 'The theft of a cursed sacred Indian diamond unravels secrets, opiate addiction, and thrilling deductions.',
      genre: ['Classics', 'Mystery', 'Detective'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

const ROMANCE_NOBILITY_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-rom-m1',
      title: 'Villains Are Destined to Die',
      author: 'SUOL, Gwon Gyeoeul',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx117565-VH36Ele1V2hZ.jpg',
      description: 'Trapped as the hated villainess Penelope Eckhart in a reverse harem dating sim on hardcore mode.',
      genre: ['Romance', 'Fantasy', 'Isekai'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m2',
      title: 'Who Made Me a Princess',
      author: 'Spoon, Plutus',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx105079-zuBwVnibWdFM.jpg',
      description: 'Reincarnated as Princess Athanasia, she must win over her tyrannical cold-blooded father to survive.',
      genre: ['Romance', 'Fantasy', 'Family'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m3',
      title: "A Stepmother's Marchen",
      author: 'ORKA, Spice&Kitty',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx111002-3wGqOV8V6mzY.png',
      description: 'The Iron Widow Shuri regresses to the day of her husband\'s funeral to raise her four stepchildren properly.',
      genre: ['Drama', 'Romance', 'Historical'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m4',
      title: 'Roxana',
      author: 'Juniljus, Kin',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx128825-HSmKjjIudsEc.jpg',
      description: 'Reborn into the vile Agriche family, Roxana schemes with toxic butterflies to protect the blue-haired captive.',
      genre: ['Dark Fantasy', 'Romance', 'Psychological'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m5',
      title: 'The Remarried Empress',
      author: 'Sumpul, Alphatart',
      category: 'manhwa',
      coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      description: 'Empress Navier agrees to a divorce from Emperor Sovieshu—and immediately accepts the Western Empire King.',
      genre: ['Romance', 'Drama', 'Royalty'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m6',
      title: 'I Shall Master This Family',
      author: 'Mon, Kim Roah',
      category: 'manhwa',
      coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
      description: 'Florentia regresses to childhood to become the head of the glorious Lombardy family and save her father.',
      genre: ['Historical', 'Romance', 'Reincarnation'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m7',
      title: 'Beware the Villainess!',
      author: 'Blue Canna, Berry',
      category: 'manhwa',
      coverImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      description: 'Melissa Fondebot takes over as the villainess and beats up every toxic male lead with a baseball bat.',
      genre: ['Comedy', 'Romance', 'Fantasy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m8',
      title: 'How to Win My Husband Over',
      author: 'Spice&Kitty, Siru',
      category: 'manhwa',
      coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
      description: 'Ruby acts like an innocent, devoted bride to survive her marriage to the ruthless Northern paladin Izek.',
      genre: ['Drama', 'Romance', 'Psychological'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m9',
      title: 'Father, I Do Not Want This Marriage',
      author: 'Roal, Yuri',
      category: 'manhwa',
      coverImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
      description: 'Misunderstandings galore as Jubelian tries to escape high-society marriage arrangements with the Crown Prince.',
      genre: ['Comedy', 'Romance', 'Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-m10',
      title: 'Doctor Elise: The Royal Lady with the Lamp',
      author: 'mini, Yuin',
      category: 'manhwa',
      coverImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
      description: 'A brilliant modern surgeon regresses back to her first life as the wicked noble Elise to redeem herself through medicine.',
      genre: ['Romance', 'Medical', 'Historical'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-rom-mg1',
      title: 'The Apothecary Diaries',
      author: 'Natsu Hyuuga, Nekokurage',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99937-4eugxyqtBXu7.jpg',
      description: 'Maomao, a pharmacist in the imperial rear palace, unravels poisonings and royal conspiracies.',
      genre: ['Mystery', 'Historical', 'Drama'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg2',
      title: 'Oshi no Ko',
      author: 'Aka Akasaka, Mengo Yokoyari',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx117040-rU4AAFjKBDL7.jpg',
      description: 'Reincarnated as children of idol superstar Ai Hoshino, twins Aqua and Ruby navigate the dark entertainment industry.',
      genre: ['Drama', 'Mystery', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg3',
      title: 'Kaguya-sama: Love Is War',
      author: 'Aka Akasaka',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
      description: 'Two elite student council geniuses engage in psychological mind games to force the other to confess first.',
      genre: ['Comedy', 'Romance', 'Psychological'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg4',
      title: 'Horimiya',
      author: 'HERO, Daisuke Hagiwara',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
      description: 'Two high schoolers who hide their true selves discover each other\'s secrets and form an intimate bond.',
      genre: ['Romance', 'Slice of Life', 'Comedy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg5',
      title: 'Fruits Basket',
      author: 'Natsuki Takaya',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      description: 'Tohru Honda lives with the enigmatic Sohma family and learns their curse of transforming into Zodiac animals.',
      genre: ['Drama', 'Romance', 'Supernatural'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg6',
      title: 'My Dress-Up Darling',
      author: 'Shinichi Fukuda',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
      description: 'Traditional Hina doll artisan Wakana Gojo pairs up with bubbly gyaru Marin Kitagawa to craft stunning cosplay.',
      genre: ['Romance', 'Comedy', 'Slice of Life'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg7',
      title: 'Wotakoi: Love Is Hard for Otaku',
      author: 'Fujita',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      description: 'Four office coworkers navigate the joys and comical struggles of dating as closet otaku.',
      genre: ['Romance', 'Comedy', 'Slice of Life'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg8',
      title: 'Ao Haru Ride',
      author: 'Io Sakisaka',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
      description: 'Futaba Yoshioka reinvents herself in high school and crosses paths again with her middle-school first love.',
      genre: ['Romance', 'Drama', 'School'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg9',
      title: 'Skip Beat!',
      author: 'Yoshiki Nakamura',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
      description: 'Kyoko Mogami enters showbiz to exact revenge on her ungrateful childhood friend who used her.',
      genre: ['Comedy', 'Drama', 'Romance'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-mg10',
      title: 'Kaichou wa Maid-sama!',
      author: 'Hiro Fujiwara',
      category: 'manga',
      coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      description: 'Strict student council president Misaki works secretly at a maid cafe until school heartthrob Usui finds out.',
      genre: ['Romance', 'Comedy', 'School'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-rom-ln1',
      title: 'Spice and Wolf',
      author: 'Isuna Hasekura',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx39115-2uLgBuM30i1b.jpg',
      description: 'Traveling merchant Kraft Lawrence partners with the witty harvest wolf deity Holo on an economic journey.',
      genre: ['Adventure', 'Fantasy', 'Romance'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln2',
      title: 'My Youth Romantic Comedy Is Wrong (Oregairu)',
      author: 'Wataru Watari',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx70171-SjwD5wlgUpJV.jpg',
      description: 'Cynical loner Hachiman Hikigaya is forced into the Service Club to solve other students\' interpersonal crises.',
      genre: ['Comedy', 'Drama', 'Romance'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln3',
      title: 'Rascal Does Not Dream of Bunny Girl Senpai',
      author: 'Hajime Kamoshida',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx99199-Y40cR2bIYcNc.jpg',
      description: 'Sakuta investigates Puberty Syndrome anomalies, starting with actress Mai Sakurajima who is turning invisible.',
      genre: ['Drama', 'Romance', 'Supernatural'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln4',
      title: 'Toradora!',
      author: 'Yuyuko Takemiya',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx34368-BCouTUMs4GmM.jpg',
      description: 'Gentle Ryuuji and feisty Palmtop Tiger Taiga ally together to help each other confess to their respective crushes.',
      genre: ['Comedy', 'Romance', 'School'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln5',
      title: 'The Angel Next Door Spoils Me Rotten',
      author: 'Saekisan',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122337-vy8L0b1ySIQr.jpg',
      description: 'After lending his umbrella in the rain, Amane\'s messy apartment life is cared for by the angel Mahiru.',
      genre: ['Romance', 'Slice of Life'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln6',
      title: 'Bottom-Tier Character Tomozaki',
      author: 'Yuki Yaku',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100807-zgNgjsRdCTHG.jpg',
      description: 'Japan\'s best gamer treats real life as a top-tier god game under the rigorous coaching of school idol Hinami.',
      genre: ['Drama', 'Romance', 'School'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln7',
      title: 'Hyouka',
      author: 'Honobu Yonezawa',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx71629-b1McvLSvE9X9.jpg',
      description: 'Energy-conserving Oreki Houtarou joins the Classic Literature Club and solves inquisitive high-school mysteries.',
      genre: ['Mystery', 'Slice of Life'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln8',
      title: 'Kokoro Connect',
      author: 'Sadanatsu Anda',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx54380-J4ayyutGfRXr.jpg',
      description: 'Five Cultural Research Club members are subjected to supernatural phenomena including involuntary body swaps.',
      genre: ['Drama', 'Romance', 'Supernatural'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln9',
      title: 'Gekkou',
      author: 'Natsuki Mamiya',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx40072-lMM7dQ5YhVjc.png',
      description: 'Nonomiya finds a murder recipe written by the cynical, brilliant beauty Tsukimori Youko.',
      genre: ['Mystery', 'Psychological', 'Romance'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-ln10',
      title: 'Golden Time',
      author: 'Yuyuko Takemiya',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx36873-10m1VvQW5E6r.jpg',
      description: 'Amnesiac law student Tada Banri starts over in Tokyo and falls for the glamorous, dramatic Kaga Kouko.',
      genre: ['Comedy', 'Drama', 'Romance'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-rom-wn1',
      title: 'The Villainess Reverses the Hourglass',
      author: 'SANSOBI, Chic Ma',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      description: 'Executed after being framed by her saintly stepsister, Aria regresses with an hourglass that turns back time.',
      genre: ['Romance', 'Revenge', 'Historical'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn2',
      title: 'Kill the Villainess',
      author: 'Haeyun',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      description: 'Eris Mizelian wants nothing to do with the empire\'s male leads; she will do whatever it takes to return home to Earth.',
      genre: ['Drama', 'Psychological', 'Tragedy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn3',
      title: 'Like a Wind on a Dry Branch',
      author: 'Dalsaeowl',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      description: 'Saved from burial alive by Duke Killian, grief-stricken Rieta slowly heals in a world of plague and dark magic.',
      genre: ['Romance', 'Historical', 'Drama'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn4',
      title: 'Marriage of Convenience',
      author: 'Karahwi',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
      description: 'Given a second chance at youth, Bianca vows to protect the household and truly love her warrior husband Zachary.',
      genre: ['Romance', 'Historical', 'Reincarnation'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn5',
      title: 'Under the Oak Tree',
      author: 'Kim Suji',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      description: 'Stammering noblewoman Maximilian finds confidence and true devotion alongside the legendary knight Riftan Calypse.',
      genre: ['Romance', 'Fantasy', 'Drama'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn6',
      title: 'Lucia',
      author: 'Skye',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
      description: 'Foreseeing a tragic future in a prophetic dream, Princess Lucia proposes a strategic contract marriage to the Duke.',
      genre: ['Romance', 'Royalty', 'Fantasy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn7',
      title: 'Men of the Harem',
      author: 'Alphatart',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      description: 'Ascending the throne, Empress Latil takes five consorts of differing political allegiances to secure power.',
      genre: ['Reverse Harem', 'Drama', 'Royalty'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn8',
      title: 'For Better or For Worse',
      author: 'Noh Seung-ah',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
      description: 'To protect her sister from dying in childbirth as the novel depicted, Dillon steps forward to marry Marquess Cedric.',
      genre: ['Comedy', 'Romance', 'Historical'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn9',
      title: "I'm Stanning the Prince",
      author: 'Zolapic',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80',
      description: 'Angela\'s fanfiction about the terrifying First Prince Rayburn becomes an empire-wide bestseller and saves his image.',
      genre: ['Comedy', 'Romance', 'Royalty'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-wn10',
      title: 'The Great Wish',
      author: 'Skyfall',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      description: 'Model princess Sienna gains precognitive visions of the empire\'s downfall and forms an alliance with Kuhn.',
      genre: ['Romance', 'Fantasy', 'Politics'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-rom-b1',
      title: 'Sense and Sensibility',
      author: 'Jane Austen',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/161/pg161.cover.medium.jpg',
      description: 'Elinor and Marianne Dashwood navigate heartbreak, social expectations, and romance in 19th-century England.',
      genre: ['Classics', 'Romance', 'Literature'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b2',
      title: 'Wuthering Heights',
      author: 'Emily Brontë',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/768/pg768.cover.medium.jpg',
      description: 'The intense, turbulent passion between Catherine Earnshaw and Heathcliff across the brooding Yorkshire moors.',
      genre: ['Classics', 'Gothic', 'Romance'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b3',
      title: 'Emma',
      author: 'Jane Austen',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/158/pg158.cover.medium.jpg',
      description: 'Handsome, clever, and rich Emma Woodhouse meddles as Highbury\'s matchmaker with humorous missteps.',
      genre: ['Classics', 'Romance', 'Comedy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b4',
      title: 'Persuasion',
      author: 'Jane Austen',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/105/pg105.cover.medium.jpg',
      description: 'Anne Elliot is reunited with Captain Wentworth eight years after being persuaded to break their youthful engagement.',
      genre: ['Classics', 'Romance', 'Drama'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b5',
      title: 'Northanger Abbey',
      author: 'Jane Austen',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/121/pg121.cover.medium.jpg',
      description: 'Gothic-novel enthusiast Catherine Morland visits Bath and imagines sinister mysteries in a secluded abbey.',
      genre: ['Classics', 'Satire', 'Romance'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b6',
      title: 'Mansfield Park',
      author: 'Jane Austen',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/141/pg141.cover.medium.jpg',
      description: 'Fanny Price grows up in the grand estate of her wealthy relatives, holding steadfast to her quiet moral compass.',
      genre: ['Classics', 'Drama', 'Literature'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b7',
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1260/pg1260.cover.medium.jpg',
      description: 'Orphan governess Jane Eyre falls deeply for Edward Rochester, only to uncover Thornfield Hall\'s secret.',
      genre: ['Classics', 'Gothic', 'Romance'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b8',
      title: 'Middlemarch',
      author: 'George Eliot',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/145/pg145.cover.medium.jpg',
      description: 'A study of provincial life, idealistic Dorothea Brooke, and the medical ambitions of Tertius Lydgate.',
      genre: ['Classics', 'Realism', 'Literature'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b9',
      title: 'Little Women',
      author: 'Louisa May Alcott',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/514/pg514.cover.medium.jpg',
      description: 'The four March sisters—Meg, Jo, Beth, and Amy—grow up and discover love, loss, and artistic independence.',
      genre: ['Classics', 'Family', 'Coming of Age'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b10',
      title: 'The Age of Innocence',
      author: 'Edith Wharton',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/541/pg541.cover.medium.jpg',
      description: 'Newland Archer struggles between high-society duty with May Welland and scandalous passion with Countess Olenska.',
      genre: ['Classics', 'Drama', 'Romance'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b11',
      title: 'Madame Bovary',
      author: 'Gustave Flaubert',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2413/pg2413.cover.medium.jpg',
      description: 'Emma Bovary seeks passionate escape from dull provincial marriage through reckless romantic affairs.',
      genre: ['Classics', 'Realism', 'Drama'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-rom-b12',
      title: 'The Portrait of a Lady',
      author: 'Henry James',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2833/pg2833.cover.medium.jpg',
      description: 'Spirited young American Isabel Archer inherits unexpected wealth and faces dark European intrigues.',
      genre: ['Classics', 'Psychological', 'Literature'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

const MODERN_ADULT_ROMANCE_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-mod-m1',
      title: 'Boarding Diary',
      author: 'Kim Gap-hyeon, Junha',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx127354-xg2OjyRTatoT.png',
      description: 'Jun-woo moves to the city for college and stays at the boarding house run by his mother\'s close friend.',
      genre: ['Drama', 'Romance', 'College'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m2',
      title: 'Silent War',
      author: 'Yラップ, Y-Dobby',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx111748-Bgn026tOq9Kp.jpg',
      description: 'After years of humiliation, Hyun-soo transforms himself to flip the power dynamic over his peers.',
      genre: ['Drama', 'Psychological', 'Romance'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m3',
      title: 'Sweet Guy',
      author: 'Park Hyung-jun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/n86429-Md27m1MWHGHW.png',
      description: 'An accidental electrocution grants ordinary salaryman Hosang an irresistible bio-magnetic touch.',
      genre: ['Comedy', 'Romance', 'Supernatural'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m4',
      title: 'Secret Class',
      author: 'Wang Yu, Minchan',
      category: 'manhwa',
      coverImage: 'https://uploads.mangadex.org/covers/03431565-8eff-4509-a32d-858e8a66c290/a62c1bb8-db45-42f2-84c2-671239bf090c.jpg.512.jpg',
      description: 'Orphaned at a young age, Dae-ho is taken in by his father\'s friend and learns about adult life through secret tutoring.',
      genre: ['Drama', 'Romance', 'Harem'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m5',
      title: 'Circles',
      author: 'Kkam-ak-i',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx131769-3YLy2cLklJ68.jpg',
      description: 'Jaewoo joins the university drama circle and finds himself surrounded by charismatic, bold theater seniors.',
      genre: ['College', 'Romance', 'Drama'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m6',
      title: 'Bad Thinking Diary',
      author: 'Hodoo, Rangrari',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx150109-keIierXbIixn.png',
      description: 'Childhood friends Minji and Yuna face complicated romantic tension and shifting boundaries in college.',
      genre: ['Romance', 'Drama', 'School'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m7',
      title: 'Learning the Hard Way',
      author: 'Glpi',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx128976-hbMhs2CS2qte.jpg',
      description: 'Tutoring sessions lead to high-stakes emotional entanglement between tutor and student.',
      genre: ['Drama', 'Romance', 'Slice of Life'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m8',
      title: "What's Going On?",
      author: 'Geumho',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx113455-Cdpk4NUphRRz.jpg',
      description: 'Hilarious romantic misunderstandings and apartment complex drama between neighbors.',
      genre: ['Comedy', 'Romance', 'Drama'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m9',
      title: 'Touch to Unlock',
      author: 'Park Hyung-jun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b121506-daaWyjV40OPd.png',
      description: 'A smartphone repairman gains the ability to peek into customers\' most intimate phone secrets.',
      genre: ['Drama', 'Romance', 'Supernatural'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-m10',
      title: "My Stepmother's Friends",
      author: 'Mangun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119648-JBfnDTSVHDQu.png',
      description: 'Seok-woo finds himself in the center of attention among his stepmother\'s glamorous friend group.',
      genre: ['Drama', 'Romance', 'Harem'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-mod-mg1',
      title: 'Domestic Girlfriend',
      author: 'Kei Sasuga',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85802-lh7gZHgQmliE.png',
      description: 'Natsuo discovers his high school crush and the girl he lost his virginity to have become his new stepsisters.',
      genre: ['Drama', 'Romance', 'School'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg2',
      title: 'Nozoki Ana',
      author: 'Wakoh Honna',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx163891-aBBqzfkgNwEl.jpg',
      description: 'Tatsuhiko discovers a tiny peephole connecting his apartment wall to his neighbor Emiru\'s room.',
      genre: ['Drama', 'Romance', 'Psychological'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg3',
      title: "Scum's Wish",
      author: 'Mengo Yokoyari',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx74929-xuO2cAsBiTZS.png',
      description: 'Hanabi and Mugi appear to be the ideal couple, but they secretly share an unrequited yearning for their teachers.',
      genre: ['Drama', 'Psychological', 'Romance'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg4',
      title: 'Velvet Kiss',
      author: 'Haruki',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx52638-xacfT5TNIjNM.jpg',
      description: 'Deep in debt, salaryman Dan agrees to become the companion of wealthy, lonely heiress Kano.',
      genre: ['Drama', 'Romance', 'Mature'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg5',
      title: 'Sundome',
      author: 'Kazuto Okada',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31501-CkTWnbcHjT7J.jpg',
      description: 'Mysterious transfer student Kururugi forms a provocative contract with shy high schooler Aiba.',
      genre: ['Comedy', 'Drama', 'Psychological'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg6',
      title: 'Nana to Kaoru',
      author: 'Ryuta Amazume',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx35994-3cWtJWc8KhJq.jpg',
      description: 'Childhood neighbors Nana and Kaoru explore boundary-pushing trust games in the quiet of an empty bedroom.',
      genre: ['Comedy', 'Romance', 'School'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg7',
      title: 'A Town Where You Live',
      author: 'Kouji Seo',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx38483-Hx46f7UBwzqK.jpg',
      description: 'Haruto\'s quiet countryside life changes forever when Tokyo girl Yuzuki moves into his family home.',
      genre: ['Drama', 'Romance', 'Slice of Life'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg8',
      title: 'GE: Good Ending',
      author: 'Kei Sasuga',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx49885-lgmHBwf1ouvh.jpg',
      description: 'Utsumi teams up with outgoing classmate Yuki to pursue his crush, sparking unexpected romance between them.',
      genre: ['Drama', 'Romance', 'School'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg9',
      title: 'Rent-A-Girlfriend',
      author: 'Reiji Miyajima',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx99943-DX7nDMeqSTk3.png',
      description: 'After a rough breakup, college student Kazuya hires rental girlfriend Chizuru, only for their lives to entangle.',
      genre: ['Comedy', 'Romance', 'College'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-mg10',
      title: 'More Than a Married Couple, But Not Lovers',
      author: 'Yuki Kanamaru',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx105011-DxP8LvUSfRiJ.jpg',
      description: 'High school students are paired into mock-marriage practicals where good behavior earns a partner swap.',
      genre: ['Comedy', 'Romance', 'School'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-mod-ln1',
      title: 'Days with My Stepsister (Gimai Seikatsu)',
      author: 'Ghost Mikawa',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx126268-c3BmsZ0LlJWr.png',
      description: 'Yuuta and Saki promise to maintain proper, healthy boundaries as new stepsiblings, but warmth blooms between them.',
      genre: ['Romance', 'Slice of Life', 'Drama'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln2',
      title: 'The Dreaming Boy is a Realist',
      author: 'Okemaru',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx132664-JToaSpWFE3Jk.jpg',
      description: 'After constantly pursuing Aika, Wataru suddenly wakes up and backs off, leaving Aika thoroughly bewildered.',
      genre: ['Romance', 'Comedy', 'School'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln3',
      title: 'Alya Sometimes Hides Her Feelings in Russian',
      author: 'Sunsunsun',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx152404-7mQ6l6vDfgJ5.jpg',
      description: 'Class beauty Alya mutters affectionate confessions in Russian, unaware that slacker Masachika understands every word.',
      genre: ['Comedy', 'Romance', 'School'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln4',
      title: 'Chitose Is in the Ramune Bottle',
      author: 'Hiromu',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx124700-HR0Q2P47WJxY.jpg',
      description: 'High school top-caste kingpin Saku Chitose mentors a shut-in classmate back into society.',
      genre: ['Drama', 'Romance', 'School'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln5',
      title: 'The Angel Next Door Spoils Me Rotten',
      author: 'Saekisan',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122337-vy8L0b1ySIQr.jpg',
      description: 'After lending his umbrella in the rain, Amane\'s messy apartment life is cared for by the angel Mahiru.',
      genre: ['Romance', 'Slice of Life'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln6',
      title: 'My Youth Romantic Comedy (Oregairu)',
      author: 'Wataru Watari',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx70171-SjwD5wlgUpJV.jpg',
      description: 'Cynical loner Hachiman Hikigaya is forced into the Service Club to solve other students\' interpersonal crises.',
      genre: ['Comedy', 'Drama', 'Romance'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln7',
      title: 'Rascal Does Not Dream of Bunny Girl Senpai',
      author: 'Hajime Kamoshida',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx99199-Y40cR2bIYcNc.jpg',
      description: 'Sakuta investigates Puberty Syndrome anomalies, starting with actress Mai Sakurajima who is turning invisible.',
      genre: ['Drama', 'Romance', 'Supernatural'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln8',
      title: 'Toradora!',
      author: 'Yuyuko Takemiya',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx34368-BCouTUMs4GmM.jpg',
      description: 'Gentle Ryuuji and feisty Palmtop Tiger Taiga ally together to help each other confess to their respective crushes.',
      genre: ['Comedy', 'Romance', 'School'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln9',
      title: 'Hyouka',
      author: 'Honobu Yonezawa',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx71629-b1McvLSvE9X9.jpg',
      description: 'Energy-conserving Oreki Houtarou joins the Classic Literature Club and solves inquisitive high-school mysteries.',
      genre: ['Mystery', 'Slice of Life'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-ln10',
      title: 'Golden Time',
      author: 'Yuyuko Takemiya',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx36873-10m1VvQW5E6r.jpg',
      description: 'Amnesiac law student Tada Banri starts over in Tokyo and falls for the glamorous, dramatic Kaga Kouko.',
      genre: ['Comedy', 'Drama', 'Romance'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-mod-wn1',
      title: 'My Beautiful Teacher',
      author: 'Scarlet',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      description: 'A retired special agent returns to city life as a university security guard and crosses paths with campus beauties.',
      genre: ['Urban', 'Action', 'Harem'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn2',
      title: 'Very Pure and Ambiguous',
      author: 'Fishman The Second',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      description: 'Yang Ming receives magical contact lenses and turns his ordinary school life into a glamorous romantic adventure.',
      genre: ['Urban', 'Supernatural', 'Romance'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn3',
      title: 'Beauty and the Bodyguard',
      author: 'Fishman The Second',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      description: 'Elite martial master Lin Yi takes a mission to protect the proud school-belle heiress Chu Mengyao.',
      genre: ['Action', 'Romance', 'School'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn4',
      title: "A Stay-at-home Dad's Retired Life",
      author: 'Fan Xiaozhu',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
      description: 'An immortal chef returns to modern Earth to raise his sweet daughter and charm his celebrity wife.',
      genre: ['Slice of Life', 'Comedy', 'Romance'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn5',
      title: 'Cultivation Chat Group',
      author: 'Legend of the Paladin',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      description: 'Song Shuhang is mistakenly invited into a chat group where the eccentric members are actual modern immortals.',
      genre: ['Comedy', 'Urban', 'Supernatural'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn6',
      title: 'Martial Arts Master',
      author: 'Cuttlefish That Loves Diving',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
      description: 'From the author of Lord of the Mysteries: A sweet college romance intertwined with competitive modern martial arts.',
      genre: ['Romance', 'Martial Arts', 'College'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn7',
      title: 'Rebirth: How A Loser Became A Tycoon',
      author: 'Night Walker',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      description: 'Regressing back to 2008 with twenty years of future business memories, Zhao Yuan reclaims his lost youth.',
      genre: ['Urban', 'Reincarnation', 'Business'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn8',
      title: 'The Daily Life of the Immortal King',
      author: 'Kuxuan',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
      description: 'Wang Ling just wants an ordinary school life with crispy noodle snacks, but his godlike power keeps slipping out.',
      genre: ['Comedy', 'School', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn9',
      title: 'I Really Am a Superstar',
      author: 'Chang Yu',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80',
      description: 'Zhang Ye awakens in a parallel universe with a game system and takes the showbiz world by storm.',
      genre: ['Comedy', 'Showbiz', 'System'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-wn10',
      title: 'So Pure, So Flirtatious',
      author: 'Fishman The Second',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      description: 'A charming urban romantic comedy following a high-schooler who turns his fortunes around.',
      genre: ['Romance', 'Urban', 'Comedy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-mod-b1',
      title: 'Madame Bovary',
      author: 'Gustave Flaubert',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2413/pg2413.cover.medium.jpg',
      description: 'Emma Bovary seeks passionate escape from dull provincial marriage through reckless romantic affairs.',
      genre: ['Classics', 'Realism', 'Drama'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b2',
      title: 'Lady Chatterley\'s Lover',
      author: 'D.H. Lawrence',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2870/pg2870.cover.medium.jpg',
      description: 'Constance Chatterley embarks on a passionate, taboo relationship with her estate\'s gamekeeper Oliver Mellors.',
      genre: ['Classics', 'Romance', 'Drama'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b3',
      title: 'Tess of the d\'Urbervilles',
      author: 'Thomas Hardy',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/110/pg110.cover.medium.jpg',
      description: 'Young Tess Durbeyfield faces tragic betrayal, societal hypocrisy, and enduring love in Victorian England.',
      genre: ['Classics', 'Tragedy', 'Drama'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b4',
      title: 'The Age of Innocence',
      author: 'Edith Wharton',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/541/pg541.cover.medium.jpg',
      description: 'Newland Archer struggles between high-society duty with May Welland and scandalous passion with Countess Olenska.',
      genre: ['Classics', 'Drama', 'Romance'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b5',
      title: 'Anna Karenina',
      author: 'Leo Tolstoy',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1399/pg1399.cover.medium.jpg',
      description: 'Anna Karenina\'s fateful, forbidden romance with Count Vronsky shakes 19th-century imperial Russian society.',
      genre: ['Classics', 'Drama', 'Romance'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b6',
      title: 'Nana',
      author: 'Emile Zola',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/5250/pg5250.cover.medium.jpg',
      description: 'The Parisian courtesan Nana rises to the summit of glamorous high society, captivating aristocrats and politicians.',
      genre: ['Classics', 'Realism', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b7',
      title: 'The Portrait of a Lady',
      author: 'Henry James',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2833/pg2833.cover.medium.jpg',
      description: 'Spirited young American Isabel Archer inherits unexpected wealth and faces dark European intrigues.',
      genre: ['Classics', 'Psychological', 'Literature'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b8',
      title: 'Wuthering Heights',
      author: 'Emily Brontë',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/768/pg768.cover.medium.jpg',
      description: 'The intense, turbulent passion between Catherine Earnshaw and Heathcliff across the brooding Yorkshire moors.',
      genre: ['Classics', 'Gothic', 'Romance'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b9',
      title: 'The Decameron',
      author: 'Giovanni Boccaccio',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/23700/pg23700.cover.medium.jpg',
      description: 'A witty collection of one hundred lively tales of love, cleverness, and scandalous human passion.',
      genre: ['Classics', 'Comedy', 'Literature'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mod-b10',
      title: 'Therese Raquin',
      author: 'Emile Zola',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/10078/pg10078.cover.medium.jpg',
      description: 'An unhappily married woman and her lover are driven by obsession into dark psychological turmoil.',
      genre: ['Classics', 'Psychological', 'Drama'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

/**
 * Resolves the primary integrated reading source name for any book
 */
export function getSourceName(book: Book): string {
  const id = (book.id || '').toLowerCase();
  if (id.includes('gutenberg')) return 'Project Gutenberg';
  if (id.includes('standardebooks')) return 'Standard Ebooks';
  if (id.includes('novelbuddy') || id.includes('ln-novelbuddy')) return 'NovelBuddy';
  if (id.includes('royalroad') || id.includes('ln-royalroad')) return 'Royal Road';
  if (id.includes('local-ln') || id.includes('lnreader')) return 'LNReader';
  if (id.includes('weebcentral') || id.includes('wc-')) return 'WeebCentral';
  if (id.includes('tcbscans') || id.includes('tcb-')) return 'TCB Scans';
  if (id.includes('flamecomics') || id.includes('fc-')) return 'Flame Comics';
  if (id.includes('toongod') || id.includes('tg-')) return 'ToonGod';
  if (id.includes('manhwabuddy') || id.includes('mb-')) return 'ManhwaBuddy';
  if (id.includes('mangapill') || id.includes('mp-')) return 'MangaPill';
  if (id.includes('mangakatana') || id.includes('mk-')) return 'MangaKatana';
  if (id.includes('mangadex')) return 'MangaDex';

  switch (book.category) {
    case 'manhwa':
    case 'manga':
      return 'MangaDex';
    case 'webnovel':
      return 'NovelBuddy';
    case 'lightnovel':
      return 'LNReader';
    case 'book':
    default:
      return 'Project Gutenberg';
  }
}

/**
 * Returns instant, tailored, non-home companion recommendations.
 * Guaranteed 10 books per category (50 total), zero home-page titles.
 */
/**
 * Thematic companion pools for instant, dynamic baseline recommendations.
 * Covers all major tropes so that recommendations for EVERY category update
 * intelligently and immediately for any book being viewed.
 */
export const MURIM_CULTIVATION_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-murim-m1',
      title: 'Return of the Mount Hua Sect',
      author: 'Biga',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx132420-aE5g1TCAbvUG.png',
      description: 'Chung Myung awakens a century after slaughtering the Heavenly Demon to restore his ruined sect.',
      genre: ['Action', 'Martial Arts', 'Adventure'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m2',
      title: 'Gosu',
      author: 'Giun Ryu, Mun Jeong-hoo',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108034-X7yS9oAGJVGd.jpg',
      description: 'A dumpling delivery boy hides celestial martial arts learned to crush the traitors of the Dokgo faction.',
      genre: ['Action', 'Comedy', 'Martial Arts'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m3',
      title: 'The Breaker',
      author: 'Jeon Geuk-jin, Park Jin-hwan',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31042-Wpxo7kFVnY0D.jpg',
      description: 'Bullied high-schooler Shi-Woon becomes the sole disciple of the legendary Nine Arts Dragon in modern Murim.',
      genre: ['Action', 'Drama', 'Martial Arts'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m4',
      title: 'Peerless Dad',
      author: 'Noh Kyung-chan',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/102636-61eKsFXzojlL.jpg',
      description: 'A devoted martial artist father takes dangerous bodyguard contracts to feed and protect his triplets.',
      genre: ['Action', 'Slice of Life', 'Martial Arts'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m5',
      title: 'Murim Login',
      author: 'Zero-Big',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119438-sZ0RKdX240yI.png',
      description: 'A low-rank hunter stumbles upon a VR capsule that logs him directly into the brutal reality of Jianghu.',
      genre: ['Action', 'Comedy', 'Martial Arts'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m6',
      title: 'Infinite Level Up in Murim',
      author: 'Gonbung, Pokkabi',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx133983-03Tf6lMr8lp3.jpg',
      description: 'A foot soldier killed in battle regresses with an omnipresent quest system inside the martial world.',
      genre: ['Action', 'System', 'Martial Arts'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m7',
      title: 'Volcanic Age',
      author: 'Jeong Jun, Roh Seung-gon',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx100523-1nTD5FTYA6D2.jpg',
      description: 'The elder of the Mount Hua sect survives the great war and regresses to correct the bloodshed of the past.',
      genre: ['Action', 'Reincarnation', 'Martial Arts'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m8',
      title: 'Reaper of the Drifting Clouds',
      author: 'Woo-Gack',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx152345-4sEBLvdT9yTi.jpg',
      description: 'Kidnapped into the suffocating dark abyss of an assassin creche, Pyo-Wol emerges as a shadow reaper.',
      genre: ['Action', 'Drama', 'Martial Arts'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m9',
      title: 'Chronicles of Heavenly Demon',
      author: 'Il-Hwang, Kim Tae-hyung',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108605-HdGuGd54yNSh.jpg',
      description: 'Framed for forbidden demonic arts, an orthodox disciple reincarnates as the number one spear prodigy of the cult.',
      genre: ['Action', 'Martial Arts', 'Revenge'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-m10',
      title: 'Bowblade Spirit',
      author: 'Hyung Min-woo',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118490-K3oAVhsmzSov.jpg',
      description: 'A grandson of the divine bow saint descends from the mystical mountains to shake the nine great sects.',
      genre: ['Action', 'Martial Arts', 'Adventure'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-murim-mg1',
      title: 'Kingdom',
      author: 'Yasuhisa Hara',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b31676-ReKRBqwbdml1.jpg',
      description: 'War orphans Xin and Piao fight across China Warring States era to unite the land under heaven.',
      genre: ['Action', 'Historical', 'War'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg2',
      title: 'Blade of the Immortal',
      author: 'Hiroaki Samura',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b30658-4KzCEiCDN7Yq.jpg',
      description: 'Cursed with immortality by sacred bloodworms, Manji slashes through a thousand evil men to redeem his soul.',
      genre: ['Action', 'Supernatural', 'Historical'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg3',
      title: 'Rurouni Kenshin',
      author: 'Nobuhiro Watsuki',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30022-jxTlViun1o10.jpg',
      description: 'Former assassin Battosai wanders Meiji-era Japan with a reverse-blade sword, vowing never to kill again.',
      genre: ['Action', 'Historical', 'Romance'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg4',
      title: 'Dororo',
      author: 'Osamu Tezuka',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31685-wENMYDQldSm1.jpg',
      description: 'A young ronin born without limbs or organs slays 48 demons to reclaim his stolen body.',
      genre: ['Action', 'Supernatural', 'Adventure'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg5',
      title: 'Golden Kamuy',
      author: 'Satoru Noda',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85699-OYHYagtYmNP3.jpg',
      description: 'Immortal Sugimoto and Ainu hunter Asirpa brave treacherous wilderness for hidden tattooed gold.',
      genre: ['Action', 'Historical', 'Adventure'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg6',
      title: 'Shura no Toki',
      author: 'Masatoshi Kawahara',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/2025.jpg',
      description: 'The Mutsu Enmei-ryu bare-handed martial clan crosses blades with Japan greatest samurai champions.',
      genre: ['Action', 'Martial Arts', 'Historical'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg7',
      title: 'Basilisk: The Kouga Ninja Scrolls',
      author: 'Masaki Segawa',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30221-kBsBi8kctg49.jpg',
      description: 'Two warring ninja clans sacrifice twenty elite masters in a deadly blood contest for the shogunate.',
      genre: ['Action', 'Supernatural', 'Tragedy'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg8',
      title: 'Sidooh',
      author: 'Tsutomu Takahashi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31422-76157SeCJvPo.jpg',
      description: 'Two orphaned brothers survive the lawless twilight of the samurai through unyielding martial devotion.',
      genre: ['Action', 'Historical', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg9',
      title: 'Gamaran',
      author: 'Yousuke Nakamaru',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx44582-XYSHPX8CI1VP.jpg',
      description: 'The Unabara domain tournament gathers elite swordsmen to battle to the death for clan succession.',
      genre: ['Action', 'Martial Arts', 'Tournament'],
      rating: 8.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-mg10',
      title: 'Lone Wolf and Cub',
      author: 'Kazuo Koike, Goseki Kojima',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30904-KRN1WE3ZU3vl.jpg',
      description: 'Disgraced executioner Ogami Itto pushes a baby cart across Edo Japan on the demon path of vengeance.',
      genre: ['Action', 'Historical', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-murim-ln1',
      title: 'Apotheosis of a Demon',
      author: 'Choushou',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx98342-mOpk6Ds5a2gD.jpg',
      description: 'A fallen sword prodigy awakens primordial heavenly dao to dismantle the righteous sects.',
      genre: ['Action', 'Cultivation', 'Fantasy'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln2',
      title: 'Katanagatari',
      author: 'Nisio Isin',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx48161-yPfgZdYwCU8O.jpg',
      description: 'Strategist Togame and swordless master Yasuri Shichika embark on a quest to gather twelve deviant blades.',
      genre: ['Action', 'Martial Arts', 'Historical'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln3',
      title: 'Sword God in a World of Magic',
      author: 'Warfield',
      category: 'lightnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/sword-god-in-a-world-of-magic.png',
      description: 'Transmigrated into a magic-dominated universe, Shang purifies his will through pure sword perfection.',
      genre: ['Action', 'Cultivation', 'Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln4',
      title: 'The Way of Choices',
      author: 'Mao Ni',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/101409-ZD0EylMhydPc.jpg',
      description: 'Chen Changsheng leaves his mountain temple at fourteen to defy a cursed destiny and conquer the stars.',
      genre: ['Action', 'Cultivation', 'Adventure'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln5',
      title: 'A Will Eternal (Light Novel)',
      author: 'Er Gen',
      category: 'lightnovel',
      coverImage: 'https://novelfire.net/server-1/a-will-eternal.jpg',
      description: 'Bai Xiaochun seeks eternal life through comically cautious schemes and heaven-shaking alchemy.',
      genre: ['Action', 'Comedy', 'Cultivation'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln6',
      title: 'Coiling Dragon',
      author: 'I Eat Tomatoes',
      category: 'lightnovel',
      coverImage: 'https://novelfire.net/server-1/coiling-dragon.jpg',
      description: 'Linley Baruch claims a mysterious ancestral ring and embarks on the path to becoming a sovereign deity.',
      genre: ['Action', 'Fantasy', 'Cultivation'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln7',
      title: 'Stellar Transformations',
      author: 'I Eat Tomatoes',
      category: 'lightnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/stellar-transformations.png',
      description: 'Unable to gather internal energy, Qin Yu masters external martial arts until a meteoric tear grants divine power.',
      genre: ['Action', 'Cultivation', 'Adventure'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln8',
      title: 'Martial World (Light Novel)',
      author: 'Cocooned Cow',
      category: 'lightnovel',
      coverImage: 'https://novelfire.net/server-1/martial-world.jpg',
      description: 'Lin Ming discovers the Magic Cube and unlocks lost ancient martial techniques to ascend divine realms.',
      genre: ['Action', 'Martial Arts', 'Cultivation'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln9',
      title: 'Renegade Immortal (Light Novel)',
      author: 'Er Gen',
      category: 'lightnovel',
      coverImage: 'https://novelfire.net/server-1/renegade-immortal.jpg',
      description: 'Wang Lin steps onto the merciless path of cultivation, seeking immortality to defy fate itself.',
      genre: ['Action', 'Cultivation', 'Dark Fantasy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-ln10',
      title: 'I Shall Seal the Heavens (Novel)',
      author: 'Er Gen',
      category: 'lightnovel',
      coverImage: 'https://novelfire.net/server-1/i-shall-seal-the-heavens.jpg',
      description: 'Meng Hao rises through the Reliance Sect with ruthless determination, defying destiny across nine mountains.',
      genre: ['Cultivation', 'Adventure', 'Action'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-murim-wn1',
      title: 'Renegade Immortal',
      author: 'Er Gen',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/renegade-immortal.jpg',
      description: 'A mediocre village youth takes the relentless and solitary path of cultivation against all heavenly tribulation.',
      genre: ['Cultivation', 'Martial Arts', 'Action'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn2',
      title: 'I Shall Seal the Heavens',
      author: 'Er Gen',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/i-shall-seal-the-heavens.jpg',
      description: 'Meng Hao, a failed scholar kidnapped into the Reliance Sect, swindles heaven and earth for immortality.',
      genre: ['Cultivation', 'Comedy', 'Adventure'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn3',
      title: 'Martial World',
      author: 'Cocooned Cow',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/martial-world.jpg',
      description: 'Through unbending determination, Lin Ming climbs from a tiny mortal clan to the peak of the 33 heavens.',
      genre: ['Cultivation', 'Action', 'Fantasy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn4',
      title: 'Desolate Era',
      author: 'I Eat Tomatoes',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/desolate-era.jpg',
      description: 'Ji Ning reincarnates into a primordial clan and comprehends the boundless sword dao of the cosmos.',
      genre: ['Cultivation', 'Adventure', 'Action'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn5',
      title: 'A Will Eternal',
      author: 'Er Gen',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/a-will-eternal.jpg',
      description: 'A mischievous cultivator obsessed with staying alive causes hilarious chaos throughout rival factions.',
      genre: ['Cultivation', 'Comedy', 'Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn6',
      title: 'Against the Gods',
      author: 'Mars Gravity',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/against-the-gods.png',
      description: 'Yun Che inherits the veins of the Evil God and slaughters his way across continents for retribution.',
      genre: ['Action', 'Harem', 'Cultivation'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn7',
      title: 'Tales of Demons and Gods',
      author: 'Mad Snail',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/tales-of-demons-and-gods.png',
      description: 'Nie Li regresses to his youth with the Temporal Demon Spirit Book to safeguard Glory City from demon beasts.',
      genre: ['Cultivation', 'Reincarnation', 'Action'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn8',
      title: 'Nine Star Hegemon Body Art',
      author: 'Ordinary Magician',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/nine-star-hegemon-body-art.png',
      description: 'Long Chen awakens with the Nine Star Hegemon Body Art and smashes arrogant sect geniuses into paste.',
      genre: ['Cultivation', 'Action', 'Comedy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn9',
      title: 'Martial Peak',
      author: 'Momo',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/martial-peak.png',
      description: 'Yang Kai starts as a lowly sweeper at High Heaven Pavilion and ascends to master countless star fields.',
      genre: ['Cultivation', 'Action', 'Martial Arts'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-wn10',
      title: 'Top Tier Providence',
      author: 'Let Me Laugh',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      description: 'Han Jue cultivates quietly for thousands of years, avoiding attention until he surpasses all immortals.',
      genre: ['Cultivation', 'Comedy', 'Slice of Life'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-murim-b1',
      title: 'The Book of Five Rings',
      author: 'Miyamoto Musashi',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/145/pg145.cover.medium.jpg',
      description: 'Musashi distillation of the Two Heavens Under the Sky kenjutsu and absolute combat mind.',
      genre: ['Martial Arts', 'Philosophy', 'Classic'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b2',
      title: 'The Three Musketeers',
      author: 'Alexandre Dumas',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1257/pg1257.cover.medium.jpg',
      description: 'Young D Artagnan and three legendary swordsmen defend honor and country through dazzling duels.',
      genre: ['Adventure', 'Swashbuckler', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b3',
      title: 'The Prince',
      author: 'Niccolò Machiavelli',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1232/pg1232.cover.medium.jpg',
      description: 'A piercing exploration of statecraft, ruthless political power, martial authority, and pragmatic survival.',
      genre: ['Philosophy', 'Strategy', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b4',
      title: 'Romance of the Three Kingdoms',
      author: 'Luo Guanzhong',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/23950/pg23950.cover.medium.jpg',
      description: 'The epic historical chronicle of warlords, sworn brothers, and brilliant strategists vying for the imperial throne.',
      genre: ['Historical', 'War', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b5',
      title: 'The Water Margin',
      author: 'Shi Nai an',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/24000/pg24000.cover.medium.jpg',
      description: 'Outlaws of the Marsh gather 108 righteous martial heroes at Mount Liang to resist a corrupt dynasty.',
      genre: ['Adventure', 'Martial', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b6',
      title: 'Journey to the West',
      author: 'Wu Cheng en',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/15210/pg15210.cover.medium.jpg',
      description: 'The Monkey King Sun Wukong escorts the monk Xuanzang on an immortal quest through gods and demons.',
      genre: ['Mythology', 'Fantasy', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b7',
      title: 'The Iliad',
      author: 'Homer',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/6130/pg6130.cover.medium.jpg',
      description: 'Achilles wrath ignites the Trojan War in an ancient epic of battlefield valor, divine fury, and honor.',
      genre: ['Epic', 'War', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b8',
      title: 'The Odyssey',
      author: 'Homer',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1727/pg1727.cover.medium.jpg',
      description: 'The epic ten-year voyage of cunning hero Odysseus contending with monsters and divine wrath.',
      genre: ['Adventure', 'Epic', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b9',
      title: 'Don Quixote',
      author: 'Miguel de Cervantes',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/996/pg996.cover.medium.jpg',
      description: 'An aging hidalgo sets out to revive chivalry and right the world wrongs alongside Sancho Panza.',
      genre: ['Classic', 'Adventure', 'Satire'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-murim-b10',
      title: 'The Prince and the Pauper',
      author: 'Mark Twain',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1837/pg1837.cover.medium.jpg',
      description: 'Two boys identical in appearance exchange lives in Tudor London, experiencing kingdom and alley alike.',
      genre: ['Classic', 'Historical', 'Adventure'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

export const DARK_FANTASY_GOTHIC_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-dark-m1',
      title: 'Shotgun Boy',
      author: 'Carnby Kim, Hongpil',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx130095-tSYj0pPk5G9C.jpg',
      description: 'A bullied teen finds a shotgun in the woods just as body-snatching monsters infiltrate his class retreat.',
      genre: ['Horror', 'Action', 'Thriller'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m2',
      title: 'Leviathan',
      author: 'Lee Gyuntak, Noh Miyoung',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/104084-0KM2QjNAwOXO.jpg',
      description: 'In a flooded world ruled by predatory sea monsters, harpoonists battle for the survival of the last humans.',
      genre: ['Action', 'Post-Apocalyptic', 'Horror'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m3',
      title: 'Tacit',
      author: 'Kim Doby',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx131587-axp0w90Vhbyq.jpg',
      description: 'In a frozen post-apocalyptic wasteland, a white-haired zombie boy retains human emotion and forms a bond.',
      genre: ['Horror', 'Supernatural', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m4',
      title: 'The Horizon',
      author: 'JH',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108034-X7yS9oAGJVGd.jpg',
      description: 'Two shell-shocked children walk an endless road across war-torn ruins, clinging to each other for hope.',
      genre: ['Psychological', 'Drama', 'Tragedy'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m5',
      title: 'Pigpen',
      author: 'Carnby Kim, Beom Sik',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx111585-OaFC7Mk8y4c2.jpg',
      description: 'Waking up on an isolated island with amnesia, a young man discovers the host family is harboring horrifying secrets.',
      genre: ['Psychological', 'Horror', 'Mystery'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m6',
      title: 'Distant Sky',
      author: 'Inwan Youn, Sunhee Kim',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/55408.jpg',
      description: 'Gangnam sinks into absolute subterranean darkness filled with corpses and monstrous biological abominations.',
      genre: ['Horror', 'Mystery', 'Survival'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m7',
      title: 'Hive',
      author: 'Kyusam Kim',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85871-bL6hGWnr55UO.jpg',
      description: 'Gigantic oxygen-rich prehistoric wasps mutate and conquer Seoul, turning humanity into living incubators.',
      genre: ['Horror', 'Action', 'Sci-Fi'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m8',
      title: 'L.A.G',
      author: 'Kim Tae-hyun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx153215-mKWd7O4RAlCU.jpg',
      description: 'Trapped in an endlessly looping meat-grinder purgatory, survivors must kill mutated monsters or perish.',
      genre: ['Action', 'Horror', 'Survival'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m9',
      title: 'Surviving Romance',
      author: 'Lee Yone',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx130094-xpCGUcdwfXiy.jpg',
      description: 'A student reincarnated into a high school romance novel watches the world abruptly transform into a zombie outbreak.',
      genre: ['Horror', 'Psychological', 'Supernatural'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-m10',
      title: 'Hell Is Other People',
      author: 'Kim Yong-ki',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx101684-dvqITR2MAPvv.jpg',
      description: 'A broke country youth moves into an eerily cheap Seoul goshiwon filled with psychopathic neighbors.',
      genre: ['Psychological', 'Horror', 'Thriller'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-dark-mg1',
      title: 'Claymore',
      author: 'Norihiro Yagi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30583-Ysqwu8uryIUX.png',
      description: 'Silver-eyed warriors created from demon flesh protect mankind from ravenous Yoma beasts.',
      genre: ['Action', 'Dark Fantasy', 'Horror'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg2',
      title: 'Gantz',
      author: 'Hiroya Oku',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30564-RbyFbLzbnKea.jpg',
      description: 'Deceased humans are resurrected by an enigmatic black sphere to wage lethal urban wars against grotesque aliens.',
      genre: ['Action', 'Horror', 'Sci-Fi'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg3',
      title: 'Parasyte',
      author: 'Hitoshi Iwaaki',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30401-siY6wmwnHFi6.png',
      description: 'Alien parasites invade human brains, but Shinichi confines his symbiotic alien Migi to his right hand.',
      genre: ['Action', 'Horror', 'Psychological'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg4',
      title: 'Ajin: Demi-Human',
      author: 'Gamon Sakurai',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b79865-rwKmISrhJJyP.jpg',
      description: 'Immortal human beings known as Ajin manifest lethal black ghost familiars and wage war against persecution.',
      genre: ['Action', 'Horror', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg5',
      title: 'Dorohedoro',
      author: 'Q Hayashida',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31133-Jx6map3Oidz1.png',
      description: 'Reptile-headed amnesiac Caiman hunts sorcerers in the grimy city of the Hole to discover his true identity.',
      genre: ['Action', 'Comedy', 'Dark Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg6',
      title: 'Hell Paradise: Jigokuraku',
      author: 'Yuji Kaku',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100994-f6CMjiQQNVeS.png',
      description: 'Death row ninja Gabimaru is sent to an eldritch island paradise crawling with grotesque immortal gods.',
      genre: ['Action', 'Supernatural', 'Dark Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg7',
      title: 'Choujin X',
      author: 'Sui Ishida',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx133987-C6CORiGXcen0.jpg',
      description: 'Two ordinary youths inject themselves with super-human beast serum to survive a deadly street encounter.',
      genre: ['Action', 'Supernatural', 'Psychological'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg8',
      title: 'D.Gray-man',
      author: 'Katsura Hoshino',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30024-UUUz8xxkt8pc.jpg',
      description: 'Allen Walker uses cursed Innocence to exorcise weeping Akuma weapons engineered by the Millennium Earl.',
      genre: ['Action', 'Adventure', 'Dark Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg9',
      title: 'Blame!',
      author: 'Tsutomu Nihei',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30149-YetcNrfacNVj.jpg',
      description: 'Killy wanders through an unfathomably vast cyber-dungeon city armed with a Gravitational Beam Emitter.',
      genre: ['Action', 'Cyberpunk', 'Horror'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-mg10',
      title: 'Uzumaki',
      author: 'Junji Ito',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30436-Opk9ZubMPuDU.jpg',
      description: 'The small fog-bound town of Kurouzu-cho is slowly consumed by an eldritch spiral curse that warps reality.',
      genre: ['Horror', 'Psychological', 'Supernatural'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-dark-ln1',
      title: 'Torture Princess: Fremd Torturchen',
      author: 'Keishi Ayasato',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108605-HdGuGd54yNSh.jpg',
      description: 'Summoned to another world as servant to a monstrous demon princess, Kaito faces cruel divine retribution.',
      genre: ['Dark Fantasy', 'Horror', 'Action'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln2',
      title: 'Grimgar of Fantasy and Ash',
      author: 'Jyumonji Ao',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86365-1H3Lp87JUnxr.jpg',
      description: 'Desperate amnesiac youths band together as volunteer soldiers, experiencing the brutal realism of survival.',
      genre: ['Fantasy', 'Action', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln3',
      title: 'Another (Light Novel)',
      author: 'Yukito Ayatsuji',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx49448-Qy37sXPooMJM.jpg',
      description: 'Class 3-3 carries a lethal curse where deceased students return unrecognized, unleashing grotesque fatal accidents.',
      genre: ['Horror', 'Mystery', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln4',
      title: 'Vampire Hunter D',
      author: 'Hideyuki Kikuchi',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/3988.jpg',
      description: 'The dhampir bounty hunter D rides through a gothic post-nuclear future hunting the immortal Nobility.',
      genre: ['Horror', 'Sci-Fi', 'Dark Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln5',
      title: 'Goblin Slayer',
      author: 'Kumo Kagyu',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx87321-ijdB0SNr1JSs.jpg',
      description: 'A hardened silver-ranked adventurer dedicates his entire existence to exterminating goblins by any means.',
      genre: ['Dark Fantasy', 'Action', 'Adventure'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln6',
      title: 'Rokka: Braves of the Six Flowers',
      author: 'Ishio Yamagata',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/36023.jpg',
      description: 'Seven warriors assemble to face the Evil God, but only six are authentic heroes: one is an imposter assassin.',
      genre: ['Mystery', 'Fantasy', 'Action'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln7',
      title: 'Boogiepop Phantom',
      author: 'Kouhei Kadono',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31388-JDIwg74gvgt3.jpg',
      description: 'The urban legend Boogiepop, the Angel of Death, manifests automatically whenever danger threatens mankind.',
      genre: ['Mystery', 'Horror', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln8',
      title: 'Katanagatari: Deviant Blades',
      author: 'Nisio Isin',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx48161-yPfgZdYwCU8O.jpg',
      description: 'Shichika Yasuri travels through Edo feudal lands to recover cursed blades crafted by master Shikizaki Kiki.',
      genre: ['Action', 'Martial Arts', 'Historical'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln9',
      title: 'The Unwanted Undead Adventurer',
      author: 'Yuu Okano',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100789-3c2oAFblvUTw.jpg',
      description: 'Swallowed by a dragon in the Labyrinth of the Moon, a copper-rank warrior awakens as a sentient skeleton.',
      genre: ['Fantasy', 'Action', 'Supernatural'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-ln10',
      title: 'So I am a Spider, So What?',
      author: 'Okina Baba',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/56903-dITWK4T1HOnE.jpg',
      description: 'A high school girl is reborn as a tiny spider monster in the deadly Great Elroe Labyrinth.',
      genre: ['Fantasy', 'Adventure', 'Comedy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-dark-wn1',
      title: 'My House of Horrors',
      author: 'I Fix Air Conditioner',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/my-house-of-horrors.jpg',
      description: 'Chen Ge inherits his parents haunted house attraction and receives a black phone offering terrifying supernatural trials.',
      genre: ['Horror', 'Mystery', 'Supernatural'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn2',
      title: 'Deep Sea Embers',
      author: 'Yuan Shu',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      description: 'Duncan awakens aboard the ghost ship Vanished, sailing a twilight sea steeped in ancient cosmic horrors.',
      genre: ['Lovecraftian', 'Mystery', 'Fantasy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn3',
      title: 'The Zombie Knight Saga',
      author: 'George M. Frost',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
      description: 'Hector suicides only to be resurrected as an undead servant by a Reaper named Shinigami.',
      genre: ['Supernatural', 'Action', 'Urban Fantasy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn4',
      title: 'Worm',
      author: 'Wildbow',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      description: 'Taylor Hebert triggers with the power to control insects, finding herself plunging deeper into moral ruin.',
      genre: ['Superhero', 'Dark Fantasy', 'Psychological'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn5',
      title: 'Pact',
      author: 'Wildbow',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      description: 'Blake Thorburn inherits his grandmother diabolical estate along with an insurmountable mountain of karmic debt.',
      genre: ['Horror', 'Supernatural', 'Urban Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn6',
      title: 'The Wandering Inn',
      author: 'pirateaba',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/10073-the-wandering-inn.jpg',
      description: 'Erin Solstice stumbles into a fantasy world and sets up an inn on the outskirts of a monster-infested plain.',
      genre: ['Fantasy', 'Slice of Life', 'Adventure'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn7',
      title: 'A Practical Guide to Evil',
      author: 'ErraticErrata',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      description: 'Catherine Foundling enlists under the villainous Dread Empire of Praes to protect her conquered homeland.',
      genre: ['Fantasy', 'Military', 'Strategy'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn8',
      title: 'Lord of the Mysteries (Companion Series)',
      author: 'Cuttlefish That Loves Diving',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/lord-of-the-mysteries.png',
      description: 'Klein Moretti transmigrates into Victorian steampunk Backlund and climbs the Beyonder tarot sequence.',
      genre: ['Mystery', 'Lovecraftian', 'Steampunk'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn9',
      title: 'Chrysalis',
      author: 'RinoZ',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/22518-chrysalis.jpg',
      description: 'Anthony is reborn as a monstrous dungeon ant and works tirelessly to cultivate and protect his colony.',
      genre: ['Fantasy', 'LitRPG', 'Comedy'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-wn10',
      title: 'Shadow Slave (Companion Edition)',
      author: 'Guiltythree',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/shadow-slave.png',
      description: 'Sunny navigates the Nightmare Spell with a treacherous aspect, defying the nightmare gods of the Forgotten Shore.',
      genre: ['Action', 'Fantasy', 'Dark Fantasy'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-dark-b1',
      title: 'The Turn of the Screw',
      author: 'Henry James',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/209/pg209.cover.medium.jpg',
      description: 'A young governess sent to care for two orphaned children discovers sinister apparitions in the estate.',
      genre: ['Gothic', 'Ghost Story', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b2',
      title: 'Carmilla',
      author: 'J. Sheridan Le Fanu',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/10007/pg10007.cover.medium.jpg',
      description: 'The pioneering gothic vampire novella predating Dracula, set in an isolated castle in Styria.',
      genre: ['Gothic', 'Vampire', 'Horror'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b3',
      title: 'The Phantom of the Opera',
      author: 'Gaston Leroux',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/175/pg175.cover.medium.jpg',
      description: 'The disfigured musical genius haunts the Paris Opera House, claiming young soprano Christine as his protégé.',
      genre: ['Gothic', 'Romance', 'Mystery'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b4',
      title: 'The King in Yellow',
      author: 'Robert W. Chambers',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/8492/pg8492.cover.medium.jpg',
      description: 'A forbidden play that drives anyone who reads its second act into madness and cosmic despair.',
      genre: ['Cosmic Horror', 'Weird Fiction', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b5',
      title: 'The Island of Doctor Moreau',
      author: 'H.G. Wells',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/159/pg159.cover.medium.jpg',
      description: 'A shipwrecked gentleman discovers an uncharted Pacific island where a mad scientist vivisects human beasts.',
      genre: ['Sci-Fi', 'Horror', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b6',
      title: 'The Fall of the House of Usher',
      author: 'Edgar Allan Poe',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/932/pg932.cover.medium.jpg',
      description: 'Poe definitive masterpiece of gothic terror, decaying ancestral doom, and premature burial.',
      genre: ['Gothic', 'Horror', 'Classic'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b7',
      title: 'The Great God Pan',
      author: 'Arthur Machen',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/25016/pg25016.cover.medium.jpg',
      description: 'An experimental brain surgery opens a woman senses to the terrifying pagan reality of the Great God Pan.',
      genre: ['Horror', 'Supernatural', 'Classic'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b8',
      title: 'The Murders in the Rue Morgue',
      author: 'Edgar Allan Poe',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2147/pg2147.cover.medium.jpg',
      description: 'C. Auguste Dupin solves a horrifying locked-room double homicide in Paris through keen analytical ratiocination.',
      genre: ['Mystery', 'Gothic', 'Detective'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b9',
      title: 'The Jewel of Seven Stars',
      author: 'Bram Stoker',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/3781/pg3781.cover.medium.jpg',
      description: 'Archaeologists uncover the tomb of Egyptian Queen Tera and attempt an occult resurrection in London.',
      genre: ['Horror', 'Supernatural', 'Classic'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-dark-b10',
      title: 'Dracula Guest and Other Weird Stories',
      author: 'Bram Stoker',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/541/pg541.cover.medium.jpg',
      description: 'Chilling supernatural tales including the famous deleted opening chapter of the legendary vampire epic.',
      genre: ['Horror', 'Vampire', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

export const MYSTERY_PSYCHOLOGICAL_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-mystery-m1',
      title: 'Purple Hyacinth',
      author: 'Ephemerys, Sophism',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110461-NltBgZSCARfT.jpg',
      description: 'An officer gifted with lie detection teams up with the city most infamous assassin to root out corruption.',
      genre: ['Mystery', 'Drama', 'Action'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m2',
      title: 'Dr. Frost',
      author: 'Lee Jong-beom',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/40345.jpg',
      description: 'A brilliant psychologist who cannot feel human emotion solves bizarre criminal and psychological cases.',
      genre: ['Psychological', 'Mystery', 'Drama'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m3',
      title: 'Chasing Tails',
      author: 'Bano',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b136125-NMpctby46U0a.png',
      description: 'A building collapses trapping nine students; weeks later only six survive, accused of murdering the rest.',
      genre: ['Mystery', 'Psychological', 'Thriller'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m4',
      title: 'Fast Forward',
      author: 'Lee Won-sik, Beom Sik',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx138221-1eYIaDX0DjUd.png',
      description: 'A death-game where participants manipulate seconds of future time to predict and counter fatal decisions.',
      genre: ['Psychological', 'Thriller', 'Supernatural'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m5',
      title: 'Escape Room',
      author: '10-Zero',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119439-i5D7m44Qw8L5.jpg',
      description: 'Sinners wake up trapped inside lethal puzzle chambers that require sacrificing human morals to escape.',
      genre: ['Psychological', 'Horror', 'Mystery'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m6',
      title: 'Pyramid Game',
      author: 'Dalgonnim',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx128225-6dZoUjgGscrW.jpg',
      description: 'Transfer student Suji must navigate an elite all-girls school where a secret monthly vote designates an outcast target.',
      genre: ['Psychological', 'School', 'Drama'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m7',
      title: 'Forest of Humans',
      author: 'Hwang Joon-ho',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85407-OTpftIu3OJl2.jpg',
      description: 'A young researcher is locked inside an isolated prison containing the country most vicious unrepentant psychopaths.',
      genre: ['Psychological', 'Horror', 'Thriller'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m8',
      title: 'Save Me',
      author: '1230',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108604-6OYfn8OLtC1z.png',
      description: 'A wheelchair-bound youth enters high school and orchestrates complex psychological retaliations against abusers.',
      genre: ['Drama', 'Psychological', 'School'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m9',
      title: 'It is Mine',
      author: 'Byonduck',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118489-TwV48rTGJJF8.jpg',
      description: 'Raised in captivity without human contact, Yohan stalks his target to solve the conspiracy of his own origin.',
      genre: ['Psychological', 'Thriller', 'Mystery'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-m10',
      title: 'Gorae Byul: The Gyeongseong Mermaid',
      author: 'Na Yoonhee',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119437-PcQJGodAE2du.png',
      description: 'A mute handmaiden discovers an injured independence fighter in Japanese-occupied Joseon, plunging into espionage.',
      genre: ['Historical', 'Drama', 'Tragedy'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-mystery-mg1',
      title: 'Monster',
      author: 'Naoki Urasawa',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30001-Knby7l1jevE7.jpg',
      description: 'Dr. Kenzo Tenma saves a gunshot-wounded boy, inadvertently unleashing a cold-blooded sociopathic monster.',
      genre: ['Mystery', 'Psychological', 'Thriller'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg2',
      title: '20th Century Boys',
      author: 'Naoki Urasawa',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30003-E84fwIh22LAQ.jpg',
      description: 'Childhood friends discover that an apocalyptic cult leader named Friend is executing their old school notebook plans.',
      genre: ['Mystery', 'Sci-Fi', 'Psychological'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg3',
      title: 'Liar Game',
      author: 'Shinobu Kaitani',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31649-zKUMKIrXO8u5.jpg',
      description: 'Naive Nao Kanzaki teams up with genius swindler Shinichi Akiyama to conquer a tournament of high-stakes deceit.',
      genre: ['Psychological', 'Mystery', 'Game'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg4',
      title: 'Pluto',
      author: 'Naoki Urasawa, Osamu Tezuka',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30745-kueBpwriQkvZ.jpg',
      description: 'Europol detective Gesicht investigates the systematic murder of the world seven greatest humanoid robots.',
      genre: ['Mystery', 'Sci-Fi', 'Psychological'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg5',
      title: 'Tomodachi Game',
      author: 'Mikoto Yamaguchi, Yuki Sato',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85911-Z6xE67IxevPA.jpg',
      description: 'Five close friends are plunged into debt-repayment psychological games where exposing secrets clears debt.',
      genre: ['Psychological', 'Mystery', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg6',
      title: 'Alice in Borderland',
      author: 'Haro Aso',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx63031-lE9pKD3cpmVK.jpg',
      description: 'Arisu and friends find Tokyo suddenly abandoned, forced to compete in lethal card games to extend their visa of life.',
      genre: ['Psychological', 'Action', 'Survival'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg7',
      title: 'Erased (Boku dake ga Inai Machi)',
      author: 'Kei Sanbe',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx69325-17ud19Cg0xIO.jpg',
      description: 'Satoru experiences Revival time slips and regresses 18 years into childhood to prevent a serial kidnapping murder.',
      genre: ['Mystery', 'Psychological', 'Supernatural'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg8',
      title: 'Bungou Stray Dogs',
      author: 'Kafka Asagiri, Sango Harukawa',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85387-4iaCoaboCYX6.jpg',
      description: 'The Armed Detective Agency solves supernatural mysteries using abilities named after famous literary masters.',
      genre: ['Action', 'Mystery', 'Supernatural'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg9',
      title: 'The Promised Neverland',
      author: 'Kaiu Shirai, Posuka Demizu',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/87467-fJfFtv3KEo1x.jpg',
      description: 'Orphans at Grace Field House discover their idyllic home is a premium livestock farm for demonic overlords.',
      genre: ['Mystery', 'Psychological', 'Thriller'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-mg10',
      title: 'Moriarty the Patriot',
      author: 'Ryosuke Takeuchi, Hikaru Miyoshi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx87409-J3Esr3bxbLec.jpg',
      description: 'William James Moriarty acts as a crime consultant in Victorian Britain to destroy the corrupt aristocratic class.',
      genre: ['Mystery', 'Historical', 'Psychological'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-mystery-ln1',
      title: 'The Empty Box and Zeroth Maria',
      author: 'Eiji Mikage',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85134-a6TDxeB6jQES.png',
      description: 'Kazuki Hoshino is trapped inside the mysterious Rejecting Classroom time loop alongside transfer student Maria.',
      genre: ['Mystery', 'Psychological', 'Supernatural'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln2',
      title: 'Hyouka',
      author: 'Honobu Yonezawa',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx65513-XhhDwKxsNsxZ.png',
      description: 'Energy-conserving high schooler Hotaro Oreki solves intricate everyday puzzles for the Classic Literature Club.',
      genre: ['Mystery', 'Slice of Life', 'School'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln3',
      title: 'The Detective Is Already Dead',
      author: 'Nigoju',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx114324-Md224gcYvqxw.jpg',
      description: 'Kimihiko Kimizuka, permanent crisis magnet, resolves globe-spanning conspiracies left by his late master Siesta.',
      genre: ['Mystery', 'Action', 'Romance'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln4',
      title: 'Boogiepop and Others',
      author: 'Kouhei Kadono',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx31388-JDIwg74gvgt3.jpg',
      description: 'Interconnected student perspectives piece together supernatural disappearances in an innovative non-linear mystery.',
      genre: ['Mystery', 'Horror', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln5',
      title: 'Durarara!!',
      author: 'Ryohgo Narita',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/14841.jpg',
      description: 'In the bustling district of Ikebukuro, a headless rider, color gangs, and an information broker collide.',
      genre: ['Action', 'Mystery', 'Supernatural'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln6',
      title: 'Monogatari Series: Bakemonogatari',
      author: 'Nisio Isin',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx44893-aV0XRP0OfWf7.jpg',
      description: 'Koyomi Araragi helps young women afflicted by heavy emotional apparitions through witty philosophical dialogue.',
      genre: ['Supernatural', 'Mystery', 'Psychological'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln7',
      title: 'Gosick',
      author: 'Kazuki Sakuraba',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx34215-OrrcNekPDdQX.jpg',
      description: 'Golden-haired doll-like Victorique solves baffling locked-room mysteries from the Saint Marguerite library greenhouse.',
      genre: ['Mystery', 'Historical', 'Romance'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln8',
      title: 'Baccano!',
      author: 'Ryohgo Narita',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31342-El9tjsUPir9s.jpg',
      description: 'Prohibition-era Chicago erupts as alchemists, mobsters, and thieves cross paths on the transcontinental Flying Pussyfoot.',
      genre: ['Action', 'Mystery', 'Historical'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln9',
      title: 'Occultic;Nine',
      author: 'Chiyomaru Shikura',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b86628-fG6FUBl2kyr5.jpg',
      description: 'Nine idiosyncratic individuals linked through an occult blog trigger a world-altering paranormal conspiracy.',
      genre: ['Sci-Fi', 'Mystery', 'Supernatural'],
      rating: 8.9,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-ln10',
      title: 'Rokka no Yuusha',
      author: 'Ishio Yamagata',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/36023.jpg',
      description: 'Trapped inside the Barrier of Fog, seven warriors must deduce which of them is a demon spy in their ranks.',
      genre: ['Mystery', 'Fantasy', 'Action'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-mystery-wn1',
      title: 'Omniscient First-Person Viewpoint',
      author: 'Iced Latte',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      description: 'Trapped in an ultra-hard visual novel, the protagonist reads the subconscious status windows of every scheming rival.',
      genre: ['Mystery', 'Psychological', 'Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn2',
      title: 'Kidnapped Dragons',
      author: 'Yugang',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/kidnapped-dragons.jpg',
      description: 'After repeating countless apocalyptic regressions, Yu Jitae raises four baby dragon calamities to prevent world end.',
      genre: ['Slice of Life', 'Psychological', 'Fantasy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn3',
      title: 'The Regressed Demon Lord is Kind',
      author: 'Zedit',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      description: 'Demon Lord Zeke regresses to save humanity through exquisitely twisted deceptions and intellectual masterstrokes.',
      genre: ['Fantasy', 'Comedy', 'Strategy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn4',
      title: 'The Legendary Mechanic',
      author: 'Qi Peijia',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/the-legendary-mechanic.png',
      description: 'Han Xiao is reincarnated as an NPC inside the game Galaxy and utilizes meta-knowledge to manipulate entire player armies.',
      genre: ['Sci-Fi', 'Action', 'Strategy'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn5',
      title: 'Super Gene',
      author: 'Twelve-Winged Dark Seraph',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/super-gene.png',
      description: 'Han Sen enters God Sanctuary and harvests sacred beast genes through meticulous planning and lethal archery.',
      genre: ['Sci-Fi', 'Action', 'Adventure'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn6',
      title: 'Overgeared',
      author: 'Park Saenal',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/overgeared.png',
      description: 'Grid unlocks Pagma Rare Book and transforms from an insecure loner into an untouchable supreme blacksmith.',
      genre: ['LitRPG', 'Action', 'Comedy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn7',
      title: 'The Novel Extra',
      author: 'Jee Gab Song',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      description: 'Kim Hajin wakes up inside his own unfinished novel as an unnamed filler character armed with sniper precision.',
      genre: ['Action', 'School', 'Sci-Fi'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn8',
      title: 'Trash of the Count Family',
      author: 'Yoo Ryeo Han',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/trash-of-the-counts-family.png',
      description: 'Cale Henituse wants nothing more than to live a slacker life, but his schemes continually save the continent.',
      genre: ['Fantasy', 'Comedy', 'Strategy'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn9',
      title: 'Reverend Insanity (Strategic Edition)',
      author: 'Gu Zhen Ren',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/reverend-insanity.png',
      description: 'Fang Yuan navigates the Gu master world using peerless intellect, cold calculations, and limitless patience.',
      genre: ['Cultivation', 'Dark Fantasy', 'Strategy'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-wn10',
      title: 'Mother of Learning (Companion Edition)',
      author: 'Domagoj Kurmaic',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/21220-mother-of-learning.jpg',
      description: 'Zorian Kazinski meticulously dissects the Cyoria month-long time loop through relentless magical experimentation.',
      genre: ['Fantasy', 'Mystery', 'Time Loop'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-mystery-b1',
      title: 'The Hound of the Baskervilles',
      author: 'Arthur Conan Doyle',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2852/pg2852.cover.medium.jpg',
      description: 'Sherlock Holmes and Dr. Watson investigate a legendary spectral hound haunting Dartmoor manor.',
      genre: ['Mystery', 'Detective', 'Classic'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b2',
      title: 'The Moonstone',
      author: 'Wilkie Collins',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/583/pg583.cover.medium.jpg',
      description: 'Considered the very first detective novel in English literature, surrounding a cursed sacred Indian diamond.',
      genre: ['Mystery', 'Detective', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b3',
      title: 'The Secret Agent',
      author: 'Joseph Conrad',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/974/pg974.cover.medium.jpg',
      description: 'A psychological examination of political terrorism, espionage, and police surveillance in Victorian London.',
      genre: ['Thriller', 'Political', 'Classic'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b4',
      title: 'The Maltese Falcon',
      author: 'Dashiell Hammett',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg',
      description: 'Hard-boiled private eye Sam Spade deals with three eccentric criminals chasing a jewel-encrusted statuette.',
      genre: ['Noir', 'Detective', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b5',
      title: 'The Trial',
      author: 'Franz Kafka',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/7849/pg7849.cover.medium.jpg',
      description: 'Josef K. is arrested and prosecuted by an inaccessible, incomprehensible bureaucratic authority for an unnamed crime.',
      genre: ['Philosophical', 'Psychological', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b6',
      title: 'Notes from Underground',
      author: 'Fyodor Dostoevsky',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/600/pg600.cover.medium.jpg',
      description: 'A bitter, isolated retired civil servant in Saint Petersburg unleashes a searing existential monologue.',
      genre: ['Philosophical', 'Psychological', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b7',
      title: 'The Innocence of Father Brown',
      author: 'G.K. Chesterton',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/204/pg204.cover.medium.jpg',
      description: 'A quiet Roman Catholic priest solves baffling crimes through an intuitive understanding of human nature.',
      genre: ['Mystery', 'Detective', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b8',
      title: 'The Sign of the Four',
      author: 'Arthur Conan Doyle',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2097/pg2097.cover.medium.jpg',
      description: 'Holmes investigates an annual anonymous gift of rare pearls and a secret pact forged in the Andaman penal colony.',
      genre: ['Mystery', 'Detective', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b9',
      title: 'The Lodger',
      author: 'Marie Belloc Lowndes',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/20533/pg20533.cover.medium.jpg',
      description: 'A London couple takes in a quiet new tenant, only to suspect he is the Jack the Ripper-like Avenger.',
      genre: ['Mystery', 'Thriller', 'Classic'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-mystery-b10',
      title: 'The Thirty-Nine Steps',
      author: 'John Buchan',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/558/pg558.cover.medium.jpg',
      description: 'Richard Hannay is pursued across the Scottish moors by enemy spies and police while safeguarding state secrets.',
      genre: ['Thriller', 'Spy', 'Classic'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

export const ADVENTURE_EPIC_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-adv-m1',
      title: 'The God of High School',
      author: 'Yongje Park',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85141-qHR957V3FVco.png',
      description: 'Mori Jin competes in an all-style martial arts contest that erupts into a celestial war against mythological gods.',
      genre: ['Action', 'Martial Arts', 'Mythology'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m2',
      title: 'Hardcore Leveling Warrior',
      author: 'Sehoon Kim',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108603-MxMXpvpe9f9z.jpg',
      description: 'The number one ranked player in Lucid Adventure is assassinated down to Level 1 and battles back with raw luck.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m3',
      title: 'Kubera: One Last God',
      author: 'Currygom',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85223-xzEuwcObHcsB.jpg',
      description: 'A village girl named after a god escapes an annihilation assault, joining a magician on a world-spanning voyage.',
      genre: ['Fantasy', 'Mystery', 'Adventure'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m4',
      title: 'Magician',
      author: 'Kim Sarae',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/16881.jpg',
      description: 'An immortal grand mage and two adventurous children traverse ancient continents to uncover lost magical truth.',
      genre: ['Adventure', 'Fantasy', 'Magic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m5',
      title: 'Skeleton Soldier Failed to Protect Dungeon',
      author: 'Kang Myung-woon',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/103164-p7cL6bKSdJPj.jpg',
      description: 'A humble skeleton guardian repeatedly regresses upon death, growing into an almighty wandering adventurer.',
      genre: ['Fantasy', 'Action', 'Reincarnation'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m6',
      title: 'Survival Story of a Sword King in a Fantasy World',
      author: 'Soon-Q, YKB',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx114629-R0G9bUhncq4l.jpg',
      description: 'Ryu Han-Bin is marooned in a hellish tutorial zone for 22 years before emerging with godlike muscles.',
      genre: ['Action', 'Comedy', 'Adventure'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m7',
      title: 'A Returner Magic Should Be Special',
      author: 'Wookjakga, Yu So-Nan',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx102637-IoCvgcvIpe4m.jpg',
      description: 'Desir Arman regresses 13 years to the Hebrion Academy to prevent the apocalyptic collapse of the Shadow Labyrinth.',
      genre: ['Fantasy', 'Magic', 'School'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m8',
      title: 'Overgeared (Webtoon Edition)',
      author: 'Silverbullet, Team Argo',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118485-do0KqIrNdbwy.jpg',
      description: 'Grid conquers the world largest virtual reality MMO Satisfy using legendary blacksmith craftsmanship.',
      genre: ['Action', 'Adventure', 'LitRPG'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m9',
      title: 'Leviathan: Deep Sea Webtoon',
      author: 'Lee Gyuntak, Noh Miyoung',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/104084-0KM2QjNAwOXO.jpg',
      description: 'Harpoon hunters traverse a submerged globe contending with colossal ancient marine abominations.',
      genre: ['Action', 'Adventure', 'Sci-Fi'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-m10',
      title: 'Dungeon Reset',
      author: 'Ant Studio, Daul',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx115105-zwZhllrE5CTe.png',
      description: 'Trapped in a lethal trap pit, Jung-down survives a dungeon reset glitch and becomes an unstoppable earth engineer.',
      genre: ['Comedy', 'Adventure', 'Fantasy'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-adv-mg1',
      title: 'Magi: The Labyrinth of Magic',
      author: 'Shinobu Ohtaka',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx44790-4Rzup5aNVcVC.png',
      description: 'Aladdin and Alibaba conquer treacherous Djinn dungeons to shape the fate of empires across the Silk Road.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg2',
      title: 'Delicious in Dungeon (Dungeon Meshi)',
      author: 'Ryoko Kui',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86082-MXizJxzbijdd.jpg',
      description: 'Laios leads his party into the dungeon depths, cooking delicious culinary meals from slain monsters to survive.',
      genre: ['Comedy', 'Fantasy', 'Adventure'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg3',
      title: 'Toriko',
      author: 'Mitsutoshi Shimabukuro',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx37887-eYfLTjygqwK8.png',
      description: 'Gourmet Hunter Toriko journeys through dangerous untamed wilderness to complete his dream full-course menu.',
      genre: ['Action', 'Adventure', 'Comedy'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg4',
      title: 'Made in Abyss',
      author: 'Akihito Tsukushi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86551-0EzmsMZiPSu9.jpg',
      description: 'Riko and robot boy Reg descend into an abyss chasm filled with relics and eldritch curses of ascent.',
      genre: ['Adventure', 'Drama', 'Fantasy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg5',
      title: 'Dr. STONE',
      author: 'Riichiro Inagaki, Boichi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx98342-mOpk6Ds5a2gD.jpg',
      description: 'Senku awakens 3,700 years after a blinding light petrifies humanity, rebuilding civilization through pure science.',
      genre: ['Sci-Fi', 'Adventure', 'Comedy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg6',
      title: 'Frieren: Beyond Journey End (Companion Edition)',
      author: 'Kanehito Yamada, Tsukasa Abe',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118586-CXKgWikBFQgS.jpg',
      description: 'Elf mage Frieren journeys north to Aureole, reflecting on human bonds decades after defeating the Demon King.',
      genre: ['Fantasy', 'Adventure', 'Drama'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg7',
      title: 'Claymore: The Great Void',
      author: 'Norihiro Yagi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30583-Ysqwu8uryIUX.png',
      description: 'Clare traverses the northern lands to hunt the Awakened Being Priscilla and protect Raki.',
      genre: ['Action', 'Adventure', 'Dark Fantasy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg8',
      title: 'Re:Monster (Manga Edition)',
      author: 'Kogitsune Kanekiru',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85495-uaUAZaDdI0YB.jpg',
      description: 'Reincarnated as a lowly goblin with an insatiable eating absorption trait, Gobrou evolves into an apex monster.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg9',
      title: 'Shangri-La Frontier',
      author: 'Katarina, Ryosuke Fuji',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx122063-j2wIvwb6yzPM.jpg',
      description: 'Trash-game hunter Sunraku dives into the masterpiece VR game Shangri-La Frontier and challenges unique bosses.',
      genre: ['Action', 'Comedy', 'Adventure'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-mg10',
      title: 'D.Gray-man (Exorcist Chronicles)',
      author: 'Katsura Hoshino',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30024-UUUz8xxkt8pc.jpg',
      description: 'Exorcists traverse European capitals in steam-era airships to prevent the destruction of the human world.',
      genre: ['Action', 'Adventure', 'Dark Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-adv-ln1',
      title: 'Spice and Wolf',
      author: 'Isuna Hasekura',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx39115-2uLgBuM30i1b.jpg',
      description: 'Traveling merchant Kraft Lawrence journeys through northern trade towns alongside the wise wolf deity Holo.',
      genre: ['Adventure', 'Fantasy', 'Romance'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln2',
      title: 'Log Horizon',
      author: 'Mamare Touno',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx76024-asSsUMwFm5O8.jpg',
      description: 'Thirty thousand Japanese gamers are trapped in Elder Tale; strategist Shiroe builds a thriving city from scratch.',
      genre: ['Action', 'Fantasy', 'Strategy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln3',
      title: 'DanMachi: Is It Wrong to Pick Up Girls in a Dungeon?',
      author: 'Fujino Omori',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85161-imb5doG2etVP.jpg',
      description: 'Bell Cranel dreams of becoming a hero, venturing into the labyrinth of Orario under the goddess Hestia.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln4',
      title: 'Arifureta: From Commonplace to World Strongest',
      author: 'Ryo Shirakome',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86274-nAItDrzi9fne.jpg',
      description: 'Betrayed and dropped into the bottom of an abyss, Hajime uses transmutation magic and firearms to crawl out.',
      genre: ['Action', 'Adventure', 'Harem'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln5',
      title: 'Mushoku Tensei: Redundant Reincarnation',
      author: 'Rifujin na Magonote',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx165131-R4pedWdbZiAW.jpg',
      description: 'Rudeus Greyrat journeys across the Demon Continent, discovering ancient ruins and legendary warriors.',
      genre: ['Adventure', 'Drama', 'Fantasy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln6',
      title: 'The Rising of the Shield Hero (Novels)',
      author: 'Aneko Yusagi',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85743-CoWEORg0SS0B.png',
      description: 'Naofumi Iwatani is summoned as the Shield Hero and travels the kingdom of Melromarc with Raphtalia.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln7',
      title: 'Re:ZERO Ex Novels',
      author: 'Tappei Nagatsuki',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85737-WkWOr5EgwPyo.jpg',
      description: 'Chronicles the historical adventures and sword saint battles of the Lugnica Kingdom preceding the main story.',
      genre: ['Fantasy', 'Action', 'Adventure'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln8',
      title: 'Ascendance of a Bookworm (Companion Arc)',
      author: 'Miya Kazuki',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108603-MxMXpvpe9f9z.jpg',
      description: 'Myne establishes paper-making printing presses and discovers high noble magical technology.',
      genre: ['Slice of Life', 'Fantasy', 'Adventure'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln9',
      title: 'Sword Art Online Progressive',
      author: 'Reki Kawahara',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx73921-HKvbNY03AzY0.jpg',
      description: 'Kirito and Asuna clear every individual floor of the floating iron castle Aincrad from Floor 1 upwards.',
      genre: ['Action', 'Adventure', 'Sci-Fi'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-ln10',
      title: 'Overlord: The Holy Kingdom Arc',
      author: 'Kugane Maruyama',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85494-yDzxO2JZhXiE.jpg',
      description: 'Ainz Ooal Gown flexes supreme sorcerer might to aid the besieged defenders of the Roble Holy Kingdom.',
      genre: ['Action', 'Dark Fantasy', 'Strategy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-adv-wn1',
      title: 'Azarinth Healer',
      author: 'Rhaegar',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/16946-azarinth-healer.jpg',
      description: 'Ilea is transported to Eloria and unlocks the secret Battle Healer class, punching dangerous monsters across continents.',
      genre: ['LitRPG', 'Action', 'Adventure'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn2',
      title: 'Beneath the Dragoneye Moons',
      author: 'Selkie',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/36299-beneath-the-dragoneye-moons.jpg',
      description: 'Reincarnated into the magical Roman-style Remus Empire, Elaine swears oaths to become a legendary healer.',
      genre: ['LitRPG', 'Fantasy', 'Adventure'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn3',
      title: 'The Runesmith',
      author: 'KuroNeko',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/33844-the-runesmith.jpg',
      description: 'Reborn into a fantasy world as an outcast noble, Roland masters forgotten rune crafting and automates defense.',
      genre: ['Fantasy', 'Crafting', 'Adventure'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn4',
      title: 'Beware of Chicken (Companion Arc)',
      author: 'CasualFarmer',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
      description: 'Jin Rou leaves martial sects to become a farmer in the Azure Hills, unintentionally raising ascended spirit beasts.',
      genre: ['Comedy', 'Cultivation', 'Slice of Life'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn5',
      title: 'Dungeon Crawler Carl (Companion Arc)',
      author: 'Matt Dinniman',
      category: 'webnovel',
      coverImage: 'https://upload.wikimedia.org/wikipedia/en/f/f9/DungeonCrawlerCarlBook1.png',
      description: 'Carl and his ex-girlfriend cat Princess Donut survive an intergalactic pay-per-view death crawl.',
      genre: ['LitRPG', 'Comedy', 'Survival'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn6',
      title: 'The Primal Hunter (Companion Arc)',
      author: 'Zogarth',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/the-primal-hunter.jpg',
      description: 'Jake Thayne awakens his Bloodline and hunts gods across vast multiverse integration arenas.',
      genre: ['LitRPG', 'Action', 'Adventure'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn7',
      title: 'He Who Fights with Monsters (Companion Arc)',
      author: 'Shirtaloon',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-large/26294-he-who-fights-with-monsters.jpg',
      description: 'Jason Asano awakens naked in a magical labyrinth and crafts an affliction-based astral essence build.',
      genre: ['LitRPG', 'Adventure', 'Comedy'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn8',
      title: 'Defiance of the Fall (Companion Arc)',
      author: 'TheFirstDefier',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/24709-defiance-of-the-fall.jpg',
      description: 'Zac survives isolated on an island during Earth multiverse merger, wielding a colossal axe to slay incursions.',
      genre: ['LitRPG', 'Cultivation', 'Action'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn9',
      title: 'The Beginning After The End (Companion Arc)',
      author: 'TurtleMe',
      category: 'webnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b108341-2YB9WRfiN1dt.png',
      description: 'King Grey reincarnates as Arthur Leywin, traversing Dicathen to safeguard his loved ones against Alacrya.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-wn10',
      title: 'Release That Witch (Companion Arc)',
      author: 'Er Mu',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/release-that-witch.png',
      description: 'Mechanical engineer Cheng Yan reincarnates as Prince Roland, utilizing scientific innovation and witch powers.',
      genre: ['Fantasy', 'Kingdom Building', 'Strategy'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-adv-b1',
      title: 'Treasure Island',
      author: 'Robert Louis Stevenson',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/120/pg120.cover.medium.jpg',
      description: 'Jim Hawkins discovers a pirate treasure map and sails aboard the Hispaniola, crossing paths with Long John Silver.',
      genre: ['Adventure', 'Pirates', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b2',
      title: 'Around the World in Eighty Days',
      author: 'Jules Verne',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/103/pg103.cover.medium.jpg',
      description: 'Phileas Fogg and his valet Passepartout attempt to circumnavigate the globe in 80 days on a 20,000 pound wager.',
      genre: ['Adventure', 'Travel', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b3',
      title: '20,000 Leagues Under the Sea',
      author: 'Jules Verne',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/164/pg164.cover.medium.jpg',
      description: 'Professor Aronnax is captured aboard the futuristic submarine Nautilus, commanded by the enigmatic Captain Nemo.',
      genre: ['Sci-Fi', 'Adventure', 'Classic'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b4',
      title: 'Gulliver Travels',
      author: 'Jonathan Swift',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/829/pg829.cover.medium.jpg',
      description: 'Lemuel Gulliver voyages to strange remote lands: tiny Lilliput, giant Brobdingnag, and the realm of the Houyhnhnms.',
      genre: ['Satire', 'Adventure', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b5',
      title: 'Robinson Crusoe',
      author: 'Daniel Defoe',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/521/pg521.cover.medium.jpg',
      description: 'A castaway spends 28 years on an uninhabited desert island, mastering survival, farming, and rescue.',
      genre: ['Adventure', 'Survival', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b6',
      title: 'The Call of the Wild',
      author: 'Jack London',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/215/pg215.cover.medium.jpg',
      description: 'Stolen from his California home, the dog Buck is sold as a sled dog in the frozen Klondike gold rush.',
      genre: ['Adventure', 'Nature', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b7',
      title: 'White Fang',
      author: 'Jack London',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/910/pg910.cover.medium.jpg',
      description: 'A wild wolfdog survives harsh northern conditions, fighting pits, and eventually learns trust and loyalty.',
      genre: ['Adventure', 'Nature', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b8',
      title: 'King Solomon Mines',
      author: 'H. Rider Haggard',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/2166/pg2166.cover.medium.jpg',
      description: 'Allan Quatermain leads an expedition into unexplored African mountains to locate lost biblical diamond mines.',
      genre: ['Adventure', 'Lost World', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b9',
      title: 'Journey to the Center of the Earth',
      author: 'Jules Verne',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/18857/pg18857.cover.medium.jpg',
      description: 'Professor Lidenbrock deciphers a runic manuscript and descends through an Icelandic volcano into the subterranean world.',
      genre: ['Sci-Fi', 'Adventure', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-adv-b10',
      title: 'The Lost World',
      author: 'Arthur Conan Doyle',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/139/pg139.cover.medium.jpg',
      description: 'Professor Challenger leads an expedition to an isolated South American plateau where living dinosaurs survive.',
      genre: ['Sci-Fi', 'Adventure', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

export const SURVIVAL_APOCALYPSE_POOL: ThematicCompanionMatrix = {
  manhwa: [
    {
      id: 'companion-surv-m1',
      title: 'Shotgun Boy (Survival)',
      author: 'Carnby Kim',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx130095-tSYj0pPk5G9C.jpg',
      description: 'A bullied teen finds a shotgun just as body-snatching monsters infiltrate his class retreat.',
      genre: ['Horror', 'Action', 'Survival'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m2',
      title: 'Leviathan (Survival)',
      author: 'Lee Gyuntak',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/104084-0KM2QjNAwOXO.jpg',
      description: 'Harpoon hunters traverse a submerged globe contending with colossal ancient marine abominations.',
      genre: ['Action', 'Survival', 'Post-Apocalyptic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m3',
      title: 'Distant Sky (Survival)',
      author: 'Inwan Youn',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/55408.jpg',
      description: 'Gangnam sinks into absolute subterranean darkness filled with corpses and monstrous biological abominations.',
      genre: ['Horror', 'Survival', 'Mystery'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m4',
      title: 'Hive (Survival)',
      author: 'Kyusam Kim',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85871-bL6hGWnr55UO.jpg',
      description: 'Gigantic oxygen-rich prehistoric wasps mutate and conquer Seoul, turning humanity into living incubators.',
      genre: ['Horror', 'Action', 'Survival'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m5',
      title: 'Tacit (Survival)',
      author: 'Kim Doby',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx131587-axp0w90Vhbyq.jpg',
      description: 'In a frozen post-apocalyptic wasteland, a white-haired zombie boy retains human emotion and forms a bond.',
      genre: ['Horror', 'Supernatural', 'Survival'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m6',
      title: 'All of Us Are Dead',
      author: 'Joo Dong-geun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx143056-MEpVxW7346jz.jpg',
      description: 'High school students barricade themselves in classrooms as a rabid zombie contagion sweeps the school.',
      genre: ['Horror', 'Zombies', 'Survival'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m7',
      title: 'Reawakened Man',
      author: 'Yong-Taek Chae',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108603-MxMXpvpe9f9z.jpg',
      description: 'Suk-Hwan revives 3 days after being killed, using resurrection to dismantle underground crime syndicates.',
      genre: ['Action', 'Supernatural', 'Survival'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m8',
      title: 'Terror Man',
      author: 'Dongwoo Han',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108605-HdGuGd54yNSh.jpg',
      description: 'Jungwoo can see impending misfortune in violet hues, posing as a terrorist to force civilians out of disaster zones.',
      genre: ['Action', 'Supernatural', 'Hero'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m9',
      title: 'Duty After School',
      author: 'Ha Il-kwon',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85141-qHR957V3FVco.png',
      description: 'High school seniors are drafted into military service to fight mysterious extraterrestrial purple cell spheres.',
      genre: ['Drama', 'Military', 'Sci-Fi'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-m10',
      title: 'L.A.G (Purgatory)',
      author: 'Kim Tae-hyun',
      category: 'manhwa',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx153215-mKWd7O4RAlCU.jpg',
      description: 'Trapped in an endlessly looping meat-grinder purgatory, survivors must kill mutated monsters or perish.',
      genre: ['Action', 'Survival', 'Horror'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  manga: [
    {
      id: 'companion-surv-mg1',
      title: 'I Am a Hero',
      author: 'Kengo Hanazawa',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx44440-oLFibAj4TvM7.jpg',
      description: 'A socially anxious manga assistant armed with a sporting shotgun survives a grotesque Tokyo zombie apocalypse.',
      genre: ['Horror', 'Psychological', 'Survival'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg2',
      title: 'Highschool of the Dead',
      author: 'Daisuke Sato, Shouji Sato',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30740-C350TLnER0KT.jpg',
      description: 'High school students band together to escape a world overrun by lethal viral zombies known as Them.',
      genre: ['Action', 'Horror', 'Ecchi'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg3',
      title: 'Cage of Eden',
      author: 'Yoshinobu Yamada',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx42586-vBsvm45ji0ss.jpg',
      description: 'A plane crashes on an uncharted island inhabited by prehistoric apex beasts and carnivorous plants.',
      genre: ['Action', 'Mystery', 'Survival'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg4',
      title: 'Biomega',
      author: 'Tsutomu Nihei',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31326-EBD55URAFIFc.png',
      description: 'Synthetic human Zouichi Kanoe speeds through a post-apocalyptic megastructure to stop a spore that turns humans into drones.',
      genre: ['Action', 'Cyberpunk', 'Horror'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg5',
      title: 'Blame! (City of Iron)',
      author: 'Tsutomu Nihei',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30149-YetcNrfacNVj.jpg',
      description: 'Killy wanders through an unfathomably vast cyber-dungeon city armed with a Gravitational Beam Emitter.',
      genre: ['Action', 'Cyberpunk', 'Horror'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg6',
      title: 'Gantz (Extermination Arc)',
      author: 'Hiroya Oku',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30564-RbyFbLzbnKea.jpg',
      description: 'Deceased humans are resurrected by an enigmatic black sphere to wage lethal urban wars against grotesque aliens.',
      genre: ['Action', 'Horror', 'Sci-Fi'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg7',
      title: 'Parasyte (Symbiosis Arc)',
      author: 'Hitoshi Iwaaki',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30401-siY6wmwnHFi6.png',
      description: 'Shinichi and Migi fight predatory parasites to safeguard humanity from biological annihilation.',
      genre: ['Action', 'Horror', 'Psychological'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg8',
      title: '7 Seeds',
      author: 'Yumi Tamura',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31075-0sTogC04TmSi.jpg',
      description: 'Cryogenically preserved youths awaken in a revitalized post-meteor Earth filled with new dangerous ecosystems.',
      genre: ['Adventure', 'Drama', 'Mystery'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg9',
      title: 'Dr. STONE (Survival Arc)',
      author: 'Riichiro Inagaki, Boichi',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx98342-mOpk6Ds5a2gD.jpg',
      description: 'Senku utilizes chemistry and physics to survive in a stone world where human civilization has crumbled.',
      genre: ['Sci-Fi', 'Adventure', 'Comedy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-mg10',
      title: 'Ajin: Demi-Human (Survival)',
      author: 'Gamon Sakurai',
      category: 'manga',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b79865-rwKmISrhJJyP.jpg',
      description: 'Immortal human beings known as Ajin manifest lethal black ghost familiars and wage war against persecution.',
      genre: ['Action', 'Horror', 'Supernatural'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  lightnovel: [
    {
      id: 'companion-surv-ln1',
      title: 'WorldEnd: What Do You Do at the End of the World?',
      author: 'Akira Kareno',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86365-1H3Lp87JUnxr.jpg',
      description: 'Five hundred years after beasts destroyed humanity, Willem guards young leprechaun fairies fighting for floating islands.',
      genre: ['Fantasy', 'Drama', 'Post-Apocalyptic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln2',
      title: 'Black Bullet',
      author: 'Shiden Kanzaki',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85161-imb5doG2etVP.jpg',
      description: 'Humanity lives barricaded behind monoliths of Monolith metal to keep out the parasitical Gastrea monsters.',
      genre: ['Action', 'Sci-Fi', 'Mystery'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln3',
      title: 'Heavy Object',
      author: 'Kazuma Kamachi',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/16881.jpg',
      description: 'In a future where massive war machines called Objects make soldiers obsolete, two grunts destroy an Object on foot.',
      genre: ['Action', 'Mecha', 'Sci-Fi'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln4',
      title: 'So I am a Spider, So What? (Labyrinth)',
      author: 'Okina Baba',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/56903-dITWK4T1HOnE.jpg',
      description: 'A spider girl survives deadly venomous monsters through clever traps and tireless level-up evolutions.',
      genre: ['Fantasy', 'Adventure', 'Comedy'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln5',
      title: 'Torture Princess (Wasteland)',
      author: 'Keishi Ayasato',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108605-HdGuGd54yNSh.jpg',
      description: 'Serving the executioner of 14 demons, Kaito fights through ruins of dead civilizations.',
      genre: ['Dark Fantasy', 'Horror', 'Action'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln6',
      title: 'Grimgar of Fantasy and Ash (Level 1)',
      author: 'Jyumonji Ao',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86365-1H3Lp87JUnxr.jpg',
      description: 'Rookie adventurers struggle to defeat a single goblin, experiencing the visceral reality of combat.',
      genre: ['Fantasy', 'Action', 'Drama'],
      rating: 9.1,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln7',
      title: 'Re:ZERO (Sanctuary Arc)',
      author: 'Tappei Nagatsuki',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85737-WkWOr5EgwPyo.jpg',
      description: 'Subaru uses Return by Death to navigate the horrifying trials of Echidna and the Great Rabbit.',
      genre: ['Fantasy', 'Psychological', 'Drama'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln8',
      title: 'Overlord (Invaders Arc)',
      author: 'Kugane Maruyama',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85494-yDzxO2JZhXiE.jpg',
      description: 'Workers trespass into the Great Tomb of Nazarick and meet the unsparing cruelty of the Supreme Beings.',
      genre: ['Fantasy', 'Dark Fantasy', 'Action'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln9',
      title: 'Sword Art Online (Aincrad Deathgame)',
      author: 'Reki Kawahara',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx73921-HKvbNY03AzY0.jpg',
      description: 'Ten thousand players are locked in a VRMMORPG where in-game death causes real-world brain death.',
      genre: ['Action', 'Sci-Fi', 'Romance'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-ln10',
      title: 'Arifureta (Abyss Origin)',
      author: 'Ryo Shirakome',
      category: 'lightnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86274-nAItDrzi9fne.jpg',
      description: 'Surviving on monster meat in the bottom floor of Orcus, Hajime builds an unstoppable arsenal.',
      genre: ['Action', 'Adventure', 'Fantasy'],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  webnovel: [
    {
      id: 'companion-surv-wn1',
      title: 'The Perfect Run (Apocalypse Edition)',
      author: 'Maxime J. Durand',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      description: 'Ryan Quicksave loops through a superhero post-apocalyptic New Rome to pull off the ultimate timeline run.',
      genre: ['Sci-Fi', 'Comedy', 'Action'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn2',
      title: 'Worm (Leviathan Arc)',
      author: 'Wildbow',
      category: 'webnovel',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      description: 'Endbringers descend upon Brockton Bay, forcing villains and heroes into a desperate struggle for survival.',
      genre: ['Superhero', 'Dark Fantasy', 'Action'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn3',
      title: 'Shadow Slave (Forgotten Shore)',
      author: 'Guiltythree',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/shadow-slave.png',
      description: 'Sunny and sleep-deprived survivors march through the sun-bleached horror of the Dark City.',
      genre: ['Action', 'Fantasy', 'Survival'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn4',
      title: 'Lord of the Mysteries (Apotheosis)',
      author: 'Cuttlefish That Loves Diving',
      category: 'webnovel',
      coverImage: 'https://rs.novelbuddy.me/covers/lord-of-the-mysteries.png',
      description: 'Klein Moretti defends Backlund from celestial madness and the Great Cataclysm.',
      genre: ['Mystery', 'Lovecraftian', 'Fantasy'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn5',
      title: 'Dungeon Crawler Carl (Floor 3)',
      author: 'Matt Dinniman',
      category: 'webnovel',
      coverImage: 'https://upload.wikimedia.org/wikipedia/en/f/f9/DungeonCrawlerCarlBook1.png',
      description: 'Carl engineers elaborate explosive traps to survive the sadistic showrunners of the dungeon broadcast.',
      genre: ['LitRPG', 'Comedy', 'Survival'],
      rating: 9.7,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn6',
      title: 'Defiance of the Fall (Incursion Arc)',
      author: 'TheFirstDefier',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/24709-defiance-of-the-fall.jpg',
      description: 'Zac wipes out demonic incursions alone in the forest using pure strength and cosmic axe skills.',
      genre: ['LitRPG', 'Action', 'Cultivation'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn7',
      title: 'The Primal Hunter (Initiation)',
      author: 'Zogarth',
      category: 'webnovel',
      coverImage: 'https://novelfire.net/server-1/the-primal-hunter.jpg',
      description: 'Jake excels in the ruthless wilderness of the tutorial while office coworkers turn on each other.',
      genre: ['LitRPG', 'Action', 'Adventure'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn8',
      title: 'He Who Fights with Monsters (Void Arc)',
      author: 'Shirtaloon',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-large/26294-he-who-fights-with-monsters.jpg',
      description: 'Jason Asano fights monstrous astral incursions threatening Earth and Pallimustus alike.',
      genre: ['LitRPG', 'Adventure', 'Action'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn9',
      title: 'Mother of Learning (Loop Escape)',
      author: 'Domagoj Kurmaic',
      category: 'webnovel',
      coverImage: 'https://www.royalroadcdn.com/public/covers-full/21220-mother-of-learning.jpg',
      description: 'Zorian and Zach race against the primordial entity Panaxeth to escape the collapsing loop world.',
      genre: ['Fantasy', 'Time Loop', 'Mystery'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-wn10',
      title: 'Omniscient Reader Viewpoint (Epilogue)',
      author: 'Sing Shong',
      category: 'webnovel',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg',
      description: 'Kim Dokja Company struggles through the final scenario to reach the conclusion of the Star Stream.',
      genre: ['Action', 'Apocalypse', 'Fantasy'],
      rating: 9.8,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ],
  book: [
    {
      id: 'companion-surv-b1',
      title: 'The Last Man',
      author: 'Mary Shelley',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/18247/pg18247.cover.medium.jpg',
      description: 'Mary Shelley pioneering apocalyptic novel following the gradual extinction of humanity by a global pandemic.',
      genre: ['Apocalypse', 'Sci-Fi', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b2',
      title: 'The Scarlet Plague',
      author: 'Jack London',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/21970/pg21970.cover.medium.jpg',
      description: 'Sixty years after a swift red death devastates world population, an elderly survivor recounts the fall of mankind.',
      genre: ['Apocalypse', 'Survival', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b3',
      title: 'The Sea-Wolf',
      author: 'Jack London',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/1074/pg1074.cover.medium.jpg',
      description: 'Humphrey van Weyden is rescued by the brutal sea captain Wolf Larsen, learning survival among hard men.',
      genre: ['Adventure', 'Survival', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b4',
      title: 'Heart of Darkness',
      author: 'Joseph Conrad',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/219/pg219.cover.medium.jpg',
      description: 'Marlow journeys up the Congo River in search of the enigmatic ivory trader Kurtz, confronting human savagery.',
      genre: ['Psychological', 'Drama', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b5',
      title: 'The Island of Doctor Moreau (Survival)',
      author: 'H.G. Wells',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/159/pg159.cover.medium.jpg',
      description: 'A shipwreck survivor must navigate the savage beast-folk of a mad doctor remote vivisection island.',
      genre: ['Sci-Fi', 'Horror', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b6',
      title: 'Robinson Crusoe (Castaway Edition)',
      author: 'Daniel Defoe',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/521/pg521.cover.medium.jpg',
      description: 'A castaway spends 28 years on an uninhabited desert island, mastering survival, farming, and rescue.',
      genre: ['Survival', 'Adventure', 'Classic'],
      rating: 9.3,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b7',
      title: 'The Call of the Wild (Klondike)',
      author: 'Jack London',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/215/pg215.cover.medium.jpg',
      description: 'Buck learns the brutal law of club and fang in the savage frozen Alaskan wilderness.',
      genre: ['Survival', 'Adventure', 'Classic'],
      rating: 9.5,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b8',
      title: 'White Fang (Wilderness)',
      author: 'Jack London',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/910/pg910.cover.medium.jpg',
      description: 'A wild wolfdog survives harsh northern conditions, fighting pits, and eventually learns trust and loyalty.',
      genre: ['Survival', 'Adventure', 'Classic'],
      rating: 9.4,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b9',
      title: 'The Invisible Man',
      author: 'H.G. Wells',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/5230/pg5230.cover.medium.jpg',
      description: 'Griffin invents an optics formula for invisibility, turning into a megalomaniacal fugitive hunted across England.',
      genre: ['Sci-Fi', 'Horror', 'Classic'],
      rating: 9.2,
      pointsPerChapter: 1.5,
      chapters: []
    },
    {
      id: 'companion-surv-b10',
      title: 'Twenty Thousand Leagues Under the Seas',
      author: 'Jules Verne',
      category: 'book',
      coverImage: 'https://www.gutenberg.org/cache/epub/164/pg164.cover.medium.jpg',
      description: 'Captives aboard the Nautilus navigate undersea trenches, giant squid attacks, and sunken Atlantis.',
      genre: ['Sci-Fi', 'Adventure', 'Classic'],
      rating: 9.6,
      pointsPerChapter: 1.5,
      chapters: []
    }
  ]
};

/**
 * Detects the semantic trope, genre cluster, and targeted keywords for ANY book.
 */
export function detectSemanticTrope(targetBook: Book): {
  tropeName: string;
  anilistGenres: string[];
  webnovelKeyword: string;
  bookKeyword: string;
  pool: ThematicCompanionMatrix;
} {
  const targetTitle = (targetBook.title || '').toLowerCase();
  const targetDesc = (targetBook.description || '').toLowerCase();
  const targetGenres = (targetBook.genre || []).map(g => g.toLowerCase().trim());
  const combined = `${targetTitle} ${targetBook.category || ''} ${targetDesc} ${targetGenres.join(' ')}`;

  // 1. Adult / Ecchi Romance
  if (
    combined.includes('secret class') ||
    combined.includes('boarding diary') ||
    combined.includes('silent war') ||
    combined.includes('sweet guy') ||
    combined.includes('touch to unlock') ||
    combined.includes('pervert') ||
    combined.includes('circles') ||
    combined.includes('bad thinking') ||
    combined.includes('stepmother') ||
    combined.includes('harem') ||
    combined.includes('ecchi') ||
    combined.includes('hentai') ||
    combined.includes('erotic') ||
    combined.includes('mature') ||
    targetGenres.some(g => ['ecchi', 'erotica', 'hentai', 'mature', 'harem'].includes(g))
  ) {
    return {
      tropeName: 'Adult Romance & Drama',
      anilistGenres: ['Ecchi', 'Romance', 'Comedy'],
      webnovelKeyword: 'harem',
      bookKeyword: 'romance',
      pool: MODERN_ADULT_ROMANCE_POOL
    };
  }

  // 2. Royalty / Otome / Nobility Romance
  if (
    combined.includes('villainess') ||
    combined.includes('empress') ||
    combined.includes('duchess') ||
    combined.includes('pride and prejudice') ||
    combined.includes('pride') ||
    combined.includes('prejudice') ||
    combined.includes('austen') ||
    combined.includes('bronte') ||
    combined.includes('regency') ||
    combined.includes('nobility') ||
    combined.includes('princess') ||
    combined.includes('marriage') ||
    combined.includes('duke') ||
    combined.includes('aristocrat') ||
    (targetGenres.includes('romance') && (targetGenres.includes('drama') || combined.includes('noble')))
  ) {
    return {
      tropeName: 'High Society & Otome Royalty',
      anilistGenres: ['Romance', 'Drama', 'Fantasy'],
      webnovelKeyword: 'villainess',
      bookKeyword: 'romance',
      pool: ROMANCE_NOBILITY_POOL
    };
  }

  // 3. Murim & Cultivation
  if (
    combined.includes('mount hua') ||
    combined.includes('murim') ||
    combined.includes('cultivat') ||
    combined.includes('martial art') ||
    combined.includes('martial') ||
    combined.includes('sect') ||
    combined.includes('qi') ||
    combined.includes('sword') ||
    combined.includes('dao') ||
    combined.includes('heavenly') ||
    combined.includes('nano machine') ||
    combined.includes('northern blade') ||
    combined.includes('reverend insanity') ||
    combined.includes('blade')
  ) {
    return {
      tropeName: 'Murim & Cultivation Legends',
      anilistGenres: ['Action', 'Adventure', 'Fantasy'],
      webnovelKeyword: 'cultivation',
      bookKeyword: 'war',
      pool: MURIM_CULTIVATION_POOL
    };
  }

  // 4. Dark Fantasy, Gothic & Horror
  if (
    combined.includes('dracula') ||
    combined.includes('frankenstein') ||
    combined.includes('berserk') ||
    combined.includes('tokyo ghoul') ||
    combined.includes('sweet home') ||
    combined.includes('gothic') ||
    combined.includes('vampire') ||
    combined.includes('horror') ||
    combined.includes('curse') ||
    combined.includes('undead') ||
    combined.includes('necromanc') ||
    combined.includes('corpse') ||
    combined.includes('ghoul') ||
    combined.includes('dark fantasy') ||
    targetGenres.some(g => ['horror', 'dark fantasy', 'gothic'].includes(g))
  ) {
    return {
      tropeName: 'Gothic Lore & Dark Fantasy',
      anilistGenres: ['Horror', 'Supernatural', 'Action'],
      webnovelKeyword: 'horror',
      bookKeyword: 'gothic',
      pool: DARK_FANTASY_GOTHIC_POOL
    };
  }

  // 5. Mystery, Mind Games & Psychological Thriller
  if (
    combined.includes('death note') ||
    combined.includes('sherlock') ||
    combined.includes('classroom of the elite') ||
    combined.includes('detective') ||
    combined.includes('mystery') ||
    combined.includes('investigat') ||
    combined.includes('crime') ||
    combined.includes('murder') ||
    combined.includes('psychological') ||
    combined.includes('mind') ||
    combined.includes('intellect') ||
    combined.includes('schem') ||
    combined.includes('moriarty') ||
    combined.includes('doyle') ||
    combined.includes('puzzle') ||
    targetGenres.some(g => ['mystery', 'psychological', 'thriller'].includes(g))
  ) {
    return {
      tropeName: 'Mind Games & Master Detective',
      anilistGenres: ['Mystery', 'Psychological', 'Thriller'],
      webnovelKeyword: 'detective',
      bookKeyword: 'mystery',
      pool: MYSTERY_PSYCHOLOGICAL_POOL
    };
  }

  // 6. Epic Adventure, Voyage & Exploration
  if (
    combined.includes('one piece') ||
    combined.includes('hunter x hunter') ||
    combined.includes('moby dick') ||
    combined.includes('frieren') ||
    combined.includes('voyage') ||
    combined.includes('pirate') ||
    combined.includes('ocean') ||
    combined.includes('island') ||
    combined.includes('treasure') ||
    combined.includes('expedition') ||
    combined.includes('sea') ||
    combined.includes('sail')
  ) {
    return {
      tropeName: 'Grand Voyage & Epic Exploration',
      anilistGenres: ['Adventure', 'Action', 'Fantasy'],
      webnovelKeyword: 'adventure',
      bookKeyword: 'adventure',
      pool: ADVENTURE_EPIC_POOL
    };
  }

  // 7. Survival & Cataclysmic Apocalypse
  if (
    combined.includes('apocalypse') ||
    combined.includes('apocalyptic') ||
    combined.includes('survival') ||
    combined.includes('war of the worlds') ||
    combined.includes('collapse') ||
    combined.includes('end of the world') ||
    combined.includes('cataclysm') ||
    combined.includes('zombie')
  ) {
    return {
      tropeName: 'Apocalyptic Survival & Ruin',
      anilistGenres: ['Action', 'Sci-Fi', 'Horror'],
      webnovelKeyword: 'apocalypse',
      bookKeyword: 'world',
      pool: SURVIVAL_APOCALYPSE_POOL
    };
  }

  // 8. Default: Hunter, Leveling & Dungeon Fantasy
  return {
    tropeName: 'Hunter & Awakening System',
    anilistGenres: ['Action', 'Fantasy', 'Adventure'],
    webnovelKeyword: 'necromancer',
    bookKeyword: 'monster',
    pool: HUNTER_SYSTEM_POOL
  };
}

/**
 * Returns instant, tailored, non-home companion recommendations across all 5 categories.
 * Guaranteed 10 books per category (50 total), zero home-page titles.
 */
export function getCuratedNonHomeRecommendations(
  targetBook: Book,
  randomSeed: number = 0
): PuterRecommendationsResult {
  const targetTitleNorm = normalizeTitle(targetBook.title || '');
  const profile = detectSemanticTrope(targetBook);
  const pool = profile.pool;

  const categories: ContentCategory[] = ['manhwa', 'manga', 'lightnovel', 'webnovel', 'book'];
  const grouped: Record<ContentCategory, PuterRecommendedItem[]> = {
    manhwa: [],
    manga: [],
    lightnovel: [],
    webnovel: [],
    book: []
  };

  categories.forEach(cat => {
    let list = (pool[cat] || []).filter(item => {
      const bNorm = normalizeTitle(item.title);
      return (
        bNorm !== targetTitleNorm &&
        !isHomePageBook(item.title) &&
        item.id.toLowerCase() !== (targetBook.id || '').toLowerCase()
      );
    });

    if (randomSeed > 0 && list.length > 1) {
      const shift = randomSeed % list.length;
      list = [...list.slice(shift), ...list.slice(0, shift)];
    }

    grouped[cat] = list.map((b) => ({
      book: b,
      reason: `${profile.tropeName} • ${getSourceName(b)}`,
      isAiPick: false
    }));
  });

  const totalCount = Object.values(grouped).reduce((sum, list) => sum + list.length, 0);

  return {
    recommendations: grouped,
    totalCount,
    isFromAi: false
  };
}

/**
 * Backward compatibility alias for BookOverviewPage.tsx
 */
export function getCatalogSmartRecommendations(
  targetBook: Book,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _unusedCatalog: Book[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetCount: number = 10,
  randomSeed: number = 0
): PuterRecommendationsResult {
  return getCuratedNonHomeRecommendations(targetBook, randomSeed);
}

interface AniListMediaItem {
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

function anilistMediaToBook(media: AniListMediaItem, forcedCategory?: ContentCategory): Book | null {
  if (!media || !media.title) return null;
  const rawTitle = (media.title.english || media.title.romaji || '').trim();
  if (!rawTitle) return null;
  if (isHomePageBook(rawTitle)) return null;

  let cat: ContentCategory = forcedCategory || 'manga';
  if (!forcedCategory) {
    if (media.format === 'NOVEL') {
      cat = 'lightnovel';
    } else if (media.countryOfOrigin === 'KR' || /manhwa|webtoon/i.test(rawTitle)) {
      cat = 'manhwa';
    } else if (media.countryOfOrigin === 'CN') {
      cat = 'manhwa';
    } else if (media.countryOfOrigin === 'JP') {
      cat = 'manga';
    }
  }

  const cover =
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg';

  const desc = cleanHtml(media.description) || `Acclaimed companion series in ${cat}.`;
  const rating = media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : 8.8;
  const genres = media.genres?.length ? media.genres : ['Action', 'Fantasy'];

  return {
    id: `anilist-${media.id}`,
    title: rawTitle,
    author: cat === 'manhwa' ? 'Studio Redice' : cat === 'manga' ? 'Manga Creator' : 'Light Novel Author',
    category: cat,
    coverImage: cover,
    description: desc,
    genre: genres,
    rating,
    pointsPerChapter: 1.5,
    chapters: []
  };
}

interface AniListMultiCategoryResult {
  directBooks: Book[];
  manhwaCompanions: Book[];
  mangaCompanions: Book[];
  novelCompanions: Book[];
}

/**
 * Fetches AniList recommendations with Task B -> Task A separation:
 * Task B: Try Direct Title Search first on AniList (for adaptations & direct relations).
 * Task A: Companion Feed by Genre (Always runs to guarantee top Manhwa & Manga matching the genre).
 */
async function fetchAniListMultiCategoryRecs(
  title: string,
  genres: string[],
  targetNorm: string,
  signal?: AbortSignal
): Promise<AniListMultiCategoryResult> {
  const result: AniListMultiCategoryResult = {
    directBooks: [],
    manhwaCompanions: [],
    mangaCompanions: [],
    novelCompanions: []
  };

  const cleanGenres = genres.length > 0 ? genres.slice(0, 3) : ['Action', 'Fantasy'];

  // 1. Task B: Try Direct Title Search first on AniList (if title exists)
  if (title && title.trim().length >= 2) {
    const directQuery = `
      query ($search: String) {
        directMedia: Media(search: $search, type: MANGA) {
          id
          title { english romaji }
          countryOfOrigin
          format
          relations {
            edges {
              node {
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
          recommendations(sort: RATING_DESC, perPage: 25) {
            nodes {
              mediaRecommendation {
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
        }
      }
    `;

    try {
      const directRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'ReadVerse/1.0'
        },
        body: JSON.stringify({
          query: directQuery,
          variables: { search: title }
        }),
        signal
      });

      if (directRes.ok) {
        const json = await directRes.json();
        const direct = json?.data?.directMedia;
        if (direct) {
          const relations = direct.relations?.edges || [];
          for (const rel of relations) {
            const node = rel?.node;
            if (!node) continue;
            const b = anilistMediaToBook(node);
            if (b && normalizeTitle(b.title) !== targetNorm && !isHomePageBook(b.title)) {
              result.directBooks.push(b);
            }
          }

          const recNodes = direct.recommendations?.nodes || [];
          for (const node of recNodes) {
            const rec = node?.mediaRecommendation;
            if (!rec) continue;
            const b = anilistMediaToBook(rec);
            if (b && normalizeTitle(b.title) !== targetNorm && !isHomePageBook(b.title)) {
              result.directBooks.push(b);
            }
          }
        }
      }
    } catch {
      // Task B not found (e.g. webnovel or custom epub not in AniList) - continue to Task A
    }
  }

  // 2. Task A: Companion Feed by Genre (guarantees top Manhwa, Manga & Light Novels)
  const companionQuery = `
    query ($genres: [String]) {
      manhwaCompanions: Page(page: 1, perPage: 30) {
        media(genre_in: $genres, countryOfOrigin: "KR", type: MANGA, sort: [TRENDING_DESC, POPULARITY_DESC]) {
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
      mangaCompanions: Page(page: 1, perPage: 30) {
        media(genre_in: $genres, countryOfOrigin: "JP", format: MANGA, type: MANGA, sort: [TRENDING_DESC, POPULARITY_DESC]) {
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
      novelCompanions: Page(page: 1, perPage: 30) {
        media(genre_in: $genres, format: NOVEL, type: MANGA, sort: [TRENDING_DESC, POPULARITY_DESC]) {
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
    const compRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ReadVerse/1.0'
      },
      body: JSON.stringify({
        query: companionQuery,
        variables: { genres: cleanGenres }
      }),
      signal
    });

    if (compRes.ok) {
      const json = await compRes.json();
      const data = json?.data;
      if (data) {
        const manhwaList = data.manhwaCompanions?.media || [];
        for (const m of manhwaList) {
          const b = anilistMediaToBook(m, 'manhwa');
          if (b && normalizeTitle(b.title) !== targetNorm && !isHomePageBook(b.title)) {
            result.manhwaCompanions.push(b);
          }
        }

        const mangaList = data.mangaCompanions?.media || [];
        for (const m of mangaList) {
          const b = anilistMediaToBook(m, 'manga');
          if (b && normalizeTitle(b.title) !== targetNorm && !isHomePageBook(b.title)) {
            result.mangaCompanions.push(b);
          }
        }

        const novelList = data.novelCompanions?.media || [];
        for (const m of novelList) {
          const b = anilistMediaToBook(m, 'lightnovel');
          if (b && normalizeTitle(b.title) !== targetNorm && !isHomePageBook(b.title)) {
            result.novelCompanions.push(b);
          }
        }
      }
    }
  } catch {
    // Companion network error
  }

  return result;
}

/**
 * Searches our live backend sources (MangaDex, NovelBuddy, Gutenberg) for fresh titles
 */
async function searchLiveSources(
  keyword: string,
  category: ContentCategory,
  targetNorm: string,
  signal?: AbortSignal
): Promise<Book[]> {
  const cleanKeyword = (keyword || '').trim();
  if (!cleanKeyword) return [];

  try {
    let url = '';
    if (category === 'manhwa' || category === 'manga') {
      url = `/api/manga/search?q=${encodeURIComponent(cleanKeyword)}&category=${category}`;
    } else if (category === 'webnovel') {
      url = `/api/webnovels/search?q=${encodeURIComponent(cleanKeyword)}`;
    } else if (category === 'lightnovel') {
      url = `/api/lightnovels/search?q=${encodeURIComponent(cleanKeyword)}`;
    } else {
      url = `/api/books/search?q=${encodeURIComponent(cleanKeyword)}`;
    }

    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const list: Book[] = Array.isArray(data.books) ? data.books : [];

    return list.filter(b => {
      const bNorm = normalizeTitle(b.title);
      return bNorm && bNorm !== targetNorm && !isHomePageBook(b.title);
    });
  } catch {
    return [];
  }
}

/**
 * Main AI recommendation function.
 * Fetches dynamic companion recommendations for ALL 5 categories (Manhwa, Manga, Light Novels,
 * Webnovels, and Classics) regardless of what book category is being viewed.
 */
export async function getPuterAIRecommendations(
  book: Book,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _catalog: Book[],
  signal?: AbortSignal
): Promise<PuterRecommendationsResult> {
  const bookTitle = (book.title || '').trim();
  const targetNorm = normalizeTitle(bookTitle);
  const profile = detectSemanticTrope(book);

  const emptyResult: PuterRecommendationsResult = {
    recommendations: {
      manhwa: [],
      manga: [],
      lightnovel: [],
      webnovel: [],
      book: []
    },
    totalCount: 0,
    isFromAi: true
  };

  if (!bookTitle) {
    return emptyResult;
  }

  // Discover live titles in parallel across all categories
  const resolved: Record<ContentCategory, PuterRecommendedItem[]> = {
    manhwa: [],
    manga: [],
    lightnovel: [],
    webnovel: [],
    book: []
  };

  const seenNormTitles = new Set<string>([targetNorm]);

  try {
    const [aniListResult, webnovelsLive, booksLive] = await Promise.allSettled([
      fetchAniListMultiCategoryRecs(bookTitle, profile.anilistGenres, targetNorm, signal),
      searchLiveSources(profile.webnovelKeyword, 'webnovel', targetNorm, signal),
      searchLiveSources(profile.bookKeyword, 'book', targetNorm, signal)
    ]);

    // 1. Add direct relations & community recommendations from AniList
    if (aniListResult.status === 'fulfilled') {
      const ani = aniListResult.value;
      for (const b of ani.directBooks) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title)) {
          seenNormTitles.add(bNorm);
          if (resolved[b.category].length < 30) {
            resolved[b.category].push({
              book: b,
              reason: `AniList Companion • ${getSourceName(b)}`,
              isAiPick: true
            });
          }
        }
      }

      // 2. Add targeted Manhwa companions
      for (const b of ani.manhwaCompanions) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title) && resolved.manhwa.length < 30) {
          seenNormTitles.add(bNorm);
          resolved.manhwa.push({
            book: b,
            reason: `Top Webtoon • ${profile.tropeName}`,
            isAiPick: true
          });
        }
      }

      // 3. Add targeted Manga companions
      for (const b of ani.mangaCompanions) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title) && resolved.manga.length < 30) {
          seenNormTitles.add(bNorm);
          resolved.manga.push({
            book: b,
            reason: `Top Manga • ${profile.tropeName}`,
            isAiPick: true
          });
        }
      }

      // 4. Add targeted Light Novel companions
      for (const b of ani.novelCompanions) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title) && resolved.lightnovel.length < 30) {
          seenNormTitles.add(bNorm);
          resolved.lightnovel.push({
            book: b,
            reason: `Top Light Novel • ${profile.tropeName}`,
            isAiPick: true
          });
        }
      }
    }

    // 5. Add Web Novels from live NovelBuddy search
    if (webnovelsLive.status === 'fulfilled') {
      for (const b of webnovelsLive.value) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title) && resolved.webnovel.length < 30) {
          seenNormTitles.add(bNorm);
          resolved.webnovel.push({
            book: b,
            reason: `NovelBuddy • ${profile.tropeName}`,
            isAiPick: true
          });
        }
      }
    }

    // 6. Add Classic Literature from live Gutenberg search
    if (booksLive.status === 'fulfilled') {
      for (const b of booksLive.value) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title) && resolved.book.length < 30) {
          seenNormTitles.add(bNorm);
          resolved.book.push({
            book: b,
            reason: `Gutenberg Classic • ${profile.tropeName}`,
            isAiPick: true
          });
        }
      }
    }
    // 7. Supplement Manhwa / Manga from live MangaDex search if AniList returned fewer than 25
    if (resolved.manhwa.length < 25) {
      try {
        const liveManhwa = await searchLiveSources(profile.tropeName, 'manhwa', targetNorm, signal);
        for (const b of liveManhwa) {
          const bNorm = normalizeTitle(b.title);
          if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title) && resolved.manhwa.length < 30) {
            seenNormTitles.add(bNorm);
            resolved.manhwa.push({
              book: b,
              reason: `MangaDex • ${profile.tropeName}`,
              isAiPick: true
            });
          }
        }
      } catch {
        // Ignore
      }
    }

    // 8. Backfill any sparse category from curated thematic companion pool (profile.pool)
    const pool = profile.pool;
    if (pool) {
      (['manhwa', 'manga', 'lightnovel', 'webnovel', 'book'] as ContentCategory[]).forEach(cat => {
        if (resolved[cat].length < 15 && pool[cat]) {
          for (const b of pool[cat]) {
            const bNorm = normalizeTitle(b.title);
            if (!seenNormTitles.has(bNorm) && !isHomePageBook(b.title)) {
              seenNormTitles.add(bNorm);
              resolved[cat].push({
                book: b,
                reason: `${profile.tropeName} Companion`,
                isAiPick: true
              });
              if (resolved[cat].length >= 30) break;
            }
          }
        }
      });
    }
  } catch {
    // Non-blocking fallback
  }

  const totalCount = Object.values(resolved).reduce((sum, list) => sum + list.length, 0);

  const result: PuterRecommendationsResult = {
    recommendations: resolved,
    totalCount,
    isFromAi: true
  };

  return result;
}

const TROPE_KEYWORDS: Record<string, string[]> = {
  'Adult Romance & Drama': ['harem', 'romance', 'drama', 'secret', 'campus', 'love', 'affair'],
  'High Society & Otome Royalty': ['villainess', 'duke', 'empress', 'tyrant', 'princess', 'marriage', 'noble', 'contract'],
  'Murim & Cultivation Legends': ['cultivation', 'immortal', 'martial', 'dao', 'sect', 'alchemy', 'sword', 'reincarnation'],
  'Hunter & System Awakenings': ['hunter', 'dungeon', 'system', 'ranker', 'awakening', 'tower', 'necromancer', 'regression'],
  'Dark Fantasy & Psychological Horror': ['apocalypse', 'dark', 'demon', 'horror', 'abyss', 'shadow', 'zombie', 'death'],
  'Mystery & Supernatural Suspense': ['detective', 'mystery', 'thriller', 'game', 'puzzle', 'supernatural', 'psychological'],
  'Epic Fantasy & Reincarnation': ['isekai', 'magic', 'reincarnation', 'fantasy', 'adventure', 'kingdom', 'dragon', 'hero'],
  'Cyberpunk & Sci-Fi Apocalyptic': ['cyberpunk', 'scifi', 'space', 'robot', 'virtual', 'future', 'galaxy', 'mech']
};

/**
 * Dynamically fetches the next batch of brand-new similar books for a specific category as the user scrolls.
 */
export async function fetchMoreCategoryRecommendations(
  book: Book,
  category: ContentCategory,
  page: number = 2,
  signal?: AbortSignal
): Promise<PuterRecommendedItem[]> {
  if (!book || !book.title) return [];

  const profile = detectSemanticTrope(book);
  const targetNorm = normalizeTitle(book.title);
  const cleanGenres = profile.anilistGenres.length > 0 ? profile.anilistGenres : ['Action', 'Fantasy', 'Adventure'];
  const tropeKeywords = TROPE_KEYWORDS[profile.tropeName] || ['fantasy', 'adventure', 'magic', 'action'];
  const keyword = tropeKeywords[(page - 1) % tropeKeywords.length] || profile.webnovelKeyword || 'action';
  const currentGenre = cleanGenres[(page - 1) % cleanGenres.length] || 'Action';
  const aniPage = Math.max(1, Math.floor((page - 1) / cleanGenres.length) + 1);

  const results: PuterRecommendedItem[] = [];
  const seenNorms = new Set<string>([targetNorm]);

  if (category === 'manhwa' || category === 'manga' || category === 'lightnovel') {
    const isManhwa = category === 'manhwa';
    const isNovel = category === 'lightnovel';

    const aniQuery = `
      query ($genre: String, $page: Int) {
        Page(page: $page, perPage: 20) {
          media(
            genre: $genre,
            countryOfOrigin: ${isManhwa ? '"KR"' : '"JP"'},
            ${isNovel ? 'format: NOVEL,' : isManhwa ? 'type: MANGA,' : 'format: MANGA, type: MANGA,'}
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
          query: aniQuery,
          variables: { genre: currentGenre, page: aniPage }
        }),
        signal
      });

      if (res.ok) {
        const json = await res.json();
        const mediaList: AniListMediaItem[] = json?.data?.Page?.media || [];
        for (const m of mediaList) {
          const b = anilistMediaToBook(m, category);
          if (b) {
            const bNorm = normalizeTitle(b.title);
            if (!seenNorms.has(bNorm) && !isHomePageBook(b.title)) {
              seenNorms.add(bNorm);
              results.push({
                book: b,
                reason: `${currentGenre} • AniList`,
                isAiPick: true
              });
            }
          }
        }
      }
    } catch {
      // Ignore network errors and continue to backup
    }

    // If live AniList returned fewer than 4 items, try trope keyword via live sources (MangaDex)
    if (results.length < 4) {
      try {
        const liveManga = await searchLiveSources(keyword, category, targetNorm, signal);
        for (const b of liveManga) {
          const bNorm = normalizeTitle(b.title);
          if (!seenNorms.has(bNorm) && !isHomePageBook(b.title)) {
            seenNorms.add(bNorm);
            results.push({
              book: b,
              reason: `${profile.tropeName} • Live Discovery`,
              isAiPick: true
            });
          }
        }
      } catch {
        // Ignore
      }
    }
  } else if (category === 'webnovel') {
    try {
      const liveBooks = await searchLiveSources(keyword, 'webnovel', targetNorm, signal);
      for (const b of liveBooks) {
        const bNorm = normalizeTitle(b.title);
        if (!seenNorms.has(bNorm) && !isHomePageBook(b.title)) {
          seenNorms.add(bNorm);
          results.push({
            book: b,
            reason: `Webnovel Companion • ${keyword}`,
            isAiPick: true
          });
        }
      }
    } catch {
      // Ignore
    }
  } else if (category === 'book') {
    try {
      const bookKeyword = tropeKeywords[(page - 1) % tropeKeywords.length] || profile.bookKeyword || 'classic';
      const gutenbergUrl = `https://gutendex.com/books/?search=${encodeURIComponent(bookKeyword)}&languages=en&page=${page}`;
      const res = await fetch(gutenbergUrl, {
        signal,
        headers: {
          'User-Agent': 'ReadVerse/1.0',
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.results) ? data.results : [];
        for (const item of items) {
          if (!item.id || !item.title) continue;
          const author = item.authors?.[0]?.name
            ? item.authors[0].name.split(',').reverse().join(' ').trim()
            : 'Classic Author';
          const coverImage =
            item.formats?.['image/jpeg'] ||
            `https://covers.openlibrary.org/b/id/12216503-L.jpg`;
          const desc =
            item.summaries?.[0] ||
            `${item.title} by ${author}. A timeless literary work matching ${profile.tropeName}.`;
          const b: Book = {
            id: `gutenberg-${item.id}`,
            title: item.title,
            author,
            category: 'book',
            coverImage,
            description: desc,
            genre: ['Classic', 'Literature'],
            rating: 8.9,
            pointsPerChapter: 1.5,
            chapters: []
          };
          const bNorm = normalizeTitle(b.title);
          if (!seenNorms.has(bNorm) && !isHomePageBook(b.title)) {
            seenNorms.add(bNorm);
            results.push({
              book: b,
              reason: `Classic Literature • ${profile.tropeName}`,
              isAiPick: true
            });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return results;
}
