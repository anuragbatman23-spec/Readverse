'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import confetti from 'canvas-confetti';
import { UserStats, AdMetrics, PointTransaction, Post, RewardItem, Book, ContentCategory } from '../types';
import { MOCK_POSTS, MOCK_BOOKS, MOCK_REWARDS } from '../data/mockData';

interface AppContextType {
  stats: UserStats;
  adMetrics: AdMetrics;
  transactions: PointTransaction[];
  posts: Post[];
  rewards: RewardItem[];
  books: Book[];
  activeBook: Book | null;
  activeChapterIndex: number;
  isVideoAdModalOpen: boolean;
  videoAdRemainingSec: number;
  antiCheatAlert: string | null;
  
  // Actions
  setActiveBook: (book: Book | null, chapterIndex?: number) => void;
  setActiveChapterIndex: (index: number) => void;
  awardPoints: (
    amount: number,
    title: string,
    category: ContentCategory | 'social'
  ) => boolean;
  triggerVideoAdForBoost: () => void;
  closeVideoAdModal: () => void;
  recordAdImpression: (isRefresh?: boolean) => void;
  createPost: (postData: Partial<Post>) => void;
  toggleLikePost: (postId: string) => void;
  redeemReward: (reward: RewardItem, useCashCoPay?: boolean) => { success: boolean; message: string };
  triggerAntiCheatWarning: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const [stats, setStats] = useState<UserStats>({
    points: 0,
    totalChaptersRead: 0,
    totalWordsRead: 0,
    readingMinutes: 0,
    boostExpiresAt: null,
    currentStreakDays: 1
  });

  // Hydrate stats from user profile in backend database
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      const email = session?.user?.email;
      if (!email) return;

