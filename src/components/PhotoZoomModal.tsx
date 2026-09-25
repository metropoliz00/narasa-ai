import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  RefreshCw,
  Move,
  Eye,
  Sparkles
} from 'lucide-react';

interface PhotoZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  title?: string;
  subtitle?: string;
}

export const PhotoZoomModal: React.FC<PhotoZoomModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  title = 'Foto Pengamatan Objek',
  subtitle
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset transform state when modal opens or photo changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, photoUrl]);

  // Handle keyboard shortcuts (Escape to close, +/- to zoom, 0 to reset)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSetPreset = (targetScale: number) => {
    setScale(targetScale);
    if (targetScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      // Zoom out
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile/tablet students
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan Zoom Foto Objek"
    >
      {/* Top Header Bar */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 text-white z-10 shadow-lg">
        {/* Title & Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 mr-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow-xs">
                {title}
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white border border-blue-400">
                Mode Pengamatan Detail
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-300 truncate font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Level Indicator */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-blue-300 hidden sm:block">
            {Math.round(scale * 100)}%
          </div>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition cursor-pointer"
            title="Perkecil (-)"
            aria-label="Perkecil Foto"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition cursor-pointer"
            title="Perbesar (+)"
            aria-label="Perbesar Foto"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Putar 90 Derajat (R)"
            aria-label="Putar Foto"
          >
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Kembali ke Ukuran Normal (0)"
            aria-label="Reset Ukuran Foto"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 sm:ml-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Tutup (Esc)"
            aria-label="Tutup Tampilan Zoom"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 touch-none ${
          scale > 1
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-zoom-in'
        }`}
        onClick={(e) => {
          // If clicking strictly on container background and not dragging, close
          if (e.target === containerRef.current && !isDragging) {
            onClose();
          }
        }}
      >
        <div
          className="relative transition-transform duration-75 ease-out inline-block max-w-full max-h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[72vh] sm:max-h-[76vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border-2 border-white/20 pointer-events-none select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Floating Bar with Zoom Presets & Tips */}
      <div className="shrink-0 px-3 sm:px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-2.5 z-10">
        {/* Child-friendly Guide Tip */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {scale > 1
              ? '🖐️ Foto diperbesar! Geser atau tarik gambar untuk mengamati bagian kecil objek.'
              : '💡 Klik 2x pada foto atau tekan tombol (+) untuk memperbesar bagian yang ingin diamati!'}
          </span>
        </div>

        {/* Quick Zoom Presets */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1 hidden md:inline">
            Pilihan Zoom:
          </span>
          <button
            type="button"
            onClick={() => handleSetPreset(1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              scale === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1x (Normal)
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset(1.5)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              scale === 1.5
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1.5x
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset(2)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              scale === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2x (Jelas)
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset(3)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              scale === 3
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3x (Detail)
          </button>
        </div>
      </div>
    </div>
  );
};
