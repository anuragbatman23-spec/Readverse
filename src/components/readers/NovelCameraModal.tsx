'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  Download, 
  Copy, 
  Check, 
  Quote, 
  Palette,
  Loader2,
  Move
} from 'lucide-react';
import { Book } from '../../types';

export type NovelCameraRatio = '4:5' | '1:1' | '16:9';

export interface NovelCameraStyle {
  id: string;
  name: string;
  bgGradient: string;
  canvasBgStart: string;
  canvasBgEnd: string;
  textColor: string;
  quoteColor: string;
  accentColor: string;
  borderClass: string;
  tagBg: string;
  tagText: string;
}

export const NOVEL_CAMERA_STYLES: NovelCameraStyle[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    bgGradient: 'from-[#0b0d17] via-[#121626] to-[#070913]',
    canvasBgStart: '#0b0d17',
    canvasBgEnd: '#141829',
    textColor: '#f1f5f9',
    quoteColor: '#818cf8',
    accentColor: '#6366f1',
    borderClass: 'border-indigo-500/30',
    tagBg: 'rgba(99, 102, 241, 0.15)',
    tagText: '#a5b4fc'
  },
  {
    id: 'midnight',
    name: 'OLED Black',
    bgGradient: 'from-[#000000] via-[#09090b] to-[#000000]',
    canvasBgStart: '#000000',
    canvasBgEnd: '#09090b',
    textColor: '#fafafa',
    quoteColor: '#a1a1aa',
    accentColor: '#e4e4e7',
    borderClass: 'border-zinc-800',
    tagBg: 'rgba(255, 255, 255, 0.08)',
    tagText: '#d4d4d8'
  },
  {
    id: 'sepia',
    name: 'Parchment',
    bgGradient: 'from-[#fbf6ea] via-[#f3e7cf] to-[#ebd8b7]',
    canvasBgStart: '#fbf6ea',
    canvasBgEnd: '#ebd8b7',
    textColor: '#291e14',
    quoteColor: '#b45309',
    accentColor: '#92400e',
    borderClass: 'border-[#cbb991]',
    tagBg: 'rgba(180, 83, 9, 0.12)',
    tagText: '#78350f'
  },
  {
    id: 'forest',
    name: 'Sage Forest',
    bgGradient: 'from-[#091510] via-[#0d2218] to-[#06110c]',
    canvasBgStart: '#091510',
    canvasBgEnd: '#0d2218',
    textColor: '#ecfdf5',
    quoteColor: '#34d399',
    accentColor: '#10b981',
    borderClass: 'border-emerald-500/30',
    tagBg: 'rgba(16, 185, 129, 0.15)',
    tagText: '#6ee7b7'
  },
  {
    id: 'twilight',
    name: 'Rose Twilight',
    bgGradient: 'from-[#19091b] via-[#280d2c] to-[#120514]',
    canvasBgStart: '#19091b',
    canvasBgEnd: '#280d2c',
    textColor: '#fdf2f8',
    quoteColor: '#CB6C6C',
    accentColor: '#CB6C6C',
    borderClass: 'border-[#CB6C6C]/40',
    tagBg: 'rgba(203, 108, 108, 0.15)',
    tagText: '#CB6C6C'
  }
];

interface NovelCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  chapterTitle: string;
  chapterNum: number;
  initialQuote?: string;
  readerThemeId?: string;
  onConfirmShare: (imageUrl: string, quoteText: string) => void;
  onSwitchToLiveCrop?: () => void;
}

