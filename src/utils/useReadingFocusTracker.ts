import { useState, useEffect, useRef, useCallback } from 'react';
import { ContentCategory } from '@/types';

export interface ReadingFocusTrackerOptions {
  bookId: string;
  chapterId: string | number;
  chapterTitle?: string;
  category: ContentCategory;
  totalUnits: number; // total panels for manhwa, total pages for manga, total paragraphs for novels
  paragraphs?: string[]; // text paragraphs for webnovels/lightnovels/books
  wordCount?: number;
  userEmail?: string;
  currentPageIndex?: number; // for paged manga mode
  onClaimSuccess?: (pointsAwarded: number, newStats: Record<string, unknown>) => void;
  onAntiCheatAlert?: (message: string) => void;
}

export interface ReadingFocusTrackerState {
  sessionId: string | null;
  sessionToken: string | null;
  baseSliceLengthPx: number; // exact 33% frame length precalculated in zoomed-out condition
  totalChapterSlices: number; // total 33% slices across entire chapter
  verifiedSlicesCount: number; // sequential slices that have reached >= required dwell
  unreadUpperSliceIndex: number; // the current reading frontier slice
  isUpperSkipped: boolean; // true if user scrolled down leaving an upper slice unread
  totalChunksEncountered: number;
  calculatedRequiredSeconds: number; // dynamically calculated required reading seconds
  minRequiredSeconds: number; // alias to calculatedRequiredSeconds
  activeReadingSeconds: number; // actual time taken by user
  scrollDepthPercent: number;
  coveragePercent: number;
  interactionCount: number;
  isIdle: boolean;
  isVerifiedReady: boolean;
  hasClaimed: boolean;
  isClaiming: boolean;
  verificationProgressPercent: number;
  zoomScale: number;
  // Novel truth reading metrics (150 WPM)
  verifiedWordsCount: number;
  totalChapterWords: number;
  wordsInFrontCount: number;
  wordsScrolledUpCount: number;
  isWaitingForScroll?: boolean;
  claimPoints: (customPoints?: number) => Promise<void>;
}

