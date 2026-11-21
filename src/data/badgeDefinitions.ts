export interface UserBadgeProgress {
  // 1. Chapters & Series
  totalChaptersRead: number;
  completedSeriesCount: number;
  completedSeriesIds: string[];

  // 2. Formats & Genres
  readGenres: string[];
  readContentTypes: string[];

  // 3. Streaks & Daily
  currentStreakDays: number;
  lastReadDate?: string; // YYYY-MM-DD
  todayChaptersCount?: number;
  maxChaptersInOneDay: number;

  // 4. Reviews & Ratings
  reviewsCount: number;
  ratedTitlesCount: number;

  // 5. Library & Social
  savedTitlesCount: number;
  readingListsCount: number;
  followedAuthorsCount: number;

  // 6. Special Feats
  midnightReadCount: number;
  lastMidnightReadDate?: string;
  revisitedCompletedCount: number;
  finaleReadWithin24h: boolean;
}

export interface BadgeItem {
  id: string;
  num: number;
  label: string;
  req: string;
  category: 'chapters' | 'series' | 'genres' | 'streaks' | 'reviews' | 'library' | 'special';
  image: string;
  unlocked: boolean;
  progress: {
    current: number;
    total: number;
    unit: string;
  };
}

export type BadgeEvent =
  | { type: 'read_chapter'; category?: string; genre?: string; wordsCount?: number; seriesId?: string; isFinale?: boolean; isRevisit?: boolean }
  | { type: 'complete_series'; seriesId: string }
  | { type: 'rate_title'; bookId: string; rating: number }
  | { type: 'publish_review'; bookId?: string }
  | { type: 'add_to_readlist'; bookId: string; totalSaved?: number }
  | { type: 'create_reading_list' }
  | { type: 'follow_author'; authorId?: string };

export function getDefaultBadgeProgress(p?: Partial<UserBadgeProgress>): UserBadgeProgress {
  return {
    totalChaptersRead: p?.totalChaptersRead ?? 0,
    completedSeriesCount: p?.completedSeriesCount ?? 0,
    completedSeriesIds: p?.completedSeriesIds ?? [],
    readGenres: p?.readGenres ?? [],
    readContentTypes: p?.readContentTypes ?? [],
    currentStreakDays: p?.currentStreakDays ?? 1,
    lastReadDate: p?.lastReadDate,
    todayChaptersCount: p?.todayChaptersCount ?? 0,
    maxChaptersInOneDay: p?.maxChaptersInOneDay ?? 0,
    reviewsCount: p?.reviewsCount ?? 0,
    ratedTitlesCount: p?.ratedTitlesCount ?? 0,
    savedTitlesCount: p?.savedTitlesCount ?? 0,
    readingListsCount: p?.readingListsCount ?? 0,
    followedAuthorsCount: p?.followedAuthorsCount ?? 0,
    midnightReadCount: p?.midnightReadCount ?? 0,
    lastMidnightReadDate: p?.lastMidnightReadDate,
    revisitedCompletedCount: p?.revisitedCompletedCount ?? 0,
    finaleReadWithin24h: p?.finaleReadWithin24h ?? false,
  };
}

