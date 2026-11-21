'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Shield, Users, Plus, Check } from 'lucide-react';

interface ExploreGuildsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGuilds: any[];
  followedGuildIds: Set<string>;
  onToggleFollow: (guildId: string) => void;
  onOpenBuildGuild: () => void;
}

export const ExploreGuildsModal: React.FC<ExploreGuildsModalProps> = ({
  isOpen,
  onClose,
  allGuilds,
  followedGuildIds,
  onToggleFollow,
  onOpenBuildGuild
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    allGuilds.forEach(g => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set);
  }, [allGuilds]);

  const filteredGuilds = useMemo(() => {
    return allGuilds.filter(guild => {
      const matchesSearch =
        guild.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guild.description && guild.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'All' || guild.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allGuilds, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 select-none animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d0f18]/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                Explore Clubs
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {allGuilds.length} Available
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Discover reader factions, join discussions, and follow clubs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenBuildGuild();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Build Club</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-white/[0.06] space-y-3 shrink-0 bg-black/20">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search clubs by name or description..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 focus:border-blue-400/60 focus:outline-none text-xs text-white placeholder:text-zinc-500 transition-colors"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                      : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clubs List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {filteredGuilds.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Shield className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-xs font-semibold text-zinc-400">No clubs found</div>
              <p className="text-[11px] text-zinc-600">Try a different search query or build your own.</p>
            </div>
          ) : (
            filteredGuilds.map(guild => {
              const isFollowed = followedGuildIds.has(guild.id);
              return (
                <div
                  key={guild.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-white/15 shrink-0 bg-zinc-900 shadow-sm">
                      <img
                        src={guild.avatarUrl}
                        alt={guild.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = '/community/team-feyenoord.jpg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                          {guild.name}
                        </span>
                        {guild.category && (
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 hidden sm:inline-block">
                            {guild.category}
                          </span>
                        )}
                      </div>
                      {guild.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {guild.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-zinc-400" />
                          {guild.membersCount?.toLocaleString() || 1} members
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFollow(guild.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isFollowed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 group/btn'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-3 h-3 group-hover/btn:hidden" />
                        <span className="group-hover/btn:hidden">Following</span>
                        <span className="hidden group-hover/btn:inline">Unfollow</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