export function useReadingFocusTracker({
  bookId,
  chapterId,
  chapterTitle,
  category,
  totalUnits,
  paragraphs,
  wordCount,
  userEmail,
  currentPageIndex,
  onClaimSuccess,
  onAntiCheatAlert
}: ReadingFocusTrackerOptions) {
  const isTextCategory = category === 'webnovel' || category === 'lightnovel' || category === 'book';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Frame slice length pre-calculated in zoomed-out condition (50% for manhwa, 33% for manga)
  const defaultSliceLength = category === 'manhwa' ? 400 : 264;
  const [baseSliceLengthPx, setBaseSliceLengthPx] = useState<number>(defaultSliceLength);
  const [totalChapterSlices, setTotalChapterSlices] = useState<number>(10);
  const [verifiedSlicesCount, setVerifiedSlicesCount] = useState<number>(0);
  const [unreadUpperSliceIndex, setUnreadUpperSliceIndex] = useState<number>(0);
  const [isUpperSkipped, setIsUpperSkipped] = useState<boolean>(false);
  const [totalChunksEncountered, setTotalChunksEncountered] = useState<number>(1);
  const [calculatedRequiredSeconds, setCalculatedRequiredSeconds] = useState<number>(15);
  const [activeReadingSeconds, setActiveReadingSeconds] = useState<number>(0);
  const [scrollDepthPercent, setScrollDepthPercent] = useState<number>(0);
  const [coveragePercent, setCoveragePercent] = useState<number>(0);
  const [interactionCount, setInteractionCount] = useState<number>(0);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Novel Truth Reading state (150 WPM = 2.5 words/second)
  const [verifiedWordsCount, setVerifiedWordsCount] = useState<number>(0);
  const [totalChapterWords, setTotalChapterWords] = useState<number>(0);
  const [wordsInFrontCount, setWordsInFrontCount] = useState<number>(0);
  const [wordsScrolledUpCount, setWordsScrolledUpCount] = useState<number>(0);
  const [isWaitingForScroll, setIsWaitingForScroll] = useState<boolean>(false);

  // References for mutable state inside intervals & listeners
  const lastInteractionRef = useRef<number>(Date.now());
  const interactionCountRef = useRef<number>(0);
  const activeReadingSecondsRef = useRef<number>(0);
  const seenFocusChunksRef = useRef<Set<number>>(new Set([0]));
  const seenPagesRef = useRef<Set<number>>(new Set([0]));

  // Novel & text tracking (150 WPM = 2.5 words/second)
  const paragraphWordsRef = useRef<number[]>([]);
  const totalWordsInChapterRef = useRef<number>(0);
  const paragraphDwellMapRef = useRef<Map<number, number>>(new Map());
  const novelFrontierRef = useRef<number>(0);

  // Compute paragraph words whenever paragraphs change
  useEffect(() => {
    if (!paragraphs || paragraphs.length === 0) {
      paragraphWordsRef.current = [];
      totalWordsInChapterRef.current = 0;
      setTotalChapterWords(0);
      return;
    }
    const counts = paragraphs.map(p => {
      const words = p.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(1, words);
    });
    paragraphWordsRef.current = counts;
    const total = counts.reduce((sum, n) => sum + n, 0);
    totalWordsInChapterRef.current = total;
    setTotalChapterWords(total);
    if (isTextCategory) {
      setTotalChapterSlices(total);
      const reqSec = Math.max(15, Math.round(total / 2.5));
      calculatedSecondsRef.current = reqSec;
      setCalculatedRequiredSeconds(reqSec);
    }
  }, [paragraphs, isTextCategory]);
  
  // Sequential reading frontier: the earliest slice that has NOT yet reached required dwell
  const sequentialFrontierRef = useRef<number>(0);
  const sliceDwellTimesRef = useRef<Map<number, number>>(new Map());
  const pagedFrontierRef = useRef<number>(0);
  const pagedDwellMapRef = useRef<Map<number, number>>(new Map());
  const skippedStartSlicesRef = useRef<number>(0); // Slices skipped at start (panel 0 for manhwa, page 0 for manga)
  const skippedEndSlicesRef = useRef<number>(0);   // Slices skipped at end (last page for manga)

  const maxScrollDepthRef = useRef<number>(0);
  const calculatedSecondsRef = useRef<number>(15);
  const isClaimingRef = useRef<boolean>(false);

  // Anchors for zoomed-out base coordinates
  const baseSliceLengthRef = useRef<number>(defaultSliceLength);
  const baseContentWidthRef = useRef<number>(672);
  const baseContentHeightRef = useRef<number>(0);

  // Register user interaction
  const registerInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    interactionCountRef.current += 1;
    setInteractionCount(interactionCountRef.current);
    setIsIdle(false);
  }, []);

  // Precalculate the 33% frame length in zoomed-out condition beforehand when chapter initializes
  useEffect(() => {
    let isMounted = true;
    setSessionId(null);
    setSessionToken(null);
    setActiveReadingSeconds(0);
    setScrollDepthPercent(0);
    setCoveragePercent(0);
    setInteractionCount(0);
    setIsIdle(false);
    setHasClaimed(false);
    setCalculatedRequiredSeconds(15);
    setTotalChunksEncountered(1);
    setVerifiedSlicesCount(0);
    setVerifiedWordsCount(0);
    setWordsScrolledUpCount(0);
    setWordsInFrontCount(0);
    setUnreadUpperSliceIndex(0);
    setIsUpperSkipped(false);
    setIsWaitingForScroll(false);
    setZoomScale(1.0);

    activeReadingSecondsRef.current = 0;
    interactionCountRef.current = 0;
    sequentialFrontierRef.current = 0;
    pagedFrontierRef.current = 0;
    skippedStartSlicesRef.current = 0;
    skippedEndSlicesRef.current = 0;
    seenFocusChunksRef.current = new Set([0]);
    seenPagesRef.current = new Set([0]);
    sliceDwellTimesRef.current = new Map();
    pagedDwellMapRef.current = new Map();
    paragraphDwellMapRef.current = new Map();
    novelFrontierRef.current = 0;
    maxScrollDepthRef.current = 0;
    calculatedSecondsRef.current = 15;
    lastInteractionRef.current = Date.now();

    if (typeof window !== 'undefined') {
      const baseFrameHeight = window.innerHeight || 800;
      const sliceRatio = category === 'manhwa' ? 0.50 : 0.33;
      const exactSliceLength = Math.max(160, Math.round(baseFrameHeight * sliceRatio));
      baseSliceLengthRef.current = exactSliceLength;
      setBaseSliceLengthPx(exactSliceLength);

      const containerEl = document.querySelector('[data-reader-content="true"]') || document.querySelector('main');
      const baseW = containerEl ? containerEl.clientWidth : Math.min(window.innerWidth, 672);
      baseContentWidthRef.current = Math.max(320, baseW);
    }

    const units = Math.max(1, totalUnits || 1);

    fetch('/api/reading-session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: String(bookId),
        chapterId: String(chapterId),
        chapterTitle: chapterTitle || '',
        category,
        pageCount: units,
        wordCount,
        userEmail
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setSessionId(data.sessionId);
          setSessionToken(data.sessionToken);
          if (data.isAlreadyClaimed) {
            setHasClaimed(true);
          }
        }
      })
      .catch(err => console.warn('Failed to start reading session:', err));

    return () => {
      isMounted = false;
    };
  }, [bookId, chapterId, category, totalUnits, userEmail, chapterTitle]);

  // Zoom-Invariant 33% Content Slice Focus Tracker (Manga/Manhwa) & Live 150 WPM Truth Reading Tracker (Novels)
  const evaluateFocusSlices = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Novel / Text Format Live Rate Tracker (150 WPM = 2.5 words/second)
    if (isTextCategory) {
      const vh = window.innerHeight || 800;
      const pEls = document.querySelectorAll('[data-paragraph-index]');
      const wordsList = paragraphWordsRef.current;
      const totalWords = totalWordsInChapterRef.current || wordsList.reduce((a, b) => a + b, 0) || 1;
      setTotalChapterWords(totalWords);
      setTotalChapterSlices(totalWords);

      const totalReqSeconds = Math.max(15, Math.round(totalWords / 2.5));
      calculatedSecondsRef.current = totalReqSeconds;
      setCalculatedRequiredSeconds(totalReqSeconds);

      let scrolledUpWords = 0;
      let inFrontWords = 0;
      let minVisibleIdx = -1;
      let maxVisibleIdx = -1;

      pEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const idx = parseInt(el.getAttribute('data-paragraph-index') || '-1', 10);
        if (idx < 0) return;
        const w = wordsList[idx] || 15;

        if (rect.bottom <= 0) {
          // Paragraph has scrolled up past the top of the screen (not in focus anymore)
          scrolledUpWords += w;
        } else if (rect.top < vh) {
          // Paragraph is currently in front of the user (in viewport)
          inFrontWords += w;
          if (minVisibleIdx === -1 || idx < minVisibleIdx) minVisibleIdx = idx;
          if (idx > maxVisibleIdx) maxVisibleIdx = idx;
        }
      });

      setWordsScrolledUpCount(scrolledUpWords);
      setWordsInFrontCount(inFrontWords);

      const currentScrollY = window.scrollY || 0;
      const scrollHeight = (document.documentElement.scrollHeight || 1) - vh;
      if (scrollHeight > 0) {
        const depth = Math.min(100, Math.round((currentScrollY / scrollHeight) * 100));
        if (depth > maxScrollDepthRef.current) {
          maxScrollDepthRef.current = depth;
          setScrollDepthPercent(depth);
        }
      }

      setTotalChunksEncountered(Math.max(1, maxVisibleIdx + 1));

      const frontier = novelFrontierRef.current;
      const isAtBottom = (scrollHeight > 0 && currentScrollY >= scrollHeight - 40) || (maxVisibleIdx >= wordsList.length - 1 && wordsList.length > 0);

      setIsUpperSkipped(false);
      setUnreadUpperSliceIndex(frontier);
      setIsWaitingForScroll(false);

      // TRUTH READING RULE:
      // Paragraphs up to frontier that have scrolled up (or completed at bottom of page) are Truth Reading!
      let verifiedWords = 0;
      for (let i = 0; i < frontier && i < wordsList.length; i++) {
        const pEl = document.querySelector(`[data-paragraph-index="${i}"]`);
        if (pEl) {
          const rect = pEl.getBoundingClientRect();
          if (rect.bottom <= 0 || (isAtBottom && frontier >= wordsList.length)) {
            verifiedWords += (wordsList[i] || 15);
          }
        } else if (i < minVisibleIdx) {
          verifiedWords += (wordsList[i] || 15);
        }
      }

      if (isAtBottom && frontier >= wordsList.length) {
        verifiedWords = totalWords;
      }

      verifiedWords = Math.min(totalWords, verifiedWords);
      setVerifiedWordsCount(verifiedWords);
      setVerifiedSlicesCount(verifiedWords);
      return;
    }

    const slicePx = baseSliceLengthRef.current;
    if (!slicePx || slicePx <= 0) return;

    const containerEl = document.querySelector('[data-reader-content="true"]') || document.querySelector('main');
    const currentW = containerEl ? containerEl.clientWidth : window.innerWidth;
    const baseW = baseContentWidthRef.current || 672;
    const currentZoom = Math.max(0.2, currentW / baseW);
    setZoomScale(Number(currentZoom.toFixed(2)));

    const currentScrollY = window.scrollY || 0;
    const currentVh = window.innerHeight || 800;
    const scrollHeight = (document.documentElement.scrollHeight || 1) - currentVh;

    if (scrollHeight > 0) {
      const depth = Math.min(100, Math.round((currentScrollY / scrollHeight) * 100));
      if (depth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = depth;
        setScrollDepthPercent(depth);
      }
    }

    const baseContentScrollY = currentScrollY / currentZoom;
    const baseContentViewportH = currentVh / currentZoom;

    const currentTotalContentH = containerEl ? containerEl.clientHeight : document.documentElement.scrollHeight;
    const baseTotalContentH = currentTotalContentH / currentZoom;
    baseContentHeightRef.current = baseTotalContentH;

    const sliceDwellTarget = category === 'manga' ? 1.8 : 1.2;

    // Detect skipped start/end units:
    // - For Manhwa: skip panel 0 recap/drawings
    // - For Manga: skip first and last page count (cover / credits / promo)
    let skippedStartSlices = 0;
    let skippedEndSlices = 0;

    if (category === 'manhwa') {
      const panel1El = document.querySelector('[data-panel-index="1"]') as HTMLElement | null;
      if (panel1El) {
        const basePanel0Height = panel1El.offsetTop / currentZoom;
        skippedStartSlices = Math.max(0, Math.ceil(basePanel0Height / slicePx));
      }
    } else if (category === 'manga') {
      const pageElements = document.querySelectorAll('[data-page-index]');
      if (pageElements.length > 2) {
        // Skip first page (cover / title)
        const page1El = document.querySelector('[data-page-index="1"]') as HTMLElement | null;
        if (page1El) {
          const basePage0Height = page1El.offsetTop / currentZoom;
          skippedStartSlices = Math.max(0, Math.ceil(basePage0Height / slicePx));
        }

        // Skip last page (credits / preview / scanlation outro)
        const lastPageEl = pageElements[pageElements.length - 1] as HTMLElement | null;
        if (lastPageEl) {
          const baseLastPageHeight = lastPageEl.clientHeight / currentZoom;
          skippedEndSlices = Math.max(0, Math.ceil(baseLastPageHeight / slicePx));
        }
      } else if (pageElements.length === 2) {
        // If only 2 pages, skip just first page
        const page1El = document.querySelector('[data-page-index="1"]') as HTMLElement | null;
        if (page1El) {
          const basePage0Height = page1El.offsetTop / currentZoom;
          skippedStartSlices = Math.max(0, Math.ceil(basePage0Height / slicePx));
        }
      }
    }

    if (skippedStartSlices > skippedStartSlicesRef.current) {
      for (let s = 0; s < skippedStartSlices; s++) {
        sliceDwellTimesRef.current.set(s, sliceDwellTarget);
      }
      if (sequentialFrontierRef.current < skippedStartSlices) {
        sequentialFrontierRef.current = skippedStartSlices;
      }
      skippedStartSlicesRef.current = skippedStartSlices;
    }

    if (skippedEndSlices > skippedEndSlicesRef.current) {
      skippedEndSlicesRef.current = skippedEndSlices;
    }

    const rawTotalSlices = Math.max(5, Math.ceil(baseTotalContentH / slicePx));
    const effectiveSkippedStart = skippedStartSlicesRef.current;
    const effectiveSkippedEnd = skippedEndSlicesRef.current;
    const effectiveTotalSlices = Math.max(3, rawTotalSlices - effectiveSkippedStart - effectiveSkippedEnd);
    setTotalChapterSlices(effectiveTotalSlices);

    // Pre-satisfy skipped end slices so reading frontier can complete 100%
    for (let s = rawTotalSlices - effectiveSkippedEnd; s < rawTotalSlices; s++) {
      if (s >= 0) {
        sliceDwellTimesRef.current.set(s, sliceDwellTarget);
      }
    }

    // Dynamic requirement matches active slices: 1.8s for manga, 1.2s for manhwa
    const dynamicRequired = Math.max(15, Math.round(effectiveTotalSlices * sliceDwellTarget));
    calculatedSecondsRef.current = dynamicRequired;
    setCalculatedRequiredSeconds(dynamicRequired);
    setTotalChunksEncountered(effectiveTotalSlices);

    // Check if the user is currently looking below the unread upper slice frontier
    const startSlice = Math.floor(baseContentScrollY / slicePx);
    const frontier = sequentialFrontierRef.current;
    setIsUpperSkipped(false);
    setUnreadUpperSliceIndex(Math.max(0, frontier - effectiveSkippedStart));
    const verified = Math.min(effectiveTotalSlices, Math.max(0, frontier - effectiveSkippedStart));
    setVerifiedSlicesCount(verified);
  }, [category]);

  // Track global user interactions
  useEffect(() => {
    const handleEvent = () => {
      registerInteraction();
      evaluateFocusSlices();
    };

    window.addEventListener('scroll', handleEvent, { passive: true });
    window.addEventListener('resize', handleEvent, { passive: true });
    window.addEventListener('mousemove', handleEvent, { passive: true });
    window.addEventListener('touchstart', handleEvent, { passive: true });
    window.addEventListener('touchmove', handleEvent, { passive: true });
    window.addEventListener('keydown', handleEvent, { passive: true });
    window.addEventListener('click', handleEvent, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleEvent);
      window.removeEventListener('resize', handleEvent);
      window.removeEventListener('mousemove', handleEvent);
      window.removeEventListener('touchstart', handleEvent);
      window.removeEventListener('touchmove', handleEvent);
      window.removeEventListener('keydown', handleEvent);
      window.removeEventListener('click', handleEvent);
    };
  }, [registerInteraction, evaluateFocusSlices]);

  // Reading clock & sequential per-slice dwell attribution:
  // RULE: Bottom slices CANNOT count if any upper slice has not been in user focus for at least 1.2s!
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 15000;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      if (timeSinceLastInteraction > IDLE_TIMEOUT_MS) {
        setIsIdle(true);
        return;
      }

      setIsIdle(false);

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Novel & text format live 150 WPM truth reading cycle
        if (isTextCategory) {
          const vh = window.innerHeight || 800;
          const wordsList = paragraphWordsRef.current;
          const frontier = novelFrontierRef.current;

          // If all paragraphs already completed, nothing more to dwell
          if (frontier >= wordsList.length && wordsList.length > 0) {
            evaluateFocusSlices();
            return;
          }

          const frontierEl = document.querySelector(`[data-paragraph-index="${frontier}"]`);
          if (!frontierEl) {
            evaluateFocusSlices();
            return;
          }

          const frontierRect = frontierEl.getBoundingClientRect();

          setIsUpperSkipped(false);
          setIsWaitingForScroll(false);

          // 150 WPM dwell requirement (2.5 words/second):
          const reqDwell = Math.max(0.4, (wordsList[frontier] || 15) / 2.5);
          const currentDwell = paragraphDwellMapRef.current.get(frontier) || 0;
          const newDwell = currentDwell + 1;
          paragraphDwellMapRef.current.set(frontier, newDwell);

          // Only increment reading seconds when user is genuinely reading visible text!
          activeReadingSecondsRef.current += 1;
          setActiveReadingSeconds(activeReadingSecondsRef.current);

          if (newDwell >= reqDwell) {
            novelFrontierRef.current = frontier + 1;
          }

          evaluateFocusSlices();
          return;
        }

        // For Manga / Manhwa:
        activeReadingSecondsRef.current += 1;
        setActiveReadingSeconds(activeReadingSecondsRef.current);

        const containerEl = document.querySelector('[data-reader-content="true"]') || document.querySelector('main');
        const currentW = containerEl ? containerEl.clientWidth : window.innerWidth;
        const baseW = baseContentWidthRef.current || 672;
        const currentZoom = Math.max(0.2, currentW / baseW);

        const currentScrollY = window.scrollY || 0;
        const currentVh = window.innerHeight || 800;
        const baseContentScrollY = currentScrollY / currentZoom;
        const baseContentViewportH = currentVh / currentZoom;
        const slicePx = baseSliceLengthRef.current;

        const startSlice = Math.floor(baseContentScrollY / slicePx);
        const endSlice = Math.floor((baseContentScrollY + baseContentViewportH) / slicePx);

        // 1. Advance sequential reading frontier as long as slices have completed required dwell (1.8s for manga, 1.2s for manhwa)
        const sliceDwellTarget = category === 'manga' ? 1.8 : 1.2;
        const effectiveSkippedStart = skippedStartSlicesRef.current;
        let frontier = sequentialFrontierRef.current;
        if (frontier < effectiveSkippedStart) {
          frontier = effectiveSkippedStart;
        }
        while ((sliceDwellTimesRef.current.get(frontier) || 0) >= sliceDwellTarget) {
          frontier += 1;
        }
        sequentialFrontierRef.current = frontier;

        const effectiveTotal = Math.max(1, totalChapterSlices);
        const verified = Math.min(effectiveTotal, Math.max(0, frontier - effectiveSkippedStart));
        setUnreadUpperSliceIndex(Math.max(0, frontier - effectiveSkippedStart));
        setVerifiedSlicesCount(verified);

        setIsUpperSkipped(false);
        // Only the active reading frontier slice receives dwell!
        if (startSlice <= frontier && endSlice >= frontier) {
          const prevDwell = sliceDwellTimesRef.current.get(frontier) || 0;
          const newDwell = prevDwell + 1;
          sliceDwellTimesRef.current.set(frontier, newDwell);
          if (newDwell >= sliceDwellTarget) {
            const nextFrontier = frontier + 1;
            sequentialFrontierRef.current = nextFrontier;
            const nextVerified = Math.min(effectiveTotal, Math.max(0, nextFrontier - effectiveSkippedStart));
            setVerifiedSlicesCount(nextVerified);
          }
        }

        // Paged mode sequential enforcement:
        if (typeof currentPageIndex === 'number' && currentPageIndex >= 0) {
          let pFrontier = pagedFrontierRef.current;

          // For manga paged mode: skip page 0 and last page
          if (category === 'manga') {
            if (pFrontier === 0) {
              pagedDwellMapRef.current.set(0, sliceDwellTarget);
              pFrontier = 1;
            }
            if (totalUnits > 2) {
              pagedDwellMapRef.current.set(totalUnits - 1, sliceDwellTarget);
            }
          }

          while ((pagedDwellMapRef.current.get(pFrontier) || 0) >= sliceDwellTarget) {
            pFrontier += 1;
          }
          pagedFrontierRef.current = pFrontier;

          // Page only counts if all previous pages were read for sliceDwellTarget
          if (currentPageIndex === pFrontier) {
            const prevDwell = pagedDwellMapRef.current.get(pFrontier) || 0;
            const newDwell = prevDwell + 1;
            pagedDwellMapRef.current.set(pFrontier, newDwell);
            if (newDwell >= sliceDwellTarget) {
              pagedFrontierRef.current = pFrontier + 1;
            }
          }
        }
      }

      evaluateFocusSlices();
    }, 1000);

    return () => clearInterval(interval);
  }, [category, currentPageIndex, evaluateFocusSlices, totalUnits]);

  // Anti-Cheat Verification readiness:
  // 100% requirement: All slices must have been read sequentially for at least 1.2s each
  // Anti-Cheat system disabled: readers can claim points freely
  const isVerifiedReady = !hasClaimed;
  const verificationProgressPercent = 100;

  // Claim points function
  const claimPoints = useCallback(async (customPoints?: number) => {
    if (hasClaimed) return;
    if (isClaimingRef.current) return;

    if (!sessionId || !sessionToken) {
      return;
    }

    const currentReq = calculatedSecondsRef.current;

    isClaimingRef.current = true;
    setIsClaiming(true);

    try {
      const res = await fetch('/api/reading-session/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionToken,
          userEmail,
          proof: {
            activeReadingSeconds,
            qualifiedFocusSeconds: activeReadingSeconds,
            totalChunksEncountered: totalChapterSlices,
            calculatedRequiredSeconds: currentReq,
            verifiedSlicesCount,
            totalChapterSlices,
            verifiedWords: verifiedWordsCount,
            totalChapterWords,
            coveragePercent,
            scrollDepthPercent: maxScrollDepthRef.current,
            pagesTurned: seenPagesRef.current.size,
            interactionCount: interactionCountRef.current
          },
          customPoints
        })
      });

      const data = await res.json();
      if (data.success) {
        setHasClaimed(true);
        onClaimSuccess?.(data.pointsAwarded, data.stats);
      } else {
        onAntiCheatAlert?.(data.error || 'Failed to claim reading points.');
      }
    } catch (err: unknown) {
      console.error('Error claiming points:', err);
      onAntiCheatAlert?.('Network error while claiming points. Please try again.');
    } finally {
      isClaimingRef.current = false;
      setIsClaiming(false);
    }
  }, [
    hasClaimed,
    sessionId,
    sessionToken,
    userEmail,
    onAntiCheatAlert,
    onClaimSuccess
  ]);

  return {
    sessionId,
    sessionToken,
    baseSliceLengthPx,
    totalChapterSlices,
    verifiedSlicesCount,
    unreadUpperSliceIndex,
    isUpperSkipped,
    calculatedRequiredSeconds,
    totalChunksEncountered,
    minRequiredSeconds: calculatedRequiredSeconds,
    activeReadingSeconds,
    scrollDepthPercent,
    coveragePercent,
    interactionCount,
    isIdle,
    isVerifiedReady,
    hasClaimed,
    isClaiming,
    verificationProgressPercent,
    zoomScale,
    // Novel truth reading metrics (150 WPM)
    verifiedWordsCount,
    totalChapterWords,
    wordsInFrontCount,
    wordsScrolledUpCount,
    isWaitingForScroll,
    claimPoints
  };
}