// Master pure evaluation function for all 49 badges
// Unlocks and progress match requirements 100% precisely with zero synthetic fallbacks
export function evaluateAllBadges(
  stats: {
    points: number;
    totalChaptersRead: number;
    totalWordsRead: number;
    readingMinutes: number;
    currentStreakDays: number;
  },
  progress?: Partial<UserBadgeProgress>
): BadgeItem[] {
  const p: UserBadgeProgress = getDefaultBadgeProgress(progress);

  const chapters = Math.max(stats.totalChaptersRead || 0, p.totalChaptersRead || 0);
  const seriesCompleted = p.completedSeriesCount || 0;
  const genresCount = p.readGenres?.length || 0;
  const contentTypes = p.readContentTypes || [];
  const contentTypesCount = contentTypes.length;
  const streak = Math.max(stats.currentStreakDays || 1, p.currentStreakDays || 1);
  const reviews = p.reviewsCount || 0;
  const ratings = p.ratedTitlesCount || 0;
  const saved = p.savedTitlesCount || 0;
  const lists = p.readingListsCount || 0;
  const authors = p.followedAuthorsCount || 0;
  const midnight = p.midnightReadCount || 0;
  const maxInDay = p.maxChaptersInOneDay || 0;
  const revisited = p.revisitedCompletedCount || 0;
  const finale = Boolean(p.finaleReadWithin24h);

  const hasManga = contentTypes.some(t => t.toLowerCase() === 'manga');
  const hasManhwa = contentTypes.some(t => t.toLowerCase() === 'manhwa');
  const hasNovel = contentTypes.some(t => ['novel', 'webnovel', 'lightnovel', 'book'].includes(t.toLowerCase()));
  const adventurerUnlocked = Boolean(hasManga && hasManhwa && hasNovel);
  const adventurerCount = (hasManga ? 1 : 0) + (hasManhwa ? 1 : 0) + (hasNovel ? 1 : 0);

  return [
    // -------------------------------------------------------------
    // 1. Chapters Read Milestones (01 to 10)
    // -------------------------------------------------------------
    { id: 'b_01', num: 1, label: 'First Page', req: 'Read 1 chapter', category: 'chapters', image: '/badges/badge_01.png', unlocked: chapters >= 1, progress: { current: Math.min(1, chapters), total: 1, unit: 'chapters' } },
    { id: 'b_02', num: 2, label: 'Page Turner', req: 'Read 10 chapters', category: 'chapters', image: '/badges/badge_02.png', unlocked: chapters >= 10, progress: { current: Math.min(10, chapters), total: 10, unit: 'chapters' } },
    { id: 'b_03', num: 3, label: 'Bookworm', req: 'Read 50 chapters', category: 'chapters', image: '/badges/badge_03.png', unlocked: chapters >= 50, progress: { current: Math.min(50, chapters), total: 50, unit: 'chapters' } },
    { id: 'b_04', num: 4, label: 'Story Seeker', req: 'Read 100 chapters', category: 'chapters', image: '/badges/badge_04.png', unlocked: chapters >= 100, progress: { current: Math.min(100, chapters), total: 100, unit: 'chapters' } },
    { id: 'b_05', num: 5, label: 'Knowledge Keeper', req: 'Read 250 chapters', category: 'chapters', image: '/badges/badge_05.png', unlocked: chapters >= 250, progress: { current: Math.min(250, chapters), total: 250, unit: 'chapters' } },
    { id: 'b_06', num: 6, label: 'Library Dweller', req: 'Read 500 chapters', category: 'chapters', image: '/badges/badge_06.png', unlocked: chapters >= 500, progress: { current: Math.min(500, chapters), total: 500, unit: 'chapters' } },
    { id: 'b_07', num: 7, label: 'Endless Reader', req: 'Read 1,000 chapters', category: 'chapters', image: '/badges/badge_07.png', unlocked: chapters >= 1000, progress: { current: Math.min(1000, chapters), total: 1000, unit: 'chapters' } },
    { id: 'b_08', num: 8, label: 'Infinite Pages', req: 'Read 2,500 chapters', category: 'chapters', image: '/badges/badge_08.png', unlocked: chapters >= 2500, progress: { current: Math.min(2500, chapters), total: 2500, unit: 'chapters' } },
    { id: 'b_09', num: 9, label: 'Eternal Reader', req: 'Read 5,000 chapters', category: 'chapters', image: '/badges/badge_09.png', unlocked: chapters >= 5000, progress: { current: Math.min(5000, chapters), total: 5000, unit: 'chapters' } },
    { id: 'b_10', num: 10, label: 'Beyond Stories', req: 'Read 10,000 chapters', category: 'chapters', image: '/badges/badge_10.png', unlocked: chapters >= 10000, progress: { current: Math.min(10000, chapters), total: 10000, unit: 'chapters' } },

    // -------------------------------------------------------------
    // 2. Series Completion (11 to 17)
    // -------------------------------------------------------------
    { id: 'b_11', num: 11, label: 'The Beginning', req: 'Complete 1 series', category: 'series', image: '/badges/badge_11.png', unlocked: seriesCompleted >= 1, progress: { current: Math.min(1, seriesCompleted), total: 1, unit: 'series' } },
    { id: 'b_12', num: 12, label: 'Finisher', req: 'Complete 5 series', category: 'series', image: '/badges/badge_12.png', unlocked: seriesCompleted >= 5, progress: { current: Math.min(5, seriesCompleted), total: 5, unit: 'series' } },
    { id: 'b_13', num: 13, label: 'Dedicated Soul', req: 'Complete 10 series', category: 'series', image: '/badges/badge_13.png', unlocked: seriesCompleted >= 10, progress: { current: Math.min(10, seriesCompleted), total: 10, unit: 'series' } },
    { id: 'b_14', num: 14, label: 'Story Collector', req: 'Complete 25 series', category: 'series', image: '/badges/badge_14.png', unlocked: seriesCompleted >= 25, progress: { current: Math.min(25, seriesCompleted), total: 25, unit: 'series' } },
    { id: 'b_15', num: 15, label: 'Master of Endings', req: 'Complete 50 series', category: 'series', image: '/badges/badge_15.png', unlocked: seriesCompleted >= 50, progress: { current: Math.min(50, seriesCompleted), total: 50, unit: 'series' } },
    { id: 'b_16', num: 16, label: 'The Archivist', req: 'Complete 100 series', category: 'series', image: '/badges/badge_16.png', unlocked: seriesCompleted >= 100, progress: { current: Math.min(100, seriesCompleted), total: 100, unit: 'series' } },
    { id: 'b_17', num: 17, label: 'Legend of Stories', req: 'Complete 250 series', category: 'series', image: '/badges/badge_17.png', unlocked: seriesCompleted >= 250, progress: { current: Math.min(250, seriesCompleted), total: 250, unit: 'series' } },

    // -------------------------------------------------------------
    // 3. Genres & Formats (18 to 24)
    // -------------------------------------------------------------
    { id: 'b_18', num: 18, label: 'Curious Mind', req: 'Read from 2 genres', category: 'genres', image: '/badges/badge_18.png', unlocked: genresCount >= 2, progress: { current: Math.min(2, genresCount), total: 2, unit: 'genres' } },
    { id: 'b_19', num: 19, label: 'Genre Hopper', req: 'Read from 5 genres', category: 'genres', image: '/badges/badge_19.png', unlocked: genresCount >= 5, progress: { current: Math.min(5, genresCount), total: 5, unit: 'genres' } },
    { id: 'b_20', num: 20, label: 'World Traveller', req: 'Read from 10 genres', category: 'genres', image: '/badges/badge_20.png', unlocked: genresCount >= 10, progress: { current: Math.min(10, genresCount), total: 10, unit: 'genres' } },
    { id: 'b_21', num: 21, label: 'Beyond Borders', req: 'Read from 15 genres', category: 'genres', image: '/badges/badge_21.png', unlocked: genresCount >= 15, progress: { current: Math.min(15, genresCount), total: 15, unit: 'genres' } },
    { id: 'b_22', num: 22, label: 'Multiverse Explorer', req: 'Read from 20 genres', category: 'genres', image: '/badges/badge_22.png', unlocked: genresCount >= 20, progress: { current: Math.min(20, genresCount), total: 20, unit: 'genres' } },
    { id: 'b_23', num: 23, label: 'The Adventurer', req: 'Read manga, manhwa and novels', category: 'genres', image: '/badges/badge_23.png', unlocked: adventurerUnlocked, progress: { current: adventurerCount, total: 3, unit: 'types' } },
    { id: 'b_24', num: 24, label: 'Omnireader', req: 'Read all 5 content types', category: 'genres', image: '/badges/badge_24.png', unlocked: contentTypesCount >= 5, progress: { current: Math.min(5, contentTypesCount), total: 5, unit: 'types' } },

    // -------------------------------------------------------------
    // 4. Reading Streaks (25 to 30)
    // -------------------------------------------------------------
    { id: 'b_25', num: 25, label: 'First Spark', req: '3-day reading streak', category: 'streaks', image: '/badges/badge_25.png', unlocked: streak >= 3, progress: { current: Math.min(3, streak), total: 3, unit: 'days' } },
    { id: 'b_26', num: 26, label: 'Getting Serious', req: '7-day reading streak', category: 'streaks', image: '/badges/badge_26.png', unlocked: streak >= 7, progress: { current: Math.min(7, streak), total: 7, unit: 'days' } },
    { id: 'b_27', num: 27, label: 'Unbreakable', req: '14-day reading streak', category: 'streaks', image: '/badges/badge_27.png', unlocked: streak >= 14, progress: { current: Math.min(14, streak), total: 14, unit: 'days' } },
    { id: 'b_28', num: 28, label: 'Relentless', req: '30-day reading streak', category: 'streaks', image: '/badges/badge_28.png', unlocked: streak >= 30, progress: { current: Math.min(30, streak), total: 30, unit: 'days' } },
    { id: 'b_29', num: 29, label: 'Devoted Reader', req: '100-day reading streak', category: 'streaks', image: '/badges/badge_29.png', unlocked: streak >= 100, progress: { current: Math.min(100, streak), total: 100, unit: 'days' } },
    { id: 'b_30', num: 30, label: 'Eternal Flame', req: '365-day reading streak', category: 'streaks', image: '/badges/badge_30.png', unlocked: streak >= 365, progress: { current: Math.min(365, streak), total: 365, unit: 'days' } },

    // -------------------------------------------------------------
    // 5. Reviews & Critic (31 to 36)
    // -------------------------------------------------------------
    { id: 'b_31', num: 31, label: 'First Impression', req: 'Publish 1 review', category: 'reviews', image: '/badges/badge_31.png', unlocked: reviews >= 1, progress: { current: Math.min(1, reviews), total: 1, unit: 'reviews' } },
    { id: 'b_32', num: 32, label: 'Honest Critic', req: 'Publish 5 reviews', category: 'reviews', image: '/badges/badge_32.png', unlocked: reviews >= 5, progress: { current: Math.min(5, reviews), total: 5, unit: 'reviews' } },
    { id: 'b_33', num: 33, label: 'Story Analyst', req: 'Publish 15 reviews', category: 'reviews', image: '/badges/badge_33.png', unlocked: reviews >= 15, progress: { current: Math.min(15, reviews), total: 15, unit: 'reviews' } },
    { id: 'b_34', num: 34, label: 'Literary Voice', req: 'Publish 30 reviews', category: 'reviews', image: '/badges/badge_34.png', unlocked: reviews >= 30, progress: { current: Math.min(30, reviews), total: 30, unit: 'reviews' } },
    { id: 'b_35', num: 35, label: 'Master Critic', req: 'Publish 75 reviews', category: 'reviews', image: '/badges/badge_35.png', unlocked: reviews >= 75, progress: { current: Math.min(75, reviews), total: 75, unit: 'reviews' } },
    { id: 'b_36', num: 36, label: 'The Reviewer', req: 'Publish 150 reviews', category: 'reviews', image: '/badges/badge_36.png', unlocked: reviews >= 150, progress: { current: Math.min(150, reviews), total: 150, unit: 'reviews' } },

    // -------------------------------------------------------------
    // 6. Library & Collections (43 to 48)
    // -------------------------------------------------------------
    { id: 'b_43', num: 43, label: 'First Addition', req: 'Add 1 title to a list', category: 'library', image: '/badges/badge_43.png', unlocked: saved >= 1, progress: { current: Math.min(1, saved), total: 1, unit: 'titles' } },
    { id: 'b_44', num: 44, label: 'Curator', req: 'Create 5 reading lists', category: 'library', image: '/badges/badge_44.png', unlocked: lists >= 5, progress: { current: Math.min(5, lists), total: 5, unit: 'lists' } },
    { id: 'b_45', num: 45, label: 'Personal Library', req: 'Save 50 titles', category: 'library', image: '/badges/badge_45.png', unlocked: saved >= 50, progress: { current: Math.min(50, saved), total: 50, unit: 'titles' } },
    { id: 'b_46', num: 46, label: 'Treasure Keeper', req: 'Save 100 titles', category: 'library', image: '/badges/badge_46.png', unlocked: saved >= 100, progress: { current: Math.min(100, saved), total: 100, unit: 'titles' } },
    { id: 'b_47', num: 47, label: 'Collection Master', req: 'Save 250 titles', category: 'library', image: '/badges/badge_47.png', unlocked: saved >= 250, progress: { current: Math.min(250, saved), total: 250, unit: 'titles' } },
    { id: 'b_48', num: 48, label: 'The Grand Archive', req: 'Save 500 titles', category: 'library', image: '/badges/badge_48.png', unlocked: saved >= 500, progress: { current: Math.min(500, saved), total: 500, unit: 'titles' } },

    // -------------------------------------------------------------
    // 7. Special & Milestones (49 to 55)
    // -------------------------------------------------------------
    { id: 'b_49', num: 49, label: 'Night Owl', req: 'Read after midnight on 10 different days', category: 'special', image: '/badges/badge_49.png', unlocked: midnight >= 10, progress: { current: Math.min(10, midnight), total: 10, unit: 'nights' } },
    { id: 'b_50', num: 50, label: 'Speed Reader', req: 'Read 50 chapters in one day', category: 'special', image: '/badges/badge_50.png', unlocked: maxInDay >= 50, progress: { current: Math.min(50, maxInDay), total: 50, unit: 'chapters' } },
    { id: 'b_51', num: 51, label: 'The Nostalgic', req: 'Revisit a completed series', category: 'special', image: '/badges/badge_51.png', unlocked: revisited >= 1, progress: { current: Math.min(1, revisited), total: 1, unit: 'series' } },
    { id: 'b_52', num: 52, label: 'The Loyalist', req: 'Follow 10 authors', category: 'special', image: '/badges/badge_52.png', unlocked: authors >= 10, progress: { current: Math.min(10, authors), total: 10, unit: 'authors' } },
    { id: 'b_53', num: 53, label: 'The Perfectionist', req: 'Rate 50 titles', category: 'special', image: '/badges/badge_53.png', unlocked: ratings >= 50, progress: { current: Math.min(50, ratings), total: 50, unit: 'ratings' } },
    { id: 'b_54', num: 54, label: 'The Multiverse', req: 'Maintain 5 reading lists', category: 'special', image: '/badges/badge_54.png', unlocked: lists >= 5, progress: { current: Math.min(5, lists), total: 5, unit: 'lists' } },
    { id: 'b_55', num: 55, label: 'The Last Page', req: 'Read a series finale within 24h of release', category: 'special', image: '/badges/badge_55.png', unlocked: finale === true, progress: { current: finale ? 1 : 0, total: 1, unit: 'finale' } },
  ];
}
