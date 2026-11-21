'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Globe, Check, Loader2, Sparkles, AlertCircle, BookOpen, Layers } from 'lucide-react';
import { Book, ContentCategory } from '@/types';

export interface SourceCandidate {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  coverImage?: string;
  author?: string;
  description?: string;
  genre?: string[];
  category?: ContentCategory;
  pluginId?: string;
  sourcePath?: string;
}

interface SourcePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  currentSourceId?: string;
  currentSourceName?: string;
  onSelectCandidate: (candidate: SourceCandidate) => Promise<void> | void;
}

interface SourceOption {
  id: string;
  name: string;
}

const NOVEL_SOURCES: SourceOption[] = [
  { id: 'all', name: 'All Sources' },
  { id: 'novelbuddy', name: 'NovelBuddy' },
  { id: 'lightnovelto', name: 'LightNovelPub' },
  { id: 'readnovelfull', name: 'ReadNovelFull' },
  { id: 'novelight', name: 'NovelLight' },
  { id: 'novelping', name: 'NovelPing' },
  { id: 'lnheaven', name: 'LNHeaven' },
  { id: 'novelfire', name: 'NovelFire' },
  { id: 'pawread', name: 'PawRead' }
];

const MANGA_SOURCES: SourceOption[] = [
  { id: 'all', name: 'All Sources' },
  { id: 'weebcentral', name: 'WeebCentral' },
  { id: 'mangadistrict', name: 'MangaDistrict' },
  { id: 'mangakatana', name: 'MangaKatana' },
  { id: 'flamecomics', name: 'Flame Comics' },
  { id: 'toongod', name: 'ToonGod' },
  { id: 'manhwabuddy', name: 'ManhwaBuddy' },
  { id: 'tcbscans', name: 'TCB Scans' },
  { id: 'webtoons', name: 'LINE Webtoon' },
  { id: 'mangapill', name: 'MangaPill' },
  { id: 'mangadex', name: 'MangaDex' }
];

const CLASSIC_SOURCES: SourceOption[] = [
  { id: 'all', name: 'All Classic Archives' },
  { id: 'gutenberg', name: 'Project Gutenberg' },
  { id: 'standardebooks', name: 'Standard Ebooks' }
];

