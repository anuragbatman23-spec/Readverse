import { NextRequest, NextResponse } from 'next/server';
import { 
  DictionaryEntry, 
  DictionaryMeaning, 
  DictionarySourceResult, 
  DictionaryApiResponse 
} from '@/types/dictionary';
import { getOfflineDefinition } from '@/utils/offlineDictionary';

export const dynamic = 'force-dynamic';

function cleanHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/\[\/?(i|b|u|url)\]/gi, '')
    .replace(/\[|\]/g, '')
    .replace(/\r\n|\r/g, '\n')
    .trim();
}

// 1. Source: Free Dictionary API (Lexical & Audio)
async function fetchFromFreeDict(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ReadVerse-Reader/1.0 (contact@readverse.app)'
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];

    let audioUrl: string | undefined = undefined;
    let phoneticText: string | undefined = item.phonetic;

    if (item.phonetics && Array.isArray(item.phonetics)) {
      const validAudio = item.phonetics.find(
        (p: { audio?: string }) => p.audio && (p.audio.endsWith('.mp3') || p.audio.includes('http'))
      );
      if (validAudio?.audio) {
        audioUrl = validAudio.audio.startsWith('//') ? `https:${validAudio.audio}` : validAudio.audio;
      }
      if (!phoneticText) {
        const found = item.phonetics.find((p: { text?: string }) => !!p.text);
        if (found?.text) phoneticText = found.text;
      }
    }

    const meanings: DictionaryMeaning[] = (item.meanings || []).map((m: {
      partOfSpeech?: string;
      definitions?: Array<{ definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] }>;
      synonyms?: string[];
      antonyms?: string[];
    }) => ({
      partOfSpeech: m.partOfSpeech || 'definition',
      definitions: (m.definitions || []).map(d => ({
        definition: d.definition || '',
        example: d.example || undefined,
        synonyms: Array.isArray(d.synonyms) ? d.synonyms : [],
        antonyms: Array.isArray(d.antonyms) ? d.antonyms : []
      })),
      synonyms: Array.isArray(m.synonyms) ? m.synonyms : [],
      antonyms: Array.isArray(m.antonyms) ? m.antonyms : []
    }));

    if (meanings.length === 0) return null;

    return {
      word: item.word || word,
      phonetic: phoneticText,
      audioUrl,
      meanings,
      source: 'api',
      origin: item.origin
    };
  } catch {
    return null;
  }
}

// 2. Source: Wiktionary API (Wikimedia REST API)
async function fetchFromWiktionary(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ReadVerse-Reader/1.0 (contact@readverse.app)'
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    const json = await res.json();
    const sections = json.en || [];
    if (!Array.isArray(sections) || sections.length === 0) return null;

    const meanings: DictionaryMeaning[] = [];
    for (const section of sections) {
      const pos = section.partOfSpeech ? section.partOfSpeech.toLowerCase() : 'definition';
      const defs = (section.definitions || [])
        .map((d: { definition?: string; examples?: string[] }) => {
          const rawDef = cleanHtml(d.definition || '');
          const example = d.examples && d.examples.length > 0 ? cleanHtml(d.examples[0]) : undefined;
          return {
            definition: rawDef,
            example,
            synonyms: [],
            antonyms: []
          };
        })
        .filter((d: { definition: string }) => d.definition.length > 2);

      if (defs.length > 0) {
        meanings.push({
          partOfSpeech: pos,
          definitions: defs,
          synonyms: [],
          antonyms: []
        });
      }
    }

    if (meanings.length === 0) return null;

    return {
      word,
      meanings,
      source: 'wiktionary'
    };
  } catch {
    return null;
  }
}

// 3. Source: Wikipedia Knowledge Base (Entities, Lore & Terms)
async function fetchFromWikipedia(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ReadVerse-Reader/1.0 (contact@readverse.app)'
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.extract || json.type === 'disambiguation') return null;

    return {
      word: json.title || word,
      meanings: [
        {
          partOfSpeech: json.description ? json.description.toLowerCase() : 'encyclopedia',
          definitions: [
            {
              definition: json.extract,
              synonyms: [],
              antonyms: []
            }
          ],
          synonyms: [],
          antonyms: []
        }
      ],
      source: 'wikipedia'
    };
  } catch {
    return null;
  }
}

