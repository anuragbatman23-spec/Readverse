import fs from 'fs';
import path from 'path';
import { getStorageObject, setStorageObject } from './d1Client';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle?: string;
  bookTitle?: string;
  bookCategory?: string;
  chapterNumber?: number;
  content: string;
  type: 'quote' | 'panel' | 'milestone' | 'discussion';
  mediaUrl?: string;
  quoteText?: string;
  isSpoiler?: boolean;
  spoilerChapter?: number;
  likes: number;
  likedBy: string[]; // User IDs or emails who liked
  commentsCount: number;
  createdAt: string; // ISO date or time string
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  parentId?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface CommunityActivity {
  id: string;
  userName: string;
  userAvatar: string;
  actionText: string;
  communityName: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface TeamGuild {
  id: string;
  name: string;
  membersCount: number;
  avatarUrl: string;
  description?: string;
  category?: string;
  creatorId?: string;
  creatorName?: string;
  followers?: string[];
  createdAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'local-data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USER_FOLLOWS_FILE = path.join(DATA_DIR, 'user_follows.json');
const USER_PRESENCE_FILE = path.join(DATA_DIR, 'user_presence.json');

// Default initial posts
const DEFAULT_POSTS: CommunityPost[] = [];

const DEFAULT_ACTIVITIES: CommunityActivity[] = [];

const DEFAULT_TEAMS: TeamGuild[] = [
  {
    id: 'team-feyenoord',
    name: 'Feyenoord',
    membersCount: 37819,
    avatarUrl: '/community/team-feyenoord.jpg'
  },
  {
    id: 'team-pec',
    name: 'PEC Zwolle',
    membersCount: 13253,
    avatarUrl: '/community/team-pec.jpg'
  },
  {
    id: 'team-utrecht',
    name: 'Utrecht',
    membersCount: 1023,
    avatarUrl: '/community/team-utrecht.jpg'
  }
];

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(DEFAULT_POSTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(ACTIVITIES_FILE)) {
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(DEFAULT_ACTIVITIES, null, 2), 'utf-8');
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(TEAMS_FILE)) {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(DEFAULT_TEAMS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(INTERACTIONS_FILE)) {
    fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
  if (!fs.existsSync(USER_FOLLOWS_FILE)) {
    fs.writeFileSync(USER_FOLLOWS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

const FILE_TO_D1_KEY: Record<string, string> = {
  [POSTS_FILE]: 'community_posts',
  [COMMENTS_FILE]: 'community_comments',
  [ACTIVITIES_FILE]: 'community_activities',
  [MESSAGES_FILE]: 'community_messages',
  [TEAMS_FILE]: 'community_teams',
  [INTERACTIONS_FILE]: 'community_interactions',
  [USER_FOLLOWS_FILE]: 'community_user_follows',
  [USER_PRESENCE_FILE]: 'community_user_presence'
};

const memoryStore: Record<string, any> = {};

export async function syncCommunityFromD1(): Promise<void> {
  const promises = Object.entries(FILE_TO_D1_KEY).map(async ([file, key]) => {
    try {
      const res = await getStorageObject(key);
      if (res !== null) {
        memoryStore[file] = res;
      }
    } catch {}
  });
  await Promise.all(promises);
}

// Pre-sync D1 on backend start
if (typeof window === 'undefined') {
  syncCommunityFromD1().catch(() => {});
}

function readFileJson<T>(filePath: string, fallback: T): T {
  if (memoryStore[filePath] !== undefined) {
    return memoryStore[filePath] as T;
  }
  try {
    ensureStorage();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content || 'null');
      if (parsed !== null) {
        memoryStore[filePath] = parsed;
        return parsed as T;
      }
    }
  } catch (error) {
    // Read-only filesystem on Vercel
  }

  // Trigger lazy background fetch from D1
  const d1Key = FILE_TO_D1_KEY[filePath];
  if (d1Key) {
    getStorageObject<T>(d1Key).then((data) => {
      if (data !== null) {
        memoryStore[filePath] = data;
      }
    }).catch(() => {});
  }

  memoryStore[filePath] = fallback;
  return fallback;
}

function writeFileJson<T>(filePath: string, data: T): void {
  memoryStore[filePath] = data;
  try {
    ensureStorage();
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    // Read-only filesystem on Vercel - safely ignored
  }

  const d1Key = FILE_TO_D1_KEY[filePath];
  if (d1Key) {
    setStorageObject(d1Key, data).catch((err) => {
      console.error(`[communityDb] Failed saving ${d1Key} to D1:`, err);
    });
  }
}

// ===================== POSTS =====================
export function getAllPosts(): CommunityPost[] {
  return readFileJson<CommunityPost[]>(POSTS_FILE, DEFAULT_POSTS);
}

export function createNewPost(data: Omit<CommunityPost, 'id' | 'likes' | 'likedBy' | 'commentsCount' | 'createdAt'>): CommunityPost {
  const posts = getAllPosts();
  const newPost: CommunityPost = {
    ...data,
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  writeFileJson(POSTS_FILE, posts);

  // Add an activity entry for this post
  addActivity({
    userName: newPost.userName,
    userAvatar: newPost.userAvatar,
    actionText: `Published a new ${newPost.type}: "${newPost.content.substring(0, 35)}..."`,
    communityName: newPost.bookTitle || 'Global Feed'
  });

  return newPost;
}

export function toggleLikePost(postId: string, userIdentifier: string): { post: CommunityPost | null; hasLiked: boolean } {
  const posts = getAllPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return { post: null, hasLiked: false };

  if (!post.likedBy) post.likedBy = [];

  const index = post.likedBy.indexOf(userIdentifier);
  let hasLiked = false;

  if (index >= 0) {
    // Unlike
    post.likedBy.splice(index, 1);
    post.likes = Math.max(0, post.likes - 1);
    hasLiked = false;
  } else {
    // Like
    post.likedBy.push(userIdentifier);
    post.likes += 1;
    hasLiked = true;
  }

  writeFileJson(POSTS_FILE, posts);
  return { post, hasLiked };
}

// ===================== COMMENTS =====================
export function getCommentsForPost(postId: string): CommunityComment[] {
  const comments = readFileJson<CommunityComment[]>(COMMENTS_FILE, []);
  return comments.filter(c => c.postId === postId);
}

export function addComment(postId: string, data: { userId: string; userName: string; userAvatar: string; content: string; parentId?: string }): CommunityComment {
  const comments = readFileJson<CommunityComment[]>(COMMENTS_FILE, []);
  const newComment: CommunityComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    postId,
    userId: data.userId,
    userName: data.userName,
    userAvatar: data.userAvatar,
    content: data.content,
    parentId: data.parentId,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  writeFileJson(COMMENTS_FILE, comments);

  // Update post's commentsCount
  const posts = getAllPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
    writeFileJson(POSTS_FILE, posts);
  }

  return newComment;
}

// ===================== ACTIVITIES =====================
export function getAllActivities(): CommunityActivity[] {
  return readFileJson<CommunityActivity[]>(ACTIVITIES_FILE, DEFAULT_ACTIVITIES);
}

export function addActivity(data: Omit<CommunityActivity, 'id' | 'createdAt'>): CommunityActivity {
  const activities = getAllActivities();
  const newAct: CommunityActivity = {
    ...data,
    id: `act_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  activities.unshift(newAct);
  if (activities.length > 30) activities.pop(); // keep last 30
  writeFileJson(ACTIVITIES_FILE, activities);
  return newAct;
}

// ===================== TEAMS / GUILDS =====================
export function getAllTeams(): TeamGuild[] {
  return readFileJson<TeamGuild[]>(TEAMS_FILE, DEFAULT_TEAMS);
}

export function createGuild(data: {
  name: string;
  description?: string;
  avatarUrl?: string;
  category?: string;
  creatorId: string;
  creatorName?: string;
}): TeamGuild {
  const teams = getAllTeams();
  const newGuild: TeamGuild = {
    id: `guild_${Date.now()}`,
    name: data.name.trim(),
    description: data.description?.trim() || 'A fellowship of avid readers sharing and exploring stories.',
    avatarUrl: data.avatarUrl || '/avatars/anime/11_satoru_gojo.png',
    category: data.category || 'Reading Club',
    membersCount: 1,
    creatorId: data.creatorId,
    creatorName: data.creatorName || 'Club Leader',
    followers: [data.creatorId],
    createdAt: new Date().toISOString()
  };

  teams.unshift(newGuild);
  writeFileJson(TEAMS_FILE, teams);
  return newGuild;
}

export function toggleFollowGuild(guildId: string, userId: string): { guild: TeamGuild | null; isFollowing: boolean } {
  const teams = getAllTeams();
  const guild = teams.find(t => t.id === guildId);
  if (!guild) return { guild: null, isFollowing: false };

  if (!Array.isArray(guild.followers)) {
    guild.followers = [];
  }

  const idx = guild.followers.indexOf(userId);
  let isFollowing = false;
  if (idx >= 0) {
    guild.followers.splice(idx, 1);
    guild.membersCount = Math.max(0, (guild.membersCount || 1) - 1);
    isFollowing = false;
  } else {
    guild.followers.push(userId);
    guild.membersCount = (guild.membersCount || 0) + 1;
    isFollowing = true;
  }

  writeFileJson(TEAMS_FILE, teams);
  return { guild, isFollowing };
}

// ===================== DIRECT MESSAGES =====================
export function getMessagesBetween(userId1: string, userId2: string): DirectMessage[] {
  const messages = readFileJson<DirectMessage[]>(MESSAGES_FILE, []);
  const aliases1 = new Set(getUserAliases(userId1));
  const aliases2 = new Set(getUserAliases(userId2));

  return messages.filter(m => {
    const from1To2 = aliases1.has(m.senderId) && aliases2.has(m.recipientId);
    const from2To1 = aliases2.has(m.senderId) && aliases1.has(m.recipientId);
    return from1To2 || from2To1;
  });
}

export function sendDirectMessage(data: Omit<DirectMessage, 'id' | 'createdAt' | 'isRead'>): DirectMessage {
  const messages = readFileJson<DirectMessage[]>(MESSAGES_FILE, []);
  const newMsg: DirectMessage = {
    ...data,
    id: `msg_${Date.now()}`,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  messages.push(newMsg);
  writeFileJson(MESSAGES_FILE, messages);
  return newMsg;
}

// ===================== USER FOLLOWS & PROFILES =====================
export interface CommunityUser {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  bannerImage?: string;
  badgeProgress?: any;
  unlockedBadges?: string[];
  title?: string;
  followingCount: number;
  followersCount: number;
  guildsCount: number;
  points?: number;
  totalChaptersRead?: number;
  totalWordsRead?: number;
  readingMinutes?: number;
  currentStreakDays?: number;
  isVerified?: boolean;
  isEarlyAdopter?: boolean;
  isFollowed?: boolean;
  isFollower?: boolean;
  sharedGuilds?: string[];
  isOnline?: boolean;
}

export function getUserFollowsMap(): Record<string, string[]> {
  return readFileJson<Record<string, string[]>>(USER_FOLLOWS_FILE, {});
}

export function getUserPresenceMap(): Record<string, string> {
  return readFileJson<Record<string, string>>(USER_PRESENCE_FILE, {});
}

export function touchUserPresence(userIdOrEmail: string): void {
  if (!userIdOrEmail) return;
  const aliases = getUserAliases(userIdOrEmail);
  const map = getUserPresenceMap();
  const now = new Date().toISOString();
  aliases.forEach((alias: string) => {
    map[alias] = now;
  });
  writeFileJson(USER_PRESENCE_FILE, map);
}

export function isUserOnline(userIdOrEmail: string, timeoutMs: number = 2 * 60 * 1000): boolean {
  const aliases = getUserAliases(userIdOrEmail);
  const map = getUserPresenceMap();
  const now = Date.now();
  return aliases.some((alias: string) => {
    const lastSeenStr = map[alias];
    if (!lastSeenStr) return false;
    const diff = now - new Date(lastSeenStr).getTime();
    return diff >= 0 && diff <= timeoutMs;
  });
}

export function getUserAliases(userIdOrEmail: string): string[] {
  const registered = readFileJson<any[]>(USERS_FILE, []);
  const aliases = new Set<string>([userIdOrEmail]);
  const found = registered.find((u: any) => u.id === userIdOrEmail || u.email === userIdOrEmail);
  if (found) {
    if (found.id) aliases.add(found.id);
    if (found.email) aliases.add(found.email);
  }
  return Array.from(aliases);
}

export function getUserFollowersCount(userIdOrEmail: string): number {
  const aliases = getUserAliases(userIdOrEmail);
  const followsMap = getUserFollowsMap();
  const uniqueFollowers = new Set<string>();

  Object.entries(followsMap).forEach(([followerId, list]) => {
    if (!aliases.includes(followerId) && Array.isArray(list)) {
      if (list.some((id: string) => aliases.includes(id))) {
        uniqueFollowers.add(followerId);
      }
    }
  });

  return uniqueFollowers.size;
}

export function getUserFollowedIds(userIdOrEmail: string): string[] {
  const aliases = getUserAliases(userIdOrEmail);
  const map = getUserFollowsMap();
  const set = new Set<string>();
  aliases.forEach((alias: string) => {
    (map[alias] || []).forEach((target: string) => set.add(target));
  });
  return Array.from(set);
}

export function getAllCommunityUsers(currentUserId?: string): CommunityUser[] {
  if (currentUserId) {
    touchUserPresence(currentUserId);
  }
  const registered = readFileJson<any[]>(USERS_FILE, []);
  const followsMap = getUserFollowsMap();
  const teams = getAllTeams();

  const currentUserAliases = currentUserId ? getUserAliases(currentUserId) : [];
  const currentFollows = currentUserId ? getUserFollowedIds(currentUserId) : [];

  // Guilds that the current user belongs to
  const myGuilds = teams.filter(g => {
    const f = Array.isArray(g.followers) ? g.followers : [];
    return f.some(id => currentUserAliases.includes(id)) || currentUserAliases.includes(g.creatorId || '');
  });

  // Helper to check if a user is in any of my guilds
  const getSharedGuildsForUser = (userAliases: string[]) => {
    return myGuilds
      .filter(g => {
        const f = Array.isArray(g.followers) ? g.followers : [];
        return f.some(id => userAliases.includes(id)) || userAliases.includes(g.creatorId || '');
      })
      .map(g => g.name);
  };

  // Helper to check if another user follows the current user
  const checkIsFollowerOfCurrent = (otherAliases: string[]) => {
    if (currentUserAliases.length === 0) return false;
    return otherAliases.some(otherId => {
      const list = followsMap[otherId] || [];
      return list.some((target: string) => currentUserAliases.includes(target));
    });
  };

  const registeredUsers: CommunityUser[] = registered.map(u => {
    const id = u.id || u.email;
    const aliases = getUserAliases(id);
    const following = (followsMap[id] || []).length;
    const followers = getUserFollowersCount(id);
    const isFollowed = currentFollows.some((fId: string) => aliases.includes(fId));
    const isFollower = checkIsFollowerOfCurrent(aliases);
    const sharedGuilds = getSharedGuildsForUser(aliases);
    const isOnline = isUserOnline(id);

    return {
      id,
      name: u.name || 'Reader',
      email: u.email,
      avatar: u.image || '/community/avatar-pegasus.jpg',
      bannerImage: u.bannerImage,
      badgeProgress: u.badgeProgress,
      unlockedBadges: u.unlockedBadges,
      title: 'Verified Reader ✨',
      followingCount: following,
      followersCount: followers,
      guildsCount: 0,
      points: u.points ?? 0,
      totalChaptersRead: u.totalChaptersRead ?? 0,
      totalWordsRead: u.totalWordsRead ?? 0,
      readingMinutes: u.readingMinutes ?? 0,
      currentStreakDays: u.currentStreakDays ?? 1,
      isVerified: true,
      isEarlyAdopter: true,
      isFollowed,
      isFollower,
      sharedGuilds,
      isOnline
    };
  });

  return registeredUsers;
}

export function toggleFollowUser(followerId: string, targetUserId: string): { isFollowing: boolean; followingCount: number; followersCount: number } {
  const map = getUserFollowsMap();
  const targetAliases = getUserAliases(targetUserId);

  const primaryFollower = followerId;
  const list = map[primaryFollower] || [];
  
  const idx = list.findIndex((id: string) => targetAliases.includes(id));
  let isFollowing = false;

  if (idx >= 0) {
    list.splice(idx, 1);
    isFollowing = false;
  } else {
    list.push(targetUserId);
    isFollowing = true;
  }
  map[primaryFollower] = list;
  writeFileJson(USER_FOLLOWS_FILE, map);

  const followingCount = getUserFollowedIds(followerId).length;
  const followersCount = getUserFollowersCount(targetUserId);

  return {
    isFollowing,
    followingCount,
    followersCount
  };
}
