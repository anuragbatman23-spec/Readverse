export type ContentCategory = 'manga' | 'manhwa' | 'lightnovel' | 'webnovel' | 'book';

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  content: string[]; // URLs for manga/manhwa images, or paragraphs for text
  wordCount?: number;
  path?: string;
  pluginId?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: ContentCategory;
  coverImage: string;
  alternativeCovers?: string[];
  bannerImage?: string;
  description: string;
  genre: string[];
  rating: number;
  chapters: Chapter[];
  pointsPerChapter: number;
  wordCountPerPoint?: number;
  pluginId?: string;
  sourcePath?: string;
}

export interface PointTransaction {
  id: string;
  title: string;
  amount: number; // positive for earned, negative for spent
  category: ContentCategory | 'merch' | 'boost' | 'social';
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  bookTitle: string;
  bookCategory: ContentCategory;
  chapterNumber?: number;
  content: string;
  type: 'quote' | 'panel' | 'milestone';
  mediaUrl?: string; // quote card image or panel snapshot
  quoteText?: string;
  isSpoiler?: boolean;
  spoilerChapter?: number;
  likes: number;
  hasLiked?: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface RewardItem {
  id: string;
  name: string;
  category: 'clothing' | 'decor' | 'book' | 'digital';
  pointsCost: number;
  cashCoPay: number; // Optional cash price if they want to pay partial points
  cashPointsCost: number;
  description: string;
  imageUrl: string;
  badge?: string;
  isPhysical: boolean;
  rating: number;
}

export interface UserStats {
  points: number;
  totalChaptersRead: number;
  totalWordsRead: number;
  readingMinutes: number;
  boostExpiresAt: number | null; // Timestamp in ms
  currentStreakDays: number;
}

export interface AdMetrics {
  totalImpressions: number;
  inViewRefreshes: number;
  videoAdsWatched: number;
  estimatedRevenueUsd: number;
}
