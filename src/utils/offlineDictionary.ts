import { DictionaryEntry } from '../types/dictionary';

// Option 3: Local Offline Dictionary Database (0ms instant lookup, no network required)
export const OFFLINE_DICTIONARY: Record<string, DictionaryEntry> = {
  serendipity: {
    word: 'serendipity',
    phonetic: '/ˌsɛrənˈdɪpɪti/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
            example: 'A fortunate stroke of serendipity led him to the hidden passage.',
            synonyms: ['chance', 'happy accident', 'fluke', 'providence'],
            antonyms: ['misfortune', 'bad luck']
          }
        ],
        synonyms: ['chance', 'fortune'],
        antonyms: ['misfortune']
      }
    ],
    source: 'local'
  },
  ethereal: {
    word: 'ethereal',
    phonetic: '/ɪˈθɪəriəl/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Extremely delicate and light in a way that seems not of this world; heavenly or celestial.',
            example: 'Her ethereal aura illuminated the dark dungeon corridor.',
            synonyms: ['celestial', 'heavenly', 'sublime', 'delicate'],
            antonyms: ['earthly', 'mundane', 'heavy']
          }
        ],
        synonyms: ['celestial', 'delicate'],
        antonyms: ['mundane']
      }
    ],
    source: 'local'
  },
  ephemeral: {
    word: 'ephemeral',
    phonetic: '/ɪˈfɛmərəl/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Lasting for a very short time; transitory, fleeting.',
            example: 'Mortal fame is ephemeral, but the sword intent remained eternal.',
            synonyms: ['fleeting', 'transitory', 'momentary', 'brief'],
            antonyms: ['eternal', 'permanent', 'everlasting']
          }
        ],
        synonyms: ['fleeting', 'brief'],
        antonyms: ['eternal']
      }
    ],
    source: 'local'
  },
  petrichor: {
    word: 'petrichor',
    phonetic: '/ˈpɛtrɪkɔː/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A pleasant, distinctive smell that frequently accompanies the first rain after a long period of warm, dry weather.',
            example: 'The scent of petrichor rose from the scorched battlefield as rain began to fall.',
            synonyms: ['earthy smell', 'rain aroma'],
            antonyms: []
          }
        ],
        synonyms: ['rain scent'],
        antonyms: []
      }
    ],
    source: 'local'
  },
  sonder: {
    word: 'sonder',
    phonetic: '/ˈsɒndər/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The profound realization that each random passerby is living a life as vivid and complex as your own.',
            example: 'Walking through the crowded capital, he felt a sudden wave of sonder.',
            synonyms: ['epiphany', 'awareness', 'empathy'],
            antonyms: ['solipsism', 'apathy']
          }
        ],
        synonyms: ['awareness'],
        antonyms: ['solipsism']
      }
    ],
    source: 'local'
  },
  melancholy: {
    word: 'melancholy',
    phonetic: '/ˈmɛlənkəli/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A feeling of pensive sadness, typically with no obvious cause.',
            example: 'An air of melancholy settled over the abandoned royal library.',
            synonyms: ['sadness', 'sorrow', 'despondency', 'gloom'],
            antonyms: ['cheerfulness', 'joy', 'jubilation']
          }
        ],
        synonyms: ['sadness', 'gloom'],
        antonyms: ['joy']
      }
    ],
    source: 'local'
  },
  enigmatic: {
    word: 'enigmatic',
    phonetic: '/ˌɛnɪɡˈmatɪk/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Difficult to interpret or understand; mysterious or puzzling.',
            example: 'He gave an enigmatic smile and vanished into the shadows.',
            synonyms: ['mysterious', 'cryptic', 'inscrutable', 'puzzling'],
            antonyms: ['straightforward', 'obvious', 'transparent']
          }
        ],
        synonyms: ['mysterious', 'cryptic'],
        antonyms: ['obvious']
      }
    ],
    source: 'local'
  },
  resplendent: {
    word: 'resplendent',
    phonetic: '/rɪˈsplɛnd(ə)nt/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Attractive and impressive through being richly colorful or sumptuous; dazzling.',
            example: 'The heavenly emperor stood resplendent in gold armor.',
            synonyms: ['dazzling', 'splendid', 'magnificent', 'brilliant'],
            antonyms: ['drab', 'dull', 'lackluster']
          }
        ],
        synonyms: ['dazzling', 'magnificent'],
        antonyms: ['drab']
      }
    ],
    source: 'local'
  },
  ominous: {
    word: 'ominous',
    phonetic: '/ˈɒmɪnəs/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Giving the worrying impression that something bad or sinister is going to happen; threateningly inauspicious.',
            example: 'An ominous crimson mist poured out of the dungeon gate.',
            synonyms: ['threatening', 'menacing', 'foreboding', 'sinister'],
            antonyms: ['promising', 'auspicious', 'encouraging']
          }
        ],
        synonyms: ['threatening', 'foreboding'],
        antonyms: ['promising']
      }
    ],
    source: 'local'
  },
  labyrinth: {
    word: 'labyrinth',
    phonetic: '/ˈlab(ə)rɪnθ/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A complicated irregular network of passages or paths in which it is difficult to find one’s way; a maze.',
            example: 'They navigated the subterranean labyrinth to reach the core vault.',
            synonyms: ['maze', 'warren', 'network', 'puzzle'],
            antonyms: ['straight path']
          }
        ],
        synonyms: ['maze'],
        antonyms: []
      }
    ],
    source: 'local'
  },
  tenacity: {
    word: 'tenacity',
    phonetic: '/tɪˈnasɪti/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The quality or fact of being able to grip something firmly; determination and persistence in the face of adversity.',
            example: 'His tenacity through hundreds of death loops allowed him to overcome the boss.',
            synonyms: ['persistence', 'determination', 'grit', 'perseverance'],
            antonyms: ['indecision', 'surrender', 'weakness']
          }
        ],
        synonyms: ['grit', 'perseverance'],
        antonyms: ['surrender']
      }
    ],
    source: 'local'
  },
  incandescent: {
    word: 'incandescent',
    phonetic: '/ˌɪnkænˈdɛsənt/',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Emitting light as a result of being heated; extremely bright and glowing.',
            example: 'The blade turned incandescent as dragonfire enveloped the steel.',
            synonyms: ['glowing', 'radiant', 'luminous', 'blazing'],
            antonyms: ['dim', 'dark', 'extinguished']
          }
        ],
        synonyms: ['glowing', 'radiant'],
        antonyms: ['dim']
      }
    ],
    source: 'local'
  },
  cultivation: {
    word: 'cultivation',
    phonetic: '/ˌkʌltɪˈveɪʃ(ə)n/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The Taoist spiritual and martial practice of gathering and refining Qi to attain immortality or supreme power.',
            example: 'After a century in secluded cultivation, he broke through the tribulation realm.',
            synonyms: ['meditation', 'asceticism', 'martial training'],
            antonyms: []
          }
        ],
        synonyms: ['ascension', 'training'],
        antonyms: []
      }
    ],
    loreContext: 'Core foundation of Xianxia & Xuanhuan fiction. Practitioners advance through defined stages like Qi Condensation, Golden Core, and Nascent Soul.',
    source: 'local'
  },
  murim: {
    word: 'murim',
    phonetic: '/muːˈrɪm/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The martial arts society and underworld in Korean literature, originating from the Chinese concept of Wulin.',
            example: 'He wandered through Murim as a nameless swordsman seeking justice.',
            synonyms: ['martial world', 'wulin', 'jianghu'],
            antonyms: []
          }
        ],
        synonyms: ['martial world'],
        antonyms: []
      }
    ],
    loreContext: 'Traditional setting for martial arts manhwa (e.g. Mount Hua Sect, Heavenly Demon), where justice is dictated by blade strength rather than imperial law.',
    source: 'local'
  },
  qi: {
    word: 'qi',
    phonetic: '/tʃiː/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The circulating life energy that inherent in all living things according to traditional Chinese philosophy and Eastern fiction.',
            example: 'He circulated true Qi through his meridians to extinguish the poison.',
            synonyms: ['life force', 'prana', 'spirit energy', 'mana'],
            antonyms: []
          }
        ],
        synonyms: ['vital energy'],
        antonyms: []
      }
    ],
    loreContext: 'Stored in the dantian and channeled through acupuncture points to unleash devastating martial sword aura.',
    source: 'local'
  },
  dantian: {
    word: 'dantian',
    phonetic: '/danˈtjɛn/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The focal energy reservoir located in the lower abdomen where refined internal energy is stored.',
            example: 'The strike ruptured his dantian, threatening to cripple his cultivation forever.',
            synonyms: ['energy sea', 'elixir field', 'mana core'],
            antonyms: []
          }
        ],
        synonyms: ['energy core'],
        antonyms: []
      }
    ],
    loreContext: 'The engine of every martial artist. Destroying an enemy dantian renders them an ordinary mortal without internal martial force.',
    source: 'local'
  },
  isekai: {
    word: 'isekai',
    phonetic: '/ˈiːseɪkaɪ/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A popular genre of speculative fiction where a protagonist is transported, summoned, or reincarnated into a parallel fantasy world.',
            example: 'Summoned to an unfamiliar kingdom, he began his isekai journey as an alchemist.',
            synonyms: ['otherworld', 'transmigration', 'portal fantasy'],
            antonyms: []
          }
        ],
        synonyms: ['portal fantasy'],
        antonyms: []
      }
    ],
    loreContext: 'One of modern fantasy’s most ubiquitous subgenres, often featuring video game UI screens, cheat skills, and monster dungeons.',
    source: 'local'
  },
  regressor: {
    word: 'regressor',
    phonetic: '/rɪˈɡrɛsər/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A character who retains memories of an apocalyptic future and has their consciousness sent back in time to their past self.',
            example: 'As a third-cycle regressor, he already anticipated every trap in the labyrinth.',
            synonyms: ['time traveler', 'returnee', 'reincarnator'],
            antonyms: []
          }
        ],
        synonyms: ['returnee'],
        antonyms: []
      }
    ],
    loreContext: 'Signature trope of top Korean manhwa (like Omniscient Reader, S-Classes That I Raised, Doom Breaker).',
    source: 'local'
  },
  transmigration: {
    word: 'transmigration',
    phonetic: '/ˌtrænzmʌɪˈɡreɪʃ(ə)n/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The passing of a soul at death into another body or an existing fictional character in a novel.',
            example: 'Upon opening her eyes, she realized her transmigration into the villainess of the romance novel.',
            synonyms: ['reincarnation', 'metempsychosis', 'soul transfer'],
            antonyms: []
          }
        ],
        synonyms: ['soul transmigration'],
        antonyms: []
      }
    ],
    loreContext: 'Differs from reincarnation as the protagonist typically inherits the social role, status, and tragic fate of a pre-written literary character.',
    source: 'local'
  },
  dao: {
    word: 'dao',
    phonetic: '/daʊ/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The absolute, underlying principle and natural order uniting the universe in Eastern philosophy.',
            example: 'Watching the waterfall, he gained sudden enlightenment into the Dao of Water.',
            synonyms: ['the Way', 'cosmic path', 'supreme principle'],
            antonyms: []
          }
        ],
        synonyms: ['cosmic order'],
        antonyms: []
      }
    ],
    loreContext: 'Cultivators strive to master Heavenly Daos (Sword Dao, Slaughter Dao, Space Dao) to ascend into godhood.',
    source: 'local'
  },
  constellation: {
    word: "constellation",
    phonetic: "/ˌkɒnstəˈleɪʃn/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "Transcendent god-like celestial beings who observe mortal scenarios as stream viewers and sponsor incarnations.",
            example: "A constellation that likes to change gender has sponsored you 100 coins.",
            synonyms: ["higher being", "star deity", "patron"],
            antonyms: []
          }
        ],
        synonyms: ["cosmic patron"],
        antonyms: []
      }
    ],
    loreContext: "Foundational concept from Omniscient Reader's Viewpoint (ORV) representing historical, mythical, and narrative deities watching scenarios from the Star Stream.",
    source: "local"
  },
  incarnation: {
    word: "incarnation",
    phonetic: "/ˌɪnkɑːˈneɪʃn/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A human or mortal chosen to act as the avatar or champion of a constellation in the apocalyptic scenarios.",
            example: "The incarnation Kim Dokja defied the will of the absolute throne.",
            synonyms: ["avatar", "champion", "mortal vessel"],
            antonyms: []
          }
        ],
        synonyms: ["champion"],
        antonyms: []
      }
    ],
    loreContext: "In scenario fiction, incarnations must survive deadly trials while gaining coin donations and stigmas from their sponsors.",
    source: "local"
  },
  "shadow monarch": {
    word: "shadow monarch",
    phonetic: "/ˈʃædəʊ ˈmɒnək/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The primordial sovereign of death and shadows, possessing the authority to extract spirits of fallen enemies into undying shadow soldiers.",
            example: "With the words 'Arise', the Shadow Monarch summoned an army from the fallen dragon's shadow.",
            synonyms: ["monarch of shadows", "lord of death", "ashborn"],
            antonyms: []
          }
        ],
        synonyms: ["shadow king"],
        antonyms: []
      }
    ],
    loreContext: "The supreme power mantle wielded by Sung Jin-woo in Solo Leveling, capable of commanding boundless legions of immortal shadow warriors.",
    source: "local"
  },
  "golden core": {
    word: "golden core",
    phonetic: "/ˈɡəʊldən kɔː/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A dense spiritual orb formed within a cultivator's dantian representing mastery over the Core Formation realm (Jindan).",
            example: "After refining his internal flame for seven days, a flawless golden core crystallized in his dantian.",
            synonyms: ["jindan", "spiritual core", "immortal seed"],
            antonyms: []
          }
        ],
        synonyms: ["jindan"],
        antonyms: []
      }
    ],
    loreContext: "Major milestone in Xianxia progression. Possessing a golden core grants thousands of years of lifespan and flight.",
    source: "local"
  },
  "nascent soul": {
    word: "nascent soul",
    phonetic: "/ˈneɪsnt səʊl/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A spiritual infant formed inside the dantian when the golden core shatters, allowing a cultivator to survive even if their physical body is destroyed.",
            example: "Though his vessel was struck down, his nascent soul escaped through the spatial rift.",
            synonyms: ["yuanying", "immortal soul", "spiritual double"],
            antonyms: []
          }
        ],
        synonyms: ["yuanying"],
        antonyms: []
      }
    ],
    loreContext: "The Yuanying realm in Chinese Xianxia. Gives the cultivator true soul immortality and telekinetic domain manipulation.",
    source: "local"
  },
  tribulation: {
    word: "tribulation",
    phonetic: "/ˌtrɪbjuˈleɪʃn/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "Violent celestial lightning strikes and heavenly trials sent by the Heavenly Dao to test a cultivator advancing to higher realms.",
            example: "He survived nine bolts of heavenly tribulation to forge his divine meridians.",
            synonyms: ["heavenly trial", "celestial test", "lightning tribulation"],
            antonyms: []
          }
        ],
        synonyms: ["heavenly trial"],
        antonyms: []
      }
    ],
    loreContext: "Heaven's check against mortals defying mortality. Failing a tribulation results in turning to ash.",
    source: "local"
  },
  hunter: {
    word: "hunter",
    phonetic: "/ˈhʌntər/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "An awakened human endowed with supernatural magical abilities or physical power who raids gates and dungeons.",
            example: "The S-rank hunter solo-cleared the red gate before the military arrived.",
            synonyms: ["awakened", "raider", "adventurer"],
            antonyms: []
          }
        ],
        synonyms: ["awakened"],
        antonyms: []
      }
    ],
    loreContext: "Pivotal profession in modern fantasy and Korean dungeon manhwa, categorized into ranks from E to S or National Level.",
    source: "local"
  },
  gate: {
    word: "gate",
    phonetic: "/ɡeɪt/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A dimensional portal linking human cities to extradimensional dungeons populated by monsters and magical beasts.",
            example: "An A-rank gate appeared above Gangnam, sparking an immediate guild mobilization.",
            synonyms: ["dungeon portal", "rift", "abyss portal"],
            antonyms: []
          }
        ],
        synonyms: ["rift"],
        antonyms: []
      }
    ],
    loreContext: "If a gate is left uncleared past its seven-day timer, a catastrophic Dungeon Break occurs, letting monsters invade reality.",
    source: "local"
  },
  "demonic cult": {
    word: "demonic cult",
    phonetic: "/dɪˈmɒnɪk kʌlt/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The fearsome unorthodox faction in Murim governed by the Heavenly Demon, practicing ruthless blood arts and strength supremacy.",
            example: "Ten thousand disciples knelt as the Heavenly Demon stepped onto the peak.",
            synonyms: ["unorthodox faction", "heavenly demon sect", "mojiao"],
            antonyms: ["orthodox alliance"]
          }
        ],
        synonyms: ["mojiao"],
        antonyms: ["orthodox alliance"]
      }
    ],
    loreContext: "Perennial rival of the Orthodox Murim factions (Shaolin, Wudang, Mount Hua). Focus of popular manhwa like Nano Machine and Legend of the Northern Blade.",
    source: "local"
  },
  "spatial ring": {
    word: "spatial ring",
    phonetic: "/ˈspeɪʃl rɪŋ/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "An enchanted ring containing an expanded pocket dimension for storing massive quantities of weapons, pills, and spirit stones weightlessly.",
            example: "He swept his spiritual sense across his spatial ring to retrieve the ancestral treasure sword.",
            synonyms: ["interspatial ring", "storage ring", "void ring"],
            antonyms: []
          }
        ],
        synonyms: ["storage ring"],
        antonyms: []
      }
    ],
    loreContext: "Universal convenience artifact in eastern fantasy and cultivation novels, preventing characters from carrying luggage.",
    source: "local"
  },
  chuunibyou: {
    word: "chuunibyou",
    phonetic: "/tʃuːniːbjoʊ/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "Japanese slang meaning middle-school second-year syndrome; delusions of having hidden dark magical powers or a cursed alter ego.",
            example: "He posed theatrically with his bandaged arm, muttering about his sealed black flame dragon.",
            synonyms: ["eighth-grader syndrome", "delusions of grandeur"],
            antonyms: []
          }
        ],
        synonyms: ["delusional"],
        antonyms: []
      }
    ],
    loreContext: "Classic anime/manga comedy trope, exemplified by characters like Cid Kagenou in The Eminence in Shadow.",
    source: "local"
  },
  tsundere: {
    word: "tsundere",
    phonetic: "/tsuːnˈdɛreɪ/",
    meanings: [
      {
        partOfSpeech: "noun / adjective",
        definitions: [
          {
            definition: "A character archetype who initially behaves harsh, cold, or combative toward another before gradually showing warmth and affection.",
            example: "She turned her face away with a red blush, insisting she only shared her potion because she had extras.",
            synonyms: ["prickly-sweet", "aloof-romantic"],
            antonyms: []
          }
        ],
        synonyms: ["aloof-warm"],
        antonyms: []
      }
    ],
    loreContext: "Ubiquitous personality archetype in light novels and manga, often marked by the phrase: It's not like I did it for you!",
    source: "local"
  },
  mana: {
    word: 'mana',
    phonetic: '/ˈmɑːnə/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'An ambient or internal supernatural magical energy used by sorcerers and hunters to cast spells and skills.',
            example: 'His mana reserves surged as the magical circle ignited beneath his boots.',
            synonyms: ['magic power', 'aether', 'mystical energy'],
            antonyms: []
          }
        ],
        synonyms: ['magic energy'],
        antonyms: []
      }
    ],
    loreContext: 'Standard RPG and hunter manhwa resource bar, graded from E-rank to SSS-rank output.',
    source: 'local'
  }
};

const CACHE_STORAGE_KEY = 'readverse_dictionary_cache_v1';
const CACHE_MAX_ITEMS = 150;

export function getOfflineDefinition(rawWord: string): DictionaryEntry | null {
  if (!rawWord) return null;
  const key = rawWord.trim().toLowerCase();
  return OFFLINE_DICTIONARY[key] || null;
}

export function getCachedDefinition(rawWord: string): DictionaryEntry | null {
  if (typeof window === 'undefined' || !rawWord) return null;
  const key = rawWord.trim().toLowerCase();

  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cache: Record<string, DictionaryEntry> = JSON.parse(raw);
    return cache[key] || null;
  } catch {
    return null;
  }
}

export function saveCachedDefinition(entry: DictionaryEntry): void {
  if (typeof window === 'undefined' || !entry?.word) return;
  const key = entry.word.trim().toLowerCase();

  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    const cache: Record<string, DictionaryEntry> = raw ? JSON.parse(raw) : {};

    // Put at top
    cache[key] = {
      ...entry,
      source: 'cache'
    };

    // Keep size under CACHE_MAX_ITEMS
    const keys = Object.keys(cache);
    if (keys.length > CACHE_MAX_ITEMS) {
      delete cache[keys[0]];
    }

    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
}
