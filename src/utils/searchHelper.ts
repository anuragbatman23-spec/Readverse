const KNOWN_TITLE_ALIASES: Record<string, string[]> = {
  'koibito': ['Fixed Damage', 'Kotei Damage', 'My Lover Was Stolen'],
  'kotei damage': ['Fixed Damage', 'My Lover Was Stolen'],
  'fukushuu wo hajimeyou': ['Fixed Damage', 'Kotei Damage'],
  'gimai seikatsu': ['Days with My Stepsister'],
  'roshidere': ['Alya Sometimes Hides Her Feelings in Russian'],
  'kage no jitsuryokusha': ['The Eminence in Shadow'],
  'kusuriya no hitorigoto': ['The Apothecary Diaries'],
  'sousou no frieren': ['Frieren: Beyond Journey\'s End'],
  'mushoku tensei': ['Jobless Reincarnation'],
  'danmachi': ['Is It Wrong to Try to Pick Up Girls in a Dungeon?'],
  'classroom of the elite': ['Youkoso Jitsuryoku'],
  'youkoso jitsuryoku': ['Classroom of the Elite']
};

export function extractSmartSearchQueries(title: string): string[] {
  if (!title) return [];
  const queries: string[] = [title];

  // 1. Quoted terms (ASCII quotes, curly quotes, Japanese brackets)
  const quoteRegex = /["“'‘【\[]([^"”'’】\]]+)["”'’】\]]/g;
  let match: RegExpExecArray | null;
  while ((match = quoteRegex.exec(title)) !== null) {
    const val = match[1]?.trim();
    if (val && val.length >= 3) {
      queries.push(val);
    }
  }

  // 2. Substrings split by punctuation
  const clauses = title
    .split(/[,:;.!?\-\u2014]/)
    .map(s => s.trim())
    .filter(s => s.length >= 4 && s.length < 50);
  for (let i = 0; i < clauses.length; i++) {
    queries.push(clauses[i]);
  }

  // 3. Known title aliases
  const titleLower = title.toLowerCase();
  for (const [key, aliases] of Object.entries(KNOWN_TITLE_ALIASES)) {
    if (titleLower.includes(key)) {
      for (let i = 0; i < aliases.length; i++) {
        queries.push(aliases[i]);
      }
    }
  }

  // 4. Clean alphanumeric version
  const clean = title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean && clean !== title && clean.length < 60) {
    queries.push(clean);
  }

  // 5. Version without leading articles (A, An, The)
  const noArticle = title.replace(/^(A|An|The)\s+/i, '').trim();
  if (noArticle && noArticle !== title) {
    queries.push(noArticle);
  }

  return Array.from(new Set(queries.filter(Boolean)));
}
