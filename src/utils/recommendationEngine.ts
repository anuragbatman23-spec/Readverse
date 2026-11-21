import { Book, ContentCategory } from '../types';

/**
 * Curated Affinity Mapping:
 * Maps iconic book titles / keywords to their spiritual companion titles across all formats.
 */
export const TITLE_AFFINITIES: Record<string, string[]> = {
  // Solo Leveling
  'solo leveling': [
    "Omniscient Reader's Viewpoint",
    'The Beginning After The End',
    'Shadow Slave',
    'Overlord',
    'The Eminence in Shadow',
    'Jujutsu Kaisen',
    'Berserk',
    'SSS-Class Revival Hunter',
    'Nano Machine',
    'Overgeared',
    'The Primal Hunter',
    'Defiance of the Fall',
    'Frankenstein; or, The Modern Prometheus',
    'The Count of Monte Cristo'
  ],
  // Omniscient Reader's Viewpoint
  "omniscient reader's viewpoint": [
    'Solo Leveling',
    'Lord of the Mysteries',
    'Shadow Slave',
    'SSS-Class Revival Hunter',
    'Death Note',
    'Classroom of the Elite',
    'Overlord',
    'The Perfect Run',
    'Mother of Learning',
    'The Metamorphosis',
    'Crime and Punishment',
    'The Picture of Dorian Gray'
  ],
  // Tower of God
  'tower of god': [
    'Hunter x Hunter',
    'Solo Leveling',
    'The God of High School',
    'Lord of the Mysteries',
    'One Piece',
    'Defiance of the Fall',
    'The Beginning After The End',
    'The Count of Monte Cristo',
    'Bleach'
  ],
  // One Piece
  'one piece': [
    'Hunter x Hunter',
    'Bleach',
    'Naruto',
    'Tower of God',
    'Moby Dick; or, The Whale',
    'The Count of Monte Cristo',
    'Mushoku Tensei: Jobless Reincarnation',
    'The Primal Hunter',
    'Wind Breaker'
  ],
  // Berserk
  'berserk': [
    'Vagabond',
    'Vinland Saga',
    'Chainsaw Man',
    'Legend of the Northern Blade',
    'Shadow Slave',
    'Overlord',
    'Dracula',
    'Frankenstein; or, The Modern Prometheus',
    'Sweet Home',
    'Bastard',
    'Claymore'
  ],
  // Dracula
  'dracula': [
    'Frankenstein; or, The Modern Prometheus',
    'The Picture of Dorian Gray',
    'The Strange Case of Dr. Jekyll and Mr. Hyde',
    'Berserk',
    'Tokyo Ghoul',
    'Sweet Home',
    'Lord of the Mysteries',
    'Overlord',
    'Chainsaw Man'
  ],
  // Frankenstein
  'frankenstein': [
    'Dracula',
    'The Time Machine',
    'The Picture of Dorian Gray',
    'The Strange Case of Dr. Jekyll and Mr. Hyde',
    'Berserk',
    'Attack on Titan',
    'Sweet Home',
    'Nano Machine',
    'Lord of the Mysteries',
    'Shadow Slave'
  ],
  // Lord of the Mysteries
  'lord of the mysteries': [
    'Shadow Slave',
    "Omniscient Reader's Viewpoint",
    'Reverend Insanity',
    'The Picture of Dorian Gray',
    'Death Note',
    'The Adventures of Sherlock Holmes',
    'Dracula',
    'Mother of Learning',
    'Overlord'
  ],
  // Shadow Slave
  'shadow slave': [
    'Lord of the Mysteries',
    'Solo Leveling',
    'The Primal Hunter',
    'Defiance of the Fall',
    'Berserk',
    'Overlord',
    'Frankenstein; or, The Modern Prometheus',
    'The Beginning After The End',
    'Jujutsu Kaisen'
  ],
  // Return of the Mount Hua Sect / Murim
  'return of the mount hua sect': [
    'Legend of the Northern Blade',
    'Nano Machine',
    'The God of High School',
    'Vagabond',
    'Reverend Insanity',
    'The Art of War'
  ],
  // Wind Breaker / Sports / Action
  'wind breaker': [
    'Lookism',
    'The God of High School',
    'Eleceed',
    'One Piece',
    'Solo Leveling'
  ],
  // Sweet Home / Horror
  'sweet home': [
    'Bastard',
    'Tokyo Ghoul',
    'Chainsaw Man',
    'Berserk',
    'Dracula',
    'Frankenstein; or, The Modern Prometheus',
    'The War of the Worlds'
  ],
  // Pride and Prejudice / Romance / Classic
  'pride and prejudice': [
    'Jane Eyre: An Autobiography',
    'The Great Gatsby',
    'A Tale of Two Cities',
    'The Picture of Dorian Gray',
    'Lookism'
  ],
  // The Great Gatsby
  'the great gatsby': [
    'Pride and Prejudice',
    'The Picture of Dorian Gray',
    'A Tale of Two Cities',
    'Crime and Punishment',
    'Classroom of the Elite'
  ],
  // Sherlock Holmes
  'the adventures of sherlock holmes': [
    'Death Note',
    'Lord of the Mysteries',
    'Crime and Punishment',
    'The Strange Case of Dr. Jekyll and Mr. Hyde',
    'Classroom of the Elite'
  ],
  // Mushoku Tensei
  'mushoku tensei': [
    'The Beginning After The End',
    'That Time I Got Reincarnated as a Slime',
    'Re:Zero − Starting Life in Another World',
    'Solo Leveling',
    'Overlord',
    'One Piece',
    'Alice’s Adventures in Wonderland'
  ],
  // Chainsaw Man
  'chainsaw man': [
    'Jujutsu Kaisen',
    'Berserk',
    'Tokyo Ghoul',
    'Sweet Home',
    'Bastard',
    'Overlord',
    'Frankenstein; or, The Modern Prometheus',
    'Dracula',
    'Shadow Slave',
    'Hell’s Paradise: Jigokuraku'
  ],
  // Jujutsu Kaisen
  'jujutsu kaisen': [
    'Chainsaw Man',
    'Bleach',
    'Naruto',
    'Hunter x Hunter',
    'Solo Leveling',
    'Tokyo Ghoul',
    'Overlord',
    'Shadow Slave',
    'Frankenstein; or, The Modern Prometheus'
  ],
  // Bleach
  'bleach': [
    'Naruto',
    'One Piece',
    'Jujutsu Kaisen',
    'Tower of God',
    'Solo Leveling',
    'The Beginning After The End',
    'Mushoku Tensei: Jobless Reincarnation',
    'Dracula'
  ],
  // Naruto
  'naruto': [
    'One Piece',
    'Bleach',
    'Hunter x Hunter',
    'Jujutsu Kaisen',
    'Tower of God',
    'The God of High School',
    'Solo Leveling',
    'The Art of War'
  ],
  // Attack on Titan
  'attack on titan': [
    'Berserk',
    'Chainsaw Man',
    'Tokyo Ghoul',
    'Sweet Home',
    'Bastard',
    '86',
    'Frankenstein; or, The Modern Prometheus',
    'The War of the Worlds'
  ],
  // Death Note
  'death note': [
    'The Adventures of Sherlock Holmes',
    'Crime and Punishment',
    'Classroom of the Elite',
    'Lord of the Mysteries',
    'The Picture of Dorian Gray',
    'Bastard'
  ],
  // Hunter x Hunter
  'hunter x hunter': [
    'One Piece',
    'Naruto',
    'Bleach',
    'Tower of God',
    'Jujutsu Kaisen',
    'Solo Leveling',
    'The Count of Monte Cristo'
  ],
  // Demon Slayer
  'demon slayer': [
    'Jujutsu Kaisen',
    'Bleach',
    'Chainsaw Man',
    'Legend of the Northern Blade',
    'Return of the Mount Hua Sect',
    'Dracula'
  ],
  // Tokyo Ghoul
  'tokyo ghoul': [
    'Chainsaw Man',
    'Jujutsu Kaisen',
    'Berserk',
    'Sweet Home',
    'Bastard',
    'Overlord',
    'Dracula',
    'Frankenstein; or, The Modern Prometheus'
  ],
  // Classroom of the Elite
  'classroom of the elite': [
    'Death Note',
    'The Art of War',
    'The Great Gatsby',
    'Crime and Punishment',
    'Lord of the Mysteries'
  ],
  // Overlord
  'overlord': [
    'The Eminence in Shadow',
    'That Time I Got Reincarnated as a Slime',
    'Solo Leveling',
    'Berserk',
    'Dracula',
    'Frankenstein; or, The Modern Prometheus',
    'Lord of the Mysteries',
    'Shadow Slave'
  ],
  // The Beginning After The End
  'the beginning after the end': [
    'Solo Leveling',
    'Mushoku Tensei: Jobless Reincarnation',
    "Omniscient Reader's Viewpoint",
    'The Primal Hunter',
    'Defiance of the Fall',
    'Overlord'
  ],
  // Re:Zero
  're:zero': [
    'Mushoku Tensei: Jobless Reincarnation',
    'SSS-Class Revival Hunter',
    'Alice’s Adventures in Wonderland',
    'The Metamorphosis',
    'Omniscient Reader\'s Viewpoint'
  ],
  // Lookism
  'lookism': [
    'Wind Breaker',
    'The God of High School',
    'Eleceed',
    'The Picture of Dorian Gray',
    'The Strange Case of Dr. Jekyll and Mr. Hyde'
  ],
  // Eleceed
  'eleceed': [
    'Solo Leveling',
    'Lookism',
    'The God of High School',
    'Tower of God',
    'Jujutsu Kaisen'
  ],
  // Nano Machine
  'nano machine': [
    'Return of the Mount Hua Sect',
    'Legend of the Northern Blade',
    'Solo Leveling',
    'The Art of War',
    'Frankenstein; or, The Modern Prometheus'
  ],
  // Bastard
  'bastard': [
    'Sweet Home',
    'Crime and Punishment',
    'Tokyo Ghoul',
    'Death Note',
    'Frankenstein; or, The Modern Prometheus'
  ],
  // Horimiya
  'horimiya': [
    'Pride and Prejudice',
    'Jane Eyre: An Autobiography',
    'Wind Breaker',
    'Lookism'
  ],
  // Blue Lock
  'blue lock': [
    'Wind Breaker',
    'The God of High School',
    'One Piece',
    'Hunter x Hunter'
  ],
  // 1984
  '1984': [
    'Crime and Punishment',
    'Attack on Titan',
    'The Metamorphosis',
    'Death Note'
  ],
  // Atomic Habits
  'atomic habits': [
    'Meditations',
    'The Art of War',
    'The Count of Monte Cristo',
    'Crime and Punishment'
  ]
};

