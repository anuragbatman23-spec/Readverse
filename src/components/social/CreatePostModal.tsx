'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Camera, 
  Quote, 
  Send, 
  EyeOff, 
  Eye, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ContentCategory } from '../../types';
import { useActiveTheme } from '../../utils/themeSystem';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuote?: string;
  initialMediaUrl?: string;
  initialBookTitle?: string;
  initialCategory?: ContentCategory;
  initialChapterNum?: number;
}

const QUICK_TAGS = ['#hype', '#peak', '#reaction', '#cliffhanger', '#aura'];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  initialQuote = '',
  initialMediaUrl = '',
  initialBookTitle = 'The Shadow Monarch',
  initialCategory = 'manhwa',
  initialChapterNum = 1
}) => {
  const theme = useActiveTheme();
  const { createPost } = useApp();

  const [content, setContent] = useState('');
  const [quoteText, setQuoteText] = useState(initialQuote);
  const [mediaUrl, setMediaUrl] = useState(initialMediaUrl);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [postType, setPostType] = useState<'quote' | 'panel' | 'milestone'>(
    initialMediaUrl ? 'panel' : initialQuote ? 'quote' : 'panel'
  );

  useEffect(() => {
    if (isOpen) {
      setQuoteText(initialQuote);
      setMediaUrl(initialMediaUrl);
      if (initialMediaUrl) {
        setPostType('panel');
        setContent(initialQuote ? `"${initialQuote}"` : '');
      } else if (initialQuote) {
        setPostType('quote');
        setContent('');
      } else {
        setPostType('panel');
        setContent('');
      }
      setIsSpoiler(false);
    }
  }, [isOpen, initialQuote, initialMediaUrl]);

  if (!isOpen) return null;

  const handleAddTag = (tag: string) => {
    setContent(prev => {
      const trimmed = prev.trim();
      if (trimmed.includes(tag)) return prev;
      return trimmed ? `${trimmed} ${tag}` : tag;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !quoteText.trim() && !mediaUrl.trim()) return;

    let currentUserAvatar = '/community/avatar-pegasus.jpg';
    try {
      const saved = localStorage.getItem('readverse_custom_avatar');
      if (saved) currentUserAvatar = saved;
    } catch (_) {}

    try {
      await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          quoteText: postType === 'quote' ? quoteText : undefined,
          mediaUrl: postType === 'panel' ? mediaUrl : undefined,
          bookTitle: initialBookTitle,
          bookCategory: initialCategory,
          chapterNumber: initialChapterNum,
          type: postType,
          isSpoiler,
          spoilerChapter: isSpoiler ? initialChapterNum : undefined,
          userAvatar: currentUserAvatar
        })
      });
    } catch (err) {
      console.error('Failed to save post to backend:', err);
    }

    createPost({
      content: content.trim(),
      quoteText: postType === 'quote' ? quoteText : undefined,
      mediaUrl: postType === 'panel' ? mediaUrl : undefined,
      bookTitle: initialBookTitle,
      bookCategory: initialCategory,
      chapterNumber: initialChapterNum,
      type: postType,
      isSpoiler,
      spoilerChapter: isSpoiler ? initialChapterNum : undefined,
      userAvatar: currentUserAvatar
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in select-none">
      <div className={`relative w-full max-w-lg rounded-3xl border ${theme.cardBorder} ${theme.cardBg} overflow-hidden transition-all animate-in zoom-in-95 duration-200`} style={{ boxShadow: theme.cardShadow }}>
        
        {/* Sleek Top Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none" style={{ background: `linear-gradient(to bottom, rgba(${theme.accentRgb}, 0.16), rgba(${theme.accentRgb}, 0.04), transparent)` }} />
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] pointer-events-none" style={{ background: `linear-gradient(to right, transparent, rgba(${theme.accentRgb}, 0.6), transparent)` }} />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            {/* Post Icon Badge */}
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20 transition-all" style={{ background: `linear-gradient(135deg, ${theme.accentHex}, rgba(${theme.accentRgb}, 0.75))`, boxShadow: `0 4px 14px rgba(${theme.accentRgb}, 0.35)` }}>
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black tracking-tight ${theme.textPrimary}`}>Create Post</span>
                <span style={{ color: theme.accentHex, backgroundColor: `rgba(${theme.accentRgb}, 0.12)`, borderColor: `rgba(${theme.accentRgb}, 0.3)` }}
                className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border">
                  {initialCategory}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentHex }} />
                <span className="font-semibold text-zinc-300 truncate max-w-[200px] sm:max-w-[280px]">
                  {initialBookTitle}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-300 font-medium">Ch. {initialChapterNum}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${theme.closeBtnClasses}`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-4">
          {/* Post Type Selector (Only if not directly cropping a panel) */}
          {!initialMediaUrl && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPostType('panel')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all font-bold ${
                  postType === 'panel'
                    ? 'shadow-sm'
                    : `${theme.inputBg} ${theme.inputBorder} ${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
                style={postType === 'panel' ? { backgroundColor: `rgba(${theme.accentRgb}, 0.18)`, color: theme.accentHex, borderColor: `rgba(${theme.accentRgb}, 0.4)` } : {}}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Panel Image</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('quote')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all font-bold ${
                  postType === 'quote'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/20'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Quote Card</span>
              </button>
            </div>
          )}

          {/* Attached Cropped Image Showcase */}
          {postType === 'panel' && (
            <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/[0.1] group shadow-inner">
              {mediaUrl ? (
                <div className="relative w-full flex justify-center items-center min-h-[220px] max-h-[300px] p-2 overflow-hidden rounded-xl bg-zinc-950/80">
                  {/* Blurred Ambient Image Background (Reddit-Style) */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover blur-3xl scale-135 opacity-40 filter brightness-75"
                    />
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl}
                    alt="Panel Snapshot"
                    className={`relative z-10 max-w-full max-h-[280px] object-contain rounded-xl transition-all duration-300 shadow-2xl border border-white/[0.08] ${
                      isSpoiler ? 'blur-xl scale-105 opacity-60' : 'opacity-100'
                    }`}
                  />

                  {/* Spoiler Overlay Preview Badge */}
                  {isSpoiler && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-md pointer-events-none">
                      <div className="w-9 h-9 rounded-2xl bg-[#CB6C6C]/20 border border-[#CB6C6C]/40 flex items-center justify-center shadow-lg shadow-[rgba(203,108,108,0.25)]">
                        <EyeOff className="w-4 h-4 text-[#CB6C6C]" />
                      </div>
                      <span className="text-xs font-black text-white tracking-wide">
                        Spoiler Protected
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="Paste Image URL..."
                  className="w-full bg-white/[0.04] p-3 text-xs text-zinc-100 focus:outline-none"
                />
              )}
            </div>
          )}

          {/* Quote Input (If quote mode) */}
          {postType === 'quote' && (
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder="Paste quote from chapter..."
              rows={3}
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#CB6C6C]/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#CB6C6C]/30 transition-all font-serif italic"
            />
          )}

          {/* Thoughts Input */}
          <div className="space-y-2.5">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows={3}
              required
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#CB6C6C]/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#CB6C6C]/30 transition-all resize-none font-medium"
            />

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-[#CB6C6C] hover:border-[#CB6C6C]/40 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Spoiler Protection Toggle Switch */}
          <div 
            onClick={() => setIsSpoiler(!isSpoiler)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] cursor-pointer transition-all group select-none"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                isSpoiler ? 'bg-[#CB6C6C]/20 text-[#CB6C6C] border border-[#CB6C6C]/30' : 'bg-white/[0.05] text-zinc-400 border border-white/[0.06]'
              }`}>
                {isSpoiler ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                Spoiler Protection
              </div>
            </div>

            {/* iOS-Style Toggle Switch with #CB6C6C Glow */}
            <div className={`w-11 h-6 rounded-full transition-all relative p-0.5 border ${
              isSpoiler 
                ? 'bg-[#CB6C6C] border-[#CB6C6C] shadow-[0_0_12px_rgba(203,108,108,0.5)]' 
                : 'bg-white/[0.06] border-white/10'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                isSpoiler ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>

          {/* Clean Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] text-white font-black text-xs sm:text-sm hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[rgba(203,108,108,0.35)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white fill-white" />
              <span>Publish Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
