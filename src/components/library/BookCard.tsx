'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Star, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { Book } from '../../types';
import { resolveCoverUrl } from '../../utils/imageOptimizer';

export interface CategoryTheme {
  pill: string;
  borderHover: string;
  cardGlow: string;
  btnBg: string;
  glowColor: string;
  borderColor: string;
  titleHover?: string;
}

interface BookCardProps {
  book: Book;
  theme: CategoryTheme;
  pointsAwarded: number;
  isOpeningThis: boolean;
  onOpenBook: (book: Book) => void;
  className?: string;
  titleHoverClass?: string;
}

const POPUP_WIDTH = 320;
const ESTIMATED_POPUP_HEIGHT = 500;
const CURSOR_OFFSET_X = 20;

const BookCardComponent: React.FC<BookCardProps> = ({
  book,
  theme,
  pointsAwarded,
  isOpeningThis,
  onOpenBook,
  className = '',
  titleHoverClass
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; isFlippedLeft: boolean } | null>(null);

  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafId = useRef<number | null>(null);
  const latestCursorPos = useRef<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Calculate position on the right side of the cursor, with smart edge flipping
  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (typeof window === 'undefined') return { top: 0, left: 0, isFlippedLeft: false };

    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Sit on the right side of the cursor by default
    let left = clientX + CURSOR_OFFSET_X;
    let isFlippedLeft = false;

    // If it exceeds the right viewport edge, flip to the left side of the cursor
    if (left + POPUP_WIDTH > viewportWidth - margin) {
      left = clientX - POPUP_WIDTH - CURSOR_OFFSET_X;
      isFlippedLeft = true;
    }

    // Left screen boundary protection
    if (left < margin) {
      left = margin;
    }

    // Vertically offset slightly above center of the cursor
    let top = clientY - 140;

    // Viewport vertical boundary clamping
    if (top < margin) {
      top = margin;
    } else if (top + ESTIMATED_POPUP_HEIGHT > viewportHeight - margin) {
      top = Math.max(margin, viewportHeight - ESTIMATED_POPUP_HEIGHT - margin);
    }

    return { top, left, isFlippedLeft };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      latestCursorPos.current = { clientX: e.clientX, clientY: e.clientY };

      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      // 1-second hover delay before appearing
      openTimerRef.current = setTimeout(() => {
        if (latestCursorPos.current) {
          const pos = calculatePosition(latestCursorPos.current.clientX, latestCursorPos.current.clientY);
          setCoords(pos);
        }
        setIsHovered(true);
      }, 1000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mounted) return;
    latestCursorPos.current = { clientX: e.clientX, clientY: e.clientY };

    // Performance optimization: Avoid firing React state updates on every sub-pixel mousemove
    // while scrolling or before the 1-second hover delay expires.
    if (!isHovered) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const pos = calculatePosition(e.clientX, e.clientY);
      setCoords(pos);
    });
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    latestCursorPos.current = null;
    setIsHovered(false);
  };

  // Close floating card immediately on scroll (including nested shelf scrolls) or window resize
  useEffect(() => {
    if (!isHovered) return;
    const handleScrollOrResize = () => {
      setIsHovered(false);
    };
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isHovered]);

  // Resolve candidate covers in priority order: Primary -> Alternative sources (AniList, WeebCentral, etc.)
  const coverCandidates = useMemo(() => {
    const list: string[] = [];

    if (
      book.title?.toLowerCase().includes('solo leveling') &&
      (!book.coverImage || book.coverImage.includes('1578632767115-351597cf2477'))
    ) {
      list.push('https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg');
    } else if (book.coverImage) {
      const resolved = resolveCoverUrl(book.coverImage, book.title, book.category);
      if (resolved && !resolved.includes('unsplash.com')) {
        list.push(resolved);
      }
    }

    if (book.alternativeCovers && Array.isArray(book.alternativeCovers)) {
      for (const alt of book.alternativeCovers) {
        if (!alt) continue;
        const resolvedAlt = resolveCoverUrl(alt, book.title, book.category);
        if (resolvedAlt && !list.includes(resolvedAlt) && !resolvedAlt.includes('unsplash.com')) {
          list.push(resolvedAlt);
        }
      }
    }

    return list;
  }, [book.coverImage, book.alternativeCovers, book.title, book.category]);

  const [coverIndex, setCoverIndex] = useState(0);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  // Reset candidate index when book changes
  useEffect(() => {
    setCoverIndex(0);
    setIsCoverLoaded(false);
  }, [book.id, book.coverImage]);

  const activeCoverUrl = coverCandidates[coverIndex] || '';

  const handleCoverError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;

    // 1. If direct image fails and has not been proxied yet, route through our server proxy with title fallback
    if (!target.dataset.triedProxy && activeCoverUrl.startsWith('http') && !target.src.includes('/api/manga/image-proxy')) {
      target.dataset.triedProxy = 'true';
      target.src = `/api/manga/image-proxy?url=${encodeURIComponent(activeCoverUrl)}&title=${encodeURIComponent(book.title)}`;
      return;
    }

    // 2. If proxy fails for this cover, attempt next alternative source (e.g. AniList / WeebCentral)
    if (coverIndex + 1 < coverCandidates.length) {
      delete target.dataset.triedProxy;
      setCoverIndex(prev => prev + 1);
      return;
    }

    // 3. All sources and fallbacks exhausted: hide image element and show styled placeholder
    target.style.display = 'none';
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`dock-card-wrapper pointer-events-auto flex flex-col ${className}`}
      >
        <div
          style={{
            '--hover-glow': theme.glowColor,
            '--card-theme-color': theme.borderColor
          } as React.CSSProperties}
          className={`w-full flex-1 group cv-card dock-card-3d relative pointer-events-auto flex flex-col justify-between rounded-2xl border-2 border-white/[0.08] bg-[#0e101c] ${theme.borderHover} shadow-md`}
        >
          {/* Cover Image Container (Top Part - does not trigger description tooltip) */}
          <div
            onClick={() => onOpenBook(book)}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[14px] bg-gradient-to-br from-[#121526] via-[#0b0d17] to-[#161a2e] flex flex-col items-center justify-center p-4 cursor-pointer"
          >
            {/* Dedicated Loading State on Cover while image downloads / decodes */}
            {!isCoverLoaded && activeCoverUrl && (
              <div className="absolute inset-0 z-[5] bg-[#0d0f18] flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-white/[0.06] animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-full animate-shimmer" />

                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-[#DA6569]" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300 tracking-tight">
                    Loading cover...
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center justify-center text-center px-2 select-none pointer-events-none opacity-60">
              <BookOpen className="w-8 h-8 text-zinc-500 mb-2" />
              <span className="text-xs font-semibold text-zinc-300 line-clamp-3 leading-snug">
                {book.title}
              </span>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            {activeCoverUrl && (
              <img
                key={activeCoverUrl}
                src={activeCoverUrl}
                alt={book.title}
                referrerPolicy="no-referrer"
                className={`absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-all duration-500 ${
                  isCoverLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsCoverLoaded(true)}
                onError={handleCoverError}
              />
            )}

            {/* Top Left Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-start">
              <span className={`card-badge-blur px-2 py-0.5 rounded-md backdrop-blur-md border text-[9.5px] font-bold uppercase tracking-wider ${theme.pill} shadow`}>
                {book.category === 'manhwa' ? 'WEBTOON' : book.category}
              </span>
            </div>
          </div>

          {/* Book Info (Bottom Part - Triggers floating description following cursor) */}
          <div
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2"
          >
            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400 font-medium truncate">
                {book.author}
              </div>
              <h3
                onClick={() => onOpenBook(book)}
                className={`font-bold text-white text-xs sm:text-sm ${titleHoverClass || theme.titleHover || 'group-hover:text-amber-300'} transition-colors line-clamp-1 cursor-pointer`}
              >
                {book.title}
              </h3>
            </div>

            {/* Read Button */}
            <button
              disabled={isOpeningThis}
              onClick={(e) => {
                e.stopPropagation();
                onOpenBook(book);
              }}
              className={`w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl bg-white/[0.06] border border-white/10 ${theme.btnBg} text-zinc-200 text-xs font-bold transition-all shadow-md disabled:opacity-60`}
            >
              {isOpeningThis ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Streaming Pages...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Description Hover Card Following Cursor */}
      {mounted && isHovered && coords && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: `translate3d(${coords.left}px, ${coords.top}px, 0)`,
            width: `${POPUP_WIDTH}px`,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 99999,
            transition: 'transform 0.08s cubic-bezier(0.1, 0.9, 0.2, 1)'
          }}
          className="pointer-events-none select-none will-change-transform"
        >
          {/* Inner Card with Pop Bounce Animation */}
          <div
            style={{
              transformOrigin: coords.isFlippedLeft ? 'right 25%' : 'left 25%'
            }}
            className="relative animate-hover-card-pop rounded-2xl bg-[#0d0f18]/92 border border-white/20 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden backdrop-blur-2xl max-h-[82vh] flex flex-col"
          >
            {/* Ambient Blurred Background from Cover / Banner */}
            {activeCoverUrl && (
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book.bannerImage || activeCoverUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-150 filter blur-2xl brightness-[0.35] saturate-150 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f18]/60 via-[#0d0f18]/85 to-[#0d0f18]" />
              </div>
            )}

            {/* Header Banner with Blurred Background */}
            <div className="relative h-28 w-full shrink-0 overflow-hidden bg-[#161928]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {activeCoverUrl && (
                <img
                  src={book.bannerImage || activeCoverUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-125 filter blur-md brightness-[0.7] saturate-125"
                />
              )}
              {/* Smooth dark gradient fading into card body */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f18] via-[#0d0f18]/60 to-black/30" />
            </div>

            {/* Main Content Body */}
            <div className="px-4 pb-4 -mt-12 relative z-10 flex flex-col flex-1 min-h-0 space-y-3">
              {/* Poster Thumbnail & Full Title Header */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-900 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {activeCoverUrl ? (
                    <img
                      src={activeCoverUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-3">
                  <h4
                    className="text-white font-bold text-sm sm:text-base leading-snug drop-shadow-md break-words"
                  >
                    {book.title}
                  </h4>
                  {book.author && (
                    <p className="text-[11px] text-zinc-400 font-medium mt-0.5 truncate">
                      by {book.author}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata Line: Star • Category • Chapters/Year */}
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-1 text-orange-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{typeof book.rating === 'number' ? book.rating.toFixed(1) : (book.rating || '4.8')}</span>
                </div>
                <span className="text-zinc-600 font-bold">•</span>
                <span className="capitalize text-zinc-200">
                  {book.category === 'manhwa' ? 'Webtoon' : book.category}
                </span>
                <span className="text-zinc-600 font-bold">•</span>
                <span className="text-zinc-400">
                  {book.chapters?.length ? `${book.chapters.length} Ch` : 'Ongoing'}
                </span>
              </div>

              {/* Genre Pills */}
              {book.genre && book.genre.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {book.genre.slice(0, 5).map((g, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-white/[0.08] text-[11px] font-medium text-zinc-300 border border-white/[0.08]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Full Synopsis Description with generous vertical height & smooth scrollbar */}
              <div className="max-h-64 sm:max-h-72 overflow-y-auto thin-scrollbar pr-1">
                <p className="text-xs text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
                  {book.description || `Discover ${book.title}. Enjoy the high-resolution reader, track reading rewards, and unlock new episodes.`}
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const BookCard = React.memo(BookCardComponent, (prev, next) => {
  return (
    prev.book.id === next.book.id &&
    prev.isOpeningThis === next.isOpeningThis &&
    prev.pointsAwarded === next.pointsAwarded &&
    prev.className === next.className &&
    prev.titleHoverClass === next.titleHoverClass
  );
});