// 4. Source: Datamuse Lexical API
async function fetchFromDatamuse(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dpf&max=1`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || !data[0].defs) return null;

    const item = data[0];
    const rawDefs: string[] = item.defs || [];
    const grouped: Record<string, string[]> = {};

    const posMap: Record<string, string> = {
      n: 'noun',
      v: 'verb',
      adj: 'adjective',
      adv: 'adverb',
      u: 'definition'
    };

    for (const defStr of rawDefs) {
      const parts = defStr.split('\t');
      const tag = parts[0] || 'u';
      const def = (parts[1] || '').trim();
      const pos = posMap[tag] || 'definition';
      if (!grouped[pos]) grouped[pos] = [];
      if (def) grouped[pos].push(def);
    }

    const meanings: DictionaryMeaning[] = Object.entries(grouped).map(([pos, defs]) => ({
      partOfSpeech: pos,
      definitions: defs.map(d => ({ definition: d, synonyms: [], antonyms: [] })),
      synonyms: [],
      antonyms: []
    }));

    if (meanings.length === 0) return null;

    return {
      word: item.word || word,
      meanings,
      source: 'datamuse'
    };
  } catch {
    return null;
  }
}

// 5. Source: Urban Dictionary (Slang & Webnovel Community Slang)
async function fetchFromUrban(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const json = await res.json();
    const list = json.list || [];
    if (!Array.isArray(list) || list.length === 0) return null;

    const best = list.find((item: { word: string }) => item.word.toLowerCase() === word.toLowerCase()) || list[0];
    const cleanDef = cleanHtml(best.definition || '');
    if (!cleanDef || cleanDef.length < 5) return null;

    return {
      word: best.word || word,
      meanings: [
        {
          partOfSpeech: 'slang / community',
          definitions: [
            {
              definition: cleanDef,
              example: best.example ? cleanHtml(best.example) : undefined,
              synonyms: [],
              antonyms: []
            }
          ],
          synonyms: [],
          antonyms: []
        }
      ],
      source: 'urban'
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word')?.trim();

  if (!word) {
    return NextResponse.json(
      { success: false, message: 'Word query parameter is required' },
      { status: 400 }
    );
  }

  // 1. Check local offline database for curated matches
  const localMatch = getOfflineDefinition(word);

  // 2. Query all available sources concurrently in parallel
  const [freeDictRes, wiktionaryRes, wikipediaRes, datamuseRes, urbanRes] = await Promise.allSettled([
    fetchFromFreeDict(word),
    fetchFromWiktionary(word),
    fetchFromWikipedia(word),
    fetchFromDatamuse(word),
    fetchFromUrban(word)
  ]);

  const sources: DictionarySourceResult[] = [];

  // Local Lore / Curated Database
  if (localMatch && localMatch.meanings.length > 0) {
    sources.push({
      source: 'local',
      label: 'ReadVerse Lore',
      entry: localMatch
    });
  }

  // Free Dictionary (Oxford / Lexicon)
  if (freeDictRes.status === 'fulfilled' && freeDictRes.value) {
    const entry = freeDictRes.value;
    if (localMatch?.loreContext) entry.loreContext = localMatch.loreContext;
    sources.push({
      source: 'api',
      label: 'Dictionary',
      entry
    });
  }

  // Wiktionary
  if (wiktionaryRes.status === 'fulfilled' && wiktionaryRes.value) {
    const entry = wiktionaryRes.value;
    if (localMatch?.loreContext) entry.loreContext = localMatch.loreContext;
    sources.push({
      source: 'wiktionary',
      label: 'Wiktionary',
      entry
    });
  }

  // Wikipedia
  if (wikipediaRes.status === 'fulfilled' && wikipediaRes.value) {
    const entry = wikipediaRes.value;
    if (localMatch?.loreContext) entry.loreContext = localMatch.loreContext;
    sources.push({
      source: 'wikipedia',
      label: 'Wikipedia',
      entry
    });
  }

  // Datamuse
  if (datamuseRes.status === 'fulfilled' && datamuseRes.value) {
    const entry = datamuseRes.value;
    if (localMatch?.loreContext) entry.loreContext = localMatch.loreContext;
    sources.push({
      source: 'datamuse',
      label: 'Datamuse',
      entry
    });
  }

  // Urban Dictionary
  if (urbanRes.status === 'fulfilled' && urbanRes.value) {
    const entry = urbanRes.value;
    if (localMatch?.loreContext) entry.loreContext = localMatch.loreContext;
    sources.push({
      source: 'urban',
      label: 'Urban',
      entry
    });
  }

  if (sources.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: `No dictionary definitions found for "${word}".`
      },
      { status: 404 }
    );
  }

  // Pick best primary entry as default:
  // Prefer local if available, else api/wiktionary/wikipedia
  const defaultEntry = sources[0].entry;

  const responsePayload: DictionaryApiResponse = {
    success: true,
    word,
    data: defaultEntry,
    sources
  };

  return NextResponse.json(responsePayload);
}
