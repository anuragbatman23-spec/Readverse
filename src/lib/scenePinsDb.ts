import fs from 'fs';
import path from 'path';
import { findUserByEmail, findUserById } from './userDb';
import { getStorageObject, setStorageObject } from './d1Client';

export interface ScenePinComment {
  id: string;
  author: string;
  text: string;
  likes: number;
  likedBy?: string[];
  isLiked?: boolean;
  avatarColor?: string;
  avatarUrl?: string;
  createdAt: string;
  userEmail?: string;
  userId?: string;
}

export interface ScenePinSpot {
  id: string;
  panelIndex: number;
  yPercent: number; // 0 to 100%
  comments: ScenePinComment[];
}

const DATA_DIR = path.join(process.cwd(), 'local-data');
const SCENE_PINS_FILE = path.join(DATA_DIR, 'scene_pins.json');

function ensureStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCENE_PINS_FILE)) {
      fs.writeFileSync(SCENE_PINS_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to ensure scene pins storage:', err);
  }
}

let memoryPins: Record<string, ScenePinSpot[]> | null = null;

export async function syncScenePinsFromD1(): Promise<Record<string, ScenePinSpot[]>> {
  try {
    const data = await getStorageObject<Record<string, ScenePinSpot[]>>('scene_pins');
    if (data && typeof data === 'object') {
      memoryPins = data;
    }
  } catch (err) {
    console.warn('[scenePinsDb] D1 sync error:', err);
  }
  return memoryPins || {};
}

if (typeof window === 'undefined') {
  syncScenePinsFromD1().catch(() => {});
}

