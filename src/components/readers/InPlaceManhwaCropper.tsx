'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Check, 
  Move, 
  Loader2 
} from 'lucide-react';

export type CropRatio = '1:1' | '4:5' | '16:9' | 'free';

type CornerType = 'nw' | 'ne' | 'sw' | 'se';

interface InPlaceManhwaCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCrop: (croppedDataUrl: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const InPlaceManhwaCropper: React.FC<InPlaceManhwaCropperProps> = ({
  isOpen,
  onClose,
  onConfirmCrop,
  containerRef
}) => {
  const [selectedRatio, setSelectedRatio] = useState<CropRatio>('4:5');
  const [cropWidth, setCropWidth] = useState(400);
  const [cropHeight, setCropHeight] = useState(500); // 400 * (5/4) = 500 for 4:5
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Corner resize state
  const [resizingCorner, setResizingCorner] = useState<CornerType | null>(null);
  const [resizeStart, setResizeStart] = useState({
    mouseX: 0,
    mouseY: 0,
    width: 400,
    height: 500,
    offsetX: 0,
    offsetY: 0
  });

  const [isSnapping, setIsSnapping] = useState(false);
  const cropBoxRef = useRef<HTMLDivElement>(null);

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
      setCropWidth(400);
      setCropHeight(500);
      setIsSnapping(false);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape cancels crop mode
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
    e.stopPropagation(); // Don't trigger box dragging
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

      let newW = resizeStart.width;
      let newH = resizeStart.height;
      let newOffX = resizeStart.offsetX;
      let newOffY = resizeStart.offsetY;

      const minW = 160;
      const minH = 120;
      const maxW = typeof window !== 'undefined' ? window.innerWidth - 60 : 1200;
      const maxH = typeof window !== 'undefined' ? window.innerHeight - 80 : 1000;

      if (resizingCorner === 'se') {
        // Anchor Top-Left (nw)
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
        // Anchor Top-Right (ne)
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
        // Anchor Bottom-Left (sw)
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
        // Anchor Bottom-Right (se)
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

  // Function to load image safely through proxy if needed
  const loadSafeImage = async (url: string): Promise<HTMLImageElement> => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let safeUrl = url;
    if (
      !url.startsWith('data:') && 
      !url.startsWith('blob:') && 
      !url.startsWith('/api/manga/image-proxy') &&
      (url.startsWith('http://') || url.startsWith('https://'))
    ) {
      safeUrl = `/api/manga/image-proxy?url=${encodeURIComponent(url)}`;
    }

    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load panel for crop: ${url}`));
      img.src = safeUrl;
    });
  };

  // Perform the screen-to-panel crop
  const handleCapture = useCallback(async () => {
    if (!cropBoxRef.current || !containerRef.current) return;
    setIsSnapping(true);

    try {
      const cropRect = cropBoxRef.current.getBoundingClientRect();
      const allImages = containerRef.current.querySelectorAll<HTMLImageElement>('img');

      // Find all manhwa images intersecting the crop rectangle
      const intersectingImages: {
        element: HTMLImageElement;
        rect: DOMRect;
        interTop: number;
        interBottom: number;
        interLeft: number;
        interRight: number;
      }[] = [];

      allImages.forEach((img) => {
        const rect = img.getBoundingClientRect();
        const interLeft = Math.max(cropRect.left, rect.left);
        const interTop = Math.max(cropRect.top, rect.top);
        const interRight = Math.min(cropRect.right, rect.right);
        const interBottom = Math.min(cropRect.bottom, rect.bottom);

        if (interRight > interLeft && interBottom > interTop) {
          intersectingImages.push({
            element: img,
            rect,
            interTop,
            interBottom,
            interLeft,
            interRight
          });
        }
      });

      if (intersectingImages.length === 0) {
        throw new Error('No manhwa panels found under crop box');
      }

      // Target export resolution (crisp 1080px width)
      const exportWidth = 1080;
      const exportHeight = Math.round(exportWidth * (cropRect.height / cropRect.width));
      const scaleCanvas = exportWidth / cropRect.width;

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not create 2D canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Load each intersecting panel and draw its intersected portion onto the canvas
      for (const item of intersectingImages) {
        try {
          const loadedImg = await loadSafeImage(item.element.currentSrc || item.element.src);
          const naturalScale = loadedImg.naturalWidth / item.rect.width;

          // Source slice coordinates on the natural image
          const sx = (item.interLeft - item.rect.left) * naturalScale;
          const sy = (item.interTop - item.rect.top) * naturalScale;
          const sw = (item.interRight - item.interLeft) * naturalScale;
          const sh = (item.interBottom - item.interTop) * naturalScale;

          // Destination coordinates on the target export canvas
          const dx = (item.interLeft - cropRect.left) * scaleCanvas;
          const dy = (item.interTop - cropRect.top) * scaleCanvas;
          const dw = (item.interRight - item.interLeft) * scaleCanvas;
          const dh = (item.interBottom - item.interTop) * scaleCanvas;

          ctx.drawImage(loadedImg, sx, sy, sw, sh, dx, dy, dw, dh);
        } catch (err) {
          console.warn('Skipped drawing panel slice:', err);
        }
      }

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onConfirmCrop(croppedDataUrl);
    } catch (err) {
      console.error('Failed to capture in-place manhwa crop:', err);
      alert('Could not crop the selected scene. Please make sure the panel is loaded.');
      onClose();
    } finally {
      setIsSnapping(false);
    }
  }, [containerRef, onConfirmCrop, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Top Floating Control Bar: Sleek & Modern Glassmorphism */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-3.5 py-2 rounded-3xl bg-[#090b10]/90 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(203,108,108,0.2)] backdrop-blur-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 select-none">
        {/* Aspect Ratio Buttons */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
          {(['1:1', '4:5', '16:9', 'free'] as CropRatio[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRatio(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === r
                  ? 'bg-[#CB6C6C] text-white font-black shadow-md shadow-[rgba(203,108,108,0.3)] scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

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
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#CB6C6C] via-[#d77878] to-[#e28a8a] hover:brightness-110 text-white font-black text-xs shadow-lg shadow-[rgba(203,108,108,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSnapping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Clipping...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Clip Scene</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full-viewport overlay: pointer-events-none allows page scrolling underneath */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center select-none overflow-hidden">
        {/* Draggable & Corner-Resizable Viewfinder Box */}
        <div
          ref={cropBoxRef}
          onMouseDown={handleBoxMouseDown}
          style={{
            width: `${cropWidth}px`,
            height: `${cropHeight}px`,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.68)'
          }}
          className={`relative pointer-events-auto cursor-grab active:cursor-grabbing border-2 border-[#CB6C6C] rounded-2xl transition-all ${
            isDragging || resizingCorner 
              ? 'shadow-[0_0_35px_rgba(203,108,108,0.85),inset_0_0_20px_rgba(203,108,108,0.2)]' 
              : 'shadow-[0_0_20px_rgba(203,108,108,0.45),inset_0_0_15px_rgba(203,108,108,0.1)]'
          }`}
        >
          {/* Rule of Thirds Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 rounded-2xl overflow-hidden">
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div />
          </div>

          {/* Interactive Drag-to-Resize Corner Handles (Modern Luminous Nodes) */}
          {/* 1. Top-Left (NW) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('nw', e)}
            className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-20 group"
            title="Resize"
          >
            <div className="w-4 h-4 rounded-full bg-[#CB6C6C] ring-2 ring-zinc-950 ring-offset-1 ring-offset-[#CB6C6C] shadow-[0_0_12px_rgba(203,108,108,1)] group-hover:scale-125 transition-transform" />
          </div>

          {/* 2. Top-Right (NE) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('ne', e)}
            className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-20 group"
            title="Resize"
          >
            <div className="w-4 h-4 rounded-full bg-[#CB6C6C] ring-2 ring-zinc-950 ring-offset-1 ring-offset-[#CB6C6C] shadow-[0_0_12px_rgba(203,108,108,1)] group-hover:scale-125 transition-transform" />
          </div>

          {/* 3. Bottom-Left (SW) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('sw', e)}
            className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-20 group"
            title="Resize"
          >
            <div className="w-4 h-4 rounded-full bg-[#CB6C6C] ring-2 ring-zinc-950 ring-offset-1 ring-offset-[#CB6C6C] shadow-[0_0_12px_rgba(203,108,108,1)] group-hover:scale-125 transition-transform" />
          </div>

          {/* 4. Bottom-Right (SE) */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('se', e)}
            className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-20 group"
            title="Resize"
          >
            <div className="w-4 h-4 rounded-full bg-[#CB6C6C] ring-2 ring-zinc-950 ring-offset-1 ring-offset-[#CB6C6C] shadow-[0_0_12px_rgba(203,108,108,1)] group-hover:scale-125 transition-transform" />
          </div>

          {/* Aspect Ratio pill on box (Top-Left) */}
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-[#090b10]/85 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-[#CB6C6C] pointer-events-none shadow-lg">
            {selectedRatio.toUpperCase()} • {cropWidth}×{cropHeight}
          </div>
        </div>
      </div>
    </>
  );
};