/**
 * Deep Micro-Tropes & Keyword Clusters for semantic matching
 */
const MICRO_TROPES: Array<{
  name: string;
  badge: string;
  keywords: string[];
}> = [
  {
    name: 'Hunter & System',
    badge: 'System & Hunter Vibe',
    keywords: ['system', 'hunter', 'gate', 'dungeon', 'level', 'player', 'quest', 'awakening', 'rank', 'monsters']
  },
  {
    name: 'Regression & Rebirth',
    badge: 'Regression / Reborn',
    keywords: ['regression', 'reincarnat', 'reborn', 'second chance', 'time loop', 'past life', 'returner', 'relive']
  },
  {
    name: 'Murim & Martial Arts',
    badge: 'Murim & Swordplay',
    keywords: ['cultivat', 'murim', 'martial art', 'sect', 'qi', 'sword', 'dao', 'heavenly', 'mount hua', 'blade']
  },
  {
    name: 'Gothic & Dark Fantasy',
    badge: 'Gothic & Dark Lore',
    keywords: ['gothic', 'horror', 'vampire', 'curse', 'undead', 'monster', 'dark fantasy', 'macabre', 'corpse', 'blood']
  },
  {
    name: 'Mind Games & Detective',
    badge: 'Mind Games & Strategy',
    keywords: ['detective', 'mystery', 'investigat', 'crime', 'murder', 'mind', 'psychological', 'intellect', 'schem', 'solve']
  },
  {
    name: 'Aristocracy & Classic Romance',
    badge: 'High Society & Drama',
    keywords: ['romance', 'marriage', 'noble', 'aristocrat', 'love', 'duchess', 'emperor', 'society', 'pride', 'prejudice']
  },
  {
    name: 'Epic Voyage & Discovery',
    badge: 'Grand Adventure',
    keywords: ['journey', 'treasure', 'ocean', 'island', 'travel', 'voyage', 'expedition', 'adventure', 'whale', 'pirate', 'grand line']
  },
  {
    name: 'Apocalyptic Survival',
    badge: 'Survival & Monsters',
    keywords: ['apocalypse', 'apocalyptic', 'survival', 'creature', 'quarantine', 'monster invasion', 'collapse', 'end of the world']
  }
];

