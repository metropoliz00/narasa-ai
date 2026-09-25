import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Trophy,
  HelpCircle,
  Hash,
  ArrowDown,
  Layers,
  Unlock,
  Smile
} from 'lucide-react';

interface PatternPuzzleGameProps {
  photoUrl: string;
  objectName: string;
  isSolved: boolean;
  onSolve: () => void;
  onUnlockAnyway?: () => void;
}

// Simple Web Audio API chime for puzzle success
const playSuccessChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.36);
    });
  } catch {
    // Ignore audio autoplay restrictions
  }
};

export const PatternPuzzleGame: React.FC<PatternPuzzleGameProps> = ({
  photoUrl,
  objectName,
  isSolved,
  onSolve,
  onUnlockAnyway
}) => {
  // Grid size: 3 (3x3 = 9 pieces) or 2 (2x2 = 4 pieces for easier mode)
  const [gridSize, setGridSize] = useState<2 | 3>(3);
  const totalTiles = gridSize * gridSize;

  // Initialize and shuffle tiles
  const generateShuffledTiles = useCallback((size: number) => {
    const count = size * size;
    const array = Array.from({ length: count }, (_, i) => i);
    // Shuffle array ensuring it's not identical to solved state
    let isDifferent = false;
    for (let attempts = 0; attempts < 10 && !isDifferent; attempts++) {
      for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      isDifferent = array.some((val, idx) => val !== idx);
    }
    return array;
  }, []);

  const [tiles, setTiles] = useState<number[]>(() => generateShuffledTiles(3));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(isSolved);

  // Re-shuffle when grid size changes
  const handleGridSizeChange = (newSize: 2 | 3) => {
    setGridSize(newSize);
    setSelectedSlot(null);
    setMoveCount(0);
    const newTiles = generateShuffledTiles(newSize);
    setTiles(newTiles);
  };

  // Re-shuffle current grid
  const handleShuffle = () => {
    setSelectedSlot(null);
    setMoveCount(0);
    setTiles(generateShuffledTiles(gridSize));
  };

  // Count correct pieces
  const correctCount = useMemo(() => {
    return tiles.reduce((acc, tile, idx) => (tile === idx ? acc + 1 : acc), 0);
  }, [tiles]);

  const currentlySolved = correctCount === totalTiles;

  // Check if puzzle is solved
  useEffect(() => {
    if (currentlySolved && !isSolved) {
      playSuccessChime();
      setHasCelebrated(true);
      onSolve();
    }
  }, [currentlySolved, isSolved, onSolve]);

  // Click to swap tiles
  const handleSlotClick = (slotIdx: number) => {
    if (isSolved || currentlySolved) return;

    if (selectedSlot === null) {
      setSelectedSlot(slotIdx);
    } else if (selectedSlot === slotIdx) {
      // Deselect
      setSelectedSlot(null);
    } else {
      // Swap tiles at selectedSlot and slotIdx
      const newTiles = [...tiles];
      const temp = newTiles[selectedSlot];
      newTiles[selectedSlot] = newTiles[slotIdx];
      newTiles[slotIdx] = temp;

      setTiles(newTiles);
      setSelectedSlot(null);
      setMoveCount((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-300 shadow-sm space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm sm:text-base text-amber-950">
                🧩 Tantangan Detektif Pola: Susun Puzzle Gambar!
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                Pengamatan Pola
              </span>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              Tukar potongan foto {objectName} berikut sampai tersusun rapi untuk menemukan polanya!
            </p>
          </div>
        </div>

        {/* Level Toggle & Progress Pill */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center bg-amber-100 p-0.5 rounded-xl border border-amber-300 text-xs font-bold text-amber-900">
            <button
              type="button"
              onClick={() => handleGridSizeChange(2)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                gridSize === 2 ? 'bg-amber-500 text-white shadow-xs' : 'hover:bg-amber-200'
              }`}
            >
              2x2 (Mudah)
            </button>
            <button
              type="button"
              onClick={() => handleGridSizeChange(3)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                gridSize === 3 ? 'bg-amber-500 text-white shadow-xs' : 'hover:bg-amber-200'
              }`}
            >
              3x3 (Tantangan)
            </button>
          </div>
        </div>
      </div>

      {/* Solved Celebration Banner */}
      {(isSolved || currentlySolved) ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shrink-0">
              <Trophy className="w-7 h-7 text-yellow-300 drop-shadow" />
            </div>
            <div>
              <h5 className="font-extrabold text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1.5">
                <span>🎉 HORE! Kamu Berhasil Menyusun Pola Foto!</span>
              </h5>
              <p className="text-xs text-emerald-100 font-medium">
                Pola potongan objek {objectName} sudah tersambung sempurna. Sekarang kamu siap menjawab pertanyaan di bawah!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShuffle}
            className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Mainkan Lagi</span>
          </button>
        </div>
      ) : (
        /* Instructions & Helper Toolset */
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {selectedSlot === null
                ? '👆 Klik potongan pertama yang ingin kamu tukar'
                : '🔄 Sekarang klik potongan kedua untuk menukarnya!'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                showOriginal
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
              }`}
            >
              {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showOriginal ? 'Sembunyikan Contoh' : 'Lihat Contoh Asli'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNumbers(!showNumbers)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                showNumbers
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{showNumbers ? 'Nomor Aktif' : 'Bantuan Nomor'}</span>
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              className="px-2.5 py-1 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Acak kembali potongan puzzle"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Acak</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Play Area */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 py-1">
        {/* The Puzzle Grid Board */}
        <div className="relative">
          <div
            className={`grid gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-slate-900/90 shadow-xl border-4 ${
              isSolved || currentlySolved ? 'border-emerald-400 ring-4 ring-emerald-200' : 'border-amber-400'
            }`}
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              width: gridSize === 2 ? '280px' : '320px',
              height: gridSize === 2 ? '280px' : '320px',
              maxWidth: '90vw',
              maxHeight: '90vw'
            }}
          >
            {tiles.map((tileIndex, slotIdx) => {
              // Calculate where this tile belongs in original image
              const origRow = Math.floor(tileIndex / gridSize);
              const origCol = tileIndex % gridSize;

              const isSelected = selectedSlot === slotIdx;
              const isCorrect = tileIndex === slotIdx;

              // Calculate background position percentages for CSS
              const bgPosX = (origCol / (gridSize - 1)) * 100;
              const bgPosY = (origRow / (gridSize - 1)) * 100;

              return (
                <button
                  key={`slot-${slotIdx}`}
                  type="button"
                  onClick={() => handleSlotClick(slotIdx)}
                  disabled={isSolved || currentlySolved}
                  aria-label={`Potongan puzzle posisi ${slotIdx + 1}`}
                  className={`relative rounded-xl overflow-hidden transition-all duration-150 cursor-pointer select-none group ${
                    isSelected
                      ? 'ring-4 ring-yellow-400 scale-95 z-20 shadow-lg'
                      : isCorrect && (isSolved || currentlySolved)
                      ? 'ring-1 ring-emerald-400/50'
                      : 'hover:brightness-105 active:scale-95'
                  }`}
                  style={{
                    backgroundImage: `url(${photoUrl})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Subtle inner shadow / border */}
                  <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none" />

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-yellow-400/25 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded shadow-xs">
                        Dipilih
                      </span>
                    </div>
                  )}

                  {/* Number hint if enabled */}
                  {showNumbers && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-black text-white pointer-events-none">
                      {tileIndex + 1}
                    </div>
                  )}

                  {/* Correct position badge */}
                  {isCorrect && !isSolved && !currentlySolved && (
                    <div className="absolute bottom-1 right-1 bg-emerald-500/90 text-white p-0.5 rounded-full shadow-xs pointer-events-none">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Original Preview Overlay when toggled */}
          {showOriginal && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-3 flex flex-col items-center justify-center gap-2 z-30 animate-in fade-in duration-150">
              <img
                src={photoUrl}
                alt={objectName}
                className="max-h-[80%] max-w-[80%] rounded-xl object-contain border-2 border-white/40 shadow-lg"
              />
              <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                Foto Asli {objectName}
              </span>
            </div>
          )}
        </div>

        {/* Side Progress & Stats Box */}
        <div className="flex-1 w-full max-w-xs space-y-3 bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs text-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">Ketepatan Pola:</span>
            <span className="font-black text-amber-700 font-mono text-sm">
              {correctCount} / {totalTiles} Potongan
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                currentlySolved || isSolved
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${(correctCount / totalTiles) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Jumlah Langkah Tukar:</span>
            <span className="font-extrabold text-slate-700">{moveCount} kali</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900 leading-snug space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span>💡 Petunjuk Detektif Pola:</span>
            </p>
            <p>
              Perhatikan garis tepi, gradasi warna, dan corak pada foto {objectName} untuk mencocokkan pecahan mana yang saling menyambung.
            </p>
          </div>

          {/* Skip / Unlock Button for accessibility so no child gets blocked */}
          {!isSolved && !currentlySolved && onUnlockAnyway && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onUnlockAnyway}
                className="w-full py-1.5 rounded-xl border border-dashed border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span>Buka Kunci Pertanyaan Langsung</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
