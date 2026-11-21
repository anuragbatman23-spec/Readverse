'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Book } from '../../types';
import { parseEpubFile } from '../../utils/epubParser';
import { SpotlightHero } from './SpotlightHero';
import { BookCard } from './BookCard';
import {
  BookOpen,
  Sparkles,
  Flame,
  ArrowRight,
  Search,
  Loader2,
  RefreshCw,
  UploadCloud,
  FileText,
  X,
  Compass,
  ChevronLeft,
  ChevronRight,
  Grid,
  SlidersHorizontal,
  Smartphone,
  Feather,
  Library,
  HardDrive,
  BookMarked
} from 'lucide-react';

interface ShelfSkeletonCardProps {
  index: number;
  label?: string;
}

const ShelfSkeletonCard: React.FC<ShelfSkeletonCardProps> = ({ index, label = 'Finding more titles...' }) => (
  <div className="w-[195px] sm:w-[220px] shrink-0 pointer-events-auto flex flex-col">
    <div className="w-full flex-1 rounded-2xl border-2 border-white/[0.08] bg-[#0e101c] shadow-lg overflow-hidden flex flex-col justify-between animate-pulse">
      {/* Cover Skeleton with Shimmer */}
      <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-white/[0.08] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />

        <div className="flex flex-col items-center gap-2 p-3 text-center z-10">
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-[#DA6569]" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-zinc-200">
            {index === 0 ? label : 'Loading cover...'}
          </span>
          <span className="text-[9.5px] text-zinc-400 font-medium">
            Loading...
          </span>
        </div>

        {/* Category Pill Placeholder */}
        <div className="absolute top-2.5 left-2.5 h-4 w-14 rounded-full bg-white/10 border border-white/5" />
      </div>

      {/* Info / Title Skeleton */}
      <div className="p-3.5 space-y-2.5 bg-[#0d0f18]/90 border-t border-white/[0.05]">
        <div className="h-4 w-4/5 rounded-md bg-white/10" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  </div>
);

export const LibraryView: React.FC = () => {
  const router = useRouter();
  const { setActiveBook, stats } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveBooks, setLiveBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [isParsingEpub, setIsParsingEpub] = useState(false);
  const [epubNotice, setEpubNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [categoryViewMode, setCategoryViewMode] = useState<'scroll' | 'grid'>('scroll');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isManualScrollRef = useRef(false);
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedQueryRef = useRef<string>('');
  const isBoostActive = stats.boostExpiresAt !== null && Date.now() < stats.boostExpiresAt;

  // Endless horizontal scroll states per category shelf
  const [shelfLoading, setShelfLoading] = useState<Record<string, boolean>>({
    manhwa: false,
    manga: false,
    lightnovel: false,
    webnovel: false,
    book: false
  });
  const [shelfPage, setShelfPage] = useState<Record<string, number>>({
    manhwa: 2,
    manga: 2,
    lightnovel: 2,
    webnovel: 2,
    book: 2
  });
  const shelfPageRef = useRef<Record<string, number>>({
    manhwa: 2,
    manga: 2,
    lightnovel: 2,
    webnovel: 2,
    book: 2
  });
  const shelfHasMoreRef = useRef<Record<string, boolean>>({
    manhwa: true,
    manga: true,
    lightnovel: true,
    webnovel: true,
    book: true
  });
  const [shelfHasMore, setShelfHasMore] = useState<Record<string, boolean>>({
    manhwa: true,
    manga: true,
    lightnovel: true,
    webnovel: true,
    book: true
  });
  const [additionalShelfBooks, setAdditionalShelfBooks] = useState<Record<string, Book[]>>({
    manhwa: [],
    manga: [],
    lightnovel: [],
    webnovel: [],
    book: []
  });
  const shelfLoadingRef = useRef<Record<string, boolean>>({});
  const scrollRafRef = useRef<Record<string, number | null>>({});
  const lastScrollCheckRef = useRef<Record<string, number>>({});
  const shelfScrollTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Dynamically load more books for a category shelf on scroll
  const loadMoreForShelf = useCallback(async (catKey: string) => {
    if (catKey === 'local' || catKey === 'all') return;
    if (shelfLoadingRef.current[catKey] || shelfHasMoreRef.current[catKey] === false) return;

    shelfLoadingRef.current[catKey] = true;
    setShelfLoading(prev => ({ ...prev, [catKey]: true }));

    const currentPage = shelfPageRef.current[catKey] || 2;
    try {
      // Ensure smooth 0.5-second loading state when loading new books on scroll
      const minDelay = new Promise(resolve => setTimeout(resolve, 500));
      const [res] = await Promise.all([
        fetch(`/api/catalog/more?category=${catKey}&page=${currentPage}`),
        minDelay
      ]);

      if (!res.ok) {
        shelfHasMoreRef.current[catKey] = false;
        setShelfHasMore(prev => ({ ...prev, [catKey]: false }));
      } else {
        const data = await res.json();
        const newBooks: Book[] = data.books || [];
        if (newBooks.length === 0) {
          shelfHasMoreRef.current[catKey] = false;
          setShelfHasMore(prev => ({ ...prev, [catKey]: false }));
        } else {
          shelfPageRef.current[catKey] = currentPage + 1;
          setAdditionalShelfBooks(prev => {
            const currentList = [
              ...liveBooks.filter(b => b.category === catKey),
              ...(prev[catKey] || [])
            ];
            const existingIds = new Set(currentList.map(b => b.id));
            const existingTitles = new Set(currentList.map(b => b.title.trim().toLowerCase()));

            const uniqueNew = newBooks.filter(
              b => !existingIds.has(b.id) && !existingTitles.has(b.title.trim().toLowerCase())
            );

            if (uniqueNew.length === 0) return prev;

            return {
              ...prev,
              [catKey]: [...(prev[catKey] || []), ...uniqueNew]
            };
          });
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch more ${catKey} titles:`, err);
    } finally {
      shelfLoadingRef.current[catKey] = false;
      setShelfLoading(prev => ({ ...prev, [catKey]: false }));
    }
  }, [liveBooks]);

  // Listener to trigger fetching more titles dynamically with requestAnimationFrame & smooth scroll-freeze
  const handleRowScroll = useCallback((categoryId: string, el: HTMLDivElement) => {
    if (!el) return;

    // Suppress card hover state & costly box-shadow recalculations while scrolling
    if (!el.classList.contains('shelf-is-scrolling')) {
      el.classList.add('shelf-is-scrolling');
    }
    if (shelfScrollTimerRef.current[categoryId]) {
      clearTimeout(shelfScrollTimerRef.current[categoryId]);
    }
    shelfScrollTimerRef.current[categoryId] = setTimeout(() => {
      el.classList.remove('shelf-is-scrolling');
    }, 160);

    if (categoryId === 'local' || categoryId === 'all') return;
    if (shelfLoadingRef.current[categoryId] || shelfHasMoreRef.current[categoryId] === false) return;

    const now = Date.now();
    if (now - (lastScrollCheckRef.current[categoryId] || 0) < 150) return;
    lastScrollCheckRef.current[categoryId] = now;

    if (scrollRafRef.current[categoryId]) {
      cancelAnimationFrame(scrollRafRef.current[categoryId]!);
    }

    scrollRafRef.current[categoryId] = requestAnimationFrame(() => {
      if (!el) return;
      // Fetch more books early when approaching the end of the row (within 550px)
      const threshold = 550;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold) {
        loadMoreForShelf(categoryId);
      }
    });
  }, [loadMoreForShelf]);

  // Memoized categorized shelf partitions - avoids re-filtering arrays on every render
  const categorizedBooks = useMemo(() => ({
    manhwa: [...liveBooks.filter(b => b.category === 'manhwa'), ...(additionalShelfBooks.manhwa || [])],
    manga: [...liveBooks.filter(b => b.category === 'manga'), ...(additionalShelfBooks.manga || [])],
    lightnovel: [...liveBooks.filter(b => b.category === 'lightnovel'), ...(additionalShelfBooks.lightnovel || [])],
    webnovel: [...liveBooks.filter(b => b.category === 'webnovel'), ...(additionalShelfBooks.webnovel || [])],
    book: [...liveBooks.filter(b => b.category === 'book' && !b.id.startsWith('local-')), ...(additionalShelfBooks.book || [])],
    local: liveBooks.filter(b => b.id.startsWith('local-')),
  }), [liveBooks, additionalShelfBooks]);

  const currentCategoryBooks = useMemo(() => {
    if (selectedCategory === 'all') return liveBooks;
    if (selectedCategory === 'local') return categorizedBooks.local;
    return (categorizedBooks as Record<string, Book[]>)[selectedCategory] || [];
  }, [selectedCategory, liveBooks, categorizedBooks]);

  // Filter search results according to the selected category from the left pile column
  const displayedSearchBooks = searchQuery.trim()
    ? liveBooks.filter((b) => {
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'local') return b.id.startsWith('local-');
        return b.category === selectedCategory;
      })
    : liveBooks;

  const scrollRow = (categoryId: string, direction: 'left' | 'right') => {
    const el = rowRefs.current[categoryId];
    if (el) {
      if (direction === 'right' && categoryId !== 'local' && categoryId !== 'all') {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 650) {
          loadMoreForShelf(categoryId);
        }
      }
      const offset = direction === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Infinite scroll listener for Catalog Grid mode
  useEffect(() => {
    if (selectedCategory === 'all' || selectedCategory === 'local' || categoryViewMode !== 'grid') return;

    let isThrottled = false;
    const handleGridScroll = () => {
      if (isThrottled) return;
      if (shelfLoadingRef.current[selectedCategory] || shelfHasMoreRef.current[selectedCategory] === false) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= docHeight - 650) {
        isThrottled = true;
        loadMoreForShelf(selectedCategory);
        setTimeout(() => {
          isThrottled = false;
        }, 400);
      }
    };

    window.addEventListener('scroll', handleGridScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleGridScroll);
  }, [selectedCategory, categoryViewMode, loadMoreForShelf]);

  const scrollToCategorySection = (catId: string) => {
    if (searchQuery.trim()) {
      setSelectedCategory(prev => (prev === catId ? 'all' : catId));
      setActiveCategory(prev => (prev === catId ? 'all' : catId));
      return;
    }

    if (catId === 'all') {
      setSelectedCategory('all');
      setActiveCategory('all');
      isManualScrollRef.current = true;
      if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
      manualScrollTimeoutRef.current = setTimeout(() => {
        isManualScrollRef.current = false;
      }, 800);
      const searchSection = document.getElementById('catalog-search-section');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setActiveCategory(catId);
    isManualScrollRef.current = true;
    if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
    manualScrollTimeoutRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 800);

    if (selectedCategory !== 'all') {
      setSelectedCategory('all');
      setTimeout(() => {
        const el = document.getElementById(`category-${catId}`);
        if (el) {
          const yOffset = -110;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 60);
    } else {
      const el = document.getElementById(`category-${catId}`);
      if (el) {
        const yOffset = -110;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const activeCategoryRef = useRef<string>('all');

  // Scroll spy: Update category pill to match the section currently in front of user
  useEffect(() => {
    if (selectedCategory !== 'all' || searchQuery.trim()) return;

    const categoryIds = ['manhwa', 'manga', 'lightnovel', 'webnovel', 'book', 'local'];

    const handleScroll = () => {
      if (isManualScrollRef.current) return;

      // Find all rendered category section elements
      const sections: { id: string; top: number }[] = [];
      for (const catId of categoryIds) {
        const el = document.getElementById(`category-${catId}`);
        if (el) {
          sections.push({ id: catId, top: el.getBoundingClientRect().top });
        }
      }

      if (sections.length === 0) return;

      const triggerY = 250; // Viewport trigger threshold

      // 1. If user is above the first category section (in Spotlight Hero or Search Bar), active is 'all'
      if (sections[0].top > triggerY) {
        if (activeCategoryRef.current !== 'all') {
          activeCategoryRef.current = 'all';
          setActiveCategory('all');
        }
        return;
      }

      // 2. Find the last section whose top has crossed the trigger threshold.
      // This prevents gaps or interstitial ad banners from prematurely jumping back to 'all'.
      let activeCat = sections[0].id;
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].top <= triggerY) {
          activeCat = sections[i].id;
        } else {
          break;
        }
      }

      // 3. If scrolled to the bottom of the page, activate the last section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      if (isAtBottom && sections.length > 0) {
        activeCat = sections[sections.length - 1].id;
      }

      if (activeCategoryRef.current !== activeCat) {
        activeCategoryRef.current = activeCat;
        setActiveCategory(activeCat);
      }
    };

    let ticking = false;
    let lastScrollSpyTime = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollSpyTime < 150) return;
      lastScrollSpyTime = now;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
    };
  }, [selectedCategory, searchQuery, liveBooks]);

  // Keep active pill scrolled into view on mobile horizontal scroll
  useEffect(() => {
    const currentPill = pillRefs.current[activeCategory];
    if (currentPill && window.innerWidth < 1024) {
      currentPill.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCategory]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const queryCacheRef = useRef<Map<string, Book[]>>(new Map());
  const allCatalogBooksRef = useRef<Book[] | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live reading material in parallel including local server storage with SWR caching & request deduplication
  const fetchReadingMaterial = async (query = '', category = 'all', forceFresh = false) => {
    const isSearch = Boolean(query && query.trim());
    const cacheKey = `${query.trim().toLowerCase()}__${category}`;

    // 1. Instant cache hit from client-side memory
    if (!forceFresh) {
      if (!isSearch && allCatalogBooksRef.current && allCatalogBooksRef.current.length > 0) {
        if (category === 'all') {
          setLiveBooks(allCatalogBooksRef.current);
          setIsLoading(false);
          return;
        }
        if (category === 'local') {
          setLiveBooks(allCatalogBooksRef.current.filter(b => b.id.startsWith('local-')));
          setIsLoading(false);
          return;
        }
        setLiveBooks(allCatalogBooksRef.current.filter(b => b.category === category));
        setIsLoading(false);
        return;
      }

      const cached = queryCacheRef.current.get(cacheKey);
      if (cached) {
        setLiveBooks(cached);
        setIsLoading(false);
        return;
      }
    }

    // Cancel any previous in-flight search request to prevent race conditions & wasted bandwidth
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setIsLoading(true);
    try {
      const promises: Promise<Book[]>[] = [];
      // Strictly query the corresponding sources for the selected category (e.g. never search webnovels in manga sources)
      const effectiveCategory = category;

      // 1. Always search Local Storage first (instant response)
      if (effectiveCategory === 'all' || effectiveCategory === 'book' || effectiveCategory === 'local') {
        promises.push(
          fetch(`/api/books/local?q=${encodeURIComponent(query)}`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
      }

      // 2. Search Manga & Manhwa (fetch both when browsing 'all' categories)
      if (effectiveCategory === 'all') {
        promises.push(
          fetch(`/api/manga/search?q=${encodeURIComponent(query)}&category=manhwa`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
        promises.push(
          fetch(`/api/manga/search?q=${encodeURIComponent(query)}&category=manga`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
      } else if (effectiveCategory === 'manga' || effectiveCategory === 'manhwa') {
        promises.push(
          fetch(`/api/manga/search?q=${encodeURIComponent(query)}&category=${effectiveCategory}`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
      }

      // 3. Search External Books (with Gutenberg fallback)
      if (effectiveCategory === 'all' || effectiveCategory === 'book') {
        promises.push(
          fetch(`/api/books/search?q=${encodeURIComponent(query)}`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
      }

      // 4. Search Light Novels
      if (effectiveCategory === 'all' || effectiveCategory === 'lightnovel') {
        promises.push(
          fetch(`/api/lightnovels/search?q=${encodeURIComponent(query)}`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
      }

      // 5. Search Webnovels
      if (effectiveCategory === 'all' || effectiveCategory === 'webnovel') {
        promises.push(
          fetch(`/api/webnovels/search?q=${encodeURIComponent(query)}`, { signal })
            .then(r => (r.ok ? r.json() : { books: [] }))
            .then(d => d.books || [])
            .catch(() => [])
        );
      }

      const results = await Promise.all(promises);
      if (signal.aborted) return;

      const combined = results.flat();

      // Cache the full baseline catalog
      if (!isSearch && effectiveCategory === 'all') {
        allCatalogBooksRef.current = combined;
      }
      queryCacheRef.current.set(cacheKey, combined);

      setLiveBooks(combined);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to fetch live reading material:', err);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Initial load and category change when not searching
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchReadingMaterial('', selectedCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const triggerSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed === lastFetchedQueryRef.current) return;
    lastFetchedQueryRef.current = trimmed;
    fetchReadingMaterial(trimmed, selectedCategory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      triggerSearch(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    // If user completely cleared the input, reset search immediately
    if (val.trim() === '') {
      if (lastFetchedQueryRef.current !== '') {
        lastFetchedQueryRef.current = '';
        fetchReadingMaterial('', selectedCategory);
      }
      return;
    }

    // 350ms smooth debounce while typing prevents spamming API queries
    debounceTimerRef.current = setTimeout(() => {
      triggerSearch(val);
    }, 350);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    triggerSearch(searchQuery);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchQuery('');
    lastFetchedQueryRef.current = '';
    fetchReadingMaterial('', selectedCategory);
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    lastFetchedQueryRef.current = term.trim();
    fetchReadingMaterial(term, selectedCategory);
  };

  // Handle client-side EPUB file loading and auto-save to local disk server
  const handleEpubUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setEpubNotice('Please select a valid .epub book file.');
      return;
    }

    setIsParsingEpub(true);
    setEpubNotice(null);

    try {
      const parsedBook = await parseEpubFile(file);
      setLiveBooks(prev => [parsedBook, ...prev]);
      try {
        localStorage.setItem(`readverse_book_${parsedBook.id}`, JSON.stringify(parsedBook));
      } catch {
        // ignore
      }
      setActiveBook(parsedBook, 0);
      router.push(`/read/${encodeURIComponent(parsedBook.id)}?chapter=0`);

      // Auto-save file permanently into /Users/madworker/readverse/local-books/
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/books/local', {
        method: 'POST',
        body: formData
      }).catch(e => console.warn('Local background save skipped:', e));
    } catch (err) {
      console.error('Failed to parse EPUB:', err);
      setEpubNotice('Unable to parse EPUB. Ensure the file is not DRM-protected.');
    } finally {
      setIsParsingEpub(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleEpubUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleEpubUpload(file);
    }
  };

  const handleOpenBook = (book: Book) => {
    setLoadingBookId(book.id);
    try {
      localStorage.setItem(`readverse_book_${book.id}`, JSON.stringify(book));
    } catch {
      // ignore
    }
    router.push(`/book/${encodeURIComponent(book.id)}`);
  };

  // Helper styles for content categories
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'manhwa':
        return {
          pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          borderHover: 'hover:border-cyan-400',
          cardGlow: 'hover:shadow-cyan-500/20',
          btnBg: 'hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white',
          glowColor: 'rgba(6, 182, 212, 0.35)',
          borderColor: '#22d3ee',
          titleHover: 'group-hover:text-cyan-300'
        };
      case 'manga':
        return {
          pill: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          borderHover: 'hover:border-purple-400',
          cardGlow: 'hover:shadow-purple-500/20',
          btnBg: 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 hover:text-white',
          glowColor: 'rgba(168, 85, 247, 0.35)',
          borderColor: '#c084fc',
          titleHover: 'group-hover:text-purple-300'
        };
      case 'lightnovel':
        return {
          pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          borderHover: 'hover:border-blue-400',
          cardGlow: 'hover:shadow-blue-500/20',
          btnBg: 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white',
          glowColor: 'rgba(59, 130, 246, 0.35)',
          borderColor: '#60a5fa',
          titleHover: 'group-hover:text-blue-300'
        };
      case 'webnovel':
        return {
          pill: 'bg-[#DA6569]/20 text-[#DA6569] border-[#DA6569]/30',
          borderHover: 'hover:border-[#DA6569]',
          cardGlow: 'hover:shadow-[#DA6569]/20',
          btnBg: 'hover:bg-[#DA6569] hover:border-[#DA6569] hover:text-white hover:shadow-[0_0_15px_rgba(218,101,105,0.4)]',
          glowColor: 'rgba(218, 101, 105, 0.35)',
          borderColor: '#DA6569',
          titleHover: 'group-hover:text-[#DA6569]'
        };
      case 'book':
      default:
        return {
          pill: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          borderHover: 'hover:border-rose-400',
          cardGlow: 'hover:shadow-rose-500/20',
          btnBg: 'hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:text-white',
          glowColor: 'rgba(244, 63, 94, 0.35)',
          borderColor: '#fb7185',
          titleHover: 'group-hover:text-rose-300'
        };
    }
  };

  return (
    <div className="w-full mx-auto pb-12">
      {/* Hidden file input for custom EPUB upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".epub"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Full-Bleed Cinematic Spotlight Carousel Hero Banner */}
      <SpotlightHero
        onOpenBook={handleOpenBook}
        onExploreCatalogue={() => {
          const el = document.getElementById('catalog-search-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Main Catalog Content Container - Balanced side space while keeping Spotlight full-bleed */}
      <div className="w-full max-w-[1520px] mx-auto px-6 sm:px-8 md:px-10 lg:px-12 xl:px-14 space-y-10 pt-6">

      {/* Sleek Minimalist Dark Search Bar - Centered & Compact (Pinned to Top Edge on Scroll) */}
      <div
        id="catalog-search-section"
        className="sticky top-2 sm:top-3 z-30 w-full max-w-3xl mx-auto"
      >
        <form onSubmit={handleSearchSubmit} className="w-full relative group">
          {/* Subtle Ambient Glass Glow */}
          <div className="absolute -inset-0.5 rounded-2xl sm:rounded-full bg-white/[0.03] blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />

          <div className="relative flex items-center w-full rounded-2xl sm:rounded-full border border-white/15 bg-[#0c0e17]/50 hover:bg-[#0c0e17]/65 hover:border-white/25 group-focus-within:border-white/35 group-focus-within:bg-[#0c0e17]/75 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden">
            {isLoading ? (
              <Loader2 className="absolute left-3.5 sm:left-4.5 w-4 h-4 sm:w-5 sm:h-5 text-[#DA6569] animate-spin z-10" />
            ) : (
              <Search className="absolute left-3.5 sm:left-4.5 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 group-focus-within:text-zinc-200 transition-colors z-10" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search Manga, Webtoons, Light Novels or Books..."
              className="w-full pl-11 sm:pl-13 pr-22 sm:pr-28 py-3.5 sm:py-4 rounded-2xl sm:rounded-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all z-10 relative"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-18 sm:right-24 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 sm:right-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all shadow-sm active:scale-95 z-10"
            >
              Search
            </button>
          </div>
        </form>

        {epubNotice && (
          <div className="mt-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {epubNotice}
          </div>
        )}
      </div>

      {/* Quick Search Suggestions with jewel pill styling (Always visible, scrolls naturally, not stuck with search bar) */}
      <div className="w-full max-w-3xl mx-auto -mt-6 sm:-mt-5">
        <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar text-xs text-zinc-400 px-1 py-1">
          <span className="font-semibold text-zinc-400 shrink-0 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Popular:
          </span>
          {[
            { name: 'Solo Leveling', color: 'hover:border-cyan-400 hover:text-cyan-300' },
            { name: 'One Piece', color: 'hover:border-orange-400 hover:text-orange-300' },
            { name: 'Mushoku Tensei', color: 'hover:border-blue-400 hover:text-blue-300' },
            { name: 'Shadow Slave', color: 'hover:border-amber-400 hover:text-amber-300' },
            { name: 'Jujutsu Kaisen', color: 'hover:border-purple-400 hover:text-purple-300' },
            { name: 'Frankenstein', color: 'hover:border-rose-400 hover:text-rose-300' },
            { name: 'Berserk', color: 'hover:border-red-400 hover:text-red-300' },
            { name: 'Dracula', color: 'hover:border-emerald-400 hover:text-emerald-300' },
            { name: 'Lord of the Mysteries', color: 'hover:border-indigo-400 hover:text-indigo-300' }
          ].map(term => (
            <button
              key={term.name}
              onClick={() => handleQuickSearch(term.name)}
              className={`px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] shrink-0 transition-all text-zinc-300 ${term.color}`}
            >
              {term.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Catalog Layout: Left Side Vertical Bar with Icons + Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start pt-2">
        {/* Left Side Vertical Icon Rail (Circular Icon Pile Column) */}
        <aside className="w-full lg:w-auto shrink-0 lg:sticky lg:top-20 z-20">
          <div className="flex flex-row lg:flex-col items-center justify-start sm:justify-center gap-2.5 p-2 sm:p-2.5 rounded-full bg-[#0c0e1c]/95 border border-white/[0.12] backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.05] overflow-x-auto lg:overflow-visible no-scrollbar overscroll-x-contain [transform:translateZ(0)]">
            {/* Category Circular Icon Navigation */}
            {[
              {
                id: 'all',
                label: 'All Categories',
                icon: Flame,
                iconColor: 'text-orange-400 group-hover:text-orange-300',
                activeClass: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 text-white shadow-[0_0_22px_rgba(244,63,94,0.45)] ring-2 ring-white/70 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.length
              },
              {
                id: 'manhwa',
                label: 'Webtoons (Vertical)',
                icon: Smartphone,
                iconColor: 'text-cyan-400 group-hover:text-cyan-300',
                activeClass: 'bg-cyan-500/20 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.filter(b => b.category === 'manhwa').length
              },
              {
                id: 'manga',
                label: 'Manga (Paged RTL)',
                icon: BookOpen,
                iconColor: 'text-purple-400 group-hover:text-purple-300',
                activeClass: 'bg-purple-500/20 text-purple-200 border-2 border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.filter(b => b.category === 'manga').length
              },
              {
                id: 'lightnovel',
                label: 'Light Novels (JP)',
                icon: BookMarked,
                iconColor: 'text-blue-400 group-hover:text-blue-300',
                activeClass: 'bg-blue-500/20 text-blue-200 border-2 border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.4)] ring-2 ring-blue-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.filter(b => b.category === 'lightnovel').length
              },
              {
                id: 'webnovel',
                label: 'Webnovels (Serial)',
                icon: Feather,
                iconColor: 'text-[#DA6569] group-hover:text-[#DA6569]',
                activeClass: 'bg-[#DA6569]/20 text-[#DA6569] border-2 border-[#DA6569] shadow-[0_0_18px_rgba(218,101,105,0.4)] ring-2 ring-[#DA6569]/40 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.filter(b => b.category === 'webnovel').length
              },
              {
                id: 'book',
                label: 'Classic Books (Full)',
                icon: Library,
                iconColor: 'text-rose-400 group-hover:text-rose-300',
                activeClass: 'bg-rose-500/20 text-rose-200 border-2 border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.4)] ring-2 ring-rose-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.filter(b => b.category === 'book' && !b.id.startsWith('local-')).length
              },
              {
                id: 'local',
                label: 'Local Bookshelf',
                icon: HardDrive,
                iconColor: 'text-emerald-400 group-hover:text-emerald-300',
                activeClass: 'bg-emerald-500/20 text-emerald-200 border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                count: liveBooks.filter(b => b.id.startsWith('local-')).length
              }
            ].map(item => {
              const ItemIcon = item.icon;
              const activeId = selectedCategory !== 'all' ? selectedCategory : activeCategory;
              const isActive = activeId === item.id;

              return (
                <button
                  key={item.id}
                  ref={el => {
                    pillRefs.current[item.id] = el;
                  }}
                  title={`${item.label} (${item.count})`}
                  onClick={() => scrollToCategorySection(item.id)}
                  className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `${item.activeClass} scale-105`
                      : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.09] hover:border-white/20 hover:scale-105 active:scale-95 shadow-sm'
                  }`}
                >
                  <ItemIcon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : item.iconColor}`} />

                  {/* Active Indicator Pulse Ring */}
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-[#0c0e1c] shadow-sm flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                    </span>
                  )}

                  {/* Floating tooltip on hover */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-zinc-950/95 border border-white/15 text-white text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden lg:flex items-center gap-1.5">
                    <span>{item.label}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-300">
                      {item.count}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Subtle Divider */}
            <div className="hidden lg:block w-7 h-px bg-white/10 my-1 rounded-full" />
            <div className="lg:hidden block h-7 w-px bg-white/10 mx-1 rounded-full" />

            {/* Refresh Circular Icon */}
            <button
              onClick={() => fetchReadingMaterial(searchQuery, selectedCategory, true)}
              disabled={isLoading}
              title="Refresh Library"
              className="group relative w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-200 group-hover:rotate-45 ${isLoading ? 'animate-spin text-[#DA6569]' : ''}`} />
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-zinc-950/95 border border-white/15 text-white text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden lg:flex items-center gap-1.5">
                Refresh Library
              </div>
            </button>
          </div>
        </aside>

        {/* Main Catalog Content */}
        <div className="flex-1 min-w-0 w-full space-y-10">

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-28 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-14 h-14">
            {/* Ambient #DA6569 glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse pointer-events-none bg-[#DA6569]"
            />
            {/* Spinning #DA6569 ring */}
            <div
              className="w-12 h-12 rounded-full border-4 border-[#DA6569] border-t-transparent animate-spin shadow-[0_0_20px_rgba(218,101,105,0.4)]"
            />
          </div>
        </div>
      ) : liveBooks.length === 0 ? (
        <div className="py-20 text-center space-y-5 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-white">No indexed titles found for &ldquo;{searchQuery}&rdquo;</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Try searching for other keywords, or open any local EPUB file to read with full point rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            {searchQuery.trim() && (
              <button
                onClick={handleClearSearch}
                className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-200 font-bold text-xs shadow border border-white/10 inline-flex items-center justify-center gap-2"
              >
                <span>Clear Search</span>
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-zinc-950" />
              <span>📂 Open Local EPUB</span>
            </button>
          </div>
        </div>
      ) : searchQuery.trim() ? (
        /* Search Query Results View */
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-400" />
                  <span>Search Results for &ldquo;{searchQuery}&rdquo;</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {displayedSearchBooks.length} {displayedSearchBooks.length === 1 ? 'title' : 'titles'}
                </span>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/25 text-xs font-medium flex items-center gap-1 transition-all"
                    title="Clear category filter"
                  >
                    <span className="capitalize">{selectedCategory === 'manhwa' ? 'Webtoons' : selectedCategory}</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold self-start sm:self-auto"
              >
                <X className="w-4 h-4" />
                <span>Clear search</span>
              </button>
            </div>

            {displayedSearchBooks.length === 0 ? (
              <div className="py-16 text-center space-y-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-sm text-zinc-400">
                  No <span className="text-white font-semibold capitalize">{selectedCategory}</span> titles found matching &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all inline-flex items-center gap-2"
                >
                  Show All Categories ({liveBooks.length} results)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {displayedSearchBooks.map((book) => {
                  const pointsAwarded = isBoostActive ? book.pointsPerChapter * 2 : book.pointsPerChapter;
                  const isOpeningThis = loadingBookId === book.id;
                  const theme = getCategoryTheme(book.category);

                  return (
                    <BookCard
                      key={book.id}
                      book={book}
                      theme={theme}
                      pointsAwarded={pointsAwarded}
                      isOpeningThis={isOpeningThis}
                      onOpenBook={handleOpenBook}
                    />
                  );
                })}
              </div>
            )}
          </div>
      ) : selectedCategory === 'all' ? (
        /* Multi-Category Scroll Shelves Home Page */
        <div className="space-y-12">
          {[
            {
              id: 'manhwa',
              title: 'Webtoons',
              subtitle: '',
              icon: '',
              badge: '',
              showSuggested: false,
              badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
              accentText: 'text-cyan-400',
              accentHover: 'hover:border-cyan-400/50',
              books: categorizedBooks.manhwa
            },
            {
              id: 'manga',
              title: 'Manga',
              subtitle: '',
              icon: '',
              badge: '',
              showSuggested: false,
              badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
              accentText: 'text-purple-400',
              accentHover: 'hover:border-purple-400/50',
              books: categorizedBooks.manga
            },
            {
              id: 'lightnovel',
              title: 'Light Novels',
              subtitle: '',
              icon: '',
              badge: '',
              showSuggested: false,
              badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              accentText: 'text-blue-400',
              accentHover: 'hover:border-blue-400/50',
              books: categorizedBooks.lightnovel
            },
            {
              id: 'webnovel',
              title: 'Webnovels',
              subtitle: '',
              icon: '',
              badge: '',
              showSuggested: false,
              badgeColor: 'bg-[#DA6569]/20 text-[#DA6569] border-[#DA6569]/30',
              accentText: 'text-[#DA6569]',
              accentHover: 'hover:border-[#DA6569]/50',
              books: categorizedBooks.webnovel
            },
            {
              id: 'book',
              title: 'Classic Literature',
              subtitle: '',
              icon: '',
              badge: '',
              showSuggested: false,
              badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              accentText: 'text-rose-400',
              accentHover: 'hover:border-rose-400/50',
              books: categorizedBooks.book
            },
            {
              id: 'local',
              title: 'Local Bookshelf',
              subtitle: '',
              icon: '',
              badge: '',
              showSuggested: false,
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              accentText: 'text-emerald-400',
              accentHover: 'hover:border-emerald-400/50',
              books: categorizedBooks.local
            }
          ].map((catSection) => {
            const hasBooks = catSection.books.length > 0;
            const isLocal = catSection.id === 'local';

            if (!hasBooks && !isLocal) return null;

            return (
              <React.Fragment key={catSection.id}>
                <section
                  id={`category-${catSection.id}`}
                  className="scroll-mt-24 space-y-0 cv-shelf-section"
                >
                  {/* Category Shelf Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3 relative z-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        {catSection.icon ? (
                          <span className="text-2xl" role="img" aria-label={catSection.title}>
                            {catSection.icon}
                          </span>
                        ) : null}
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {catSection.title}
                        </h2>
                        {catSection.badge ? (
                          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${catSection.badgeColor} shadow-sm hidden sm:inline-block`}>
                            {catSection.badge}
                          </span>
                        ) : null}
                        {catSection.showSuggested !== false ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/10">
                            {catSection.books.length} suggested
                          </span>
                        ) : null}
                      </div>
                      {catSection.subtitle ? (
                        <p className="text-xs text-zinc-400 font-normal">
                          {catSection.subtitle}
                        </p>
                      ) : null}
                    </div>

                    {/* Scroll & Filter Controls */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      {/* Left and Right Scroll Chevron Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => scrollRow(catSection.id, 'left')}
                          aria-label={`Scroll ${catSection.title} left`}
                          className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRow(catSection.id, 'right')}
                          aria-label={`Scroll ${catSection.title} right`}
                          className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scroll Row ("in scroll") */}
                  <div
                    ref={el => {
                      rowRefs.current[catSection.id] = el;
                    }}
                    onScroll={e => handleRowScroll(catSection.id, e.currentTarget)}
                    style={{ marginTop: '-16px', paddingTop: '16px', overflowY: 'hidden' }}
                    className="flex gap-4 sm:gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar pb-3 px-1 relative z-10 [transform:translateZ(0)] [will-change:scroll-position]"
                  >
                    {catSection.books.map(book => {
                      const pointsAwarded = isBoostActive
                        ? book.pointsPerChapter * 2
                        : book.pointsPerChapter;
                      const isOpeningThis = loadingBookId === book.id;
                      const theme = getCategoryTheme(book.category);

                      return (
                        <div
                          key={book.id}
                          className="w-[195px] sm:w-[220px] shrink-0 pointer-events-auto"
                        >
                          <BookCard
                            book={book}
                            theme={theme}
                            pointsAwarded={pointsAwarded}
                            isOpeningThis={isOpeningThis}
                            onOpenBook={handleOpenBook}
                            className="w-full"
                          />
                        </div>
                      );
                    })}

                    {/* Dynamic Loader Skeletons while fetching more titles on scroll */}
                    {shelfLoading[catSection.id] && (
                      <>
                        {[0, 1, 2].map(idx => (
                          <ShelfSkeletonCard
                            key={`shelf-skeleton-${catSection.id}-${idx}`}
                            index={idx}
                            label={`Finding more ${catSection.title}...`}
                          />
                        ))}
                      </>
                    )}

                    {/* Local upload prompt tile if in local shelf */}
                    {isLocal && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[185px] h-[185px] aspect-square rounded-full self-center shrink-0 snap-start cursor-pointer border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-emerald-400/50 hover:bg-emerald-500/5 transition-all p-4.5 flex flex-col items-center justify-center text-center space-y-2 group pointer-events-auto shadow-md"
                      >
                        <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 max-w-[140px]">
                          <h4 className="font-bold text-white text-xs">Add Local EPUB</h4>
                          <p className="text-[10px] leading-tight text-zinc-400">
                            Drop any .epub file to read & earn rewards
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-300 underline">
                          Browse File
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        /* Single Selected Category View (Suggested Scroll Row + Full Catalog Grid) */
        <div className="space-y-8">
          {/* Selected Category Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>All Categories (In Scroll)</span>
              </button>
              <div>
                <h2 className="text-xl font-black text-white capitalize flex items-center gap-2">
                  <span>{selectedCategory === 'manhwa' ? 'Webtoons' : selectedCategory} Catalog</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-semibold">
                    {currentCategoryBooks.length} available
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryViewMode('scroll')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  categoryViewMode === 'scroll'
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Horizontal Scroll</span>
              </button>
              <button
                onClick={() => setCategoryViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  categoryViewMode === 'grid'
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Catalog Grid</span>
              </button>
            </div>
          </div>

          {/* Suggested Shelf In Single View */}
          {categoryViewMode === 'scroll' ? (
            <div className="space-y-0">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Suggested {selectedCategory === 'manhwa' ? 'WEBTOONS' : selectedCategory.toUpperCase()} Titles in Scroll</span>
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollRow(selectedCategory, 'left')}
                    className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollRow(selectedCategory, 'right')}
                    className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={el => {
                  rowRefs.current[selectedCategory] = el;
                }}
                onScroll={e => handleRowScroll(selectedCategory, e.currentTarget)}
                style={{ marginTop: '-16px', paddingTop: '16px', overflowY: 'hidden' }}
                className="flex gap-4 sm:gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar pb-3 px-1 relative z-10 [transform:translateZ(0)] [will-change:scroll-position]"
              >
                {currentCategoryBooks.map(book => {
                  const pointsAwarded = isBoostActive ? book.pointsPerChapter * 2 : book.pointsPerChapter;
                  const isOpeningThis = loadingBookId === book.id;
                  const theme = getCategoryTheme(book.category);

                  return (
                    <div
                      key={book.id}
                      className="w-[195px] sm:w-[220px] shrink-0 pointer-events-auto"
                    >
                      <BookCard
                        book={book}
                        theme={theme}
                        pointsAwarded={pointsAwarded}
                        isOpeningThis={isOpeningThis}
                        onOpenBook={handleOpenBook}
                        className="w-full"
                      />
                    </div>
                  );
                })}

                {/* Dynamic Loader Skeletons while fetching more titles on scroll */}
                {shelfLoading[selectedCategory] && (
                  <>
                    {[0, 1, 2].map(idx => (
                      <ShelfSkeletonCard
                        key={`single-shelf-skeleton-${selectedCategory}-${idx}`}
                        index={idx}
                        label={`Finding more ${selectedCategory} titles...`}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {currentCategoryBooks.map(book => {
                  const pointsAwarded = isBoostActive ? book.pointsPerChapter * 2 : book.pointsPerChapter;
                  const isOpeningThis = loadingBookId === book.id;
                  const theme = getCategoryTheme(book.category);

                  return (
                    <BookCard
                      key={book.id}
                      book={book}
                      theme={theme}
                      pointsAwarded={pointsAwarded}
                      isOpeningThis={isOpeningThis}
                      onOpenBook={handleOpenBook}
                    />
                  );
                })}

                {/* Dynamic Skeletons for Grid Mode on Vertical Scroll */}
                {shelfLoading[selectedCategory] && (
                  <>
                    {[0, 1, 2, 3, 4].map(idx => (
                      <div
                        key={`grid-loading-skeleton-${idx}`}
                        className="w-full rounded-2xl border-2 border-white/[0.08] bg-[#0e101c] shadow-lg overflow-hidden flex flex-col justify-between animate-pulse aspect-[3/5]"
                      >
                        <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-white/[0.08] flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />
                          <div className="flex flex-col items-center gap-2 text-center p-2 z-10">
                            <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-md">
                              <Loader2 className="w-4 h-4 animate-spin text-[#DA6569]" />
                            </div>
                            <span className="text-[11px] font-bold text-zinc-200">Loading cover...</span>
                            <span className="text-[9.5px] text-zinc-400">Please wait 2s</span>
                          </div>
                        </div>
                        <div className="p-3.5 space-y-2 bg-[#0d0f18]/90 border-t border-white/[0.05]">
                          <div className="h-4 w-4/5 rounded bg-white/10" />
                          <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      </div>
      </div>
    </div>
  );
};