export const NovelCameraModal: React.FC<NovelCameraModalProps> = ({
  isOpen,
  onClose,
  book,
  chapterTitle,
  chapterNum,
  initialQuote = '',
  readerThemeId = 'dark',
  onConfirmShare,
  onSwitchToLiveCrop
}) => {
  const [selectedRatio, setSelectedRatio] = useState<NovelCameraRatio>('4:5');
  const [quoteText, setQuoteText] = useState(initialQuote);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(() => {
    if (readerThemeId === 'sepia' || readerThemeId === 'cream') return 'sepia';
    if (readerThemeId === 'forest') return 'forest';
    if (readerThemeId === 'oled') return 'midnight';
    return 'obsidian';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewCardRef = useRef<HTMLDivElement>(null);

  // Sync initial quote on open
  useEffect(() => {
    if (isOpen) {
      const fallback = (book.title && chapterTitle)
        ? `“Words have the power to create and destroy universes.”`
        : `Reading ${book.title}`;
      setQuoteText(initialQuote.trim() || fallback);
      setCopied(false);
    }
  }, [isOpen, initialQuote, book.title, chapterTitle]);

  // Keyboard shortcut Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeStyle = NOVEL_CAMERA_STYLES.find(s => s.id === selectedStyleId) || NOVEL_CAMERA_STYLES[0];

  // Helper: word-wrap text for canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Safe image loader
  const loadCoverImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise(resolve => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Generate crisp canvas image (1080px wide)
  const renderCardToCanvas = async (): Promise<string> => {
    const width = 1080;
    let height = 1350; // 4:5 default
    if (selectedRatio === '1:1') height = 1080;
    if (selectedRatio === '16:9') height = 608;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, activeStyle.canvasBgStart);
    gradient.addColorStop(1, activeStyle.canvasBgEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh/glow
    const radialGlow = ctx.createRadialGradient(width * 0.8, height * 0.15, 20, width * 0.8, height * 0.15, 600);
    radialGlow.addColorStop(0, activeStyle.accentColor + '25');
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Outer subtle border
    ctx.strokeStyle = activeStyle.accentColor + '40';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // 2. Book Header (Cover thumbnail + Title + Chapter)
    const headerTop = 90;
    const headerLeft = 90;
    const coverWidth = 110;
    const coverHeight = 155;

    // Load book cover if available
    const coverImg = await loadCoverImage(book.coverImage || '');
    if (coverImg) {
      ctx.save();
      // Rounded rect clip for cover
      const r = 16;
      ctx.beginPath();
      ctx.moveTo(headerLeft + r, headerTop);
      ctx.lineTo(headerLeft + coverWidth - r, headerTop);
      ctx.quadraticCurveTo(headerLeft + coverWidth, headerTop, headerLeft + coverWidth, headerTop + r);
      ctx.lineTo(headerLeft + coverWidth, headerTop + coverHeight - r);
      ctx.quadraticCurveTo(headerLeft + coverWidth, headerTop + coverHeight, headerLeft + coverWidth - r, headerTop + coverHeight);
      ctx.lineTo(headerLeft + r, headerTop + coverHeight);
      ctx.quadraticCurveTo(headerLeft, headerTop + coverHeight, headerLeft, headerTop + coverHeight - r);
      ctx.lineTo(headerLeft, headerTop + r);
      ctx.quadraticCurveTo(headerLeft, headerTop, headerLeft + r, headerTop);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(coverImg, headerLeft, headerTop, coverWidth, coverHeight);
      ctx.restore();
    } else {
      // Fallback book placeholder
      ctx.fillStyle = activeStyle.accentColor + '30';
      ctx.fillRect(headerLeft, headerTop, coverWidth, coverHeight);
      ctx.fillStyle = activeStyle.textColor;
      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('📖', headerLeft + coverWidth / 2, headerTop + coverHeight / 2 + 12);
    }

    // Title & Chapter Info
    const textLeft = headerLeft + coverWidth + 36;
    ctx.textAlign = 'left';

    // Badge
    ctx.fillStyle = activeStyle.accentColor + '25';
    const badgeText = (book.category || 'NOVEL').toUpperCase();
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 32;
    ctx.beginPath();
    ctx.roundRect(textLeft, headerTop + 4, badgeWidth, 38, 19);
    ctx.fill();

    ctx.fillStyle = activeStyle.accentColor;
    ctx.fillText(badgeText, textLeft + 16, headerTop + 30);

    // Book Title
    ctx.fillStyle = activeStyle.textColor;
    ctx.font = 'bold 44px Georgia, serif';
    const titleLines = wrapText(ctx, book.title, width - textLeft - 90);
    let titleY = headerTop + 82;
    for (let i = 0; i < Math.min(titleLines.length, 2); i++) {
      ctx.fillText(titleLines[i], textLeft, titleY);
      titleY += 50;
    }

    // Chapter badge
    ctx.fillStyle = activeStyle.textColor + 'a0';
    ctx.font = '26px system-ui, -apple-system, sans-serif';
    const chText = `Chapter ${chapterNum || 1} • ${chapterTitle || 'Reading Snapshot'}`;
    const truncatedCh = ctx.measureText(chText).width > (width - textLeft - 90)
      ? chText.slice(0, 35) + '...'
      : chText;
    ctx.fillText(truncatedCh, textLeft, titleY + 4);

    // 3. Large Decorative Quotation Mark
    const quoteSymbolY = Math.max(headerTop + coverHeight + 70, 320);
    ctx.fillStyle = activeStyle.quoteColor + '40';
    ctx.font = 'bold 160px Georgia, serif';
    ctx.fillText('“', 80, quoteSymbolY);

    // 4. Quote Body
    ctx.fillStyle = activeStyle.textColor;
    const isShortQuote = quoteText.length < 180;
    const fontSize = isShortQuote ? 46 : selectedRatio === '16:9' ? 32 : 38;
    const lineHeight = fontSize * 1.55;
    ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;

    const quoteLines = wrapText(ctx, `“${quoteText.trim()}”`, width - 180);
    let quoteY = quoteSymbolY + 10;
    const maxLines = selectedRatio === '16:9' ? 4 : selectedRatio === '1:1' ? 8 : 12;

    for (let i = 0; i < Math.min(quoteLines.length, maxLines); i++) {
      let line = quoteLines[i];
      if (i === maxLines - 1 && quoteLines.length > maxLines) {
        line = line.replace(/[,.]?$/, '...');
      }
      ctx.fillText(line, 90, quoteY);
      quoteY += lineHeight;
    }

    // 5. Card Footer: ReadVerse Watermark & Literary Attribution
    const footerY = height - 90;

    // Divider line
    ctx.strokeStyle = activeStyle.accentColor + '30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, footerY - 40);
    ctx.lineTo(width - 90, footerY - 40);
    ctx.stroke();

    // ReadVerse Logo / Watermark
    ctx.fillStyle = activeStyle.accentColor;
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('ReadVerse', 90, footerY);

    ctx.fillStyle = activeStyle.textColor + '80';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillText('• Story Memory Snapshot', 245, footerY);

    ctx.textAlign = 'right';
    ctx.fillText('readverse.app', width - 90, footerY);

    return canvas.toDataURL('image/jpeg', 0.94);
  };

  // Action: Snap and share to feed
  const handleShareToFeed = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await renderCardToCanvas();
      onConfirmShare(dataUrl, quoteText);
      onClose();
    } catch (err) {
      console.error('Error generating novel snapshot card:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Action: Download image to device
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await renderCardToCanvas();
      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanTitle = (book.title || 'novel').toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `readverse-snapshot-${cleanTitle}-ch${chapterNum || 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading novel snapshot:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Action: Copy image to clipboard
  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await renderCardToCanvas();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: copy quote text
        await navigator.clipboard.writeText(`"${quoteText}" — ${book.title}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback text copy
      navigator.clipboard.writeText(`"${quoteText}" — ${book.title}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#090b10]/95 border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06),0_0_35px_rgba(203,108,108,0.18)] backdrop-blur-3xl overflow-hidden flex flex-col max-h-[92vh] transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Top Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#CB6C6C]/15 via-[#CB6C6C]/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#CB6C6C]/60 to-transparent pointer-events-none" />

        {/* Clean Modern Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#CB6C6C] to-[#e28484] shadow-md shadow-[rgba(203,108,108,0.35)] ring-1 ring-white/20 flex items-center justify-center text-white flex-shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-white tracking-tight">
              Quote Card
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Switch to Live Screen Crop */}
            {onSwitchToLiveCrop && (
              <button
                type="button"
                onClick={onSwitchToLiveCrop}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#CB6C6C] hover:text-white hover:bg-[#CB6C6C]/15 border border-[#CB6C6C]/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Move className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crop Screen</span>
              </button>
            )}

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              {(['4:5', '1:1', '16:9'] as NovelCameraRatio[]).map(ratio => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setSelectedRatio(ratio)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedRatio === ratio
                      ? 'bg-[#CB6C6C] text-white shadow-sm shadow-[rgba(203,108,108,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
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

        {/* Studio Body: Live Framing Preview & Style Controls */}
        <div className="relative z-10 p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Live Framing Card Preview */}
          <div className="flex justify-center items-center py-1">
            <div
              ref={previewCardRef}
              className={`w-full max-w-md rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${activeStyle.bgGradient} border ${activeStyle.borderClass} shadow-2xl relative overflow-hidden transition-all duration-300`}
              style={{
                aspectRatio: selectedRatio === '4:5' ? '4/5' : selectedRatio === '1:1' ? '1/1' : '16/9'
              }}
            >
              {/* Decorative radial aura */}
              <div 
                className="absolute -right-16 -top-16 w-52 h-52 rounded-full opacity-20 pointer-events-none blur-2xl"
                style={{ backgroundColor: activeStyle.accentColor }}
              />

              {/* Card Header */}
              <div className="flex items-center gap-3 relative z-10 pb-3 border-b border-white/10">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded-md shadow-md border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 rounded-md bg-white/10 flex items-center justify-center text-lg shrink-0">
                    📖
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider"
                      style={{ backgroundColor: activeStyle.tagBg, color: activeStyle.tagText }}
                    >
                      {(book.category || 'NOVEL').toUpperCase()}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Ch {chapterNum || 1}
                    </span>
                  </div>
                  <h4 
                    className="text-xs sm:text-sm font-bold truncate leading-tight"
                    style={{ color: activeStyle.textColor }}
                  >
                    {book.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {chapterTitle || 'Reading Snapshot'}
                  </p>
                </div>
              </div>

              {/* Quote Body */}
              <div className="my-auto py-3 relative z-10 flex flex-col justify-center">
                <Quote 
                  className="w-6 h-6 mb-1 opacity-40 shrink-0"
                  style={{ color: activeStyle.quoteColor }}
                />
                <p 
                  className={`italic font-serif leading-relaxed line-clamp-6 select-none ${
                    selectedRatio === '16:9' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                  }`}
                  style={{ color: activeStyle.textColor }}
                >
                  &ldquo;{quoteText}&rdquo;
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] relative z-10 opacity-70">
                <span className="font-semibold tracking-wider" style={{ color: activeStyle.accentColor }}>
                  ReadVerse
                </span>
                <span className="text-zinc-400 font-mono">
                  readverse.app
                </span>
              </div>
            </div>
          </div>

          {/* Style Themes Selector */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {NOVEL_CAMERA_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    selectedStyleId === style.id
                      ? 'bg-[#CB6C6C]/15 border-[#CB6C6C]/60 shadow-md shadow-[rgba(203,108,108,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: style.accentColor }}
                  />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Edit Excerpt / Quote */}
          <div>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              rows={3}
              placeholder="Edit quote text..."
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 text-sm font-serif italic focus:outline-none focus:border-[#CB6C6C]/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#CB6C6C]/30 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 px-6 py-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating || !quoteText.trim()}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-white/[0.08] transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isGenerating || !quoteText.trim()}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-white/[0.08] transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#CB6C6C]" />
                  <span className="text-[#CB6C6C]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleShareToFeed}
            disabled={isGenerating || !quoteText.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md shadow-[rgba(203,108,108,0.3)] transition-all disabled:opacity-40 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Share to Feed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
