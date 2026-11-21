import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getStorageObject, setStorageObject } from './d1Client';

export interface RecentlyReadItem {
  bookId: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  chapterIndex: number;
  chapterTitle?: string;
  lastReadAt: string;
  progressPercent?: number;
  rating?: number;
}

export interface ReadlistItem {
  bookId: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  rating?: number;
  addedAt: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  bannerImage?: string;
  provider: 'credentials' | 'google';
  points: number;
  totalChaptersRead: number;
  totalWordsRead: number;
  readingMinutes: number;
  currentStreakDays: number;
  recentlyRead?: RecentlyReadItem[];
  readlist?: ReadlistItem[];
  badgeProgress?: any;
  unlockedBadges?: string[];
  overviewBg?: string;
  overviewBgSource?: string;
  overviewAccent?: string;
  mangaTheme?: string;
  manhwaTheme?: string;
  novelTheme?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'local-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// In-memory cache for ultra-fast synchronous reads & instant response
let memoryUsers: StoredUser[] | null = null;
let isSyncingUsers = false;

// Ensure storage directory and file exist (local dev)
function ensureStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    // Read-only filesystem in cloud environments (Vercel)
  }
}

function loadInitialUsers(): StoredUser[] {
  if (memoryUsers && memoryUsers.length > 0) return memoryUsers;
  try {
    ensureStorage();
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return memoryUsers;
      }
    }
  } catch (error) {
    // Ignore read error on serverless
  }
  memoryUsers = memoryUsers || [];
  return memoryUsers;
}

// Synchronize users from Cloudflare D1
export async function syncUsersFromD1(): Promise<StoredUser[]> {
  if (isSyncingUsers) return memoryUsers || [];
  isSyncingUsers = true;
  try {
    const d1Users = await getStorageObject<StoredUser[]>('users');
    if (d1Users && Array.isArray(d1Users) && d1Users.length > 0) {
      memoryUsers = d1Users;
    }
  } catch (err) {
    console.warn('[userDb] D1 users sync notice:', err);
  } finally {
    isSyncingUsers = false;
  }
  return memoryUsers || [];
}

// Preload users on module load
if (typeof window === 'undefined') {
  loadInitialUsers();
  syncUsersFromD1().catch(() => {});
}

export function getAllUsers(): StoredUser[] {
  if (!memoryUsers || memoryUsers.length === 0) {
    loadInitialUsers();
  }
  return memoryUsers || [];
}

export async function getAllUsersAsync(): Promise<StoredUser[]> {
  if (!memoryUsers || memoryUsers.length === 0) {
    await syncUsersFromD1();
  }
  return getAllUsers();
}

function saveUsers(users: StoredUser[]): void {
  memoryUsers = users;

  // 1. Try local filesystem (for local dev)
  try {
    ensureStorage();
    const tmpFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tmpFile, USERS_FILE);
  } catch (err) {
    // Read-only in Vercel - safely handled
  }

  // 2. Persist to Cloudflare D1
  setStorageObject('users', users).catch((err) => {
    console.error('[userDb] Failed to persist users to D1:', err);
  });
}

