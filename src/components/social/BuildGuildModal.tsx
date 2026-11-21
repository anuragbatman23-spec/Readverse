'use client';

import React, { useState } from 'react';
import { X, Shield, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

interface BuildGuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuildCreated: (guild: any) => void;
  currentUserId: string;
  currentUserName: string;
  initialName?: string;
}

const PRESET_CRESTS = [
  { label: 'Gojo Satoru', url: '/avatars/anime/11_satoru_gojo.png' },
  { label: 'Ryomen Sukuna', url: '/avatars/anime/12_ryomen_sukuna.png' },
  { label: 'Guts (Berserk)', url: '/avatars/anime/01_guts.png' },
  { label: 'Itachi Uchiha', url: '/avatars/anime/05_itachi_uchiha.png' },
  { label: 'Levi Ackerman', url: '/avatars/anime/09_levi_ackerman.png' },
  { label: 'Pegasus Crest', url: '/community/avatar-pegasus.jpg' },
  { label: 'Mystic Orb', url: '/community/chip-orb.jpg' },
  { label: 'Royal Crimson', url: '/community/team-feyenoord.jpg' }
];

const GUILD_CATEGORIES = [
  'Reading Club',
  'Action Manhwa',
  'Progression Fantasy',
  'Webnovels',
  'Cultivation',
  'Romance & Drama',
  'Mystery & Steampunk'
];

export const BuildGuildModal: React.FC<BuildGuildModalProps> = ({
  isOpen,
  onClose,
  onGuildCreated,
  currentUserId,
  currentUserName,
  initialName = ''
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(GUILD_CATEGORIES[0]);
  const [avatarUrl, setAvatarUrl] = useState(PRESET_CRESTS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a Club name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const finalAvatar = customAvatar.trim() || avatarUrl;

    try {
      const res = await fetch('/api/community/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          avatarUrl: finalAvatar,
          creatorId: currentUserId,
          creatorName: currentUserName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create club');
      }

      onGuildCreated(data.guild);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error('Error creating club:', err);
      setError(err.message || 'Something went wrong while building club.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 select-none animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0f18]/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all animate-in zoom-in-95 duration-200">
        
        {/* Top Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                Build a Club
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-[11px] text-zinc-400">
                Establish your fellowship of readers and discuss chapters together
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Club Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Club Name <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-zinc-500">Max 40 chars</span>
            </label>
            <input
              type="text"
              maxLength={40}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Shadow Monarchs, Grimoire Order, Solo Readers"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs sm:text-sm text-white placeholder:text-zinc-600 transition-colors"
              autoFocus
            />
          </div>

          {/* Tagline / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">
              Motto or Description
            </label>
            <textarea
              rows={2}
              maxLength={150}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does your club stand for? (e.g. Diving deep into chapter lore and theory-crafting)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs sm:text-sm text-white placeholder:text-zinc-600 resize-none transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">
              Club Focus / Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GUILD_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                    category === cat
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Emblem / Crest Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Club Crest / Emblem</span>
              <span className="text-[10px] text-zinc-500">Choose badge</span>
            </label>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {PRESET_CRESTS.map(crest => {
                const isSelected = !customAvatar.trim() && avatarUrl === crest.url;
                return (
                  <button
                    type="button"
                    key={crest.url}
                    onClick={() => {
                      setAvatarUrl(crest.url);
                      setCustomAvatar('');
                    }}
                    className={`relative p-2 rounded-xl flex flex-col items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 bg-zinc-900 shrink-0">
                      <img
                        src={crest.url}
                        alt={crest.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-300 font-medium truncate max-w-full">
                      {crest.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Avatar URL option */}
            <div className="pt-1 flex items-center gap-2">
              <div className="text-zinc-400 shrink-0">
                <ImageIcon className="w-3.5 h-3.5" />
              </div>
              <input
                type="url"
                value={customAvatar}
                onChange={e => setCustomAvatar(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 focus:border-amber-400/50 focus:outline-none text-xs text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Building...</span>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Build Club</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
