import { StoredUser, findUserByEmail, findUserById, updateUser } from './userDb';
import {
  UserBadgeProgress,
  BadgeItem,
  BadgeEvent,
  getDefaultBadgeProgress,
  evaluateAllBadges
} from '../data/badgeDefinitions';

export {
  type UserBadgeProgress,
  type BadgeItem,
  type BadgeEvent,
  getDefaultBadgeProgress,
  evaluateAllBadges
};

export function evaluateBadges(user: StoredUser): BadgeItem[] {
  return evaluateAllBadges(
    {
      points: user.points || 0,
      totalChaptersRead: user.totalChaptersRead || 0,
      totalWordsRead: user.totalWordsRead || 0,
      readingMinutes: user.readingMinutes || 0,
      currentStreakDays: user.currentStreakDays || 1,
    },
    user.badgeProgress
  );
}

// Function to process events, update user badge progress, and compute unlocked badges
export function recordBadgeEvent(
  emailOrId: string,
  event: BadgeEvent
): { user: StoredUser; newlyUnlocked: string[] } | null {
  const user = findUserByEmail(emailOrId) || findUserById(emailOrId);
  if (!user) return null;

  const currentProgress: UserBadgeProgress = {
    ...getDefaultBadgeProgress(user.badgeProgress),
    totalChaptersRead: user.totalChaptersRead || 0,
    currentStreakDays: user.currentStreakDays || 1,
    ...(user.badgeProgress || {})
  };

  const oldUnlocked = new Set(user.unlockedBadges || []);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  switch (event.type) {
    case 'read_chapter': {
      // 1. Increment total chapters
      currentProgress.totalChaptersRead = (currentProgress.totalChaptersRead || 0) + 1;

      // 2. Track daily chapters & streaks
      if (currentProgress.lastReadDate === todayStr) {
        currentProgress.todayChaptersCount = (currentProgress.todayChaptersCount || 0) + 1;
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (currentProgress.lastReadDate === yesterday) {
          currentProgress.currentStreakDays = (currentProgress.currentStreakDays || 1) + 1;
        } else if (currentProgress.lastReadDate) {
          currentProgress.currentStreakDays = 1;
        }
        currentProgress.lastReadDate = todayStr;
        currentProgress.todayChaptersCount = 1;
      }
      currentProgress.maxChaptersInOneDay = Math.max(
        currentProgress.maxChaptersInOneDay || 0,
        currentProgress.todayChaptersCount
      );

      // 3. Track night owl reading (midnight to 4am)
      if (currentHour >= 0 && currentHour < 5) {
        if (currentProgress.lastMidnightReadDate !== todayStr) {
          currentProgress.midnightReadCount = (currentProgress.midnightReadCount || 0) + 1;
          currentProgress.lastMidnightReadDate = todayStr;
        }
      }

      // 4. Content Category & Genre
      if (event.category) {
        const normCat = event.category.toLowerCase().trim();
        if (normCat && !currentProgress.readContentTypes.includes(normCat)) {
          currentProgress.readContentTypes.push(normCat);
        }
      }
      if (event.genre) {
        const rawGenres = Array.isArray(event.genre)
          ? event.genre
          : String(event.genre).split(',').map(g => g.trim()).filter(Boolean);
        for (const g of rawGenres) {
          const cleanG = g.trim();
          if (cleanG && !currentProgress.readGenres.includes(cleanG)) {
            currentProgress.readGenres.push(cleanG);
          }
        }
      }

      // 5. Special events: series revisit or finale
      if (event.seriesId && currentProgress.completedSeriesIds?.includes(event.seriesId)) {
        currentProgress.revisitedCompletedCount = (currentProgress.revisitedCompletedCount || 0) + 1;
      } else if (event.isRevisit) {
        currentProgress.revisitedCompletedCount = (currentProgress.revisitedCompletedCount || 0) + 1;
      }
      if (event.isFinale) {
        currentProgress.finaleReadWithin24h = true;
      }
      break;
    }

    case 'complete_series': {
      if (!currentProgress.completedSeriesIds.includes(event.seriesId)) {
        currentProgress.completedSeriesIds.push(event.seriesId);
        currentProgress.completedSeriesCount = currentProgress.completedSeriesIds.length;
      }
      break;
    }

    case 'rate_title': {
      currentProgress.ratedTitlesCount = (currentProgress.ratedTitlesCount || 0) + 1;
      break;
    }

    case 'publish_review': {
      currentProgress.reviewsCount = (currentProgress.reviewsCount || 0) + 1;
      break;
    }

    case 'add_to_readlist': {
      const readlistLen = (user.readlist || []).length;
      currentProgress.savedTitlesCount = Math.max(readlistLen, event.totalSaved || (currentProgress.savedTitlesCount + 1));
      break;
    }

    case 'create_reading_list': {
      currentProgress.readingListsCount = (currentProgress.readingListsCount || 0) + 1;
      break;
    }

    case 'follow_author': {
      currentProgress.followedAuthorsCount = (currentProgress.followedAuthorsCount || 0) + 1;
      break;
    }
  }

  // Evaluate all badges with newly updated progress
  const tempUser: StoredUser = {
    ...user,
    totalChaptersRead: currentProgress.totalChaptersRead,
    currentStreakDays: currentProgress.currentStreakDays,
    badgeProgress: currentProgress,
  };

  const evaluated = evaluateBadges(tempUser);
  const nowUnlockedIds = evaluated.filter(b => b.unlocked).map(b => b.id);

  // Determine newly unlocked badges
  const newlyUnlocked = nowUnlockedIds.filter(id => !oldUnlocked.has(id));

  // Persist to user record in users.json
  const updated = updateUser(user.id, {
    totalChaptersRead: currentProgress.totalChaptersRead,
    currentStreakDays: currentProgress.currentStreakDays,
    badgeProgress: currentProgress,
    unlockedBadges: nowUnlockedIds,
  });

  return {
    user: updated || tempUser,
    newlyUnlocked,
  };
}
