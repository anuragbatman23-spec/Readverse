'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '../../context/AppContext';
import { CreatePostModal } from './CreatePostModal';
import { ChatModal } from './ChatModal';
import { AuthModal } from '../auth/AuthModal';
import {
  Heart,
  MessageSquare,
  Paperclip,
  Send,
  Search,
  ChevronDown,
  MessageCircle,
  User,
  Users,
  Check,
  Plus,
  Eye,
  EyeOff,
  Quote,
  BookOpen,
  Repeat2,
  CheckCheck,
  Shield,
  Lock,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';

interface FeedPost {
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
  hasLiked?: boolean;
  commentsCount: number;
  createdAt: string;
}

interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  userName: string;
  userAvatar: string;
  actionText: string;
  communityName: string;
  createdAt: string;
}

interface TeamItem {
  id: string;
  name: string;
  membersCount: number;
  avatarUrl: string;
  description?: string;
  category?: string;
  creatorId?: string;
  creatorName?: string;
  followers?: string[];
  isFollowed?: boolean;
}

interface CommunityUserItem {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  title?: string;
  followingCount: number;
  followersCount: number;
  guildsCount: number;
  isVerified?: boolean;
  isEarlyAdopter?: boolean;
  isFollowed?: boolean;
  isFollower?: boolean;
  sharedGuilds?: string[];
  isOnline?: boolean;
}