export interface RecommendedBookItem {
  book: Book;
  matchScore: number;
  highlightReason: string;
}

/**
 * Normalizes title for loose comparison
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculates high-affinity, trope-aware recommendations across all 5 content categories
 */
export function getSmartRecommendations(
  targetBook: Book,
  catalog: Book[],
  targetCount: number = 10,
  randomSeed: number = 0
): {
  recommendations: Record<ContentCategory, RecommendedBookItem[]>;
  totalCount: number;
} {
  const currentId = targetBook.id?.toLowerCase() || '';
  const currentNormTitle = normalizeKey(targetBook.title || '');
  const targetDesc = (targetBook.description || '').toLowerCase();
  const targetGenres = (targetBook.genre || []).map(g => g.toLowerCase().trim());
  const targetText = `${targetBook.title} ${targetDesc} ${targetGenres.join(' ')}`.toLowerCase();

  // 1. Identify which curated affinities apply to this target book
  let curatedList: string[] = [];
  for (const [key, companions] of Object.entries(TITLE_AFFINITIES)) {
    if (currentNormTitle.includes(normalizeKey(key)) || normalizeKey(key).includes(currentNormTitle)) {
      curatedList = companions;
      break;
    }
  }
  const curatedNormSet = new Set(curatedList.map(t => normalizeKey(t)));

  // 2. Identify which micro-tropes match the target book
  const activeTargetTropes = MICRO_TROPES.filter(trope =>
    trope.keywords.some(kw => targetText.includes(kw))
  );

  const categories: ContentCategory[] = ['manhwa', 'manga', 'lightnovel', 'webnovel', 'book'];

  const results: Record<ContentCategory, RecommendedBookItem[]> = {
    manhwa: [],
    manga: [],
    lightnovel: [],
    webnovel: [],
    book: []
  };

  categories.forEach(cat => {
    // Filter out the target book itself
    const candidateBooks = catalog.filter(
      b =>
        (b.category || '').toLowerCase() === cat.toLowerCase() &&
        b.id.toLowerCase() !== currentId &&
        normalizeKey(b.title) !== currentNormTitle
    );

    const scored = candidateBooks.map(b => {
      const bNormTitle = normalizeKey(b.title);
      const bDesc = (b.description || '').toLowerCase();
      const bGenres = (b.genre || []).map(g => g.toLowerCase().trim());
      const bText = `${b.title} ${bDesc} ${bGenres.join(' ')}`.toLowerCase();

      let score = 0;
      let primaryReason = '';

      // A. Curated Direct Affinity (+120 pts)
      if (curatedNormSet.has(bNormTitle)) {
        score += 120;
        primaryReason = `Top match for ${targetBook.title} readers`;
      }

      // B. Micro-Trope Overlap (+25 pts each)
      const matchedTropes: string[] = [];
      activeTargetTropes.forEach(trope => {
        const matchesCandidate = trope.keywords.some(kw => bText.includes(kw));
        if (matchesCandidate) {
          score += 25;
          matchedTropes.push(trope.badge);
        }
      });

      if (!primaryReason && matchedTropes.length > 0) {
        primaryReason = matchedTropes[0];
      }

      // C. Genre Overlap (+8 pts each)
      const sharedGenres = bGenres.filter(bg => targetGenres.includes(bg));
      score += sharedGenres.length * 8;

      if (!primaryReason && sharedGenres.length > 0) {
        primaryReason = `Shares ${sharedGenres.slice(0, 2).join(' & ')}`;
      }

      // D. Quality / Rating bonus
      const rating = typeof b.rating === 'number' ? b.rating : 4.8;
      score += (rating - 4.5) * 15;

      // E. Variety seed jitter (deterministic based on seed and title)
      if (randomSeed > 0) {
        const charSum = bNormTitle.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const jitter = ((charSum * randomSeed) % 17) - 8;
        score += jitter;
      }

      if (!primaryReason) {
        primaryReason = `Top Choice in ${cat === 'book' ? 'Classics' : cat.toUpperCase()}`;
      }

      return {
        book: b,
        matchScore: score,
        highlightReason: primaryReason
      };
    });

    // Sort: highest score first, then rating
    scored.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return (b.book.rating || 0) - (a.book.rating || 0);
    });

    // Take top targetCount for this category
    results[cat] = scored.slice(0, targetCount);
  });

  const totalCount = Object.values(results).reduce((sum, list) => sum + list.length, 0);

  return {
    recommendations: results,
    totalCount
  };
}
