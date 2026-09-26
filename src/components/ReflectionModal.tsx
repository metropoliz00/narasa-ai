import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { StudentReflection } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Brain,
  HelpCircle,
  Lightbulb,
  Trophy,
  ArrowRight,
  X
} from 'lucide-react';

interface ReflectionModalProps {
  isOpen: boolean;
  onFinishReflection: (reflection: StudentReflection) => void;
  onClose?: () => void;
  defaultValues?: Partial<StudentReflection>;
  studentId?: string;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  isOpen,
  onFinishReflection,
  onClose,
  defaultValues,
  studentId
}) => {
  const reflectionDraftKey = studentId
    ? `narasa_reflection_draft_${studentId}`
    : 'narasa_reflection_draft_current';

  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Try restoring from localStorage draft first, fallback to defaultValues
      let restored = false;
      try {
        const saved = localStorage.getItem(reflectionDraftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.q1 || parsed.q2 || parsed.q3 || parsed.q4 || parsed.q5)) {
            setQ1(parsed.q1 || defaultValues?.q1Found || '');
            setQ2(parsed.q2 || defaultValues?.q2Learned || '');
            setQ3(parsed.q3 || defaultValues?.q3Hardest || '');
            setQ4(parsed.q4 || defaultValues?.q4Solved || '');
            setQ5(parsed.q5 || defaultValues?.q5Improvement || '');
            restored = true;
            setIsDraftRestored(true);
          }
        }
      } catch (e) {}

      if (!restored) {
        setQ1(defaultValues?.q1Found || '');
        setQ2(defaultValues?.q2Learned || '');
        setQ3(defaultValues?.q3Hardest || '');
        setQ4(defaultValues?.q4Solved || '');
        setQ5(defaultValues?.q5Improvement || '');
      }
    }
  }, [isOpen, defaultValues, reflectionDraftKey]);

  // Auto-save reflection answers as student types
  useEffect(() => {
    if (!isOpen) return;
    try {
      if (q1 || q2 || q3 || q4 || q5) {
        localStorage.setItem(
          reflectionDraftKey,
          JSON.stringify({ q1, q2, q3, q4, q5, updatedAt: new Date().toISOString() })
        );
      }
    } catch (e) {}
  }, [q1, q2, q3, q4, q5, isOpen, reflectionDraftKey]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Clear saved draft on completion
    try {
      localStorage.removeItem(reflectionDraftKey);
    } catch (e) {}

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }

    onFinishReflection({
      q1Found: q1,
      q2Learned: q2,
      q3Hardest: q3,
      q4Solved: q4,
      q5Improvement: q5
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-display">🤔 REFLEKSI SAYA</h2>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  💾 Draf Tersimpan di Perangkat
                </span>
              </div>
              <p className="text-xs text-white/80">
                Pikirkan kembali perjalanan belajarmu hari ini (aman saat keluar)
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Tutup Refleksi"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 5 Reflection Prompts */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {/* Question 1 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#25324B] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Apa yang kamu temukan dari foto objekmu?
            </label>
            <textarea
              rows={2}
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder="Tuliskan temuanmu di sini..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 resize-none placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 leading-normal"
            />
          </div>

          {/* Question 2 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#25324B] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Apa yang kamu pelajari tentang materi pelajaran hari ini?
            </label>
            <textarea
              rows={2}
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Tuliskan pemahaman materimu di sini..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs sm:text-sm text-slate-800 resize-none placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 leading-normal"
            />
          </div>

          {/* Question 3 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#25324B] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              Bagian mana yang paling sulit atau menantang?
            </label>
            <textarea
              rows={2}
              value={q3}
              onChange={(e) => setQ3(e.target.value)}
              placeholder="Tuliskan tantangan yang kamu hadapi di sini..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none text-xs sm:text-sm text-slate-800 resize-none placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 leading-normal"
            />
          </div>

          {/* Question 4 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#25324B] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              Bagaimana caramu menyelesaikan atau mencari jalan keluarnya?
            </label>
            <textarea
              rows={2}
              value={q4}
              onChange={(e) => setQ4(e.target.value)}
              placeholder="Tuliskan cara penyelesaianmu di sini..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs sm:text-sm text-slate-800 resize-none placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 leading-normal"
            />
          </div>

          {/* Question 5 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#25324B] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                5
              </span>
              Apa yang akan kamu lakukan lebih baik pada aktivitas berikutnya?
            </label>
            <textarea
              rows={2}
              value={q5}
              onChange={(e) => setQ5(e.target.value)}
              placeholder="Tuliskan rencana perbaikanmu di sini..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs sm:text-sm text-slate-800 resize-none placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 leading-normal"
            />
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 hidden sm:block">
            Refleksimu akan otomatis dimasukkan ke slide presentasi
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Tutup / Batal
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#4F8EF7] via-[#7C5CFC] to-[#20C9A6] text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>✨ Buat Presentasi Otomatis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
