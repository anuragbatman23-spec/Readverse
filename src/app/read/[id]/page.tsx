'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '../../../context/AppContext';
import { Book, Chapter, ContentCategory } from '../../../types';
import { ALL_FAMOUS_BOOKS } from '../../../data/famousCatalog';
import { MOCK_BOOKS } from '../../../data/mockData';
import { ManhwaReader } from '../../../components/readers/ManhwaReader';
import { MangaReader } from '../../../components/readers/MangaReader';
import { NovelReader } from '../../../components/readers/NovelReader';
import { CreatePostModal } from '../../../components/social/CreatePostModal';
import { Loader2, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

function ReaderContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    activeBook,
    activeChapterIndex,
    setActiveBook,
    setActiveChapterIndex,
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

  // Chapter index from query param or fallback
  const chapterParam = searchParams.get('chapter');
  const initialChapterIdx = useMemo(() => {
    if (chapterParam !== null) {
      const parsed = parseInt(chapterParam, 10);
      return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    }
    return activeChapterIndex >= 0 ? activeChapterIndex : 0;
  }, [chapterParam, activeChapterIndex]);

  const initialChapterIdxRef = useRef(initialChapterIdx);
  initialChapterIdxRef.current = initialChapterIdx;

  const [resolvedBook, setResolvedBook] = useState<Book | null>(() => {
    if (activeBook && (activeBook.id === bookId || activeBook.id === rawId)) {
      return activeBook;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // State for sharing quotes or panels directly from readers into social feed
  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    quoteText?: string;
    mediaUrl?: string;
    bookTitle?: string;
    category?: ContentCategory;
    chapterNum?: number;
  }>({
    isOpen: false
  });

  const { data: session } = useSession();

  // Sync to Recently Read (localStorage + Google account database)
  const syncRecentlyRead = useCallback((book: Book, chapterIdx: number) => {
    try {
      const localKey = 'readverse_recently_read';
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const item = {
        bookId: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        coverImage: book.coverImage,
        chapterIndex: chapterIdx,
        lastReadAt: new Date().toISOString(),
        rating: book.rating
      };
      const filtered = existing.filter((b: { bookId: string }) => b.bookId !== book.id);
      localStorage.setItem(localKey, JSON.stringify([item, ...filtered].slice(0, 30)));
    } catch (e) {
      console.warn('Failed saving to localStorage recently read:', e);
    }

    if (session?.user?.email) {
      fetch('/api/user/recently-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session.user.email,
          item: {
            bookId: book.id,
            title: book.title,
            author: book.author,
            category: book.category,
            coverImage: book.coverImage,
            chapterIndex: chapterIdx,
            rating: book.rating,
            genre: Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre || undefined),
            totalChapters: book.chapters?.length || 0,
            isFinale: Boolean(book.chapters && book.chapters.length > 0 && chapterIdx >= book.chapters.length - 1)
          }
        })
      }).catch(err => console.warn('Failed syncing recently read to Google account:', err));
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (resolvedBook) {
      syncRecentlyRead(resolvedBook, activeChapterIndex);
    }
  }, [resolvedBook, activeChapterIndex, syncRecentlyRead]);

  // Resolve book if not already loaded in context with guaranteed 0.5-second loading state (runs only once per book navigation)
  useEffect(() => {
    if (!bookId) return;

    // Prevent re-triggering loading animation if this book is already loaded
    if (loadedBookIdRef.current === bookId && resolvedBook) {
      return;
    }

    // Immediately reset book when ID changes and enter 0.5-second loading state
    setResolvedBook(prev => (prev && (prev.id === bookId || prev.id === rawId) ? prev : null));
    setIsLoading(true);

    let isCancelled = false;
    const startTime = Date.now();
    const activeTimers: NodeJS.Timeout[] = [];

    const finishLoading = (book: Book) => {
      if (isCancelled) return;
      loadedBookIdRef.current = book.id;
      setResolvedBook(book);
      setActiveBook(book, initialChapterIdxRef.current);
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 500 - elapsed);
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }, remainingDelay);
      activeTimers.push(timer);
    };

    // 1. If activeBook already matches by exact ID, use it with 2-second delay
    const currentActive = activeBookRef.current;
    if (currentActive && (currentActive.id === bookId || currentActive.id === rawId)) {
      finishLoading(currentActive);
      return;
    }

    // 2. Check localStorage cache
    try {
      const cachedRaw =
        localStorage.getItem(`readverse_book_${bookId}`) ||
        localStorage.getItem(`readverse_book_${rawId}`);

      let cachedParsed: Book | null = null;
      if (cachedRaw) {
        cachedParsed = JSON.parse(cachedRaw);
      } else {
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
        if (
          cachedParsed.title?.toLowerCase().includes('solo leveling') &&
          (!cachedParsed.coverImage || cachedParsed.coverImage.includes('1578632767115-351597cf2477'))
        ) {
          cachedParsed.coverImage = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg';
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

    // 3. Search memory catalogs for EXACT ID match first
    const normalized = bookId.toLowerCase().trim();
    const rawNormalized = rawId.toLowerCase().trim();
    const allCombined = [...ALL_FAMOUS_BOOKS, ...MOCK_BOOKS, ...contextBooksRef.current];

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

    const matchMeta: Book | null = (currentActive?.id === bookId || currentActive?.id === rawId ? currentActive : null);

    // 4. Resolve via API according to ID prefix
    const resolveFromApi = async () => {
      // A. Local Books / Light Novels
      if (bookId.startsWith('local-') || rawId.startsWith('local-')) {
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

      // B. Manga & Manhwa (WeebCentral, MangaKatana, MangaDex UUID, Companion Manga/Manhwa, Slugs)
      const isMangaDexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
      const isCompanionMangaOrManhwa = bookId.startsWith('companion-') && (/-m\d+/.test(bookId) || /-mg\d+/.test(bookId));
      const isExplicitNonComic =
        bookId.startsWith('ln-') ||
        bookId.startsWith('wn-') ||
        bookId.startsWith('local-') ||
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
          const queryTitle = matchMeta?.title || bookId;
          const mangaRes = await fetch(`/api/manga/chapters?mangaId=${encodeURIComponent(bookId)}&title=${encodeURIComponent(queryTitle)}`);
          if (mangaRes.ok) {
            const data = await mangaRes.json();
            if (!isCancelled && data?.chapters && data.chapters.length > 0) {
              const titleFromSlug = (data.title || matchMeta?.title || bookId.replace(/^wc-|^mk-|-manga|-manhwa|^companion-[a-z]+-/g, ''))
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());

              const isManhwa =
                data.isManhwa === true ||
                data.category === 'manhwa' ||
                matchMeta?.category === 'manhwa' ||
                bookId.includes('manhwa') ||
                (bookId.startsWith('companion-') && /-m\d+/.test(bookId)) ||
                /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|solo leveling|lookism|tower of god|eleceed|wind breaker|nano machine|touch to unlock|jinx|bj alex|painter of the night|pearl boy|mercenary enrollment|villain to kill/i.test(titleFromSlug);

              const mangaBook: Book = {
                id: bookId,
                title: matchMeta?.title || titleFromSlug || (isManhwa ? 'ReadVerse Manhwa' : 'ReadVerse Manga'),
                author: matchMeta?.author || data.author || (isManhwa ? 'Manhwa Studio' : 'Manga Studio'),
                category: isManhwa ? 'manhwa' : 'manga',
                coverImage: matchMeta?.coverImage || data.coverImage || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
                description: matchMeta?.description || data.description || 'Full serialized edition available on ReadVerse.',
                genre: matchMeta?.genre || data.genre || (isManhwa ? ['Manhwa', 'Webtoon'] : ['Manga', 'Action']),
                rating: matchMeta?.rating || 4.9,
                pointsPerChapter: matchMeta?.pointsPerChapter || (isManhwa ? 1.5 : 1.0),
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

      // C. Classic Literature
      if (bookId.startsWith('gutenberg-') || bookId.startsWith('se-') || /^\d+$/.test(bookId)) {
        try {
          const bookRes = await fetch(`/api/books/read?bookId=${encodeURIComponent(bookId)}`);
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

      // E. Title slug fallback
      const normQuery = bookId.toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9]/g, '');
      const titleMatch = allCombined.find(b => {
        const normB = b.title.toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9]/g, '');
        return normB === normQuery;
      });

      if (!isCancelled && titleMatch) {
        finishLoading(titleMatch);
        return;
      }

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
          description: 'Book reading session on ReadVerse.',
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

  // Sync initial chapter index if set from query parameter
  useEffect(() => {
    if (chapterParam !== null) {
      const parsed = parseInt(chapterParam, 10);
      if (!isNaN(parsed) && parsed !== activeChapterIndex && parsed >= 0) {
        setActiveChapterIndex(parsed);
      }
    }
  }, [chapterParam, activeChapterIndex, setActiveChapterIndex]);

  const handleSharePanelFromReader = (panelUrl: string, chapterNum: number) => {
    const current = resolvedBook || activeBook;
    if (!current) return;
    setShareModalConfig({
      isOpen: true,
      mediaUrl: panelUrl,
      quoteText: undefined,
      bookTitle: current.title,
      category: current.category,
      chapterNum
    });
  };

  const handleShareQuoteFromReader = (quoteText: string, chapterNum: number) => {
    const current = resolvedBook || activeBook;
    if (!current) return;
    setShareModalConfig({
      isOpen: true,
      quoteText,
      mediaUrl: undefined,
      bookTitle: current.title,
      category: current.category,
      chapterNum
    });
  };

  const handleChapterChange = (newIndex: number) => {
    setActiveChapterIndex(newIndex);
    const current = resolvedBook || activeBook;
    if (current && typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `/read/${encodeURIComponent(current.id)}?chapter=${newIndex}`
      );
      syncRecentlyRead(current, newIndex);
    }
  };

  const handleBackToOverview = () => {
    const current = resolvedBook || activeBook;
    if (current) {
      router.push(`/book/${encodeURIComponent(current.id)}`);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (isLoading || !resolvedBook) {
    const previewBook =
      (activeBook && (activeBook.id === bookId || activeBook.id === rawId) ? activeBook : null) ||
      resolvedBook;

    return (
      <div className="min-h-screen bg-[#0a0b0f] text-zinc-100 relative overflow-hidden flex flex-col font-sans select-none">
        {/* Subtle aura background matching reader */}
        <div className="fixed-aura-bg" />

        {/* Ambient glow matching reader aesthetic */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none bg-orange-500/10" />

        {/* Reader Top Bar Skeleton */}
        <div className="relative z-10 w-full border-b border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToOverview}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              {previewBook ? (
                <div className="text-sm font-bold text-zinc-200 truncate max-w-[220px] sm:max-w-md">
                  {previewBook.title}
                </div>
              ) : (
                <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
              )}
              <div className="text-[11px] text-zinc-500 font-medium">
                Chapter {(initialChapterIdx || 0) + 1} • Initializing Reader
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-xl bg-white/5 border border-white/10 animate-pulse hidden sm:block" />
            <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          </div>
        </div>

        {/* Main Reader Canvas Skeleton */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 w-full max-w-3xl mx-auto space-y-6 pt-10">
          {/* Header Preview Card with Cover and Chapter info */}
          <div className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />

            {/* Poster cover thumbnail with loader */}
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0 relative flex items-center justify-center shadow-lg">
              {previewBook?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewBook.coverImage}
                  alt={previewBook.title}
                  className="w-full h-full object-cover opacity-30 filter blur-xs"
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              </div>
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/30 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Streaming Chapter {(initialChapterIdx || 0) + 1}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 truncate">
                {previewBook?.title || 'Loading Title...'}
              </h2>
              <p className="text-xs text-zinc-400">
                Buffering high-resolution content & initializing view settings...
              </p>
            </div>
          </div>

          {/* Shimmering Reading Strip / Page Skeleton lines */}
          <div className="w-full space-y-3.5 pt-2">
            <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-11/12 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
            <div className="h-28 w-full rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                <BookOpen className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>Reading Canvas Ready in 2s...</span>
              </div>
            </div>
            <div className="h-4 w-11/12 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-white/5 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  const currentBook = activeBook && activeBook.id === resolvedBook.id ? activeBook : resolvedBook;

  const isNovelOrBook =
    currentBook.category === 'webnovel' ||
    currentBook.category === 'lightnovel' ||
    currentBook.category === 'book' ||
    currentBook.id.startsWith('ln-') ||
    currentBook.id.startsWith('wn-') ||
    currentBook.id.startsWith('gutenberg-') ||
    currentBook.id.startsWith('se-');

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-zinc-100 relative selection:bg-fuchsia-500 selection:text-white">
      {/* Zero-repaint GPU compositor layer matching Home page */}
      <div className="fixed-aura-bg" />

      <div className="relative z-10">
        {(() => {

          const isExplicitManhwa =
            !isNovelOrBook &&
            (currentBook.category === 'manhwa' ||
            currentBook.id.includes('manhwa') ||
            (currentBook.genre && currentBook.genre.some(g => /manhwa|webtoon/i.test(g))) ||
            /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|solo leveling|lookism|tower of god|eleceed|wind breaker|nano machine|touch to unlock|jinx|bj alex|painter of the night|pearl boy|mercenary enrollment|villain to kill/i.test(currentBook.title || '') ||
            /secret-class|boarding-diary|silent-war|circles|sweet-guy|bad-thinking|stepmother/i.test(currentBook.id));

          const isImageChapter = !isNovelOrBook && Boolean(
            currentBook.chapters?.some(
              ch =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ch.id) ||
                ch.id?.startsWith('wc-') ||
                ch.id?.startsWith('mk-') ||
                ch.id?.startsWith('wt-') ||
                ch.id?.startsWith('sl-') ||
                ch.id?.startsWith('ss-') ||
                ch.content?.some(
                  c => typeof c === 'string' && (c.startsWith('http') || c.includes('.jpg') || c.includes('.png') || c.includes('.webp'))
                )
            )
          );

          if (isExplicitManhwa) {
            return (
              <ManhwaReader
                key={currentBook.id}
                book={currentBook}
                chapterIndex={activeChapterIndex}
                onBack={handleBackToOverview}
                onChapterChange={handleChapterChange}
                onSharePanel={handleSharePanelFromReader}
              />
            );
          }

          if (!isNovelOrBook && (currentBook.category === 'manga' || isImageChapter)) {
            return (
              <MangaReader
                key={currentBook.id}
                book={currentBook}
                chapterIndex={activeChapterIndex}
                onBack={handleBackToOverview}
                onChapterChange={handleChapterChange}
                onSharePanel={handleSharePanelFromReader}
              />
            );
          }

          return (
            <NovelReader
              key={currentBook.id}
              book={currentBook}
              chapterIndex={activeChapterIndex}
              onBack={handleBackToOverview}
              onChapterChange={handleChapterChange}
              onShareQuote={handleShareQuoteFromReader}
              onSharePanel={handleSharePanelFromReader}
            />
          );
        })()}

        <CreatePostModal
          isOpen={shareModalConfig.isOpen}
          onClose={() => setShareModalConfig(prev => ({ ...prev, isOpen: false }))}
          initialQuote={shareModalConfig.quoteText}
          initialMediaUrl={shareModalConfig.mediaUrl}
          initialBookTitle={shareModalConfig.bookTitle}
          initialCategory={shareModalConfig.category}
          initialChapterNum={shareModalConfig.chapterNum}
        />
      </div>
    </div>
  );
}

export default function BookReadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0b0f] text-zinc-100 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Loading Reader...</p>
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
