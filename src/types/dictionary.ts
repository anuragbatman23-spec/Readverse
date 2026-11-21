export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export type DictionarySourceType = 'api' | 'local' | 'cache' | 'ai' | 'wiktionary' | 'datamuse' | 'wikipedia' | 'urban';

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: DictionaryMeaning[];
  source: DictionarySourceType;
  origin?: string;
  loreContext?: string;
}

export interface DictionarySourceResult {
  source: DictionarySourceType;
  label: string;
  entry: DictionaryEntry;
}

export interface DictionaryApiResponse {
  success: boolean;
  word?: string;
  data?: DictionaryEntry;
  sources?: DictionarySourceResult[];
  message?: string;
}
