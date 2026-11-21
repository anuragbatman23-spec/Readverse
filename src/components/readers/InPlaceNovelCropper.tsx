'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Move, 
  Loader2, 
  Palette,
  Camera
} from 'lucide-react';
import { useActiveTheme } from '../../utils/themeSystem';

export type NovelCropRatio = 'free' | '4:5' | '1:1' | '16:9';
type CornerType = 'nw' | 'ne' | 'sw' | 'se';

interface InPlaceNovelCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCrop: (croppedDataUrl: string, quoteText: string) => void;
  onSwitchToStudio?: () => void;
  containerRef: React.RefObject<HTMLDivElement | HTMLElement>;
  bookTitle: string;
  chapterTitle: string;
  chapterNum: number;
  themeHex: {
    bg: string;
    text: string;
    isDark: boolean;
  };
  fontFamily: string;
  fontSize: number;
}

export const InPlaceNovelCropper: React.FC<InPlaceNovelCropperProps> = ({
  isOpen,
  onClose,
  onConfirmCrop,
  onSwitchToStudio,
  containerRef,
  bookTitle,
  chapterTitle,
  chapterNum,
  themeHex,
  fontFamily,
  fontSize
}) => {
  const theme = useActiveTheme();
  const [selectedRatio, setSelectedRatio] = useState<NovelCropRatio>('4:5');
  const [cropWidth, setCropWidth] = useState(420);
  const [cropHeight, setCropHeight] = useState(525); // 4:5
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Corner resize state
  const [resizingCorner, setResizingCorner] = useState<CornerType | null>(null);
  const [resizeStart, setResizeStart] = useState({
    mouseX: 0,
    mouseY: 0,
    width: 420,
    height: 525,
    offsetX: 0,
    offsetY: 0
  });

  const [isSnapping, setIsSnapping] = useState(false);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlBarRef = useRef<HTMLDivElement>(null);

  // Recalculate height whenever ratio changes
  useEffect(() => {
    if (selectedRatio === '1:1') {
      setCropHeight(cropWidth);
    } else if (selectedRatio === '4:5') {
      setCropHeight(Math.round(cropWidth * (5 / 4)));
    } else if (selectedRatio === '16:9') {
      setCropHeight(Math.round(cropWidth * (9 / 16)));
    }
  }, [selectedRatio, cropWidth]);

  // Reset offset on open
  useEffect(() => {
    if (isOpen) {
      setOffset({ x: 0, y: 0 });
      setCropWidth(420);
      setCropHeight(Math.round(420 * (5 / 4)));
      setIsSnapping(false);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape cancels crop mode
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1. Move/drag the entire crop box
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 2. Corner Resizing Logic
  const handleCornerMouseDown = (corner: CornerType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCorner(corner);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: cropWidth,
      height: cropHeight,
      offsetX: offset.x,
      offsetY: offset.y
    });
  };

  useEffect(() => {
    if (!resizingCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;

      const ratioMultiplier = 
        selectedRatio === '1:1' ? 1 :
        selectedRatio === '4:5' ? 4 / 5 :
        selectedRatio === '16:9' ? 16 / 9 : null;

      const minW = 240;
      const maxW = Math.min(window.innerWidth - 40, 850);
      const minH = 180;
      const maxH = Math.min(window.innerHeight - 80, 950);

      let newW = resizeStart.width;
      let newH = resizeStart.height;
      let newOffX = resizeStart.offsetX;
      let newOffY = resizeStart.offsetY;

      if (resizingCorner === 'se') {
        const anchorX = resizeStart.offsetX - resizeStart.width / 2;
        const anchorY = resizeStart.offsetY - resizeStart.height / 2;
        const rawW = Math.max(minW, Math.min(maxW, resizeStart.width + deltaX));

        if (ratioMultiplier !== null) {
          newW = rawW;
          newH = Math.round(newW / ratioMultiplier);
        } else {
          newW = rawW;
          newH = Math.max(minH, Math.min(maxH, resizeStart.height + deltaY));
        }
        newOffX = anchorX + newW / 2;
        newOffY = anchorY + newH / 2;
      } else if (resizingCorner === 'sw') {
        const anchorX = resizeStart.offsetX + resizeStart.width / 2;
        const anchorY = resizeStart.offsetY - resizeStart.height / 2;
        const rawW = Math.max(minW, Math.min(maxW, resizeStart.width - deltaX));

        if (ratioMultiplier !== null) {
          newW = rawW;
          newH = Math.round(newW / ratioMultiplier);
        } else {
          newW = rawW;
          newH = Math.max(minH, Math.min(maxH, resizeStart.height + deltaY));
        }
        newOffX = anchorX - newW / 2;
        newOffY = anchorY + newH / 2;
      } else if (resizingCorner === 'ne') {
        const anchorX = resizeStart.offsetX - resizeStart.width / 2;
        const anchorY = resizeStart.offsetY + resizeStart.height / 2;
        const rawW = Math.max(minW, Math.min(maxW, resizeStart.width + deltaX));

        if (ratioMultiplier !== null) {
          newW = rawW;
          newH = Math.round(newW / ratioMultiplier);
        } else {
          newW = rawW;
          newH = Math.max(minH, Math.min(maxH, resizeStart.height - deltaY));
        }
        newOffX = anchorX + newW / 2;
        newOffY = anchorY - newH / 2;
      } else if (resizingCorner === 'nw') {
        const anchorX = resizeStart.offsetX + resizeStart.width / 2;
        const anchorY = resizeStart.offsetY + resizeStart.height / 2;
        const rawW = Math.max(minW, Math.min(maxW, resizeStart.width - deltaX));

        if (ratioMultiplier !== null) {
          newW = rawW;
          newH = Math.round(newW / ratioMultiplier);
        } else {
          newW = rawW;
          newH = Math.max(minH, Math.min(maxH, resizeStart.height - deltaY));
        }
        newOffX = anchorX - newW / 2;
        newOffY = anchorY - newH / 2;
      }

      setCropWidth(Math.round(newW));
      setCropHeight(Math.round(newH));
      setOffset({ x: Math.round(newOffX), y: Math.round(newOffY) });
    };

    const handleMouseUp = () => {
      setResizingCorner(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCorner, resizeStart, selectedRatio]);

  // Wrap text helper for canvas
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

  // Perform the screen-to-card crop
  const handleCapture = useCallback(async () => {
    if (!cropBoxRef.current || !containerRef.current) return;
    setIsSnapping(true);

    try {
      const cropRect = cropBoxRef.current.getBoundingClientRect();
      const container = containerRef.current;
      const width = Math.max(80, Math.round(cropRect.width));
      const height = Math.max(60, Math.round(cropRect.height));

      // 1. Temporarily hide the viewfinder overlay so it doesn't appear in the captured image
      if (overlayRef.current) overlayRef.current.style.opacity = '0';
      if (controlBarRef.current) controlBarRef.current.style.opacity = '0';

      // Brief pause to allow browser repainting
      await new Promise(r => setTimeout(r, 60));

      let croppedDataUrl = '';

      // Find any intersecting text for post caption
      const textElements = container.querySelectorAll<HTMLElement>('p, h1, h2, h3, blockquote');
      const intersectingBlocks: string[] = [];
      textElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > cropRect.top && rect.top < cropRect.bottom) {
          const txt = el.innerText?.trim();
          if (txt) intersectingBlocks.push(txt);
        }
      });
      const extractedCaption = intersectingBlocks.slice(0, 2).join(' ') || '';

      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(document.body, {
          x: Math.round(cropRect.left + window.scrollX),
          y: Math.round(cropRect.top + window.scrollY),
          width: width,
          height: height,
          scale: 2, // High-res retina sharpness
          useCORS: true,
          allowTaint: true,
          backgroundColor: themeHex.bg || '#0c0e18',
          logging: false
        });

        croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } catch (h2cErr) {
        console.warn('html2canvas capture error, falling back to clean text canvas:', h2cErr);
      } finally {
        // Restore overlay visibility
        if (overlayRef.current) overlayRef.current.style.opacity = '1';
        if (controlBarRef.current) controlBarRef.current.style.opacity = '1';
      }

      // If html2canvas succeeded, pass exact cropped image to post modal
      if (croppedDataUrl && croppedDataUrl.startsWith('data:image')) {
        onConfirmCrop(croppedDataUrl, extractedCaption);
        onClose();
        return;
      }

      // Fallback: If html2canvas is not available, render clean typography canvas
      const extractedText = intersectingBlocks.length > 0 
        ? intersectingBlocks.join('\n\n')
        : (container.innerText?.slice(0, 300) || `Reading ${bookTitle}`);

      const exportWidth = 1080;
      const exportHeight = Math.round(exportWidth * (cropRect.height / cropRect.width));

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = themeHex.bg || '#0c0e18';
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Chapter info watermark
      const paddingX = 60;
      ctx.fillStyle = themeHex.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
      ctx.font = '18px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${bookTitle} • Ch. ${chapterNum || 1} ${chapterTitle ? `(${chapterTitle})` : ''}`, paddingX, 42);

      ctx.fillStyle = themeHex.text || '#ffffff';
      
      const bodyFontSize = Math.min(38, Math.max(26, Math.round(fontSize * 1.5)));
      const bodyLineHeight = Math.round(bodyFontSize * 1.6);
      ctx.font = `${bodyFontSize}px ${fontFamily || 'Georgia, serif'}`;

      const maxWidth = exportWidth - paddingX * 2;
      let textY = 85;
      const footerLimitY = exportHeight - 60;

      const paragraphs = extractedText.split('\n\n');
      for (const para of paragraphs) {
        if (textY >= footerLimitY) break;
        const lines = wrapText(ctx, para, maxWidth);
        for (const line of lines) {
          if (textY + bodyLineHeight > footerLimitY) {
            ctx.fillText(line.replace(/[,.]?$/, '...'), paddingX, textY);
            textY += bodyLineHeight;
            break;
          }
          ctx.fillText(line, paddingX, textY);
          textY += bodyLineHeight;
        }
        textY += Math.round(bodyLineHeight * 0.4);
      }

      const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.94);
      onConfirmCrop(fallbackDataUrl, extractedCaption);
      onClose();
    } catch (err) {
      console.error('Failed to crop reading view:', err);
      alert('Could not crop the selected text. Please try adjusting your box.');
      onClose();
    } finally {
      setIsSnapping(false);
    }
  }, [containerRef, bookTitle, chapterTitle, chapterNum, themeHex, fontFamily, fontSize, onConfirmCrop, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Top Floating Control Bar: Sleek & Modern Glassmorphism */}
      <div 
        ref={controlBarRef}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-3.5 py-2 rounded-3xl bg-[#090b10]/90 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(203,108,108,0.2)] backdrop-blur-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 select-none transition-opacity duration-150"
      >
        {/* Aspect Ratio Buttons */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
          {(['4:5', '1:1', '16:9', 'free'] as NovelCropRatio[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRatio(r)}
              style={selectedRatio === r ? { backgroundColor: theme.accentHex, color: '#ffffff', boxShadow: `0 2px 10px rgba(${theme.accentRgb}, 0.35)` } : {}}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === r ? 'text-white font-black scale-[1.02]' : `${theme.textSecondary} hover:${theme.textPrimary}`
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Studio Switcher (if supported) */}
        {onSwitchToStudio && (
          <button
            type="button"
            onClick={onSwitchToStudio}
            title="Switch to Quote Card Studio"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#CB6C6C] hover:text-white hover:bg-[#CB6C6C]/20 border border-[#CB6C6C]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Card Studio</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-5 w-px bg-white/15" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={isSnapping}
            style={{
              background: `linear-gradient(to right, ${theme.accentHex}, rgba(${theme.accentRgb}, 0.85))`,
              boxShadow: `0 4px 15px rgba(${theme.accentRgb}, 0.35)`
            }}
            className="px-5 py-2 rounded-2xl hover:brightness-110 text-white font-black text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSnapping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cropping...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Crop →</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full-viewport overlay: pointer-events-none allows page scrolling underneath */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 pointer-events-none z-[105] flex items-center justify-center select-none overflow-hidden transition-opacity duration-150"
      >
        {/* Draggable & Corner-Resizable Viewfinder Box */}
        <div
          ref={cropBoxRef}
          onMouseDown={handleBoxMouseDown}
          style={{
            width: `${cropWidth}px`,
            height: `${cropHeight}px`,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)'
          }}
          className={`relative pointer-events-auto cursor-grab active:cursor-grabbing border-2 rounded-xl transition-shadow ${
            isDragging || resizingCorner ? 'shadow-[0_0_35px_rgba(203,108,108,0.85)]' : 'shadow-[0_0_20px_rgba(203,108,108,0.45)]'
          }`}
        >
          {/* Rule of Thirds Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div />
          </div>

          {/* Interactive Drag-to-Resize Corner Handles */}
          {/* 1. Top-Left (NW) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('nw', e)}
            className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-20 group"
            title="Drag corner to resize"
          >
            <div style={{
                backgroundColor: theme.accentHex,
                boxShadow: `0 0 10px ${theme.accentHex}`
              }}
              className="w-3.5 h-3.5 rounded-sm border-2 border-white group-hover:scale-125 transition-transform" />
          </div>

          {/* 2. Top-Right (NE) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('ne', e)}
            className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-20 group"
            title="Drag corner to resize"
          >
            <div style={{
                backgroundColor: theme.accentHex,
                boxShadow: `0 0 10px ${theme.accentHex}`
              }}
              className="w-3.5 h-3.5 rounded-sm border-2 border-white group-hover:scale-125 transition-transform" />
          </div>

          {/* 3. Bottom-Left (SW) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('sw', e)}
            className="absolute -bottom-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-20 group"
            title="Drag corner to resize"
          >
            <div style={{
                backgroundColor: theme.accentHex,
                boxShadow: `0 0 10px ${theme.accentHex}`
              }}
              className="w-3.5 h-3.5 rounded-sm border-2 border-white group-hover:scale-125 transition-transform" />
          </div>

          {/* 4. Bottom-Right (SE) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('se', e)}
            className="absolute -bottom-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-20 group"
            title="Drag corner to resize"
          >
            <div style={{
                backgroundColor: theme.accentHex,
                boxShadow: `0 0 10px ${theme.accentHex}`
              }}
              className="w-3.5 h-3.5 rounded-sm border-2 border-white group-hover:scale-125 transition-transform" />
          </div>

          {/* Center Hint Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] text-zinc-300 pointer-events-none flex items-center gap-1.5 opacity-80 whitespace-nowrap">
            <Move className="w-3 h-3" style={{ color: theme.accentHex }} />
            <span>Drag box over reading text • Scroll page underneath</span>
          </div>

          {/* Aspect Ratio & Dimensions pill on box */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/85 border border-white/10 text-[10px] font-mono pointer-events-none" style={{ color: theme.accentHex }}>
            {selectedRatio.toUpperCase()} • {cropWidth}×{cropHeight}
          </div>
        </div>
      </div>
    </>
  );
};
