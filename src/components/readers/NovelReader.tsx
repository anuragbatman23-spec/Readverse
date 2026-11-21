'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Book, Chapter } from '../../types';
import { useApp } from '../../context/AppContext';
import { parseEpubFile } from '../../utils/epubParser';
import { useReadingFocusTracker } from '../../utils/useReadingFocusTracker';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Palette,
  Quote,
  ZoomIn,
  ZoomOut,
  Camera,
  Loader2,
  Radio,
  X,
  Pin,
  MessageSquare,
  BookOpen,
  Highlighter,
  Eraser,
  Check,
  Type,
  Move,
  List,
  Clock,
  Sparkles,
  Maximize2,
  Sliders,
  AlignLeft,
  AlignJustify,
  Search,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { AiWordMeaningModal } from './AiWordMeaningModal';
import { NovelCameraModal } from './NovelCameraModal';
import { InPlaceNovelCropper } from './InPlaceNovelCropper';
import { ScenePinSystem, ScenePinSpot } from './ScenePinSystem';
import { SourcePickerModal, SourceCandidate } from '../modals/SourcePickerModal';

export interface TextHighlight {
  id: string;
  bookId: string;
  chapterIndex: number;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  colorId: string;
  textColorId?: string;
  createdAt: number;
}

export interface HighlightColorOption {
  id: string;
  name: string;
  dotColor: string;
  ringColor: string;
  lightBg: string;
  darkBg: string;
}

export const HIGHLIGHT_COLORS: HighlightColorOption[] = [
  {
    id: 'yellow',
    name: 'Sun Yellow',
    dotColor: '#eab308',
    ringColor: 'ring-yellow-400',
    lightBg: 'bg-yellow-200/90 text-stone-900 border-b-2 border-yellow-400/90',
    darkBg: 'bg-yellow-400/30 text-yellow-100 border-b-2 border-yellow-400/80 shadow-[0_0_8px_rgba(234,179,8,0.25)]',
  },
  {
    id: 'green',
    name: 'Mint Green',
    dotColor: '#22c55e',
    ringColor: 'ring-emerald-400',
    lightBg: 'bg-emerald-200/90 text-stone-900 border-b-2 border-emerald-400/90',
    darkBg: 'bg-emerald-400/30 text-emerald-100 border-b-2 border-emerald-400/80 shadow-[0_0_8px_rgba(34,197,94,0.25)]',
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    dotColor: '#38bdf8',
    ringColor: 'ring-sky-400',
    lightBg: 'bg-sky-200/90 text-stone-900 border-b-2 border-sky-400/90',
    darkBg: 'bg-sky-400/30 text-sky-100 border-b-2 border-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    dotColor: '#ec4899',
    ringColor: 'ring-pink-400',
    lightBg: 'bg-pink-200/90 text-stone-900 border-b-2 border-pink-400/90',
    darkBg: 'bg-pink-400/30 text-pink-100 border-b-2 border-pink-400/80 shadow-[0_0_8px_rgba(236,72,153,0.25)]',
  },
  {
    id: 'purple',
    name: 'Neon Purple',
    dotColor: '#a855f7',
    ringColor: 'ring-purple-400',
    lightBg: 'bg-purple-200/90 text-stone-900 border-b-2 border-purple-400/90',
    darkBg: 'bg-purple-400/30 text-purple-100 border-b-2 border-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
  },
  {
    id: 'orange',
    name: 'Coral Orange',
    dotColor: '#f97316',
    ringColor: 'ring-orange-400',
    lightBg: 'bg-orange-200/90 text-stone-900 border-b-2 border-orange-400/90',
    darkBg: 'bg-orange-400/30 text-orange-100 border-b-2 border-orange-400/80 shadow-[0_0_8px_rgba(249,115,22,0.25)]',
  },
  {
    id: 'none',
    name: 'No Highlight Bg',
    dotColor: 'transparent',
    ringColor: 'ring-zinc-400',
    lightBg: 'bg-transparent',
    darkBg: 'bg-transparent',
  },
];

export interface TextColorOption {
  id: string;
  name: string;
  dotColor: string;
  ringColor: string;
  lightClass: string;
  darkClass: string;
}

export const TEXT_COLORS: TextColorOption[] = [
  {
    id: 'default',
    name: 'Default',
    dotColor: '#71717a',
    ringColor: 'ring-zinc-400',
    lightClass: 'text-inherit font-inherit',
    darkClass: 'text-inherit font-inherit',
  },
  {
    id: 'red',
    name: 'Ruby Red',
    dotColor: '#ef4444',
    ringColor: 'ring-rose-400',
    lightClass: 'text-rose-600 font-semibold',
    darkClass: 'text-rose-400 font-semibold drop-shadow-[0_0_8px_rgba(244,63,94,0.35)]',
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    dotColor: '#f59e0b',
    ringColor: 'ring-amber-400',
    lightClass: 'text-amber-700 font-semibold',
    darkClass: 'text-amber-300 font-semibold drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]',
  },
  {
    id: 'green',
    name: 'Emerald Green',
    dotColor: '#10b981',
    ringColor: 'ring-emerald-400',
    lightClass: 'text-emerald-700 font-semibold',
    darkClass: 'text-emerald-300 font-semibold drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]',
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    dotColor: '#0ea5e9',
    ringColor: 'ring-sky-400',
    lightClass: 'text-sky-700 font-semibold',
    darkClass: 'text-sky-300 font-semibold drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]',
  },
  {
    id: 'purple',
    name: 'Violet Purple',
    dotColor: '#a855f7',
    ringColor: 'ring-purple-400',
    lightClass: 'text-purple-700 font-semibold',
    darkClass: 'text-purple-300 font-semibold drop-shadow-[0_0_8px_rgba(192,132,252,0.35)]',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    dotColor: '#ec4899',
    ringColor: 'ring-pink-400',
    lightClass: 'text-pink-700 font-semibold',
    darkClass: 'text-pink-300 font-semibold drop-shadow-[0_0_8px_rgba(244,114,182,0.35)]',
  },
];

export const getHighlightsStorageKey = (bookId: string) => `readverse_highlights_${bookId}`;

export const loadHighlightsFromStorage = (bookId: string): TextHighlight[] => {
  try {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(getHighlightsStorageKey(bookId));
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load highlights from localStorage:', e);
  }
  return [];
};

export const saveHighlightsToStorage = (bookId: string, items: TextHighlight[]) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getHighlightsStorageKey(bookId), JSON.stringify(items));
    }
  } catch (e) {
    console.warn('Failed to save highlights to localStorage:', e);
  }
};

export const NOVEL_WIDTHS = [
  { id: 'compact', label: 'Compact', maxWidthClass: 'max-w-xl' },
  { id: 'normal', label: 'Standard', maxWidthClass: 'max-w-2xl' },
  { id: 'wide', label: 'Wide', maxWidthClass: 'max-w-3xl' },
  { id: 'expanded', label: 'Expanded', maxWidthClass: 'max-w-4xl' },
  { id: 'broad', label: 'Broad', maxWidthClass: 'max-w-5xl' },
  { id: 'cinema', label: 'Cinema', maxWidthClass: 'max-w-6xl' },
  { id: 'ultra', label: 'Ultra', maxWidthClass: 'max-w-7xl' },
];

export interface NovelFontOption {
  id: string;
  name: string;
  category: 'Serif' | 'Editorial' | 'Sans' | 'Mono';
  fontFamilyStyle: string;
  previewSample: string;
}

export const NOVEL_FONTS: NovelFontOption[] = [
  {
    id: 'merriweather',
    name: 'Merriweather',
    category: 'Serif',
    fontFamilyStyle: '"Merriweather", Georgia, Cambria, "Times New Roman", serif',
    previewSample: 'Warm classic novel serif'
  },
  {
    id: 'lora',
    name: 'Lora',
    category: 'Editorial',
    fontFamilyStyle: '"Lora", Garamond, "Baskerville Old Face", serif',
    previewSample: 'Flowing literary prose'
  },
  {
    id: 'charter',
    name: 'Charter',
    category: 'Editorial',
    fontFamilyStyle: 'Charter, "Palatino Linotype", Palatino, "Book Antiqua", serif',
    previewSample: 'Crisp editorial legibility'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Editorial',
    fontFamilyStyle: '"Playfair Display", Georgia, "Times New Roman", serif',
    previewSample: 'Poetic & high contrast'
  },
  {
    id: 'inter',
    name: 'Inter Sans',
    category: 'Sans',
    fontFamilyStyle: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    previewSample: 'Clean modern sans-serif'
  },
  {
    id: 'humanist',
    name: 'Humanist Sans',
    category: 'Sans',
    fontFamilyStyle: '"Segoe UI", "Trebuchet MS", "Lucida Grande", sans-serif',
    previewSample: 'Soft & rounded curves'
  },
  {
    id: 'mono',
    name: 'Typewriter Mono',
    category: 'Mono',
    fontFamilyStyle: '"JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
    previewSample: 'Clean monospaced draft'
  }
];

export type ReaderTheme = 'oled' | 'dark' | 'slate' | 'forest' | 'sepia' | 'cream' | 'solarized' | 'light';

export interface ThemeOption {
  id: ReaderTheme;
  name: string;
  tag: string;
  bgHex: string;
  textHex: string;
  dotHex: string;
  classes: string;
  isDark: boolean;
  pillClasses: string;
  pillButtonClasses: string;
  pillDividerClass: string;
  pillTooltipClasses: string;
  backButtonClasses: string;
  popoverClasses: string;
}

