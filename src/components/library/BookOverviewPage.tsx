'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Search,
  ArrowUpDown,
  Globe,
  User,
  Palette,
  Tag,
  Sparkles,
  Play,
  Flag,
  Film,
  MessageSquare,
  Compass,
  Hourglass,
  Layers,
  Link2,
  Flame,
  Smartphone,
  BookMarked,
  Feather,
  Library,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Book, Chapter, ContentCategory } from '../../types';
import { ALL_FAMOUS_BOOKS } from '../../data/famousCatalog';
import { MOCK_BOOKS } from '../../data/mockData';
import { resolveCoverUrl } from '../../utils/imageOptimizer';
import { BookCard, CategoryTheme } from './BookCard';
import {
  getPuterAIRecommendations,
  fetchMoreCategoryRecommendations,
  normalizeTitle,
  PuterRecommendedItem
} from '../../utils/puterRecommendationEngine';
import { SourcePickerModal, SourceCandidate } from '../modals/SourcePickerModal';

interface BookOverviewPageProps {
  book: Book;
  onBack: () => void;
  onStartReading: (book: Book, chapterIndex: number) => void;
  allBooks?: Book[];
  onChaptersLoaded?: (chapters: Chapter[]) => void;
}

const GLOBAL_WALLPAPER_STORAGE_KEY = 'readverse_global_overview_wallpaper';
const DEFAULT_GLOBAL_WALLPAPER = {
  url: 'https://cdn.pic.re/ee/ee8b1bd75492f9ab7b77279649f664db.jpg',
  source: 'pic.re'
};

// Positions for 3x3 serpentine snake layout matching the PowerPoint diagram
const SNAKE_POSITIONS = [
  { row: 0, col: 0, leftPercent: '16.67%', topPercent: '20.37%' },
  { row: 0, col: 1, leftPercent: '50%', topPercent: '20.37%' },
  { row: 0, col: 2, leftPercent: '83.33%', topPercent: '20.37%' },
  { row: 1, col: 2, leftPercent: '83.33%', topPercent: '50%' },
  { row: 1, col: 1, leftPercent: '50%', topPercent: '50%' },
  { row: 1, col: 0, leftPercent: '16.67%', topPercent: '50%' },
  { row: 2, col: 0, leftPercent: '16.67%', topPercent: '79.63%' },
  { row: 2, col: 1, leftPercent: '50%', topPercent: '79.63%' },
  { row: 2, col: 2, leftPercent: '83.33%', topPercent: '79.63%' },
];

/**
 * Generate serpentine SVG path dynamically extending only up to the last visible chapter capsule.
 */
function getSnakePath(count: number): string {
  if (count <= 1) return '';
  if (count === 2) return 'M 150,55 L 450,55';
  if (count === 3) return 'M 150,55 L 750,55';
  if (count === 4) return 'M 150,55 L 750,55 A 40 40 0 0 1 750,135';
  if (count === 5) return 'M 150,55 L 750,55 A 40 40 0 0 1 750,135 L 450,135';
  if (count === 6) return 'M 150,55 L 750,55 A 40 40 0 0 1 750,135 L 150,135';
  if (count === 7) return 'M 150,55 L 750,55 A 40 40 0 0 1 750,135 L 150,135 A 40 40 0 0 0 150,215';
  if (count === 8) return 'M 150,55 L 750,55 A 40 40 0 0 1 750,135 L 150,135 A 40 40 0 0 0 150,215 L 450,215';
  return 'M 150,55 L 750,55 A 40 40 0 0 1 750,135 L 150,135 A 40 40 0 0 0 150,215 L 750,215';
}

const SNAKE_NODE_STYLES = [
  // 0: START (Red / Coral)
  {
    isStart: true,
    label: 'START',
    boxBorder: 'border-rose-500/70 hover:border-rose-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_4px_30px_rgba(244,63,94,0.55)]',
    badgeBg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white',
    icon: Play
  },
  // 1: Gold / Yellow Play
  {
    boxBorder: 'border-amber-500/40 hover:border-amber-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.4)]',
    badgeBg: 'bg-amber-500/15 border border-amber-500/30 text-amber-300',
    icon: Play
  },
  // 2: Green / Lime Video
  {
    boxBorder: 'border-emerald-500/40 hover:border-emerald-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300',
    icon: Film
  },
  // 3: Amber Message / Chat
  {
    boxBorder: 'border-amber-500/40 hover:border-amber-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.4)]',
    badgeBg: 'bg-amber-500/15 border border-amber-500/30 text-amber-300',
    icon: MessageSquare
  },
  // 4: Green / Emerald Mic / Sparkles
  {
    boxBorder: 'border-teal-500/40 hover:border-teal-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_30px_rgba(20,184,166,0.4)]',
    badgeBg: 'bg-teal-500/15 border border-teal-500/30 text-teal-300',
    icon: Sparkles
  },
  // 5: Amber Compass / Navigation
  {
    boxBorder: 'border-amber-500/40 hover:border-amber-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.4)]',
    badgeBg: 'bg-amber-500/15 border border-amber-500/30 text-amber-300',
    icon: Compass
  },
  // 6: Green / Lime Book
  {
    boxBorder: 'border-emerald-500/40 hover:border-emerald-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300',
    icon: BookOpen
  },
  // 7: Amber Hourglass
  {
    boxBorder: 'border-amber-500/40 hover:border-amber-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.4)]',
    badgeBg: 'bg-amber-500/15 border border-amber-500/30 text-amber-300',
    icon: Hourglass
  },
  // 8: FINISH (Cyan / Sky / Blue)
  {
    isFinish: true,
    label: 'FINISH',
    boxBorder: 'border-sky-500/70 hover:border-sky-400',
    boxGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_4px_30px_rgba(14,165,233,0.55)]',
    badgeBg: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white',
    icon: Flag
  }
];

export type OverviewThemeId =
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'fuchsia'
  | 'rose';

export interface OverviewTheme {
  id: OverviewThemeId;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  glowRgba: string;
  primaryBtn: string;
  activePill: string;
  badge: string;
  accentText: string;
  accentHoverText: string;
  borderAccent: string;
  borderHoverAccent: string;
  subtleBg: string;
  subtleHoverBg: string;
  focusRing: string;
  chapterNumberText: string;
  selectionClass: string;
}

export const OVERVIEW_THEMES: OverviewTheme[] = [
  {
    id: 'orange',
    name: 'Sunset Orange',
    primaryHex: '#f97316',
    secondaryHex: '#ea580c',
    glowRgba: 'rgba(249, 115, 22, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/30 text-white',
    activePill: 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-orange-500/20',
    badge: 'bg-orange-500 text-zinc-950',
    accentText: 'text-orange-400',
    accentHoverText: 'group-hover:text-orange-400 hover:text-orange-300',
    borderAccent: 'border-orange-500/30',
    borderHoverAccent: 'hover:border-orange-500/50',
    subtleBg: 'bg-orange-500/10',
    subtleHoverBg: 'group-hover:bg-orange-500/20 hover:bg-orange-500/20',
    focusRing: 'focus:border-orange-500/60',
    chapterNumberText: 'text-orange-400',
    selectionClass: 'selection:bg-orange-500'
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    primaryHex: '#f59e0b',
    secondaryHex: '#d97706',
    glowRgba: 'rgba(245, 158, 11, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-500/30 text-zinc-950',
    activePill: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-amber-500/20',
    badge: 'bg-amber-500 text-zinc-950',
    accentText: 'text-amber-400',
    accentHoverText: 'group-hover:text-amber-400 hover:text-amber-300',
    borderAccent: 'border-amber-500/30',
    borderHoverAccent: 'hover:border-amber-500/50',
    subtleBg: 'bg-amber-500/10',
    subtleHoverBg: 'group-hover:bg-amber-500/20 hover:bg-amber-500/20',
    focusRing: 'focus:border-amber-500/60',
    chapterNumberText: 'text-amber-400',
    selectionClass: 'selection:bg-amber-500'
  },
  {
    id: 'yellow',
    name: 'Electric Yellow',
    primaryHex: '#eab308',
    secondaryHex: '#ca8a04',
    glowRgba: 'rgba(234, 179, 8, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:to-amber-600 shadow-yellow-500/30 text-zinc-950',
    activePill: 'bg-gradient-to-r from-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-500/20',
    badge: 'bg-yellow-400 text-zinc-950',
    accentText: 'text-yellow-400',
    accentHoverText: 'group-hover:text-yellow-400 hover:text-yellow-300',
    borderAccent: 'border-yellow-500/30',
    borderHoverAccent: 'hover:border-yellow-500/50',
    subtleBg: 'bg-yellow-500/10',
    subtleHoverBg: 'group-hover:bg-yellow-500/20 hover:bg-yellow-500/20',
    focusRing: 'focus:border-yellow-500/60',
    chapterNumberText: 'text-yellow-400',
    selectionClass: 'selection:bg-yellow-500'
  },
  {
    id: 'lime',
    name: 'Neon Lime',
    primaryHex: '#84cc16',
    secondaryHex: '#65a30d',
    glowRgba: 'rgba(132, 204, 22, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-lime-500 via-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 shadow-lime-500/30 text-zinc-950',
    activePill: 'bg-gradient-to-r from-lime-500 to-emerald-500 text-zinc-950 shadow-lime-500/20',
    badge: 'bg-lime-500 text-zinc-950',
    accentText: 'text-lime-400',
    accentHoverText: 'group-hover:text-lime-400 hover:text-lime-300',
    borderAccent: 'border-lime-500/30',
    borderHoverAccent: 'hover:border-lime-500/50',
    subtleBg: 'bg-lime-500/10',
    subtleHoverBg: 'group-hover:bg-lime-500/20 hover:bg-lime-500/20',
    focusRing: 'focus:border-lime-500/60',
    chapterNumberText: 'text-lime-400',
    selectionClass: 'selection:bg-lime-500'
  },
  {
    id: 'emerald',
    name: 'Mint Emerald',
    primaryHex: '#10b981',
    secondaryHex: '#059669',
    glowRgba: 'rgba(16, 185, 129, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30 text-zinc-950',
    activePill: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-emerald-500/20',
    badge: 'bg-emerald-500 text-zinc-950',
    accentText: 'text-emerald-400',
    accentHoverText: 'group-hover:text-emerald-400 hover:text-emerald-300',
    borderAccent: 'border-emerald-500/30',
    borderHoverAccent: 'hover:border-emerald-500/50',
    subtleBg: 'bg-emerald-500/10',
    subtleHoverBg: 'group-hover:bg-emerald-500/20 hover:bg-emerald-500/20',
    focusRing: 'focus:border-emerald-500/60',
    chapterNumberText: 'text-emerald-400',
    selectionClass: 'selection:bg-emerald-500'
  },
  {
    id: 'teal',
    name: 'Deep Teal',
    primaryHex: '#14b8a6',
    secondaryHex: '#0d9488',
    glowRgba: 'rgba(20, 184, 166, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-teal-500/30 text-zinc-950',
    activePill: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950 shadow-teal-500/20',
    badge: 'bg-teal-500 text-zinc-950',
    accentText: 'text-teal-400',
    accentHoverText: 'group-hover:text-teal-400 hover:text-teal-300',
    borderAccent: 'border-teal-500/30',
    borderHoverAccent: 'hover:border-teal-500/50',
    subtleBg: 'bg-teal-500/10',
    subtleHoverBg: 'group-hover:bg-teal-500/20 hover:bg-teal-500/20',
    focusRing: 'focus:border-teal-500/60',
    chapterNumberText: 'text-teal-400',
    selectionClass: 'selection:bg-teal-500'
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    primaryHex: '#06b6d4',
    secondaryHex: '#0891b2',
    glowRgba: 'rgba(6, 182, 212, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-cyan-500 via-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/30 text-zinc-950',
    activePill: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-zinc-950 shadow-cyan-500/20',
    badge: 'bg-cyan-500 text-zinc-950',
    accentText: 'text-cyan-400',
    accentHoverText: 'group-hover:text-cyan-400 hover:text-cyan-300',
    borderAccent: 'border-cyan-500/30',
    borderHoverAccent: 'hover:border-cyan-500/50',
    subtleBg: 'bg-cyan-500/10',
    subtleHoverBg: 'group-hover:bg-cyan-500/20 hover:bg-cyan-500/20',
    focusRing: 'focus:border-cyan-500/60',
    chapterNumberText: 'text-cyan-400',
    selectionClass: 'selection:bg-cyan-500'
  },
  {
    id: 'blue',
    name: 'Royal Sapphire',
    primaryHex: '#3b82f6',
    secondaryHex: '#1d4ed8',
    glowRgba: 'rgba(59, 130, 246, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/30 text-white',
    activePill: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/20',
    badge: 'bg-blue-500 text-white',
    accentText: 'text-blue-400',
    accentHoverText: 'group-hover:text-blue-400 hover:text-blue-300',
    borderAccent: 'border-blue-500/30',
    borderHoverAccent: 'hover:border-blue-500/50',
    subtleBg: 'bg-blue-500/10',
    subtleHoverBg: 'group-hover:bg-blue-500/20 hover:bg-blue-500/20',
    focusRing: 'focus:border-blue-500/60',
    chapterNumberText: 'text-blue-400',
    selectionClass: 'selection:bg-blue-500'
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    primaryHex: '#6366f1',
    secondaryHex: '#4338ca',
    glowRgba: 'rgba(99, 102, 241, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-indigo-500 via-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/30 text-white',
    activePill: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/20',
    badge: 'bg-indigo-500 text-white',
    accentText: 'text-indigo-400',
    accentHoverText: 'group-hover:text-indigo-400 hover:text-indigo-300',
    borderAccent: 'border-indigo-500/30',
    borderHoverAccent: 'hover:border-indigo-500/50',
    subtleBg: 'bg-indigo-500/10',
    subtleHoverBg: 'group-hover:bg-indigo-500/20 hover:bg-indigo-500/20',
    focusRing: 'focus:border-indigo-500/60',
    chapterNumberText: 'text-indigo-400',
    selectionClass: 'selection:bg-indigo-500'
  },
  {
    id: 'purple',
    name: 'Electric Violet',
    primaryHex: '#a855f7',
    secondaryHex: '#7e22ce',
    glowRgba: 'rgba(168, 85, 247, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/30 text-white',
    activePill: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/20',
    badge: 'bg-purple-500 text-white',
    accentText: 'text-purple-400',
    accentHoverText: 'group-hover:text-purple-400 hover:text-purple-300',
    borderAccent: 'border-purple-500/30',
    borderHoverAccent: 'hover:border-purple-500/50',
    subtleBg: 'bg-purple-500/10',
    subtleHoverBg: 'group-hover:bg-purple-500/20 hover:bg-purple-500/20',
    focusRing: 'focus:border-purple-500/60',
    chapterNumberText: 'text-purple-400',
    selectionClass: 'selection:bg-purple-500'
  },
  {
    id: 'fuchsia',
    name: 'Neon Fuchsia',
    primaryHex: '#d946ef',
    secondaryHex: '#a21caf',
    glowRgba: 'rgba(217, 70, 239, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-fuchsia-500 via-fuchsia-500 to-rose-500 hover:from-fuchsia-600 hover:to-rose-600 shadow-fuchsia-500/30 text-white',
    activePill: 'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-fuchsia-500/20',
    badge: 'bg-fuchsia-500 text-white',
    accentText: 'text-fuchsia-400',
    accentHoverText: 'group-hover:text-fuchsia-400 hover:text-fuchsia-300',
    borderAccent: 'border-fuchsia-500/30',
    borderHoverAccent: 'hover:border-fuchsia-500/50',
    subtleBg: 'bg-fuchsia-500/10',
    subtleHoverBg: 'group-hover:bg-fuchsia-500/20 hover:bg-fuchsia-500/20',
    focusRing: 'focus:border-fuchsia-500/60',
    chapterNumberText: 'text-fuchsia-400',
    selectionClass: 'selection:bg-fuchsia-500'
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    primaryHex: '#f43f5e',
    secondaryHex: '#be123c',
    glowRgba: 'rgba(244, 63, 94, 0.25)',
    primaryBtn: 'bg-gradient-to-r from-rose-500 via-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-500/30 text-white',
    activePill: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-500/20',
    badge: 'bg-rose-500 text-white',
    accentText: 'text-rose-400',
    accentHoverText: 'group-hover:text-rose-400 hover:text-rose-300',
    borderAccent: 'border-rose-500/30',
    borderHoverAccent: 'hover:border-rose-500/50',
    subtleBg: 'bg-rose-500/10',
    subtleHoverBg: 'group-hover:bg-rose-500/20 hover:bg-rose-500/20',
    focusRing: 'focus:border-rose-500/60',
    chapterNumberText: 'text-rose-400',
    selectionClass: 'selection:bg-rose-500'
  }
];

