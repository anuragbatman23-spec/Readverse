'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Book, Chapter } from '../../types';
import { useApp } from '../../context/AppContext';
import { useReadingFocusTracker } from '../../utils/useReadingFocusTracker';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Camera,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Loader2,
  Radio,
  Palette,
  BookOpen
} from 'lucide-react';
import { AiWordMeaningModal } from './AiWordMeaningModal';
import { ReaderTheme, NOVEL_THEMES } from './NovelReader';
import { SourcePickerModal, SourceCandidate } from '../modals/SourcePickerModal';

const MANGA_SOURCES = [
  { id: 'weebcentral', name: 'WeebCentral (HQ)' },
  { id: 'mangadistrict', name: 'MangaDistrict' },
  { id: 'tcbscans', name: 'TCB Scans (Ultra HQ)' },
  { id: 'flamecomics', name: 'Flame Comics' },
  { id: 'mangapill', name: 'MangaPill' },
  { id: 'mangakatana', name: 'MangaKatana' },
  { id: 'toongod', name: 'ToonGod' },
  { id: 'manhwabuddy', name: 'ManhwaBuddy' },
  { id: 'webtoons', name: 'LINE Webtoons' },
  { id: 'mangadex', name: 'MangaDex' },
];

const PANEL_WIDTHS = [
  { id: 'compact', label: 'Compact', maxWidthClass: 'max-w-xl' },
  { id: 'normal', label: 'Standard', maxWidthClass: 'max-w-2xl' },
  { id: 'wide', label: 'Wide', maxWidthClass: 'max-w-3xl' },
  { id: 'extra', label: 'Expanded', maxWidthClass: 'max-w-4xl' },
  { id: 'cinema', label: 'Cinema', maxWidthClass: 'max-w-5xl' },
  { id: 'full', label: 'Full Bleed', maxWidthClass: 'max-w-7xl' },
];

interface MangaReaderProps {
  book: Book;
  chapterIndex: number;
  onBack: () => void;
  onChapterChange: (index: number) => void;
  onSharePanel: (panelUrl: string, chapterNum: number) => void;
}

