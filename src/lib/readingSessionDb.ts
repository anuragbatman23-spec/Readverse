import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ContentCategory } from '@/types';
import { findUserByEmail, findUserById, updateUserStats } from './userDb';
import { recordBadgeEvent } from './badgeManager';
import { getStorageObject, setStorageObject } from './d1Client';

export interface ReadingSession {
  id: string;
  userId: string;
  userEmail: string;
  bookId: string;
  chapterId: string;
  chapterTitle?: string;
  category: ContentCategory;
  pageCount?: number;
  wordCount?: number;
  startedAt: number;
  totalExpectedSeconds: number;
  requiredPercentage: number;
  minRequiredSeconds: number;
  sessionToken: string;
  status: 'active' | 'completed' | 'invalidated';
  claimedAt?: number;
}

export interface ChapterClaimRecord {
  id: string;
  userId: string;
  userEmail: string;
  bookId: string;
  chapterId: string;
  category: ContentCategory;
  pointsAwarded: number;
  readingSeconds: number;
  claimedAt: string;
}

export interface InteractionProof {
  activeReadingSeconds: number;
  qualifiedFocusSeconds?: number;
  coveragePercent?: number;
  scrollDepthPercent?: number;
  pagesTurned?: number;
  interactionCount: number;
  totalChunksEncountered?: number;
  calculatedRequiredSeconds?: number;
  verifiedSlicesCount?: number;
  totalChapterSlices?: number;
  verifiedWords?: number;
  totalChapterWords?: number;
}

const DATA_DIR = path.join(process.cwd(), 'local-data');
const SESSIONS_FILE = path.join(DATA_DIR, 'reading_sessions.json');
const CLAIMS_FILE = path.join(DATA_DIR, 'chapter_claims.json');

const SECRET_SALT = process.env.NEXTAUTH_SECRET || 'readverse-anti-cheat-secret-key-2026';

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(CLAIMS_FILE)) {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

let memorySessions: ReadingSession[] | null = null;
let memoryClaims: ChapterClaimRecord[] | null = null;

export async function syncReadingSessionsFromD1(): Promise<void> {
  try {
    const [sess, claims] = await Promise.all([
      getStorageObject<ReadingSession[]>('reading_sessions'),
      getStorageObject<ChapterClaimRecord[]>('chapter_claims')
    ]);
    if (sess && Array.isArray(sess)) memorySessions = sess;
    if (claims && Array.isArray(claims)) memoryClaims = claims;
  } catch (err) {
    console.warn('[readingSessionDb] D1 sync warning:', err);
  }
}

if (typeof window === 'undefined') {
  syncReadingSessionsFromD1().catch(() => {});
}

function getAllSessions(): ReadingSession[] {
  if (memorySessions) return memorySessions;
  try {
    ensureStorage();
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) {
        memorySessions = parsed;
        return parsed;
      }
    }
  } catch (err) {
    //
  }

  getStorageObject<ReadingSession[]>('reading_sessions').then((res) => {
    if (res && Array.isArray(res)) memorySessions = res;
  }).catch(() => {});

  memorySessions = [];
  return [];
}

function saveSessions(sessions: ReadingSession[]) {
  const trimmed = sessions.slice(-1000); // keep recent 1000 sessions
  memorySessions = trimmed;
  try {
    ensureStorage();
    const tmp = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2), 'utf-8');
    fs.renameSync(tmp, SESSIONS_FILE);
  } catch (err) {
    // Read-only filesystem in Vercel
  }
  setStorageObject('reading_sessions', trimmed).catch((err) => {
    console.error('[readingSessionDb] D1 saveSessions failed:', err);
  });
}

export function getAllClaims(): ChapterClaimRecord[] {
  if (memoryClaims) return memoryClaims;
  try {
    ensureStorage();
    if (fs.existsSync(CLAIMS_FILE)) {
      const raw = fs.readFileSync(CLAIMS_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) {
        memoryClaims = parsed;
        return parsed;
      }
    }
  } catch (err) {
    //
  }

  getStorageObject<ChapterClaimRecord[]>('chapter_claims').then((res) => {
    if (res && Array.isArray(res)) memoryClaims = res;
  }).catch(() => {});

  memoryClaims = [];
  return [];
}