function formatTimeAgo(dateString: string): string {
  try {
    const past = new Date(dateString).getTime();
    if (isNaN(past)) return dateString;
    const now = Date.now();
    const diffMin = Math.floor((now - past) / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

const CommunitySkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6 select-none animate-in fade-in duration-300">
      {/* Top Header Skeleton (Search + Actions) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pb-2">
        <div className="w-full sm:max-w-xl h-11 rounded-full bg-[#151722]/90 border border-white/10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1">
            <Search className="w-4 h-4 text-zinc-600" />
            <div className="h-3.5 w-48 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-full bg-[#181a26] border border-white/10 animate-pulse" />
        </div>
      </div>

      {/* Main Multi-Panel Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: Profile & Guilds Skeleton (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Profile Card Skeleton */}
          <div className="rounded-2xl bg-[#0c0d15] border border-white/[0.08] p-4 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-shimmer" />

            {/* Avatar + Name */}
            <div className="rounded-xl bg-[#181a26]/70 border border-white/[0.05] p-2.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 animate-pulse shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-28 rounded bg-white/15 animate-pulse" />
                <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between px-2 py-0.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-white/10 animate-pulse" />
                  <div className="w-6 h-3.5 rounded bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-white/5 border border-white/5 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-white/5 border border-white/5 animate-pulse" />
            </div>

            {/* Action button */}
            <div className="w-full h-10 rounded-full bg-white/10 border border-white/15 animate-pulse" />
          </div>

          {/* Guilds Card Skeleton */}
          <div className="rounded-2xl bg-[#0f111c] border border-white/[0.08] p-4 space-y-3.5 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-shimmer" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
            </div>

            <div className="space-y-3 pt-1">
              {[0, 1].map(i => (
                <div key={i} className="flex items-center gap-3 p-1">
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-white/10 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Composer + Post Feed Stream Skeleton (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Composer Card Skeleton */}
          <div className="rounded-2xl bg-[#0f111c] border border-white/[0.08] px-4 py-3 flex items-center justify-between gap-3 shadow-md relative overflow-hidden">
            <div className="h-4 w-44 rounded bg-white/10 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white/5 animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>

          {/* Center Loading Shimmer Bar with #DA6569 Accent */}
          <div className="py-4 px-5 rounded-2xl bg-[#0d0f18]/90 border border-white/[0.06] flex items-center justify-center gap-3 shadow-sm">
            <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-[#DA6569]/20" />
              <div className="w-5 h-5 rounded-full border-2 border-[#DA6569] border-t-transparent animate-spin shadow-[0_0_12px_rgba(218,101,105,0.4)]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200 tracking-wider uppercase">Loading Community Feed...</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-medium">Syncing Readers & Discussions</span>
            </div>
          </div>

          {/* Post Skeletons */}
          {[0, 1].map(postIdx => (
            <div
              key={postIdx}
              className="p-4 sm:p-5 rounded-2xl bg-[#0f111c]/90 border border-white/[0.08] shadow-md space-y-3.5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-shimmer" />

              {/* Author header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 rounded bg-white/15 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
              </div>

              {/* Post content lines */}
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-full rounded bg-white/10 animate-pulse" />
                <div className="h-3.5 w-5/6 rounded bg-white/10 animate-pulse" />
                <div className="h-3.5 w-2/3 rounded bg-white/5 animate-pulse" />
              </div>

              {/* Media placeholder on first post */}
              {postIdx === 0 && (
                <div className="h-44 sm:h-52 w-full rounded-xl bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-white/[0.07] border border-white/5 flex items-center justify-center relative overflow-hidden">
                  <div className="flex flex-col items-center gap-2 text-zinc-600">
                    <Sparkles className="w-6 h-6 text-zinc-600 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Loading Shared Panel</span>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                <div className="h-7 w-16 rounded-full bg-white/5 border border-white/5 animate-pulse" />
                <div className="h-7 w-20 rounded-full bg-white/5 border border-white/5 animate-pulse" />
                <div className="h-7 w-16 rounded-full bg-white/5 border border-white/5 animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* COLUMN 4: Active Users Rail Skeleton (Pushed to Right Side) */}
        <div className="lg:col-span-1 lg:col-start-12 xl:col-start-12 hidden lg:flex flex-col items-center gap-3 pt-2 ml-auto">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse mb-1" />
          <div className="w-9 h-9 rounded-full border border-dashed border-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const FeedView: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { stats } = useApp();
  const currentUserId = session?.user?.email || session?.user?.id || 'usr_anurag_batman';
  const currentUserName = session?.user?.name || 'Anurag Kumar';

  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Guaranteed 0.5-second initial loading screen for community page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadAvatar = () => {
      try {
        const avatarKey = session?.user?.email
          ? `readverse_custom_avatar_${session.user.email}`
          : 'readverse_custom_avatar';
        const saved = localStorage.getItem(avatarKey) || localStorage.getItem('readverse_custom_avatar');
        if (saved) setCustomAvatar(saved);
        else setCustomAvatar(null);
      } catch (e) {
        console.warn(e);
      }
    };
    loadAvatar();
    window.addEventListener('readverse_avatar_updated', loadAvatar);
    return () => window.removeEventListener('readverse_avatar_updated', loadAvatar);
  }, [session?.user?.email]);

  const currentUserAvatar = customAvatar || session?.user?.image || '/community/avatar-pegasus.jpg';

  // State
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Panels
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<any>(null);

  // Comments
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, FeedComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Spoilers & Joins
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGlobalScope, setSelectedGlobalScope] = useState('Global');
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set());

  // Saved / Bookmarked posts
  const [savedPosts, setSavedPosts] = useState<Set<string>>(() => {
    try {
      const local = localStorage.getItem('readverse_saved_posts');
      return local ? new Set(JSON.parse(local)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleSavePost = (postId: string) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        showToast('Removed from saved posts');
      } else {
        next.add(postId);
        showToast('Saved to your collection! 🔖');
      }
      try {
        localStorage.setItem('readverse_saved_posts', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Activities & Guilds from backend
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [allGuilds, setAllGuilds] = useState<TeamItem[]>([]);
  const [followedGuildIds, setFollowedGuildIds] = useState<Set<string>>(new Set());

  // Community Users & User-to-User Follows
  const [communityUsers, setCommunityUsers] = useState<CommunityUserItem[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [myFollowersCount, setMyFollowersCount] = useState<number>(0);

  // Top Search bar interactive state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [searchActiveTab, setSearchActiveTab] = useState<'guilds' | 'users'>('users');
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedGlobalScope === 'Users') {
      setSearchActiveTab('users');
    }
  }, [selectedGlobalScope]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setIsScopeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter guilds for top search bar
  const matchingGuilds = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allGuilds.slice(0, 6);
    }
    const q = searchQuery.toLowerCase().trim();
    return allGuilds.filter(
      g =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.category && g.category.toLowerCase().includes(q))
    );
  }, [allGuilds, searchQuery]);

  // Filter users for top search bar
  const matchingUsers = React.useMemo(() => {
    const others = communityUsers.filter(u => u.id !== currentUserId && u.email !== session?.user?.email);
    if (!searchQuery.trim()) {
      return others.slice(0, 5);
    }
    const q = searchQuery.toLowerCase().trim();
    return others.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        (u.title && u.title.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [communityUsers, searchQuery, currentUserId, session?.user?.email]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check if a post or comment author is the logged-in current user
  const isPostAuthorCurrentUser = useCallback((item: { userId?: string; userName?: string } | null | undefined) => {
    if (!item) return false;
    const authorId = item.userId;
    const authorName = (item.userName || '').toLowerCase().trim();
    const myId = currentUserId;
    const sessionEmail = (session?.user?.email || '').toLowerCase().trim();
    const sessionId = session?.user?.id;
    const myName = currentUserName.toLowerCase().trim();
    const sessionName = (session?.user?.name || '').toLowerCase().trim();
    const emailPrefix = sessionEmail ? sessionEmail.split('@')[0] : '';

    if (authorId && (authorId === myId || (sessionId && authorId === sessionId) || (sessionEmail && authorId.toLowerCase() === sessionEmail))) {
      return true;
    }
    if (authorName && (
      authorName === myName ||
      (sessionName && authorName === sessionName) ||
      (emailPrefix && authorName === emailPrefix)
    )) {
      return true;
    }
    return false;
  }, [currentUserId, currentUserName, session?.user?.email, session?.user?.id, session?.user?.name]);

  // Dynamically resolve the author's avatar so posts always show the user's current profile picture
  const resolvePostAvatar = useCallback((post: FeedPost | null | undefined) => {
    if (!post) return currentUserAvatar;
    if (isPostAuthorCurrentUser(post)) {
      return currentUserAvatar;
    }
    const matched = communityUsers.find(
      u => u.id === post.userId || u.name.toLowerCase() === (post.userName || '').toLowerCase()
    );
    if (matched?.avatar) return matched.avatar;
    return post.userAvatar || '/community/avatar-butterbean.jpg';
  }, [isPostAuthorCurrentUser, currentUserAvatar, communityUsers]);

  // Dynamically resolve comment author avatar
  const resolveCommentAvatar = useCallback((comment: FeedComment | null | undefined) => {
    if (!comment) return currentUserAvatar;
    if (isPostAuthorCurrentUser(comment)) {
      return currentUserAvatar;
    }
    const matched = communityUsers.find(
      u => u.id === comment.userId || u.name.toLowerCase() === (comment.userName || '').toLowerCase()
    );
    if (matched?.avatar) return matched.avatar;
    return comment.userAvatar || '/community/avatar-butterbean.jpg';
  }, [isPostAuthorCurrentUser, currentUserAvatar, communityUsers]);

  // 1. Fetch Posts from Backend
  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentUserId) params.set('user', currentUserId);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedGlobalScope) params.set('scope', selectedGlobalScope);

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUserId, searchQuery, selectedGlobalScope]);

  // 2. Fetch Activities and Guilds
  useEffect(() => {
    fetchPosts();

    fetch('/api/community/activities')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.activities)) setActivities(data.activities);
      })
      .catch(console.error);

    const userParam = encodeURIComponent(currentUserId);
    fetch(`/api/community/teams?user=${userParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.teams)) {
          const list: TeamItem[] = data.allTeams || data.teams;
          setAllGuilds(list);

          let followed = new Set<string>();
          if (Array.isArray(data.followedGuildIds) && data.followedGuildIds.length > 0) {
            followed = new Set(data.followedGuildIds);
          } else {
            try {
              const localSaved = localStorage.getItem(`readverse_followed_guilds_${currentUserId}`);
              if (localSaved) {
                followed = new Set(JSON.parse(localSaved));
              }
            } catch (_) {}
          }
          setFollowedGuildIds(followed);
        }
      })
      .catch(console.error);

    // Fetch Community Users & Follow State
    const fetchUsers = () => {
      fetch(`/api/community/users?user=${userParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.users)) {
            setCommunityUsers(data.users);
            if (Array.isArray(data.followedUserIds)) {
              setFollowedUserIds(new Set(data.followedUserIds));
            }
            if (typeof data.followersCount === 'number') {
              setMyFollowersCount(data.followersCount);
            }
          }
        })
        .catch(console.error);
    };

    fetchUsers();

    // Live heartbeat & presence polling every 15 seconds
    const interval = setInterval(fetchUsers, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUsers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchPosts, currentUserId]);

  const followedGuilds = allGuilds.filter(g => followedGuildIds.has(g.id));

  // Real active users from: 1) Followers, 2) Following, 3) Guilds I am in
  const activeConnectedUsers = React.useMemo(() => {
    return communityUsers.filter(user => {
      // Exclude yourself
      if (user.id === currentUserId || (user.email && user.email === session?.user?.email)) {
        return false;
      }

      // MUST BE CURRENTLY ONLINE
      if (!user.isOnline) return false;

      // 1. You follow them (Following)
      if (followedUserIds.has(user.id)) return true;

      // 2. They follow you (Followers)
      if (user.isFollower) return true;

      // 3. In the guilds you are in
      if (Array.isArray(user.sharedGuilds) && user.sharedGuilds.length > 0) return true;

      const isInMyGuild = followedGuilds.some(g => {
        const followers = Array.isArray(g.followers) ? g.followers : [];
        return followers.includes(user.id) || g.creatorId === user.id;
      });
      if (isInMyGuild) return true;

      return false;
    });
  }, [communityUsers, followedUserIds, currentUserId, session?.user?.email, followedGuilds]);

  const handleToggleFollowUser = async (targetUserId: string) => {
    if (targetUserId === currentUserId) {
      showToast('You cannot follow yourself');
      return;
    }

    const isCurrentlyFollowed = followedUserIds.has(targetUserId);

    // Optimistic update
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowed) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return next;
    });

    setCommunityUsers(prev =>
      prev.map(u => {
        if (u.id === targetUserId) {
          const delta = isCurrentlyFollowed ? -1 : 1;
          return {
            ...u,
            followersCount: Math.max(0, u.followersCount + delta),
            isFollowed: !isCurrentlyFollowed
          };
        }
        return u;
      })
    );

    try {
      const res = await fetch('/api/community/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_follow',
          followerId: currentUserId,
          targetUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        const targetName = communityUsers.find(u => u.id === targetUserId)?.name || 'User';
        showToast(
          data.isFollowing
            ? `Now following ${targetName}!`
            : `Unfollowed ${targetName}`
        );
      }
    } catch (err) {
      console.error('Error toggling user follow:', err);
    }
  };

  const handleGuildCreated = (newGuild: TeamItem) => {
    setAllGuilds(prev => [newGuild, ...prev]);
    setFollowedGuildIds(prev => {
      const next = new Set(prev);
      next.add(newGuild.id);
      try {
        localStorage.setItem(
          `readverse_followed_guilds_${currentUserId}`,
          JSON.stringify(Array.from(next))
        );
      } catch (_) {}
      return next;
    });
    showToast(`🎉 Club "${newGuild.name}" built! You are now the Club Leader ⚔️`);
  };

  const handleToggleFollow = async (guildId: string) => {
    const isCurrentlyFollowed = followedGuildIds.has(guildId);
    setFollowedGuildIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowed) {
        next.delete(guildId);
      } else {
        next.add(guildId);
      }
      try {
        localStorage.setItem(
          `readverse_followed_guilds_${currentUserId}`,
          JSON.stringify(Array.from(next))
        );
      } catch (_) {}
      return next;
    });

    setAllGuilds(prev =>
      prev.map(g => {
        if (g.id === guildId) {
          const delta = isCurrentlyFollowed ? -1 : 1;
          return {
            ...g,
            membersCount: Math.max(0, (g.membersCount || 0) + delta)
          };
        }
        return g;
      })
    );

    try {
      const res = await fetch('/api/community/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_follow',
          guildId,
          userId: currentUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        const guildName = allGuilds.find(g => g.id === guildId)?.name || 'Club';
        showToast(
          data.isFollowing
            ? `You are now following ${guildName}!`
            : `Unfollowed ${guildName}`
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow guild:', err);
    }
  };

  // Handle Quick Composer Post
  const handleComposerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const content = composerText.trim();
    setComposerText('');

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: currentUserId,
          userName: currentUserName,
          userAvatar: currentUserAvatar,
          userTitle: 'Verified Reader ✨',
          type: 'discussion'
        })
      });

      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        showToast('Your post has been published to Global Feed! 🚀');
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
      showToast('Error publishing post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like on Post
  const handleToggleLike = async (postId: string) => {
    // Optimistic UI Update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev =>
          prev.map(p => (p.id === postId ? { ...p, hasLiked: data.hasLiked, likes: data.likes } : p))
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Open / Toggle Comments Panel in Right Column (transforms Activity Feed into Comments Shower)
  const handleOpenCommentsPanel = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);

    // Fetch comments if not loaded yet
    if (!commentsMap[postId]) {
      try {
        const res = await fetch(`/api/community/posts/${postId}/comments`);
        const data = await res.json();
        if (data.success && Array.isArray(data.comments)) {
          setCommentsMap(prev => ({ ...prev, [postId]: data.comments }));
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  // Expand / Toggle Comments Thread
  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId);
    const next = new Set(expandedComments);

    if (isExpanded) {
      next.delete(postId);
      setExpandedComments(next);
    } else {
      next.add(postId);
      setExpandedComments(next);

      // Fetch comments if not loaded yet
      if (!commentsMap[postId]) {
        try {
          const res = await fetch(`/api/community/posts/${postId}/comments`);
          const data = await res.json();
          if (data.success && Array.isArray(data.comments)) {
            setCommentsMap(prev => ({ ...prev, [postId]: data.comments }));
          }
        } catch (err) {
          console.error('Failed to load comments:', err);
        }
      }
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText || submittingComment[postId]) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUserName,
          userAvatar: currentUserAvatar,
          content: commentText
        })
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setCommentsMap(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));

        setPosts(prev =>
          prev.map(p => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
        );
        showToast('Comment posted! 💬');
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = (post: FeedPost) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
      showToast('Post link copied to clipboard! 📋');
    } else {
      showToast('Post link ready to share!');
    }
  };

  const toggleJoinCommunity = (name: string) => {
    setJoinedCommunities(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        showToast(`Left ${name}`);
      } else {
        next.add(name);
        showToast(`Joined ${name} 🎉`);
      }
      return next;
    });
  };

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openChatWith = (user: any) => {
    setChatTargetUser(user);
    setIsChatOpen(true);
  };

  if (isInitialLoading) {
    return <CommunitySkeleton />;
  }

  if (!session?.user) {
    return (
      <div className="w-full min-h-[65vh] flex items-center justify-center py-16 px-4 select-none">
        <div className="w-full max-w-lg mx-auto text-center space-y-6 rounded-3xl bg-[#0e101c]/95 border border-white/10 p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative overflow-hidden">
          {/* Ambient background glows */}
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Glowing Lock Badge */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-pink-500/20 border border-white/15 flex items-center justify-center shadow-xl shadow-cyan-500/10">
            <Lock className="w-9 h-9 text-cyan-400" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0e101c] border border-white/10 flex items-center justify-center text-amber-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Community is Locked
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
              Sign in with your account to access reader clubs, join live discussions, share book theories, and connect with fellow readers.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/25 border border-cyan-300/40 transition-all active:scale-95 flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FFFFFF"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In to Unlock Community</span>
            </button>
          </div>

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 select-none relative">
      {/* Toast Notification Floating Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161824] border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Search & Filter Bar (Matching Image 6 Header) */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pb-2">
        {/* Search Pill Bar with Scope Selector & Dropdown Results */}
        <div 
          ref={searchContainerRef}
          className="w-full sm:max-w-xl relative"
        >
          <div className="flex items-center justify-between bg-[#151722]/90 border border-white/10 rounded-full px-4 py-2 sm:py-2.5 shadow-sm focus-within:border-amber-400/50 transition-colors">
            <div className="flex items-center gap-2.5 flex-1 mr-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder={
                  selectedGlobalScope === 'Users'
                    ? 'Search users by name to follow or message...'
                    : 'Search posts or switch IN to Users...'
                }
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scope Trigger */}
            <div className="relative">
              <div
                onClick={() => setIsScopeMenuOpen(prev => !prev)}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 border-l border-white/10 pl-3 cursor-pointer hover:text-zinc-200 transition-colors select-none"
                title="Select search scope"
              >
                <span className="text-[10px] text-zinc-500 font-mono uppercase">IN</span>
                <span className={selectedGlobalScope !== 'Global' ? 'text-amber-400 font-bold' : 'text-zinc-200'}>
                  {selectedGlobalScope}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isScopeMenuOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Scope Dropdown Menu */}
              {isScopeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#0f111c] border border-white/10 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGlobalScope('Global');
                      setIsScopeMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/5 transition-colors ${
                      selectedGlobalScope === 'Global' ? 'text-amber-300 font-bold bg-white/[0.04]' : 'text-zinc-300'
                    }`}
                  >
                    <span>🌐 Global Feed</span>
                    {selectedGlobalScope === 'Global' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGlobalScope('Users');
                      setSearchActiveTab('users');
                      setIsScopeMenuOpen(false);
                      setIsSearchFocused(true);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/5 transition-colors ${
                      selectedGlobalScope === 'Users' ? 'text-amber-300 font-bold bg-white/[0.04]' : 'text-zinc-300'
                    }`}
                  >
                    <span>👥 Users</span>
                    {selectedGlobalScope === 'Users' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Search Results Dropdown for Users */}
          {(isSearchFocused || searchQuery.trim().length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-3xl bg-[#0e101a]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                    <span>Users</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 font-mono">
                      {matchingUsers.length}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-zinc-500 font-medium">
                  {searchQuery.trim() ? `Found ${matchingUsers.length} readers` : 'Community Readers'}
                </span>
              </div>

              {/* Users Results */}
              <div className="max-h-[75vh] overflow-y-auto p-3.5 space-y-4">
                  {matchingUsers.length > 0 ? (
                    matchingUsers.map(user => {
                      const isFollowed = followedUserIds.has(user.id);
                      return (
                        <div
                          key={user.id}
                          className="rounded-2xl bg-[#0c0d15] border border-white/[0.08] p-4 space-y-3.5 shadow-xl hover:border-white/20 transition-all"
                        >
                          {/* Avatar + Username Header */}
                          <div
                            onClick={() => {
                              setIsSearchFocused(false);
                              const userIdentifier = user.email || user.name || user.id;
                              router.push(`/profile?user=${encodeURIComponent(userIdentifier)}`);
                            }}
                            className="rounded-xl bg-[#181a26]/70 border border-white/[0.05] p-2.5 flex items-center gap-3 cursor-pointer hover:bg-[#202334] transition-all"
                            title={`View ${user.name}'s profile`}
                          >
                            <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shadow-md shrink-0 aspect-square bg-zinc-900">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  (e.currentTarget as HTMLImageElement).src = '/community/avatar-pegasus.jpg';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-[15px] text-white leading-tight truncate hover:text-cyan-300 transition-colors">
                                {user.name}
                              </h3>
                              {user.title && (
                                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{user.title}</p>
                              )}
                            </div>
                          </div>

                          {/* Stats Counter Row (Following, Followers, Guilds) */}
                          <div className="flex items-center justify-between text-xs px-2 py-0.5">
                            <div className="flex items-center gap-1.5 text-zinc-400" title="Following">
                              <div className="flex items-center">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="text-[10px] text-zinc-500 font-bold ml-0.5">→</span>
                              </div>
                              <span className="text-white font-medium text-[13px]">{user.followingCount || 0}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-zinc-400" title="Followers">
                              <div className="flex items-center">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="text-[10px] text-zinc-500 font-bold ml-0.5">←</span>
                              </div>
                              <span className="text-white font-medium text-[13px]">
                                {(user.followersCount || 0) + (isFollowed ? 1 : 0)}
                              </span>
                            </div>
                          </div>

                          {/* Genuine Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11252f] text-[#6fe0f2] border border-[#1d4a5b]/40 text-[11px] font-medium tracking-tight shrink-0">
                              <span className="w-3.5 h-3.5 rounded-full bg-[#4fd2e5] text-[#11252f] flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                              </span>
                              <span>Verified</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#231f18] text-[#fad375] border border-[#483a21]/40 text-[11px] font-medium tracking-tight shrink-0">
                              <svg className="w-3.5 h-3.5 text-[#fad375] fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.8-.48-3.48-1.33-4.94L12 12V2z" />
                              </svg>
                              <span>Early Adopter</span>
                            </div>
                          </div>

                          {/* Action Buttons: FOLLOW, CHAT, PROFILE */}
                          <div className="grid grid-cols-3 gap-2 pt-0.5">
                            <button
                              type="button"
                              onMouseDown={e => {
                                e.preventDefault();
                                handleToggleFollowUser(user.id);
                              }}
                              className={`w-full py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-1 ${
                                isFollowed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                  : 'bg-white hover:bg-zinc-200 text-black border border-white active:scale-98'
                              }`}
                            >
                              {isFollowed ? 'FOLLOWING' : 'FOLLOW'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsSearchFocused(false);
                                openChatWith(user);
                              }}
                              className="w-full py-2.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>CHAT</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsSearchFocused(false);
                                const userIdentifier = user.email || user.name || user.id;
                                router.push(`/profile?user=${encodeURIComponent(userIdentifier)}`);
                              }}
                              className="w-full py-2.5 rounded-full border border-white hover:bg-white hover:text-black text-xs font-bold tracking-wider text-white active:scale-98 transition-all uppercase shadow-sm cursor-pointer flex items-center justify-center"
                            >
                              PROFILE
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 px-4 text-center space-y-2">
                      <User className="w-8 h-8 text-zinc-600 mx-auto" />
                      <div className="text-xs font-semibold text-zinc-300">
                        No users found matching &ldquo;{searchQuery}&rdquo;
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Try searching for another username or handle.
                      </p>
                    </div>
                  )}
                </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/[0.06] bg-black/30 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">
                  Tip: Connect with readers or start a direct private conversation
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Accessories (Chat Icon Button) */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* Messages & Chat Icon Button */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-9 h-9 rounded-full bg-[#181a26] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
            title="Messages & Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Multi-Panel Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===== COLUMN 1: Profile (Image 1) & Teams (Image 2) (lg:col-span-3) ===== */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar">
          
          {/* IMAGE 1: Profile Card */}
          <div className="rounded-2xl bg-[#0c0d15] border border-white/[0.08] p-4 space-y-4 shadow-xl">
            {/* Avatar + Username Header */}
            <div className="rounded-xl bg-[#181a26]/70 border border-white/[0.05] p-2.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shadow-md shrink-0 aspect-square bg-zinc-900">
                <img
                  src={currentUserAvatar}
                  alt={currentUserName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = '/community/avatar-pegasus.jpg';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[15px] text-white leading-tight truncate">
                  {currentUserName}
                </h3>
              </div>
            </div>

            {/* Real Stats Counter Row (Following, Followers, Guilds) */}
            <div className="flex items-center justify-between text-xs px-2 py-0.5">
              <div className="flex items-center gap-1.5 text-zinc-400" title={`Following: ${followedUserIds.size}`}>
                <div className="flex items-center">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] text-zinc-500 font-bold ml-0.5">→</span>
                </div>
                <span className="text-white font-medium text-[13px]">{followedUserIds.size}</span>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400" title={`Followers: ${myFollowersCount}`}>
                <div className="flex items-center">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] text-zinc-500 font-bold ml-0.5">←</span>
                </div>
                <span className="text-white font-medium text-[13px]">{myFollowersCount}</span>
              </div>
            </div>

            {/* Genuine Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11252f] text-[#6fe0f2] border border-[#1d4a5b]/40 text-[11px] font-medium tracking-tight shrink-0">
                <span className="w-3.5 h-3.5 rounded-full bg-[#4fd2e5] text-[#11252f] flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                </span>
                <span>Verified</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#231f18] text-[#fad375] border border-[#483a21]/40 text-[11px] font-medium tracking-tight shrink-0">
                <svg className="w-3.5 h-3.5 text-[#fad375] fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.8-.48-3.48-1.33-4.94L12 12V2z" />
                </svg>
                <span>Early Adopter</span>
              </div>
            </div>

            {/* Profile Action Button */}
            <button
              onClick={() => router.push('/profile')}
              className="w-full py-2.5 rounded-full border border-white hover:bg-white hover:text-black text-xs font-bold tracking-[0.22em] text-white active:scale-98 transition-all uppercase shadow-sm cursor-pointer flex items-center justify-center"
            >
              PROFILE
            </button>
          </div>
        </div>

        {/* ===== COLUMN 2: Main Global Post Stream (lg:col-span-5) ===== */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick Composer Card ("What's new, Anurag Kumar?") */}
          <form
            onSubmit={handleComposerSubmit}
            className="rounded-2xl bg-[#0f111c] border border-white/[0.08] px-4 py-3 flex items-center justify-between gap-3 shadow-md focus-within:border-amber-400/40 transition-all"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900 aspect-square">
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/community/avatar-pegasus.jpg';
                }}
              />
            </div>
            <input
              type="text"
              value={composerText}
              onChange={e => setComposerText(e.target.value)}
              placeholder={`What's new, ${currentUserName}?`}
              className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
            <div className="flex items-center gap-2 text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="hover:text-white transition-colors p-1"
                title="Attach Image, Panel or Quote"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!composerText.trim() || isSubmitting}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white text-zinc-300 hover:text-zinc-950 flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-zinc-300"
                title="Publish post to Global Feed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Posts Feed Stream */}
          {loadingPosts ? (
            <div className="py-24 sm:py-36 w-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#DA6569]/20" />
                <div className="w-12 h-12 rounded-full border-4 border-[#DA6569] border-t-transparent animate-spin" />
              </div>
              <p className="text-xs sm:text-sm font-bold tracking-wide text-zinc-400">
                Loading global feed...
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl bg-[#0f111a] border border-white/[0.08] p-8 text-center text-zinc-500 text-xs space-y-2">
              <p>No posts found matching your search.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGlobalScope('Global');
                }}
                className="text-amber-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const isCommentsOpen = expandedComments.has(post.id);
                const postComments = commentsMap[post.id] || [];
                const isSpoilerHidden = post.isSpoiler && !revealedSpoilers.has(post.id);

                return (
                  <article
                    key={post.id}
                    onClick={() => handleOpenCommentsPanel(post.id)}
                    className="group/post relative p-4 sm:p-5 rounded-2xl border border-transparent hover:border-white/[0.08] hover:bg-[#151824]/80 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 space-y-3.5 cursor-pointer"
                  >
                    {/* Post Header: Avatar, Name, Time, Subtitle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Link
                          href={`/profile?user=${encodeURIComponent(post.userName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-zinc-800 cursor-pointer block hover:ring-2 hover:ring-cyan-400 transition-all"
                          title={`View ${post.userName}'s profile & shelf`}
                        >
                          <img
                            src={resolvePostAvatar(post)}
                            alt={post.userName}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src = '/community/avatar-butterbean.jpg';
                            }}
                          />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm leading-tight">
                            <Link 
                              href={`/profile?user=${encodeURIComponent(post.userName)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-white truncate hover:underline hover:text-cyan-300 cursor-pointer transition-colors"
                              title={`View ${post.userName}'s profile & shelf`}
                            >
                              {post.userName}
                            </Link>
                            <span className="text-zinc-500 font-bold">•</span>
                            <span className="text-xs text-zinc-400 font-normal">
                              {formatTimeAgo(post.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-0.5 font-normal truncate">
                            {post.userTitle && <span>{post.userTitle}</span>}
                            {post.userTitle && post.bookTitle && <span>•</span>}
                            {post.bookTitle && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="inline-flex items-center gap-1 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3 text-zinc-400" />
                                <span className="truncate max-w-[200px]">{post.bookTitle}</span>
                                {post.chapterNumber && (
                                  <span className="text-zinc-400 font-mono text-[11px]">(Ch. {post.chapterNumber})</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Text Content */}
                    {post.content && (
                      <p className="text-[15px] sm:text-base text-zinc-100 leading-snug font-bold whitespace-pre-line">
                        {post.content}
                      </p>
                    )}

                  {/* Quote Card (if type === 'quote') */}
                  {post.type === 'quote' && post.quoteText && (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-sm leading-relaxed space-y-2">
                      <Quote className="absolute top-3 right-3 w-5 h-5 text-zinc-500" />
                      <p className="relative z-10 font-serif italic text-zinc-100 text-[15px] leading-relaxed">
                        “{post.quoteText.replace(/^“+|”+$/g, '')}”
                      </p>
                      {post.bookTitle && (
                        <div className="pt-2 text-right text-xs text-zinc-400 font-medium">
                          — {post.bookTitle} {post.chapterNumber ? `(Ch. ${post.chapterNumber})` : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Media Attachment */}
                  {post.mediaUrl && (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-zinc-950 min-h-[320px] max-h-[620px] p-2 sm:p-3.5">
                      {/* Blurred Ambient Image Background (Reddit-Style) */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                        <img
                          src={post.mediaUrl}
                          alt=""
                          aria-hidden="true"
                          className="w-full h-full object-cover blur-3xl scale-135 opacity-75 filter brightness-95"
                        />
                        <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
                      </div>

                      {/* Foreground Image */}
                      <img
                        src={post.mediaUrl}
                        alt="Media Attachment"
                        className={`relative z-10 w-auto max-h-[580px] max-w-full object-contain rounded-xl shadow-2xl transition-opacity duration-200 ${
                          isSpoilerHidden ? 'filter blur-2xl scale-105' : ''
                        }`}
                        loading="lazy"
                      />

                      {/* Spoiler Overlay */}
                      {isSpoilerHidden && (
                        <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow">
                            <EyeOff className="w-4.5 h-4.5" />
                          </div>
                          <div className="font-bold text-white text-xs">Contains Spoiler</div>
                          <button
                            onClick={() => toggleSpoiler(post.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold transition-colors active:scale-95 hover:bg-zinc-200"
                          >
                            Reveal Spoiler
                          </button>
                        </div>
                      )}

                      {!isSpoilerHidden && post.isSpoiler && (
                        <button
                          onClick={() => toggleSpoiler(post.id)}
                          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 hover:bg-black text-zinc-300 text-[11px] px-2.5 py-1 rounded-md border border-white/10 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                          <span>Hide spoiler</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Footer Actions Bar (Pill buttons matching reference) */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {/* Heart / Like Button Pill */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(post.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                          post.hasLiked
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white'
                        }`}
                        title="Like"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            post.hasLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-300'
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>

                      {/* Speech Bubble / Comment Button Pill */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentsPanel(post.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                          activeCommentPostId === post.id
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white'
                        }`}
                        title="View comments in side panel"
                      >
                        <MessageCircle
                          className={`w-4 h-4 transition-colors ${
                            activeCommentPostId === post.id
                              ? 'fill-cyan-400/20 text-cyan-400'
                              : 'text-zinc-300'
                          }`}
                        />
                        <span>{post.commentsCount}</span>
                      </button>

                      {/* Repost Button Pill */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('Reposted to your followers!');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-emerald-400 text-xs font-semibold transition-all active:scale-95"
                        title="Repost"
                      >
                        <Repeat2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Repost</span>
                      </button>
                    </div>
                  </div>

                  {/* INLINE COMMENTS EXPANSION THREAD */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-200">
                      {/* Comments List */}
                      {postComments.length === 0 ? (
                        <div className="text-zinc-500 text-xs text-center py-2">
                          No comments yet. Be the first to start the conversation!
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {postComments.map(c => (
                            <div key={c.id} className="flex items-start gap-2.5 bg-white/[0.02] p-2 rounded-xl">
                              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                                <img
                                  src={resolveCommentAvatar(c)}
                                  alt={c.userName}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    (e.currentTarget as HTMLImageElement).src = '/community/avatar-butterbean.jpg';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-white">{c.userName}</span>
                                  <span className="text-[10px] text-zinc-500">{formatTimeAgo(c.createdAt)}</span>
                                </div>
                                <p className="text-xs text-zinc-300 leading-normal mt-0.5">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Comment Composer */}
                      <form
                        onSubmit={e => handleCommentSubmit(post.id, e)}
                        className="flex items-center gap-2 pt-1"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                          <img src={currentUserAvatar} alt={currentUserName} className="w-full h-full object-cover" />
                        </div>
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={e =>
                            setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Write a comment..."
                          className="flex-1 bg-[#161826] border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
                        />
                        <button
                          type="submit"
                          disabled={!commentInputs[post.id]?.trim() || submittingComment[post.id]}
                          className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          )}
        </div>

        {/* ===== COLUMN 3: Comments Shower Panel (Shown when comments are opened) ===== */}
        {activeCommentPostId && (
          <div className="lg:col-span-3 lg:col-start-9 xl:col-start-9 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar animate-in fade-in duration-200">
            {(() => {
              const activeCommentPost = posts.find(p => p.id === activeCommentPostId);
              const activePostComments = commentsMap[activeCommentPostId] || [];

              return (
                <div className="rounded-2xl bg-[#0f111a] border border-white/[0.08] p-4 sm:p-5 space-y-4 shadow-xl flex flex-col min-h-[380px]">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-white tracking-tight truncate">
                        Comments
                      </h3>
                      {activeCommentPost && (
                        <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
                          {activeCommentPost.commentsCount || activePostComments.length}
                        </span>
                      )}
                    </div>

                    {/* Close Comments button */}
                    <button
                      onClick={() => setActiveCommentPostId(null)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Close Comments"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Post Context Snippet */}
                  {activeCommentPost && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <img
                          src={resolvePostAvatar(activeCommentPost)}
                          alt={activeCommentPost.userName}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/community/avatar-butterbean.jpg';
                          }}
                        />
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {activeCommentPost.userName}
                        </span>
                        <span className="text-[11px] text-zinc-500 truncate">
                          • {formatTimeAgo(activeCommentPost.createdAt)}
                        </span>
                      </div>
                      {activeCommentPost.content && (
                        <p className="text-xs text-zinc-300 line-clamp-2 italic leading-relaxed">
                          &ldquo;{activeCommentPost.content}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Comments Thread List */}
                  <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 no-scrollbar flex-1">
                    {activePostComments.length === 0 ? (
                      <div className="text-center py-10 space-y-2 text-zinc-500">
                        <MessageCircle className="w-7 h-7 mx-auto text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs font-medium text-zinc-400">No comments yet</p>
                        <p className="text-[11px] text-zinc-500">Be the first to join the discussion!</p>
                      </div>
                    ) : (
                      activePostComments.map(comment => (
                        <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                          <img
                            src={resolveCommentAvatar(comment)}
                            alt={comment.userName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src = '/community/avatar-butterbean.jpg';
                            }}
                          />
                          <div className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-zinc-200">{comment.userName}</span>
                              <span className="text-[10px] text-zinc-500">{formatTimeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input Composer */}
                  {activeCommentPost && (
                    <form
                      onSubmit={e => handleCommentSubmit(activeCommentPost.id, e)}
                      className="pt-3 border-t border-white/[0.08] flex items-center gap-2 shrink-0"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                        <img src={currentUserAvatar} alt={currentUserName} className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="text"
                        value={commentInputs[activeCommentPost.id] || ''}
                        onChange={e =>
                          setCommentInputs(prev => ({ ...prev, [activeCommentPost.id]: e.target.value }))
                        }
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/[0.05] border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/50"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[activeCommentPost.id]?.trim() || submittingComment[activeCommentPost.id]}
                        className="w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center transition-all disabled:opacity-30 shrink-0 active:scale-95 shadow-sm"
                        title="Post comment"
                      >
                        <Send className="w-3.5 h-3.5 -rotate-45 mb-0.5" />
                      </button>
                    </form>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== COLUMN 4: Active Users Rail (Image 4) (Pinned to Right Side) ===== */}
        <div className="lg:col-span-1 lg:col-start-12 xl:col-start-12 hidden lg:flex flex-col items-center gap-3 pt-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar ml-auto">
          <div
            className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 mb-1"
            title={`Active Connections (${activeConnectedUsers.length})`}
          >
            <Users className="w-4 h-4" />
          </div>

          {activeConnectedUsers.length > 0 ? (
            activeConnectedUsers.map(friend => {
              const isFollowing = followedUserIds.has(friend.id);
              const isFollower = friend.isFollower;
              const guildNames = friend.sharedGuilds?.join(', ');
              const relationship = isFollowing && isFollower
                ? 'Mutual Connection'
                : isFollowing
                ? 'Following'
                : isFollower
                ? 'Follower'
                : 'Active Reader';

              return (
                <div
                  key={friend.id}
                  onClick={() => openChatWith(friend)}
                  className="relative group cursor-pointer"
                  title={`${friend.name} (${relationship})`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/15 shadow-sm group-hover:scale-110 group-hover:border-amber-400 transition-all bg-zinc-900">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = '/community/avatar-pegasus.jpg';
                      }}
                    />
                  </div>
                  {/* Emerald Glowing Online Dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0b0f]" />
                </div>
              );
            })
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedGlobalScope('Users');
                setIsSearchFocused(true);
              }}
              className="w-9 h-9 rounded-full border border-dashed border-white/20 hover:border-amber-400/60 flex items-center justify-center text-zinc-500 hover:text-amber-300 transition-all group"
              title="No active followers or club members yet. Click to search & connect!"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Post Creation Modal (Quote / Panel / Book Chapter) */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchPosts(); // Reload posts
        }}
      />

      {/* Direct Chat / Messages Modal (Image 5) */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        initialTargetUser={chatTargetUser}
      />
    </div>
  );
};
