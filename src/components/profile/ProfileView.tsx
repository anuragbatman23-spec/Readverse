'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { ALL_FAMOUS_BOOKS } from '../../data/famousCatalog';
import { Book, UserStats } from '../../types';
import { resolveCoverUrl } from '../../utils/imageOptimizer';
import { parseEpubFile } from '../../utils/epubParser';
import { evaluateAllBadges, BadgeItem } from '../../data/badgeDefinitions';
import {
  Flame,
  Award,
  BookOpen,
  Share2,
  Clock,
  Compass,
  CheckCircle2,
  Infinity as InfinityIcon,
  Star,
  Users,
  ChevronRight,
  ChevronLeft,
  Plus,
  Sparkles,
  Zap,
  Lock,
  BookmarkCheck,
  Bookmark,
  Camera,
  Upload,
  RefreshCw,
  Search,
  Check,
  X,
  FolderUp,
  FileText,
  Play,
  Loader2,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import presetAvatars from '../../data/presetAvatars.json';

interface CommunityUserItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bannerImage?: string;
  badgeProgress?: any;
  unlockedBadges?: string[];
  title?: string;
  points?: number;
  totalChaptersRead?: number;
  totalWordsRead?: number;
  readingMinutes?: number;
  currentStreakDays?: number;
  followingCount: number;
  followersCount: number;
  isOnline: boolean;
  isFollowed?: boolean;
}

interface RecentlyReadDisplayItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  rating: number;
  chapterIndex?: number;
  lastReadAt?: string;
}

interface WantToReadItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  rating?: number;
}

const SPEEDOMETER_THEMES = [
  {
    gradientId: 'speedo-cyan',
    startColor: '#00f2fe',
    endColor: '#4facfe',
    accentText: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    cardBorder: 'hover:border-cyan-500/40',
    needleColor: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    bgGradient: 'from-cyan-500/10 via-transparent to-transparent'
  },
  {
    gradientId: 'speedo-fuchsia',
    startColor: '#f355da',
    endColor: '#7928ca',
    accentText: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
    cardBorder: 'hover:border-fuchsia-500/40',
    needleColor: '#e879f9',
    glow: 'rgba(232, 121, 249, 0.4)',
    bgGradient: 'from-fuchsia-500/10 via-transparent to-transparent'
  },
  {
    gradientId: 'speedo-orange',
    startColor: '#ff8a00',
    endColor: '#e52e71',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    cardBorder: 'hover:border-amber-500/40',
    needleColor: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.4)',
    bgGradient: 'from-amber-500/10 via-transparent to-transparent'
  },
  {
    gradientId: 'speedo-emerald',
    startColor: '#10b981',
    endColor: '#06b6d4',
    accentText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    cardBorder: 'hover:border-emerald-500/40',
    needleColor: '#34d399',
    glow: 'rgba(52, 211, 153, 0.4)',
    bgGradient: 'from-emerald-500/10 via-transparent to-transparent'
  }
];

const CoverSpeedometer = React.memo<{
  percentage: number;
  theme: typeof SPEEDOMETER_THEMES[0];
  coverImage: string;
  title: string;
  category: string;
}>(({ percentage, theme, coverImage, title, category }) => {
  const clampPct = Math.min(100, Math.max(0, percentage));
  // 260 degree arc
  // Radius r = 78, center cx = 100, cy = 94
  // Sweep from 140 deg clockwise to 40 deg
  // Arc length = 2 * Math.PI * 78 * (260 / 360) ≈ 353.95
  const arcLength = 353.95;
  const strokeOffset = arcLength * (1 - clampPct / 100);

  return (
    <div className="relative w-full aspect-square max-w-[220px] sm:max-w-[240px] md:max-w-[260px] mx-auto flex items-center justify-center">
      {/* SVG Speedometer Gauge Ring */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <defs>
          <linearGradient id={theme.gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.startColor} />
            <stop offset="100%" stopColor={theme.endColor} />
          </linearGradient>
          <filter id={`glow-${theme.gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.glow} />
          </filter>
        </defs>

        {/* Speedometer Background Track */}
        <path
          d="M 40.25 145.14 A 78 78 0 1 1 159.75 145.14"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Dash ticks along the rim */}
        <path
          d="M 40.25 145.14 A 78 78 0 1 1 159.75 145.14"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />

        {/* Speedometer Active Colorful Progress Arc */}
        {clampPct > 0 && (
          <path
            d="M 40.25 145.14 A 78 78 0 1 1 159.75 145.14"
            fill="none"
            stroke={`url(#${theme.gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            filter={`url(#glow-${theme.gradientId})`}
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>

      {/* Book Cover in the Middle of the Speedometer (Enlarged, No Hover Effect) */}
      <div className="relative z-10 w-[94px] h-[136px] sm:w-[102px] sm:h-[148px] rounded-xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 flex items-center justify-center">
        <img
          src={resolveCoverUrl(coverImage, title, category)}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('fallback=cover')) {
              target.src = `/api/manga/image-proxy?url=${encodeURIComponent(coverImage)}&title=${encodeURIComponent(title)}&fallback=cover`;
            }
          }}
        />
      </div>

      {/* Percentage Badge Centered at the Bottom Opening of the Speedometer */}
      <div className="absolute bottom-1 z-20">
        <span className={`px-3 py-0.5 rounded-full text-xs sm:text-[13px] font-mono font-black border backdrop-blur-md shadow-lg ${theme.badgeBg}`}>
          {clampPct}%
        </span>
      </div>
    </div>
  );
});
CoverSpeedometer.displayName = 'CoverSpeedometer';