function readAllPins(): Record<string, ScenePinSpot[]> {
  if (memoryPins) return memoryPins;
  ensureStorage();
  try {
    if (fs.existsSync(SCENE_PINS_FILE)) {
      const raw = fs.readFileSync(SCENE_PINS_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      if (parsed && typeof parsed === 'object') {
        memoryPins = parsed;
        return parsed;
      }
    }
  } catch (err) {
    //
  }

  // Trigger lazy background fetch from D1
  getStorageObject<Record<string, ScenePinSpot[]>>('scene_pins').then((data) => {
    if (data && typeof data === 'object') {
      memoryPins = data;
    }
  }).catch(() => {});

  memoryPins = {};
  return {};
}

function writeAllPins(data: Record<string, ScenePinSpot[]>): void {
  memoryPins = data;
  try {
    ensureStorage();
    const tempFile = `${SCENE_PINS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, SCENE_PINS_FILE);
  } catch (err) {
    // Read-only filesystem in Vercel
  }

  setStorageObject('scene_pins', data).catch((err) => {
    console.error('[scenePinsDb] Failed writing to D1:', err);
  });
}

function makeStorageMapKey(bookId: string, chapterKey: string): string {
  const safeBook = (bookId || 'unknown_book').trim().toLowerCase();
  const safeCh = (chapterKey || 'idx_0').trim();
  return `${safeBook}:::${safeCh}`;
}

/**
 * Get scene pins for a specific book and chapter, decorated with isLiked state and resolved avatarUrl.
 */
export function getScenePins(bookId: string, chapterKey: string, userEmail?: string): ScenePinSpot[] {
  const mapKey = makeStorageMapKey(bookId, chapterKey);
  const allData = readAllPins();
  const spots = allData[mapKey] || [];

  return spots.map(spot => ({
    ...spot,
    comments: spot.comments.map(c => {
      let resolvedAvatar = c.avatarUrl;
      if (!resolvedAvatar && c.userEmail) {
        const u = findUserByEmail(c.userEmail);
        if (u?.image) resolvedAvatar = u.image;
      }
      return {
        ...c,
        avatarUrl: resolvedAvatar || undefined,
        isLiked: Boolean(userEmail && c.likedBy?.includes(userEmail))
      };
    })
  }));
}

/**
 * Add a new comment to an existing spot or create a new spot.
 */
export function addCommentToSpot(params: {
  bookId: string;
  chapterKey: string;
  panelIndex: number;
  yPercent: number;
  text: string;
  author: string;
  avatarUrl?: string;
  userEmail?: string;
  userId?: string;
}): { spot: ScenePinSpot; allSpots: ScenePinSpot[] } {
  const { bookId, chapterKey, panelIndex, yPercent, text, author, userEmail, userId } = params;
  let { avatarUrl } = params;

  if (!avatarUrl && userEmail) {
    const u = findUserByEmail(userEmail) || findUserById(userEmail);
    if (u?.image) avatarUrl = u.image;
  }

  const mapKey = makeStorageMapKey(bookId, chapterKey);
  const allData = readAllPins();
  const currentSpots = allData[mapKey] || [];

  const newComment: ScenePinComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author: author || 'reader',
    avatarUrl: avatarUrl || undefined,
    text: text.trim(),
    likes: 1,
    likedBy: userEmail ? [userEmail] : ['self'],
    isLiked: true,
    createdAt: 'Just now',
    userEmail,
    userId
  };

  // Find existing spot on same panel within 4% of yPercent
  const existingSpotIndex = currentSpots.findIndex(
    p => p.panelIndex === panelIndex && Math.abs(p.yPercent - yPercent) < 4
  );

  let targetSpot: ScenePinSpot;
  let updatedSpots: ScenePinSpot[];

  if (existingSpotIndex !== -1) {
    const existing = currentSpots[existingSpotIndex];
    targetSpot = {
      ...existing,
      comments: [newComment, ...existing.comments]
    };
    updatedSpots = [...currentSpots];
    updatedSpots[existingSpotIndex] = targetSpot;
  } else {
    targetSpot = {
      id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      panelIndex,
      yPercent,
      comments: [newComment]
    };
    updatedSpots = [...currentSpots, targetSpot];
  }

  allData[mapKey] = updatedSpots;
  writeAllPins(allData);

  return {
    spot: targetSpot,
    allSpots: updatedSpots.map(s => ({
      ...s,
      comments: s.comments.map(c => ({
        ...c,
        isLiked: Boolean(userEmail && c.likedBy?.includes(userEmail))
      }))
    }))
  };
}

/**
 * Toggle like on a comment within a spot.
 */
export function toggleLikeComment(params: {
  bookId: string;
  chapterKey: string;
  spotId: string;
  commentId: string;
  userEmail?: string;
}): { spot?: ScenePinSpot; allSpots: ScenePinSpot[] } {
  const { bookId, chapterKey, spotId, commentId, userEmail } = params;
  const mapKey = makeStorageMapKey(bookId, chapterKey);
  const allData = readAllPins();
  const currentSpots = allData[mapKey] || [];

  const identifier = userEmail || 'guest';
  let targetSpot: ScenePinSpot | undefined;

  const updatedSpots = currentSpots.map(spot => {
    if (spot.id !== spotId) return spot;

    const updatedComments = spot.comments.map(c => {
      if (c.id !== commentId) return c;

      const currentLikedBy = c.likedBy || [];
      const alreadyLiked = currentLikedBy.includes(identifier);
      const newLikedBy = alreadyLiked
        ? currentLikedBy.filter(id => id !== identifier)
        : [...currentLikedBy, identifier];

      const newLikes = alreadyLiked ? Math.max(0, c.likes - 1) : c.likes + 1;

      return {
        ...c,
        likes: newLikes,
        likedBy: newLikedBy,
        isLiked: !alreadyLiked
      };
    });

    targetSpot = { ...spot, comments: updatedComments };
    return targetSpot;
  });

  allData[mapKey] = updatedSpots;
  writeAllPins(allData);

  return {
    spot: targetSpot,
    allSpots: updatedSpots.map(s => ({
      ...s,
      comments: s.comments.map(c => ({
        ...c,
        isLiked: Boolean(userEmail && c.likedBy?.includes(userEmail))
      }))
    }))
  };
}