export const MangaReader: React.FC<MangaReaderProps> = ({
  book,
  chapterIndex,
  onBack,
  onChapterChange,
  onSharePanel
}) => {
  const { stats, awardPoints, triggerAntiCheatWarning, setActiveBook } = useApp();
  const fallbackChapter = {
    id: 'preview',
    title: 'Chapter 1',
    chapterNumber: 1,
    content: []
  };

  const chapter = (book.chapters && book.chapters.length > 0 && book.chapters[chapterIndex]) ? book.chapters[chapterIndex] : fallbackChapter;

  const { data: session } = useSession();
  const [readerMode] = useState<'paged' | 'vertical'>('vertical');
  const [pageIndex, setPageIndex] = useState(0);
  const [readingDirection] = useState<'rtl' | 'ltr'>('rtl'); // Standard manga is RTL
  const [chapterPages, setChapterPages] = useState<string[]>(chapter?.content || []);

  // Content-proportional anti-cheat focus tracker (100% requirement for manga words/bubbles/panels)
  // Skip the first and last page count (cover and credits/promo)
  const effectivePagesCount = Math.max(
    1,
    chapterPages.length > 2
      ? chapterPages.length - 2
      : chapterPages.length > 1
      ? chapterPages.length - 1
      : chapterPages.length
  );
  const tracker = useReadingFocusTracker({
    bookId: book.id,
    chapterId: chapter.id || chapterIndex,
    chapterTitle: chapter.title,
    category: 'manga',
    totalUnits: effectivePagesCount || 15,
    currentPageIndex: readerMode === 'paged' ? pageIndex : undefined,
    userEmail: session?.user?.email || undefined,
    onClaimSuccess: (awarded) => {
      awardPoints(awarded || book.pointsPerChapter, `Completed ${book.title} ${chapter.title}`, book.category);
    },
    onAntiCheatAlert: (msg) => {
      triggerAntiCheatWarning(msg);
    }
  });

  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Panel resizing state with persistence
  const [widthIndex, setWidthIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('readverse_panel_width_idx');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < PANEL_WIDTHS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 1; // Default to 'normal' (max-w-2xl)
  });

  // Reader Theme Customization
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    try {
      const saved = localStorage.getItem('readverse_manga_theme') as ReaderTheme;
      if (saved && NOVEL_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // Sync manga theme from user profile data on load
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user/preferences?user=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.mangaTheme && NOVEL_THEMES.some((t) => t.id === data.mangaTheme)) {
          setTheme(data.mangaTheme as ReaderTheme);
          try {
            localStorage.setItem('readverse_manga_theme', data.mangaTheme);
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => console.warn('Failed to load manga theme from user preferences:', err));
  }, [session?.user?.email]);

  const handleCycleTheme = () => {
    const currentIndex = NOVEL_THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % NOVEL_THEMES.length;
    const nextTheme = NOVEL_THEMES[nextIndex];
    setTheme(nextTheme.id);
    try {
      localStorage.setItem('readverse_manga_theme', nextTheme.id);
    } catch {
      // ignore
    }

    if (session?.user?.email) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session.user.email,
          mangaTheme: nextTheme.id,
        }),
      }).catch((err) => console.warn('Failed to save manga theme to user data:', err));
    }
  };

  const currentTheme = NOVEL_THEMES.find(t => t.id === theme) || NOVEL_THEMES[1];

  // Dictionary State
  const [isWordMeaningOpen, setIsWordMeaningOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');

  const handleOpenWordMeaning = () => {
    let word = '';
    if (typeof window !== 'undefined') {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
        word = selection;
      }
    }
    setSelectedWord(word);
    setIsWordMeaningOpen(true);
  };

  const handleResizePanel = (direction: 'larger' | 'smaller') => {
    setWidthIndex(prev => {
      const next = direction === 'larger' ? Math.min(prev + 1, PANEL_WIDTHS.length - 1) : Math.max(prev - 1, 0);
      try {
        localStorage.setItem('readverse_panel_width_idx', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleShareCurrentPanel = () => {
    if (!chapterPages || chapterPages.length === 0) return;
    if (readerMode === 'paged') {
      const pageUrl = chapterPages[pageIndex] || chapterPages[0];
      onSharePanel(pageUrl, chapter.chapterNumber);
      return;
    }
    let bestUrl = chapterPages[0];
    if (typeof window !== 'undefined' && containerRef.current) {
      const images = containerRef.current.querySelectorAll('img');
      const centerY = window.innerHeight / 2;
      let minDistance = Infinity;
      images.forEach((img, idx) => {
        const rect = img.getBoundingClientRect();
        const imgCenter = rect.top + rect.height / 2;
        const dist = Math.abs(imgCenter - centerY);
        if (dist < minDistance && chapterPages[idx]) {
          minDistance = dist;
          bestUrl = chapterPages[idx];
        }
      });
    }
    onSharePanel(bestUrl, chapter.chapterNumber);
  };

  const isBoostActive = stats.boostExpiresAt !== null && Date.now() < stats.boostExpiresAt;
  const pointsToEarn = isBoostActive ? book.pointsPerChapter * 2 : book.pointsPerChapter;

  const goToNextPage = () => {
    if (pageIndex < chapterPages.length - 1) {
      setPageIndex(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  // Auto-fetch real chapters if book was opened without pre-loaded chapters
  useEffect(() => {
    if ((!book.chapters || book.chapters.length === 0) && book.id) {
      setIsPagesLoading(true);
      fetch(`/api/manga/chapters?mangaId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}`)
        .then(res => res.json())
        .then(data => {
          if (data.chapters && data.chapters.length > 0) {
            setActiveBook({ ...book, chapters: data.chapters }, chapterIndex);
          }
        })
        .catch(err => console.error('Error fetching manga chapters in reader:', err))
        .finally(() => setIsPagesLoading(false));
    }
  }, [book, chapterIndex, setActiveBook]);

  const prevChapterIdxRef = useRef<number>(chapterIndex);

  // Reset reading progress and scroll to top ONLY on actual chapter change
  useEffect(() => {
    if (prevChapterIdxRef.current !== chapterIndex) {
      prevChapterIdxRef.current = chapterIndex;
      window.scrollTo(0, 0);
      setPageIndex(0);
    }
  }, [chapterIndex]);

  // Fetch chapter pages when chapter changes or content is missing
  const chapterId = chapter?.id;
  const chapterNumber = chapter?.chapterNumber ?? (chapterIndex + 1);
  const chapterContent = chapter?.content;

  useEffect(() => {
    const hasValidContent =
      chapterContent &&
      chapterContent.length > 0 &&
      !chapterContent.some(url => typeof url === 'string' && url.includes('unsplash.com'));

    if (hasValidContent && chapterContent) {
      setChapterPages(chapterContent);
      return;
    }

    if (chapterId && chapterId !== 'preview') {
      setIsPagesLoading(true);
      fetch(`/api/manga/pages?chapterId=${encodeURIComponent(chapterId)}&title=${encodeURIComponent(book.title)}&chapterNumber=${chapterNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data.pages && data.pages.length > 0) {
            setChapterPages(data.pages);
            try {
              const cacheKey = `readverse_book_${book.id}`;
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.chapters && parsed.chapters[chapterIndex]) {
                  parsed.chapters[chapterIndex].content = data.pages;
                  localStorage.setItem(cacheKey, JSON.stringify(parsed));
                }
              }
            } catch {}
          }
        })
        .catch(err => console.error('Error fetching pages:', err))
        .finally(() => setIsPagesLoading(false));
    }
  }, [chapterId, chapterNumber, chapterContent, book.id, book.title, chapterIndex]);


  // Keyboard navigation for paged mode
  useEffect(() => {
    if (readerMode !== 'paged') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (readingDirection === 'rtl') {
          goToPreviousPage();
        } else {
          goToNextPage();
        }
      } else if (e.key === 'ArrowLeft') {
        if (readingDirection === 'rtl') {
          goToNextPage();
        } else {
          goToPreviousPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleClaimPoints = () => {
    tracker.claimPoints(book.pointsPerChapter);
  };

  const detectInitialSource = (): string => {
    if (book.chapters && book.chapters.length > 0) {
      const chId = book.chapters[0].id || '';
      if (chId.startsWith('tcb-')) return 'tcbscans';
      if (chId.startsWith('fc-')) return 'flamecomics';
      if (chId.startsWith('tg-')) return 'toongod';
      if (chId.startsWith('mb-')) return 'manhwabuddy';
      if (chId.startsWith('md-')) return 'mangadistrict';
      if (chId.startsWith('mk-')) return 'mangakatana';
      if (chId.startsWith('wt-')) return 'webtoons';
      if (chId.startsWith('wc-') || chId.length === 24) return 'weebcentral';
      if (/^[0-9a-f]{8}-/i.test(chId)) return 'mangadex';
    }
    return MANGA_SOURCES[0].id;
  };

  const [currentSourceId, setCurrentSourceId] = useState<string>(detectInitialSource);
  const [currentSourceName, setCurrentSourceName] = useState<string>(() => {
    const init = detectInitialSource();
    return MANGA_SOURCES.find(s => s.id === init)?.name || MANGA_SOURCES[0].name;
  });
  const [isSwitchingSource, setIsSwitchingSource] = useState(false);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
  const [sourceToast, setSourceToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning' } | null>(null);

  const handleSelectCandidateVersion = async (candidate: SourceCandidate) => {
    setIsSwitchingSource(true);
    setSourceToast({ message: `Loading chapters from ${candidate.sourceName}...`, type: 'info' });

    try {
      const res = await fetch(
        `/api/manga/chapters?mangaId=${encodeURIComponent(candidate.id)}&title=${encodeURIComponent(candidate.title)}&source=${encodeURIComponent(candidate.sourceId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.chapters && data.chapters.length > 0) {
          const currentChNum = chapter?.chapterNumber ?? (chapterIndex + 1);
          const matchedIdx = data.chapters.findIndex((c: Chapter) => c.chapterNumber === currentChNum);
          const newIdx = matchedIdx !== -1 ? matchedIdx : Math.min(chapterIndex, data.chapters.length - 1);

          setCurrentSourceId(candidate.sourceId);
          const resolvedName = data.sourceName || candidate.sourceName;
          setCurrentSourceName(resolvedName);
          setChapterPages([]);
          setPageIndex(0);

          const updatedBook: Book = {
            ...book,
            title: candidate.title || book.title,
            chapters: data.chapters
          };
          setActiveBook(updatedBook, newIdx);
          try {
            localStorage.setItem(`readverse_book_${book.id}`, JSON.stringify(updatedBook));
          } catch {}
          onChapterChange(newIdx);

          setSourceToast({ message: `Switched source to ${resolvedName}`, type: 'success' });
          setTimeout(() => setSourceToast(null), 3500);
          return;
        }
      }
      throw new Error('No chapters returned from source');
    } catch (err) {
      console.warn(`Error switching to candidate version ${candidate.id}:`, err);
      setSourceToast({ message: `Could not load chapters from ${candidate.sourceName}`, type: 'warning' });
      setTimeout(() => setSourceToast(null), 3000);
      throw err;
    } finally {
      setIsSwitchingSource(false);
    }
  };

  const handleSwitchNextSource = async () => {
    if (isSwitchingSource) return;
    setIsSwitchingSource(true);

    let currIdx = MANGA_SOURCES.findIndex(s => s.id === currentSourceId);
    if (currIdx === -1) currIdx = 0;

    let found = false;
    for (let step = 1; step <= MANGA_SOURCES.length; step++) {
      const nextCandidate = MANGA_SOURCES[(currIdx + step) % MANGA_SOURCES.length];
      setSourceToast({ message: `Switching to ${nextCandidate.name}...`, type: 'info' });

      try {
        const res = await fetch(
          `/api/manga/chapters?mangaId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}&source=${encodeURIComponent(nextCandidate.id)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            const currentChNum = chapter?.chapterNumber ?? (chapterIndex + 1);
            const matchedIdx = data.chapters.findIndex((c: Chapter) => c.chapterNumber === currentChNum);
            const newIdx = matchedIdx !== -1 ? matchedIdx : Math.min(chapterIndex, data.chapters.length - 1);

            setCurrentSourceId(nextCandidate.id);
            const resolvedName = data.sourceName || nextCandidate.name;
            setCurrentSourceName(resolvedName);
            setChapterPages([]);
            setPageIndex(0);

            const updatedBook: Book = { ...book, chapters: data.chapters };
            setActiveBook(updatedBook, newIdx);
            try {
              localStorage.setItem(`readverse_book_${book.id}`, JSON.stringify(updatedBook));
            } catch {}
            onChapterChange(newIdx);

            setSourceToast({ message: `Switched source to ${resolvedName}`, type: 'success' });
            setTimeout(() => setSourceToast(null), 3500);
            found = true;
            break;
          }
        }
      } catch (err) {
        console.warn(`Error switching to source ${nextCandidate.id}:`, err);
      }
    }

    if (!found) {
      setSourceToast({ message: 'No alternative sources responded for this title', type: 'warning' });
      setTimeout(() => setSourceToast(null), 3000);
    }

    setIsSwitchingSource(false);
  };

  const currentImage = chapterPages[pageIndex] || null;

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-between relative ${currentTheme.classes}`}>
      {/* Dynamic Source Switch Toast Notification */}
      {sourceToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-zinc-900/95 text-white border border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{sourceToast.message}</span>
        </div>
      )}
      {/* Discreet Floating Back Button */}
      <button
        onClick={onBack}
        title="Back to Book Overview"
        className={`fixed top-3.5 left-3.5 z-50 p-2.5 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all duration-200 cursor-pointer ${currentTheme.backButtonClasses}`}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Main Manga/Webtoon Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full">
        {isPagesLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">
              Streaming high-resolution pages...
            </p>
          </div>
        ) : chapterPages.length === 0 ? (
          <div className="text-xs text-zinc-500 py-16">
            No pages found for this chapter.
          </div>
        ) : (
          /* Main Panel Wrapper with option pile pinned directly next to panel at top */
          <div className={`relative w-full ${PANEL_WIDTHS[widthIndex].maxWidthClass} transition-all duration-300 flex flex-col items-center`}>
            {/* Option pile pinned comfortably next to panel at top */}
            <aside className="fixed right-3 sm:right-4 top-3.5 z-50 lg:absolute lg:left-[calc(100%+32px)] xl:left-[calc(100%+48px)] lg:right-auto lg:top-0 lg:h-full lg:pointer-events-none">
              <div className="lg:sticky lg:top-4 lg:pointer-events-auto">
                <div className={`flex flex-col items-center justify-center gap-2 p-1.5 sm:p-2 rounded-full backdrop-blur-2xl transition-all duration-300 ${currentTheme.pillClasses}`}>
                  {/* 1. Make Panel Larger */}
                  <button
                    onClick={() => handleResizePanel('larger')}
                    disabled={widthIndex >= PANEL_WIDTHS.length - 1}
                    title={`Make Panel Larger (${PANEL_WIDTHS[Math.min(widthIndex + 1, PANEL_WIDTHS.length - 1)].label})`}
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-cyan-500 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                  >
                    <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                    <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                      <span>Make Panel Larger</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                        +
                      </span>
                    </div>
                  </button>

                  {/* 2. Make Panel Smaller */}
                  <button
                    onClick={() => handleResizePanel('smaller')}
                    disabled={widthIndex <= 0}
                    title={`Make Panel Smaller (${PANEL_WIDTHS[Math.max(widthIndex - 1, 0)].label})`}
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-amber-500 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/50 hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                  >
                    <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                    <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                      <span>Make Panel Smaller</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                        -
                      </span>
                    </div>
                  </button>

                  {/* Subtle Divider matching theme */}
                  <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                  {/* 3. Share Memories to Community Feed */}
                  <button
                    onClick={handleShareCurrentPanel}
                    title="Share Memory to Community Feed"
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-rose-500 hover:text-white hover:bg-rose-500/20 hover:border-rose-400/50 hover:shadow-[0_0_18px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                    <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                      <span>Share Memory to Feed</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                        Feed
                      </span>
                    </div>
                  </button>

                  {/* 4. Dictionary & Word Meaning */}
                  <button
                    onClick={handleOpenWordMeaning}
                    title="Dictionary & Vocabulary"
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-violet-500 hover:text-white hover:bg-violet-500/20 hover:border-violet-400/50 hover:shadow-[0_0_18px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                    <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                      <span>Dictionary</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono">
                        Def
                      </span>
                    </div>
                  </button>

                  {/* Subtle Divider matching theme */}
                  <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                  {/* 5. Switch to Next Source / Browse Versions */}
                  <button
                    onClick={() => setIsSourcePickerOpen(true)}
                    disabled={isSwitchingSource}
                    title={`Switch Source & Browse Versions (Current: ${currentSourceName})`}
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-emerald-500 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_18px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                  >
                    {isSwitchingSource ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-emerald-500" />
                    ) : (
                      <Radio className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" />
                    )}
                    <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                      <span>Switch Source &amp; Versions</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                        {currentSourceName}
                      </span>
                    </div>
                  </button>

                  {/* Subtle Divider matching theme */}
                  <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                  {/* 6. Theme Cycler (Direct click to cycle through themes) */}
                  <button
                    onClick={handleCycleTheme}
                    title={`Theme: ${currentTheme.name} (${currentTheme.tag}) - Click to cycle`}
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-purple-500 hover:text-white hover:bg-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                  >
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                    <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                      <span>Theme: {currentTheme.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                        {currentTheme.tag}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </aside>

            {readerMode === 'vertical' ? (
              /* VERTICAL CONTINUOUS SCROLL STRIP (WEBTOON / MANHWA MODE) */
              <div ref={containerRef} data-reader-content="true" className="flex flex-col items-center w-full shadow-2xl rounded-xl overflow-hidden bg-black border border-zinc-800">
            {chapterPages.map((pageUrl, idx) => (
              <React.Fragment key={idx}>
                <div className="relative group w-full bg-black" data-page-index={idx}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pageUrl}
                    alt={`Panel ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-contain block select-none"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/api/manga/image-proxy')) {
                        target.src = `/api/manga/image-proxy?url=${encodeURIComponent(pageUrl)}`;
                      } else {
                        const parent = target.closest('.group');
                        if (parent) {
                          (parent as HTMLElement).style.display = 'none';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => onSharePanel(pageUrl, chapter.chapterNumber)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 backdrop-blur shadow-lg z-10 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clip Panel</span>
                  </button>
                </div>
              </React.Fragment>
            ))}

            {/* End of Chapter Completion Card */}
            <div className="w-full p-6 text-center space-y-4 bg-zinc-900 border-t border-zinc-800">
              <h4 className="font-bold text-white text-base">You reached the end of {chapter.title}!</h4>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={onBack}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
                >
                  ← Back to Overview
                </button>
                {chapterIndex < book.chapters.length - 1 && (
                  <button
                    onClick={() => {
                      onChapterChange(chapterIndex + 1);
                      window.scrollTo(0, 0);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow"
                  >
                    Continue to Chapter {chapterIndex + 2} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* PAGED RTL/LTR MODE */
          <>
            <div
              data-page-index={pageIndex}
              className={`relative group min-h-[400px] max-h-[75vh] w-full ${PANEL_WIDTHS[widthIndex].maxWidthClass} transition-all duration-300 flex items-center justify-center bg-black rounded-xl border border-zinc-800 shadow-2xl overflow-hidden`}
            >
              {currentImage && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImage}
                    alt={`Page ${pageIndex + 1}`}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    className="max-h-[72vh] w-auto object-contain select-none cursor-pointer"
                    onClick={goToNextPage}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/api/manga/image-proxy')) {
                        target.src = `/api/manga/image-proxy?url=${encodeURIComponent(currentImage)}`;
                      } else {
                        target.style.opacity = '0.3';
                      }
                    }}
                  />

                  {/* Snap Panel Button */}
                  <button
                    onClick={() => onSharePanel(currentImage, chapter.chapterNumber)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 backdrop-blur shadow-lg"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clip Page to Feed</span>
                  </button>

                  {/* Nav Overlays for desktop clicking */}
                  <button
                    onClick={readingDirection === 'rtl' ? goToNextPage : goToPreviousPage}
                    className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-4"
                  >
                    <ChevronLeft className="w-8 h-8 text-white drop-shadow" />
                  </button>
                  <button
                    onClick={readingDirection === 'rtl' ? goToPreviousPage : goToNextPage}
                    className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-4"
                  >
                    <ChevronRight className="w-8 h-8 text-white drop-shadow" />
                  </button>
                </>
              )}
            </div>

            {/* Completed Chapter Claim Banner */}
            {chapterPages.length > 0 && pageIndex === chapterPages.length - 1 && (
              <div className="w-full max-w-md my-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 text-center space-y-3">
                <h4 className="font-bold text-white text-sm">Last page reached!</h4>

                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={onBack}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                  >
                    ← Back to Overview
                  </button>
                  {chapterIndex < book.chapters.length - 1 && (
                    <button
                      onClick={() => onChapterChange(chapterIndex + 1)}
                      className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold"
                    >
                      Chapter {chapterIndex + 2} →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
          </div>
        )}
      </main>

      {/* Bottom Navigation Toolbar (for Paged Mode) */}
      {readerMode === 'paged' && (
        <footer className="sticky bottom-0 z-40 w-full border-t border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-2.5 flex items-center justify-between max-w-3xl mx-auto">
          <button
            disabled={pageIndex === 0}
            onClick={goToPreviousPage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Page</span>
          </button>

          {/* Page dots / counter */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-xs no-scrollbar py-1">
            {chapterPages.slice(0, 30).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPageIndex(idx);
                }}
                className={`h-2 rounded-full transition-all shrink-0 ${
                  idx === pageIndex ? 'w-6 bg-amber-400' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          <button
            disabled={pageIndex >= chapterPages.length - 1}
            onClick={goToNextPage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-xs"
          >
            <span>Next Page</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      )}

      {/* Dictionary Modal */}
      <AiWordMeaningModal
        isOpen={isWordMeaningOpen}
        onClose={() => setIsWordMeaningOpen(false)}
        initialWord={selectedWord}
      />

      {/* Source Version Picker Modal */}
      <SourcePickerModal
        isOpen={isSourcePickerOpen}
        onClose={() => setIsSourcePickerOpen(false)}
        book={book}
        currentSourceId={currentSourceId}
        currentSourceName={currentSourceName}
        onSelectCandidate={handleSelectCandidateVersion}
      />
    </div>
  );
};
