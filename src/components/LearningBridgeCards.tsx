import React, { useState } from 'react';
import { AILearningBridgeResult } from '../types';
import {
  Eye,
  Link2,
  BookOpen,
  Target,
  Brain,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Sparkles,
  CheckCircle2,
  PenTool,
  AlertCircle
} from 'lucide-react';

interface LearningBridgeCardsProps {
  bridgeResult: AILearningBridgeResult;
  photoUrl: string;
  imageLabel?: string;
  onStartChallenge: (pemantikResponse?: string) => void;
  onRetakePhoto: () => void;
}

export const LearningBridgeCards: React.FC<LearningBridgeCardsProps> = ({
  bridgeResult,
  photoUrl,
  imageLabel,
  onStartChallenge,
  onRetakePhoto
}) => {
  const [isMaterialExpanded, setIsMaterialExpanded] = useState(false);
  const [pemantikAnswer, setPemantikAnswer] = useState('');
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  // Parse student observation from combined imageLabel if available
  let studentObs: string | null = null;
  let studentQuest: string | null = null;

  if (imageLabel) {
    const parts = imageLabel.split(' | ');
    parts.forEach(part => {
      if (part.startsWith('Hasil Pengamatan Siswa: ')) {
        studentObs = part.replace('Hasil Pengamatan Siswa: ', '');
      } else if (part.startsWith('Pertanyaan Tambahan Siswa: ')) {
        studentQuest = part.replace('Pertanyaan Tambahan Siswa: ', '');
      }
    });
  }

  const getCompatibilityBadge = (level: string) => {
    switch (level) {
      case 'Strong':
        return {
          label: 'Kesesuaian Objek: Sangat Baik',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck
        };
      case 'Moderate':
        return {
          label: 'Kesesuaian Objek: Cukup Baik',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Sparkles
        };
      case 'Weak':
      default:
        return {
          label: 'Kesesuaian Objek: Perlu Konteks Lain',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle
        };
    }
  };

  const badge = getCompatibilityBadge(bridgeResult.compatibility);
  const BadgeIcon = badge.icon;
  const isWeak = bridgeResult.compatibility === 'Weak';

  // Questions to display
  const questionsList = bridgeResult.guidingQuestions && bridgeResult.guidingQuestions.length > 0
    ? bridgeResult.guidingQuestions
    : [
        'Bagaimana keterkaitan bentuk/sifat benda ini dengan konsep materi yang sedang dipelajari?',
        'Apa pola menarik yang kamu amati dan bisa kamu simpulkan?'
      ];

  const isPemantikFilled = pemantikAnswer.trim().length >= 3;

  const handleAttemptStartChallenge = () => {
    if (!isPemantikFilled) {
      setShowValidationWarning(true);
      const inputEl = document.getElementById('pemantik-answer-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setShowValidationWarning(false);
    onStartChallenge(pemantikAnswer.trim());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner with Photo & Object Detected */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-5 relative">
        <div className="relative w-full md:w-56 h-44 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 shadow-inner">
          <img
            src={photoUrl}
            alt={bridgeResult.detectedObject}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
            Foto Pengamatan
          </div>
        </div>

        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {badge.label}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#25324B] font-display">
            {bridgeResult.detectedObject}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {bridgeResult.compatibilityReason}
          </p>

          {isWeak && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1 text-left">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Saran Guru & Panduan Belajar:
              </p>
              <p>
                Hubungan objek ini dengan materi saat ini kurang kuat. Coba foto objek lain atau pertimbangkan saran konteks berikut:{' '}
                <span className="font-semibold">{bridgeResult.alternativeContextSuggestion || 'Amati dan potret benda atau fenomena nyata lain yang relevan dengan materi ini'}</span>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* The Pedagogical Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 👁️ Yang Saya Lihat */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4F8EF7] flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase">
                👁️ Yang Saya Lihat
              </h3>
              <p className="text-[11px] text-slate-400">Pengamatan & Hasil Temuanmu</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Render student's initial findings if present */}
            {studentObs && (
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-extrabold text-blue-700 tracking-wider uppercase block">
                  📝 Temuan Awal Pengamatanmu:
                </span>
                <p className="text-xs text-slate-700 font-semibold whitespace-pre-line leading-relaxed">
                  {studentObs}
                </p>
                {studentQuest && (
                  <p className="text-[11px] text-slate-600 mt-1 italic border-t border-blue-100/60 pt-1">
                    <span className="font-bold text-amber-600">❓ Rasa Penasaranmu:</span> "{studentQuest}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              {studentObs && (
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block pl-1">
                  🤖 Analisis & Detail Tambahan dari AI:
                </span>
              )}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 min-h-[90px]">
                {bridgeResult.observation}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: 🔗 Hubungannya dengan Pelajaran */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C5CFC] flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase">
                🔗 Hubungannya dengan Pelajaran
              </h3>
              <p className="text-[11px] text-slate-400">Koneksi ke Materi Pelajaran</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100 min-h-[90px]">
            {bridgeResult.learningBridge}
          </p>
        </div>

        {/* Card 3: 📚 Materi Guru */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#20C9A6] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase">
                📚 Materi Pembelajaran
              </h3>
              <p className="text-[11px] text-slate-400">Konfigurasi Guru</p>
            </div>
          </div>
          <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100 space-y-1 min-h-[90px]">
            <p className="text-xs font-bold text-emerald-900">{bridgeResult.subject}</p>
            <p className="text-xs sm:text-sm text-slate-700 leading-snug">
              {isMaterialExpanded ? bridgeResult.material : `${bridgeResult.material.substring(0, 150)}${bridgeResult.material.length > 150 ? '...' : ''}`}
            </p>
            {bridgeResult.material.length > 150 && (
              <button 
                onClick={() => setIsMaterialExpanded(!isMaterialExpanded)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer pt-1"
              >
                {isMaterialExpanded ? "Sembunyikan" : "Baca Selengkapnya"}
              </button>
            )}
          </div>
        </div>

        {/* Card 4: 🎯 Target Belajar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#FFC857] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase">
                🎯 Target Belajar
              </h3>
              <p className="text-[11px] text-slate-400">Kompetensi yang Dibangun</p>
            </div>
          </div>
          <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100 space-y-1 min-h-[90px]">
            <p className="text-xs font-bold text-amber-900">Tujuan Pembelajaran (TP)</p>
            <p className="text-xs sm:text-sm text-slate-700 leading-snug">
              {bridgeResult.learningTarget}
            </p>
          </div>
        </div>

        {/* Card: 📖 Ringkasan Materi Sederhana untuk Murid */}
        {bridgeResult.simpleMaterialSummary && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase">
                  📖 Ringkasan Materi Sederhana untuk Murid
                </h3>
                <p className="text-[11px] text-emerald-700 font-semibold">Rangkuman konsep inti dengan bahasa yang sangat mudah dipahami</p>
              </div>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              {bridgeResult.simpleMaterialSummary}
            </div>
          </div>
        )}

        {/* Card: 🎯 Taksonomi SOLO Eksplorasi */}
        {bridgeResult.soloTaxonomyLevel && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-indigo-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase">
                    🎯 Taksonomi SOLO (Tingkat Kedalaman Pemahaman)
                  </h3>
                  <p className="text-[11px] text-indigo-700 font-semibold">Struktur Hasil Belajar Teramati dari Eksplorasi Objek</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-800 text-xs font-extrabold border border-indigo-200">
                  {bridgeResult.soloTaxonomyLevel}
                </span>
              </div>
            </div>
            {bridgeResult.soloDescription && (
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/60 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                {bridgeResult.soloDescription}
              </div>
            )}
          </div>
        )}

        {/* Card: 💡 Pertanyaan Pematik untuk Murid (Diletakkan di Bagian Bawah - Wajib Diisi) */}
        <div className={`bg-white rounded-3xl p-5 sm:p-6 border ${showValidationWarning && !isPemantikFilled ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20' : 'border-amber-300'} shadow-sm hover:shadow-md transition-all space-y-4 md:col-span-2`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#25324B] tracking-wide uppercase flex items-center gap-2">
                  💡 Pertanyaan Pematik untuk Murid
                </h3>
                <p className="text-[11px] text-amber-700 font-semibold">Pancingan rasa ingin tahu & eksplorasi konsep</p>
              </div>
            </div>

            <div className="shrink-0">
              {isPemantikFilled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Sudah Diisi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  Wajib Diisi untuk Melanjutkan
                </span>
              )}
            </div>
          </div>

          {/* List of Guiding Questions */}
          <div className="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
            <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider block">
              Pertanyaan yang Perlu Kamu Renungkan:
            </span>
            <div className="space-y-2">
              {questionsList.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-medium">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">"{q}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Mandatory Response Field */}
          <div className="space-y-2 pt-1">
            <label htmlFor="pemantik-answer-input" className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-slate-800">
                <PenTool className="w-3.5 h-3.5 text-amber-600" />
                Tuliskan Jawaban / Tanggapanmu terhadap Pertanyaan Pematik di Atas:
                <span className="text-rose-600 font-extrabold">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                {pemantikAnswer.length} karakter
              </span>
            </label>

            <textarea
              id="pemantik-answer-input"
              rows={3}
              value={pemantikAnswer}
              onChange={(e) => {
                setPemantikAnswer(e.target.value);
                if (showValidationWarning && e.target.value.trim().length >= 3) {
                  setShowValidationWarning(false);
                }
              }}
              placeholder="Ketikkan pemikiran, hipotesis, atau jawabanmu mengenai pertanyaan pemantik di atas... (Wajib diisi sebelum lanjut ke tantangan penalaran)"
              className={`w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-white rounded-2xl border ${showValidationWarning && !isPemantikFilled ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-slate-300 focus:border-[#4F8EF7] focus:ring-2 focus:ring-blue-100'} outline-none transition-all placeholder:text-slate-400`}
            />

            {showValidationWarning && !isPemantikFilled && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 pt-0.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Pertanyaan pemantik wajib diisi terlebih dahulu sebelum memulai tantangan penalaran.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onRetakePhoto}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            Foto Objek Lain
          </button>
        </div>

        <div className="w-full sm:w-auto flex flex-col items-end gap-1">
          <button
            onClick={handleAttemptStartChallenge}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98 cursor-pointer ${
              isPemantikFilled
                ? 'bg-gradient-to-r from-[#4F8EF7] via-[#7C5CFC] to-[#20C9A6] text-white hover:shadow-lg hover:shadow-blue-500/25'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300 border border-slate-300'
            }`}
          >
            <Brain className="w-5 h-5" />
            Mulai Tantangan Penalaran
          </button>
          {!isPemantikFilled && (
            <span className="text-[11px] text-amber-700 font-medium text-center sm:text-right w-full">
              * Isi pertanyaan pemantik di atas untuk membuka tombol
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

