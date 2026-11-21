'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { Book, Chapter } from '../../../types';
import { ALL_FAMOUS_BOOKS } from '../../../data/famousCatalog';
import { MOCK_BOOKS } from '../../../data/mockData';
import { BookOverviewPage } from '../../../components/library/BookOverviewPage';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const {
    activeBook,
    setActiveBook,
    books: contextBooks
  } = useApp();

  const rawId = typeof params?.id === 'string' ? params.id : '';
  const bookId = (() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  })();

  const loadedBookIdRef = useRef<string | null>(null);
  const activeBookRef = useRef(activeBook);
  activeBookRef.current = activeBook;
  const contextBooksRef = useRef(contextBooks);
  contextBooksRef.current = contextBooks;

  const [resolvedBook, setResolvedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find and resolve the book with guaranteed 0.5-second overview loading state (runs only once per book navigation)
  useEffect(() => {
    if (!bookId) return;

    // Prevent re-triggering loading animation if this book is already loaded
    if (loadedBookIdRef.current === bookId && resolvedBook) {
      return;
    }

    // Immediately enter loading state and clear old book when navigating between titles
    setResolvedBook(null);
    setIsLoading(true);

    let isCancelled = false;
    const startTime = Date.now();
    const activeTimers: NodeJS.Timeout[] = [];

    const finishLoading = (book: Book) => {
      if (isCancelled) return;
      loadedBookIdRef.current = book.id;
      setResolvedBook(book);
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 500 - elapsed);
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }, remainingDelay);
      activeTimers.push(timer);
    };

    // 1. Check localStorage cache (both decoded and raw keys)
    try {
      const cachedRaw =
        localStorage.getItem(`readverse_book_${bookId}`) ||
        localStorage.getItem(`readverse_book_${rawId}`);

      let cachedParsed: Book | null = null;
      if (cachedRaw) {
        cachedParsed = JSON.parse(cachedRaw);
      } else {
        // Search through localStorage in case the ID was saved with different encoding
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('readverse_book_')) {
            const keySuffix = key.replace('readverse_book_', '');
            if (
              keySuffix === bookId ||
              keySuffix === rawId ||
              keySuffix.toLowerCase() === bookId.toLowerCase() ||
              keySuffix.toLowerCase() === rawId.toLowerCase()
            ) {
              const val = localStorage.getItem(key);
              if (val) {
                cachedParsed = JSON.parse(val);
                break;
              }
            }
          }
        }
      }

      if (
        cachedParsed &&
        (cachedParsed.id === bookId ||
          cachedParsed.id === rawId ||
          cachedParsed.id.toLowerCase() === bookId.toLowerCase() ||
          cachedParsed.id.toLowerCase() === rawId.toLowerCase())
      ) {
        // Auto-heal stale placeholder cover for Solo Leveling
        if (
          cachedParsed.title?.toLowerCase().includes('solo leveling') &&
          (!cachedParsed.coverImage || cachedParsed.coverImage.includes('1578632767115-351597cf2477'))
        ) {
          cachedParsed.coverImage = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg';
          try {
            localStorage.setItem(`readverse_book_${bookId}`, JSON.stringify(cachedParsed));
          } catch {
            // ignore
          }
        }

        // Invalidate stale dummy fallbacks and cross-contaminated caches so fresh live chapters are resolved
        const isDummyCache =
          (cachedParsed.chapters?.length === 2 &&
            cachedParsed.chapters.some(
              (c: Chapter) =>
                c.title?.includes('Transmigration') ||
                c.title?.includes('The Awakening') ||
                c.title?.includes('Official English Release') ||
                c.id?.includes('wn-ch-') ||
                c.id?.includes('en-')
            )) ||
          cachedParsed.chapters?.some(
            (c: Chapter) =>
              c.content && c.content.some((url: string) => typeof url === 'string' && url.includes('unsplash.com'))
          ) ||
          (cachedParsed.title?.toLowerCase().includes('short comic') &&
            cachedParsed.chapters?.some((c: Chapter) => c.id?.includes('kingdom') || c.title?.toLowerCase().includes('kingdom')));

        if (!isDummyCache) {
          finishLoading(cachedParsed);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 2. Exact ID match in memory catalogs (ALL_FAMOUS_BOOKS, MOCK_BOOKS, contextBooks)
    const allCombined = [...ALL_FAMOUS_BOOKS, ...MOCK_BOOKS, ...contextBooksRef.current];
    const normalized = bookId.toLowerCase().trim();
    const rawNormalized = rawId.toLowerCase().trim();

    const exactMatch = allCombined.find(
      b =>
        b.id === bookId ||
        b.id === rawId ||
        b.id.toLowerCase() === normalized ||
        b.id.toLowerCase() === rawNormalized
    );

    if (exactMatch) {
      finishLoading(exactMatch);
      return;
    }

    // 3. Resolve via specialized API routes according to ID prefix
    const resolveFromApi = async () => {
      // A. Local Books / Light Novels / Archive.org Stream
      if (bookId.startsWith('local-') || rawId.startsWith('local-') || bookId.startsWith('archive-ln-') || rawId.startsWith('archive-ln-')) {
        try {
          const localRes = await fetch(`/api/books/local/read?bookId=${encodeURIComponent(bookId)}`);
          if (localRes.ok) {
            const data = await localRes.json();
            if (!isCancelled && data?.book) {
              finishLoading(data.book);
              return;
            }
          }
        } catch {
          // ignore
        }
      }

      const matchMeta: Book | null = (activeBookRef.current?.id === bookId || activeBookRef.current?.id === rawId ? activeBookRef.current : null);

      // B. Manga & Manhwa (WeebCentral, MangaKatana, MangaDex UUID, Companion Manga/Manhwa, Slugs)
      const isMangaDexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
      const isCompanionMangaOrManhwa = bookId.startsWith('companion-') && (/-m\d+/.test(bookId) || /-mg\d+/.test(bookId));
      const isExplicitNonComic =
        bookId.startsWith('ln-') ||
        bookId.startsWith('wn-') ||
        bookId.startsWith('local-') ||
        bookId.startsWith('archive-ln-') ||
        bookId.startsWith('gutenberg-') ||
        bookId.startsWith('se-') ||
        /^\d+$/.test(bookId) ||
        matchMeta?.category === 'webnovel' ||
        matchMeta?.category === 'lightnovel' ||
        matchMeta?.category === 'book';

      const isLikelyComic =
        !isExplicitNonComic &&
        (bookId.startsWith('wc-') ||
        bookId.startsWith('mk-') ||
        bookId.startsWith('sl-') ||
        bookId.startsWith('tg-') ||
        bookId.startsWith('mb-') ||
        bookId.startsWith('fc-') ||
        bookId.startsWith('tcb-') ||
        bookId.startsWith('wt-') ||
        isMangaDexUuid ||
        bookId.endsWith('-manga') ||
        bookId.endsWith('-manhwa') ||
        isCompanionMangaOrManhwa ||
        matchMeta?.category === 'manga' ||
        matchMeta?.category === 'manhwa' ||
        (/secret-class|silent-war|boarding-diary|circles|sweet-guy|bad-thinking|stepmother|solo-leveling|solo-sovereign|tower-of-god/i.test(bookId) && !matchMeta));

      if (isLikelyComic) {
        try {
          const mangaRes = await fetch(`/api/manga/chapters?mangaId=${encodeURIComponent(bookId)}`);
          if (mangaRes.ok) {
            const data = await mangaRes.json();
            if (!isCancelled && data?.chapters && data.chapters.length > 0) {
              const titleFromSlug = (data.title || bookId.replace(/^wc-|^mk-|-manga|-manhwa|^companion-[a-z]+-/g, ''))
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());

              const isManhwa =
                data.isManhwa === true ||
                data.category === 'manhwa' ||
                bookId.includes('manhwa') ||
                (bookId.startsWith('companion-') && /-m\d+/.test(bookId)) ||
                /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|solo leveling|lookism|tower of god|eleceed|wind breaker|nano machine|touch to unlock|jinx|bj alex|painter of the night|pearl boy|mercenary enrollment|villain to kill/i.test(titleFromSlug);

              const mangaBook: Book = {
                id: bookId,
                title: data.title || titleFromSlug || (isManhwa ? 'ReadVerse Manhwa' : 'ReadVerse Manga'),
                author: data.author || (isManhwa ? 'Manhwa Studio' : 'Manga Studio'),
                category: isManhwa ? 'manhwa' : 'manga',
                coverImage: data.coverImage || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
                description: data.description || 'Full serialized edition available on ReadVerse.',
                genre: data.genre || (isManhwa ? ['Manhwa', 'Webtoon'] : ['Manga', 'Action']),
                rating: 4.9,
                pointsPerChapter: isManhwa ? 1.5 : 1.0,
                chapters: data.chapters
              };
              try {
                localStorage.setItem(`readverse_book_${bookId}`, JSON.stringify(mangaBook));
              } catch {
                // ignore
              }
              finishLoading(mangaBook);
              return;
            }
          }
        } catch {
          // ignore
        }
      }

      // C. Classic Literature (Gutenberg / Standard Ebooks)
      if (bookId.startsWith('gutenberg-') || bookId.startsWith('se-') || /^\d+$/.test(bookId) || matchMeta?.category === 'book' || (bookId.startsWith('companion-') && /-b\d+/.test(bookId))) {
        try {
          const queryTitle = matchMeta?.title || '';
          const bookRes = await fetch(`/api/books/read?bookId=${encodeURIComponent(bookId)}&title=${encodeURIComponent(queryTitle)}`);
          if (bookRes.ok) {
            const data = await bookRes.json();
            if (!isCancelled && data?.chapters && data.chapters.length > 0) {
              const titleFromSlug = (data.title || bookId.replace(/^gutenberg-|^se-/, ''))
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());

              const classicBook: Book = {
                id: bookId,
                title: titleFromSlug || 'Classic Book',
                author: data.author || 'Classic Author',
                category: 'book',
                coverImage: data.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
                description: data.description || 'Complete classic literary edition.',
                genre: ['Classic', 'Literature'],
                rating: 4.8,
                pointsPerChapter: 2.0,
                chapters: data.chapters
              };
              finishLoading(classicBook);
              return;
            }
          }
        } catch {
          // ignore
        }
      }

      // D. Webnovels & Light Novels
      try {
        const wnRes = await fetch(`/api/webnovels/read?novelId=${encodeURIComponent(bookId)}`);
        if (wnRes.ok) {
          const data = await wnRes.json();
          if (!isCancelled && data?.book) {
            finishLoading(data.book);
            return;
          }
        }
      } catch {
        // ignore
      }

      // 4. Title match fallback in memory catalogs (only after exact ID and source checks)
      const normQuery = bookId.toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9]/g, '');
      const titleMatch = allCombined.find(b => {
        const normB = b.title.toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9]/g, '');
        return normB === normQuery;
      });

      if (!isCancelled && titleMatch) {
        finishLoading(titleMatch);
        return;
      }

      // 5. Final fallback book object
      if (!isCancelled) {
        const titleFromSlug = bookId
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());

        const fallback: Book = {
          id: bookId,
          title: titleFromSlug || 'ReadVerse Book',
          author: 'Author',
          category: 'lightnovel',
          coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg',
          description: 'Reading session on ReadVerse.',
          genre: ['Light Novel', 'Fantasy'],
          rating: 8.5,
          pointsPerChapter: 2.0,
          chapters: []
        };
        finishLoading(fallback);
      }
    };

    resolveFromApi();

    return () => {
      isCancelled = true;
      activeTimers.forEach(clearTimeout);
    };
  }, [bookId, rawId]);

  if (isLoading || !resolvedBook) {
    const previewBook =
      (activeBook && (activeBook.id === bookId || activeBook.id === rawId) ? activeBook : null) ||
      resolvedBook;

    return (
      <div className="min-h-screen bg-[#090b11] text-zinc-100 relative overflow-hidden flex flex-col font-sans select-none">
        {/* Ambient background glow matching overview aesthetic */}
        <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none bg-orange-500/10" />
        <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full blur-[160px] pointer-events-none bg-amber-500/5" />

        <div className="relative z-10 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 space-y-8">
          {/* Top Breadcrumb Nav Placeholder */}
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div className="h-4 w-44 rounded-md bg-white/10 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-28 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            </div>
          </div>

          {/* Hero Section Skeleton */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Poster Cover Skeleton with Cover Loading Indicator */}
            <div className="w-52 sm:w-60 md:w-64 lg:w-72 shrink-0 mx-auto lg:mx-0">
              <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/15 bg-zinc-900 flex flex-col items-center justify-center">
                {/* Shimmer wave */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />

                {/* Badge top-left */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="w-16 h-5 rounded-md bg-white/10 border border-white/10" />
                </div>

                {previewBook?.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewBook.coverImage}
                    alt={previewBook.title}
                    className="w-full h-full object-cover opacity-25 filter blur-sm"
                  />
                ) : null}

                {/* Center Loading Indicator on Cover */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                    <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 tracking-wider uppercase">Loading cover...</span>
                  <span className="text-[10px] text-zinc-500 font-medium">Resolving Artwork & Mirror</span>
                </div>
              </div>
            </div>

            {/* Metadata & Actions Skeleton */}
            <div className="w-full flex-1 space-y-5">
              {/* Badges row */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-6 rounded-md bg-orange-500/20 border border-orange-500/30 animate-pulse" />
                <div className="w-24 h-6 rounded-md bg-white/10 border border-white/10 animate-pulse" />
              </div>

              {/* Title bars */}
              <div className="space-y-2">
                {previewBook ? (
                  <h1 className="text-3xl sm:text-4xl font-black text-white/70 tracking-tight leading-tight">
                    {previewBook.title}
                  </h1>
                ) : (
                  <div className="h-10 sm:h-12 w-3/4 rounded-xl bg-white/10 animate-pulse" />
                )}
                <div className="h-5 w-48 rounded-lg bg-white/5 animate-pulse" />
              </div>

              {/* Stat badges row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="w-20 h-7 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
                <div className="w-24 h-7 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
                <div className="w-28 h-7 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
              </div>

              {/* Synopsis paragraph lines */}
              <div className="space-y-2.5 pt-2 max-w-2xl">
                <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-11/12 rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-white/5 animate-pulse" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <div className="h-12 w-44 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center gap-2 animate-pulse">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-orange-300">Loading Chapters...</span>
                </div>
                <div className="h-12 w-36 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Chapters Section Skeleton */}
          <div className="pt-6 border-t border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-7 w-36 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-7 w-24 rounded-lg bg-white/5 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-zinc-900/60 border border-white/5 p-4 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded bg-white/10" />
                    <div className="h-3 w-16 rounded bg-white/5" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChaptersLoaded = (loadedChapters: import('../../../types').Chapter[]) => {
    setResolvedBook(prev => {
      if (!prev) return null;
      const updated = { ...prev, chapters: loadedChapters };
      try {
        localStorage.setItem(`readverse_book_${updated.id}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Render the full standalone Book Overview Page keyed by book id so state completely resets
  return (
    <BookOverviewPage
      key={resolvedBook.id}
      book={resolvedBook}
      allBooks={contextBooks.length > 0 ? contextBooks : ALL_FAMOUS_BOOKS}
      onChaptersLoaded={handleChaptersLoaded}
      onBack={() => {
        router.push('/');
      }}
      onStartReading={(selectedBook, chapterIdx = 0) => {
        try {
          localStorage.setItem(`readverse_book_${selectedBook.id}`, JSON.stringify(selectedBook));
        } catch {
          // ignore
        }
        setActiveBook(selectedBook, chapterIdx);
        router.push(`/read/${encodeURIComponent(selectedBook.id)}?chapter=${chapterIdx}`);
      }}
    />
  );
}
