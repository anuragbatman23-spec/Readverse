import { NextResponse } from 'next/server';
import { Book } from '@/types';
import * as cheerio from 'cheerio';
import { KNOWN_CLASSIC_COVERS } from '@/utils/imageOptimizer';

// In-memory cache for live searches (TTL: 10 minutes)
interface CacheEntry {
  timestamp: number;
  books: Book[];
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Helper to format Gutendex author name "Last, First" -> "First Last"
function formatAuthorName(rawName?: string): string {
  if (!rawName) return 'Unknown Author';
  if (rawName.includes(',')) {
    const parts = rawName.split(',');
    const lastName = parts[0].trim();
    const rest = parts.slice(1).join(',').trim();
    return `${rest} ${lastName}`.trim();
  }
  return rawName.trim();
}

// Clean up subjects/genres into concise tags
function formatSubjects(subjects?: string[]): string[] {
  if (!subjects || subjects.length === 0) return ['Classic', 'Literature'];
  const cleaned: string[] = [];
  for (const sub of subjects) {
    const simplified = sub
      .split('--')[0]
      .replace(/\(Fictitious character\)/gi, '')
      .replace(/stories|tales|novels|fiction/gi, '')
      .trim();
    if (simplified.length > 2 && !cleaned.includes(simplified) && cleaned.length < 3) {
      cleaned.push(simplified);
    }
  }
  if (cleaned.length === 0) return ['Classic', 'Literature'];
  return cleaned;
}

// Fetch live books from Gutendex API (Project Gutenberg catalog of 70,000+ titles)
async function fetchGutendexBooks(query: string): Promise<Book[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

  try {
    const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&languages=en`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ReadVerse-Reader/1.0 (Public Domain English Book Catalog)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    interface GutendexItem {
      id: number;
      title: string;
      authors?: { name: string }[];
      summaries?: string[];
      subjects?: string[];
      formats?: Record<string, string>;
      download_count?: number;
    }

    const books: Book[] = data.results
      .filter((item: GutendexItem) => item.id && item.title)
      .slice(0, 15)
      .map((item: GutendexItem) => {
        const id = `gutenberg-${item.id}`;
        const author = formatAuthorName(item.authors?.[0]?.name);
        const coverImage =
          (item.id && KNOWN_CLASSIC_COVERS[String(item.id)]) ||
          item.formats?.['image/jpeg'] ||
          `https://covers.openlibrary.org/b/id/12216503-L.jpg`;
        const description =
          item.summaries?.[0] ||
          `${item.title} by ${author}. A timeless public domain classic preserved in full text.`;
        const genre = formatSubjects(item.subjects);
        const downloads = item.download_count || 100;
        const rating = Math.min(4.98, Math.max(4.65, Number((4.7 + Math.log10(Math.max(10, downloads)) * 0.05).toFixed(2))));

        return {
          id,
          title: item.title,
          author,
          category: 'book' as const,
          coverImage,
          description,
          genre,
          rating,
          pointsPerChapter: 2.0,
          chapters: []
        };
      });

    return books;
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

// Fetch live books from Standard Ebooks (curated, modern-typography public domain editions)
async function fetchStandardEbooks(query: string): Promise<Book[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const url = `https://standardebooks.org/feeds/opds/all?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/atom+xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadVerse-Reader/1.0'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const books: Book[] = [];

    $('entry').each((_, el) => {
      const rawId = $(el).find('id').text().trim();
      const slug = rawId.replace('https://standardebooks.org/ebooks/', '').replace(/^\/+|\/+$/g, '');
      const title = $(el).find('title').text().trim();
      const author = $(el).find('author > name').first().text().trim() || 'Unknown Author';
      const coverImage =
        $(el).find('link[rel*="image"]').attr('href') ||
        `https://standardebooks.org/ebooks/${slug}/downloads/cover.jpg`;
      const summary =
        $(el).find('summary').text().trim() ||
        $(el).find('content').text().trim() ||
        `${title} by ${author}. Beautifully formatted typography edition from Standard Ebooks.`;

      const categories: string[] = [];
      $(el).find('category').each((_, cat) => {
        const term = $(cat).attr('term');
        if (term) {
          const simplified = term.split('--')[0].replace(/stories|fiction/gi, '').trim();
          if (simplified && !categories.includes(simplified)) categories.push(simplified);
        }
      });

      if (slug && title) {
        books.push({
          id: `se-${slug}`,
          title,
          author,
          category: 'book' as const,
          coverImage,
          description: summary.slice(0, 320),
          genre: categories.length > 0 ? categories.slice(0, 3) : ['Standard Ebooks', 'Classic'],
          rating: 4.96,
          pointsPerChapter: 2.0,
          chapters: []
        });
      }
    });

    return books.slice(0, 10);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