export const NOVEL_THEMES: ThemeOption[] = [
  {
    id: 'oled',
    name: 'Midnight',
    tag: 'Pure Black',
    bgHex: '#000000',
    textHex: '#e4e4e7',
    dotHex: '#ffffff',
    classes: 'bg-[#000000] text-[#e4e4e7] border-zinc-800 selection:bg-zinc-800 selection:text-white',
    isDark: true,
    pillClasses: 'bg-black/90 border border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.85)]',
    pillButtonClasses: 'bg-white/[0.04] border-white/[0.08]',
    pillDividerClass: 'bg-zinc-800',
    pillTooltipClasses: 'bg-black/95 border border-zinc-800 text-zinc-100',
    backButtonClasses: 'bg-black/80 hover:bg-black text-zinc-300 hover:text-white border-zinc-800',
    popoverClasses: 'bg-[#09090b] border border-zinc-800 text-zinc-100 shadow-2xl',
  },
  {
    id: 'dark',
    name: 'Obsidian',
    tag: 'Deep Charcoal',
    bgHex: '#0c0e18',
    textHex: '#e2e8f0',
    dotHex: '#93c5fd',
    classes: 'bg-[#0c0e18] text-[#e2e8f0] border-slate-800 selection:bg-indigo-600/50 selection:text-white',
    isDark: true,
    pillClasses: 'bg-[#0c0e1c]/90 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
    pillButtonClasses: 'bg-white/[0.04] border-white/[0.08]',
    pillDividerClass: 'bg-white/15',
    pillTooltipClasses: 'bg-zinc-950/95 border border-white/15 text-white',
    backButtonClasses: 'bg-black/70 hover:bg-black/95 text-zinc-300 hover:text-white border-white/10',
    popoverClasses: 'bg-[#0c0e1c] border border-white/15 text-white shadow-2xl',
  },
  {
    id: 'slate',
    name: 'Nordic Slate',
    tag: 'Cool Graphite',
    bgHex: '#1e2430',
    textHex: '#cbd5e1',
    dotHex: '#67e8f9',
    classes: 'bg-[#1e2430] text-[#cbd5e1] border-slate-700 selection:bg-cyan-600/40 selection:text-white',
    isDark: true,
    pillClasses: 'bg-[#141923]/90 border border-slate-700/60 shadow-[0_12px_40px_rgba(15,23,42,0.6)]',
    pillButtonClasses: 'bg-slate-800/40 border-slate-700/50',
    pillDividerClass: 'bg-slate-700/50',
    pillTooltipClasses: 'bg-[#0f141d]/95 border border-slate-700 text-slate-100',
    backButtonClasses: 'bg-[#141923]/80 hover:bg-[#141923] text-slate-200 hover:text-white border-slate-700/50',
    popoverClasses: 'bg-[#141923] border border-slate-700 text-slate-100 shadow-2xl',
  },
  {
    id: 'forest',
    name: 'Sage Forest',
    tag: 'Eye Comfort',
    bgHex: '#111f18',
    textHex: '#d1fae5',
    dotHex: '#34d399',
    classes: 'bg-[#111f18] text-[#d1fae5] border-[#1e3a2b] selection:bg-emerald-600/40 selection:text-white',
    isDark: true,
    pillClasses: 'bg-[#0d1813]/90 border border-emerald-900/50 shadow-[0_12px_40px_rgba(6,25,16,0.6)]',
    pillButtonClasses: 'bg-emerald-950/40 border-emerald-800/40',
    pillDividerClass: 'bg-emerald-900/40',
    pillTooltipClasses: 'bg-[#09120e]/95 border border-emerald-800/60 text-emerald-100',
    backButtonClasses: 'bg-[#0d1813]/80 hover:bg-[#0d1813] text-emerald-200 hover:text-white border-emerald-900/50',
    popoverClasses: 'bg-[#0d1813] border border-emerald-900/60 text-emerald-100 shadow-2xl',
  },
  {
    id: 'sepia',
    name: 'Warm Sepia',
    tag: 'Book Parchment',
    bgHex: '#f4ecd8',
    textHex: '#382e25',
    dotHex: '#854d0e',
    classes: 'bg-[#f4ecd8] text-[#382e25] border-[#e2d5b8] selection:bg-amber-300 selection:text-amber-950',
    isDark: false,
    pillClasses: 'bg-[#e8dcbf]/95 border border-[#d6c7a3] shadow-[0_12px_40px_rgba(92,64,33,0.2)]',
    pillButtonClasses: 'bg-[#ded0ad]/60 border-[#c7b690]',
    pillDividerClass: 'bg-[#c9b78e]',
    pillTooltipClasses: 'bg-[#2e2318]/95 border border-[#4a3b2c] text-[#f4ecd8]',
    backButtonClasses: 'bg-[#e8dcbf]/90 hover:bg-[#e0d2b2] text-[#4a3b2c] hover:text-[#2a1f14] border-[#d6c7a3]',
    popoverClasses: 'bg-[#f0e6ce] border border-[#cbb991] text-[#382e25] shadow-2xl',
  },
  {
    id: 'cream',
    name: 'Warm Cream',
    tag: 'Soft Milk',
    bgHex: '#faf6ee',
    textHex: '#292524',
    dotHex: '#78716c',
    classes: 'bg-[#faf6ee] text-[#292524] border-[#e7e2d6] selection:bg-stone-300 selection:text-stone-900',
    isDark: false,
    pillClasses: 'bg-[#eee7d8]/95 border border-[#ddd3c1] shadow-[0_12px_40px_rgba(68,64,60,0.18)]',
    pillButtonClasses: 'bg-[#e4dcce]/60 border-[#cfc4b0]',
    pillDividerClass: 'bg-[#d2c7b5]',
    pillTooltipClasses: 'bg-[#262320]/95 border border-[#44403c] text-[#faf6ee]',
    backButtonClasses: 'bg-[#eee7d8]/90 hover:bg-[#e6dece] text-[#38332e] hover:text-[#1c1917] border-[#ddd3c1]',
    popoverClasses: 'bg-[#f5f0e4] border border-[#d7ccb8] text-[#292524] shadow-2xl',
  },
  {
    id: 'solarized',
    name: 'Solarized',
    tag: 'Warm Amber',
    bgHex: '#fdf6e3',
    textHex: '#475b63',
    dotHex: '#0d9488',
    classes: 'bg-[#fdf6e3] text-[#475b63] border-[#eee8d5] selection:bg-teal-200 selection:text-teal-950',
    isDark: false,
    pillClasses: 'bg-[#efe7d3]/95 border border-[#e0d6be] shadow-[0_12px_40px_rgba(88,110,117,0.18)]',
    pillButtonClasses: 'bg-[#e4dcbf]/60 border-[#d2c6a7]',
    pillDividerClass: 'bg-[#d5c9ab]',
    pillTooltipClasses: 'bg-[#073642]/95 border border-[#586e75] text-[#eee8d5]',
    backButtonClasses: 'bg-[#efe7d3]/90 hover:bg-[#e7dfc9] text-[#3c4e55] hover:text-[#073642] border-[#e0d6be]',
    popoverClasses: 'bg-[#f8f2e2] border border-[#dcd1b6] text-[#475b63] shadow-2xl',
  },
  {
    id: 'light',
    name: 'Pure Light',
    tag: 'Crisp White',
    bgHex: '#ffffff',
    textHex: '#0f172a',
    dotHex: '#0f172a',
    classes: 'bg-[#ffffff] text-[#0f172a] border-zinc-200 selection:bg-zinc-200 selection:text-zinc-900',
    isDark: false,
    pillClasses: 'bg-white/95 border border-zinc-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)]',
    pillButtonClasses: 'bg-zinc-100 border-zinc-200/80',
    pillDividerClass: 'bg-zinc-200',
    pillTooltipClasses: 'bg-zinc-900/95 border border-zinc-700 text-white',
    backButtonClasses: 'bg-white/90 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border-zinc-200',
    popoverClasses: 'bg-white border border-zinc-200 text-zinc-900 shadow-2xl',
  },
];

const WEBNOVEL_SOURCES = [
  { id: 'novelbuddy', name: 'NovelBuddy' },
  { id: 'lightnovelto', name: 'LightNovel.to' },
  { id: 'novelight', name: 'Novelight' },
  { id: 'anf.net', name: 'AllNovelFull' },
  { id: 'novelfire', name: 'Novel Fire' },
  { id: 'novelcool', name: 'NovelCool' },
  { id: 'royalroad', name: 'Royal Road' },
  { id: 'novelarchive', name: 'Novel Archive' }
];

const CLASSIC_SOURCES = [
  { id: 'gutenberg', name: 'Project Gutenberg' },
  { id: 'standardebooks', name: 'Standard Ebooks' },
  { id: 'openlibrary', name: 'Public Domain Archive' }
];

interface NovelReaderProps {
  book: Book;
  chapterIndex: number;
  onBack: () => void;
  onChapterChange: (index: number) => void;
  onShareQuote: (quoteText: string, chapterNum: number) => void;
  onSharePanel?: (panelUrl: string, chapterNum: number) => void;
}