const CATEGORY_RECOMMENDATION_META: Record<
  ContentCategory,
  {
    label: string;
    description: string;
    pill: string;
    borderHover: string;
    textColor: string;
    icon: typeof Smartphone;
  }
> = {
  manhwa: {
    label: 'Webtoons',
    description: '',
    pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderHover: 'hover:border-cyan-400/60',
    textColor: 'text-cyan-400',
    icon: Smartphone
  },
  manga: {
    label: 'Manga',
    description: '',
    pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderHover: 'hover:border-purple-400/60',
    textColor: 'text-purple-400',
    icon: BookOpen
  },
  lightnovel: {
    label: 'Light Novels',
    description: '',
    pill: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    borderHover: 'hover:border-blue-400/60',
    textColor: 'text-blue-400',
    icon: BookMarked
  },
  webnovel: {
    label: 'Webnovels',
    description: '',
    pill: 'bg-[#DA6569]/15 text-[#DA6569] border-[#DA6569]/30',
    borderHover: 'hover:border-[#DA6569]/60',
    textColor: 'text-[#DA6569]',
    icon: Feather
  },
  book: {
    label: 'Classic Literature',
    description: '',
    pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderHover: 'hover:border-rose-400/60',
    textColor: 'text-rose-400',
    icon: Library
  }
};

const getCategoryTheme = (category: string): CategoryTheme => {
  switch (category) {
    case 'manhwa':
      return {
        pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        borderHover: 'hover:border-cyan-400',
        cardGlow: 'hover:shadow-cyan-500/20',
        btnBg: 'hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white',
        glowColor: 'rgba(6, 182, 212, 0.35)',
        borderColor: '#22d3ee',
        titleHover: 'group-hover:text-cyan-400 hover:text-cyan-300'
      };
    case 'manga':
      return {
        pill: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        borderHover: 'hover:border-purple-400',
        cardGlow: 'hover:shadow-purple-500/20',
        btnBg: 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 hover:text-white',
        glowColor: 'rgba(168, 85, 247, 0.35)',
        borderColor: '#c084fc',
        titleHover: 'group-hover:text-purple-400 hover:text-purple-300'
      };
    case 'lightnovel':
      return {
        pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        borderHover: 'hover:border-blue-400',
        cardGlow: 'hover:shadow-blue-500/20',
        btnBg: 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white',
        glowColor: 'rgba(59, 130, 246, 0.35)',
        borderColor: '#60a5fa',
        titleHover: 'group-hover:text-blue-400 hover:text-blue-300'
      };
    case 'webnovel':
      return {
        pill: 'bg-[#DA6569]/20 text-[#DA6569] border-[#DA6569]/30',
        borderHover: 'hover:border-[#DA6569]',
        cardGlow: 'hover:shadow-[#DA6569]/20',
        btnBg: 'hover:bg-[#DA6569] hover:border-[#DA6569] hover:text-white hover:shadow-[0_0_15px_rgba(218,101,105,0.4)]',
        glowColor: 'rgba(218, 101, 105, 0.35)',
        borderColor: '#DA6569',
        titleHover: 'group-hover:text-[#DA6569] hover:text-[#DA6569]'
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
        titleHover: 'group-hover:text-rose-400 hover:text-rose-300'
      };
  }
};