// Fallback search via Open Library in case Gutendex is under heavy load
async function fetchOpenLibraryGutenbergFallback(query: string): Promise<Book[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&limit=10`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ReadVerse-Reader/1.0'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    interface OpenLibraryDoc {
      title?: string;
      author_name?: string[];
      id_project_gutenberg?: string[];
      cover_i?: number;
      subject?: string[];
    }

    const books: Book[] = [];
    for (const doc of data.docs as OpenLibraryDoc[]) {
      const gbId = doc.id_project_gutenberg?.[0];
      if (!gbId || !doc.title) continue;

      const rawId = gbId.trim();
      const author = doc.author_name?.[0] || 'Unknown Author';
      const coverImage = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : KNOWN_CLASSIC_COVERS[rawId] || `https://covers.openlibrary.org/b/id/12216503-M.jpg`;

      books.push({
        id: `gutenberg-${rawId}`,
        title: doc.title,
        author,
        category: 'book' as const,
        coverImage,
        description: `${doc.title} by ${author}. Classic English literature available to read in full.`,
        genre: formatSubjects(doc.subject),
        rating: 4.88,
        pointsPerChapter: 2.0,
        chapters: []
      });
      if (books.length >= 10) break;
    }

    return books;
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

// Instant high-speed curated catalog with verified Gutenberg IDs for full text reading
const CURATED_CLASSIC_BOOKS = [
  {
    id: 'gutenberg-345',
    title: 'Dracula',
    author: 'Bram Stoker',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/12216503-L.jpg',
    description: 'The iconic gothic horror masterpiece following Count Dracula’s attempt to move from Transylvania to England.',
    genre: ['Horror', 'Gothic', 'Classic'],
    rating: 4.95,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-84',
    title: 'Frankenstein; or, The Modern Prometheus',
    author: 'Mary Wollstonecraft Shelley',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/12356249-L.jpg',
    description: 'Victor Frankenstein discovers the secret of life and constructs a sentient creature, facing the catastrophic consequences of his creation.',
    genre: ['Sci-Fi', 'Gothic', 'Classic'],
    rating: 4.9,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-1661',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/6717853-L.jpg',
    description: 'Twelve classic mystery investigations featuring the world’s most celebrated consulting detective, Sherlock Holmes, and Dr. Watson.',
    genre: ['Mystery', 'Detective', 'Classic'],
    rating: 4.92,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-1342',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/14348537-L.jpg',
    description: 'A witty romantic story of turbulent relationships in 19th-century England centered around Elizabeth Bennet and Mr. Darcy.',
    genre: ['Romance', 'Classic', 'Drama'],
    rating: 4.88,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-64317',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/10590366-L.jpg',
    description: 'The story of the fabulously wealthy Jay Gatsby and his new love for the beautiful Daisy Buchanan.',
    genre: ['Classic', 'Drama', 'American'],
    rating: 4.93,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-35',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/9009316-L.jpg',
    description: 'An English scientist invents a machine that propels him 800,000 years into the future to witness the split of human civilization.',
    genre: ['Sci-Fi', 'Adventure', 'Classic'],
    rating: 4.85,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-11',
    title: 'Alice’s Adventures in Wonderland',
    author: 'Lewis Carroll',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/10527843-L.jpg',
    description: 'A young girl falls through a rabbit hole into a subterranean fantasy world populated by peculiar, anthropomorphic creatures.',
    genre: ['Fantasy', 'Classic', 'Adventure'],
    rating: 4.86,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-2701',
    title: 'Moby Dick; or, The Whale',
    author: 'Herman Melville',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/10544254-L.jpg',
    description: 'The obsessive quest of Captain Ahab for revenge against Moby Dick, the giant white sperm whale.',
    genre: ['Adventure', 'Classic', 'Sea Story'],
    rating: 4.75,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-174',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/14314858-L.jpg',
    description: 'A handsome young man sells his soul for eternal youth while a hidden portrait ages and bears the sins of his hedonistic life.',
    genre: ['Philosophical', 'Gothic', 'Classic'],
    rating: 4.93,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-36',
    title: 'The War of the Worlds',
    author: 'H. G. Wells',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/36314-L.jpg',
    description: 'A terrifying invasion of Earth by technologically advanced Martian tripods armed with heat rays and poisonous black smoke.',
    genre: ['Sci-Fi', 'Classic', 'Thriller'],
    rating: 4.89,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-5200',
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/12820198-L.jpg',
    description: 'Gregor Samsa wakes up one morning to find himself mysteriously transformed into a monstrous insect.',
    genre: ['Absurdist', 'Classic', 'Psychological'],
    rating: 4.91,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-2554',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/9411873-L.jpg',
    description: 'A desperate former student in Saint Petersburg formulates a theory justifying the murder of an unscrupulous pawnbroker.',
    genre: ['Psychological', 'Philosophy', 'Classic'],
    rating: 4.94,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-1184',
    title: 'The Count of Monte Cristo',
    author: 'Alexandre Dumas',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/14566393-L.jpg',
    description: 'Falsely accused of treason, Edmond Dantès escapes an island fortress prison and seeks retribution against his betrayers.',
    genre: ['Adventure', 'Drama', 'Classic'],
    rating: 4.97,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-17405',
    title: 'The Art of War',
    author: 'Sun Tzu',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/4849549-L.jpg',
    description: 'The ancient Chinese military treatise attributed to Sun Tzu, composed of 13 chapters devoted to the strategic aspects of warfare.',
    genre: ['Philosophy', 'Strategy', 'Classic'],
    rating: 4.9,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-2680',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/13202688-L.jpg',
    description: 'The personal writings of Roman Emperor Marcus Aurelius recording his private notes on Stoic philosophy and duty.',
    genre: ['Philosophy', 'Stoicism', 'Classic'],
    rating: 4.92,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-1260',
    title: 'Jane Eyre: An Autobiography',
    author: 'Charlotte Brontë',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/8235363-L.jpg',
    description: 'The story of an orphaned young woman who overcomes adversity to become a governess at Thornfield Hall.',
    genre: ['Gothic', 'Romance', 'Classic'],
    rating: 4.87,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-98',
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/13301713-L.jpg',
    description: 'Set in London and Paris before and during the French Revolution, depicting the plight of the French peasantry and the Reign of Terror.',
    genre: ['Historical', 'Drama', 'Classic'],
    rating: 4.88,
    pointsPerChapter: 2.0
  },
  {
    id: 'gutenberg-43',
    title: 'The Strange Case of Dr. Jekyll and Mr. Hyde',
    author: 'Robert Louis Stevenson',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/295773-L.jpg',
    description: 'A London legal practitioner investigates strange occurrences between his old friend, Dr. Henry Jekyll, and the evil Edward Hyde.',
    genre: ['Horror', 'Mystery', 'Classic'],
    rating: 4.89,
    pointsPerChapter: 2.0
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase().trim() || '';

  // If no search query, instantly return curated classic books
  if (!query) {
    const formattedCurated: Book[] = CURATED_CLASSIC_BOOKS.map(b => ({
      ...b,
      category: 'book' as const,
      chapters: []
    }));
    return NextResponse.json(
      { books: formattedCurated },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  }

  // Check in-memory cache
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { books: cached.books, source: 'cache' },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  }

  // 1. Instant match from curated catalog
  const curatedMatches: Book[] = CURATED_CLASSIC_BOOKS
    .filter(
      b =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.genre.some(g => g.toLowerCase().includes(query))
    )
    .map(b => ({
      ...b,
      category: 'book' as const,
      chapters: []
    }));

  // 2. Fetch live books from Gutendex and Standard Ebooks in parallel
  const [liveGutendex, liveStandardEbooks] = await Promise.all([
    fetchGutendexBooks(query),
    fetchStandardEbooks(query)
  ]);

  let liveBooks = [...liveStandardEbooks, ...liveGutendex];

  // 3. If live sources had no results or timed out, fallback to Open Library Gutenberg search
  if (liveBooks.length === 0) {
    liveBooks = await fetchOpenLibraryGutenbergFallback(query);
  }

  // 4. Merge curated matches with live results, avoiding duplicates
  const seenIds = new Set<string>();
  const merged: Book[] = [];

  for (const b of curatedMatches) {
    seenIds.add(b.id);
    merged.push(b);
  }

  for (const b of liveBooks) {
    if (!seenIds.has(b.id)) {
      seenIds.add(b.id);
      merged.push(b);
    }
  }

  const finalBooks = merged.length > 0 ? merged : curatedMatches;

  // Save to cache
  if (finalBooks.length > 0) {
    searchCache.set(query, {
      timestamp: Date.now(),
      books: finalBooks
    });
  }

  return NextResponse.json({ books: finalBooks });
}