export const ProfileView: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams?.get('user') || null;
  const { stats, books, activeBook, setActiveBook } = useApp();

  // 0.5-second initial loading state for all data coming from users.json
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);

  useEffect(() => {
    setIsUserDataLoading(true);
    const timer = setTimeout(() => {
      setIsUserDataLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [targetUserParam]);

  // Active subtab: 'overview' | 'library'
  const [activeTab, setActiveTab] = useState<'overview' | 'library'>('overview');
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<string>('all');
  const [inspectingBadge, setInspectingBadge] = useState<any | null>(null);
  const badgeScrollRef = useRef<HTMLDivElement>(null);

  // Real community data fetched from live endpoints
  const [communityUsers, setCommunityUsers] = useState<CommunityUserItem[]>([]);
  const [myBadgeProgress, setMyBadgeProgress] = useState<any>(null);

  const targetUser = useMemo(() => {
    if (!targetUserParam) return null;
    const q = targetUserParam.toLowerCase().trim();
    return communityUsers.find(
      u => u.email?.toLowerCase() === q || u.name.toLowerCase() === q || u.id.toLowerCase() === q || u.email?.split('@')[0].toLowerCase() === q
    ) || null;
  }, [targetUserParam, communityUsers]);

  // Resolve whether current viewer owns this profile or is viewing another reader's profile
  const isOwner = useMemo(() => {
    if (!targetUserParam) return true;
    if (!session?.user?.email) return false;
    const target = targetUserParam.toLowerCase().trim();
    const myEmail = (session.user.email || '').toLowerCase().trim();
    const myName = (session.user.name || '').toLowerCase().trim();
    return target === myEmail || target === myName || (Boolean(targetUser?.email) && targetUser!.email.toLowerCase() === myEmail);
  }, [targetUserParam, session?.user?.email, session?.user?.name, targetUser?.email]);

  const currentUserData = useMemo(() => {
    const email = session?.user?.email;
    if (!email) return null;
    return communityUsers.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
  }, [communityUsers, session?.user?.email]);

  const currentProfileEmail = useMemo(() => {
    if (targetUserParam) {
      if (targetUser?.email) return targetUser.email.toLowerCase();
      return targetUserParam.toLowerCase();
    }
    return (session?.user?.email || 'reader@readverse.io').toLowerCase();
  }, [targetUserParam, targetUser, session?.user?.email]);

  // Stats for another user's profile
  const [otherUserStats, setOtherUserStats] = useState<UserStats>({
    points: 0,
    totalChaptersRead: 0,
    totalWordsRead: 0,
    readingMinutes: 0,
    boostExpiresAt: null,
    currentStreakDays: 1,
  });

  useEffect(() => {
    if (!isOwner && targetUser) {
      setOtherUserStats(prev => ({
        ...prev,
        points: typeof targetUser.points === 'number' ? targetUser.points : prev.points,
        totalChaptersRead: typeof targetUser.totalChaptersRead === 'number' ? targetUser.totalChaptersRead : prev.totalChaptersRead,
        totalWordsRead: typeof targetUser.totalWordsRead === 'number' ? targetUser.totalWordsRead : prev.totalWordsRead,
        readingMinutes: typeof targetUser.readingMinutes === 'number' ? targetUser.readingMinutes : prev.readingMinutes,
        currentStreakDays: typeof targetUser.currentStreakDays === 'number' ? targetUser.currentStreakDays : prev.currentStreakDays,
      }));
    }
  }, [isOwner, targetUser]);

  const displayedStats = useMemo(() => {
    if (isOwner) return stats;
    return otherUserStats;
  }, [isOwner, stats, otherUserStats]);

  // Library & Shelves state
  const [selectedShelf, setSelectedShelf] = useState<'epubs' | 'want-to-read' | 'completed' | 'all'>('epubs');
  const [shelfSearchQuery, setShelfSearchQuery] = useState('');
  const [uploadedEpubs, setUploadedEpubs] = useState<Book[]>([]);
  const [isLoadingEpubs, setIsLoadingEpubs] = useState(false);
  const [isUploadingEpub, setIsUploadingEpub] = useState(false);
  const [isDraggingEpub, setIsDraggingEpub] = useState(false);
  const [epubNotice, setEpubNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const epubFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to normalize book titles for strict deduplication
  const normalizeBookTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // Fetch uploaded EPUB books from server and localStorage
  const loadLocalEpubs = useCallback(async () => {
    setIsLoadingEpubs(true);
    try {
      const userParam = currentProfileEmail ? `?user=${encodeURIComponent(currentProfileEmail)}` : '';
      const res = await fetch(`/api/books/local${userParam}`);
      const data = await res.json();
      const serverBooks: Book[] = data.books || [];

      // Filter for EPUBs / local books
      const epubs = serverBooks.filter(
        b => b.id.startsWith('local-file-') || b.id.includes('.epub') || b.genre?.includes('Custom Book') || b.genre?.includes('Local Server') || b.category === 'book'
      );

      const seenTitles = new Set<string>();
      const seenIds = new Set<string>();
      const dedupedBooks: Book[] = [];

      // 1. Prioritize canonical server books
      for (const book of epubs) {
        const normTitle = normalizeBookTitle(book.title);
        if (!seenIds.has(book.id) && !seenTitles.has(normTitle)) {
          seenIds.add(book.id);
          seenTitles.add(normTitle);
          dedupedBooks.push(book);
        }
      }

      // 2. Scan localStorage for any client-side cached EPUBs and clean up duplicates (owner only)
      if (isOwner && typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('readverse_book_')) {
            try {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.id?.startsWith('local-') || parsed.id?.includes('.epub') || parsed.genre?.includes('Custom Book'))) {
                  const normTitle = normalizeBookTitle(parsed.title || '');
                  if (seenTitles.has(normTitle)) {
                    // Stale or duplicate copy, mark for cleanup if it uses old local-epub- timestamp ID
                    if (key.startsWith('readverse_book_local-epub-')) {
                      keysToRemove.push(key);
                    }
                  } else if (!seenIds.has(parsed.id)) {
                    seenIds.add(parsed.id);
                    seenTitles.add(normTitle);
                    dedupedBooks.push(parsed);
                  }
                }
              }
            } catch {}
          }
        }
        keysToRemove.forEach(k => {
          try { localStorage.removeItem(k); } catch {}
        });
      }

      setUploadedEpubs(dedupedBooks);
    } catch (err) {
      console.warn('Could not load local epubs:', err);
    } finally {
      setIsLoadingEpubs(false);
    }
  }, [currentProfileEmail, isOwner]);

  useEffect(() => {
    loadLocalEpubs();
  }, [loadLocalEpubs]);

  const handleEpubFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setEpubNotice({ type: 'error', message: 'Please select a valid .epub book file.' });
      return;
    }

    setIsUploadingEpub(true);
    setEpubNotice(null);

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const canonicalId = `local-file-${encodeURIComponent(safeFilename)}`;

    try {
      // Client-side parse for instant reader readiness
      const parsedBook = await parseEpubFile(file);
      parsedBook.id = canonicalId;

      const normTitle = normalizeBookTitle(parsedBook.title);

      // Clean up any stale duplicate keys in localStorage
      if (typeof window !== 'undefined') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('readverse_book_local-epub-') || key.startsWith('readverse_book_'))) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              if (normalizeBookTitle(item.title || '') === normTitle && key !== `readverse_book_${canonicalId}`) {
                localStorage.removeItem(key);
              }
            } catch {}
          }
        }
        try {
          localStorage.setItem(`readverse_book_${canonicalId}`, JSON.stringify(parsedBook));
        } catch {}
      }

      // Upload to server disk with user scoping
      const formData = new FormData();
      formData.append('file', file);
      if (session?.user?.email) {
        formData.append('userEmail', session.user.email);
      }

      const res = await fetch('/api/books/local', {
        method: 'POST',
        body: formData
      });

      let finalBook = parsedBook;
      if (res.ok) {
        const data = await res.json();
        if (data.book) {
          finalBook = { ...data.book, id: canonicalId };
        }
      }

      // Add to state with strict deduplication (remove any matching ID or matching normalized title)
      setUploadedEpubs(prev => {
        const filtered = prev.filter(
          b => b.id !== canonicalId && normalizeBookTitle(b.title) !== normTitle
        );
        return [finalBook, ...filtered];
      });

      setEpubNotice({
        type: 'success',
        message: `"${finalBook.title}" uploaded and added to your personal library!`
      });
    } catch (err) {
      console.error('Failed to parse EPUB:', err);
      setEpubNotice({
        type: 'error',
        message: 'Unable to parse this EPUB. Ensure the file is not DRM-protected.'
      });
    } finally {
      setIsUploadingEpub(false);
    }
  };

  const [savedShelfBookIds, setSavedShelfBookIds] = useState<Set<string>>(() => new Set());

  const handleOpenEpub = (book: Book) => {
    if (setActiveBook) {
      setActiveBook(book, 0);
    }
    router.push(`/read/${encodeURIComponent(book.id)}?chapter=0`);
  };

  const handleSaveToMyShelf = (book: Book, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const wantItem = {
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown',
        category: book.category || 'book',
        coverImage: book.coverImage || '',
        rating: book.rating || 5.0
      };

      // 1. Update localStorage aggregate list
      const aggRaw = localStorage.getItem('readverse_want_to_read');
      const aggList = aggRaw ? JSON.parse(aggRaw) : [];
      if (!aggList.some((b: any) => (b.bookId || b.id) === book.id)) {
        aggList.push({ bookId: book.id, ...wantItem });
        localStorage.setItem('readverse_want_to_read', JSON.stringify(aggList));
      }

      // 2. Set per-book key
      localStorage.setItem(`readverse_readlist_${book.id}`, 'true');
      localStorage.setItem(`readverse_readlist_data_${book.id}`, JSON.stringify(wantItem));

      // 3. If logged in, sync to backend readlist
      if (session?.user?.email) {
        fetch('/api/user/readlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: session.user.email,
            item: wantItem
          })
        }).catch(() => {});
      }

      setSavedShelfBookIds(prev => new Set(prev).add(book.id));
      window.dispatchEvent(new Event('readverse_readlist_updated'));
      setEpubNotice({
        type: 'success',
        message: `Saved "${book.title}" to your personal Want-to-Read shelf!`
      });
      setTimeout(() => setEpubNotice(null), 4000);
    } catch (err) {
      console.warn('Failed saving book to shelf:', err);
    }
  };

  const filteredEpubs = useMemo(() => {
    if (!shelfSearchQuery.trim()) return uploadedEpubs;
    const q = shelfSearchQuery.toLowerCase().trim();
    return uploadedEpubs.filter(
      b => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)
    );
  }, [uploadedEpubs, shelfSearchQuery]);

  const scrollBadges = (direction: 'left' | 'right') => {
    if (badgeScrollRef.current) {
      const scrollAmount = direction === 'left' ? -460 : 460;
      badgeScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Custom banner image state
  const [bannerUrl, setBannerUrl] = useState<string>('/spotlight-backdrop.png');
  const [isBannerUploading, setIsBannerUploading] = useState<boolean>(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Custom profile avatar state & picker
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState<boolean>(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarScrollRef = useRef<HTMLDivElement>(null);

  const scrollAvatars = (direction: 'left' | 'right') => {
    if (avatarScrollRef.current) {
      const scrollAmount = direction === 'left' ? -620 : 620;
      avatarScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Recently Read horizontal scroll
  const recentReadScrollRef = useRef<HTMLDivElement>(null);
  const scrollRecentRead = (direction: 'left' | 'right') => {
    if (recentReadScrollRef.current) {
      const scrollAmount = direction === 'left' ? -520 : 520;
      recentReadScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Real community data fetched from live endpoints
  const [userReadlistIds, setUserReadlistIds] = useState<string[]>([]);
  const [userCompletedIds, setUserCompletedIds] = useState<string[]>([]);
  const [syncedRecentlyRead, setSyncedRecentlyRead] = useState<RecentlyReadDisplayItem[]>([]);
  const [syncedReadlist, setSyncedReadlist] = useState<WantToReadItem[]>([]);
  const [localReadlist, setLocalReadlist] = useState<WantToReadItem[]>([]);

  // Load custom banner wallpaper from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBanner() {
      const email = currentProfileEmail;
      if (!email) return;
      try {
        const res = await fetch(`/api/user/banner?user=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.bannerUrl) {
            setBannerUrl(data.bannerUrl);
          } else if (isMounted && !isOwner) {
            setBannerUrl('/spotlight-backdrop.png');
          }
        }
      } catch (e) {
        console.warn('Failed loading custom banner from server:', e);
      }
    }
    loadBanner();
    return () => {
      isMounted = false;
    };
  }, [currentProfileEmail, isOwner]);

  // Load custom profile avatar from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadAvatar() {
      const email = currentProfileEmail;
      if (!email) return;
      try {
        const res = await fetch(`/api/user/avatar?user=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.avatarUrl) {
              setCustomAvatar(data.avatarUrl);
              if (isOwner) {
                try {
                  localStorage.setItem(`readverse_custom_avatar_${email}`, data.avatarUrl);
                  localStorage.setItem('readverse_custom_avatar', data.avatarUrl);
                  window.dispatchEvent(new Event('readverse_avatar_updated'));
                } catch {}
              }
            } else if (!isOwner) {
              setCustomAvatar(null);
            }
          }
        }
      } catch (e) {
        console.warn('Failed loading custom avatar from server:', e);
      }
    }
    loadAvatar();
    return () => {
      isMounted = false;
    };
  }, [currentProfileEmail, isOwner]);

  const handleSelectAvatar = async (url: string) => {
    try {
      setIsAvatarUploading(true);
      const email = session?.user?.email;
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url, userEmail: email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCustomAvatar(url);
        try {
          if (email) {
            localStorage.setItem(`readverse_custom_avatar_${email}`, url);
          }
          localStorage.setItem('readverse_custom_avatar', url);
          window.dispatchEvent(new Event('readverse_avatar_updated'));
        } catch {}
      } else {
        alert(data.error || 'Failed to select avatar.');
      }
    } catch (e) {
      console.warn('Error selecting avatar:', e);
    } finally {
      setIsAvatarUploading(false);
      setIsAvatarPickerOpen(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please choose an image smaller than 10MB.');
      return;
    }

    try {
      setIsAvatarUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (session?.user?.email) {
        formData.append('userEmail', session.user.email);
      }

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.avatarUrl) {
        setCustomAvatar(data.avatarUrl);
        try {
          if (session?.user?.email) {
            localStorage.setItem(`readverse_custom_avatar_${session.user.email}`, data.avatarUrl);
          }
          localStorage.setItem('readverse_custom_avatar', data.avatarUrl);
          window.dispatchEvent(new Event('readverse_avatar_updated'));
        } catch {}
        setIsAvatarPickerOpen(false);
      } else {
        alert(data.error || 'Failed to upload avatar image.');
      }
    } catch (err) {
      console.error('Failed uploading custom avatar:', err);
      alert('An error occurred while uploading avatar.');
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleResetAvatar = async () => {
    try {
      setIsAvatarUploading(true);
      const email = session?.user?.email;
      const url = email ? `/api/user/avatar?user=${encodeURIComponent(email)}` : '/api/user/avatar';
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomAvatar(null);
        try {
          if (email) {
            localStorage.removeItem(`readverse_custom_avatar_${email}`);
          }
          localStorage.removeItem('readverse_custom_avatar');
          window.dispatchEvent(new Event('readverse_avatar_updated'));
        } catch {}
        setIsAvatarPickerOpen(false);
      }
    } catch (err) {
      console.warn('Failed resetting avatar:', err);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // Handle user uploading custom background
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file is too large. Please choose an image smaller than 15MB.');
      return;
    }

    try {
      setIsBannerUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (session?.user?.email) {
        formData.append('userEmail', session.user.email);
      }

      const res = await fetch('/api/user/banner', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.bannerUrl) {
        setBannerUrl(data.bannerUrl);
        // Clean up legacy localStorage blobs to free up browser storage quota
        try {
          if (session?.user?.email) {
            localStorage.removeItem(`readverse_custom_banner_${session.user.email}`);
          }
          localStorage.removeItem('readverse_custom_banner');
        } catch {}
      } else {
        alert(data.error || 'Failed to upload background image.');
      }
    } catch (err) {
      console.error('Failed uploading custom banner:', err);
      alert('An error occurred while uploading background.');
    } finally {
      setIsBannerUploading(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const handleResetBanner = async () => {
    try {
      setIsBannerUploading(true);
      const email = session?.user?.email;
      const url = email ? `/api/user/banner?user=${encodeURIComponent(email)}` : '/api/user/banner';
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerUrl('/spotlight-backdrop.png');
        try {
          if (email) {
            localStorage.removeItem(`readverse_custom_banner_${email}`);
          }
          localStorage.removeItem('readverse_custom_banner');
        } catch {}
      }
    } catch (err) {
      console.warn('Failed removing custom banner:', err);
    } finally {
      setIsBannerUploading(false);
    }
  };

  // Fetch real users and Google-synced recently read books from backend APIs
  useEffect(() => {
    let isMounted = true;

    async function loadCommunityData() {
      try {
        const userParam = session?.user?.email || session?.user?.name || '';
        const targetEmail = currentProfileEmail;

        const fetchPromises: Promise<Response>[] = [
          fetch(`/api/community/users${userParam ? `?user=${encodeURIComponent(userParam)}` : ''}`),
          fetch(`/api/user/recently-read?user=${encodeURIComponent(targetEmail)}`),
          fetch(`/api/user/readlist?user=${encodeURIComponent(targetEmail)}`),
          fetch(`/api/user/badges?user=${encodeURIComponent(targetEmail)}`),
          fetch(`/api/user/stats?user=${encodeURIComponent(targetEmail)}`),
        ];

        const [usersRes, recentlyReadRes, readlistRes, badgesRes, statsRes] = await Promise.all(fetchPromises);

        if (usersRes?.ok) {
          const uData = await usersRes.json();
          if (isMounted && uData.users) {
            setCommunityUsers(uData.users);
          }
        }

        if (statsRes?.ok) {
          const sData = await statsRes.json();
          if (isMounted && sData.stats) {
            setOtherUserStats(sData.stats);
          }
        }

        if (badgesRes?.ok) {
          const bData = await badgesRes.json();
          if (isMounted && bData.badgeProgress) {
            setMyBadgeProgress(bData.badgeProgress);
            if (Array.isArray(bData.badgeProgress.completedSeriesIds)) {
              setUserCompletedIds(bData.badgeProgress.completedSeriesIds);
            }
          }
        }

        if (recentlyReadRes?.ok) {
          const rData = await recentlyReadRes.json();
          if (isMounted && rData.recentlyRead) {
            setSyncedRecentlyRead(
              rData.recentlyRead.map((item: {
                bookId?: string;
                id?: string;
                title: string;
                author: string;
                category?: string;
                coverImage: string;
                rating?: number;
                chapterIndex?: number;
                lastReadAt?: string;
              }) => ({
                id: item.bookId || item.id || '',
                title: item.title,
                author: item.author,
                category: item.category || 'manga',
                coverImage: item.coverImage,
                rating: item.rating || 4.9,
                chapterIndex: item.chapterIndex,
                lastReadAt: item.lastReadAt
              }))
            );
          }
        }

        if (readlistRes?.ok) {
          const rlData = await readlistRes.json();
          if (isMounted && Array.isArray(rlData.readlist)) {
            setSyncedReadlist(
              rlData.readlist.map((item: {
                bookId?: string;
                id?: string;
                title: string;
                author: string;
                category?: string;
                coverImage: string;
                rating?: number;
              }) => ({
                id: item.bookId || item.id || '',
                title: item.title || 'Untitled',
                author: item.author || 'Unknown',
                category: item.category || 'manga',
                coverImage: item.coverImage || '',
                rating: item.rating || 4.5
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error fetching real community data for profile:', err);
      }
    }

    loadCommunityData();
    return () => {
      isMounted = false;
    };
  }, [session, currentProfileEmail]);

  // Scan localStorage for real user shelves, local fallback recently read, and want to read
  useEffect(() => {
    if (!isOwner) {
      setUserReadlistIds([]);
      setLocalReadlist([]);
      return;
    }

    const scanLocalShelves = () => {
      try {
        const readlistIds: string[] = [];
        const completed: string[] = [];
        const wantItems: WantToReadItem[] = [];

        // 1. Read aggregate list
        const aggRaw = localStorage.getItem('readverse_want_to_read');
        if (aggRaw) {
          try {
            const parsed = JSON.parse(aggRaw);
            if (Array.isArray(parsed)) {
              for (const p of parsed) {
                const pId = p.bookId || p.id;
                if (pId && !wantItems.some(i => i.id === pId)) {
                  wantItems.push({
                    id: pId,
                    title: p.title || 'Untitled',
                    author: p.author || 'Unknown',
                    category: p.category || 'manga',
                    coverImage: p.coverImage || '',
                    rating: p.rating || 4.5
                  });
                  readlistIds.push(pId);
                }
              }
            }
          } catch {}
        }

        // 2. Scan per-book keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;

          if (key.startsWith('readverse_readlist_data_')) {
            const bId = key.replace('readverse_readlist_data_', '');
            if (!wantItems.some(it => it.id === bId)) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                wantItems.push({
                  id: data.bookId || bId,
                  title: data.title || 'Untitled',
                  author: data.author || 'Unknown',
                  category: data.category || 'manga',
                  coverImage: data.coverImage || '',
                  rating: data.rating || 4.5
                });
                if (!readlistIds.includes(bId)) readlistIds.push(bId);
              } catch {}
            }
          } else if (key.startsWith('readverse_readlist_')) {
            const val = localStorage.getItem(key);
            if (val === 'true' || val === '1') {
              const bId = key.replace('readverse_readlist_', '');
              if (!readlistIds.includes(bId)) {
                readlistIds.push(bId);
              }
            }
          } else if (key.startsWith('readverse_completed_')) {
            const val = localStorage.getItem(key);
            if (val === 'true' || val === '1') {
              completed.push(key.replace('readverse_completed_', ''));
            }
          }
        }

        setUserReadlistIds(readlistIds);
        setUserCompletedIds(completed);
        setLocalReadlist(wantItems);

        // If not logged in, load recently read from localStorage
        if (!session?.user?.email) {
          const localRecently = localStorage.getItem('readverse_recently_read');
          if (localRecently) {
            try {
              const parsed = JSON.parse(localRecently);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSyncedRecentlyRead(parsed);
              }
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Could not read user bookshelves from localStorage:', e);
      }
    };

    scanLocalShelves();

    window.addEventListener('readverse_readlist_updated', scanLocalShelves);
    window.addEventListener('storage', scanLocalShelves);
    return () => {
      window.removeEventListener('readverse_readlist_updated', scanLocalShelves);
      window.removeEventListener('storage', scanLocalShelves);
    };
  }, [session?.user?.email, isOwner]);

  // 1. Real Recently Read list (Synced to Google account / localStorage)
  const realRecentlyReadBooks: RecentlyReadDisplayItem[] = useMemo(() => {
    if (syncedRecentlyRead.length > 0) {
      return syncedRecentlyRead.slice(0, 8);
    }

    const completed = ALL_FAMOUS_BOOKS.filter(b => userCompletedIds.includes(b.id));
    if (completed.length > 0) {
      return completed.slice(0, 8).map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category,
        coverImage: b.coverImage,
        rating: b.rating
      }));
    }

    return [];
  }, [syncedRecentlyRead, userCompletedIds]);

  // 2. Compute the user's primary/active hero book
  const currentHeroBook: Book = useMemo(() => {
    // If user has recently read books, their most recent book is their active book!
    if (realRecentlyReadBooks.length > 0) {
      const recent = realRecentlyReadBooks[0];
      const match = ALL_FAMOUS_BOOKS.find(b => b.id === recent.id) ||
                    books.find(b => b.id === recent.id);
      if (match) return match;
      return {
        id: recent.id,
        title: recent.title,
        author: recent.author,
        category: recent.category as any,
        coverImage: recent.coverImage,
        rating: recent.rating || 4.9,
        description: 'Currently reading in your active session.',
        genre: [recent.category],
        pointsPerChapter: 2.0,
        chapters: []
      };
    }

    if (isOwner) {
      if (activeBook) return activeBook;
      if (books && books.length > 0) return books[0];
    }
    return ALL_FAMOUS_BOOKS[0];
  }, [realRecentlyReadBooks, activeBook, books, isOwner]);

  // Real user credentials (scoped to profile owner or viewed user)
  const userName = isOwner
    ? (session?.user?.name || communityUsers[0]?.name || 'Master Reader')
    : (targetUser?.name || targetUserParam?.split('@')[0] || 'Reader');

  const userEmail = isOwner
    ? (session?.user?.email || 'reader@readverse.io')
    : (targetUser?.email || targetUserParam || 'reader@readverse.io');

  const userHandle = `@${userEmail.split('@')[0]}`;

  const userAvatar = isOwner
    ? (customAvatar || session?.user?.image || communityUsers[0]?.avatar || '/avatars/av_001.png')
    : (customAvatar || targetUser?.avatar || '/avatars/av_001.png');

  // Dynamic Level Calculation from real stats
  const readerLevel = Math.max(1, Math.floor(displayedStats.points / 250) + 1);

  // Dynamic Level Title
  const getLevelTierTitle = (lvl: number) => {
    if (lvl === 1) return 'Novice Reader';
    if (lvl === 2) return 'Apprentice Scholar';
    if (lvl === 3) return 'Master Reader';
    if (lvl === 4) return 'Grand Scholar';
    return 'Supreme Sage';
  };

  // Real Words & Reading Time Calculations
  const readHours = Math.floor(displayedStats.readingMinutes / 60);
  const readMins = displayedStats.readingMinutes % 60;
  const formattedReadingTime = `${readHours}:${String(readMins).padStart(2, '0')}`;
  
  // Real Speed comparison based on words read vs reading time (average human reading speed: ~200 WPM)
  const userWpm = displayedStats.readingMinutes > 0 ? Math.round(displayedStats.totalWordsRead / displayedStats.readingMinutes) : 230;
  const speedDiffPct = Math.round(((userWpm - 200) / 200) * 100);
  const speedText = speedDiffPct >= 0 ? `${speedDiffPct}% faster` : `${Math.abs(speedDiffPct)}% pace`;

  // Find recent read item for currentHeroBook to get actual chapterIndex
  const currentHeroRecentItem = useMemo(() => {
    return realRecentlyReadBooks.find(b => b.id === currentHeroBook.id);
  }, [realRecentlyReadBooks, currentHeroBook.id]);

  const heroTotalChapters = useMemo(() => {
    if (currentHeroBook.chapters && currentHeroBook.chapters.length > 0) {
      return currentHeroBook.chapters.length;
    }
    const t = currentHeroBook.title.toLowerCase();
    if (t.includes('solo leveling')) return 200;
    if (t.includes('chainsaw')) return 150;
    if (t.includes('berserk')) return 403;
    if (t.includes('one piece')) return 1100;
    return 180;
  }, [currentHeroBook]);

  // Real Per-Book Progress for currentHeroBook (NOT global stats!)
  const heroChaptersRead = useMemo(() => {
    if (isOwner && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`readverse_completed_${currentHeroBook.id}`);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) {
            return list.length;
          }
        }
      } catch {}
    }

    if (currentHeroRecentItem && typeof currentHeroRecentItem.chapterIndex === 'number') {
      return Math.max(0, currentHeroRecentItem.chapterIndex);
    }

    if (userCompletedIds.includes(currentHeroBook.id)) {
      return heroTotalChapters;
    }

    return 0;
  }, [currentHeroBook.id, currentHeroRecentItem, isOwner, userCompletedIds, heroTotalChapters]);

  const heroProgressPct = useMemo(() => {
    if (heroTotalChapters <= 0) return 0;
    return Math.min(100, Math.round((heroChaptersRead / heroTotalChapters) * 100));
  }, [heroChaptersRead, heroTotalChapters]);

  // Real Illustrated Badges calculation from actual user stats (49 reader pin badges)
  const badgesList: BadgeItem[] = useMemo(() => {
    const badgeStats = {
      points: displayedStats.points,
      totalChaptersRead: displayedStats.totalChaptersRead,
      totalWordsRead: displayedStats.totalWordsRead,
      readingMinutes: displayedStats.readingMinutes,
      currentStreakDays: displayedStats.currentStreakDays,
    };

    const targetProgress = isOwner
      ? (myBadgeProgress || currentUserData?.badgeProgress)
      : (myBadgeProgress || targetUser?.badgeProgress);
    return evaluateAllBadges(badgeStats, targetProgress);
  }, [displayedStats, isOwner, myBadgeProgress, currentUserData, targetUser]);

  // Real Books Progress list with per-book chapter completion for the speedometers
  const booksProgressList = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      author: string;
      category: string;
      coverImage: string;
      rating?: number;
      chaptersRead: number;
      totalChapters: number;
      percentage: number;
      nextChapter: number;
    }> = [];

    const seenIds = new Set<string>();

    // 1. Add books from Recently Read (which user actually read / started)
    for (const r of realRecentlyReadBooks) {
      if (r.id && !seenIds.has(r.id)) {
        seenIds.add(r.id);
        const bookObj = ALL_FAMOUS_BOOKS.find(b => b.id === r.id) || books.find(b => b.id === r.id);
        const total = bookObj?.chapters?.length || (
          r.title.toLowerCase().includes('solo leveling') ? 200 :
          r.title.toLowerCase().includes('chainsaw') ? 150 :
          r.title.toLowerCase().includes('berserk') ? 403 : 180
        );

        let completed = 0;
        if (isOwner && typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem(`readverse_completed_${r.id}`);
            if (saved) {
              const arr = JSON.parse(saved);
              if (Array.isArray(arr) && arr.length > 0) completed = arr.length;
            }
          } catch {}
        }
        if (completed === 0 && typeof r.chapterIndex === 'number') {
          completed = r.chapterIndex;
        }
        if (completed === 0 && userCompletedIds.includes(r.id)) {
          completed = total;
        }

        const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
        list.push({
          id: r.id,
          title: r.title,
          author: r.author,
          category: r.category,
          coverImage: r.coverImage,
          rating: r.rating,
          chaptersRead: completed,
          totalChapters: total,
          percentage: pct,
          nextChapter: completed + 1
        });
      }
    }

    // 2. Pad up to 4 books with famous catalog books
    for (const b of ALL_FAMOUS_BOOKS) {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        const total = b.chapters?.length || (
          b.title.toLowerCase().includes('solo leveling') ? 200 :
          b.title.toLowerCase().includes('omniscient') ? 220 :
          b.title.toLowerCase().includes('tower of god') ? 600 :
          b.title.toLowerCase().includes('beginning after') ? 175 : 180
        );

        let completed = 0;
        if (isOwner && typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem(`readverse_completed_${b.id}`);
            if (saved) {
              const arr = JSON.parse(saved);
              if (Array.isArray(arr) && arr.length > 0) completed = arr.length;
            }
          } catch {}
        }
        if (completed === 0 && userCompletedIds.includes(b.id)) {
          completed = total;
        }

        const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
        list.push({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          coverImage: b.coverImage,
          rating: b.rating,
          chaptersRead: completed,
          totalChapters: total,
          percentage: pct,
          nextChapter: completed + 1
        });
      }
      if (list.length >= 4) break;
    }

    return list.slice(0, 4);
  }, [realRecentlyReadBooks, books, isOwner, userCompletedIds]);

  // Real Want-to-Read list (Combines user's queued books + fallbacks)
  const realWantToReadBooks: WantToReadItem[] = useMemo(() => {
    const combined: WantToReadItem[] = [];
    const seen = new Set<string>();

    for (const item of syncedReadlist) {
      if (item.id && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }

    for (const item of localReadlist) {
      if (item.id && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }

    for (const id of userReadlistIds) {
      if (!seen.has(id)) {
        const found = ALL_FAMOUS_BOOKS.find(b => b.id === id);
        if (found) {
          seen.add(id);
          combined.push({
            id: found.id,
            title: found.title,
            author: found.author,
            category: found.category,
            coverImage: found.coverImage,
            rating: found.rating
          });
        }
      }
    }

    // If user has queued books, show them!
    if (combined.length > 0) {
      if (combined.length >= 4) {
        return combined.slice(0, 12);
      }
      // Pad up to 4 with catalog books so layout is balanced
      const fallbacks = ALL_FAMOUS_BOOKS
        .filter(b => !seen.has(b.id))
        .slice(0, 4 - combined.length)
        .map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          coverImage: b.coverImage,
          rating: b.rating
        }));
      return [...combined, ...fallbacks];
    }

    // Default if user has not queued any book yet
    return ALL_FAMOUS_BOOKS.slice(0, 4).map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      coverImage: b.coverImage,
      rating: b.rating
    }));
  }, [syncedReadlist, localReadlist, userReadlistIds]);

  const userQueuedCount = useMemo(() => {
    const ids = new Set<string>();
    syncedReadlist.forEach(i => i.id && ids.add(i.id));
    localReadlist.forEach(i => i.id && ids.add(i.id));
    userReadlistIds.forEach(id => id && ids.add(id));
    return ids.size;
  }, [syncedReadlist, localReadlist, userReadlistIds]);

  const filteredWantToRead = useMemo(() => {
    if (!shelfSearchQuery.trim()) return realWantToReadBooks;
    const q = shelfSearchQuery.toLowerCase().trim();
    return realWantToReadBooks.filter(
      b => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)
    );
  }, [realWantToReadBooks, shelfSearchQuery]);

  const filteredCompleted = useMemo(() => {
    const completedBooks = ALL_FAMOUS_BOOKS.filter(b => userCompletedIds.includes(b.id));
    if (!shelfSearchQuery.trim()) return completedBooks;
    const q = shelfSearchQuery.toLowerCase().trim();
    return completedBooks.filter(
      b => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)
    );
  }, [userCompletedIds, shelfSearchQuery]);

  const activeBannerUrl = bannerUrl && bannerUrl !== '/spotlight-backdrop.png'
    ? bannerUrl
    : (targetUser?.bannerImage || '/spotlight-backdrop.png');
  const hasCustomBanner = Boolean(activeBannerUrl && activeBannerUrl !== '/spotlight-backdrop.png');

  return (
    <div className="w-full min-h-screen text-zinc-100 selection:bg-fuchsia-500 selection:text-white pb-20">
      {/* ------------------------------------------------------------- */}
      {/* TOP PROFILE BANNER & IDENTITY HEADER (Image 1 Style)          */}
      {/* ------------------------------------------------------------- */}
      <section className="relative w-full max-w-[1680px] mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4">
        {/* Hidden file input for uploading custom wallpaper */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />

        {/* Hidden file input for uploading custom profile picture */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />

        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0d0f18] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Panoramic Wallpaper Banner - Clear, vivid, un-shaded */}
          <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden group/banner bg-[#0a0c16]">
            {isUserDataLoading ? (
              <div className="w-full h-full animate-pulse bg-gradient-to-br from-zinc-900 via-[#121526] to-[#0d0f18] flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-zinc-300 shadow-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading profile wallpaper...</span>
                </div>
              </div>
            ) : (
              <img
                src={activeBannerUrl}
                alt="Profile Cover Banner"
                className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02] scale-100 transition-all duration-700"
              />
            )}
            {/* Soft, minimal bottom transition into the dark section below */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f18] via-[#0d0f18]/20 to-transparent pointer-events-none" />

            {/* Top-Left Banner Controls: Reupload BG for owner, or Back to My Profile for visitor */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 z-20">
              {isOwner ? (
                <>
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isBannerUploading || isUserDataLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-black/75 hover:bg-black/90 backdrop-blur-sm border border-white/20 hover:border-cyan-400/60 text-white text-xs font-bold shadow-xl transition-all active:scale-95 group/bg disabled:opacity-50"
                    title="Re-upload background wallpaper"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${isBannerUploading ? 'animate-spin' : 'group-hover/bg:rotate-180 transition-transform duration-500'}`} />
                    <span>{isBannerUploading ? 'Saving...' : 'Reupload BG'}</span>
                  </button>
                  {hasCustomBanner && (
                    <button
                      onClick={handleResetBanner}
                      disabled={isBannerUploading || isUserDataLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-black/75 hover:bg-red-950/80 backdrop-blur-sm border border-white/20 hover:border-red-500/50 text-zinc-300 hover:text-red-300 text-xs font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50"
                      title="Reset to default background wallpaper"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-black/75 hover:bg-black/90 backdrop-blur-sm border border-white/20 hover:border-cyan-400/60 text-white text-xs font-bold shadow-xl transition-all active:scale-95 group/back"
                  title="Return to your personal profile"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-cyan-300 group-hover/back:-translate-x-0.5 transition-transform" />
                  <span>My Profile</span>
                </Link>
              )}
            </div>

            {/* Top Right Real Stats Row (Image 1 Header) */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-8 flex items-center gap-3 sm:gap-6 bg-black/75 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border border-white/10 shadow-xl z-20">
              {isUserDataLoading ? (
                <div className="flex items-center gap-4 py-0.5 animate-pulse">
                  <div className="h-4 w-12 rounded bg-white/15" />
                  <div className="w-px h-5 bg-white/10" />
                  <div className="h-4 w-14 rounded bg-amber-400/20" />
                  <div className="w-px h-5 bg-white/10" />
                  <div className="h-4 w-12 rounded bg-cyan-400/20" />
                  <div className="w-px h-5 bg-white/10" />
                  <div className="h-4 w-14 rounded bg-white/15" />
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="block font-black text-sm sm:text-lg text-white font-mono">
                      {isOwner ? (books.length + userReadlistIds.length) : (uploadedEpubs.length + realWantToReadBooks.length)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">Library</span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="block font-black text-sm sm:text-lg text-amber-300 font-mono">
                      {displayedStats.points.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">Points</span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="block font-black text-sm sm:text-lg text-cyan-300 font-mono">
                      {displayedStats.totalChaptersRead}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">Chapters</span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="block font-black text-sm sm:text-lg text-white font-mono">
                      {communityUsers.length}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">Community</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Profile Bar Overlapping Banner */}
          <div className="relative px-4 sm:px-8 pb-4 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="flex items-end gap-4 sm:gap-6">
                {/* Large Circular User Avatar with Hover Change Overlay */}
                <div 
                  onClick={() => {
                    if (isOwner && !isUserDataLoading) setIsAvatarPickerOpen(true);
                  }}
                  className={`relative group ${isOwner && !isUserDataLoading ? 'cursor-pointer' : ''}`}
                  title={isOwner ? 'Click to change profile picture' : userName}
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-violet-500 to-amber-400 shadow-2xl shadow-cyan-500/30 group-hover:shadow-cyan-400/50 transition-shadow">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0b0f] ring-4 ring-[#0d0f18] relative flex items-center justify-center">
                      {isUserDataLoading ? (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 animate-pulse flex items-center justify-center">
                          <Users className="w-10 h-10 sm:w-14 sm:h-14 text-white/20 animate-pulse" />
                        </div>
                      ) : (
                        <>
                          <img
                            src={userAvatar}
                            alt={userName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Hover Overlay with Camera Icon (owner only) */}
                          {isOwner && (
                            <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1 z-10">
                              <Camera className="w-6 h-6 stroke-[2.5] text-cyan-300 drop-shadow" />
                              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-cyan-200">Change</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 rounded-full bg-emerald-400 ring-4 ring-[#0d0f18] flex items-center justify-center z-20">
                    <span className="w-2 h-2 rounded-full bg-emerald-950" />
                  </span>
                </div>

                {/* Name, Real Handle & Dynamic Tier */}
                <div className="pb-1 sm:pb-2">
                  <div className="flex items-center gap-2.5">
                    {isUserDataLoading ? (
                      <div className="h-8 w-44 rounded-lg bg-white/15 animate-pulse my-0.5" />
                    ) : (
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        {userName}
                      </h2>
                    )}
                    {isUserDataLoading ? (
                      <span className="px-3 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold animate-pulse flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                        <span>Syncing Level...</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        {getLevelTierTitle(readerLevel)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1 font-medium">
                    {isUserDataLoading ? (
                      <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
                    ) : (
                      <span className="text-zinc-300 font-semibold">{userHandle}</span>
                    )}
                    <span>•</span>
                    {isUserDataLoading ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/25 text-amber-300 text-xs font-bold animate-pulse flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Syncing Streak...</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        {displayedStats.currentStreakDays} Days Streak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Share Profile */}
              <div className="flex items-center gap-2.5 pb-2">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Profile URL copied to clipboard!');
                    }
                  }}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4 text-zinc-300" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs (Bento & Gamification removed) */}
            <div className="mt-6 pt-2 border-t border-white/[0.08] flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                  activeTab === 'overview'
                    ? 'text-white bg-white/[0.08]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Overview</span>
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                  activeTab === 'library'
                    ? 'text-white bg-white/[0.08]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Library & Shelves</span>
                {activeTab === 'library' && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA: 2-COLUMN BALANCED LAYOUT                  */}
      {/* ------------------------------------------------------------- */}
      <section className="relative w-full max-w-[1680px] mx-auto px-2 sm:px-4 lg:px-8 mt-6">
        {activeTab === 'overview' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ========================================================= */}
          {/* MAIN COLUMN: Real Bento Cards, Hero Book & Leaderboard    */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Hero Currently Reading Card (Real Book from Library) */}
            {isUserDataLoading ? (
              <div className="relative rounded-3xl border border-white/10 bg-[#161824] p-5 sm:p-6 shadow-2xl overflow-hidden animate-pulse">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 relative z-10">
                  <div className="relative w-28 sm:w-36 h-40 sm:h-52 rounded-2xl bg-white/[0.06] border border-white/10 shrink-0 flex flex-col items-center justify-center gap-2.5 p-3 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />
                    <div className="relative z-10 w-9 h-9 rounded-full bg-black/60 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-md">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    </div>
                    <span className="relative z-10 text-[10px] font-bold text-zinc-300">
                      Loading cover...
                    </span>
                  </div>
                  <div className="flex-1 space-y-3 min-w-0 w-full py-1">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-24 rounded-full bg-white/10" />
                      <div className="h-5 w-20 rounded-full bg-white/10" />
                    </div>
                    <div className="h-7 w-3/4 max-w-sm rounded-lg bg-white/15" />
                    <div className="h-4 w-36 rounded-md bg-white/10" />
                    <div className="space-y-2 pt-2 max-w-md">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-28 rounded bg-white/10" />
                        <div className="h-3 w-16 rounded bg-white/10" />
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10" />
                    </div>
                    <div className="h-9 w-44 rounded-xl bg-white/15 mt-3" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl border border-white/10 bg-[#161824] p-5 sm:p-6 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/10 to-purple-600/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 relative z-10">
                {/* Book Cover */}
                <Link
                  href={`/book/${currentHeroBook.id}`}
                  className="relative w-28 sm:w-36 h-40 sm:h-52 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 shrink-0 group-hover:scale-[1.02] transition-transform duration-300 block bg-zinc-900"
                >
                  <img
                    src={resolveCoverUrl(currentHeroBook.coverImage, currentHeroBook.title, currentHeroBook.category)}
                    alt={currentHeroBook.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('anilist.co')) {
                        target.src = `/api/manga/image-proxy?url=${encodeURIComponent(currentHeroBook.coverImage)}&title=${encodeURIComponent(currentHeroBook.title)}&fallback=cover`;
                      }
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-black text-amber-300 uppercase tracking-wider">
                    Reading Now
                  </span>
                </Link>

                {/* Real Book Details */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        try {
                          const id = currentHeroBook.id;
                          const isCurrentlyQueued =
                            userReadlistIds.includes(id) ||
                            syncedReadlist.some(i => i.id === id) ||
                            localReadlist.some(i => i.id === id);
                          const next = !isCurrentlyQueued;

                          const readlistItem = {
                            bookId: id,
                            title: currentHeroBook.title,
                            author: currentHeroBook.author || 'Unknown',
                            category: currentHeroBook.category || 'manga',
                            coverImage: currentHeroBook.coverImage || '',
                            rating: typeof currentHeroBook.rating === 'number' ? currentHeroBook.rating : 4.5,
                            addedAt: new Date().toISOString()
                          };

                          const key = `readverse_readlist_${id}`;
                          localStorage.setItem(key, String(next));

                          const existingRaw = localStorage.getItem('readverse_want_to_read');
                          let existingList: any[] = [];
                          try {
                            existingList = existingRaw ? JSON.parse(existingRaw) : [];
                          } catch {
                            existingList = [];
                          }
                          if (!Array.isArray(existingList)) existingList = [];

                          if (next) {
                            existingList = [readlistItem, ...existingList.filter((item: any) => (item.bookId || item.id) !== id)];
                            localStorage.setItem(`readverse_readlist_data_${id}`, JSON.stringify(readlistItem));
                          } else {
                            existingList = existingList.filter((item: any) => (item.bookId || item.id) !== id);
                            localStorage.removeItem(`readverse_readlist_data_${id}`);
                          }
                          localStorage.setItem('readverse_want_to_read', JSON.stringify(existingList));

                          if (next) {
                            setUserReadlistIds(prev => [...prev, id]);
                            setLocalReadlist(prev => [
                              {
                                id,
                                title: currentHeroBook.title,
                                author: currentHeroBook.author,
                                category: currentHeroBook.category,
                                coverImage: currentHeroBook.coverImage,
                                rating: currentHeroBook.rating
                              },
                              ...prev.filter(i => i.id !== id)
                            ]);
                          } else {
                            setUserReadlistIds(prev => prev.filter(x => x !== id));
                            setLocalReadlist(prev => prev.filter(i => i.id !== id));
                          }

                          if (session?.user?.email) {
                            fetch('/api/user/readlist', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                userEmail: session.user.email,
                                item: readlistItem,
                                remove: !next,
                                bookId: id
                              })
                            }).catch(err => console.warn(err));
                          }

                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('readverse_readlist_updated'));
                          }
                          alert(next ? 'Added to your Want to Read shelf!' : 'Removed from shelf.');
                        } catch (e) {
                          console.warn(e);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      title="Add to Want to Read"
                    >
                      {userReadlistIds.includes(currentHeroBook.id) ||
                      syncedReadlist.some(i => i.id === currentHeroBook.id) ||
                      localReadlist.some(i => i.id === currentHeroBook.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/book/${currentHeroBook.id}`);
                          alert('Book URL copied to clipboard!');
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      title="Share reading status"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link href={`/book/${currentHeroBook.id}`} className="block group/title">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight group-hover/title:text-cyan-300 transition-colors truncate">
                      {currentHeroBook.title}
                    </h3>
                  </Link>

                  <p className="text-xs sm:text-sm text-zinc-400 font-medium truncate">
                    Author <span className="text-zinc-200 font-semibold">{currentHeroBook.author}</span>
                  </p>
                  
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    {currentHeroBook.genre?.slice(0, 3).map(g => (
                      <span key={g} className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-bold text-zinc-300">
                        {g}
                      </span>
                    ))}
                    <Link
                      href={`/book/${currentHeroBook.id}`}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 ml-1"
                    >
                      <span>Overview</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Continue Reading Button */}
                  <div className="pt-3">
                    <Link
                      href={
                        currentHeroRecentItem && typeof currentHeroRecentItem.chapterIndex === 'number'
                          ? `/read/${currentHeroBook.id}?chapter=${currentHeroRecentItem.chapterIndex}`
                          : `/read/${currentHeroBook.id}?chapter=${heroChaptersRead}`
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:brightness-110 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                      <BookOpen className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {heroChaptersRead > 0
                          ? `Continue Reading Chapter ${heroChaptersRead + 1}`
                          : `Start Reading Chapter 1`}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* ===================================================== */}
            {/* ICONIC BENTO METRIC CARDS                              */}
            {/* ===================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CARD 1: TIME (Pastel Coral/Orange #FFAA64) */}
              <div className="rounded-3xl p-5 bg-[#FFAA64] text-zinc-950 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-transform hover:-translate-y-0.5">
                <div className="mb-3">
                  <span className="font-black text-xs tracking-wider uppercase opacity-85">READING TIME</span>
                </div>

                {isUserDataLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-10 w-28 rounded-xl bg-black/20" />
                    <div className="h-4 w-36 rounded-md bg-black/15" />
                    <div className="pt-4 h-3 w-24 rounded bg-black/20" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 stroke-[2.5]" />
                        <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                          {formattedReadingTime}
                        </span>
                      </div>
                      <p className="text-xs font-bold opacity-80 leading-snug">
                        Total reading time logged
                      </p>
                    </div>

                    <div className="pt-4 flex items-center text-[11px] font-extrabold opacity-75">
                      <span>Total: {displayedStats.readingMinutes} min</span>
                    </div>
                  </>
                )}
              </div>

              {/* CARD 4: STREAK (Pastel Lime Green #C8F752) */}
              <div className="rounded-3xl p-5 bg-[#C8F752] text-zinc-950 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-transform hover:-translate-y-0.5">
                <div className="mb-3">
                  <span className="font-black text-xs tracking-wider uppercase opacity-85">ACTIVE STREAK</span>
                </div>

                {isUserDataLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-10 w-16 rounded-xl bg-black/20" />
                    <div className="h-4 w-44 rounded-md bg-black/15" />
                    <div className="pt-2 h-3 w-28 rounded bg-black/20" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-6 h-6 stroke-[2.5]" />
                        <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                          {displayedStats.currentStreakDays}
                        </span>
                      </div>
                      <p className="text-xs font-bold opacity-85 leading-snug">
                        {displayedStats.currentStreakDays > 0 ? 'Consecutive days reading logged!' : 'Start your daily streak today!'} <br />
                        <span className="font-extrabold text-zinc-950">
                          {displayedStats.boostExpiresAt ? '2X Booster Multiplier Active!' : 'Active Reader Status'}
                        </span>
                      </p>
                    </div>

                    <div className="pt-2 text-[11px] font-black opacity-80">
                      🔥 Milestone: {Math.max(displayedStats.currentStreakDays + 1, 7)} Days
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* CARD 5: BADGES & ACHIEVEMENTS (Pastel Sky Blue #7DE3F4) */}
            <div className="rounded-3xl p-5 sm:p-7 bg-[#7DE3F4] text-zinc-950 shadow-xl relative overflow-hidden space-y-5">
              {/* Header with Title, Unlocked Counter, and Scroll Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Award className="w-6 h-6 stroke-[2.5]" />
                    <span className="font-black text-base sm:text-lg tracking-wider uppercase">
                      READER PIN BADGES
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold opacity-80 mt-0.5">
                    Collect authentic enamel reading pins by hitting reading milestones
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {isUserDataLoading ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-white text-xs sm:text-sm font-black shadow-sm animate-pulse flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                      <span>Syncing Badges...</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-white text-xs sm:text-sm font-black shadow-sm">
                      {badgesList.filter(b => b.unlocked).length} / {badgesList.length} Unlocked
                    </span>
                  )}
                  
                  {/* Left / Right Scroll Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollBadges('left')}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/85 hover:bg-zinc-950 text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                      title="Scroll badges left"
                      aria-label="Previous badges"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => scrollBadges('right')}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/85 hover:bg-zinc-950 text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                      title="Scroll badges right"
                      aria-label="Next badges"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontally Scrollable Badges Ribbon (Unlocked First, Extra Large Pins) */}
              {isUserDataLoading ? (
                <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar py-3 px-1 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shrink-0 flex flex-col items-center gap-2">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-black/15 flex items-center justify-center border-2 border-black/10">
                        <Award className="w-10 h-10 text-black/20" />
                      </div>
                      <div className="h-3.5 w-20 rounded-md bg-black/20" />
                      <div className="h-2.5 w-14 rounded-md bg-black/15" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  ref={badgeScrollRef}
                  className="flex items-start gap-5 sm:gap-7 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1 snap-x"
                >
                {[...badgesList]
                  .sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0) || a.num - b.num)
                  .map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => setInspectingBadge(badge)}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '144px' }}
                      className="snap-start shrink-0 flex flex-col items-center text-center group/pin focus:outline-none transition-transform hover:-translate-y-1.5"
                      title={`${badge.label}: ${badge.req} (${badge.unlocked ? 'Unlocked' : 'Locked'})`}
                    >
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center p-2">
                        <img
                          src={badge.image}
                          alt={badge.label}
                          className={`w-full h-full object-contain drop-shadow-lg group-hover/pin:scale-105 active:scale-95 transition-all duration-300 ${
                            badge.unlocked
                              ? 'filter-none'
                              : 'grayscale opacity-35 group-hover/pin:opacity-50'
                          }`}
                          loading="lazy"
                        />
                        {!badge.unlocked && (
                          <div className="absolute bottom-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-lg border border-white/20">
                            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      <span className="w-32 sm:w-36 md:w-44 text-center text-sm sm:text-base font-black text-zinc-950 tracking-tight leading-snug mt-2 line-clamp-2">
                        {badge.label}
                      </span>
                      <span className="w-32 sm:w-36 md:w-44 text-center text-xs font-bold opacity-75 leading-tight mt-1 truncate">
                        {badge.unlocked ? '✓ In your collection' : badge.req}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Badge Inspection Modal Dialog */}
            {inspectingBadge && (
              <div 
                onClick={() => setInspectingBadge(null)}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
              >
                <div 
                  onClick={e => e.stopPropagation()}
                  className="w-full max-w-sm rounded-3xl bg-[#12141f] border border-white/15 p-6 text-center space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
                >
                  <button
                    onClick={() => setInspectingBadge(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* High-res Badge Graphic */}
                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center pt-2">
                    <img
                      src={inspectingBadge.image}
                      alt={inspectingBadge.label}
                      className={`w-full h-full object-contain drop-shadow-2xl ${
                        inspectingBadge.unlocked ? '' : 'grayscale opacity-40'
                      }`}
                    />
                    {!inspectingBadge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white">
                          <Lock className="w-5 h-5 stroke-[2]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge Title & Metadata */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Badge #{inspectingBadge.num < 10 ? `0${inspectingBadge.num}` : inspectingBadge.num} • {inspectingBadge.category}
                    </div>
                    <h3 className="text-xl font-black text-white">
                      {inspectingBadge.label}
                    </h3>
                    <p className="text-xs text-zinc-300 font-medium pt-1">
                      {inspectingBadge.req}
                    </p>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-3 rounded-2xl text-xs font-bold border ${
                    inspectingBadge.unlocked
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-800/60 border-white/10 text-zinc-400'
                  }`}>
                    {inspectingBadge.unlocked ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Unlocked & Added to your collection!</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-zinc-300">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </div>
                        {inspectingBadge.progress && (
                          <div className="text-[11px] text-zinc-400">
                            Current progress: {inspectingBadge.progress.current} / {inspectingBadge.progress.total} {inspectingBadge.progress.unit}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setInspectingBadge(null)}
                    className="w-full py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Avatar Picker Modal Dialog (Horizontal Scroll Ribbon, 5 Large Pics Visible) */}
            {isAvatarPickerOpen && (
              <div
                onClick={() => setIsAvatarPickerOpen(false)}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
              >
                <div
                  onClick={e => e.stopPropagation()}
                  className="w-full max-w-5xl xl:max-w-6xl rounded-3xl bg-[#0c0e18] border border-white/15 p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 space-y-5"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Camera className="w-6 h-6 text-cyan-400 stroke-[2.5]" />
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          Choose Profile Picture
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                        Scroll horizontally to choose your avatar or upload a custom photo
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Left / Right Scroll Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => scrollAvatars('left')}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                          title="Scroll left"
                          aria-label="Previous avatars"
                        >
                          <ChevronLeft className="w-5 h-5 stroke-[3]" />
                        </button>
                        <button
                          onClick={() => scrollAvatars('right')}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                          title="Scroll right"
                          aria-label="Next avatars"
                        >
                          <ChevronRight className="w-5 h-5 stroke-[3]" />
                        </button>
                      </div>

                      <button
                        onClick={() => setIsAvatarPickerOpen(false)}
                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Ribbon: Extra Large Avatars */}
                  <div
                    ref={avatarScrollRef}
                    className="flex items-start gap-6 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-5 px-2 snap-x"
                  >
                    {/* First Tile: Upload Photo */}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isAvatarUploading}
                      className="snap-start shrink-0 flex flex-col items-center text-center group/upload focus:outline-none transition-transform hover:-translate-y-2 disabled:opacity-50"
                    >
                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full border-2 border-dashed border-cyan-400/40 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 flex flex-col items-center justify-center p-4 transition-all shadow-xl">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center mb-2 group-hover/upload:scale-110 transition-transform">
                          {isAvatarUploading ? (
                            <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-cyan-300" />
                          ) : (
                            <Upload className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
                          )}
                        </div>
                        <span className="text-sm sm:text-base font-black text-cyan-300">
                          {isAvatarUploading ? 'Uploading...' : 'Upload Photo'}
                        </span>
                        <span className="text-xs text-zinc-400 font-medium mt-0.5">Custom file</span>
                      </div>
                      <span className="w-48 sm:w-56 md:w-60 text-center text-sm sm:text-base font-black text-white mt-3">
                        Custom Photo
                      </span>
                      <span className="w-48 sm:w-56 md:w-60 text-center text-xs font-bold text-zinc-500 mt-0.5">
                        Upload from device
                      </span>
                    </button>

                    {/* Preset Avatars in Horizontal Ribbon */}
                    {presetAvatars.map(av => {
                      const isSelected = userAvatar === av.image;
                      return (
                        <button
                          key={av.id}
                          onClick={() => handleSelectAvatar(av.image)}
                          disabled={isAvatarUploading}
                          style={{ contentVisibility: 'auto', containIntrinsicSize: '240px' }}
                          className="snap-start shrink-0 flex flex-col items-center text-center group/avatar focus:outline-none transition-transform hover:-translate-y-2 disabled:opacity-50"
                        >
                          <div className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full p-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-2xl shadow-cyan-500/40 ring-4 ring-cyan-300'
                              : 'hover:bg-white/10'
                          }`}>
                            <img
                              src={av.image}
                              alt={av.name}
                              className="w-full h-full object-contain rounded-full drop-shadow-2xl group-hover/avatar:scale-105 active:scale-95 transition-all duration-300"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-xl ring-2 ring-[#0c0e18]">
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <span className={`w-48 sm:w-56 md:w-60 text-center text-sm sm:text-base font-black tracking-tight leading-snug mt-3 ${
                            isSelected ? 'text-cyan-300' : 'text-zinc-200 group-hover/avatar:text-white'
                          }`}>
                            {av.name}
                          </span>
                          <span className="w-48 sm:w-56 md:w-60 text-center text-xs font-bold text-zinc-500 capitalize mt-0.5">
                            {isSelected ? '✓ Active' : av.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
                    <div>
                      {customAvatar && (
                        <button
                          onClick={handleResetAvatar}
                          disabled={isAvatarUploading}
                          className="text-zinc-400 hover:text-rose-400 transition-colors font-semibold disabled:opacity-50"
                        >
                          Reset to default account avatar
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setIsAvatarPickerOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Books Progress Speedometer Section (No Outer Box, No Item Box, No Hover Highlights, Enlarged Dials) */}
            <div className="space-y-5 pt-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Zap className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg sm:text-xl flex items-center gap-2">
                      <span>Books Progress</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">Real-time completion speedometer dials</p>
                  </div>
                </div>
                {isUserDataLoading ? (
                  <span className="h-6 w-28 rounded-full bg-white/10 animate-pulse" />
                ) : (
                  <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    {booksProgressList.length} Active Tracks
                  </span>
                )}
              </div>

              {isUserDataLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 animate-pulse">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-start text-center">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
                        <div className="w-20 h-28 rounded-lg bg-white/10" />
                      </div>
                      <div className="h-4 w-28 rounded-md bg-white/15 mt-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {booksProgressList.map((item, idx) => {
                    const theme = SPEEDOMETER_THEMES[idx % SPEEDOMETER_THEMES.length];
                    const targetHref = item.chaptersRead > 0
                      ? `/read/${item.id}?chapter=${item.chaptersRead}`
                      : `/book/${item.id}`;

                    return (
                      <Link
                        key={item.id}
                        href={targetHref}
                        className="flex flex-col items-center justify-start text-center focus:outline-none"
                      >
                        {/* Speedometer Gauge Dial with Centered Book Cover & Colorful Arc (Enlarged, No Box) */}
                        <CoverSpeedometer
                          percentage={item.percentage}
                          theme={theme}
                          coverImage={item.coverImage}
                          title={item.title}
                          category={item.category}
                        />

                        {/* Clean Book Title Only (No Hover Color Shift) */}
                        <div className="w-full mt-3 text-center px-1">
                          <h4 className="font-bold text-sm sm:text-base text-zinc-100 truncate">
                            {item.title}
                          </h4>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ========================================================= */}
          {/* SIDEBAR: Currently Reading, Want-to-Read & Readers        */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Currently Reading Side Card (Real Book) */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0f18] p-5 space-y-3.5 shadow-xl">
              <h3 className="font-extrabold text-white text-sm sm:text-base">Currently Reading</h3>
              
              {isUserDataLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse">
                  <div className="w-12 h-16 rounded-lg bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 rounded bg-white/15" />
                    <div className="h-2.5 w-20 rounded bg-white/10" />
                    <div className="w-full h-1.5 rounded-full bg-white/10" />
                    <div className="h-2.5 w-16 rounded bg-white/10" />
                  </div>
                </div>
              ) : (
                <Link
                  href={`/book/${currentHeroBook.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-white/20 transition-all group block"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-md bg-zinc-900">
                    <img
                      src={resolveCoverUrl(currentHeroBook.coverImage, currentHeroBook.title, currentHeroBook.category)}
                      alt={currentHeroBook.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('fallback=cover')) {
                          target.src = `/api/manga/image-proxy?url=${encodeURIComponent(currentHeroBook.coverImage)}&title=${encodeURIComponent(currentHeroBook.title)}&fallback=cover`;
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">
                      {currentHeroBook.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate">{currentHeroBook.author}</p>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${heroChaptersRead > 0 ? Math.max(5, heroProgressPct) : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                      {heroProgressPct}% ({heroChaptersRead}/{heroTotalChapters} ch)
                    </span>
                  </div>
                </Link>
              )}
            </div>

            {/* Real Want-to-Read (Readlist) */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0f18] p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-white text-sm sm:text-base">Want to Read</h3>
                {isUserDataLoading ? (
                  <span className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                ) : (
                  <span className="text-xs text-cyan-400 font-semibold">
                    {userQueuedCount > 0 ? `${userQueuedCount} queued` : `${realWantToReadBooks.length} queued`}
                  </span>
                )}
              </div>

              {isUserDataLoading ? (
                <div className="grid grid-cols-4 gap-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="relative aspect-[2/3] rounded-xl bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center p-1 overflow-hidden shadow-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 z-10" />
                      <span className="text-[9px] font-bold text-zinc-400 z-10 mt-1">Cover...</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {realWantToReadBooks.map(item => (
                    <Link
                      key={item.id}
                      href={`/book/${item.id}`}
                      className="aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition-all hover:scale-105 block bg-zinc-900"
                      title={item.title}
                    >
                      <img
                        src={resolveCoverUrl(item.coverImage, item.title, item.category)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('fallback=cover')) {
                            target.src = `/api/manga/image-proxy?url=${encodeURIComponent(item.coverImage)}&title=${encodeURIComponent(item.title)}&fallback=cover`;
                          }
                        }}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* FULL WIDTH RECENTLY READ (No Outer Border, Stretched Right, Horizontally Scrollable) */}
        {isUserDataLoading ? (
          <div className="w-full space-y-4 pt-10 pb-6 animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
                  <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight">Recently Read</h3>
                </div>
                <div className="h-5 w-36 rounded-full bg-white/10" />
              </div>
              <div className="h-6 w-20 rounded-full bg-white/10" />
            </div>

            <div className="flex items-start gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-2 px-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-40 sm:w-48 md:w-52 shrink-0 flex flex-col space-y-2">
                  <div className="relative aspect-[2/3] w-full rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center p-3 text-center overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-shimmer" />
                    <div className="relative z-10 w-8 h-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center backdrop-blur-md shadow">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    </div>
                    <span className="relative z-10 text-[10px] font-bold text-zinc-300 mt-1">
                      Loading cover...
                    </span>
                  </div>
                  <div className="h-3.5 w-3/4 rounded bg-white/15" />
                  <div className="h-2.5 w-1/2 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        ) : realRecentlyReadBooks.length > 0 ? (
          <div className="w-full space-y-4 pt-10 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
                  <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight">Recently Read</h3>
                </div>
                {session?.user ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Google Account Synced
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-medium bg-white/5 px-2.5 py-0.5 rounded-full">
                    Local Session
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  {realRecentlyReadBooks.length} titles
                </span>

                {/* Left / Right Scroll Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scrollRecentRead('left')}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                    title="Scroll left"
                    aria-label="Previous books"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => scrollRecentRead('right')}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                    title="Scroll right"
                    aria-label="Next books"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Ribbon */}
            <div
              ref={recentReadScrollRef}
              className="flex items-start gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 snap-x"
            >
              {realRecentlyReadBooks.map(item => (
                <Link
                  key={item.id}
                  href={item.chapterIndex !== undefined ? `/read/${item.id}?chapter=${item.chapterIndex}` : `/book/${item.id}`}
                  className="w-40 sm:w-48 md:w-52 shrink-0 snap-start flex flex-col group focus:outline-none transition-transform hover:-translate-y-1.5"
                >
                  <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden relative bg-zinc-900 border border-white/10 group-hover:border-cyan-400/50 shadow-xl transition-all">
                    <img
                      src={resolveCoverUrl(item.coverImage, item.title, item.category)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('fallback=cover')) {
                          target.src = `/api/manga/image-proxy?url=${encodeURIComponent(item.coverImage)}&title=${encodeURIComponent(item.title)}&fallback=cover`;
                        }
                      }}
                    />
                    {item.chapterIndex !== undefined && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 border border-white/10">
                        Ch. {item.chapterIndex + 1}
                      </span>
                    )}
                  </div>
                  <div className="pt-2.5 px-0.5 space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                      <span className="text-amber-300 font-bold">★ {item.rating}</span>
                      <span className="font-mono capitalize">{item.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </>
    ) : (
      /* ========================================================= */
      /* LIBRARY & SHELVES TAB: UPLOADED EPUBS & BOOKSHELVES       */
      /* ========================================================= */
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingEpub(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDraggingEpub(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingEpub(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleEpubFileUpload(file);
        }}
        className="relative space-y-8 animate-in fade-in duration-300 pb-16"
      >
        {/* Hidden EPUB File Input */}
        <input
          type="file"
          ref={epubFileInputRef}
          accept=".epub"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleEpubFileUpload(file);
            e.target.value = '';
          }}
        />

        {/* Drag and Drop Visual Overlay */}
        {isDraggingEpub && (
          <div className="absolute inset-0 z-50 bg-cyan-500/10 border-2 border-dashed border-cyan-400 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center mb-3">
              <Upload className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h4 className="text-xl font-black text-white">Drop your .epub file here</h4>
            <p className="text-xs text-cyan-200 mt-1">Upload and read your personal ebook immediately</p>
          </div>
        )}

        {/* Notification Banner */}
        {epubNotice && (
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all ${
              epubNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {epubNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{epubNotice.message}</span>
            </div>
            <button
              onClick={() => setEpubNotice(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Shelf Controls Header: Navigation Pills, Search & Upload Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#0d0f18] shadow-xl">
          {/* Shelf Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedShelf('epubs')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                selectedShelf === 'epubs'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-violet-400/50'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Uploaded EPUBs</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[11px] font-mono">
                {uploadedEpubs.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedShelf('want-to-read')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                selectedShelf === 'want-to-read'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400/50'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Want to Read</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[11px] font-mono">
                {userQueuedCount > 0 ? userQueuedCount : realWantToReadBooks.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedShelf('completed')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                selectedShelf === 'completed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/50'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[11px] font-mono">
                {userCompletedIds.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedShelf('all')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                selectedShelf === 'all'
                  ? 'bg-white text-zinc-950 shadow-lg font-black'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span>All Shelves</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[11px] font-mono">
                {uploadedEpubs.length + realWantToReadBooks.length + userCompletedIds.length}
              </span>
            </button>
          </div>

          {/* Right Side: Search & Upload EPUB Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Shelf Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shelfSearchQuery}
                onChange={(e) => setShelfSearchQuery(e.target.value)}
                placeholder="Search titles or authors..."
                className="w-full pl-9 pr-7 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60"
              />
              {shelfSearchQuery && (
                <button
                  onClick={() => setShelfSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Upload EPUB Button for owner, or My Library link for visitor */}
            {isOwner ? (
              <button
                onClick={() => epubFileInputRef.current?.click()}
                disabled={isUploadingEpub}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                {isUploadingEpub ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <FolderUp className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload EPUB</span>
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/profile"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition-all shrink-0"
                title="Go to your own personal library & shelves"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>My Library</span>
              </Link>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: UPLOADED EPUBS SHELF                          */}
        {/* ========================================================= */}
        {(selectedShelf === 'epubs' || selectedShelf === 'all') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-violet-400 stroke-[2.5]" />
                <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight">
                  {isOwner ? 'Uploaded EPUB Books' : `${userName}'s Uploaded Books`}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold">
                  {filteredEpubs.length} {filteredEpubs.length === 1 ? 'book' : 'books'}
                </span>
              </div>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                {isOwner
                  ? 'DRM-free EPUBs stored locally with offline reading support'
                  : `Uploaded and shared by ${userName} • Click Read Now to read anytime`}
              </span>
            </div>

            {isLoadingEpubs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="space-y-2 animate-pulse">
                    <div className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/5" />
                    <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredEpubs.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-lg">
                  <FolderUp className="w-8 h-8 stroke-[2]" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="font-black text-white text-base sm:text-lg">
                    {shelfSearchQuery
                      ? 'No matching EPUB books found'
                      : isOwner
                        ? 'No EPUB books uploaded yet'
                        : `${userName} hasn't uploaded any EPUB books yet`}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {shelfSearchQuery
                      ? 'Try adjusting your search query to find your uploaded books.'
                      : isOwner
                        ? 'Upload any .epub novel or document to store it on your server, read offline, and track reading speeds.'
                        : `${userName} has not uploaded any EPUB books to their shelf yet.`}
                  </p>
                </div>
                {!shelfSearchQuery && isOwner && (
                  <button
                    onClick={() => epubFileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload Your First EPUB</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredEpubs.map(book => {
                  const bookCover = resolveCoverUrl(book.coverImage, book.title, book.category);
                  return (
                    <div
                      key={book.id}
                      onClick={() => handleOpenEpub(book)}
                      className="group/epub relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                    >
                      {/* Book Cover Frame */}
                      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#161824] shadow-xl group-hover/epub:border-cyan-400/60 group-hover/epub:shadow-cyan-500/20 transition-all duration-300">
                        {bookCover ? (
                          <img
                            src={bookCover}
                            alt={book.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/epub:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('fallback=cover')) {
                                target.src = `/api/manga/image-proxy?url=${encodeURIComponent(book.coverImage)}&title=${encodeURIComponent(book.title)}&fallback=cover`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-between p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 text-center">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 font-bold">
                              EPUB Book
                            </span>
                            <BookOpen className="w-10 h-10 text-cyan-400 stroke-[1.5]" />
                            <span className="text-xs font-black text-white line-clamp-3">
                              {book.title}
                            </span>
                          </div>
                        )}

                        {/* Top Left EPUB Format Badge */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-violet-600/90 text-white text-[10px] font-mono font-black uppercase tracking-wider shadow-md backdrop-blur-sm border border-violet-400/30">
                            EPUB
                          </span>
                        </div>

                        {/* Top Right Local Server Badge */}
                        <div className="absolute top-2 right-2 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-black/75 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30 backdrop-blur-sm">
                            Local
                          </span>
                        </div>
                      </div>

                      {/* Book Meta Details */}
                      <div className="pt-2.5 px-0.5 space-y-1">
                        <h4
                          className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-1 group-hover/epub:text-cyan-300 transition-colors"
                          title={book.title}
                        >
                          {book.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate" title={book.author}>
                          {book.author || 'Unknown Author'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
                          <span>Offline Ready</span>
                          <span className="text-amber-300 font-semibold">★ 5.0</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: WANT TO READ SHELF                             */}
        {/* ========================================================= */}
        {(selectedShelf === 'want-to-read' || selectedShelf === 'all') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookmarkCheck className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
                <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight">
                  Want to Read Shelf
                </h3>
                {isUserDataLoading ? (
                  <span className="h-5 w-20 rounded-full bg-white/10 animate-pulse" />
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                    {filteredWantToRead.length} {filteredWantToRead.length === 1 ? 'title' : 'titles'}
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Books saved to your reading queue
              </span>
            </div>

            {isUserDataLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <div className="aspect-[2/3] w-full rounded-2xl bg-white/[0.06] border border-white/10" />
                    <div className="h-3.5 w-3/4 rounded bg-white/15" />
                    <div className="h-2.5 w-1/2 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : filteredWantToRead.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#0d0f18] p-8 text-center text-zinc-400 text-xs sm:text-sm">
                No books in your Want to Read shelf yet. Browse the catalog to add books to your reading list.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredWantToRead.map(item => (
                  <Link
                    key={item.id}
                    href={`/book/${item.id}`}
                    className="group/shelf relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#161824] shadow-xl group-hover/shelf:border-cyan-400/60 transition-all">
                      <img
                        src={resolveCoverUrl(item.coverImage, item.title, item.category)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/shelf:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10 backdrop-blur-sm">
                        Queued
                      </span>
                    </div>
                    <div className="pt-2.5 px-0.5 space-y-1">
                      <h4 className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-1 group-hover/shelf:text-cyan-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">{item.author}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: COMPLETED SHELF                                */}
        {/* ========================================================= */}
        {(selectedShelf === 'completed' || selectedShelf === 'all') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight">
                  Completed Books Shelf
                </h3>
                {isUserDataLoading ? (
                  <span className="h-5 w-20 rounded-full bg-white/10 animate-pulse" />
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    {filteredCompleted.length} {filteredCompleted.length === 1 ? 'title' : 'titles'}
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Books you have fully finished reading
              </span>
            </div>

            {isUserDataLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <div className="aspect-[2/3] w-full rounded-2xl bg-white/[0.06] border border-white/10" />
                    <div className="h-3.5 w-3/4 rounded bg-white/15" />
                    <div className="h-2.5 w-1/2 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : filteredCompleted.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#0d0f18] p-8 text-center text-zinc-400 text-xs sm:text-sm">
                No completed books yet. Books will appear here once you finish reading all chapters!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredCompleted.map(item => (
                  <Link
                    key={item.id}
                    href={`/book/${item.id}`}
                    className="group/comp relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#161824] shadow-xl group-hover/comp:border-emerald-400/60 transition-all">
                      <img
                        src={resolveCoverUrl(item.coverImage, item.title, item.category)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/comp:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-zinc-950 text-[10px] font-mono font-black uppercase tracking-wider shadow-md">
                        Finished
                      </span>
                    </div>
                    <div className="pt-2.5 px-0.5 space-y-1">
                      <h4 className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-1 group-hover/comp:text-emerald-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">{item.author}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </section>
    </div>
  );
};
