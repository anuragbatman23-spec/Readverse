'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  MessageSquare,
  Pin,
  Palette,
  BookOpen
} from 'lucide-react';
import { AiWordMeaningModal } from './AiWordMeaningModal';
import { InPlaceManhwaCropper } from './InPlaceManhwaCropper';
import { ScenePinSystem, ScenePinSpot } from './ScenePinSystem';
import { ReaderTheme, NOVEL_THEMES } from './NovelReader';
import { SourcePickerModal, SourceCandidate } from '../modals/SourcePickerModal';

const MANHWA_SOURCES = [
  { id: 'toongod', name: 'ToonGod' },
  { id: 'mangadistrict', name: 'MangaDistrict' },
  { id: 'flamecomics', name: 'Flame Comics' },
  { id: 'manhwabuddy', name: 'ManhwaBuddy' },
  { id: 'weebcentral', name: 'WeebCentral (HQ)' },
  { id: 'webtoons', name: 'LINE Webtoons' },
  { id: 'mangapill', name: 'MangaPill' },
  { id: 'mangakatana', name: 'MangaKatana' },
  { id: 'mangadex', name: 'MangaDex' },
];

const SOLO_LEVELING_SOURCES = [
  { id: 'sololeveling', name: 'Official Mirror' },
  { id: 'toongod', name: 'ToonGod' },
  { id: 'flamecomics', name: 'Flame Comics' },
  { id: 'manhwabuddy', name: 'ManhwaBuddy' },
  { id: 'weebcentral', name: 'WeebCentral (HQ)' },
  { id: 'webtoons', name: 'LINE Webtoons' },
  { id: 'mangakatana', name: 'MangaKatana' },
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

interface ManhwaReaderProps {
  book: Book;
  chapterIndex: number;
  onBack: () => void;
  onChapterChange: (index: number) => void;
  onSharePanel: (panelUrl: string, chapterNum: number) => void;
}

export const ManhwaReader: React.FC<ManhwaReaderProps> = ({
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

  // Content-proportional anti-cheat focus tracker (100% requirement for manhwa art/drawings)
  // Skip first panel count because it generally has previous story recap or drawings
  const [chapterPages, setChapterPages] = useState<string[]>(chapter?.content || []);
  const effectivePanelsCount = Math.max(1, (chapterPages.length || 30) > 1 ? (chapterPages.length || 30) - 1 : (chapterPages.length || 30));
  const tracker = useReadingFocusTracker({
    bookId: book.id,
    chapterId: chapter.id || chapterIndex,
    chapterTitle: chapter.title,
    category: 'manhwa',
    totalUnits: effectivePanelsCount,
    userEmail: session?.user?.email || undefined,
    onClaimSuccess: (awarded) => {
      awardPoints(awarded || book.pointsPerChapter, `Completed ${book.title} ${chapter.title}`, 'manhwa');
    },
    onAntiCheatAlert: (msg) => {
      triggerAntiCheatWarning(msg);
    }
  });

  const [panelHeights, setPanelHeights] = useState<Record<number, number>>({});
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme state with persistence (separated for manhwa reader)
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    try {
      const saved = localStorage.getItem('readverse_manhwa_theme');
      if (saved && NOVEL_THEMES.some(t => t.id === saved)) {
        return saved as ReaderTheme;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // Sync manhwa theme from user profile data on load
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user/preferences?user=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.manhwaTheme && NOVEL_THEMES.some((t) => t.id === data.manhwaTheme)) {
          setTheme(data.manhwaTheme as ReaderTheme);
          try {
            localStorage.setItem('readverse_manhwa_theme', data.manhwaTheme);
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => console.warn('Failed to load manhwa theme from user preferences:', err));
  }, [session?.user?.email]);

  const handleCycleTheme = () => {
    const currentIndex = NOVEL_THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % NOVEL_THEMES.length;
    const nextTheme = NOVEL_THEMES[nextIndex];
    setTheme(nextTheme.id);
    try {
      localStorage.setItem('readverse_manhwa_theme', nextTheme.id);
    } catch {
      // ignore
    }

    if (session?.user?.email) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session.user.email,
          manhwaTheme: nextTheme.id,
        }),
      }).catch((err) => console.warn('Failed to save manhwa theme to user data:', err));
    }
  };

  const currentTheme = NOVEL_THEMES.find(t => t.id === theme) || NOVEL_THEMES[1];

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

  // In-Place Manhwa Cropper State
  const [isCropMode, setIsCropMode] = useState(false);

  // Scene Pins & Laser Guide Line State
  const [isPinPlacementMode, setIsPinPlacementMode] = useState(false);
  const [showScenePins, setShowScenePins] = useState(true);
  const [scenePins, setScenePins] = useState<ScenePinSpot[]>([]);

  // Helper to compute a chapter key for public syncing and local storage
  const getSceneChapterKey = (ch: Chapter | undefined, chIdx: number): string => {
    if (ch?.id && ch.id !== 'preview') {
      return `ch_${ch.id}`;
    }
    if (ch?.chapterNumber !== undefined && ch.chapterNumber !== null) {
      return `num_${ch.chapterNumber}`;
    }
    return `idx_${chIdx}`;
  };

  const getScenePinsStorageKey = (bookId: string, ch: Chapter | undefined, chIdx: number) => {
    const safeBookId = bookId || 'unknown_book';
    const chapterPart = getSceneChapterKey(ch, chIdx);
    return `readverse_scene_pins_${safeBookId}_${chapterPart}`;
  };

  // Helper to load pins from local cache immediately
  const loadScenePinsFromStorage = (bookId: string, ch: Chapter | undefined, chIdx: number): ScenePinSpot[] => {
    if (typeof window === 'undefined') return [];
    const safeBookId = bookId || 'unknown_book';
    const primaryKey = getScenePinsStorageKey(safeBookId, ch, chIdx);
    try {
      const saved = localStorage.getItem(primaryKey);
      if (saved) {
        return JSON.parse(saved);
      }
      if (ch?.chapterNumber !== undefined && ch.chapterNumber !== null) {
        const legacyKey = `readverse_scene_pins_${safeBookId}_ch${ch.chapterNumber}`;
        const legacySaved = localStorage.getItem(legacyKey);
        if (legacySaved) {
          return JSON.parse(legacySaved);
        }
      }
    } catch {
      // ignore
    }
    return [];
  };

  // Load pins strictly per book/chapter: instantaneous local cache + background server sync
  useEffect(() => {
    const localPins = loadScenePinsFromStorage(book.id, chapter, chapterIndex);
    setScenePins(localPins);

    const chapterKey = getSceneChapterKey(chapter, chapterIndex);
    const userEmail = session?.user?.email || undefined;
    const url = `/api/scene-pins?bookId=${encodeURIComponent(book.id)}&chapterKey=${encodeURIComponent(chapterKey)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;

    let isMounted = true;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.pins)) {
          setScenePins(data.pins);
          try {
            const storageKey = getScenePinsStorageKey(book.id, chapter, chapterIndex);
            localStorage.setItem(storageKey, JSON.stringify(data.pins));
          } catch {
            // ignore
          }
        }
      })
      .catch(err => console.warn('Failed syncing scene pins from server:', err));

    return () => {
      isMounted = false;
    };
  }, [book.id, chapter?.id, chapter?.chapterNumber, chapterIndex, session?.user?.email]);

  const currentUserAvatar =
    (typeof window !== 'undefined' && session?.user?.email && localStorage.getItem(`readverse_custom_avatar_${session.user.email}`)) ||
    (typeof window !== 'undefined' && localStorage.getItem('readverse_custom_avatar')) ||
    session?.user?.image ||
    '';

  const handleAddCommentToSpot = (panelIndex: number, yPercent: number, text: string) => {
    const author = session?.user?.name || session?.user?.email?.split('@')[0] || 'reader';
    const userEmail = session?.user?.email || undefined;
    const newComment = {
      id: `c-${Date.now()}`,
      author,
      avatarUrl: currentUserAvatar || undefined,
      text,
      likes: 1,
      isLiked: true,
      createdAt: 'Just now'
    };

    // Optimistic UI update
    setScenePins(prev => {
      // Check if there is an existing spot within 4% of this height on the same panel
      const existingSpotIndex = prev.findIndex(
        p => p.panelIndex === panelIndex && Math.abs(p.yPercent - yPercent) < 4
      );

      let updated: ScenePinSpot[];
      if (existingSpotIndex !== -1) {
        updated = [...prev];
        updated[existingSpotIndex] = {
          ...updated[existingSpotIndex],
          comments: [newComment, ...updated[existingSpotIndex].comments]
        };
      } else {
        const newSpot: ScenePinSpot = {
          id: `spot-${Date.now()}`,
          panelIndex,
          yPercent,
          comments: [newComment]
        };
        updated = [...prev, newSpot];
      }

      const storageKey = getScenePinsStorageKey(book.id, chapter, chapterIndex);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Sync to shared backend database so all users can see it
    const chapterKey = getSceneChapterKey(chapter, chapterIndex);
    fetch('/api/scene-pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        bookId: book.id,
        chapterKey,
        panelIndex,
        yPercent,
        text,
        author,
        avatarUrl: currentUserAvatar || undefined,
        userEmail
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.pins)) {
          setScenePins(data.pins);
          const storageKey = getScenePinsStorageKey(book.id, chapter, chapterIndex);
          localStorage.setItem(storageKey, JSON.stringify(data.pins));
        }
      })
      .catch(err => console.warn('Failed saving scene pin to server:', err));
  };

  const handleToggleLike = (spotId: string, commentId: string) => {
    const userEmail = session?.user?.email || undefined;

    // Optimistic UI update
    setScenePins(prev => {
      const updated = prev.map(spot => {
        if (spot.id !== spotId) return spot;
        return {
          ...spot,
          comments: spot.comments.map(c => {
            if (c.id !== commentId) return c;
            const isLiked = !c.isLiked;
            const likes = isLiked ? c.likes + 1 : Math.max(0, c.likes - 1);
            return { ...c, isLiked, likes };
          })
        };
      });

      const storageKey = getScenePinsStorageKey(book.id, chapter, chapterIndex);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Sync like state to server
    const chapterKey = getSceneChapterKey(chapter, chapterIndex);
    fetch('/api/scene-pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'like',
        bookId: book.id,
        chapterKey,
        spotId,
        commentId,
        userEmail
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.pins)) {
          setScenePins(data.pins);
          const storageKey = getScenePinsStorageKey(book.id, chapter, chapterIndex);
          localStorage.setItem(storageKey, JSON.stringify(data.pins));
        }
      })
      .catch(err => console.warn('Failed syncing like to server:', err));
  };

  const handleShareCurrentPanel = () => {
    setIsCropMode(true);
  };

  const isBoostActive = stats.boostExpiresAt !== null && Date.now() < stats.boostExpiresAt;
  const pointsToEarn = isBoostActive ? book.pointsPerChapter * 2 : book.pointsPerChapter;

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
        .catch(err => console.error('Error fetching manhwa chapters in reader:', err))
        .finally(() => setIsPagesLoading(false));
    }
  }, [book, chapterIndex, setActiveBook]);

  const prevChapterIdxRef = useRef<number>(chapterIndex);

  // Reset reading progress and scroll to top ONLY on actual chapter change
  useEffect(() => {
    if (prevChapterIdxRef.current !== chapterIndex) {
      prevChapterIdxRef.current = chapterIndex;
      window.scrollTo(0, 0);
      setPanelHeights({});
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

  const handleClaimPoints = () => {
    tracker.claimPoints(book.pointsPerChapter);
  };

  const isSoloLeveling = Boolean(
    book.id === '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0' ||
    book.id === 'solo-sovereign' ||
    book.title?.toLowerCase().includes('solo leveling')
  );

  const availableSourcesList = isSoloLeveling ? SOLO_LEVELING_SOURCES : MANHWA_SOURCES;

  const detectInitialSource = (): string => {
    if (book.chapters && book.chapters.length > 0) {
      const chId = book.chapters[0].id || '';
      if (chId.startsWith('sl-')) return 'sololeveling';
      if (chId.startsWith('tg-')) return 'toongod';
      if (chId.startsWith('fc-')) return 'flamecomics';
      if (chId.startsWith('mb-')) return 'manhwabuddy';
      if (chId.startsWith('md-')) return 'mangadistrict';
      if (chId.startsWith('tcb-')) return 'tcbscans';
      if (chId.startsWith('wt-')) return 'webtoons';
      if (chId.startsWith('mk-')) return 'mangakatana';
      if (chId.startsWith('wc-') || chId.length === 24) return 'weebcentral';
      if (/^[0-9a-f]{8}-/i.test(chId)) return 'mangadex';
    }
    return availableSourcesList[0].id;
  };

  const [currentSourceId, setCurrentSourceId] = useState<string>(detectInitialSource);
  const [currentSourceName, setCurrentSourceName] = useState<string>(() => {
    const init = detectInitialSource();
    return availableSourcesList.find(s => s.id === init)?.name || availableSourcesList[0].name;
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

    let currIdx = availableSourcesList.findIndex(s => s.id === currentSourceId);
    if (currIdx === -1) currIdx = 0;

    let found = false;
    for (let step = 1; step <= availableSourcesList.length; step++) {
      const nextCandidate = availableSourcesList[(currIdx + step) % availableSourcesList.length];
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

  return (
    <div className={`min-h-screen flex flex-col items-center relative transition-colors duration-300 ${currentTheme.classes}`}>
      {/* Dynamic Source Switch Toast Notification */}
      {sourceToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-zinc-900/95 text-white border border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{sourceToast.message}</span>
        </div>
      )}

      {/* Laser Pin Mode Active Notification */}
      {isPinPlacementMode && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-zinc-950/95 text-white border border-cyan-400 shadow-[0_10px_35px_rgba(6,182,212,0.6)] backdrop-blur-md text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Hover over any panel scene & click to pin a comment line</span>
          </div>
          <button
            onClick={() => setIsPinPlacementMode(false)}
            className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px] uppercase font-mono cursor-pointer"
          >
            Cancel (Esc)
          </button>
        </div>
      )}
      {/* Discreet Floating Back Button */}
      <button
        onClick={onBack}
        title="Back to Book Overview"
        className={`fixed top-3.5 left-3.5 z-50 p-2.5 rounded-full backdrop-blur-md shadow-lg active:scale-95 transition-all duration-200 cursor-pointer ${currentTheme.backButtonClasses}`}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Main Manhwa Strip Container */}
      <main ref={containerRef} data-reader-content="true" className={`relative w-full ${PANEL_WIDTHS[widthIndex].maxWidthClass} transition-all duration-300 flex flex-col items-center py-4 px-2 sm:px-0`}>
        {/* Option pile pinned just next to panel at top */}
        <aside className="fixed right-3 top-3.5 z-50 lg:absolute lg:left-[calc(100%+64px)] lg:right-auto lg:top-0 lg:h-full lg:pointer-events-none">
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

              {/* 5. Pin Thought to Scene (Laser Line Mode) */}
              <button
                onClick={() => setIsPinPlacementMode(!isPinPlacementMode)}
                title={isPinPlacementMode ? "Cancel Pin Mode" : "Pin Comment to Scene (Drop Line)"}
                className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm cursor-pointer ${
                  isPinPlacementMode
                    ? 'bg-cyan-500 text-zinc-950 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-110'
                    : `text-cyan-500 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/50 ${currentTheme.pillButtonClasses}`
                }`}
              >
                <Pin className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 ${isPinPlacementMode ? 'fill-current' : ''}`} />
                <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                  <span>{isPinPlacementMode ? 'Cancel Pin' : 'Pin to Scene'}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                    Line
                  </span>
                </div>
              </button>

              {/* 6. Toggle Scene Pins Visibility */}
              <button
                onClick={() => setShowScenePins(!showScenePins)}
                title={`Toggle Scene Comments (${showScenePins ? 'Visible' : 'Hidden'})`}
                className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm cursor-pointer ${
                  showScenePins
                    ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : `text-zinc-400 hover:text-white hover:bg-white/10 ${currentTheme.pillButtonClasses}`
                }`}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                  <span>Scene Notes</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    showScenePins ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {showScenePins ? 'ON' : 'OFF'}
                  </span>
                </div>
              </button>

              {/* Subtle Divider matching theme */}
              <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

              {/* 7. Switch to Next Source / Browse Versions */}
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

              {/* 8. Theme Cycler (Direct click to cycle through themes) */}
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

        {/* Vertical Panels */}
        <div className="w-full flex flex-col shadow-2xl overflow-visible rounded-t-lg bg-black">
          {isPagesLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-zinc-400 font-mono">
                Streaming high-res chapter panels from verified mirror...
              </p>
            </div>
          ) : chapterPages.length === 0 ? (
            <div className="py-20 text-center text-xs text-zinc-500">
              No panels available for this chapter yet.
            </div>
          ) : (
            chapterPages.map((imageUrl, idx) => (
              <React.Fragment key={idx}>
                <div className="relative group w-full" data-panel-index={idx}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`Panel ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover select-none"
                    loading={idx < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={(e) => {
                      const h = e.currentTarget.naturalHeight || e.currentTarget.clientHeight;
                      if (h > 0) {
                        setPanelHeights(prev => (prev[idx] === h ? prev : { ...prev, [idx]: h }));
                      }
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/api/manga/image-proxy')) {
                        target.src = `/api/manga/image-proxy?url=${encodeURIComponent(imageUrl)}`;
                      } else {
                        const parent = target.closest('.group');
                        if (parent) {
                          (parent as HTMLElement).style.display = 'none';
                        }
                      }
                    }}
                  />

                  {/* Scene Pin System: Laser guide line + right-edge floating avatar bubbles */}
                  <ScenePinSystem
                    panelIndex={idx}
                    pins={scenePins.filter(p => p.panelIndex === idx)}
                    isVisible={showScenePins}
                    isPinPlacementActive={isPinPlacementMode}
                    onAddCommentToSpot={handleAddCommentToSpot}
                    onToggleLike={handleToggleLike}
                    onExitPlacementMode={() => setIsPinPlacementMode(false)}
                    currentUserAvatar={currentUserAvatar}
                    currentUserName={session?.user?.name || undefined}
                  />
                </div>
              </React.Fragment>
            ))
          )}
        </div>

        {/* End of Chapter Action Section */}
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 my-6 text-center space-y-4">
          <h3 className="text-lg font-bold text-white">
            You finished {chapter.title}!
          </h3>

          <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-all"
              >
                ← Back to Overview
              </button>
              {chapterIndex < (book.chapters?.length || 1) - 1 && (
                <button
                  onClick={() => {
                    onChapterChange(chapterIndex + 1);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold text-xs shadow hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <span>Continue to Chapter {chapterIndex + 2}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Chapter Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs">
            <button
              disabled={chapterIndex === 0}
              onClick={() => {
                onChapterChange(chapterIndex - 1);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Chapter</span>
            </button>

            <span className="text-zinc-500 font-mono">
              Ch {chapterIndex + 1} of {book.chapters?.length || 1}
            </span>

            <button
              disabled={chapterIndex >= (book.chapters?.length || 1) - 1}
              onClick={() => {
                onChapterChange(chapterIndex + 1);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span>Next Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
      </main>

      {/* Dictionary Modal */}
      <AiWordMeaningModal
        isOpen={isWordMeaningOpen}
        onClose={() => setIsWordMeaningOpen(false)}
        initialWord={selectedWord}
      />

      {/* In-Place Manhwa Cropper: Crop right on top of live reading view */}
      <InPlaceManhwaCropper
        isOpen={isCropMode}
        onClose={() => setIsCropMode(false)}
        onConfirmCrop={(croppedUrl) => {
          setIsCropMode(false);
          onSharePanel(croppedUrl, chapter.chapterNumber);
        }}
        containerRef={containerRef}
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
