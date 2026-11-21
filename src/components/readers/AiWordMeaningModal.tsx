'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Volume2, 
  Copy, 
  Check, 
  BookOpen, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { DictionaryEntry, DictionarySourceResult } from '../../types/dictionary';
import { 
  getOfflineDefinition, 
  getCachedDefinition, 
  saveCachedDefinition 
} from '../../utils/offlineDictionary';

interface AiWordMeaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
}

const SUGGESTED_CHIPS = [
  'Cultivation',
  'Murim',
  'Dantian',
  'Constellation',
  'Shadow Monarch',
  'Serendipity',
  'Ethereal',
  'Isekai',
  'Regressor',
  'Demonic Cult'
];

export const AiWordMeaningModal: React.FC<AiWordMeaningModalProps> = ({
  isOpen,
  onClose,
  initialWord = ''
}) => {
  const [activeTab, setActiveTab] = useState<'definitions' | 'context'>('definitions');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [availableSources, setAvailableSources] = useState<DictionarySourceResult[]>([]);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [loreContext, setLoreContext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Explanation depth control (Brief vs Full)
  const [detailMode, setDetailMode] = useState<'brief' | 'full'>('brief');

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readverse_dict_depth');
      if (saved === 'brief' || saved === 'full') {
        setDetailMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetDetailMode = (mode: 'brief' | 'full') => {
    setDetailMode(mode);
    try {
      localStorage.setItem('readverse_dict_depth', mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      const term = initialWord.trim() || '';
      setSearchTerm(term);
      if (term) {
        lookupWord(term);
      } else {
        setEntry(null);
        setAvailableSources([]);
        setSelectedSourceIndex(0);
        setLoreContext(null);
        setError(null);
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    }
  }, [isOpen, initialWord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const lookupWord = async (rawWord: string) => {
    const word = rawWord.trim();
    if (!word) return;

    setError(null);
    setSearchTerm(word);

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }

    // 1. Instant Local / Offline Lookup (0ms)
    const cached = getCachedDefinition(word);
    const offline = getOfflineDefinition(word);
    const instantMatch = cached || offline;

    if (instantMatch) {
      setEntry(instantMatch);
      setAvailableSources([{
        source: instantMatch.source,
        label: instantMatch.source === 'local' ? 'ReadVerse Lore' : 'Cached',
        entry: instantMatch
      }]);
      setSelectedSourceIndex(0);
      setLoreContext(instantMatch.loreContext || null);
    } else {
      setEntry(null);
      setAvailableSources([]);
      setLoading(true);
    }

    // 2. Query Live Multi-Source Dictionary API
    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.sources && json.sources.length > 0) {
          setAvailableSources(json.sources);
          setSelectedSourceIndex(0);
          const primary = json.sources[0].entry;
          setEntry(primary);
          saveCachedDefinition(primary);
          setLoreContext(primary.loreContext || null);
          setLoading(false);
          return;
        } else if (json.success && json.data) {
          const apiEntry: DictionaryEntry = json.data;
          setEntry(apiEntry);
          setAvailableSources([{
            source: apiEntry.source,
            label: apiEntry.source === 'local' ? 'ReadVerse Lore' : 'Dictionary',
            entry: apiEntry
          }]);
          setSelectedSourceIndex(0);
          saveCachedDefinition(apiEntry);
          setLoreContext(apiEntry.loreContext || null);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore network errors and keep instant match if present
    }

    if (instantMatch) {
      setLoading(false);
      return;
    }

    setLoading(false);
    setError(`No definition found for "${word}".`);
  };

  const handleSelectSource = (index: number) => {
    setSelectedSourceIndex(index);
    const chosen = availableSources[index];
    if (chosen) {
      setEntry(chosen.entry);
      setLoreContext(chosen.entry.loreContext || null);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
    }
  };

  const handlePlayAudio = () => {
    if (!entry) return;

    if (entry.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(entry.audioUrl);
      audioRef.current = audio;
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        fallbackSpeechSynthesis(entry.word);
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        fallbackSpeechSynthesis(entry.word);
      });
      return;
    }

    fallbackSpeechSynthesis(entry.word);
  };

  const fallbackSpeechSynthesis = (wordToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = () => {
    if (!entry) return;
    const definitionsText = entry.meanings
      .map(m => `[${m.partOfSpeech}]\n` + m.definitions.map((d, i) => `${i + 1}. ${d.definition}${d.example ? `\n   "${d.example}"` : ''}`).join('\n'))
      .join('\n\n');

    const formatted = `${entry.word} ${entry.phonetic ? `(${entry.phonetic})` : ''}\n\n${definitionsText}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-xl bg-[#090b10]/95 border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06),0_0_35px_rgba(203,108,108,0.18)] backdrop-blur-3xl overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Top Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#CB6C6C]/15 via-[#CB6C6C]/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#CB6C6C]/60 to-transparent pointer-events-none" />

        {/* Clean Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#CB6C6C] to-[#e28484] shadow-md shadow-[rgba(203,108,108,0.35)] ring-1 ring-white/20 flex items-center justify-center text-white flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-white tracking-tight">
              Dictionary
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Detail Mode Toggle: Brief vs Full */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleSetDetailMode('brief')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  detailMode === 'brief'
                    ? 'bg-[#CB6C6C] text-white shadow-sm shadow-[rgba(203,108,108,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Brief
              </button>
              <button
                type="button"
                onClick={() => handleSetDetailMode('full')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  detailMode === 'full'
                    ? 'bg-[#CB6C6C] text-white shadow-sm shadow-[rgba(203,108,108,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Full
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input & Quick Chips */}
        <div className="relative z-10 px-6 pt-4 pb-3 border-b border-white/[0.06] space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookupWord(searchTerm);
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dictionary or term..."
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-[#CB6C6C]/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#CB6C6C]/30 transition-all"
            />
            <div className="absolute right-1.5 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md shadow-[rgba(203,108,108,0.3)]"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Lookup</span>
              </button>
            </div>
          </form>

          {/* Quick Terms Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs">
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSearchTerm(chip);
                  lookupWord(chip);
                }}
                className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-[#CB6C6C]/15 hover:text-[#CB6C6C] border border-white/[0.08] hover:border-[#CB6C6C]/40 text-xs font-semibold text-zinc-300 whitespace-nowrap transition-all cursor-pointer active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Source Selector Pills (Allows user to choose from multiple available outputs) */}
          {availableSources.length > 1 && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06] overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mr-1 shrink-0">
                Sources ({availableSources.length}):
              </span>
              {availableSources.map((s, idx) => {
                const isSelected = selectedSourceIndex === idx;
                return (
                  <button
                    key={s.source + idx}
                    type="button"
                    onClick={() => handleSelectSource(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#CB6C6C] text-white shadow-sm shadow-[rgba(203,108,108,0.35)] scale-[1.02]'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <span>{s.label}</span>
                    {s.entry.audioUrl && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80" title="Audio pronunciation included" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Context Tab Switcher (if context exists) */}
          {entry && loreContext && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveTab('definitions')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'definitions'
                    ? 'bg-[#CB6C6C] text-white shadow-sm shadow-[rgba(203,108,108,0.3)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Definitions
              </button>
              <button
                onClick={() => setActiveTab('context')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'context'
                    ? 'bg-[#CB6C6C]/20 text-[#CB6C6C] border border-[#CB6C6C]/40'
                    : 'text-zinc-400 hover:text-[#CB6C6C]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#CB6C6C]" />
                <span>Story Context</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="relative z-10 p-6 overflow-y-auto flex-1 space-y-4">
          {loading && !entry && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-[#CB6C6C]/30 border-t-[#CB6C6C] animate-spin" />
                <BookOpen className="absolute inset-0 m-auto w-4 h-4 text-[#CB6C6C]" />
              </div>
              <p className="text-xs text-zinc-400 font-medium">Searching across dictionary sources...</p>
            </div>
          )}

          {!loading && error && !entry && (
            <div className="py-10 text-center text-xs font-medium text-zinc-400">
              {error}
            </div>
          )}

          {/* Clean Empty State */}
          {!loading && !error && !entry && (
            <div className="py-14 flex flex-col items-center justify-center text-center text-zinc-400">
              <BookOpen className="w-12 h-12 mb-3 text-[#CB6C6C] opacity-40" />
              <p className="text-sm font-bold text-zinc-200">
                Select any word while reading or type a term above
              </p>
            </div>
          )}

          {/* Entry content */}
          {entry && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Word Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h4 className="text-2xl font-black text-white capitalize font-serif tracking-tight">
                    {entry.word}
                  </h4>
                  {entry.phonetic && (
                    <span className="text-xs font-mono text-[#CB6C6C] bg-[#CB6C6C]/15 px-2.5 py-0.5 rounded-lg border border-[#CB6C6C]/30">
                      {entry.phonetic}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
                    {entry.source === 'wiktionary' 
                      ? 'Wiktionary' 
                      : entry.source === 'wikipedia' 
                      ? 'Wikipedia' 
                      : entry.source === 'urban' 
                      ? 'Urban' 
                      : entry.source === 'datamuse' 
                      ? 'Datamuse' 
                      : entry.source === 'local' 
                      ? 'ReadVerse Lore' 
                      : 'Lexicon'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayAudio}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-[#CB6C6C] text-white border-[#CB6C6C] shadow-md shadow-[rgba(203,108,108,0.3)] scale-105'
                        : 'bg-white/[0.04] hover:bg-[#CB6C6C]/15 hover:text-[#CB6C6C] hover:border-[#CB6C6C]/30 text-zinc-400 border-white/[0.08]'
                    }`}
                    title="Pronounce"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] transition-all cursor-pointer"
                    title="Copy definition"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Definitions View */}
              {activeTab === 'definitions' && (
                <div className="space-y-3.5">
                  {entry.meanings.map((meaning, mIdx) => {
                    const definitionsToShow = detailMode === 'brief'
                      ? meaning.definitions.slice(0, 1)
                      : meaning.definitions;

                    if (definitionsToShow.length === 0) return null;

                    return (
                      <div key={mIdx} className="space-y-2">
                        <span className="inline-block text-[10px] font-mono font-bold text-[#CB6C6C] bg-[#CB6C6C]/15 px-2.5 py-0.5 rounded-lg border border-[#CB6C6C]/30 uppercase tracking-wider">
                          {meaning.partOfSpeech}
                        </span>

                        <div className="space-y-2 text-sm text-zinc-200">
                          {definitionsToShow.map((def, dIdx) => (
                            <div key={dIdx} className="leading-relaxed">
                              <p className="text-zinc-200 font-normal">
                                {detailMode === 'full' && (
                                  <span className="text-zinc-500 font-mono text-xs mr-2 font-bold">
                                    {dIdx + 1}.
                                  </span>
                                )}
                                {def.definition}
                              </p>
                              {detailMode === 'full' && def.example && (
                                <p className="mt-1 text-xs text-zinc-400 italic pl-3 border-l-2 border-[#CB6C6C]/40">
                                  &ldquo;{def.example}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Synonyms only in Full mode */}
                        {detailMode === 'full' && meaning.synonyms && meaning.synonyms.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-zinc-500 font-medium mr-1">synonyms:</span>
                            {meaning.synonyms.slice(0, 5).map((syn, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => lookupWord(syn)}
                                className="px-2.5 py-0.5 rounded-full bg-white/[0.03] hover:bg-[#CB6C6C]/15 hover:text-[#CB6C6C] text-zinc-400 hover:border-[#CB6C6C]/30 text-xs border border-white/[0.06] transition-all cursor-pointer"
                              >
                                {syn}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Context View */}
              {activeTab === 'context' && loreContext && (
                <div className="p-4 rounded-2xl bg-[#CB6C6C]/[0.08] border border-[#CB6C6C]/25 text-sm text-[#fcdcdc] leading-relaxed">
                  {loreContext}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