export const SourcePickerModal: React.FC<SourcePickerModalProps> = ({
  isOpen,
  onClose,
  book,
  currentSourceId,
  onSelectCandidate
}) => {
  const isNovel = book.category === 'webnovel' || book.category === 'lightnovel';
  const isManga = book.category === 'manga' || book.category === 'manhwa';

  const availableSources = useMemo(() => {
    if (isNovel) return NOVEL_SOURCES;
    if (isManga) return MANGA_SOURCES;
    return CLASSIC_SOURCES;
  }, [isNovel, isManga]);

  // Clean initial query: remove parentheticals like (Official) or (Light Novel)
  const initialCleanQuery = useMemo(() => {
    return (book.title || '').replace(/\s*\([^)]*\)/g, '').trim();
  }, [book.title]);

  const [searchQuery, setSearchQuery] = useState(initialCleanQuery);
  const [selectedSource, setSelectedSource] = useState<string>(() => {
    if (currentSourceId && availableSources.some(s => s.id === currentSourceId)) {
      return currentSourceId;
    }
    return 'all';
  });
  const [candidates, setCandidates] = useState<SourceCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingId, setIsApplyingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialCleanQuery);
      if (currentSourceId && availableSources.some(s => s.id === currentSourceId)) {
        setSelectedSource(currentSourceId);
      } else {
        setSelectedSource('all');
      }
      setIsApplyingId(null);
      setErrorMsg(null);
    }
  }, [isOpen, initialCleanQuery, currentSourceId, availableSources]);

  // Search function
  const executeSearch = useCallback(async (query: string, sourceId: string) => {
    const q = query.trim();
    if (!q) {
      setCandidates([]);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isNovel) {
        const srcParam = sourceId !== 'all' ? `&source=${encodeURIComponent(sourceId)}` : '';
        const res = await fetch(`/api/webnovels/search?q=${encodeURIComponent(q)}${srcParam}`);
        if (!res.ok) throw new Error('Failed to fetch novel matches');
        const data = await res.json();
        const books: Book[] = data.books || [];

        const mapped: SourceCandidate[] = books.map(b => {
          const pId = b.pluginId || (b.id.startsWith('ln-') ? b.id.split(':')[0].replace('ln-', '') : 'novelbuddy');
          const sourceObj = NOVEL_SOURCES.find(s => s.id === pId);
          return {
            id: b.id,
            title: b.title,
            sourceId: pId,
            sourceName: sourceObj?.name || pId,
            coverImage: b.coverImage,
            author: b.author,
            description: b.description,
            genre: b.genre,
            category: b.category,
            pluginId: b.pluginId || pId,
            sourcePath: b.sourcePath
          };
        });
        setCandidates(mapped);
      } else if (isManga) {
        const srcParam = sourceId !== 'all' ? `&source=${encodeURIComponent(sourceId)}` : '';
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(q)}${srcParam}`);
        if (!res.ok) throw new Error('Failed to fetch manga matches');
        const data = await res.json();
        const books: Book[] = data.books || [];

        const mapped: SourceCandidate[] = books.map(b => {
          let sId = 'mangadex';
          if (b.id.startsWith('wc-')) sId = 'weebcentral';
          else if (b.id.startsWith('md-')) sId = 'mangadistrict';
          else if (b.id.startsWith('mk-')) sId = 'mangakatana';
          else if (b.id.startsWith('fc-')) sId = 'flamecomics';
          else if (b.id.startsWith('tg-')) sId = 'toongod';
          else if (b.id.startsWith('mb-')) sId = 'manhwabuddy';
          else if (b.id.startsWith('tcb-')) sId = 'tcbscans';
          else if (b.id.startsWith('wt-')) sId = 'webtoons';
          else if (b.id.startsWith('mp-')) sId = 'mangapill';

          const sourceObj = MANGA_SOURCES.find(s => s.id === sId);
          return {
            id: b.id,
            title: b.title,
            sourceId: sId,
            sourceName: sourceObj?.name || sId,
            coverImage: b.coverImage,
            author: b.author,
            description: b.description,
            genre: b.genre,
            category: b.category
          };
        });
        setCandidates(mapped);
      } else {
        // Classic books
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('Failed to fetch classic book matches');
        const data = await res.json();
        const books: Book[] = data.books || [];

        const mapped: SourceCandidate[] = books.map(b => ({
          id: b.id,
          title: b.title,
          sourceId: b.id.startsWith('gutenberg-') ? 'gutenberg' : 'standardebooks',
          sourceName: b.id.startsWith('gutenberg-') ? 'Project Gutenberg' : 'Standard Ebooks',
          coverImage: b.coverImage,
          author: b.author,
          description: b.description,
          genre: b.genre,
          category: 'book'
        }));
        setCandidates(mapped);
      }
    } catch (err: unknown) {
      console.warn('Error fetching source versions:', err);
      setErrorMsg('Could not fetch matches from this source. Please try another source or search query.');
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [isNovel, isManga, book.category]);

  // Run search when modal opens or source changes
  useEffect(() => {
    if (isOpen) {
      executeSearch(searchQuery, selectedSource);
    }
  }, [isOpen, selectedSource, executeSearch]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, selectedSource);
  };

  const handleSelect = async (candidate: SourceCandidate) => {
    if (isApplyingId) return;
    setIsApplyingId(candidate.id);
    try {
      await onSelectCandidate(candidate);
      onClose();
    } catch (err) {
      console.error('Error applying candidate version:', err);
      setErrorMsg('Failed to switch to this version. Please try another match.');
    } finally {
      setIsApplyingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#090b10]/95 border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06),0_0_35px_rgba(203,108,108,0.18)] backdrop-blur-3xl overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Top Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#CB6C6C]/15 via-[#CB6C6C]/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#CB6C6C]/60 to-transparent pointer-events-none" />

        {/* Clean Modern Header */}
        <div className="relative z-10 px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#CB6C6C] to-[#e28484] shadow-md shadow-[rgba(203,108,108,0.35)] ring-1 ring-white/20 flex items-center justify-center text-white flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black text-white tracking-tight">
                Switch Source & Version
              </h2>
              {candidates.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-zinc-400">
                  {candidates.length}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Clean Source Filter Tabs */}
        <div className="relative z-10 px-6 pt-4 pb-3 border-b border-white/[0.06] space-y-3">
          <form onSubmit={handleManualSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title on source..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-[#CB6C6C]/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#CB6C6C]/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-md shadow-[rgba(203,108,108,0.3)] cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Clean Source Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs">
            {availableSources.map(s => {
              const isSelected = selectedSource === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSource(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#CB6C6C] text-white font-bold border-[#CB6C6C] shadow-sm shadow-[rgba(203,108,108,0.35)] scale-[1.02]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/[0.06]'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-3 max-h-[58vh]">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#CB6C6C]/10 border border-[#CB6C6C]/25 text-[#fcdcdc] text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#CB6C6C]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#CB6C6C] animate-spin" />
              <p className="text-xs font-medium text-zinc-400">Searching sources...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-500">
                <BookOpen className="w-6 h-6 text-[#CB6C6C] opacity-50" />
              </div>
              <p className="text-sm font-bold text-zinc-200">No matches found</p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Try shortening your query or select another source above.
              </p>
            </div>
          ) : (
            candidates.map((cand) => {
              const isCurrent = cand.id === book.id || (cand.sourceId === currentSourceId && cand.title.toLowerCase() === book.title.toLowerCase());
              const isApplying = isApplyingId === cand.id;
              const hasCleanAuthor = cand.author && 
                !cand.author.toLowerCase().includes('contributor') && 
                !cand.author.toLowerCase().includes('admin');

              return (
                <div
                  key={cand.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                    isCurrent
                      ? 'bg-[#CB6C6C]/10 border-[#CB6C6C]/40 ring-1 ring-[#CB6C6C]/30'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/[0.08] shadow-md">
                      {cand.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={cand.coverImage}
                          alt={cand.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <BookOpen className="w-5 h-5 text-[#CB6C6C] opacity-40" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-zinc-300">
                          {cand.sourceName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                        {cand.category && (
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                            {cand.category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#CB6C6C] transition-colors truncate">
                        {cand.title}
                      </h3>

                      {hasCleanAuthor && (
                        <p className="text-xs text-zinc-400 truncate">
                          by <span className="text-zinc-300">{cand.author}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {isCurrent ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-default">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelect(cand)}
                        disabled={isApplying}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md shadow-[rgba(203,108,108,0.25)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Switching...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Switch</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
