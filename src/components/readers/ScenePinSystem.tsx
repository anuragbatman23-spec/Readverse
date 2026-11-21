'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Pin, 
  Heart, 
  X, 
  Send, 
  User
} from 'lucide-react';

export interface ScenePinComment {
  id: string;
  author: string;
  text: string;
  likes: number;
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

interface ScenePinSystemProps {
  panelIndex: number;
  pins: ScenePinSpot[];
  isVisible: boolean;
  isPinPlacementActive: boolean;
  onAddCommentToSpot: (panelIndex: number, yPercent: number, text: string) => void;
  onToggleLike: (spotId: string, commentId: string) => void;
  onExitPlacementMode: () => void;
  currentUserAvatar?: string;
  currentUserName?: string;
}

const AVATAR_GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-indigo-600',
  'from-rose-500 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600'
];

export const ScenePinSystem: React.FC<ScenePinSystemProps> = ({
  panelIndex,
  pins,
  isVisible,
  isPinPlacementActive,
  onAddCommentToSpot,
  onToggleLike,
  onExitPlacementMode,
  currentUserAvatar,
  currentUserName
}) => {
  // Placement Line state
  const [hoverYPercent, setHoverYPercent] = useState<number | null>(null);
  const [selectedYPercent, setSelectedYPercent] = useState<number | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  // Hover / Click flyout card state
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setActiveSpotId(null);
      }
    };
    if (activeSpotId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSpotId]);

  // Handle mouse move for laser placement line
  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinPlacementActive || isComposerOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    setHoverYPercent(Math.round(percent * 10) / 10);
  };

  const handlePanelMouseLeave = () => {
    if (!isComposerOpen) {
      setHoverYPercent(null);
    }
  };

  // Click on panel to lock line & open composer
  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinPlacementActive || isComposerOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    const rounded = Math.round(percent * 10) / 10;
    setSelectedYPercent(rounded);
    setHoverYPercent(rounded);
    setIsComposerOpen(true);
    e.stopPropagation();
  };

  const handleCancelComposer = () => {
    setIsComposerOpen(false);
    setSelectedYPercent(null);
    setHoverYPercent(null);
    setNewCommentText('');
    onExitPlacementMode();
  };

  const handleSaveComposer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || selectedYPercent === null) return;
    onAddCommentToSpot(panelIndex, selectedYPercent, newCommentText.trim());
    setIsComposerOpen(false);
    setSelectedYPercent(null);
    setHoverYPercent(null);
    setNewCommentText('');
    onExitPlacementMode();
  };

  const handleReplySubmit = (spotId: string, yPercent: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddCommentToSpot(panelIndex, yPercent, replyText.trim());
    setReplyText('');
  };

  return (
    <div 
      className={`absolute inset-0 select-none ${isPinPlacementActive ? 'cursor-crosshair z-30' : 'pointer-events-none'}`}
      onMouseMove={handlePanelMouseMove}
      onMouseLeave={handlePanelMouseLeave}
      onClick={handlePanelClick}
    >
      {/* 1. Placement Laser Guide Line (Only during Pin Mode) */}
      {isPinPlacementActive && hoverYPercent !== null && (
        <div 
          className="absolute left-0 right-0 pointer-events-none z-40 transition-all duration-75 flex items-center"
          style={{ top: `${hoverYPercent}%` }}
        >
          {/* Laser Line */}
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#CB6C6C] to-[#CB6C6C] shadow-[0_0_12px_rgba(203,108,108,1)]" />

          {/* Floating Tag */}
          <div className="absolute right-3 -top-3.5 px-2.5 py-1 rounded-full bg-[#CB6C6C] text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
            <Pin className="w-2.5 h-2.5 fill-current" />
            <span>Click to Pin</span>
          </div>
        </div>
      )}

      {/* 2. Anchored Mini Thought Composer Popup (Appears on click) */}
      {isComposerOpen && selectedYPercent !== null && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-[92%] sm:w-[420px] animate-in zoom-in-95 duration-150"
          style={{ 
            top: selectedYPercent > 70 ? `${Math.max(10, selectedYPercent - 32)}%` : `${selectedYPercent + 2}%` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <form 
            onSubmit={handleSaveComposer}
            className="relative rounded-3xl bg-[#090b10]/95 border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(203,108,108,0.2)] backdrop-blur-3xl p-4 sm:p-5 space-y-3.5"
          >
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#CB6C6C]/15 to-transparent rounded-t-3xl pointer-events-none" />

            {/* Minimal Header */}
            <div className="relative flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/20 bg-[#CB6C6C]/20 flex items-center justify-center shrink-0">
                  {currentUserAvatar ? (
                    <img
                      src={currentUserAvatar}
                      alt="You"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#CB6C6C]">{(currentUserName || 'Y').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CB6C6C]/15 border border-[#CB6C6C]/30 text-[#CB6C6C] text-[10px] font-bold tracking-wider uppercase">
                  <Pin className="w-2.5 h-2.5 fill-current" />
                  <span>Pin Thought</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCancelComposer}
                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Drop your thought on this exact scene..."
              rows={3}
              autoFocus
              required
              className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3.5 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-[#CB6C6C]/60 focus:bg-white/[0.05] resize-none font-normal transition-all"
            />

            {/* Clean Modern Footer */}
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleCancelComposer}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 disabled:opacity-30 disabled:scale-100 text-white font-black text-xs sm:text-sm shadow-lg shadow-[rgba(203,108,108,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Pin Thought
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Floating Right-Edge Avatar Circles (Unobtrusive & Clean) */}
      {isVisible && !isPinPlacementActive && pins.map((spot, idx) => {
        const topComment = spot.comments[0];
        if (!topComment) return null;
        const commentCount = spot.comments.length;
        const isFlyoutOpen = activeSpotId === spot.id;
        const avatarGradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];

        return (
          <div
            key={spot.id}
            style={{ top: `${spot.yPercent}%` }}
            className="absolute left-[calc(100%+12px)] -translate-y-1/2 z-30 pointer-events-auto"
          >
            {/* Circular Avatar Badge (Outside Right of Panel) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveSpotId(isFlyoutOpen ? null : spot.id);
              }}
              onMouseEnter={() => setActiveSpotId(spot.id)}
              className="group/avatar relative w-9 h-9 sm:w-10 sm:h-10 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ring-2 ring-[#CB6C6C]/85 ring-offset-2 ring-offset-black/90 shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(203,108,108,0.4)] hover:shadow-[0_4px_25px_rgba(0,0,0,1),0_0_22px_rgba(203,108,108,0.7)]"
              title={`View ${commentCount} scene reaction(s)`}
            >
              {/* Avatar Bubble */}
              <div className={`w-full h-full rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-black text-xs uppercase shadow-inner overflow-hidden`}>
                {topComment.avatarUrl ? (
                  <img
                    src={topComment.avatarUrl}
                    alt={topComment.author}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{topComment.author.charAt(0) || <User className="w-4 h-4" />}</span>
                )}
              </div>

              {/* Pin Icon Badge */}
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-[#0a0d14] border border-[#CB6C6C]/80 flex items-center justify-center text-[#CB6C6C] shadow-[0_0_8px_rgba(203,108,108,0.5)]">
                <Pin className="w-2.5 h-2.5 fill-current" />
              </div>

              {/* Comment Count Badge (if > 1) */}
              {commentCount > 1 && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 font-black text-[9px] shadow-sm">
                  {commentCount}
                </div>
              )}
            </div>

            {/* 4. Interactive Flyout Box (Slides out on hover / click) */}
            {isFlyoutOpen && (
              <div
                ref={flyoutRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-[calc(100%+14px)] top-1/2 -translate-y-1/2 w-[320px] sm:w-[350px] rounded-3xl bg-[#090b10]/95 border border-white/[0.12] shadow-[0_24px_60px_-10px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05),0_0_30px_rgba(203,108,108,0.15)] backdrop-blur-3xl p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 slide-in-from-right-2 duration-150 text-left"
              >
                {/* Ambient Top Glow */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#CB6C6C]/15 to-transparent rounded-t-3xl pointer-events-none" />

                {/* Sleek Pointer Connector Arrow */}
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#090b10] border-t border-r border-white/[0.15] rotate-45 pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-end">
                  <button
                    onClick={() => setActiveSpotId(null)}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Comments Thread List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {spot.comments.map((c, cIdx) => (
                    <div 
                      key={c.id || cIdx}
                      className="group relative p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-150"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full ring-1 ring-white/20 overflow-hidden bg-[#CB6C6C]/20 flex items-center justify-center shrink-0">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt={c.author}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-[9px] font-black text-[#CB6C6C]">{c.author.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="font-semibold text-xs text-zinc-100 truncate max-w-[130px]">
                            @{c.author}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                          {c.createdAt || 'Just now'}
                        </span>
                      </div>

                      <p className="text-[13px] text-zinc-200 font-normal leading-relaxed break-words pl-7">
                        {c.text}
                      </p>

                      <div className="flex items-center justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => onToggleLike(spot.id, c.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                            c.isLiked
                              ? 'bg-[#CB6C6C]/20 text-[#CB6C6C] border border-[#CB6C6C]/40 shadow-[0_0_10px_rgba(203,108,108,0.25)]'
                              : 'bg-white/[0.04] text-zinc-400 hover:text-[#CB6C6C] hover:bg-[#CB6C6C]/10 border border-white/[0.06]'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${c.isLiked ? 'fill-[#CB6C6C] text-[#CB6C6C]' : 'text-zinc-400'}`} />
                          <span>{c.likes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Reply Form */}
                <form 
                  onSubmit={(e) => handleReplySubmit(spot.id, spot.yPercent, e)}
                  className="relative flex items-center gap-2 p-1 pl-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-[#CB6C6C]/60 focus-within:bg-white/[0.06] transition-all"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/20 bg-[#CB6C6C]/20 flex items-center justify-center shrink-0">
                    {currentUserAvatar ? (
                      <img
                        src={currentUserAvatar}
                        alt="You"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-[#CB6C6C]">{(currentUserName || 'Y').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply to this scene..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-normal"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="w-7 h-7 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 disabled:opacity-30 disabled:scale-100 text-white flex items-center justify-center transition-all shadow-md shadow-[rgba(203,108,108,0.3)] hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                    title="Send Reply"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