export const NovelReader: React.FC<NovelReaderProps> = ({
  book,
  chapterIndex,
  onBack,
  onChapterChange,
  onShareQuote,
  onSharePanel
}) => {
  const { data: session } = useSession();
  const { stats, awardPoints, triggerAntiCheatWarning, setActiveBook } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInReaderEpubUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) return;
    try {
      const parsed = await parseEpubFile(file);
      try {
        localStorage.setItem(`readverse_book_${parsed.id}`, JSON.stringify(parsed));
      } catch {
        // ignore
      }
      setActiveBook(parsed, 0);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/read/${encodeURIComponent(parsed.id)}?chapter=0`);
      }
    } catch (e) {
      console.error('Failed to parse EPUB in reader:', e);
    }
  };

  const fallbackChapter: Chapter = {
    id: 'preview',
    title: 'Chapter 1: Key Insights & Summary',
    chapterNumber: 1,
    wordCount: 1200,
    content: [
      `Welcome to ${book.title} by ${book.author}.`,
      `This modern commercial edition is protected by international publishing copyrights. ReadVerse provides verified introductory guides, chapter notes, and community discussions.`,
      `To read classic books with full authentic unabridged chapters, explore titles like Dracula, Frankenstein, Sherlock Holmes, and Pride & Prejudice from our curated library!`,
      `Enjoy reading through our rich collection of community novels, webtoons, and classic literature!`
    ]
  };

  const chapter = book.chapters && book.chapters.length > 0 ? book.chapters[chapterIndex] || fallbackChapter : fallbackChapter;

  // Column width control (filling side space)
  const [widthIndex, setWidthIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('readverse_novel_width_idx');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < NOVEL_WIDTHS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 2; // Default to 'Wide' (max-w-3xl)
  });

  const handleResizeWidth = (direction: 'larger' | 'smaller') => {
    setWidthIndex(prev => {
      const next = direction === 'larger' ? Math.min(prev + 1, NOVEL_WIDTHS.length - 1) : Math.max(prev - 1, 0);
      try {
        localStorage.setItem('readverse_novel_width_idx', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Dedicated Typography & Font size control
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('readverse_novel_font_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 12 && parsed <= 36) return parsed;
      }
    } catch {
      // ignore
    }
    return 18;
  });

  const [fontId, setFontId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('readverse_novel_font_id');
      if (saved && NOVEL_FONTS.some(f => f.id === saved)) return saved;
      // migrate legacy 'serif' / 'sans'
      const legacy = localStorage.getItem('readverse_novel_font_family');
      if (legacy === 'sans') return 'inter';
      if (legacy === 'serif') return 'merriweather';
    } catch {
      // ignore
    }
    return 'merriweather';
  });

  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const typographyRef = useRef<HTMLDivElement>(null);

  const handleUpdateFontSize = (newSize: number) => {
    const clamped = Math.min(34, Math.max(12, newSize));
    setFontSize(clamped);
    try {
      localStorage.setItem('readverse_novel_font_size', String(clamped));
    } catch {
      // ignore
    }
  };

  const handleSelectFont = (newFontId: string) => {
    setFontId(newFontId);
    try {
      localStorage.setItem('readverse_novel_font_id', newFontId);
    } catch {
      // ignore
    }
  };

  const currentFont = NOVEL_FONTS.find(f => f.id === fontId) || NOVEL_FONTS[0];

  const [textAlign, setTextAlign] = useState<'justify' | 'left'>(() => {
    try {
      const saved = localStorage.getItem('readverse_novel_text_align');
      if (saved === 'left' || saved === 'justify') return saved;
    } catch {}
    return 'justify';
  });

  const [lineHeight, setLineHeight] = useState<'relaxed' | 'normal' | 'loose'>(() => {
    try {
      const saved = localStorage.getItem('readverse_novel_line_height');
      if (saved === 'relaxed' || saved === 'normal' || saved === 'loose') return saved;
    } catch {}
    return 'relaxed';
  });

  const handleSelectTextAlign = (align: 'justify' | 'left') => {
    setTextAlign(align);
    try {
      localStorage.setItem('readverse_novel_text_align', align);
    } catch {}
  };

  const handleSelectLineHeight = (lh: 'relaxed' | 'normal' | 'loose') => {
    setLineHeight(lh);
    try {
      localStorage.setItem('readverse_novel_line_height', lh);
    } catch {}
  };

  // Auto-close typography popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typographyRef.current && !typographyRef.current.contains(e.target as Node)) {
        setIsTypographyOpen(false);
      }
    };
    if (isTypographyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTypographyOpen]);

  const [theme, setTheme] = useState<ReaderTheme>(() => {
    try {
      const saved = localStorage.getItem('readverse_novel_theme') as ReaderTheme;
      if (saved && NOVEL_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // Sync novel theme from user profile data on load
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user/preferences?user=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.novelTheme && NOVEL_THEMES.some((t) => t.id === data.novelTheme)) {
          setTheme(data.novelTheme as ReaderTheme);
          try {
            localStorage.setItem('readverse_novel_theme', data.novelTheme);
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => console.warn('Failed to load novel theme from user preferences:', err));
  }, [session?.user?.email]);

  const handleCycleTheme = () => {
    const currentIndex = NOVEL_THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % NOVEL_THEMES.length;
    const nextTheme = NOVEL_THEMES[nextIndex];
    setTheme(nextTheme.id);
    try {
      localStorage.setItem('readverse_novel_theme', nextTheme.id);
    } catch {
      // ignore
    }

    if (session?.user?.email) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session.user.email,
          novelTheme: nextTheme.id,
        }),
      }).catch((err) => console.warn('Failed to save novel theme to user data:', err));
    }
  };

  const currentTheme = NOVEL_THEMES.find(t => t.id === theme) || NOVEL_THEMES[1];

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
      id: `nc-${Date.now()}`,
      author,
      avatarUrl: currentUserAvatar || undefined,
      text,
      likes: 1,
      isLiked: true,
      createdAt: 'Just now'
    };

    // Optimistic UI update
    setScenePins(prev => {
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
            return {
              ...c,
              isLiked,
              likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1)
            };
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

  // Keyboard shortcut: Escape exits pin placement mode & dismisses quote/highlight bars
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPinPlacementMode) {
          setIsPinPlacementMode(false);
        }
        setSelectedQuote(null);
        setPendingSelection(null);
        setActiveHighlight(null);
      activeHighlightRef.current = null;
        if (typeof window !== 'undefined') {
          window.getSelection()?.removeAllRanges();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinPlacementMode]);

  // Dictionary State
  const [isWordMeaningOpen, setIsWordMeaningOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');

  // Novel Camera Studio & Screen Cropper State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isInPlaceCropOpen, setIsInPlaceCropOpen] = useState(false);
  const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);
  const cameraMenuRef = useRef<HTMLDivElement>(null);

  // Whenever any studio or modal opens, immediately dismiss floating toolbars and selections
  useEffect(() => {
    if (isCameraModalOpen || isInPlaceCropOpen || isWordMeaningOpen) {
      setPendingSelection(null);
      setActiveHighlight(null);
      activeHighlightRef.current = null;
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges();
      }
    }
  }, [isCameraModalOpen, isInPlaceCropOpen, isWordMeaningOpen]);

  // Auto-close camera menu popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(e.target as Node)) {
        setIsCameraMenuOpen(false);
      }
    };
    if (isCameraMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCameraMenuOpen]);

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

  // Highlight State & Color Picker
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<TextHighlight | null>(null);
  const activeHighlightRef = useRef<TextHighlight | null>(null);

  useEffect(() => {
    activeHighlightRef.current = activeHighlight;
  }, [activeHighlight]);

  const [colorMode, setColorMode] = useState<'highlight' | 'text'>('highlight');
  const [pendingSelection, setPendingSelection] = useState<{
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
    text: string;
    position: { top: number; left: number; bottom: number };
  } | null>(null);
  const highlightToolbarRef = useRef<HTMLDivElement>(null);
  const quoteBarRef = useRef<HTMLDivElement>(null);

  // Load highlights for book
  useEffect(() => {
    if (book?.id) {
      const loaded = loadHighlightsFromStorage(book.id);
      setHighlights(loaded);
    }
  }, [book?.id]);

  // Reset active highlight / selection when chapter changes
  useEffect(() => {
    setActiveHighlight(null);
    setPendingSelection(null);
  }, [chapterIndex]);

  // Click outside to dismiss highlight toolbar & floating quote bar
  useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't dismiss if interacting inside toolbar or quote bar
      if (highlightToolbarRef.current?.contains(target)) return;
      if (quoteBarRef.current?.contains(target)) return;

      // Don't dismiss if clicking an existing highlight mark
      if (target.closest('mark[data-highlight-id]')) {
        return;
      }

      setPendingSelection(null);
      setActiveHighlight(null);
      activeHighlightRef.current = null;
      setSelectedQuote(null);
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, []);

  // Sync toolbar position on window resize or scroll
  useEffect(() => {
    if (!pendingSelection && !activeHighlight) return;

    const handleScrollOrResize = () => {
      if (activeHighlight) {
        const mark = document.querySelector(`mark[data-highlight-id="${activeHighlight.id}"]`);
        if (mark) {
          const rect = mark.getBoundingClientRect();
          setPendingSelection(prev =>
            prev
              ? {
                  ...prev,
                  position: {
                    top: rect.top,
                    left: rect.left + rect.width / 2,
                    bottom: rect.bottom
                  }
                }
              : null
          );
        }
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeHighlight, pendingSelection]);

  const handleApplyHighlightColor = (colorId: string) => {
    if (activeHighlight) {
      // Updating an existing highlight's color
      const updated = highlights.map(h =>
        h.id === activeHighlight.id ? { ...h, colorId } : h
      );
      setHighlights(updated);
      saveHighlightsToStorage(book.id, updated);
      setActiveHighlight(prev => (prev ? { ...prev, colorId } : null));
    } else if (pendingSelection) {
      // Creating a new highlight from pending selection
      const newHl: TextHighlight = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        bookId: book.id,
        chapterIndex,
        paragraphIndex: pendingSelection.paragraphIndex,
        startOffset: pendingSelection.startOffset,
        endOffset: pendingSelection.endOffset,
        text: pendingSelection.text,
        colorId,
        textColorId: 'default',
        createdAt: Date.now()
      };

      // Filter out any overlapping highlights in the same paragraph
      const filtered = highlights.filter(
        h =>
          !(
            h.chapterIndex === chapterIndex &&
            h.paragraphIndex === pendingSelection.paragraphIndex &&
            h.startOffset < pendingSelection.endOffset &&
            h.endOffset > pendingSelection.startOffset
          )
      );

      const updated = [...filtered, newHl];
      setHighlights(updated);
      saveHighlightsToStorage(book.id, updated);
      setActiveHighlight(newHl);

      // Deselect text in browser
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges();
      }
    }
  };

  const handleApplyTextColor = (textColorId: string) => {
    if (activeHighlight) {
      // Updating an existing highlight's text font color
      const updated = highlights.map(h =>
        h.id === activeHighlight.id ? { ...h, textColorId } : h
      );
      setHighlights(updated);
      saveHighlightsToStorage(book.id, updated);
      setActiveHighlight(prev => (prev ? { ...prev, textColorId } : null));
    } else if (pendingSelection) {
      // Creating a new highlight with text color
      const newHl: TextHighlight = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        bookId: book.id,
        chapterIndex,
        paragraphIndex: pendingSelection.paragraphIndex,
        startOffset: pendingSelection.startOffset,
        endOffset: pendingSelection.endOffset,
        text: pendingSelection.text,
        colorId: 'none', // text color mode: no background highlight by default
        textColorId,
        createdAt: Date.now()
      };

      const filtered = highlights.filter(
        h =>
          !(
            h.chapterIndex === chapterIndex &&
            h.paragraphIndex === pendingSelection.paragraphIndex &&
            h.startOffset < pendingSelection.endOffset &&
            h.endOffset > pendingSelection.startOffset
          )
      );

      const updated = [...filtered, newHl];
      setHighlights(updated);
      saveHighlightsToStorage(book.id, updated);
      setActiveHighlight(newHl);

      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges();
      }
    }
  };

  const handleRemoveActiveHighlight = () => {
    if (!activeHighlight) return;
    const updated = highlights.filter(h => h.id !== activeHighlight.id);
    setHighlights(updated);
    saveHighlightsToStorage(book.id, updated);
    setActiveHighlight(null);
    activeHighlightRef.current = null;
    setPendingSelection(null);
  };

  const handleHighlightClick = (e: React.MouseEvent, hl: TextHighlight) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveHighlight(hl);
    activeHighlightRef.current = hl;
    // If the highlight primarily has custom text color, open text color tab
    if (hl.textColorId && hl.textColorId !== 'default' && (!hl.colorId || hl.colorId === 'none')) {
      setColorMode('text');
    } else {
      setColorMode('highlight');
    }
    setPendingSelection({
      paragraphIndex: hl.paragraphIndex,
      startOffset: hl.startOffset,
      endOffset: hl.endOffset,
      text: hl.text,
      position: {
        top: rect.top,
        left: rect.left + rect.width / 2,
        bottom: rect.bottom
      }
    });
  };

  const handleDismissToolbar = () => {
    setPendingSelection(null);
    setActiveHighlight(null);
    activeHighlightRef.current = null;
  };

  const handleLookupSelectedWord = () => {
    const word = activeHighlight?.text || pendingSelection?.text || '';
    if (word) {
      setSelectedWord(word.trim());
      setPendingSelection(null);
      setActiveHighlight(null);
      activeHighlightRef.current = null;
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges();
      }
      setIsWordMeaningOpen(true);
    }
  };

  const handleShareQuoteFromToolbar = () => {
    const quote = activeHighlight?.text || pendingSelection?.text || '';
    if (quote) {
      setSelectedQuote(quote.trim());
    }
    setPendingSelection(null);
    setActiveHighlight(null);
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
    setIsCameraModalOpen(true);
  };

  const renderParagraphWithHighlights = (
    text: string,
    pIndex: number,
    allHighlights: TextHighlight[],
    activeHlId: string | null,
    isDark: boolean
  ) => {
    if (!text) return null;

    const matching = allHighlights.filter(
      h => h.chapterIndex === chapterIndex && h.paragraphIndex === pIndex
    );

    if (matching.length === 0) {
      return text;
    }

    // Resolve positions with text matching recovery
    const resolved: {
      highlight: TextHighlight;
      start: number;
      end: number;
    }[] = [];

    for (const hl of matching) {
      let start = hl.startOffset;
      let end = hl.endOffset;
      if (hl.text && text.slice(start, end) !== hl.text) {
        const idx = text.indexOf(hl.text);
        if (idx !== -1) {
          start = idx;
          end = idx + hl.text.length;
        }
      }
      start = Math.max(0, Math.min(text.length, start));
      end = Math.max(start, Math.min(text.length, end));
      if (end > start) {
        resolved.push({ highlight: hl, start, end });
      }
    }

    resolved.sort((a, b) => a.start - b.start);

    // Filter overlaps cleanly
    const nonOverlapping: {
      highlight: TextHighlight;
      start: number;
      end: number;
    }[] = [];

    let lastEnd = 0;
    for (const item of resolved) {
      if (item.start >= lastEnd) {
        nonOverlapping.push(item);
        lastEnd = item.end;
      } else if (item.end > lastEnd) {
        nonOverlapping.push({
          highlight: item.highlight,
          start: lastEnd,
          end: item.end
        });
        lastEnd = item.end;
      }
    }

    const elements: React.ReactNode[] = [];
    let cursor = 0;

    nonOverlapping.forEach((item, i) => {
      if (item.start > cursor) {
        elements.push(
          <React.Fragment key={`txt-${pIndex}-${cursor}`}>
            {text.slice(cursor, item.start)}
          </React.Fragment>
        );
      }

      const hl = item.highlight;
      const colorOpt = HIGHLIGHT_COLORS.find(c => c.id === hl.colorId);
      const textColorOpt = TEXT_COLORS.find(c => c.id === hl.textColorId);
      const isCurrentActive = activeHlId === hl.id;

      const bgClass =
        colorOpt && hl.colorId !== 'none'
          ? isDark
            ? colorOpt.darkBg
            : colorOpt.lightBg
          : 'bg-transparent';

      const textClass =
        textColorOpt && hl.textColorId && hl.textColorId !== 'default'
          ? isDark
            ? textColorOpt.darkClass
            : textColorOpt.lightClass
          : '';

      elements.push(
        <mark
          key={`hl-${hl.id || i}`}
          data-highlight-id={hl.id}
          onMouseDown={e => {
            e.stopPropagation();
          }}
          onClick={e => handleHighlightClick(e, hl)}
          className={`rounded px-1 py-0.5 cursor-pointer transition-all duration-150 inline font-inherit hover:brightness-110 ${bgClass} ${textClass} ${
            isCurrentActive ? 'ring-2 ring-[#CB6C6C] ring-offset-1 ring-offset-black' : ''
          }`}
          title={`Highlight (${colorOpt ? colorOpt.name : 'None'}, Text: ${
            textColorOpt ? textColorOpt.name : 'Default'
          }) - Click to change color`}
        >
          {text.slice(item.start, item.end)}
        </mark>
      );

      cursor = item.end;
    });

    if (cursor < text.length) {
      elements.push(
        <React.Fragment key={`txt-end-${pIndex}-${cursor}`}>
          {text.slice(cursor)}
        </React.Fragment>
      );
    }

    return elements;
  };

  // Anti-cheat & WPM Tracking
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const wordCount = chapter.wordCount || 1800;
  const isBoostActive = stats.boostExpiresAt !== null && Date.now() < stats.boostExpiresAt;
  const pointsToEarn = isBoostActive ? book.pointsPerChapter * 2 : book.pointsPerChapter;

  const [loadingChapterContent, setLoadingChapterContent] = useState<boolean>(false);
  const [chapterContentError, setChapterContentError] = useState<string | null>(null);
  const [showFallbackOverview, setShowFallbackOverview] = useState<boolean>(false);

  const paragraphs = (showFallbackOverview || !chapter.content || chapter.content.length === 0)
    ? fallbackChapter.content
    : chapter.content;

  // Live Rate-Limited Anti-Cheat Tracker (180 WPM = 3 words/second)
  const tracker = useReadingFocusTracker({
    bookId: book.id,
    chapterId: chapter.id || chapterIndex,
    chapterTitle: chapter.title,
    category: book.category,
    totalUnits: paragraphs.length,
    paragraphs,
    wordCount,
    userEmail: session?.user?.email || undefined,
    onClaimSuccess: (awarded) => {
      awardPoints(awarded || pointsToEarn, `Finished ${book.title} ${chapter.title}`, book.category);
      setHasCompleted(true);
    },
    onAntiCheatAlert: (msg) => {
      triggerAntiCheatWarning(msg);
    }
  });

  // Scroll progress tracker
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setScrollProgress(100);
      } else {
        const current = Math.min(100, Math.max(0, Math.round((window.scrollY / total) * 100)));
        setScrollProgress(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterIndex, paragraphs.length]);

  // Lightbox illustration modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Table of Contents Drawer/Modal
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [tocSearch, setTocSearch] = useState('');

  // Estimated reading time
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Find first narrative paragraph for Drop Cap
  const firstNarrativeIndex = useMemo(() => {
    return paragraphs.findIndex(p =>
      !p.startsWith('[image: ') &&
      !p.startsWith('### ') &&
      p !== '---' &&
      !p.startsWith('http') &&
      p.length > 25
    );
  }, [paragraphs]);

  // Rich novel block rendering
  const renderNovelBlock = (paragraph: string, idx: number) => {
    // 1. Image / Illustration Block
    const imgMatch = paragraph.match(/^\[image:\s*([^\]]+)\]$/i) || 
      paragraph.match(/^https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s]+)?$/i);
    
    if (imgMatch) {
      const imgUrl = imgMatch[1] || imgMatch[0];
      return (
        <figure
          key={idx}
          data-paragraph-index={idx}
          className="my-10 flex flex-col items-center justify-center select-none group/img"
        >
          <div
            onClick={() => setLightboxImage(imgUrl)}
            className="relative max-w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-zoom-in transition-all duration-300 hover:scale-[1.01] hover:border-amber-400/60 bg-black/40"
          >
            <img
              src={imgUrl}
              alt={`Novel illustration passage ${idx + 1}`}
              className="max-h-[75vh] w-auto max-w-full object-contain mx-auto rounded-xl transition-transform duration-300 group-hover/img:brightness-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]">
              <Maximize2 className="w-4 h-4 text-amber-400" />
              <span>Click to Expand Full Screen</span>
            </div>
          </div>
          <figcaption className="mt-2.5 text-xs text-zinc-400 font-mono flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Novel Illustration</span>
          </figcaption>
        </figure>
      );
    }

    // 2. Scene Break / Ornamental Divider
    if (paragraph === '---' || /^(\*|\-|_|•|◆|♦|✦|\~|\#){3,}$/i.test(paragraph) || paragraph === '* * *' || paragraph === '***') {
      return (
        <div
          key={idx}
          data-paragraph-index={idx}
          className="my-10 py-2 flex items-center justify-center gap-4 select-none opacity-60"
        >
          <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent to-current" />
          <span className="text-amber-400 font-serif text-sm tracking-widest font-black">✦ ✦ ✦</span>
          <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent to-current" />
        </div>
      );
    }

    // 3. Section Sub-heading (e.g. "### 1", "### Part 1: The Gathering")
    if (paragraph.startsWith('### ')) {
      const headingText = paragraph.replace(/^###\s*/, '').trim();
      return (
        <h2
          key={idx}
          data-paragraph-index={idx}
          className="text-xl sm:text-2xl font-black tracking-tight mt-12 mb-6 not-italic flex items-center gap-3 pt-6 border-t border-white/10"
          style={{ fontFamily: currentFont.fontFamilyStyle }}
        >
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-400 via-rose-400 to-indigo-500 shrink-0" />
          <span>{headingText}</span>
        </h2>
      );
    }

    // 4. LitRPG / Fantasy System Notifications & Status Windows
    const isClassicBook = Boolean(book.category === 'book' || book.id.startsWith('gutenberg-') || book.id.startsWith('se-'));
    const isArchivalTag = /^\[(Illustration|Footnote|Note|Transcriber|Plate|Figure|Table)[\s\S]*\]$/i.test(paragraph);

    if (isArchivalTag) {
      return (
        <div
          key={idx}
          data-paragraph-index={idx}
          className="my-3 py-1 text-center text-xs text-zinc-500 italic font-serif opacity-70 select-none"
        >
          {paragraph}
        </div>
      );
    }

    const isSystemCard = 
      !isClassicBook &&
      (/^\[(System|Notice|Alert|Skill|Quest|Warning|Player|Status|Level|Title|Reward|Item)[\s\S]*\]$/i.test(paragraph) ||
       /^\[[\w\s]{2,15}:\s*[\s\S]+\]$/.test(paragraph) ||
       /^\[Status\s*Window\]/i.test(paragraph));

    if (isSystemCard) {
      return (
        <div
          key={idx}
          data-paragraph-index={idx}
          className="my-7 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-indigo-950/40 border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.18)] relative overflow-hidden backdrop-blur-sm"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-300 to-transparent" />
          <div className="flex items-center gap-2 mb-2.5 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>System Notification</span>
          </div>
          <div className="font-mono text-sm leading-relaxed text-cyan-100 select-text">
            {renderParagraphWithHighlights(paragraph, idx, highlights, activeHighlight?.id || null, currentTheme.isDark)}
          </div>
        </div>
      );
    }

    // 5. Translator & Author Notes
    const isNoteCard = /^(?:\[|\()(?:TL|TL Note|Author\'s Note|Author Note|Note|Editor\'s Note):?/i.test(paragraph);
    if (isNoteCard) {
      return (
        <div
          key={idx}
          data-paragraph-index={idx}
          className="my-6 p-4 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs sm:text-sm font-sans italic opacity-90 shadow-sm"
        >
          <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[11px] uppercase not-italic mb-1">
            <Quote className="w-3 h-3" />
            <span>Author &amp; Translator Note</span>
          </div>
          <div className="leading-relaxed">
            {renderParagraphWithHighlights(paragraph, idx, highlights, activeHighlight?.id || null, currentTheme.isDark)}
          </div>
        </div>
      );
    }

    // 6. First Narrative Paragraph with Editorial Drop Cap
    if (idx === firstNarrativeIndex) {
      const trimmed = paragraph.trim();
      let dropChar = trimmed[0];
      let remainingText = trimmed.slice(1);
      if (/^["'“‘「『]/.test(trimmed) && trimmed.length > 1) {
        dropChar = trimmed.slice(0, 2);
        remainingText = trimmed.slice(2);
      }

      return (
        <p
          key={idx}
          data-paragraph-index={idx}
          className={`relative ${textAlign === 'left' ? 'text-left' : 'text-justify'}`}
        >
          <span
            className="float-left text-4xl sm:text-5xl font-black font-serif mr-3 mt-1 leading-none select-none text-amber-500 dark:text-amber-400 drop-shadow-sm"
            style={{ fontFamily: currentFont.fontFamilyStyle }}
          >
            {dropChar}
          </span>
          {renderParagraphWithHighlights(remainingText, idx, highlights, activeHighlight?.id || null, currentTheme.isDark)}
        </p>
      );
    }

    // 7. Spoken Dialogue vs Standard Narrative Paragraph
    const isDialogue = /^["“「『«]/.test(paragraph.trim());

    return (
      <p
        key={idx}
        data-paragraph-index={idx}
        className={`${isDialogue ? 'indent-4 sm:indent-6 border-l-2 border-amber-400/25 pl-2' : 'indent-6 sm:indent-8'} ${
          textAlign === 'left' ? 'text-left' : 'text-justify'
        } relative transition-colors duration-200`}
      >
        {renderParagraphWithHighlights(paragraph, idx, highlights, activeHighlight?.id || null, currentTheme.isDark)}
      </p>
    );
  };

  // Auto-fetch real chapters if opened without pre-loaded chapters
  useEffect(() => {
    if ((!book.chapters || book.chapters.length === 0) && book.id) {
      setLoadingChapterContent(true);
      if (book.id.startsWith('local-')) {
        fetch(`/api/books/local/read?bookId=${encodeURIComponent(book.id)}`)
          .then(res => res.json())
          .then(data => {
            if (data.chapters && data.chapters.length > 0) {
              setActiveBook({ ...book, chapters: data.chapters }, chapterIndex);
            }
          })
          .catch(err => console.error('Error fetching local book chapters in reader:', err))
          .finally(() => setLoadingChapterContent(false));
      } else if (book.category === 'book') {
        fetch(`/api/books/read?bookId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}`)
          .then(res => res.json())
          .then(data => {
            if (data.chapters && data.chapters.length > 0) {
              setActiveBook({ ...book, chapters: data.chapters }, chapterIndex);
            }
          })
          .catch(err => console.error('Error fetching book chapters in reader:', err))
          .finally(() => setLoadingChapterContent(false));
      } else {
        fetch(`/api/webnovels/read?novelId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}`)
          .then(async res => {
            let data = res.ok ? await res.json() : null;
            if (!data || !data.chapters || data.chapters.length === 0) {
              const sRes = await fetch(`/api/webnovels/search?q=${encodeURIComponent(book.title)}`);
              if (sRes.ok) {
                const sData = await sRes.json();
                const m = sData.books?.[0];
                if (m?.id) {
                  const rRes = await fetch(`/api/webnovels/read?novelId=${encodeURIComponent(m.id)}&title=${encodeURIComponent(book.title)}`);
                  if (rRes.ok) data = await rRes.json();
                }
              }
            }
            return data;
          })
          .then(data => {
            if (data && data.chapters && data.chapters.length > 0) {
              setActiveBook({ ...book, chapters: data.chapters }, chapterIndex);
            }
          })
          .catch(err => console.error('Error fetching webnovel chapters in reader:', err))
          .finally(() => setLoadingChapterContent(false));
      }
    }
  }, [book, chapterIndex, setActiveBook]);

  // If chapter has a path and content is empty, fetch it dynamically via LNReader
  useEffect(() => {
    setShowFallbackOverview(false);
    if (chapter.path && (!chapter.content || chapter.content.length === 0)) {
      // 1. Check offline localStorage cache first for resilience across site refreshes
      try {
        const cacheKey = `readverse_novel_ch_${book.id}_${chapterIndex}`;
        const localCached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        if (localCached) {
          const parsed = JSON.parse(localCached);
          if (parsed.content && parsed.content.length > 0) {
            const updatedChapters = [...(book.chapters || [])];
            updatedChapters[chapterIndex] = {
              ...updatedChapters[chapterIndex],
              content: parsed.content,
              wordCount: parsed.wordCount || 1500
            };
            setActiveBook({ ...book, chapters: updatedChapters }, chapterIndex);
            return;
          }
        }
      } catch (ce) {
        console.warn('Failed reading localStorage chapter cache:', ce);
      }

      setLoadingChapterContent(true);
      setChapterContentError(null);
      const pluginId = chapter.pluginId || book.pluginId || 'novelbuddy';

      fetch(
        `/api/webnovels/chapter?pluginId=${encodeURIComponent(pluginId)}&path=${encodeURIComponent(chapter.path)}&bookId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}&chapterIndex=${chapterIndex}`
      )
        .then(res => {
          if (!res.ok) throw new Error('Failed to load chapter content from source');
          return res.json();
        })
        .then(data => {
          if (data.content && data.content.length > 0) {
            // Persist chapter content so refreshing the site never loses it
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem(
                  `readverse_novel_ch_${book.id}_${chapterIndex}`,
                  JSON.stringify({ content: data.content, wordCount: data.wordCount || 1500 })
                );
              }
            } catch (se) {
              console.warn('Could not cache chapter to localStorage:', se);
            }

            const updatedChapters = [...(book.chapters || [])];
            updatedChapters[chapterIndex] = {
              ...updatedChapters[chapterIndex],
              content: data.content,
              wordCount: data.wordCount || 1500
            };
            setActiveBook(
              {
                ...book,
                chapters: updatedChapters
              },
              chapterIndex
            );
          } else {
            setChapterContentError('No text content available for this chapter.');
          }
        })
        .catch(err => {
          console.error('Error fetching chapter content:', err);
          setChapterContentError('Could not stream chapter text. Check connection or try another source.');
        })
        .finally(() => {
          setLoadingChapterContent(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIndex, chapter.path, chapter.content?.length, chapter.pluginId, book.pluginId]);

  // Live WPM calculation
  const currentWpm = secondsElapsed > 5 ? Math.round((wordCount / (secondsElapsed / 60))) : 0;

  const prevChapterIdxRef = useRef<number>(chapterIndex);

  // Reset progress and scroll to top ONLY on actual chapter change
  useEffect(() => {
    if (prevChapterIdxRef.current !== chapterIndex) {
      prevChapterIdxRef.current = chapterIndex;
      window.scrollTo(0, 0);
      setSecondsElapsed(0);
      setHasCompleted(false);
      setSelectedQuote(null);
    }
  }, [chapterIndex]);

  // Reset timer on chapter change
  useEffect(() => {
    setSecondsElapsed(0);
    setHasCompleted(false);
    setSelectedQuote(null);

    const timer = setInterval(() => {
      if (!document.hidden) {
        setSecondsElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [chapterIndex]);

  // Quote & Highlight selection listener
  const handleTextSelection = () => {
    if (isCameraModalOpen || isInPlaceCropOpen || isWordMeaningOpen) return;
    setTimeout(() => {
      if (typeof window === 'undefined') return;
      if (isCameraModalOpen || isInPlaceCropOpen || isWordMeaningOpen) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!activeHighlightRef.current) {
          setPendingSelection(null);
        }
        setSelectedQuote(null);
        return;
      }
      const text = selection.toString().trim();
      if (!text || text.length === 0) {
        if (!activeHighlightRef.current) {
          setPendingSelection(null);
        }
        setSelectedQuote(null);
        return;
      }

      if (selection.rangeCount === 0) {
        if (!activeHighlightRef.current) {
          setPendingSelection(null);
        }
        setSelectedQuote(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        if (!activeHighlightRef.current) {
          setPendingSelection(null);
        }
        setSelectedQuote(null);
        return;
      }

      // Check if selection is within novel article content
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      const anchorEl = anchorNode?.nodeType === 3 ? anchorNode.parentElement : (anchorNode as Element | null);
      const focusEl = focusNode?.nodeType === 3 ? focusNode.parentElement : (focusNode as Element | null);

      if (
        contentRef.current &&
        !contentRef.current.contains(anchorEl) &&
        !contentRef.current.contains(focusEl)
      ) {
        return;
      }

      // Find the parent paragraph or fallback to article
      const pElem = (
        anchorEl?.closest('[data-paragraph-index]') ||
        focusEl?.closest('[data-paragraph-index]') ||
        anchorEl?.closest('p') ||
        focusEl?.closest('p') ||
        contentRef.current
      ) as HTMLElement | null;

      let pIndex = parseInt(pElem?.getAttribute('data-paragraph-index') || '-1', 10);
      if (isNaN(pIndex) || pIndex === -1) {
        const allPs = Array.from(contentRef.current?.querySelectorAll('p') || []);
        pIndex = pElem ? allPs.indexOf(pElem as HTMLParagraphElement) : 0;
        if (pIndex === -1) pIndex = 0;
      }

      let startOffset = 0;
      let endOffset = text.length;

      try {
        if (pElem && range && pElem.contains(range.startContainer)) {
          const preRange = document.createRange();
          preRange.selectNodeContents(pElem);
          preRange.setEnd(range.startContainer, range.startOffset);
          startOffset = preRange.toString().length;
          endOffset = startOffset + text.length;
        } else {
          const fullText = (pElem || contentRef.current)?.textContent || '';
          const found = fullText.indexOf(text);
          startOffset = found !== -1 ? found : 0;
          endOffset = startOffset + text.length;
        }
      } catch {
        const fullText = (pElem || contentRef.current)?.textContent || '';
        const found = fullText.indexOf(text);
        startOffset = found !== -1 ? found : 0;
        endOffset = startOffset + text.length;
      }

      setPendingSelection({
        paragraphIndex: pIndex,
        startOffset,
        endOffset,
        text,
        position: {
          top: rect.top,
          left: rect.left + rect.width / 2,
          bottom: rect.bottom
        }
      });
      setActiveHighlight(null);
      activeHighlightRef.current = null;

      if (text.length > 15) {
        setSelectedQuote(text);
      } else {
        setSelectedQuote(null);
      }
    }, 50);
  };

  // Global mouseup / touchend for instant and reliable selection capture
  useEffect(() => {
    const handleGlobalSelectionCapture = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('mark[data-highlight-id]')) {
        return; // Clicked on existing highlight; handleHighlightClick manages toolbar
      }
      handleTextSelection();
    };

    document.addEventListener('mouseup', handleGlobalSelectionCapture);
    document.addEventListener('touchend', handleGlobalSelectionCapture);
    return () => {
      document.removeEventListener('mouseup', handleGlobalSelectionCapture);
      document.removeEventListener('touchend', handleGlobalSelectionCapture);
    };
  }, []);

  // Listen for selection collapses (e.g. user unselects highlighted words by clicking)
  useEffect(() => {
    const handleSelectionChange = () => {
      if (typeof window === 'undefined') return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        if (!activeHighlightRef.current && !quoteBarRef.current?.matches(':hover') && !isCameraModalOpen && !isInPlaceCropOpen) {
          setPendingSelection(null);
          setSelectedQuote(null);
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isCameraModalOpen, isInPlaceCropOpen]);

  const handleClaimPoints = () => {
    if (tracker.hasClaimed || hasCompleted) return;
    tracker.claimPoints(pointsToEarn);
  };

  // Theme styling helpers
  const getThemeClasses = () => {
    const active = NOVEL_THEMES.find(t => t.id === theme);
    return active ? active.classes : NOVEL_THEMES[1].classes;
  };


  const isClassic = Boolean(book.category === 'book' || book.id.startsWith('gutenberg-') || book.id.startsWith('se-'));
  const availableSourcesList = isClassic ? CLASSIC_SOURCES : WEBNOVEL_SOURCES;

  const detectInitialSource = (): string => {
    if (chapter.pluginId) return chapter.pluginId;
    if (book.pluginId) return book.pluginId;
    if (book.id.startsWith('gutenberg-')) return 'gutenberg';
    if (book.id.startsWith('se-')) return 'standardebooks';
    const lnMatch = (book.id || '').match(/^ln-([^:]+):/);
    if (lnMatch) return lnMatch[1];
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
      if (isClassic) {
        const res = await fetch(
          `/api/books/read?bookId=${encodeURIComponent(candidate.id)}&title=${encodeURIComponent(candidate.title)}&source=${encodeURIComponent(candidate.sourceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            const currentChNum = chapter?.chapterNumber ?? (chapterIndex + 1);
            const matchedIdx = data.chapters.findIndex((c: Chapter) => c.chapterNumber === currentChNum);
            const newIdx = matchedIdx !== -1 ? matchedIdx : Math.min(chapterIndex, data.chapters.length - 1);

            setCurrentSourceId(candidate.sourceId);
            setCurrentSourceName(candidate.sourceName);

            const updatedBook: Book = { ...book, ...candidate, chapters: data.chapters };
            setActiveBook(updatedBook, newIdx);
            onChapterChange(newIdx);

            setSourceToast({ message: `Switched source to ${candidate.sourceName}`, type: 'success' });
            setTimeout(() => setSourceToast(null), 3500);
            return;
          }
        }
      } else {
        const res = await fetch(
          `/api/webnovels/read?novelId=${encodeURIComponent(candidate.id)}&title=${encodeURIComponent(candidate.title)}&source=${encodeURIComponent(candidate.sourceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          const bookData = data.book;
          const chs = bookData?.chapters || data.chapters;
          if (chs && chs.length > 0) {
            const currentChNum = chapter?.chapterNumber ?? (chapterIndex + 1);
            const matchedIdx = chs.findIndex((c: Chapter) => c.chapterNumber === currentChNum);
            const newIdx = matchedIdx !== -1 ? matchedIdx : Math.min(chapterIndex, chs.length - 1);

            setCurrentSourceId(candidate.sourceId);
            const resolvedName = data.sourceName || candidate.sourceName;
            setCurrentSourceName(resolvedName);

            try {
              localStorage.removeItem(`readverse_novel_ch_${book.id}_${newIdx}`);
            } catch {}

            const updatedBook: Book = {
              ...book,
              ...(bookData || {}),
              title: candidate.title || book.title,
              chapters: chs,
              pluginId: candidate.sourceId
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
      }
      throw new Error('No chapters available on chosen source');
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
        if (isClassic) {
          const res = await fetch(
            `/api/books/read?bookId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}&source=${encodeURIComponent(nextCandidate.id)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.chapters && data.chapters.length > 0) {
              const currentChNum = chapter?.chapterNumber ?? (chapterIndex + 1);
              const matchedIdx = data.chapters.findIndex((c: Chapter) => c.chapterNumber === currentChNum);
              const newIdx = matchedIdx !== -1 ? matchedIdx : Math.min(chapterIndex, data.chapters.length - 1);

              setCurrentSourceId(nextCandidate.id);
              setCurrentSourceName(nextCandidate.name);

              const updatedBook: Book = { ...book, chapters: data.chapters };
              setActiveBook(updatedBook, newIdx);
              onChapterChange(newIdx);

              setSourceToast({ message: `Switched source to ${nextCandidate.name}`, type: 'success' });
              setTimeout(() => setSourceToast(null), 3500);
              found = true;
              break;
            }
          }
        } else {
          const res = await fetch(
            `/api/webnovels/read?novelId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}&source=${encodeURIComponent(nextCandidate.id)}`
          );
          if (res.ok) {
            const data = await res.json();
            const bookData = data.book;
            const chs = bookData?.chapters || data.chapters;
            if (chs && chs.length > 0) {
              const currentChNum = chapter?.chapterNumber ?? (chapterIndex + 1);
              const matchedIdx = chs.findIndex((c: Chapter) => c.chapterNumber === currentChNum);
              const newIdx = matchedIdx !== -1 ? matchedIdx : Math.min(chapterIndex, chs.length - 1);

              setCurrentSourceId(nextCandidate.id);
              const resolvedName = data.sourceName || nextCandidate.name;
              setCurrentSourceName(resolvedName);

              // Invalidate cached chapter text for this slot so fresh text is loaded
              try {
                localStorage.removeItem(`readverse_novel_ch_${book.id}_${newIdx}`);
              } catch {}

              const updatedBook: Book = {
                ...book,
                ...(bookData || {}),
                chapters: chs,
                pluginId: nextCandidate.id
              };
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
        }
      } catch (err) {
        console.warn(`Error switching to novel source ${nextCandidate.id}:`, err);
      }
    }

    if (!found) {
      setSourceToast({ message: 'No alternative sources responded for this title', type: 'warning' });
      setTimeout(() => setSourceToast(null), 3000);
    }

    setIsSwitchingSource(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${getThemeClasses()}`}>
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
            <span>Hover over any paragraph & click to pin a comment line</span>
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
        className={`fixed top-3.5 left-3.5 z-50 p-2.5 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all duration-200 cursor-pointer ${currentTheme.backButtonClasses}`}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Top Reading Progress Bar (Fixed across full viewport width) */}
      <div className="fixed top-0 left-0 right-0 z-[75] h-1 bg-black/40 backdrop-blur-sm pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Sticky Reading Header Bar (Appears on scroll) */}
      <div
        className={`fixed top-1 left-0 right-0 z-[70] px-3 sm:px-6 py-2 transition-all duration-300 ${
          scrollProgress > 2
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-black/85 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-white">
          {/* Back & Title info */}
          <div className="flex items-center gap-2.5 truncate">
            <button
              type="button"
              onClick={onBack}
              title="Back to Overview"
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="truncate">
              <p className="text-xs font-bold truncate leading-tight">{book.title}</p>
              <p className="text-[10px] font-mono text-zinc-400 truncate leading-tight">
                {chapter.title}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* TOC Button */}
            <button
              type="button"
              onClick={() => setIsTocOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Table of Contents"
            >
              <List className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ch {chapterIndex + 1}/{book.chapters?.length || 1}</span>
            </button>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                type="button"
                disabled={chapterIndex === 0}
                onClick={() => onChapterChange(chapterIndex - 1)}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 select-none">
                {scrollProgress}%
              </span>
              <button
                type="button"
                disabled={chapterIndex >= (book.chapters?.length || 1) - 1}
                onClick={() => onChapterChange(chapterIndex + 1)}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Next Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for loading downloaded EPUB in-reader */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".epub"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleInReaderEpubUpload(file);
        }}
        className="hidden"
      />

      {/* Main Content Area */}
      <main className={`relative w-full ${NOVEL_WIDTHS[widthIndex].maxWidthClass} mx-auto px-4 pr-16 sm:pr-20 lg:px-6 xl:px-8 py-8 flex flex-col items-center transition-all duration-300`}>
        {/* Main Reading Column */}
        <div className="w-full relative">
          {/* Option pill pinned comfortably next to reading content and avatar bubbles */}
          <aside className="fixed right-3 sm:right-4 top-3.5 z-50 lg:absolute lg:left-[calc(100%+64px)] lg:right-auto lg:top-0 lg:h-full lg:pointer-events-none">
            <div className="lg:sticky lg:top-4 lg:pointer-events-auto">
              <div className={`flex flex-col items-center justify-center gap-2 p-1.5 sm:p-2 rounded-full backdrop-blur-2xl transition-all duration-300 ${currentTheme.pillClasses}`}>
                {/* 0. Table of Contents Quick Trigger */}
                <button
                  onClick={() => setIsTocOpen(true)}
                  title={`Table of Contents (${book.chapters?.length || 1} chapters)`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-amber-400 hover:text-white hover:bg-amber-400/20 hover:border-amber-400/50 hover:shadow-[0_0_18px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>Table of Contents</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                      {book.chapters?.length || 1}
                    </span>
                  </div>
                </button>

                {/* Subtle Divider */}
                <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />
                {/* 1. Expand Content Width (Fills side space) */}
                <button
                  onClick={() => handleResizeWidth('larger')}
                  disabled={widthIndex >= NOVEL_WIDTHS.length - 1}
                  title={`Expand Content Width (${NOVEL_WIDTHS[Math.min(widthIndex + 1, NOVEL_WIDTHS.length - 1)].label})`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-cyan-500 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                >
                  <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>Expand Width (Fill side space)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                      +
                    </span>
                  </div>
                </button>

                {/* 2. Narrow Content Width */}
                <button
                  onClick={() => handleResizeWidth('smaller')}
                  disabled={widthIndex <= 0}
                  title={`Narrow Content Width (${NOVEL_WIDTHS[Math.max(widthIndex - 1, 0)].label})`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-amber-500 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/50 hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                >
                  <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>Narrow Width</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                      -
                    </span>
                  </div>
                </button>

                {/* Subtle Divider matching theme */}
                <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                {/* 3. Make Text Larger (Direct 1-Click Font Size Stepper) */}
                <button
                  onClick={() => handleUpdateFontSize(fontSize + 2)}
                  disabled={fontSize >= 34}
                  title={`Make Text Larger (${fontSize}px → ${Math.min(fontSize + 2, 34)}px)`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-indigo-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-400/50 hover:shadow-[0_0_18px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                >
                  <div className="flex items-baseline font-bold leading-none select-none">
                    <span className="text-sm sm:text-base font-serif">A</span>
                    <span className="text-[10px] sm:text-xs font-mono font-black ml-0.5">+</span>
                  </div>
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>Make Text Larger</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                      {fontSize}px
                    </span>
                  </div>
                </button>

                {/* 4. Make Text Smaller (Direct 1-Click Font Size Stepper) */}
                <button
                  onClick={() => handleUpdateFontSize(fontSize - 2)}
                  disabled={fontSize <= 12}
                  title={`Make Text Smaller (${fontSize}px → ${Math.max(fontSize - 2, 12)}px)`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-violet-400 hover:text-white hover:bg-violet-500/20 hover:border-violet-400/50 hover:shadow-[0_0_18px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer ${currentTheme.pillButtonClasses}`}
                >
                  <div className="flex items-baseline font-bold leading-none select-none">
                    <span className="text-xs sm:text-sm font-serif">A</span>
                    <span className="text-[10px] font-mono font-black ml-0.5">-</span>
                  </div>
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>Make Text Smaller</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono">
                      {fontSize}px
                    </span>
                  </div>
                </button>

                {/* Subtle Divider matching theme */}
                <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                {/* 3. Dedicated Font Changer */}
                <div className="relative">
                  <button
                    onClick={() => setIsTypographyOpen(prev => !prev)}
                    title={`Change Reading Font (Current: ${currentFont.name})`}
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm cursor-pointer ${
                      isTypographyOpen
                        ? 'bg-sky-500/30 border-sky-400 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)] scale-105'
                        : `${currentTheme.pillButtonClasses} text-sky-500 hover:text-white hover:bg-sky-500/20 hover:border-sky-400/50 hover:shadow-[0_0_18px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95`
                    }`}
                  >
                    <span className="font-serif font-black text-sm sm:text-base tracking-tighter select-none">Aa</span>
                    {!isTypographyOpen && (
                      <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                        <span>Font: {currentFont.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                          {currentFont.category}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Sleek Font Changer Popover */}
                  {isTypographyOpen && (
                    <div
                      ref={typographyRef}
                      className={`absolute right-full mr-3.5 top-1/2 -translate-y-1/2 z-[60] w-72 sm:w-80 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in slide-in-from-right-3 duration-200 ${currentTheme.popoverClasses}`}
                    >
                      <div className={`flex items-center justify-between pb-2.5 mb-3 border-b ${currentTheme.isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-black text-sm text-sky-500">Aa</span>
                          <span className={`text-xs font-bold tracking-wider uppercase ${currentTheme.isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Reading Typography</span>
                        </div>
                        <button
                          onClick={() => setIsTypographyOpen(false)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${currentTheme.isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/10'}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Font Family List with Live Previews */}
                      <div className="space-y-1.5 mb-4">
                        <span className={`text-[11px] font-medium block ${currentTheme.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Choose Typeface</span>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {NOVEL_FONTS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => handleSelectFont(f.id)}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                fontId === f.id
                                  ? 'bg-sky-500/20 border-sky-400/50 shadow-sm'
                                  : currentTheme.isDark
                                  ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10'
                                  : 'bg-black/[0.03] border-black/5 hover:bg-black/[0.07] hover:border-black/10'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ fontFamily: f.fontFamilyStyle }}
                                  >
                                    {f.name}
                                  </span>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                    fontId === f.id
                                      ? 'bg-sky-500/30 text-sky-200'
                                      : currentTheme.isDark ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-600'
                                  }`}>
                                    {f.category}
                                  </span>
                                </div>
                                <p
                                  className="text-[11px] opacity-70 italic"
                                  style={{ fontFamily: f.fontFamilyStyle }}
                                >
                                  {f.previewSample}
                                </p>
                              </div>
                              {fontId === f.id && (
                                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Width Stepper */}
                      <div className="space-y-1.5 pt-2.5 border-t border-white/10">
                        <div className={`flex items-center justify-between text-[11px] font-medium ${currentTheme.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          <span>Column Width</span>
                          <span className="text-sky-500 font-mono font-semibold">{NOVEL_WIDTHS[widthIndex].label}</span>
                        </div>
                        <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${currentTheme.isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.04] border-black/10'}`}>
                          <button
                            onClick={() => handleResizeWidth('smaller')}
                            disabled={widthIndex <= 0}
                            title="Narrow Column Width"
                            className={`flex-1 py-1 rounded-lg disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer ${currentTheme.isDark ? 'bg-white/5 hover:bg-white/15 text-zinc-200 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-zinc-700 hover:text-zinc-900'}`}
                          >
                            <span className="text-xs font-mono">-</span>
                            <span className="text-[11px]">Narrower</span>
                          </button>
                          <button
                            onClick={() => handleResizeWidth('larger')}
                            disabled={widthIndex >= NOVEL_WIDTHS.length - 1}
                            title="Wider Column Width"
                            className={`flex-1 py-1 rounded-lg disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer ${currentTheme.isDark ? 'bg-white/5 hover:bg-white/15 text-zinc-200 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-zinc-700 hover:text-zinc-900'}`}
                          >
                            <span className="text-[11px]">Wider</span>
                            <span className="text-xs font-mono">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Text Alignment & Line Spacing */}
                      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-medium uppercase font-mono block ${currentTheme.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Alignment</span>
                          <div className={`flex items-center gap-1 p-1 rounded-xl border ${currentTheme.isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.04] border-black/10'}`}>
                            <button
                              type="button"
                              onClick={() => handleSelectTextAlign('justify')}
                              className={`flex-1 py-1 rounded-lg text-xs flex items-center justify-center transition-all ${
                                textAlign === 'justify'
                                  ? 'bg-sky-500/30 text-sky-300 font-bold'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                              title="Justified alignment"
                            >
                              <AlignJustify className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTextAlign('left')}
                              className={`flex-1 py-1 rounded-lg text-xs flex items-center justify-center transition-all ${
                                textAlign === 'left'
                                  ? 'bg-sky-500/30 text-sky-300 font-bold'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                              title="Left alignment"
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className={`text-[10px] font-medium uppercase font-mono block ${currentTheme.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Line Spacing</span>
                          <div className={`flex items-center gap-1 p-1 rounded-xl border ${currentTheme.isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.04] border-black/10'}`}>
                            {(['normal', 'relaxed', 'loose'] as const).map(lh => (
                              <button
                                key={lh}
                                type="button"
                                onClick={() => handleSelectLineHeight(lh)}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-mono uppercase transition-all ${
                                  lineHeight === lh
                                    ? 'bg-sky-500/30 text-sky-300 font-bold'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {lh[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtle Divider matching theme */}
                <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                {/* 4. Camera & Visual Snapshots */}
                <div className="relative" ref={cameraMenuRef}>
                  <button
                    onClick={() => setIsCameraMenuOpen(prev => !prev)}
                    title="Camera & Snapshots (Crop screen or quote card)"
                    className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm cursor-pointer ${
                      isCameraMenuOpen || isInPlaceCropOpen || isCameraModalOpen
                        ? 'bg-rose-500/30 border-rose-400 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-105'
                        : `${currentTheme.pillButtonClasses} text-rose-500 hover:text-white hover:bg-rose-500/20 hover:border-rose-400/50 hover:shadow-[0_0_18px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95`
                    }`}
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                    {!isCameraMenuOpen && (
                      <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                        <span>Camera & Crop</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                          Snap
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Camera Choice Popover */}
                  {isCameraMenuOpen && (
                    <div className={`absolute right-full mr-3.5 top-1/2 -translate-y-1/2 z-[60] w-64 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-in fade-in slide-in-from-right-3 duration-200 ${currentTheme.popoverClasses}`}>
                      <div className={`flex items-center justify-between pb-2 mb-2 border-b ${currentTheme.isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${currentTheme.isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                          <Camera className="w-3.5 h-3.5" />
                          <span>Capture Scene</span>
                        </span>
                        <button
                          onClick={() => setIsCameraMenuOpen(false)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            currentTheme.isDark
                              ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                              : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/10'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {/* Option 1: Live In-Place Screen Crop */}
                        <button
                          onClick={() => {
                            setIsCameraMenuOpen(false);
                            setIsInPlaceCropOpen(true);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-start gap-2.5 cursor-pointer group ${
                            currentTheme.isDark
                              ? 'border-rose-500/30 hover:border-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                              : 'border-rose-300 hover:border-rose-400 bg-rose-50 hover:bg-rose-100/80 shadow-sm'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 mt-0.5 ${
                            currentTheme.isDark
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-rose-200 text-rose-700'
                          }`}>
                            <Move className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${currentTheme.isDark ? 'text-rose-200' : 'text-rose-900'}`}>
                              Crop Reading Screen
                            </p>
                            <p className={`text-[10px] leading-tight mt-0.5 ${currentTheme.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              Drag crop box directly over the text you see on this page
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Aesthetic Quote Card Studio */}
                        <button
                          onClick={() => {
                            setIsCameraMenuOpen(false);
                            setIsCameraModalOpen(true);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-start gap-2.5 cursor-pointer group ${
                            currentTheme.isDark
                              ? 'border-white/5 hover:border-white/15 bg-white/[0.03] hover:bg-white/[0.08]'
                              : 'border-black/5 hover:border-black/15 bg-black/[0.03] hover:bg-black/[0.06]'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 mt-0.5 ${
                            currentTheme.isDark
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            <Palette className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${currentTheme.isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                              Quote Card Studio
                            </p>
                            <p className={`text-[10px] leading-tight mt-0.5 ${currentTheme.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              Frame quotes with book covers, themes & typography
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Dictionary & Word Meaning */}
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

                {/* 6. Pin Thought to Paragraph/Passage (Laser Line Mode) */}
                <button
                  onClick={() => setIsPinPlacementMode(!isPinPlacementMode)}
                  title={isPinPlacementMode ? "Cancel Pin Mode" : "Pin Comment to Passage (Drop Line)"}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm cursor-pointer ${
                    isPinPlacementMode
                      ? 'bg-cyan-500 text-zinc-950 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-110'
                      : `${currentTheme.pillButtonClasses} text-cyan-500 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:scale-105 active:scale-95`
                  }`}
                >
                  <Pin className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 ${isPinPlacementMode ? 'fill-current' : ''}`} />
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>{isPinPlacementMode ? 'Cancel Pin' : 'Pin to Passage'}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                      Line
                    </span>
                  </div>
                </button>

                {/* 7. Toggle Scene Pins Visibility */}
                <button
                  onClick={() => setShowScenePins(!showScenePins)}
                  title={`Toggle Pinned Comments (${showScenePins ? 'Visible' : 'Hidden'})`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                    showScenePins
                      ? `${currentTheme.pillButtonClasses} text-teal-500 hover:text-white hover:bg-teal-500/20 hover:border-teal-400/50`
                      : `${currentTheme.pillButtonClasses} opacity-40 hover:opacity-100`
                  }`}
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>{showScenePins ? 'Hide Pins' : 'Show Pins'}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono">
                      {scenePins.length}
                    </span>
                  </div>
                </button>

                {/* Subtle Divider matching theme */}
                <div className={`w-5 h-px my-0.5 rounded-full transition-colors duration-300 ${currentTheme.pillDividerClass}`} />

                {/* 8. Switch to Next Source / Browse Versions */}
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

                {/* 9. Theme Cycler (Direct click to cycle through themes) */}
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

                {/* 10. Highlighter counter indicator */}
                <div
                  title={`Highlights: ${highlights.filter(h => h.chapterIndex === chapterIndex).length} saved in this chapter (Highlight any word to color)`}
                  className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border text-amber-400 hover:text-white hover:bg-amber-400/20 hover:border-amber-400/50 hover:shadow-[0_0_18px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-95 shadow-sm cursor-default ${currentTheme.pillButtonClasses}`}
                >
                  <Highlighter className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                  {highlights.filter(h => h.chapterIndex === chapterIndex).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black flex items-center justify-center shadow">
                      {highlights.filter(h => h.chapterIndex === chapterIndex).length}
                    </span>
                  )}
                  <div className={`absolute right-full mr-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden sm:flex items-center gap-1.5 ${currentTheme.pillTooltipClasses}`}>
                    <span>Highlights</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                      {highlights.filter(h => h.chapterIndex === chapterIndex).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Novel Text Body with Scene Pin Layer */}
          <div className="relative w-full">
            <article
              ref={contentRef}
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTextSelection}
              className={`space-y-6 ${lineHeight === 'loose' ? 'leading-loose' : lineHeight === 'normal' ? 'leading-normal' : 'leading-relaxed'} select-text`}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: currentFont.fontFamilyStyle
              }}
            >
              {/* Editorial Hero Chapter Header */}
              <header className="mb-10 pb-8 border-b border-white/10 text-center sm:text-left space-y-4">
                {/* Breadcrumbs & Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-zinc-400 font-mono">
                  <button
                    type="button"
                    onClick={onBack}
                    className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{book.title}</span>
                  </button>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                    {book.category?.toUpperCase() || 'LIGHT NOVEL'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15 text-[10px] font-mono">
                    Chapter {chapter.chapterNumber || chapterIndex + 1} of {book.chapters?.length || 1}
                  </span>
                </div>

                {/* Main Chapter Title */}
                <h1
                  className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight not-italic"
                  style={{ fontFamily: currentFont.fontFamilyStyle }}
                >
                  {chapter.title}
                </h1>

                {/* Author & Meta Bar */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs opacity-75">
                  {book.author && (
                    <span className="font-semibold text-zinc-300">By {book.author}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>~{estimatedMinutes} min read</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    <span>{wordCount.toLocaleString()} words</span>
                  </span>
                  <span className="font-mono text-[11px] opacity-60">
                    {paragraphs.length} blocks
                  </span>
                </div>

                {/* Quick Actions Header Strip */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTocOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-white/15 hover:border-amber-400/50 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <List className="w-3.5 h-3.5 text-amber-400" />
                    <span>Table of Contents</span>
                  </button>

                  {chapterIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => onChapterChange(chapterIndex - 1)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-xs opacity-75 hover:opacity-100 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Chapter</span>
                    </button>
                  )}

                  {book.chapters && chapterIndex < book.chapters.length - 1 && (
                    <button
                      type="button"
                      onClick={() => onChapterChange(chapterIndex + 1)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-xs opacity-75 hover:opacity-100 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Next Chapter</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </header>

              {loadingChapterContent ? (
                <div className="py-24 text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                  <p className="text-sm font-semibold opacity-90">Streaming authentic chapter from source...</p>
                  <p className="text-xs opacity-50">Powered by LNReader engine</p>
                </div>
              ) : chapterContentError && !showFallbackOverview ? (
                <div className="py-12 text-center space-y-5 border border-rose-500/25 rounded-2xl bg-rose-500/5 p-6 sm:p-8 backdrop-blur-md">
                  <div className="space-y-2">
                    <p className="text-base text-rose-300 font-bold">Chapter Stream Unavailable</p>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      The external aggregator link returned a 404 error (chapters were removed by host or licensed under copyright).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFallbackOverview(true)}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold shadow-md transition-all"
                    >
                      Read Guide & Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold shadow transition-all"
                    >
                      Upload EPUB Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => onChapterChange(chapterIndex)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all"
                    >
                      Retry Stream
                    </button>
                  </div>
                </div>
              ) : (
                paragraphs.map((paragraph, idx) => renderNovelBlock(paragraph, idx))
              )}
            </article>

            {/* Scene Pin System: Laser guide line + right-edge floating avatar bubbles */}
            <ScenePinSystem
              panelIndex={0}
              pins={scenePins.filter(p => p.panelIndex === 0)}
              isVisible={showScenePins}
              isPinPlacementActive={isPinPlacementMode}
              onAddCommentToSpot={handleAddCommentToSpot}
              onToggleLike={handleToggleLike}
              onExitPlacementMode={() => setIsPinPlacementMode(false)}
              currentUserAvatar={currentUserAvatar}
              currentUserName={session?.user?.name || undefined}
            />
          </div>

          {/* Quote Selection Floating Action Button */}
          {selectedQuote && !pendingSelection && (
            <div 
              ref={quoteBarRef}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-full bg-[#090b10]/95 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(203,108,108,0.25)] backdrop-blur-3xl flex items-center gap-2.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200 select-none max-w-[94vw] text-left"
            >
              {/* Top ambient hairline glow */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#CB6C6C]/60 to-transparent pointer-events-none" />

              {/* Quote Icon Badge */}
              <div className="w-6 h-6 rounded-full bg-[#CB6C6C]/15 border border-[#CB6C6C]/30 flex items-center justify-center text-[#CB6C6C] shrink-0">
                <Quote className="w-3 h-3 fill-[#CB6C6C]/20" />
              </div>

              {/* Quote text excerpt */}
              <span className="text-xs font-serif italic text-zinc-200 max-w-[130px] sm:max-w-[220px] md:max-w-[320px] truncate">
                &ldquo;{selectedQuote}&rdquo;
              </span>

              {/* Divider */}
              <div className="h-4 w-px bg-white/15 shrink-0" />

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInPlaceCropOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Crop directly on reading screen"
                >
                  <Move className="w-3 h-3 text-[#CB6C6C]" />
                  <span className="hidden sm:inline">Crop Screen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] text-white text-xs font-black shadow-md shadow-[rgba(203,108,108,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Card Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuote(null);
                    if (typeof window !== 'undefined') {
                      window.getSelection()?.removeAllRanges();
                    }
                  }}
                  className="w-6 h-6 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer ml-0.5"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Chapter Completion Card */}
          <div className="my-8 p-6 rounded-2xl border text-center space-y-4 bg-inherit/40">
            <h3 className="text-lg font-bold">End of {chapter.title}</h3>

            {/* Up Next Chapter Preview Card */}
            {book.chapters && chapterIndex < book.chapters.length - 1 && (
              <div
                onClick={() => onChapterChange(chapterIndex + 1)}
                className="mt-4 p-5 sm:p-6 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-indigo-500/10 hover:border-amber-400/60 shadow-xl transition-all cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                    <span>Up Next</span>
                    <span>•</span>
                    <span>Chapter {chapterIndex + 2} of {book.chapters.length}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold group-hover:text-amber-300 transition-colors">
                    {book.chapters[chapterIndex + 1]?.title || `Chapter ${chapterIndex + 2}`}
                  </h4>
                </div>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 hover:brightness-110 text-zinc-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 group-hover:scale-105 active:scale-95"
                >
                  <span>Continue Reading</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsTocOpen(true)}
                className="px-4 py-2 rounded-xl border opacity-80 hover:opacity-100 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <List className="w-3.5 h-3.5 text-amber-400" />
                <span>Browse All Chapters</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-xl border opacity-80 hover:opacity-100 text-xs font-semibold transition-all cursor-pointer"
              >
                ← Back to Overview
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t opacity-90 text-xs">
              <button
                disabled={chapterIndex === 0}
                onClick={() => onChapterChange(chapterIndex - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none w-full sm:w-auto justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Chapter</span>
              </button>

              {book.chapters && book.chapters.length > 1 && (
                <div className="flex items-center gap-2 max-w-full">
                  <select
                    value={chapterIndex}
                    onChange={e => onChapterChange(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border bg-zinc-900 text-zinc-100 text-xs max-w-[220px] sm:max-w-xs truncate focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    {book.chapters.map((ch, idx) => (
                      <option key={ch.id || idx} value={idx}>
                        {ch.title || `Chapter ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] opacity-60 font-mono">/ {book.chapters.length}</span>
                </div>
              )}

              <button
                disabled={chapterIndex >= (book.chapters?.length || 1) - 1}
                onClick={() => onChapterChange(chapterIndex + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none w-full sm:w-auto justify-center"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Highlight & Color Dots Toolbar */}
      {pendingSelection && !isCameraModalOpen && !isInPlaceCropOpen && !isWordMeaningOpen && (
        <div
          ref={highlightToolbarRef}
          style={{
            position: 'fixed',
            top:
              pendingSelection.position.top < 110
                ? `${pendingSelection.position.bottom + 10}px`
                : `${pendingSelection.position.top - 10}px`,
            left: `${Math.max(
              175,
              Math.min(
                (typeof window !== 'undefined' ? window.innerWidth : 800) - 175,
                pendingSelection.position.left
              )
            )}px`,
            transform:
              pendingSelection.position.top < 110
                ? 'translate(-50%, 0)'
                : 'translate(-50%, -100%)',
          }}
          className="z-40 py-2 px-3.5 rounded-full bg-[#090b10]/95 border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_25px_rgba(203,108,108,0.2)] backdrop-blur-3xl flex items-center gap-2.5 text-white select-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Arrow Caret pointing towards text */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 pointer-events-none bg-[#090b10] ${
              pendingSelection.position.top < 110
                ? `-top-1.5 border-t border-l border-white/[0.12]`
                : `-bottom-1.5 border-b border-r border-white/[0.12]`
            }`}
          />

          {/* Mode Selector: Highlight (Bg) vs Text Color */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-full border border-white/[0.08] text-[11px] font-semibold relative z-10 shrink-0">
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => setColorMode('highlight')}
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                colorMode === 'highlight'
                  ? 'bg-[#CB6C6C] text-white font-black shadow-sm shadow-[rgba(203,108,108,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Highlight Background Tint"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlight</span>
            </button>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => setColorMode('text')}
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                colorMode === 'text'
                  ? 'bg-[#CB6C6C] text-white font-black shadow-sm shadow-[rgba(203,108,108,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Change Text Font Color"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Color</span>
            </button>
          </div>

          <div className="w-px h-5 relative z-10 shrink-0 bg-white/15" />

          {/* Color Dots */}
          <div className="flex items-center gap-1.5 relative z-10 shrink-0">
            {colorMode === 'highlight' ? (
              HIGHLIGHT_COLORS.filter(c => c.id !== 'none').map(c => {
                const isSelected = activeHighlight?.colorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleApplyHighlightColor(c.id)}
                    title={`Highlight: ${c.name}`}
                    style={{
                      backgroundColor: c.dotColor,
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      minHeight: '24px'
                    }}
                    className={`rounded-full transition-transform duration-150 flex items-center justify-center relative cursor-pointer hover:scale-125 shrink-0 shadow-sm ${
                      isSelected
                        ? `ring-2 ring-offset-2 scale-110 shadow-md ${c.ringColor} ring-offset-zinc-950`
                        : ''
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                    )}
                  </button>
                );
              })
            ) : (
              TEXT_COLORS.map(c => {
                const isSelected = (activeHighlight?.textColorId || 'default') === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleApplyTextColor(c.id)}
                    title={`Text Color: ${c.name}`}
                    style={{
                      backgroundColor: c.dotColor,
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      minHeight: '24px'
                    }}
                    className={`rounded-full transition-transform duration-150 flex items-center justify-center relative cursor-pointer hover:scale-125 shrink-0 shadow-sm ${
                      isSelected
                        ? `ring-2 ring-offset-2 scale-110 shadow-md ${c.ringColor} ring-offset-zinc-950`
                        : ''
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                    ) : c.id === 'default' ? (
                      <span className="text-[10px] font-black text-white/95">A</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="w-px h-4 relative z-10 bg-white/15" />

          {/* Quick Actions */}
          <div className="flex items-center gap-1 relative z-10">
            {activeHighlight && (
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={handleRemoveActiveHighlight}
                title="Remove Highlight / Color"
                className="p-1.5 rounded-full text-zinc-400 hover:text-[#CB6C6C] hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleLookupSelectedWord}
              title="Dictionary Lookup"
              className="p-1.5 rounded-full text-zinc-400 hover:text-[#CB6C6C] hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleShareQuoteFromToolbar}
              title="Share Quote Card"
              className="p-1.5 rounded-full text-zinc-400 hover:text-[#CB6C6C] hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleDismissToolbar}
              title="Dismiss"
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Dictionary Modal */}
      <AiWordMeaningModal
        isOpen={isWordMeaningOpen}
        onClose={() => setIsWordMeaningOpen(false)}
        initialWord={selectedWord}
      />

      {/* Novel Snapshot Camera Modal */}
      <NovelCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setPendingSelection(null);
          setActiveHighlight(null);
      activeHighlightRef.current = null;
          setSelectedQuote(null);
        }}
        book={book}
        chapterTitle={chapter.title}
        chapterNum={chapter.chapterNumber}
        initialQuote={selectedQuote || (chapter.content && chapter.content.length > 0 ? chapter.content[0].slice(0, 220) + '...' : `Reading ${book.title} ${chapter.title}`)}
        readerThemeId={theme}
        onConfirmShare={(imageUrl, quote) => {
          setIsCameraModalOpen(false);
          setPendingSelection(null);
          setActiveHighlight(null);
      activeHighlightRef.current = null;
          setSelectedQuote(null);
          if (onSharePanel) {
            onSharePanel(imageUrl, chapter.chapterNumber);
          } else {
            onShareQuote(quote, chapter.chapterNumber);
          }
        }}
        onSwitchToLiveCrop={() => {
          setPendingSelection(null);
          setActiveHighlight(null);
      activeHighlightRef.current = null;
          setIsCameraModalOpen(false);
          setIsInPlaceCropOpen(true);
        }}
      />

      {/* In-Place Screen Cropper (Directly crops live reading view) */}
      <InPlaceNovelCropper
        isOpen={isInPlaceCropOpen}
        onClose={() => {
          setIsInPlaceCropOpen(false);
          setPendingSelection(null);
          setActiveHighlight(null);
      activeHighlightRef.current = null;
          setSelectedQuote(null);
        }}
        onConfirmCrop={(croppedUrl, quoteText) => {
          setIsInPlaceCropOpen(false);
          setPendingSelection(null);
          setActiveHighlight(null);
      activeHighlightRef.current = null;
          setSelectedQuote(null);
          if (onSharePanel) {
            onSharePanel(croppedUrl, chapter.chapterNumber);
          } else {
            onShareQuote(quoteText, chapter.chapterNumber);
          }
        }}
        onSwitchToStudio={() => {
          setPendingSelection(null);
          setActiveHighlight(null);
      activeHighlightRef.current = null;
          setIsInPlaceCropOpen(false);
          setIsCameraModalOpen(true);
        }}
        containerRef={contentRef}
        bookTitle={book.title}
        chapterTitle={chapter.title}
        chapterNum={chapter.chapterNumber}
        themeHex={{
          bg: currentTheme.bgHex,
          text: currentTheme.textHex,
          isDark: currentTheme.isDark
        }}
        fontFamily={currentFont.fontFamilyStyle}
        fontSize={fontSize}
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

      {/* Table of Contents Drawer / Modal */}
      {isTocOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0d1017] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <List className="w-4 h-4 text-amber-400" />
                  <span>Table of Contents</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs sm:max-w-sm">
                  {book.title} ({book.chapters?.length || 0} chapters)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTocOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-white/10 bg-white/[0.01]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search chapter title or number..."
                  value={tocSearch}
                  onChange={e => setTocSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Chapter List */}
            <div className="overflow-y-auto p-3 space-y-1 divide-y divide-white/[0.04]">
              {(book.chapters || []).map((ch, idx) => {
                if (tocSearch && !ch.title.toLowerCase().includes(tocSearch.toLowerCase()) && !String(idx + 1).includes(tocSearch)) {
                  return null;
                }
                const isCurrent = idx === chapterIndex;
                return (
                  <button
                    key={ch.id || idx}
                    type="button"
                    onClick={() => {
                      onChapterChange(idx);
                      setIsTocOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group ${
                      isCurrent
                        ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold shadow-sm'
                        : 'hover:bg-white/[0.06] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-mono shrink-0 ${
                        isCurrent ? 'bg-amber-400 text-zinc-950 font-black' : 'bg-white/5 text-zinc-400 group-hover:bg-white/10'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs truncate">{ch.title || `Chapter ${idx + 1}`}</span>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-mono shrink-0">
                        Reading
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Illustrations */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center cursor-default"
          >
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              <a
                href={lightboxImage}
                download="novel-illustration.jpg"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Open image full resolution"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Novel illustration full size"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] border border-white/10"
            />
            <p className="mt-3 text-xs text-zinc-400 font-mono flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Resolution Novel Illustration</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