export function getChapterDisplayNumber(
  ch: { title?: string; chapterNumber?: number | null } | Chapter | undefined | null,
  fallbackIndex: number
): number | string {
  if (!ch) return fallbackIndex + 1;

  // 1. If chapterNumber is already a valid positive number, trust it directly!
  if (typeof ch.chapterNumber === 'number' && !isNaN(ch.chapterNumber) && ch.chapterNumber >= 0) {
    return ch.chapterNumber;
  }

  // 2. Parse title carefully without matching years or trailer counts
  if (ch.title) {
    const chMatch = ch.title.match(/(?:chapter|ch\.?|ep\.?|episode)\s*(\d+(?:\.\d+)?)/i);
    if (chMatch) {
      return parseFloat(chMatch[1]);
    }
    const seasonMatch = ch.title.match(/(?:s\d+|season\s*\d+)\s*[-:]\s*(?:chapter|ch\.?|ep\.?|episode)?\s*(\d+(?:\.\d+)?)/i);
    if (seasonMatch) {
      return parseFloat(seasonMatch[1]);
    }
    const leadingMatch = ch.title.match(/^\s*(?:#\s*)?(\d+(?:\.\d+)?)/);
    if (leadingMatch) {
      return parseFloat(leadingMatch[1]);
    }
    const firstNumMatch = ch.title.match(/\b(\d+(?:\.\d+)?)\b/);
    if (firstNumMatch) {
      return parseFloat(firstNumMatch[1]);
    }
  }

  return fallbackIndex + 1;
}

export function sanitizeChapters(rawChapters: Chapter[]): Chapter[] {
  if (!rawChapters || rawChapters.length === 0) return [];
  const allOnes = rawChapters.length > 1 && rawChapters.every(c => c.chapterNumber === 1);
  return rawChapters.map((c, i) => {
    let num = c.chapterNumber;
    if (allOnes || num === undefined || isNaN(num) || num < 0) {
      const extracted = getChapterDisplayNumber({ title: c.title, chapterNumber: -1 }, i);
      num = typeof extracted === 'number' ? extracted : i + 1;
    }
    return {
      ...c,
      chapterNumber: num
    };
  });
}

export const BookOverviewPage: React.FC<BookOverviewPageProps> = ({
  book,
  onBack,
  onStartReading,
  allBooks,
  onChaptersLoaded
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const [isStartingReading, setIsStartingReading] = useState(false);
  const [startingChapterIdx, setStartingChapterIdx] = useState<number | null>(null);

  const handleStartReading = (targetBook: Book, chapterIdx: number) => {
    if (isStartingReading) return;
    setIsStartingReading(true);
    setStartingChapterIdx(chapterIdx);
    try {
      onStartReading(targetBook, chapterIdx);
    } catch {
      setIsStartingReading(false);
      setStartingChapterIdx(null);
    }
  };

  useEffect(() => {
    if (isStartingReading) {
      const timer = setTimeout(() => {
        setIsStartingReading(false);
        setStartingChapterIdx(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isStartingReading]);

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    return sanitizeChapters(book.chapters || []);
  });
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);
  const [sortOrder, setSortOrder] = useState<'dsc' | 'asc'>('asc');
  const [chapterSearch, setChapterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const [viewMode, setViewMode] = useState<'snake' | 'grid'>('snake');
  const [selectedRecCategory, setSelectedRecCategory] = useState<'all' | ContentCategory>('all');
  const [activeRecCategory, setActiveRecCategory] = useState<string>('all');
  const recPillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isRecManualScrollRef = useRef(false);
  const recManualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && book?.id) {
      try {
        const saved = localStorage.getItem(`readverse_completed_${book.id}`);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const toggleChapterCompleted = (chapterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedChapterIds(prev => {
      const isNewlyMarked = !prev.includes(chapterId);
      const next = isNewlyMarked
        ? [...prev, chapterId]
        : prev.filter(id => id !== chapterId);
      try {
        localStorage.setItem(`readverse_completed_${book.id}`, JSON.stringify(next));
      } catch {
        // ignore
      }

      // If newly marked as read, sync to badge progress
      if (isNewlyMarked && session?.user?.email) {
        const isLastChapter = chapters.length > 0 && next.length >= chapters.length;
        fetch('/api/user/badges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: session.user.email,
            event: {
              type: 'read_chapter',
              seriesId: book.id,
              category: book.category,
              genre: Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre || undefined),
              isFinale: isLastChapter
            }
          })
        }).catch(err => console.warn('Failed recording badge progress from chapter complete:', err));

        if (isLastChapter) {
          fetch('/api/user/badges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: session.user.email,
              event: {
                type: 'complete_series',
                seriesId: book.id
              }
            })
          }).catch(err => console.warn('Failed recording series completion for badges:', err));
        }
      }

      return next;
    });
  };
  const chaptersSectionRef = useRef<HTMLDivElement>(null);
  const [isInReadlist, setIsInReadlist] = useState(false);
  const [showAltTitles, setShowAltTitles] = useState(false);
  const [connectedSource, setConnectedSource] = useState<string>('auto');
  const [connectedSourceName, setConnectedSourceName] = useState<string>('Live Connected Mirror');
  const [availableSources, setAvailableSources] = useState<Array<{ id: string; name: string }>>([
    { id: 'weebcentral', name: 'WeebCentral (HQ Scans)' },
    { id: 'mangadistrict', name: 'MangaDistrict (Full Archive)' },
    { id: 'toongod', name: 'ToonGod (Korean Manhwa)' },
    { id: 'manhwabuddy', name: 'ManhwaBuddy (Manhwa Hub)' },
    { id: 'flamecomics', name: 'Flame Comics (Elite Manhwa & Scans)' },
    { id: 'tcbscans', name: 'TCB Scans (Ultra HQ Manga)' },
    { id: 'webtoons', name: 'LINE Webtoons (Official Manhwa)' },
    { id: 'mangapill', name: 'MangaPill (Fast Mirror)' },
    { id: 'mangakatana', name: 'MangaKatana (Deep Archive)' },
    { id: 'mangadex', name: 'MangaDex (Catalog)' }
  ]);
  const [isChangingSource, setIsChangingSource] = useState<boolean>(false);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState<boolean>(false);

  const handleSelectCandidateVersion = async (candidate: SourceCandidate) => {
    setIsChangingSource(true);
    setIsLoadingChapters(true);
    setChapters([]);

    try {
      if (book.category === 'manga' || book.category === 'manhwa' || candidate.id.startsWith('wc-') || candidate.id.startsWith('mk-') || candidate.id.startsWith('md-')) {
        const res = await fetch(
          `/api/manga/chapters?mangaId=${encodeURIComponent(candidate.id)}&title=${encodeURIComponent(candidate.title)}&source=${encodeURIComponent(candidate.sourceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            const sanitized = sanitizeChapters(data.chapters);
            setChapters(sanitized);
            setConnectedSource(candidate.sourceId);
            setConnectedSourceName(data.sourceName || candidate.sourceName);
            onChaptersLoaded?.(sanitized);
            return;
          }
        }
      } else if (book.category === 'book') {
        const res = await fetch(
          `/api/books/read?bookId=${encodeURIComponent(candidate.id)}&title=${encodeURIComponent(candidate.title)}&source=${encodeURIComponent(candidate.sourceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            const sanitized = sanitizeChapters(data.chapters);
            setChapters(sanitized);
            setConnectedSource(candidate.sourceId);
            setConnectedSourceName(candidate.sourceName);
            onChaptersLoaded?.(sanitized);
            return;
          }
        }
      } else {
        const res = await fetch(
          `/api/webnovels/read?novelId=${encodeURIComponent(candidate.id)}&title=${encodeURIComponent(candidate.title)}&source=${encodeURIComponent(candidate.sourceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          const chs = data.book?.chapters || data.chapters;
          if (chs && chs.length > 0) {
            const sanitized = sanitizeChapters(chs);
            setChapters(sanitized);
            setConnectedSource(candidate.sourceId);
            setConnectedSourceName(data.sourceName || candidate.sourceName);
            onChaptersLoaded?.(sanitized);
            return;
          }
        }
      }
      throw new Error('No chapters returned from this version');
    } catch (err) {
      console.warn('Error applying version candidate in overview:', err);
      throw err;
    } finally {
      setIsChangingSource(false);
      setIsLoadingChapters(false);
    }
  };
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(GLOBAL_WALLPAPER_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.url) return parsed.url;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_GLOBAL_WALLPAPER.url;
  });

  const [wallpaperSource, setWallpaperSource] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(GLOBAL_WALLPAPER_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.source) return parsed.source;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_GLOBAL_WALLPAPER.source;
  });

  const [isRefreshingBg, setIsRefreshingBg] = useState(false);

  // Fetch or load global horizontal wallpaper (persists across all overview pages until user shuffles)
  const fetchRandomWallpaper = useCallback(async (forceNew = false) => {
    if (!forceNew) {
      try {
        const cached = localStorage.getItem(GLOBAL_WALLPAPER_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.url) {
            setWallpaperUrl(parsed.url);
            setWallpaperSource(parsed.source || null);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    setIsRefreshingBg(true);
    try {
      const res = await fetch('/api/wallpaper/random');
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          setWallpaperUrl(data.url);
          setWallpaperSource(data.source || null);
          try {
            localStorage.setItem(
              GLOBAL_WALLPAPER_STORAGE_KEY,
              JSON.stringify({ url: data.url, source: data.source })
            );
          } catch {
            // ignore
          }

          // Persist to user data if logged in
          const userEmail = session?.user?.email;
          if (userEmail) {
            fetch('/api/user/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail,
                overviewBg: data.url,
                overviewBgSource: data.source || 'web'
              })
            }).catch(e => console.warn('Failed saving overview bg to user data:', e));
          }
        }
      }
    } catch {
      // Keep existing wallpaper
    } finally {
      setIsRefreshingBg(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(GLOBAL_WALLPAPER_STORAGE_KEY);
      if (!cached) {
        fetchRandomWallpaper(true);
      }
    } catch {
      // ignore
    }
  }, [fetchRandomWallpaper]);

  // Initialize readlist state and reset per-book state when book.id changes
  useEffect(() => {
    setChapters(sanitizeChapters(book.chapters || []));
    setCompletedChapterIds(() => {
      if (typeof window !== 'undefined' && book?.id) {
        try {
          const saved = localStorage.getItem(`readverse_completed_${book.id}`);
          if (saved) return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
      return [];
    });
    setChapterSearch('');
    setCurrentPage(1);
    setOpeningBookId(null);
    setPuterRecs(null);
    try {
      const saved = localStorage.getItem(`readverse_readlist_${book.id}`);
      let inList = saved ? JSON.parse(saved) : false;
      if (!inList) {
        const raw = localStorage.getItem('readverse_want_to_read');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.some((item: any) => (item.bookId || item.id) === book.id)) {
            inList = true;
          }
        }
      }
      setIsInReadlist(inList);
    } catch {
      setIsInReadlist(false);
    }
  }, [book.id, book.chapters]);

  const toggleReadlist = () => {
    const next = !isInReadlist;
    setIsInReadlist(next);

    const readlistItem = {
      bookId: book.id,
      title: book.title,
      author: book.author || 'Unknown',
      category: book.category || 'manga',
      coverImage: book.coverImage || '',
      rating: typeof book.rating === 'number' ? book.rating : 4.5,
      addedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(`readverse_readlist_${book.id}`, JSON.stringify(next));

      const existingRaw = localStorage.getItem('readverse_want_to_read');
      let existingList: any[] = [];
      try {
        existingList = existingRaw ? JSON.parse(existingRaw) : [];
      } catch {
        existingList = [];
      }
      if (!Array.isArray(existingList)) existingList = [];

      if (next) {
        existingList = [readlistItem, ...existingList.filter((item: any) => (item.bookId || item.id) !== book.id)];
        localStorage.setItem(`readverse_readlist_data_${book.id}`, JSON.stringify(readlistItem));
      } else {
        existingList = existingList.filter((item: any) => (item.bookId || item.id) !== book.id);
        localStorage.removeItem(`readverse_readlist_data_${book.id}`);
      }
      localStorage.setItem('readverse_want_to_read', JSON.stringify(existingList));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('readverse_readlist_updated'));
      }
    } catch (e) {
      console.warn('Failed saving readlist to localStorage:', e);
    }

    if (session?.user?.email) {
      fetch('/api/user/readlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session.user.email,
          item: readlistItem,
          remove: !next,
          bookId: book.id
        })
      }).catch(err => console.warn('Failed syncing readlist to account:', err));
    }
  };

  // Fetch real chapters from live sources with multi-source fallback and switcher
  const loadChapters = useCallback(async (targetSource?: string) => {
    // Check if book.chapters are dummy stubs
    const isDummyChapters =
      book.chapters &&
      book.chapters.length > 0 &&
      (book.chapters.length <= 2 &&
        book.chapters.some(
          c =>
            c.title?.includes('Transmigration') ||
            c.title?.includes('The Awakening') ||
            c.title?.includes('Official English Release') ||
            c.id?.includes('wn-ch-') ||
            c.id?.includes('en-') ||
            (c.content && c.content.some(url => typeof url === 'string' && url.includes('unsplash.com')))
        ));

    // If authentic chapters exist already on the book and no specific source requested:
    if (!targetSource && book.chapters && book.chapters.length > 0 && !isDummyChapters) {
      const sanitized = sanitizeChapters(book.chapters);
      setChapters(sanitized);
      const wasAllOnes = book.chapters.length > 1 && book.chapters.every(c => c.chapterNumber === 1);
      if (wasAllOnes) {
        onChaptersLoaded?.(sanitized);
      }
      return;
    }

    // Clear stale chapters immediately
    setChapters([]);
    setIsLoadingChapters(true);

    try {
      // 0. Local Books / Light Novels
      if (book.id.startsWith('local-')) {
        const localRes = await fetch(`/api/books/local/read?bookId=${encodeURIComponent(book.id)}`);
        if (localRes.ok) {
          const data = await localRes.json();
          if (data.chapters && data.chapters.length > 0) {
            const sanitized = sanitizeChapters(data.chapters);
            setChapters(sanitized);
            setConnectedSource('local');
            setConnectedSourceName('Local Library');
            setAvailableSources([{ id: 'local', name: 'Local File' }]);
            onChaptersLoaded?.(sanitized);
            setIsLoadingChapters(false);
            return;
          }
        }
      }

      // 1. Manga / Manhwa
      if (book.category === 'manga' || book.category === 'manhwa' || book.id.startsWith('wc-') || book.id.startsWith('mk-') || book.id.startsWith('md-')) {
        const srcParam = targetSource ? `&source=${encodeURIComponent(targetSource)}` : '';
        const res = await fetch(
          `/api/manga/chapters?mangaId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}${srcParam}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            const sanitized = sanitizeChapters(data.chapters);
            setChapters(sanitized);
            if (data.source) {
              setConnectedSource(data.source);
              setConnectedSourceName(data.sourceName || (data.source === 'weebcentral' ? 'WeebCentral (HQ Scans)' : data.source === 'mangakatana' ? 'MangaKatana (Fast Mirror)' : data.source));
            }
            if (data.availableSources && Array.isArray(data.availableSources)) {
              setAvailableSources(data.availableSources);
            }
            onChaptersLoaded?.(sanitized);
            setIsLoadingChapters(false);
            return;
          }
        }
      } else if (book.category === 'book') {
        const res = await fetch(
          `/api/books/read?bookId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            const sanitized = sanitizeChapters(data.chapters);
            setChapters(sanitized);
            setConnectedSource(book.id.startsWith('gutenberg-') ? 'gutenberg' : 'openlibrary');
            setConnectedSourceName(book.id.startsWith('gutenberg-') ? 'Project Gutenberg' : 'Public Domain Archive');
            setAvailableSources([
              { id: 'gutenberg', name: 'Project Gutenberg' },
              { id: 'standardebooks', name: 'Standard Ebooks' }
            ]);
            onChaptersLoaded?.(sanitized);
            setIsLoadingChapters(false);
            return;
          }
        }
      } else if (book.category === 'webnovel' || book.category === 'lightnovel') {
        let res = await fetch(
          `/api/webnovels/read?novelId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}`
        );
        let data = res.ok ? await res.json() : null;

        const isDummyWebnovel =
          data?.isFallback ||
          (data?.chapters?.length === 2 &&
            data.chapters.some(
              (c: Chapter) =>
                c.title?.includes('Transmigration') ||
                c.title?.includes('The Awakening') ||
                c.title?.includes('Path of Power') ||
                c.title?.includes('Official English Release') ||
                c.id?.includes('wn-ch-') ||
                c.id?.includes('en-')
            ));

        if (!data || !data.chapters || data.chapters.length === 0 || isDummyWebnovel) {
          const searchRes = await fetch(
            `/api/webnovels/search?q=${encodeURIComponent(book.title)}`
          );
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const matched = searchData.books?.[0];
            if (matched?.id) {
              res = await fetch(`/api/webnovels/read?novelId=${encodeURIComponent(matched.id)}&title=${encodeURIComponent(book.title)}`);
              if (res.ok) {
                const altData = await res.json();
                if (altData && !altData.isFallback && altData.chapters && altData.chapters.length > 0) {
                  data = altData;
                }
              }
            }
          }
        }

        const stillDummy =
          data?.isFallback ||
          (data?.chapters?.length === 2 &&
            data.chapters.some(
              (c: Chapter) =>
                c.title?.includes('Transmigration') ||
                c.title?.includes('The Awakening') ||
                c.title?.includes('Path of Power') ||
                c.title?.includes('Official English Release') ||
                c.id?.includes('wn-ch-') ||
                c.id?.includes('en-')
            ));

        if (data && data.chapters && data.chapters.length > 0 && !stillDummy) {
          const sanitized = sanitizeChapters(data.chapters);
          setChapters(sanitized);
          setConnectedSource('webnovel-mirror');
          setConnectedSourceName('LightNovel & WebNovel Mirror');
          setAvailableSources([
            { id: 'webnovel-mirror', name: 'WuxiaWorld / WebNovel Mirror' }
          ]);
          onChaptersLoaded?.(sanitized);
          setIsLoadingChapters(false);
          return;
        }
      }

      // Mirror fallback strictly for manga / manhwa titles only (never search webnovels or books in manga sources)
      if (book.title && (book.category === 'manga' || book.category === 'manhwa')) {
        const srcParam = targetSource ? `&source=${encodeURIComponent(targetSource)}` : '';
        const fallbackRes = await fetch(
          `/api/manga/chapters?mangaId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}${srcParam}`
        );
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const isMangaDummy =
            data?.isFallback ||
            (data?.chapters?.length === 2 &&
              data.chapters.some(
                (c: Chapter) =>
                  c.title?.includes('Transmigration') ||
                  c.title?.includes('The Awakening') ||
                  c.title?.includes('Official English Release') ||
                  c.id?.includes('en-')
              ));

          if (data.chapters && data.chapters.length > 0 && !isMangaDummy) {
            const sanitized = sanitizeChapters(data.chapters);
            setChapters(sanitized);
            if (data.source) {
              setConnectedSource(data.source);
              setConnectedSourceName(data.sourceName || data.source);
            }
            if (data.availableSources && Array.isArray(data.availableSources)) {
              setAvailableSources(data.availableSources);
            }
            onChaptersLoaded?.(sanitized);
            setIsLoadingChapters(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching chapters from sources:', err);
    } finally {
      setIsLoadingChapters(false);
    }
  }, [book.id, book.category, book.title, book.chapters, onChaptersLoaded]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  const handleSwitchSource = async (newSourceId: string) => {
    setIsChangingSource(true);
    await loadChapters(newSourceId);
    setIsChangingSource(false);
  };

  // Filter & sort chapters
  const processedChapters = useMemo(() => {
    let list = [...chapters];

    if (chapterSearch.trim()) {
      const q = chapterSearch.toLowerCase().trim();
      list = list.filter(
        ch =>
          ch.title.toLowerCase().includes(q) ||
          String(ch.chapterNumber).includes(q) ||
          ch.id.toLowerCase().includes(q)
      );
    }

    const indexMap = new Map(chapters.map((c, i) => [c.id, i]));
    list.sort((a, b) => {
      const numA = a.chapterNumber ?? 0;
      const numB = b.chapterNumber ?? 0;
      if (numA !== numB) {
        return sortOrder === 'dsc' ? numB - numA : numA - numB;
      }
      const idxA = indexMap.get(a.id) ?? 0;
      const idxB = indexMap.get(b.id) ?? 0;
      return sortOrder === 'dsc' ? idxB - idxA : idxA - idxB;
    });

    return list;
  }, [chapters, chapterSearch, sortOrder]);

  // Reset page when search, sort, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [chapterSearch, sortOrder, pageSize]);

  const totalPages = Math.max(1, Math.ceil(processedChapters.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedChapters = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return processedChapters.slice(start, start + pageSize);
  }, [processedChapters, safeCurrentPage, pageSize]);

  const snakeCount = Math.min(paginatedChapters.length, SNAKE_POSITIONS.length);
  const snakePath = useMemo(() => getSnakePath(snakeCount), [snakeCount]);

  const handlePageChange = (newPage: number) => {
    const target = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(target);
    if (chaptersSectionRef.current) {
      chaptersSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPaginationItems = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const latestChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

  // Formatting helpers
  const categoryLabel =
    book.category === 'manhwa'
      ? 'MANHUA'
      : book.category === 'manga'
      ? 'MANGA'
      : book.category === 'lightnovel'
      ? 'LIGHT NOVEL'
      : book.category === 'webnovel'
      ? 'WEB NOVEL'
      : 'CLASSIC BOOK';

  const authorName = book.author || (book.category === 'book' ? 'Classic Author' : 'Original Creator');
  const artistName = book.category === 'manhwa' || book.category === 'manga' ? 'Editorial Studio' : 'Official Publisher';

  const activeBg = wallpaperUrl || DEFAULT_GLOBAL_WALLPAPER.url;

  // Current book genres with intelligent fallback based on category
  const currentGenres = useMemo(() => {
    if (book.genre && book.genre.length > 0) {
      return book.genre;
    }
    switch (book.category) {
      case 'book':
        return ['Classic', 'Literature', 'Fiction'];
      case 'lightnovel':
        return ['Fantasy', 'Adventure', 'Light Novel'];
      case 'webnovel':
        return ['Progression', 'Fantasy', 'Serial'];
      case 'manga':
        return ['Shounen', 'Action', 'Adventure'];
      case 'manhwa':
      default:
        return ['Webtoon', 'Drama', 'Action'];
    }
  }, [book.genre, book.category]);

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

  useEffect(() => {
    setCoverIndex(0);
    setIsCoverLoaded(false);
  }, [book.id, book.coverImage]);

  const activeCoverUrl = coverCandidates[coverIndex] || '';

  const handleCoverError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;

    if (!target.dataset.triedProxy && activeCoverUrl.startsWith('http') && !target.src.includes('/api/manga/image-proxy')) {
      target.dataset.triedProxy = 'true';
      target.src = `/api/manga/image-proxy?url=${encodeURIComponent(activeCoverUrl)}&title=${encodeURIComponent(book.title)}`;
      return;
    }

    if (coverIndex + 1 < coverCandidates.length) {
      delete target.dataset.triedProxy;
      setCoverIndex(prev => prev + 1);
      return;
    }

    target.style.display = 'none';
  };

  // Combined catalog deduplicated
  const catalogBooks = useMemo(() => {
    const list = [...(allBooks || []), ...ALL_FAMOUS_BOOKS, ...MOCK_BOOKS];
    const seen = new Set<string>();
    const unique: Book[] = [];
    for (const b of list) {
      if (!b || !b.id) continue;
      const key = b.id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(b);
      }
    }
    return unique;
  }, [allBooks]);

  // Theme color state with localStorage persistence & user profile sync
  const [themeId, setThemeId] = useState<OverviewThemeId>('amber');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readverse_overview_theme') as OverviewThemeId;
      if (saved && OVERVIEW_THEMES.some(t => t.id === saved)) {
        setThemeId(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch and hydrate preferences (overview bg & accent color) from user data
  useEffect(() => {
    const userEmail = session?.user?.email;
    if (!userEmail) return;
    const targetEmail = userEmail;

    let isMounted = true;
    async function loadUserPreferences() {
      try {
        const res = await fetch(`/api/user/preferences?user=${encodeURIComponent(targetEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.overviewAccent && OVERVIEW_THEMES.some(t => t.id === data.overviewAccent)) {
              setThemeId(data.overviewAccent as OverviewThemeId);
              try {
                localStorage.setItem('readverse_overview_theme', data.overviewAccent);
              } catch {}
            }
            if (data.overviewBg) {
              setWallpaperUrl(data.overviewBg);
              setWallpaperSource(data.overviewBgSource || null);
              try {
                localStorage.setItem(
                  GLOBAL_WALLPAPER_STORAGE_KEY,
                  JSON.stringify({ url: data.overviewBg, source: data.overviewBgSource || null })
                );
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Failed loading user preferences from backend:', err);
      }
    }

    loadUserPreferences();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.email]);

  const handleSelectTheme = (newId: OverviewThemeId) => {
    setThemeId(newId);
    try {
      localStorage.setItem('readverse_overview_theme', newId);
    } catch {
      // ignore
    }

    const userEmail = session?.user?.email;
    if (userEmail) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          overviewAccent: newId
        })
      }).catch(err => console.warn('Failed saving overview accent to user data:', err));
    }
  };

  const theme = useMemo(() => {
    return OVERVIEW_THEMES.find(t => t.id === themeId) || OVERVIEW_THEMES[0];
  }, [themeId]);

  // State to trigger re-shuffling of recommendations
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [puterRecs, setPuterRecs] = useState<Record<ContentCategory, PuterRecommendedItem[]> | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);

  // Handler to force fresh AI discovery
  const handleRefreshRecommendations = useCallback(() => {
    if (isAiLoading) return;
    try {
      const normTitle = (book.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      localStorage.removeItem(`readverse_nonhome_recs_v8_${normTitle}`);
      localStorage.removeItem(`readverse_nonhome_recs_v9_${normTitle}`);
    } catch {
      // ignore
    }
    setPuterRecs(null);
    setIsAiLoading(true);
    setRandomSeed(s => s + 1);
  }, [book.title, isAiLoading]);

  // Query Puter AI in background without blocking UI
  useEffect(() => {
    if (!book.title) return;
    setPuterRecs(null);
    const controller = new AbortController();
    setIsAiLoading(true);

    getPuterAIRecommendations(book, catalogBooks, controller.signal)
      .then(res => {
        if (!controller.signal.aborted && res && res.recommendations) {
          setPuterRecs(res.recommendations);
        }
      })
      .catch(err => {
        console.warn('Puter AI recommendations fallback:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsAiLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.title, book.category, catalogBooks, randomSeed]);

  const emptyRecs: Record<ContentCategory, PuterRecommendedItem[]> = useMemo(() => ({
    manhwa: [],
    manga: [],
    lightnovel: [],
    webnovel: [],
    book: []
  }), []);

  const recommendationsByCategory = useMemo(() => {
    return puterRecs || emptyRecs;
  }, [puterRecs, emptyRecs]);

  const handleOpenRecommendedBook = useCallback((targetBook: Book) => {
    setOpeningBookId(targetBook.id);
    try {
      localStorage.setItem(`readverse_book_${targetBook.id}`, JSON.stringify(targetBook));
    } catch {
      // ignore
    }
    router.push(`/book/${encodeURIComponent(targetBook.id)}`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [router]);

  const recRowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Dynamic live similar books discovered as user scrolls
  const [additionalRecs, setAdditionalRecs] = useState<Record<ContentCategory, PuterRecommendedItem[]>>({
    manhwa: [],
    manga: [],
    lightnovel: [],
    webnovel: [],
    book: []
  });

  const totalMatchingRecs = useMemo(() => {
    const baseCount = Object.values(recommendationsByCategory).reduce(
      (sum, list) => sum + (list?.length || 0),
      0
    );
    const extraCount = Object.values(additionalRecs).reduce(
      (sum, list) => sum + (list?.length || 0),
      0
    );
    return baseCount + extraCount;
  }, [recommendationsByCategory, additionalRecs]);
  const [recLoadingCategory, setRecLoadingCategory] = useState<Record<ContentCategory, boolean>>({
    manhwa: false,
    manga: false,
    lightnovel: false,
    webnovel: false,
    book: false
  });
  const [recCategoryPage, setRecCategoryPage] = useState<Record<ContentCategory, number>>({
    manhwa: 2,
    manga: 2,
    lightnovel: 2,
    webnovel: 2,
    book: 2
  });
  const [recHasMore, setRecHasMore] = useState<Record<ContentCategory, boolean>>({
    manhwa: true,
    manga: true,
    lightnovel: true,
    webnovel: true,
    book: true
  });
  const loadingCategoryRef = useRef<Record<string, boolean>>({});

  // Reset additional dynamic recs when target book or seed changes
  useEffect(() => {
    setAdditionalRecs({ manhwa: [], manga: [], lightnovel: [], webnovel: [], book: [] });
    setRecLoadingCategory({ manhwa: false, manga: false, lightnovel: false, webnovel: false, book: false });
    setRecCategoryPage({ manhwa: 2, manga: 2, lightnovel: 2, webnovel: 2, book: 2 });
    setRecHasMore({ manhwa: true, manga: true, lightnovel: true, webnovel: true, book: true });
    loadingCategoryRef.current = {};
  }, [book.id, book.title, randomSeed]);

  // Combined real recommendations: initial + dynamically loaded similar books
  const getCategoryList = useCallback((catKey: ContentCategory) => {
    const base = recommendationsByCategory[catKey] || [];
    const extra = additionalRecs[catKey] || [];
    return [...base, ...extra];
  }, [recommendationsByCategory, additionalRecs]);

  // Load more brand-new similar books dynamically for a specific shelf
  const loadMoreForCategory = useCallback(async (catKey: ContentCategory) => {
    if (loadingCategoryRef.current[catKey] || recHasMore[catKey] === false) return;
    loadingCategoryRef.current[catKey] = true;
    setRecLoadingCategory(prev => ({ ...prev, [catKey]: true }));

    const currentPage = recCategoryPage[catKey] || 2;
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 500));
      const [moreItems] = await Promise.all([
        fetchMoreCategoryRecommendations(book, catKey, currentPage),
        minDelay
      ]);
      if (!moreItems || moreItems.length === 0) {
        setRecHasMore(prev => ({ ...prev, [catKey]: false }));
      } else {
        setAdditionalRecs(prev => {
          const currentList = [...(recommendationsByCategory[catKey] || []), ...(prev[catKey] || [])];
          const existingIds = new Set(currentList.map(item => item.book.id));
          const existingTitles = new Set(currentList.map(item => normalizeTitle(item.book.title)));

          const uniqueNew = moreItems.filter(item => {
            const bNorm = normalizeTitle(item.book.title);
            return !existingIds.has(item.book.id) && !existingTitles.has(bNorm);
          });

          if (uniqueNew.length === 0) {
            return prev;
          }

          return {
            ...prev,
            [catKey]: [...(prev[catKey] || []), ...uniqueNew]
          };
        });
        setRecCategoryPage(prev => ({ ...prev, [catKey]: currentPage + 1 }));
      }
    } catch (err) {
      console.warn(`Failed to fetch more similar ${catKey}:`, err);
    } finally {
      loadingCategoryRef.current[catKey] = false;
      setRecLoadingCategory(prev => ({ ...prev, [catKey]: false }));
    }
  }, [book, recHasMore, recCategoryPage, recommendationsByCategory]);

  // Listener to trigger fetching more similar books dynamically as user scrolls horizontally
  const handleRecRowScroll = useCallback((catKey: ContentCategory, el: HTMLDivElement) => {
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - Math.max(800, el.clientWidth * 1.5)) {
      loadMoreForCategory(catKey);
    }
  }, [loadMoreForCategory]);

  const scrollRecRow = useCallback((catKey: string, direction: 'left' | 'right') => {
    const el = recRowRefs.current[catKey];
    if (el) {
      if (direction === 'right') {
        const cat = catKey as ContentCategory;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - el.clientWidth * 1.5) {
          loadMoreForCategory(cat);
        }
      }
      const offset = direction === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [loadMoreForCategory]);

  const scrollToRecCategorySection = useCallback((catId: string) => {
    if (catId === 'all') {
      setActiveRecCategory('all');
      setSelectedRecCategory('all');
      isRecManualScrollRef.current = true;
      if (recManualScrollTimeoutRef.current) clearTimeout(recManualScrollTimeoutRef.current);
      recManualScrollTimeoutRef.current = setTimeout(() => {
        isRecManualScrollRef.current = false;
      }, 800);
      const section = document.getElementById('category-recommendations');
      if (section) {
        const yOffset = -90;
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    setActiveRecCategory(catId);
    isRecManualScrollRef.current = true;
    if (recManualScrollTimeoutRef.current) clearTimeout(recManualScrollTimeoutRef.current);
    recManualScrollTimeoutRef.current = setTimeout(() => {
      isRecManualScrollRef.current = false;
    }, 800);

    if (selectedRecCategory !== 'all') {
      setSelectedRecCategory('all');
      setTimeout(() => {
        const el = document.getElementById(`rec-category-${catId}`);
        if (el) {
          const yOffset = -100;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 60);
    } else {
      const el = document.getElementById(`rec-category-${catId}`);
      if (el) {
        const yOffset = -100;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [selectedRecCategory]);

  // Scroll spy: Update category icon selection when scrolling past sections, same as home page
  useEffect(() => {
    if (selectedRecCategory !== 'all') return;

    const categoryKeys: ContentCategory[] = ['manhwa', 'manga', 'lightnovel', 'webnovel', 'book'];

    const handleScroll = () => {
      if (isRecManualScrollRef.current) return;

      const sectionEl = document.getElementById('category-recommendations');
      if (!sectionEl) return;

      const sectionRect = sectionEl.getBoundingClientRect();
      const triggerY = 240;

      // If user hasn't reached the recommendations section, active is 'all'
      if (sectionRect.top > triggerY) {
        setActiveRecCategory('all');
        return;
      }

      // Collect rendered category shelf elements
      const sections: { id: string; top: number }[] = [];
      for (const catId of categoryKeys) {
        const el = document.getElementById(`rec-category-${catId}`);
        if (el) {
          sections.push({ id: catId, top: el.getBoundingClientRect().top });
        }
      }

      if (sections.length === 0) return;

      // If above the first category shelf, active is 'all'
      if (sections[0].top > triggerY) {
        setActiveRecCategory('all');
        return;
      }

      // Find the last section whose top has crossed the trigger threshold
      let activeCat = sections[0].id;
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].top <= triggerY) {
          activeCat = sections[i].id;
        } else {
          break;
        }
      }

      // If reached the bottom of the page, activate the last section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isAtBottom && sections.length > 0) {
        activeCat = sections[sections.length - 1].id;
      }

      setActiveRecCategory(activeCat);
    };

    let ticking = false;
    const onScroll = () => {
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
      if (recManualScrollTimeoutRef.current) clearTimeout(recManualScrollTimeoutRef.current);
    };
  }, [selectedRecCategory, recommendationsByCategory]);

  // Keep active category pill in view on mobile horizontal scroll
  useEffect(() => {
    const currentPill = recPillRefs.current[activeRecCategory];
    if (currentPill && typeof window !== 'undefined' && window.innerWidth < 1024) {
      currentPill.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
    }
  }, [activeRecCategory]);

  return (
    <div className={`min-h-screen bg-[#090b11] text-zinc-100 relative ${theme.selectionClass} selection:text-white pb-24 overflow-x-clip`}>
      {/* Cinematic Hero Background Banner Layer (Powered by pic.re, nekosia.cat & nekos.best) */}
      <div className="absolute top-0 left-0 right-0 h-[850px] sm:h-[950px] md:h-[1050px] overflow-hidden pointer-events-none select-none z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeBg}
          src={activeBg}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-80 sm:opacity-90 scale-105 transform-gpu transition-opacity duration-500"
        />

        {/* Dynamic accent glow matching theme */}
        <div
          className="absolute top-1/4 left-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: theme.glowRgba }}
        />

        {/* Gradient overlays: cinematic dissolves */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#090b11] via-[#090b11]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 sm:h-96 bg-gradient-to-t from-[#090b11] via-[#090b11]/85 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-[#090b11]/60 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-[#090b11]/60 to-transparent" />
        <div className="absolute inset-0 bg-[#090b11]/20" />
      </div>

      <div className="relative z-10 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {/* Top Breadcrumb Navigation & Back Button */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-400 truncate">
            <button
              onClick={() => (onBack ? onBack() : router.push('/'))}
              className="hover:text-white transition-colors cursor-pointer"
            >
              HOME
            </button>
            <span className="text-zinc-600">/</span>
            <span className="hover:text-white uppercase transition-colors">
              {categoryLabel}
            </span>
            <span className="text-zinc-600">/</span>
            <span className={`font-bold truncate max-w-[200px] sm:max-w-md ${theme.accentText}`}>
              {book.title}
            </span>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Widescreen Wallpaper Shuffle Button */}
            <button
              onClick={() => fetchRandomWallpaper(true)}
              disabled={isRefreshingBg}
              title={wallpaperSource ? `Shuffle Widescreen Wallpaper (source: ${wallpaperSource})` : "Shuffle Widescreen Wallpaper"}
              style={{
                borderColor: `${theme.primaryHex}70`,
                backgroundColor: `${theme.primaryHex}18`,
                boxShadow: `0 0 16px ${theme.primaryHex}2a`
              }}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 backdrop-blur-md hover:brightness-125"
            >
              <Sparkles
                className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 ${isRefreshingBg ? 'animate-spin' : ''}`}
                style={{
                  color: theme.primaryHex,
                  filter: `drop-shadow(0 0 6px ${theme.primaryHex}aa)`
                }}
              />
              <span
                className="hidden sm:inline transition-colors"
                style={{ color: theme.primaryHex }}
              >
                {isRefreshingBg ? 'Finding Wallpaper...' : 'Shuffle Wallpaper'}
              </span>
            </button>

            <button
              onClick={() => (onBack ? onBack() : router.push('/'))}
              style={{
                borderColor: `${theme.primaryHex}55`,
                backgroundColor: `${theme.primaryHex}12`,
                boxShadow: `0 0 14px ${theme.primaryHex}20`
              }}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all duration-200 active:scale-95 shrink-0 cursor-pointer backdrop-blur-md hover:brightness-125"
            >
              <ArrowLeft
                className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
                style={{
                  color: theme.primaryHex,
                  filter: `drop-shadow(0 0 6px ${theme.primaryHex}88)`
                }}
              />
              <span
                className="transition-colors"
                style={{ color: theme.primaryHex }}
              >
                Back to Library
              </span>
            </button>
          </div>
        </div>

        {/* Top Hero Section: Poster Cover + Book Details Below */}
        <div className="flex flex-col gap-6 items-start">
          {/* Main Poster Cover */}
          <div className="w-52 sm:w-60 md:w-64 lg:w-72 shrink-0">
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.06)] border border-white/15 bg-zinc-900 group">
              {/* Badge on top-left of cover */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className="px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border text-[10px] font-black tracking-wider shadow-lg uppercase transition-colors"
                  style={{ borderColor: `${theme.primaryHex}60`, color: theme.primaryHex }}
                >
                  COMPLETED
                </span>
              </div>

              {/* Dedicated Cover Loading State with Shimmer Wave and Spinner */}
              {!isCoverLoaded && activeCoverUrl && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
                  <div className="relative flex flex-col items-center justify-center gap-2 p-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-300 tracking-wide uppercase">
                      Loading cover...
                    </span>
                  </div>
                </div>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              {activeCoverUrl ? (
                <img
                  key={activeCoverUrl}
                  src={activeCoverUrl}
                  alt={book.title}
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsCoverLoaded(true)}
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isCoverLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onError={e => {
                    setIsCoverLoaded(false);
                    handleCoverError(e);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-950">
                  <BookOpen className="w-12 h-12 text-zinc-600 mb-2" />
                  <span className="text-xs font-semibold text-zinc-400 line-clamp-3">{book.title}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Title, Badges, Synopsis, Actions */}
          <div className="w-full space-y-5 min-w-0">
            {/* Title & Alternate Names */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
                {book.title}
              </h1>

              {/* Alt Names toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowAltTitles(prev => !prev)}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{book.title} • Official Release</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAltTitles ? 'rotate-180' : ''}`} />
                </button>

                {showAltTitles && (
                  <div className="absolute top-full left-0 mt-2 p-3 rounded-xl bg-zinc-950/95 border border-white/15 text-xs text-zinc-300 space-y-1 z-30 shadow-2xl backdrop-blur-xl">
                    <p><span className="text-zinc-500">Title:</span> {book.title}</p>
                    <p><span className="text-zinc-500">Author:</span> {book.author}</p>
                    <p><span className="text-zinc-500">Category:</span> {categoryLabel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2.5 py-0.5 rounded-md ${theme.badge} font-black shadow-sm transition-colors`}>
                HD
              </span>
              {!isLoadingChapters && chapters.length === 0 ? (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Print Catalog Only (No Digital Scans)
                </span>
              ) : (
                <>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-950/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {connectedSourceName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    VERIFIED
                  </span>
                </>
              )}
              <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-300 font-semibold capitalize">
                {book.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-300 font-semibold">
                ⭐ {book.rating || 4.9}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-300 font-semibold">
                SAFE
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-300 font-semibold">
                EN
              </span>
            </div>

            {/* Synopsis Section */}
            <div className="space-y-2 pt-1 max-w-4xl">
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-zinc-400 uppercase">
                <span
                  className="w-2 h-2 rounded-full inline-block transition-colors"
                  style={{ backgroundColor: theme.primaryHex }}
                />
                <span>SYNOPSIS</span>
              </div>

              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                <p className={isReadMore ? '' : 'line-clamp-4'}>
                  {book.description ||
                    'Explore chapters of this incredible story with full high-resolution streaming, bookmarking, and community rewards on ReadVerse.'}
                </p>
                <button
                  onClick={() => setIsReadMore(prev => !prev)}
                  className={`mt-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${theme.accentText} ${theme.accentHoverText}`}
                >
                  <span>{isReadMore ? 'Read Less' : 'Read More'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isReadMore ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Start Reading / Chapters Available */}
              {chapters.length > 0 ? (
                <>
                  <button
                    onClick={() => handleStartReading({ ...book, chapters }, 0)}
                    disabled={isStartingReading}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all ${
                      isStartingReading && startingChapterIdx === 0
                        ? 'opacity-85 cursor-wait scale-[0.98]'
                        : isStartingReading
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95 cursor-pointer'
                    } ${theme.primaryBtn}`}
                  >
                    {isStartingReading && startingChapterIdx === 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>Start reading</span>
                      </>
                    )}
                  </button>

                  {/* Read Latest Chapter */}
                  <button
                    onClick={() => {
                      const latestIdx = chapters.length > 0 ? chapters.length - 1 : 0;
                      handleStartReading({ ...book, chapters }, latestIdx);
                    }}
                    disabled={isStartingReading}
                    className={`flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 hover:text-white font-bold text-sm transition-all ${
                      isStartingReading && startingChapterIdx !== 0 && startingChapterIdx !== null
                        ? 'opacity-85 cursor-wait'
                        : isStartingReading
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {isStartingReading && startingChapterIdx !== 0 && startingChapterIdx !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Read Latest (Ch. {latestChapter ? getChapterDisplayNumber(latestChapter, chapters.length - 1) : chapters.length || 1})</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  title="No digital translation found on online webnovel mirrors"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 cursor-not-allowed opacity-80"
                >
                  <BookOpen className="w-4 h-4 text-zinc-500" />
                  <span>{isLoadingChapters ? 'Checking Sources...' : 'No Digital Chapters Available'}</span>
                </button>
              )}

              {/* Add to Readlist */}
              <button
                onClick={toggleReadlist}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border font-bold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isInReadlist
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-200 hover:text-white'
                }`}
              >
                {isInReadlist ? (
                  <>
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>In Readlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Add to Readlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= THEME COLOR SELECTOR TOOLBAR (ABOVE AVAILABLE CHAPTERS) ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-xl border transition-colors shadow-sm"
              style={{
                backgroundColor: `${theme.primaryHex}20`,
                borderColor: `${theme.primaryHex}40`,
                color: theme.primaryHex
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-zinc-300 tracking-wide uppercase">Theme Accents</span>
          </div>

          {/* Color Palette Choices (Clean circular swatches without color names) */}
          <div className="flex items-center gap-2 flex-wrap">
            {OVERVIEW_THEMES.map(t => {
              const isSelected = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTheme(t.id)}
                  aria-label={`${t.id} theme`}
                  className={`group relative p-1 rounded-full border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.15] border-white/60 ring-2 ring-white/60 ring-offset-2 ring-offset-[#090b11] shadow-lg scale-110'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/25 opacity-75 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <span
                    className="block w-5 h-5 rounded-full shrink-0 shadow-inner transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${t.primaryHex}, ${t.secondaryHex})`,
                      boxShadow: isSelected ? `0 0 12px ${t.primaryHex}90` : undefined
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= MAIN CONTENT: Chapters List (Side-by-side with Specifications & Recommendations) ================= */}
        <div ref={chaptersSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pt-8 border-t border-white/[0.08] items-start">
          {/* LEFT / MAIN COLUMN: Available Chapters List (lg:col-span-7 xl:col-span-8) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 min-w-0">
            {/* Header & Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Available Chapters</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                      {chapters.length} chapters
                    </span>
                  </h2>
                </div>

                {/* Connected Source Indicator & Source Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Source: <strong className="font-semibold text-emerald-300">{connectedSourceName}</strong></span>
                  </div>

                  {/* Browse Versions & Alternative Editions Modal */}
                  <button
                    onClick={() => setIsSourcePickerOpen(true)}
                    disabled={isChangingSource || isLoadingChapters}
                    title="Browse and select other versions or sources for this title"
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>Browse Versions</span>
                  </button>

                  {/* Switch source dropdown if multiple sources available */}
                  {availableSources.length > 1 && (
                    <div className="relative inline-flex items-center">
                      <select
                        value={connectedSource}
                        disabled={isChangingSource || isLoadingChapters}
                        onChange={(e) => handleSwitchSource(e.target.value)}
                        className="appearance-none pl-2.5 pr-6 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white outline-none cursor-pointer transition-colors"
                      >
                        {availableSources.map(s => (
                          <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                            Switch: {s.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                    </div>
                  )}

                  {/* Re-sync Source button */}
                  <button
                    onClick={() => handleSwitchSource(connectedSource)}
                    disabled={isChangingSource || isLoadingChapters}
                    title="Re-sync chapters from source mirror"
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isChangingSource || isLoadingChapters ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Re-sync</span>
                  </button>
                </div>
              </div>

              {/* Range Quick Jump Dropdown */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Range:</span>
                  <div className="relative">
                    <select
                      value={safeCurrentPage}
                      onChange={(e) => handlePageChange(Number(e.target.value))}
                      className={`appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-zinc-200 outline-none cursor-pointer transition-colors ${theme.focusRing}`}
                    >
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const startIdx = i * pageSize;
                        const endIdx = Math.min((i + 1) * pageSize, processedChapters.length) - 1;
                        const firstCh = getChapterDisplayNumber(processedChapters[startIdx], startIdx);
                        const lastCh = getChapterDisplayNumber(processedChapters[endIdx], endIdx);
                        const label = `Ch. ${firstCh} – ${lastCh} (Page ${i + 1})`;
                        return (
                          <option key={i} value={i + 1} className="bg-zinc-900 text-zinc-200">
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Search, Filter & Sort Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  placeholder="Search chapters by number, title, or keyword..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 text-xs text-white placeholder-zinc-500 outline-none transition-all ${theme.focusRing}`}
                />
              </div>

              {/* Dropdown & Controls */}
              <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto">
                {/* View Mode Toggle: Snake Path vs Grid */}
                <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/10 p-0.5 text-xs font-bold">
                  <button
                    onClick={() => setViewMode('snake')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'snake'
                        ? `${theme.activePill} font-black shadow-md`
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Serpentine Snake Path View"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Snake Path</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? `${theme.activePill} font-black shadow-md`
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Classic Grid View"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Grid</span>
                  </button>
                </div>

                {/* Sort Order Toggle */}
                <button
                  onClick={() => setSortOrder(prev => (prev === 'dsc' ? 'asc' : 'dsc'))}
                  title="Toggle chapter sort order"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="uppercase">{sortOrder}</span>
                </button>
              </div>
            </div>

            {/* Showing Range Summary */}
            {processedChapters.length > 0 && !isLoadingChapters && (
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>
                  Showing{' '}
                  <strong className="text-zinc-200">
                    {(safeCurrentPage - 1) * pageSize + 1}–{Math.min(safeCurrentPage * pageSize, processedChapters.length)}
                  </strong>{' '}
                  of <strong className="text-zinc-200">{processedChapters.length}</strong> chapters
                </span>
                {totalPages > 1 && (
                  <span>
                    Page <strong className="text-zinc-200">{safeCurrentPage}</strong> of{' '}
                    <strong className="text-zinc-200">{totalPages}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Chapters View Area */}
            {isLoadingChapters ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.05]" />
                ))}
              </div>
            ) : processedChapters.length === 0 ? (
              <div className="py-12 px-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 max-w-xl mx-auto">
                <p className="text-sm font-semibold text-zinc-300">
                  {chapterSearch
                    ? `No chapters found matching "${chapterSearch}"`
                    : 'No digital chapters available from online translation mirrors.'}
                </p>
                {!chapterSearch && (
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    This title is indexed from the Japanese publication catalog (AniList / Kodansha Ranobe Bunko), but does not have an active digital English serialization or scanlation online.
                  </p>
                )}
                {chapterSearch && (
                  <button
                    onClick={() => setChapterSearch('')}
                    className={`text-xs ${theme.accentText} ${theme.accentHoverText} font-bold transition-colors`}
                  >
                    Clear chapter filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'snake' ? (
              /* Snake Path Serpentine Flow */
              <div className="w-full overflow-x-auto pb-4 pt-2">
                <div className="relative w-full min-w-[580px] max-w-4xl mx-auto h-[260px] sm:h-[280px] select-none">
                  {/* Glowing Golden Road Track & Futuristic Arrow Indicators */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 900 270"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      {/* Theme Track Gradient */}
                      <linearGradient id="goldTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={theme.primaryHex} />
                        <stop offset="50%" stopColor={theme.secondaryHex} />
                        <stop offset="100%" stopColor={theme.primaryHex} />
                      </linearGradient>

                      {/* Theme Neon Glow */}
                      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={theme.primaryHex} floodOpacity="0.75" />
                        <feDropShadow dx="0" dy="1" stdDeviation="6" floodColor={theme.secondaryHex} floodOpacity="0.45" />
                      </filter>
                    </defs>

                    {snakePath ? (
                      <>
                        {/* Outer Glowing Highway */}
                        <path
                          d={snakePath}
                          fill="none"
                          stroke="url(#goldTrackGrad)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#goldGlow)"
                        />

                        {/* Inner Bright Conduit Core */}
                        <path
                          d={snakePath}
                          fill="none"
                          stroke="#fffbeb"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    ) : null}

                    {/* Row 0 Direction Arrows: Double Chevrons (Pointing Right) */}
                    {/* At X = 300 */}
                    {snakeCount >= 2 && (
                      <>
                        <path d="M 294,49 L 302,55 L 294,61" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 302,49 L 310,55 L 302,61" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* At X = 600 */}
                    {snakeCount >= 3 && (
                      <>
                        <path d="M 594,49 L 602,55 L 594,61" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 602,49 L 610,55 L 602,61" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* Right U-Turn Apex Directional Arrow (Pointing Down) */}
                    {snakeCount >= 4 && (
                      <>
                        <path d="M 784,90 L 790,96 L 796,90" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 784,96 L 790,102 L 796,96" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* Row 1 Direction Arrows: Double Chevrons (Pointing Left) */}
                    {/* At X = 600 */}
                    {snakeCount >= 5 && (
                      <>
                        <path d="M 606,129 L 598,135 L 606,141" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 598,129 L 590,135 L 598,141" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* At X = 300 */}
                    {snakeCount >= 6 && (
                      <>
                        <path d="M 306,129 L 298,135 L 306,141" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 298,129 L 290,135 L 298,141" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* Left U-Turn Apex Directional Arrow (Pointing Down) */}
                    {snakeCount >= 7 && (
                      <>
                        <path d="M 104,170 L 110,176 L 116,170" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 104,176 L 110,182 L 116,176" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* Row 2 Direction Arrows: Double Chevrons (Pointing Right) */}
                    {/* At X = 300 */}
                    {snakeCount >= 8 && (
                      <>
                        <path d="M 294,209 L 302,215 L 294,221" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 302,209 L 310,215 L 302,221" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}

                    {/* At X = 600 */}
                    {snakeCount >= 9 && (
                      <>
                        <path d="M 594,209 L 602,215 L 594,221" fill="none" stroke={theme.primaryHex} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 602,209 L 610,215 L 602,221" fill="none" stroke={theme.secondaryHex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#goldGlow)" />
                      </>
                    )}
                  </svg>

                  {/* Snake Interactive Chapter Capsules */}
                  {paginatedChapters.map((ch, idx) => {
                    if (idx >= SNAKE_POSITIONS.length) return null;
                    const pos = SNAKE_POSITIONS[idx];
                    const isFirst = idx === 0;
                    const isLast = idx === paginatedChapters.length - 1 || idx === 8;
                    const style = isFirst
                      ? SNAKE_NODE_STYLES[0]
                      : isLast
                      ? SNAKE_NODE_STYLES[8]
                      : SNAKE_NODE_STYLES[idx] || SNAKE_NODE_STYLES[1];

                    const originalIndex = chapters.findIndex(c => c.id === ch.id);
                    const chapterNumber = getChapterDisplayNumber(ch, originalIndex >= 0 ? originalIndex : idx);
                    const isDone = completedChapterIds.includes(ch.id);

                    return (
                      <div
                        key={ch.id || idx}
                        style={{
                          position: 'absolute',
                          left: pos.leftPercent,
                          top: pos.topPercent,
                          transform: 'translate(-50%, -50%)'
                        }}
                        className={`group z-10 w-36 sm:w-44 md:w-48 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#0e111d]/95 hover:bg-[#151a2d] border-2 ${
                          isDone
                            ? 'border-emerald-500/60 shadow-[0_4px_18px_rgba(0,0,0,0.6),0_0_12px_rgba(16,185,129,0.3)]'
                            : `${style.boxBorder} ${style.boxGlow}`
                        } transition-all duration-300 cursor-pointer backdrop-blur-md hover:scale-[1.05] active:scale-[0.98] flex items-center justify-between gap-2`}
                        onClick={() => handleStartReading({ ...book, chapters }, originalIndex >= 0 ? originalIndex : 0)}
                      >
                        {/* Milestone Badge (Start / Finish) */}
                        {style.isStart ? (
                          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[9px] tracking-wider shrink-0 shadow-sm">
                            <span>START</span>
                          </div>
                        ) : style.isFinish ? (
                          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-[9px] tracking-wider shrink-0 shadow-sm">
                            <span>FINISH</span>
                          </div>
                        ) : null}

                        {/* Center Text (Chapter Number & Title) */}
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1 leading-none">
                            <span className={`text-[10px] sm:text-[11px] font-black ${theme.chapterNumberText}`}>
                              Ch. {chapterNumber}
                            </span>
                            {isDone && (
                              <span className="text-[8px] font-bold text-emerald-400">✓</span>
                            )}
                          </div>
                          <p className={`text-[9px] sm:text-[10px] text-zinc-300 ${theme.accentHoverText} transition-colors truncate mt-0.5 leading-tight`}>
                            {ch.title || `Chapter ${chapterNumber}`}
                          </p>
                        </div>

                        {/* Right Quick Action / Complete Toggle */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleChapterCompleted(ch.id, e)}
                            title={isDone ? 'Mark unread' : 'Mark completed'}
                            className={`w-6 h-6 rounded-full text-[9px] font-bold border flex items-center justify-center transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {isDone ? '✓' : <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Classic Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {paginatedChapters.map((ch, idx) => {
                  const originalIndex = chapters.findIndex(c => c.id === ch.id);
                  const chapterNumber = getChapterDisplayNumber(ch, originalIndex >= 0 ? originalIndex : idx);
                  const isDone = completedChapterIds.includes(ch.id);

                  return (
                    <div
                      key={ch.id || idx}
                      onClick={() => handleStartReading({ ...book, chapters }, originalIndex >= 0 ? originalIndex : 0)}
                      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#0e101c]/90 hover:bg-[#161a2e] border border-white/[0.07] ${theme.borderHoverAccent} transition-all cursor-pointer shadow-sm hover:shadow-lg active:scale-[0.99]`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Chapter Pill Badge */}
                        <span className={`px-2.5 py-1 rounded-lg bg-white/[0.06] ${theme.subtleHoverBg} ${theme.accentHoverText} border border-white/10 text-xs font-black text-zinc-200 transition-colors shrink-0`}>
                          Ch. {chapterNumber}
                        </span>

                        <div className="min-w-0">
                          <h4 className={`text-xs sm:text-sm font-bold text-zinc-200 ${theme.accentHoverText} transition-colors truncate`}>
                            {ch.title || `Chapter ${chapterNumber}`}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <span>Read {categoryLabel}</span>
                            <span>•</span>
                            <span>{isDone ? 'Completed' : 'Verified Mirror'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => toggleChapterCompleted(ch.id, e)}
                          title={isDone ? 'Mark unread' : 'Mark completed'}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/5 text-zinc-500 border-white/10 hover:text-white'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <ChevronRight className={`w-4 h-4 text-zinc-600 ${theme.accentHoverText} group-hover:translate-x-0.5 transition-all shrink-0`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

                {/* Bottom Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/[0.08]">
                    <div className="text-xs text-zinc-400">
                      Page <strong className="text-white">{safeCurrentPage}</strong> of{' '}
                      <strong className="text-white">{totalPages}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* First Page Button */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={safeCurrentPage === 1}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-25 disabled:pointer-events-none border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Prev Page Button */}
                      <button
                        onClick={() => handlePageChange(safeCurrentPage - 1)}
                        disabled={safeCurrentPage === 1}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-25 disabled:pointer-events-none border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Numbered Page Buttons */}
                      <div className="flex items-center gap-1">
                        {getPaginationItems(safeCurrentPage, totalPages).map((item, pIdx) => {
                          if (item === '...') {
                            return (
                              <span key={`ellipsis-${pIdx}`} className="px-2 text-xs text-zinc-600">
                                ...
                              </span>
                            );
                          }
                          const pageNum = item as number;
                          const isActive = pageNum === safeCurrentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? `${theme.badge} shadow-md font-black scale-105`
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Page Button */}
                      <button
                        onClick={() => handlePageChange(safeCurrentPage + 1)}
                        disabled={safeCurrentPage === totalPages}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-25 disabled:pointer-events-none border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Last Page Button */}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={safeCurrentPage === totalPages}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-25 disabled:pointer-events-none border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Last Page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Redesigned Specs, Genres & Themes, Recommendations (lg:col-span-5 xl:col-span-4) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6">
            {/* Widget 1: SPECIFICATIONS & CREATORS */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111422] to-[#0c0d16] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.4)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full transition-colors" style={{ backgroundColor: theme.primaryHex }} />
                  <h3 className="text-xs font-black tracking-wider text-zinc-300 uppercase">
                    Specifications & Creators
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.05]">
                  Info
                </span>
              </div>

              {/* Creators Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-colors space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    <User className="w-3 h-3 transition-colors" style={{ color: theme.primaryHex }} />
                    <span>Author</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-200 truncate" title={authorName}>
                    {authorName}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-colors space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    <Palette className="w-3 h-3 transition-colors" style={{ color: theme.secondaryHex }} />
                    <span>Artist</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-200 truncate" title={artistName}>
                    {artistName}
                  </p>
                </div>
              </div>

              {/* Metadata rows */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-zinc-500 font-medium">Format</span>
                  <span className={`font-bold uppercase tracking-wide text-[11px] ${theme.subtleBg} px-2.5 py-0.5 rounded-md border ${theme.borderAccent} ${theme.accentText}`}>
                    {book.category}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-zinc-500 font-medium">Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Completed
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-zinc-500 font-medium">Release</span>
                  <span className="text-zinc-300 font-semibold text-[11px]">Archive Edition</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-zinc-500 font-medium">Language</span>
                  <span className="text-zinc-300 font-semibold text-[11px]">EN (English)</span>
                </div>
              </div>
            </div>

            {/* Widget 2: GENRES & THEMES */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111422] to-[#0c0d16] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.4)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full transition-colors" style={{ backgroundColor: theme.primaryHex }} />
                  <h3 className="text-xs font-black tracking-wider text-zinc-300 uppercase">
                    Genres & Themes
                  </h3>
                </div>
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
              </div>

              {/* Primary Genres */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  PRIMARY GENRES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentGenres.map((g, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-lg ${theme.subtleBg} ${theme.subtleHoverBg} border ${theme.borderAccent} ${theme.borderHoverAccent} text-xs font-semibold ${theme.accentText} transition-all cursor-default`}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags / Themes */}
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  FORMAT & THEME TAGS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(book.category === 'manhwa'
                    ? ['Full Color', 'Webtoon', 'Long Strip', 'Digital Edition']
                    : book.category === 'manga'
                    ? ['Right-to-Left', 'Manga', 'Serialized', 'B&W Art']
                    : book.category === 'lightnovel'
                    ? ['Light Novel', 'Japanese Fiction', 'Illustrated', 'Volume Archive']
                    : book.category === 'webnovel'
                    ? ['Ongoing Serial', 'Progression', 'Web Fiction', 'Chapter Release']
                    : ['Classic Literature', 'Unabridged', 'Public Domain', 'Original Text']
                  ).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Jump to Recommendations */}
              <div className="pt-2 border-t border-white/[0.04]">
                <a
                  href="#category-recommendations"
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all group cursor-pointer ${theme.subtleBg} ${theme.borderAccent} ${theme.borderHoverAccent} ${theme.accentText}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300 ${theme.accentText}`} />
                    <span>More Recommendations</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform ${theme.accentText}`} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM SECTION: RECOMMENDATIONS ================= */}
        <section id="category-recommendations" className="pt-10 pb-16 border-t border-white/[0.08] space-y-8 scroll-mt-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                More Recommendations
              </h2>
              {isAiLoading && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 text-[11px] font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: theme.primaryHex }} />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isAiLoading}
              onClick={handleRefreshRecommendations}
              title="Refresh Recommendations"
              aria-label="Refresh Recommendations"
              className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                isAiLoading
                  ? 'bg-white/[0.08] border border-white/20 cursor-wait'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white cursor-pointer group hover:scale-105 active:scale-95 self-start sm:self-auto'
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 transition-transform duration-500 ${
                  isAiLoading ? 'animate-spin' : 'group-hover:rotate-180'
                }`}
                style={{ color: theme.primaryHex }}
              />
            </button>
          </div>

          {/* 2-Column Catalog Layout: Left Side Category Rail + Right Side Cards (Exact Main Page Layout) */}
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start pt-2">
            {/* Left Side Vertical Icon Rail (Circular Icon Column from Main Page - Pinned & Scroll-synced) */}
            <aside className="w-full lg:w-auto shrink-0 sticky top-4 sm:top-6 lg:top-24 z-30">
              <div className="flex flex-row lg:flex-col items-center justify-start sm:justify-center gap-2.5 p-2 sm:p-2.5 rounded-full bg-[#0c0e1c]/95 border border-white/[0.12] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.05] overflow-x-auto lg:overflow-visible no-scrollbar">
                {[
                  {
                    id: 'all',
                    label: 'All Categories',
                    icon: Flame,
                    iconColor: 'text-orange-400 group-hover:text-orange-300',
                    activeClass: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 text-white shadow-[0_0_22px_rgba(244,63,94,0.45)] ring-2 ring-white/70 ring-offset-2 ring-offset-[#0c0e1c]',
                    pingColor: 'bg-orange-400',
                    count: totalMatchingRecs
                  },
                  {
                    id: 'manhwa',
                    label: 'Webtoons',
                    icon: Smartphone,
                    iconColor: 'text-cyan-400 group-hover:text-cyan-300',
                    activeClass: 'bg-cyan-500/20 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                    pingColor: 'bg-cyan-400',
                    count: (recommendationsByCategory.manhwa?.length || 0) + (additionalRecs.manhwa?.length || 0)
                  },
                  {
                    id: 'manga',
                    label: 'Manga',
                    icon: BookOpen,
                    iconColor: 'text-purple-400 group-hover:text-purple-300',
                    activeClass: 'bg-purple-500/20 text-purple-200 border-2 border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                    pingColor: 'bg-purple-400',
                    count: (recommendationsByCategory.manga?.length || 0) + (additionalRecs.manga?.length || 0)
                  },
                  {
                    id: 'lightnovel',
                    label: 'Light Novels',
                    icon: BookMarked,
                    iconColor: 'text-blue-400 group-hover:text-blue-300',
                    activeClass: 'bg-blue-500/20 text-blue-200 border-2 border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.4)] ring-2 ring-blue-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                    pingColor: 'bg-blue-400',
                    count: (recommendationsByCategory.lightnovel?.length || 0) + (additionalRecs.lightnovel?.length || 0)
                  },
                  {
                    id: 'webnovel',
                    label: 'Webnovels',
                    icon: Feather,
                    iconColor: 'text-[#DA6569] group-hover:text-[#DA6569]',
                    activeClass: 'bg-[#DA6569]/20 text-[#DA6569] border-2 border-[#DA6569] shadow-[0_0_18px_rgba(218,101,105,0.4)] ring-2 ring-[#DA6569]/40 ring-offset-2 ring-offset-[#0c0e1c]',
                    pingColor: 'bg-[#DA6569]',
                    count: (recommendationsByCategory.webnovel?.length || 0) + (additionalRecs.webnovel?.length || 0)
                  },
                  {
                    id: 'book',
                    label: 'Classic Literature',
                    icon: Library,
                    iconColor: 'text-rose-400 group-hover:text-rose-300',
                    activeClass: 'bg-rose-500/20 text-rose-200 border-2 border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.4)] ring-2 ring-rose-400/40 ring-offset-2 ring-offset-[#0c0e1c]',
                    pingColor: 'bg-rose-400',
                    count: (recommendationsByCategory.book?.length || 0) + (additionalRecs.book?.length || 0)
                  }
                ].map(item => {
                  const ItemIcon = item.icon;
                  const isActive = activeRecCategory === item.id;

                  return (
                    <button
                      key={item.id}
                      ref={el => {
                        recPillRefs.current[item.id] = el;
                      }}
                      type="button"
                      title={`${item.label} (${item.count})`}
                      onClick={() => scrollToRecCategorySection(item.id)}
                      className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? `${item.activeClass} scale-105`
                          : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.09] hover:border-white/20 hover:scale-105 active:scale-95 shadow-sm'
                      }`}
                    >
                      <ItemIcon
                        className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-white' : item.iconColor
                        }`}
                      />

                      {/* Active Indicator Pulse Ring */}
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-[#0c0e1c] shadow-sm flex items-center justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.pingColor} animate-ping opacity-75`} />
                        </span>
                      )}

                      {/* Floating Tooltip (matching home page) */}
                      <div className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-zinc-950/95 border border-white/15 text-white text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 hidden lg:flex items-center gap-1.5">
                        <span>{item.label}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-300">
                          {item.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Side Cards Area (Same Home Page Cards, Animations, Dimensions & Description Pop Card) */}
            <div className="flex-1 min-w-0 w-full space-y-8">
              {!puterRecs ? (
                /* Loading State: Replaces Step 6.1 instant local baseline with animated discovery skeletons */
                <div className="space-y-10 py-2">
                  {[
                    { label: 'Webtoons & Manhwa', count: 5 },
                    { label: 'Japanese Manga', count: 5 },
                    { label: 'Light Novels', count: 5 }
                  ].map((shelf, shelfIdx) => (
                    <div key={shelfIdx} className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-white/50 tracking-tight flex items-center gap-2">
                            <span>{shelf.label}</span>
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-zinc-500 flex items-center gap-1.5 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-orange-400" />
                            <span>Discovering...</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 sm:gap-5 overflow-hidden pb-4">
                        {Array.from({ length: shelf.count }).map((_, cardIdx) => (
                          <div
                            key={cardIdx}
                            className="w-[220px] sm:w-[250px] shrink-0 h-[340px] rounded-2xl border-2 border-white/[0.06] bg-[#0e101c]/80 flex flex-col justify-between p-3.5 shadow-md"
                          >
                            <div className="aspect-[3/4] w-full rounded-xl bg-gradient-to-br from-[#121526]/80 via-[#0b0d17] to-[#161a2e]/80 flex flex-col items-center justify-center gap-2 border border-white/5">
                              <Loader2 className="w-7 h-7 text-zinc-600 animate-spin" />
                              <span className="text-[11px] text-zinc-500 font-medium tracking-wide">Matching Trope...</span>
                            </div>
                            <div className="space-y-2 pt-3">
                              <div className="h-3 w-1/3 bg-white/[0.06] rounded animate-pulse" />
                              <div className="h-4 w-4/5 bg-white/[0.08] rounded animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-10 transition-opacity duration-300 opacity-100">
              {selectedRecCategory === 'all' ? (
                /* All categories grouped in horizontal scroll rows */
                (['manhwa', 'manga', 'lightnovel', 'webnovel', 'book'] as ContentCategory[]).map(catKey => {
                  const recList = getCategoryList(catKey);
                  if (recList.length === 0 && !recLoadingCategory[catKey]) return null;
                  const meta = CATEGORY_RECOMMENDATION_META[catKey];

                  return (
                    <div key={catKey} id={`rec-category-${catKey}`} className="space-y-4 scroll-mt-24 sm:scroll-mt-28">
                      {/* Category Row Header with Title and Left/Right Scroll Chevrons */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{meta.label}</h3>
                        </div>

                        {/* Left and Right Scroll Chevron Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => scrollRecRow(catKey, 'left')}
                            aria-label={`Scroll ${meta.label} left`}
                            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollRecRow(catKey, 'right')}
                            aria-label={`Scroll ${meta.label} right`}
                            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Horizontal Scroll Row with Dynamic On-Scroll Discovery */}
                      <div
                        ref={el => {
                          recRowRefs.current[catKey] = el;
                        }}
                        onScroll={e => handleRecRowScroll(catKey, e.currentTarget)}
                        style={{ marginTop: '-24px', paddingTop: '24px', overflowY: 'hidden' }}
                        className="flex gap-4 sm:gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar snap-x snap-mandatory pb-4 px-1 relative z-10"
                      >
                        {recList.map(({ book: itemBook }) => (
                          <div
                            key={itemBook.id}
                            className="w-[195px] sm:w-[220px] shrink-0 snap-start pointer-events-auto"
                          >
                            <BookCard
                              book={itemBook}
                              theme={getCategoryTheme(itemBook.category)}
                              pointsAwarded={itemBook.pointsPerChapter || 1.5}
                              isOpeningThis={openingBookId === itemBook.id}
                              onOpenBook={handleOpenRecommendedBook}
                              className="w-full"
                              titleHoverClass={theme.accentHoverText}
                            />
                          </div>
                        ))}

                        {/* Dynamic Skeletons while fetching more similar books on scroll */}
                        {recLoadingCategory[catKey] && (
                          <>
                            {[0, 1, 2].map(idx => (
                              <div
                                key={`rec-shelf-skeleton-${catKey}-${idx}`}
                                className="w-[195px] sm:w-[220px] shrink-0 pointer-events-auto flex flex-col snap-start"
                              >
                                <div className="w-full flex-1 rounded-2xl border-2 border-white/[0.08] bg-[#0e101c] shadow-lg overflow-hidden flex flex-col justify-between animate-pulse">
                                  <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-white/[0.08] flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />
                                    <div className="flex flex-col items-center gap-2 p-3 text-center z-10">
                                      <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-md">
                                        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                                      </div>
                                      <span className="text-[11px] font-bold tracking-tight text-zinc-200">
                                        {idx === 0 ? 'Finding more titles...' : 'Loading cover...'}
                                      </span>
                                      <span className="text-[9.5px] text-zinc-400 font-medium">
                                        Loading 2s...
                                      </span>
                                    </div>
                                    <div className="absolute top-2.5 left-2.5 h-4 w-14 rounded-full bg-white/10 border border-white/5" />
                                  </div>
                                  <div className="p-3.5 space-y-2.5 bg-[#0d0f18]/90 border-t border-white/[0.05]">
                                    <div className="h-4 w-4/5 rounded-md bg-white/10" />
                                    <div className="flex items-center justify-between pt-1">
                                      <div className="h-3 w-16 rounded bg-white/[0.06]" />
                                      <div className="h-3.5 w-10 rounded-full bg-amber-400/20" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Single Category Focused View in horizontal scroll */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{CATEGORY_RECOMMENDATION_META[selectedRecCategory].label} Recommendations</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRecCategory('all')}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 transition-colors flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to All Categories</span>
                      </button>

                      {/* Left and Right Scroll Chevron Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => scrollRecRow(selectedRecCategory, 'left')}
                          aria-label={`Scroll ${CATEGORY_RECOMMENDATION_META[selectedRecCategory].label} left`}
                          className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollRecRow(selectedRecCategory, 'right')}
                          aria-label={`Scroll ${CATEGORY_RECOMMENDATION_META[selectedRecCategory].label} right`}
                          className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scroll Row for Focused Category */}
                  {getCategoryList(selectedRecCategory).length === 0 && !recLoadingCategory[selectedRecCategory] ? (
                    <div className="py-12 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
                      <p className="text-sm font-semibold text-zinc-300">
                        No titles available in this category.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedRecCategory('all')}
                        className={`px-4 py-2 rounded-xl ${theme.subtleBg} ${theme.subtleHoverBg} ${theme.accentText} border ${theme.borderAccent} text-xs font-bold transition-all`}
                      >
                        View All Categories
                      </button>
                    </div>
                  ) : (
                    <div
                      ref={el => {
                        recRowRefs.current[selectedRecCategory] = el;
                      }}
                      onScroll={e => handleRecRowScroll(selectedRecCategory, e.currentTarget)}
                      style={{ marginTop: '-24px', paddingTop: '24px', overflowY: 'hidden' }}
                      className="flex gap-4 sm:gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar snap-x snap-mandatory pb-4 px-1 relative z-10"
                    >
                      {getCategoryList(selectedRecCategory).map(({ book: itemBook }) => (
                        <div
                          key={itemBook.id}
                          className="w-[195px] sm:w-[220px] shrink-0 snap-start pointer-events-auto"
                        >
                          <BookCard
                            book={itemBook}
                            theme={getCategoryTheme(itemBook.category)}
                            pointsAwarded={itemBook.pointsPerChapter || 1.5}
                            isOpeningThis={openingBookId === itemBook.id}
                            onOpenBook={handleOpenRecommendedBook}
                            className="w-full"
                            titleHoverClass={theme.accentHoverText}
                          />
                        </div>
                      ))}

                      {/* Dynamic Skeletons while fetching more similar books on scroll */}
                      {recLoadingCategory[selectedRecCategory] && (
                        <>
                          {[0, 1, 2].map(idx => (
                            <div
                              key={`single-rec-shelf-skeleton-${selectedRecCategory}-${idx}`}
                              className="w-[195px] sm:w-[220px] shrink-0 pointer-events-auto flex flex-col snap-start"
                            >
                              <div className="w-full flex-1 rounded-2xl border-2 border-white/[0.08] bg-[#0e101c] shadow-lg overflow-hidden flex flex-col justify-between animate-pulse">
                                <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-white/[0.08] flex items-center justify-center overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />
                                  <div className="flex flex-col items-center gap-2 p-3 text-center z-10">
                                    <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-md">
                                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                                    </div>
                                    <span className="text-[11px] font-bold tracking-tight text-zinc-200">
                                      {idx === 0 ? 'Finding more titles...' : 'Loading cover...'}
                                    </span>
                                    <span className="text-[9.5px] text-zinc-400 font-medium">
                                      Loading 2s...
                                    </span>
                                  </div>
                                  <div className="absolute top-2.5 left-2.5 h-4 w-14 rounded-full bg-white/10 border border-white/5" />
                                </div>
                                <div className="p-3.5 space-y-2.5 bg-[#0d0f18]/90 border-t border-white/[0.05]">
                                  <div className="h-4 w-4/5 rounded-md bg-white/10" />
                                  <div className="flex items-center justify-between pt-1">
                                    <div className="h-3 w-16 rounded bg-white/[0.06]" />
                                    <div className="h-3.5 w-10 rounded-full bg-amber-400/20" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Source Version Picker Modal */}
      <SourcePickerModal
        isOpen={isSourcePickerOpen}
        onClose={() => setIsSourcePickerOpen(false)}
        book={book}
        currentSourceId={connectedSource}
        currentSourceName={connectedSourceName}
        onSelectCandidate={handleSelectCandidateVersion}
      />
    </div>
  );
};