      try {
        const res = await fetch(`/api/user/stats?user=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.stats) {
            setStats(prev => ({
              ...prev,
              points: data.stats.points ?? prev.points,
              totalChaptersRead: data.stats.totalChaptersRead ?? prev.totalChaptersRead,
              totalWordsRead: data.stats.totalWordsRead ?? prev.totalWordsRead,
              readingMinutes: data.stats.readingMinutes ?? prev.readingMinutes,
              currentStreakDays: data.stats.currentStreakDays ?? prev.currentStreakDays,
            }));
          }
        }
      } catch (err) {
        console.warn('Failed hydrating user stats from backend:', err);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.email]);

  const [adMetrics, setAdMetrics] = useState<AdMetrics>({
    totalImpressions: 48,
    inViewRefreshes: 18,
    videoAdsWatched: 2,
    estimatedRevenueUsd: 0.28
  });

  // Use a ref to batch ad metric updates so frequent impression calls
  // don't trigger re-renders that cascade to readers and cause scroll jumps.
  const adMetricsRef = useRef(adMetrics);
  const adFlushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync when state updates from other sources (e.g. video ad)
  useEffect(() => {
    adMetricsRef.current = adMetrics;
  }, [adMetrics]);

  const [transactions, setTransactions] = useState<PointTransaction[]>([]);

  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [rewards] = useState<RewardItem[]>(MOCK_REWARDS);
  const [books] = useState<Book[]>(MOCK_BOOKS);
  
  const [activeBook, setActiveBookState] = useState<Book | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Video Ad Modal state
  const [isVideoAdModalOpen, setIsVideoAdModalOpen] = useState(false);
  const [videoAdRemainingSec, setVideoAdRemainingSec] = useState(0);

  // Anti-cheat alert
  const [antiCheatAlert, setAntiCheatAlert] = useState<string | null>(null);

  // Boost countdown timer checker
  useEffect(() => {
    const timer = setInterval(() => {
      if (stats.boostExpiresAt && Date.now() > stats.boostExpiresAt) {
        setStats(prev => ({ ...prev, boostExpiresAt: null }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.boostExpiresAt]);

  const triggerVideoAdForBoost = () => {
    // Activate 3-hour 2x boost immediately without any ads
    const threeHoursFromNow = Date.now() + 3 * 60 * 60 * 1000;
    setStats(prev => ({
      ...prev,
      boostExpiresAt: threeHoursFromNow
    }));

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // Ignore if confetti not supported
    }
  };

  const closeVideoAdModal = () => {
    setIsVideoAdModalOpen(false);
  };

  const recordAdImpression = useCallback((isRefresh: boolean = false) => {
    // Mutate the ref immediately (no re-render)
    adMetricsRef.current = {
      ...adMetricsRef.current,
      totalImpressions: adMetricsRef.current.totalImpressions + 1,
      inViewRefreshes: isRefresh
        ? adMetricsRef.current.inViewRefreshes + 1
        : adMetricsRef.current.inViewRefreshes,
      estimatedRevenueUsd: Number(
        (adMetricsRef.current.estimatedRevenueUsd + (isRefresh ? 0.003 : 0.0025)).toFixed(4)
      )
    };

    // Debounce the actual state flush so rapid impressions don't cause
    // repeated re-renders (e.g. skyscraper ads refreshing while reading)
    if (adFlushTimerRef.current) clearTimeout(adFlushTimerRef.current);
    adFlushTimerRef.current = setTimeout(() => {
      setAdMetrics({ ...adMetricsRef.current });
    }, 5000); // flush to state every 5s at most
  }, []);

  const triggerAntiCheatWarning = (_message: string) => {
    // Anti-cheat disabled
  };

  const awardPoints = (
    baseAmount: number,
    title: string,
    category: ContentCategory | 'social'
  ): boolean => {
    const isBoosted = stats.boostExpiresAt !== null && Date.now() < stats.boostExpiresAt;
    const finalAmount = isBoosted ? baseAmount * 2 : baseAmount;
    const isChapter = category !== 'social';
    const chaptersDelta = isChapter ? 1 : 0;
    const wordsDelta = isChapter ? (category === 'webnovel' || category === 'lightnovel' ? 1500 : 500) : 0;
    const minutesDelta = isChapter ? 3 : 0;

    setStats(prev => ({
      ...prev,
      points: prev.points + finalAmount,
      totalChaptersRead: prev.totalChaptersRead + chaptersDelta,
      totalWordsRead: prev.totalWordsRead + wordsDelta,
      readingMinutes: prev.readingMinutes + minutesDelta
    }));

    // Persist stats update to backend database
    const email = session?.user?.email;
    if (email) {
      fetch('/api/user/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          pointsDelta: finalAmount,
          chaptersReadDelta: chaptersDelta,
          wordsReadDelta: wordsDelta,
          minutesDelta: minutesDelta
        })
      }).catch(err => console.warn('Failed syncing awarded stats to backend:', err));

      if (isChapter) {
        fetch('/api/user/badges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: email,
            event: {
              type: 'read_chapter',
              category: category
            }
          })
        }).catch(err => console.warn('Failed recording badge event from awardPoints:', err));
      }
    }

    const newTx: PointTransaction = {
      id: `tx-${Date.now()}`,
      title: isBoosted ? `${title} (🔥 2x Boosted)` : title,
      amount: finalAmount,
      category,
      timestamp: 'Just now'
    };

    setTransactions(prev => [newTx, ...prev]);

    // Small celebratory confetti
    try {
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { y: 0.85 }
      });
    } catch {
      // Ignore
    }

    return true;
  };

  const setActiveBook = (book: Book | null, chapterIndex: number = 0) => {
    setActiveBookState(book);
    setActiveChapterIndex(chapterIndex);
  };

  const createPost = (postData: Partial<Post>) => {
    let savedAvatar = null;
    try {
      savedAvatar = localStorage.getItem('readverse_custom_avatar');
    } catch (_) {}

    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: postData.userId || 'user-current',
      userName: postData.userName || 'SoloReader',
      userAvatar: postData.userAvatar || savedAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      userTitle: postData.userTitle || 'Novice Cultivator ✨',
      bookTitle: postData.bookTitle || 'Novel',
      bookCategory: postData.bookCategory || 'manga',
      chapterNumber: postData.chapterNumber || 1,
      content: postData.content || '',
      type: postData.type || 'quote',
      quoteText: postData.quoteText,
      mediaUrl: postData.mediaUrl,
      isSpoiler: postData.isSpoiler || false,
      spoilerChapter: postData.spoilerChapter,
      likes: 1,
      hasLiked: true,
      commentsCount: 0,
      createdAt: 'Just now'
    };

    setPosts(prev => [newPost, ...prev]);
    awardPoints(5, 'Shared Quote/Panel to Community Feed', 'social');
  };

  const toggleLikePost = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked,
            likes: hasLiked ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      })
    );
  };

  const redeemReward = (reward: RewardItem, useCashCoPay: boolean = false) => {
    const cost = useCashCoPay ? reward.cashPointsCost : reward.pointsCost;

    if (stats.points < cost) {
      return {
        success: false,
        message: `Insufficient points! You need ${cost} points, but only have ${stats.points}.`
      };
    }

    setStats(prev => ({
      ...prev,
      points: prev.points - cost
    }));

    // Persist point deduction to backend database
    const email = session?.user?.email;
    if (email) {
      fetch('/api/user/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          pointsDelta: -cost
        })
      }).catch(err => console.warn('Failed syncing redeemed points to backend:', err));
    }

    const newTx: PointTransaction = {
      id: `tx-${Date.now()}`,
      title: `Redeemed: ${reward.name}${useCashCoPay ? ` ($${reward.cashCoPay} co-pay)` : ''}`,
      amount: -cost,
      category: 'merch',
      timestamp: 'Just now'
    };

    setTransactions(prev => [newTx, ...prev]);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore
    }

    return {
      success: true,
      message: `Successfully redeemed ${reward.name}! Order placed for fulfillment.`
    };
  };

  return (
    <AppContext.Provider
      value={{
        stats,
        adMetrics,
        transactions,
        posts,
        rewards,
        books,
        activeBook,
        activeChapterIndex,
        isVideoAdModalOpen,
        videoAdRemainingSec,
        antiCheatAlert,
        setActiveBook,
        setActiveChapterIndex,
        awardPoints,
        triggerVideoAdForBoost,
        closeVideoAdModal,
        recordAdImpression,
        createPost,
        toggleLikePost,
        redeemReward,
        triggerAntiCheatWarning
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
