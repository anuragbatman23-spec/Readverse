'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Flame,
  Coins,
  Users,
  TrendingUp,
  AlertTriangle,
  History,
  X,
  User,
  Award,
  Clock,
  ChevronRight,
  LogOut,
  Lock
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

interface NavbarProps {
  currentTab: 'library' | 'feed' | 'profile';
  setCurrentTab: (tab: 'library' | 'feed' | 'profile') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    stats,
    antiCheatAlert,
    transactions
  } = useApp();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const { data: session } = useSession();

  // Load custom profile avatar if saved & listen for live avatar updates
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

  // Live boost countdown string - only active when Profile modal is open to eliminate unnecessary 1s re-renders
  useEffect(() => {
    if (!isProfileOpen || !stats.boostExpiresAt) {
      setBoostTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const diff = stats.boostExpiresAt! - Date.now();
      if (diff <= 0) {
        setBoostTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setBoostTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isProfileOpen, stats.boostExpiresAt]);

  return (
    <>
      {/* Split Floating Top Head Bar into Two Floating Pods */}
      <header className="sticky top-2.5 sm:top-4 z-40 w-full px-3 sm:px-6 lg:px-10 xl:px-12 pointer-events-none mb-1 sm:mb-2">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left Pod / Bar: Brand & Logo */}
          <div className="pointer-events-auto relative group">
            {/* Ambient subtle backglow */}
            <div className="absolute -inset-1 rounded-2xl sm:rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-violet-600/20 blur-md opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none -z-10" />
            <button
              onClick={() => setCurrentTab('library')}
              className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl sm:rounded-full bg-[#090b16]/92 backdrop-blur-2xl border border-white/[0.12] hover:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 flex items-center justify-center text-white font-black shadow-md shadow-violet-500/30 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-black text-sm sm:text-base tracking-tight leading-none flex items-center gap-1">
                  <span className="text-white">Read</span>
                  <span className="gradient-text-rainbow font-extrabold">Verse</span>
                </h1>
                <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent font-bold leading-tight block">
                  Read • Flex • Earn
                </span>
              </div>
            </button>
          </div>

          {/* Right Pod / Bar: Account Profile */}
          <div className="pointer-events-auto relative group">
            {/* Ambient subtle backglow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-amber-500/20 blur-md opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none -z-10" />
            <div className="flex items-center p-1 sm:p-1.5 rounded-full bg-[#090b16]/92 backdrop-blur-2xl border border-white/[0.12] hover:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all">
              {/* Account Profile or Sign In Button */}
              {session?.user ? (
                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`flex items-center gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border text-white transition-all active:scale-95 group/prof shadow-sm ${
                    currentTab === 'profile'
                      ? 'bg-white/20 border-cyan-400 ring-2 ring-cyan-400/30'
                      : 'bg-gradient-to-r from-white/[0.05] to-white/[0.08] hover:from-white/[0.1] hover:to-white/[0.14] border-white/10 hover:border-cyan-400/50'
                  }`}
                  title="Open Account Profile & Stats"
                >
                  <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-cyan-400 via-violet-500 to-fuchsia-500 p-[1.5px] shadow-sm">
                    <div className="w-full h-full rounded-full bg-[#090b16] flex items-center justify-center overflow-hidden">
                      {(customAvatar || session.user.image) ? (
                        <img
                          src={(customAvatar || session.user.image) as string}
                          alt={session.user.name || 'User avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-cyan-300 group-hover/prof:scale-110 transition-transform" />
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#090b16]" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left pr-1 leading-tight">
                    <span className="text-xs font-bold text-zinc-200 group-hover/prof:text-white truncate max-w-[70px]">
                      {session.user.name?.split(' ')[0] || 'Profile'}
                    </span>
                    <span className="text-[9px] font-semibold text-cyan-400">Online</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-cyan-500/20 border border-cyan-300/40 transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Bottom-Center Balanced & Ultra-Modern Navigation Dock */}
      <div className="bottom-nav-dock fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none max-w-[95vw]">
        {/* Elevated Obsidian Glass Dock */}
        <nav
          aria-label="Bottom Navigation Bar"
          className="flex items-center gap-1 p-1.5 rounded-full bg-[#0c0e18]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-black/50"
        >
          {/* Library Tab */}
          <button
            onClick={() => setCurrentTab('library')}
            className={`group flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
              currentTab === 'library'
                ? 'bg-white text-zinc-950 font-bold shadow-sm shadow-black/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] font-medium'
            }`}
          >
            <BookOpen
              className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                currentTab === 'library' ? 'text-zinc-950 stroke-[2.4]' : 'text-zinc-400 group-hover:text-white stroke-[2]'
              }`}
            />
            <span className="tracking-tight">Library</span>
          </button>

          {/* Community Tab */}
          <button
            onClick={() => {
              if (!session?.user) {
                setIsAuthModalOpen(true);
                return;
              }
              setCurrentTab('feed');
            }}
            className={`group flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
              currentTab === 'feed'
                ? 'bg-white text-zinc-950 font-bold shadow-sm shadow-black/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] font-medium'
            }`}
          >
            <Users
              className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                currentTab === 'feed' ? 'text-zinc-950 stroke-[2.4]' : 'text-zinc-400 group-hover:text-white stroke-[2]'
              }`}
            />
            <span className="tracking-tight">Community</span>
            {!session?.user && (
              <Lock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
            )}
          </button>
        </nav>
      </div>

      {/* Points Ledger / Transaction History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <span>Points Transaction Ledger</span>
              </h3>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs hover:border-white/15 transition-colors"
                >
                  <div className="space-y-0.5 max-w-[240px]">
                    <div className="font-semibold text-white truncate">{tx.title}</div>
                    <div className="text-[11px] text-zinc-400">{tx.timestamp}</div>
                  </div>
                  <div
                    className={`font-black font-mono text-sm ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Total Balance:</span>
              <span className="font-extrabold text-amber-300 font-mono text-base">
                {stats.points.toLocaleString()} points
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0e1c]/95 backdrop-blur-2xl p-6 shadow-2xl space-y-5 text-white">
            {/* Top User Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px] shadow-lg shadow-indigo-500/30">
                  <div className="w-full h-full rounded-[14px] bg-[#090b16] flex items-center justify-center overflow-hidden">
                    {(customAvatar || session?.user?.image) ? (
                      <img
                        src={(customAvatar || session?.user?.image) as string}
                        alt={session?.user?.name || 'User avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-cyan-300" />
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0e1c] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">
                      {session?.user?.name || 'Master Reader'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      {session?.user ? 'Verified Reader' : 'Guest'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {session?.user?.email || 'Sign in with Google to sync stats'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="text-amber-400 text-xs font-bold flex items-center justify-center gap-1 mb-1">
                  <Coins className="w-3.5 h-3.5" />
                  Points
                </div>
                <div className="font-mono font-extrabold text-sm text-white">{stats.points.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="text-orange-400 text-xs font-bold flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  Streak
                </div>
                <div className="font-mono font-extrabold text-sm text-white">{stats.currentStreakDays} Days</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="text-cyan-400 text-xs font-bold flex items-center justify-center gap-1 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Chapters
                </div>
                <div className="font-mono font-extrabold text-sm text-white">{stats.totalChaptersRead}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="text-purple-400 text-xs font-bold flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Minutes
                </div>
                <div className="font-mono font-extrabold text-sm text-white">{stats.readingMinutes}m</div>
              </div>
            </div>

            {/* Reading Progression */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Scholar Tier Progression
                </span>
                <span className="font-bold text-amber-300">75% to Level 6</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 w-3/4" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Words read: {stats.totalWordsRead.toLocaleString()}</span>
                <span>Next tier: 25,000 words</span>
              </div>
            </div>

            {/* Booster Status if Active */}
            {boostTimeLeft && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
                  <span className="text-xs font-bold text-amber-200">2x Multiplier Active</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-300">{boostTimeLeft}</span>
              </div>
            )}

            {/* Profile Action Links */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsHistoryOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-zinc-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <span>View Points Transaction Ledger</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Sign In or Sign Out Action */}
              {session?.user ? (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Google</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Google Sign In */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