function saveClaims(claims: ChapterClaimRecord[]) {
  memoryClaims = claims;
  try {
    ensureStorage();
    const tmp = `${CLAIMS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(claims, null, 2), 'utf-8');
    fs.renameSync(tmp, CLAIMS_FILE);
  } catch (err) {
    // Read-only filesystem in Vercel
  }
  setStorageObject('chapter_claims', claims).catch((err) => {
    console.error('[readingSessionDb] D1 saveClaims failed:', err);
  });
}

function generateSignature(sessionId: string, userId: string, startedAt: number, bookId: string, chapterId: string): string {
  return crypto
    .createHmac('sha256', SECRET_SALT)
    .update(`${sessionId}:${userId}:${startedAt}:${bookId}:${chapterId}`)
    .digest('hex');
}

/**
 * Check if user already claimed points for this specific chapter.
 */
export function hasUserClaimedChapter(userEmailOrId: string, bookId: string, chapterId: string): boolean {
  if (!userEmailOrId || !bookId || chapterId === undefined || chapterId === null) return false;
  const claims = getAllClaims();
  const normUser = userEmailOrId.toLowerCase().trim();
  const normBook = String(bookId).trim();
  const normChap = String(chapterId).trim();

  return claims.some(c => 
    (c.userEmail.toLowerCase() === normUser || c.userId === userEmailOrId) &&
    String(c.bookId).trim() === normBook &&
    String(c.chapterId).trim() === normChap
  );
}

export interface ReadingDurationTarget {
  totalExpectedSeconds: number;
  requiredPercentage: number;
  minRequiredSeconds: number;
}

/**
 * Calculates reading duration targets based on content length:
 * - 100% of expected reading time is required for both Manga and Manhwa.
 * - Manhwa: ~1.5s per panel/slice for visual illustration reading pace.
 * - Manga: ~3.0s per page for panel layout, dialogue bubbles, and text density.
 */
export function calculateExpectedReadingDuration(
  category: ContentCategory,
  pageCount?: number,
  wordCount?: number
): ReadingDurationTarget {
  if (category === 'manhwa') {
    // Manhwa: Skip first panel count because it generally contains previous story recap or drawings
    const rawPanels = pageCount && pageCount > 0 ? pageCount : 30;
    const panels = rawPanels > 1 ? rawPanels - 1 : rawPanels;
    const totalExpectedSeconds = Math.max(30, Math.round(panels * 1.5));
    const requiredPercentage = 100; // 100% requirement for manhwa
    const minRequiredSeconds = totalExpectedSeconds;
    return { totalExpectedSeconds, requiredPercentage, minRequiredSeconds };
  }

  if (category === 'manga') {
    // Manga: Skip first and last page count (cover / credits / promo)
    // 1.8s per 33% slice (~3.6s per page to absorb panel layouts and dialogue bubbles)
    const rawPages = pageCount && pageCount > 0 ? pageCount : 15;
    const pages = rawPages > 2 ? rawPages - 2 : rawPages > 1 ? rawPages - 1 : rawPages;
    const totalExpectedSeconds = Math.max(30, Math.round(pages * 3.6));
    const requiredPercentage = 100; // 100% requirement for manga
    const minRequiredSeconds = totalExpectedSeconds;
    return { totalExpectedSeconds, requiredPercentage, minRequiredSeconds };
  }

  // Novels & books: 150 WPM standard reading pace (2.5 words per second)
  const words = wordCount && wordCount > 0 ? wordCount : 1500;
  const totalExpectedSeconds = Math.max(30, Math.round((words / 150) * 60));
  const requiredPercentage = 100;
  const minRequiredSeconds = totalExpectedSeconds;
  return { totalExpectedSeconds, requiredPercentage, minRequiredSeconds };
}

/**
 * Starts a new validated reading session.
 */
export function startReadingSession(params: {
  userId: string;
  userEmail: string;
  bookId: string;
  chapterId: string;
  chapterTitle?: string;
  category: ContentCategory;
  pageCount?: number;
  wordCount?: number;
}): {
  sessionId: string;
  sessionToken: string;
  totalExpectedSeconds: number;
  requiredPercentage: number;
  minRequiredSeconds: number;
  startedAt: number;
  isAlreadyClaimed: boolean;
} {
  const { userId, userEmail, bookId, chapterId, chapterTitle, category, pageCount, wordCount } = params;

  const effectivePageCount = category === 'manga' && pageCount && pageCount > 2
    ? pageCount - 2
    : category === 'manga' && pageCount && pageCount > 1
    ? pageCount - 1
    : category === 'manhwa' && pageCount && pageCount > 1
    ? pageCount - 1
    : pageCount;

  const isAlreadyClaimed = hasUserClaimedChapter(userEmail, bookId, chapterId);
  const { totalExpectedSeconds, requiredPercentage, minRequiredSeconds } = calculateExpectedReadingDuration(
    category,
    effectivePageCount,
    wordCount
  );
  const startedAt = Date.now();
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const sessionToken = generateSignature(sessionId, userId, startedAt, bookId, chapterId);

  const session: ReadingSession = {
    id: sessionId,
    userId,
    userEmail,
    bookId,
    chapterId: String(chapterId),
    chapterTitle,
    category,
    pageCount: effectivePageCount,
    wordCount,
    startedAt,
    totalExpectedSeconds,
    requiredPercentage,
    minRequiredSeconds,
    sessionToken,
    status: 'active'
  };

  const sessions = getAllSessions();
  sessions.push(session);
  saveSessions(sessions);

  return {
    sessionId,
    sessionToken,
    totalExpectedSeconds,
    requiredPercentage,
    minRequiredSeconds,
    startedAt,
    isAlreadyClaimed
  };
}

/**
 * Verify reading session proof and claim points.
 */
export function verifyAndClaimReadingSession(params: {
  userId: string;
  userEmail: string;
  sessionId: string;
  sessionToken: string;
  proof: InteractionProof;
  customPoints?: number;
}): {
  success: boolean;
  code?: string;
  error?: string;
  pointsAwarded?: number;
  stats?: Record<string, unknown>;
} {
  const { userId, userEmail, sessionId, sessionToken, proof, customPoints } = params;

  // 1. Session lookup
  const sessions = getAllSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex === -1) {
    return { success: false, code: 'SESSION_NOT_FOUND', error: 'Reading session not found or expired. Please reload the chapter.' };
  }

  const session = sessions[sessionIndex];

  // 2. Token authenticity
  const expectedSig = generateSignature(session.id, session.userId, session.startedAt, session.bookId, session.chapterId);
  if (sessionToken !== expectedSig) {
    return { success: false, code: 'INVALID_SIGNATURE', error: 'Tampered session token detected.' };
  }

  // 3. User verification
  if (session.userId !== userId && session.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
    return { success: false, code: 'USER_MISMATCH', error: 'Session does not belong to the active user.' };
  }

  // 4. Session status check
  if (session.status === 'completed') {
    return { success: false, code: 'ALREADY_CLAIMED_SESSION', error: 'Points for this session have already been claimed.' };
  }

  // 5. Anti-farming: Check if chapter was already rewarded in previous sessions
  if (hasUserClaimedChapter(userEmail, session.bookId, session.chapterId)) {
    return { success: false, code: 'ALREADY_REWARDED', error: 'Points for this chapter have already been awarded to your account.' };
  }

  // 6. Dynamic Content-Proportional Verification (1.2s per 50% slice for manhwa, 1.8s per 33% slice for manga)
  const now = Date.now();
  const serverElapsedSeconds = Math.max(1, Math.floor((now - session.startedAt) / 1000));
  // Anti-cheat verification turned off: reward points directly without artificial delays or blocks

  // 8. Calculate points to award
  const user = findUserByEmail(userEmail) || findUserById(userId);
  if (!user) {
    return { success: false, code: 'USER_NOT_FOUND', error: 'User account not found.' };
  }

  // Base points determination
  let basePoints = customPoints || 1.0;
  if (!customPoints) {
    if (session.category === 'manhwa') basePoints = 1.5;
    else if (session.category === 'manga') basePoints = 1.0;
    else if (session.category === 'webnovel' || session.category === 'lightnovel' || session.category === 'book') basePoints = 2.0;
  }

  // Check 2x boost if user currently has one active
  // userDb doesn't store boostExpiresAt directly, but we can credit base or check if provided
  const pointsAwarded = basePoints;

  // 9. Update user stats in DB
  const readingMinutes = Math.max(1, Math.round(serverElapsedSeconds / 60));
  const updatedUser = updateUserStats(user.id, {
    pointsDelta: pointsAwarded,
    chaptersReadDelta: 1,
    minutesDelta: readingMinutes
  });

  if (!updatedUser) {
    return { success: false, code: 'STATS_UPDATE_FAILED', error: 'Failed to update user rewards.' };
  }

  // 10. Record chapter claim in claims DB
  const claimRecord: ChapterClaimRecord = {
    id: `claim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    userEmail: user.email,
    bookId: session.bookId,
    chapterId: session.chapterId,
    category: session.category,
    pointsAwarded,
    readingSeconds: serverElapsedSeconds,
    claimedAt: new Date().toISOString()
  };

  const claims = getAllClaims();
  claims.push(claimRecord);
  saveClaims(claims);

  // 11. Mark session as completed
  sessions[sessionIndex].status = 'completed';
  sessions[sessionIndex].claimedAt = now;
  saveSessions(sessions);

  // 12. Record badge progress
  try {
    recordBadgeEvent(user.email, {
      type: 'read_chapter',
      category: session.category,
      seriesId: session.bookId
    });
  } catch (badgeErr) {
    console.warn('Failed recording badge event for session claim:', badgeErr);
  }

  return {
    success: true,
    pointsAwarded,
    stats: {
      points: updatedUser.points,
      totalChaptersRead: updatedUser.totalChaptersRead,
      readingMinutes: updatedUser.readingMinutes,
      currentStreakDays: updatedUser.currentStreakDays
    }
  };
}