export function findUserByEmail(email: string): StoredUser | null {
  const users = getAllUsers();
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserByEmailAsync(email: string): Promise<StoredUser | null> {
  const syncUser = findUserByEmail(email);
  if (syncUser) return syncUser;

  const fresh = await syncUsersFromD1();
  const normalized = email.toLowerCase().trim();
  return fresh.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id: string): StoredUser | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export async function findUserByIdAsync(id: string): Promise<StoredUser | null> {
  const syncUser = findUserById(id);
  if (syncUser) return syncUser;

  const fresh = await syncUsersFromD1();
  return fresh.find((u) => u.id === id) || null;
}

export function findUserByAny(query: string): StoredUser | null {
  if (!query) return null;
  const users = getAllUsers();
  const normalized = query.toLowerCase().trim();
  return (
    users.find((u) => u.email.toLowerCase() === normalized) ||
    users.find((u) => u.id.toLowerCase() === normalized) ||
    users.find((u) => u.name.toLowerCase() === normalized) ||
    users.find((u) => u.email.split('@')[0].toLowerCase() === normalized) ||
    null
  );
}

export async function findUserByAnyAsync(query: string): Promise<StoredUser | null> {
  const syncUser = findUserByAny(query);
  if (syncUser) return syncUser;

  const fresh = await syncUsersFromD1();
  const normalized = query.toLowerCase().trim();
  return (
    fresh.find((u) => u.email.toLowerCase() === normalized) ||
    fresh.find((u) => u.id.toLowerCase() === normalized) ||
    fresh.find((u) => u.name.toLowerCase() === normalized) ||
    fresh.find((u) => u.email.split('@')[0].toLowerCase() === normalized) ||
    null
  );
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function createUser(data: {
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  provider?: 'credentials' | 'google';
}): StoredUser {
  const users = getAllUsers();
  const normalizedEmail = data.email.toLowerCase().trim();

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim() || 'Reader',
    email: normalizedEmail,
    passwordHash: data.passwordHash,
    image: data.image || '',
    provider: data.provider || 'credentials',
    points: 0,
    totalChaptersRead: 0,
    totalWordsRead: 0,
    readingMinutes: 0,
    currentStreakDays: 1,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
}

export function updateUserByEmailOrId(emailOrId: string, updates: Partial<StoredUser>): StoredUser | null {
  const users = getAllUsers();
  const normalized = emailOrId.toLowerCase().trim();
  const index = users.findIndex((u) => u.id === emailOrId || u.email.toLowerCase() === normalized);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
}

export function getUserStats(emailOrId: string) {
  const user = findUserByEmail(emailOrId) || findUserById(emailOrId) || findUserByAny(emailOrId);
  if (!user) return null;
  return {
    points: user.points ?? 0,
    totalChaptersRead: user.totalChaptersRead ?? 0,
    totalWordsRead: user.totalWordsRead ?? 0,
    readingMinutes: user.readingMinutes ?? 0,
    currentStreakDays: user.currentStreakDays ?? 1,
  };
}

export function updateUserStats(
  emailOrId: string,
  deltasOrValues: {
    pointsDelta?: number;
    points?: number;
    chaptersReadDelta?: number;
    totalChaptersRead?: number;
    wordsReadDelta?: number;
    totalWordsRead?: number;
    minutesDelta?: number;
    readingMinutes?: number;
    currentStreakDays?: number;
  }
): StoredUser | null {
  const user = findUserByEmail(emailOrId) || findUserById(emailOrId) || findUserByAny(emailOrId);
  if (!user) return null;

  const points = deltasOrValues.points !== undefined
    ? Math.max(0, deltasOrValues.points)
    : Math.max(0, (user.points || 0) + (deltasOrValues.pointsDelta || 0));

  const totalChaptersRead = deltasOrValues.totalChaptersRead !== undefined
    ? Math.max(0, deltasOrValues.totalChaptersRead)
    : Math.max(0, (user.totalChaptersRead || 0) + (deltasOrValues.chaptersReadDelta || 0));

  const totalWordsRead = deltasOrValues.totalWordsRead !== undefined
    ? Math.max(0, deltasOrValues.totalWordsRead)
    : Math.max(0, (user.totalWordsRead || 0) + (deltasOrValues.wordsReadDelta || 0));

  const readingMinutes = deltasOrValues.readingMinutes !== undefined
    ? Math.max(0, deltasOrValues.readingMinutes)
    : Math.max(0, (user.readingMinutes || 0) + (deltasOrValues.minutesDelta || 0));

  const currentStreakDays = deltasOrValues.currentStreakDays !== undefined
    ? Math.max(1, deltasOrValues.currentStreakDays)
    : Math.max(1, user.currentStreakDays || 1);

  return updateUser(user.id, {
    points,
    totalChaptersRead,
    totalWordsRead,
    readingMinutes,
    currentStreakDays,
  });
}

export function getRecentlyRead(emailOrId: string): RecentlyReadItem[] {
  const user = findUserByEmail(emailOrId) || findUserById(emailOrId) || findUserByAny(emailOrId);
  return user?.recentlyRead || [];
}

export function addRecentlyRead(emailOrId: string, item: RecentlyReadItem): RecentlyReadItem[] {
  const users = getAllUsers();
  const normalized = emailOrId.toLowerCase().trim();
  const index = users.findIndex(
    (u) => u.id === emailOrId || u.email.toLowerCase() === normalized || u.name.toLowerCase() === normalized
  );

  if (index === -1) {
    return [];
  }

  const existingList = users[index].recentlyRead || [];
  // Deduplicate by bookId, putting the new/updated one at the front
  const filtered = existingList.filter((r) => r.bookId !== item.bookId);
  const updatedList = [item, ...filtered].slice(0, 30); // keep last 30 recently read books

  users[index].recentlyRead = updatedList;
  saveUsers(users);
  return updatedList;
}

export function getReadlist(emailOrId: string): ReadlistItem[] {
  const user = findUserByEmail(emailOrId) || findUserById(emailOrId) || findUserByAny(emailOrId);
  return user?.readlist || [];
}

export function addReadlistItem(emailOrId: string, item: ReadlistItem): ReadlistItem[] {
  const users = getAllUsers();
  const normalized = emailOrId.toLowerCase().trim();
  const index = users.findIndex(
    (u) => u.id === emailOrId || u.email.toLowerCase() === normalized
  );

  if (index === -1) {
    return [];
  }

  const existingList = users[index].readlist || [];
  // Deduplicate by bookId, putting the new/updated one at the front
  const filtered = existingList.filter((r) => r.bookId !== item.bookId);
  const updatedList = [item, ...filtered].slice(0, 50);

  users[index].readlist = updatedList;
  saveUsers(users);
  return updatedList;
}

export function removeReadlistItem(emailOrId: string, bookId: string): ReadlistItem[] {
  const users = getAllUsers();
  const normalized = emailOrId.toLowerCase().trim();
  const index = users.findIndex(
    (u) => u.id === emailOrId || u.email.toLowerCase() === normalized
  );

  if (index === -1) {
    return [];
  }

  const existingList = users[index].readlist || [];
  const updatedList = existingList.filter((r) => r.bookId !== bookId);

  users[index].readlist = updatedList;
  saveUsers(users);
  return updatedList;
}

export function getUserPreferences(emailOrId: string) {
  const user = findUserByEmail(emailOrId) || findUserById(emailOrId) || findUserByAny(emailOrId);
  if (!user) return null;
  return {
    overviewBg: user.overviewBg || null,
    overviewBgSource: user.overviewBgSource || null,
    overviewAccent: user.overviewAccent || null,
    mangaTheme: user.mangaTheme || null,
    manhwaTheme: user.manhwaTheme || null,
    novelTheme: user.novelTheme || null,
  };
}

export function updateUserPreferences(
  emailOrId: string,
  prefs: {
    overviewBg?: string;
    overviewBgSource?: string;
    overviewAccent?: string;
    mangaTheme?: string;
    manhwaTheme?: string;
    novelTheme?: string;
  }
): StoredUser | null {
  const users = getAllUsers();
  const normalized = emailOrId.toLowerCase().trim();
  const index = users.findIndex(
    (u) => u.id === emailOrId || u.email.toLowerCase() === normalized
  );
  if (index === -1) return null;

  if (prefs.overviewBg !== undefined) users[index].overviewBg = prefs.overviewBg;
  if (prefs.overviewBgSource !== undefined) users[index].overviewBgSource = prefs.overviewBgSource;
  if (prefs.overviewAccent !== undefined) users[index].overviewAccent = prefs.overviewAccent;
  if (prefs.mangaTheme !== undefined) users[index].mangaTheme = prefs.mangaTheme;
  if (prefs.manhwaTheme !== undefined) users[index].manhwaTheme = prefs.manhwaTheme;
  if (prefs.novelTheme !== undefined) users[index].novelTheme = prefs.novelTheme;

  saveUsers(users);
  return users[index];
}


