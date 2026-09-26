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
  AlertCircle,
  ZoomIn
} from 'lucide-react';
import { PhotoZoomModal } from './PhotoZoomModal';

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
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, string>>({});
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);

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

  const filledCount = questionsList.filter((_, idx) => (answersByQuestion[idx] || '').trim().length >= 3).length;
  const isPemantikFilled = filledCount === questionsList.length && questionsList.length > 0;

  const handleAnswerChange = (index: number, value: string) => {
    setAnswersByQuestion((prev) => ({
      ...prev,
      [index]: value
    }));
    if (showValidationWarning) {
      const allFilled = questionsList.every((_, idx) => {
        const val = idx === index ? value : (answersByQuestion[idx] || '');
        return val.trim().length >= 3;
      });
      if (allFilled) {
        setShowValidationWarning(false);
      }
    }
  };

  const handleAttemptStartChallenge = () => {
    if (!isPemantikFilled) {
      setShowValidationWarning(true);
      const firstUnfilledIdx = questionsList.findIndex((_, idx) => (answersByQuestion[idx] || '').trim().length < 3);
      if (firstUnfilledIdx !== -1) {
        const inputEl = document.getElementById(`pemantik-answer-input-${firstUnfilledIdx}`);
        if (inputEl) {
          inputEl.focus();
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    setShowValidationWarning(false);
    const combinedResponse = questionsList
      .map((q, idx) => `${idx + 1}. ${q}\nJawaban: ${(answersByQuestion[idx] || '').trim()}`)
      .join('\n\n');
    onStartChallenge(combinedResponse);
  };

  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    return (
      <div className="space-y-3.5">
        {paragraphs.map((para, idx) => {
          const isHeader =
            para.startsWith('📌') ||
            para.startsWith('🏷️') ||
            para.startsWith('🔍') ||
            para.startsWith('💡') ||
            para.startsWith('#');
          const lines = para.split('\n');

          const getCardStyle = () => {
            if (para.startsWith('📌')) return 'bg-blue-50/70 border-blue-200 text-blue-950';
            if (para.startsWith('🏷️')) return 'bg-purple-50/70 border-purple-200 text-purple-950';
            if (para.startsWith('🔍')) return 'bg-emerald-50/70 border-emerald-200 text-emerald-950';
            if (para.startsWith('💡')) return 'bg-amber-50/80 border-amber-200 text-amber-950';
            return 'bg-slate-50 border-slate-200/80 text-slate-800';
          };

          return (
            <div
              key={idx}
              className={`rounded-2xl p-3.5 sm:p-4 border transition-all shadow-2xs ${getCardStyle()}`}
            >
              {lines.map((line, lineIdx) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
                const formattedLine = parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={pIdx} className="font-extrabold text-inherit">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                });

                const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ');
                const isNumbered = /^\d+\.\s/.test(trimmedLine);

                if (lineIdx === 0 && isHeader) {
                  return (
                    <div
                      key={lineIdx}
                      className="font-black text-xs sm:text-sm tracking-wide mb-1.5 flex items-center gap-1.5 leading-snug"
                    >
                      {formattedLine}
                    </div>
                  );
                }

                if (isBullet || isNumbered) {
                  return (
                    <div
                      key={lineIdx}
                      className="flex items-start gap-2 text-xs sm:text-sm font-medium leading-relaxed my-1 pl-1"
                    >
                      <span className="text-inherit opacity-70 shrink-0 select-none">•</span>
                      <span className="flex-1">{formattedLine}</span>
                    </div>
                  );
                }

                return (
                  <p key={lineIdx} className="text-xs sm:text-sm font-medium leading-relaxed my-0.5">
                    {formattedLine}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto text-left">
      {/* Top Banner with Photo & Object Detected */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 sm:gap-5 relative">
        <div
          onClick={() => setIsPhotoZoomOpen(true)}
          className="group relative w-full md:w-56 h-48 sm:h-44 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 shrink-0 border-2 border-slate-200 hover:border-blue-400 shadow-inner cursor-pointer transition-all"
          title="Klik untuk memperbesar foto objek"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsPhotoZoomOpen(true);
            }
          }}
        >
          <img
            src={photoUrl}
            alt={bridgeResult.detectedObject}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
            Foto Pengamatan
          </div>
          <div className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
            <ZoomIn className="w-6 h-6 drop-shadow animate-pulse" />
            <span className="text-[10px] font-black bg-blue-600/90 px-2 py-0.5 rounded-full shadow-xs">
              Klik untuk Zoom 🔍
            </span>
          </div>
          <div className="absolute bottom-2 right-2 bg-blue-600/90 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-white/20 backdrop-blur-xs">
            <ZoomIn className="w-3 h-3" />
            <span>Zoom Foto</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 text-left w-full">
          <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border ${badge.bg}`}>
              <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{badge.label}</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-[#25324B] font-display">
            {bridgeResult.detectedObject}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {bridgeResult.compatibilityReason}
          </p>

          {isWeak && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1 text-left">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Card 1: 👁️ Yang Saya Lihat */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-blue-950 tracking-wide uppercase">
                👁️ Yang Saya Lihat
              </h3>
              <p className="text-[10px] sm:text-[11px] text-blue-600 font-semibold">Pengamatan & Temuanmu</p>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {/* Render student's initial findings if present */}
            {studentObs && (
              <div className="bg-blue-100/60 border-2 border-blue-200 p-3 sm:p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-blue-800 tracking-wider uppercase block">
                  📝 Temuan Awal Pengamatanmu:
                </span>
                <p className="text-xs text-slate-800 font-bold whitespace-pre-line leading-relaxed">
                  {studentObs}
                </p>
                {studentQuest && (
                  <p className="text-[11px] text-slate-700 mt-1 italic border-t border-blue-200 pt-1">
                    <span className="font-bold text-amber-700">❓ Rasa Penasaranmu:</span> "{studentQuest}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              {studentObs && (
                <span className="text-[10px] font-black text-blue-700 tracking-wider uppercase block pl-1">
                  🤖 Analisis & Detail AI:
                </span>
              )}
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white p-3 sm:p-3.5 rounded-2xl border-2 border-blue-100 min-h-[80px] shadow-2xs">
                {bridgeResult.observation}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: 🔗 Hubungannya dengan Pelajaran */}
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-purple-200 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-purple-950 tracking-wide uppercase">
                🔗 Hubungan Pelajaran
              </h3>
              <p className="text-[10px] sm:text-[11px] text-purple-600 font-semibold">Koneksi ke Materi Pelajaran</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white p-3 sm:p-3.5 rounded-2xl border-2 border-purple-100 min-h-[80px] shadow-2xs">
            {bridgeResult.learningBridge}
          </p>
        </div>

        {/* Card 3: 📚 Materi Guru */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-emerald-200 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950 tracking-wide uppercase">
                📚 Materi Pelajaran
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold">Konsep yang Dipelajari</p>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-100 space-y-1 min-h-[80px] shadow-2xs">
            <p className="text-xs font-black text-emerald-900">{bridgeResult.subject}</p>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-snug">
              {isMaterialExpanded ? bridgeResult.material : `${bridgeResult.material.substring(0, 150)}${bridgeResult.material.length > 150 ? '...' : ''}`}
            </p>
            {bridgeResult.material.length > 150 && (
              <button 
                onClick={() => setIsMaterialExpanded(!isMaterialExpanded)}
                className="text-xs font-black text-emerald-700 hover:text-emerald-900 cursor-pointer pt-1 min-h-[32px] flex items-center"
              >
                {isMaterialExpanded ? "Sembunyikan" : "Baca Selengkapnya"}
              </button>
            )}
          </div>
        </div>

        {/* Card 4: 🎯 Target Belajar */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-200 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-amber-950 tracking-wide uppercase">
                🎯 Target Belajar
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-600 font-semibold">Kompetensi yang Dibangun</p>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border-2 border-amber-100 space-y-1 min-h-[80px] shadow-2xs">
            <p className="text-xs font-black text-amber-900">Tujuan Pembelajaran (TP)</p>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-snug">
              {bridgeResult.learningTarget}
            </p>
          </div>
        </div>

        {/* Card: 📖 Ringkasan Materi & Modal Belajar Murid */}
        {bridgeResult.simpleMaterialSummary && (
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-blue-50/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-teal-300 shadow-sm hover:shadow-md transition-all space-y-4 md:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-teal-950 tracking-wide uppercase flex items-center gap-1.5">
                    <span>📖 Modal Belajar: Ringkasan & Konsep Kunci</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      Bekal Eksplorasi
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-teal-700 font-semibold">
                    Pengertian hakiki, jenis-jenis penting, ciri khusus, dan tips penyelidikan
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Siap Belajar Mandiri</span>
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-teal-100 shadow-2xs">
              {renderFormattedSummary(bridgeResult.simpleMaterialSummary)}
            </div>
          </div>
        )}

        {/* Card: 🎯 Taksonomi SOLO Eksplorasi */}
        {bridgeResult.soloTaxonomyLevel && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-indigo-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#25324B] tracking-wide uppercase">
                    🎯 Taksonomi SOLO
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-indigo-700 font-semibold">Struktur Pemahaman Teramati</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-xl bg-indigo-100 text-indigo-800 text-[11px] sm:text-xs font-extrabold border border-indigo-200">
                  {bridgeResult.soloTaxonomyLevel}
                </span>
              </div>
            </div>
            {bridgeResult.soloDescription && (
              <div className="bg-indigo-50/50 p-3.5 sm:p-4 rounded-2xl border border-indigo-200/60 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                {bridgeResult.soloDescription}
              </div>
            )}
          </div>
        )}

        {/* Card: 💡 Pertanyaan Pemantik untuk Murid (Wajib Diisi - Masing-masing Pertanyaan Memiliki Kolom Tanggapan Sendiri) */}
        <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border ${showValidationWarning && !isPemantikFilled ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20' : 'border-amber-300'} shadow-sm hover:shadow-md transition-all space-y-4 md:col-span-2`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#25324B] tracking-wide uppercase flex items-center gap-2">
                  💡 Pertanyaan Pemantik Murid
                </h3>
                <p className="text-[10px] sm:text-[11px] text-amber-700 font-semibold">
                  Pancingan rasa ingin tahu & eksplorasi konsep — Isi tanggapan pada masing-masing pertanyaan
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {isPemantikFilled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Sudah Diisi ({filledCount}/{questionsList.length})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  Wajib Diisi ({filledCount}/{questionsList.length})
                </span>
              )}
            </div>
          </div>

          {/* List of Questions with Individual Response Column per Question */}
          <div className="space-y-4 pt-1">
            {questionsList.map((questionText, idx) => {
              const currentVal = answersByQuestion[idx] || '';
              const isItemFilled = currentVal.trim().length >= 3;
              const isItemWarning = showValidationWarning && !isItemFilled;

              return (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    isItemWarning
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200'
                      : isItemFilled
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-amber-200/90 bg-amber-50/40'
                  }`}
                >
                  {/* Pertanyaan Header & Text */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-900 font-medium">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                          Pertanyaan {idx + 1}:
                        </span>
                        <p className="leading-relaxed font-bold text-slate-800 text-xs sm:text-sm">
                          "{questionText}"
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isItemFilled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terjawab
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Belum Diisi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Textarea Input for this Question */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`pemantik-answer-input-${idx}`}
                        className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] sm:text-xs"
                      >
                        <PenTool className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Kolom Tanggapan Pertanyaan {idx + 1}:</span>
                        <span className="text-rose-600 font-extrabold">*</span>
                      </label>
                      <span className="text-[11px] font-normal text-slate-400">
                        {currentVal.length} karakter
                      </span>
                    </div>

                    <textarea
                      id={`pemantik-answer-input-${idx}`}
                      rows={2}
                      value={currentVal}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      placeholder={`Ketikkan tanggapan atau jawabanmu untuk pertanyaan ${idx + 1} di sini...`}
                      className={`w-full p-3 text-xs sm:text-sm text-slate-800 bg-white rounded-xl border ${
                        isItemWarning
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#4F8EF7] focus:ring-2 focus:ring-blue-100'
                      } outline-none transition-all placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 leading-normal shadow-2xs`}
                    />

                    {isItemWarning && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Tanggapan pertanyaan {idx + 1} wajib diisi minimal 3 karakter.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {showValidationWarning && !isPemantikFilled && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Mohon lengkapi tanggapan untuk seluruh pertanyaan pemantik di atas ({filledCount}/{questionsList.length} terisi).
            </p>
          )}
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          onClick={onRetakePhoto}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer min-h-[46px]"
        >
          <RotateCw className="w-4 h-4" />
          <span>Foto Objek Lain</span>
        </button>

        <div className="w-full sm:w-auto flex flex-col items-end gap-1">
          <button
            onClick={handleAttemptStartChallenge}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-98 cursor-pointer min-h-[48px] ${
              isPemantikFilled
                ? 'bg-gradient-to-r from-[#4F8EF7] via-[#7C5CFC] to-[#20C9A6] text-white hover:shadow-lg hover:shadow-blue-500/25'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300 border border-slate-300'
            }`}
          >
            <Brain className="w-5 h-5 shrink-0" />
            <span>Mulai Tantangan Penalaran</span>
          </button>
          {!isPemantikFilled && (
            <span className="text-[11px] text-amber-700 font-medium text-center sm:text-right w-full">
              * Isi seluruh kolom tanggapan pertanyaan pemantik ({filledCount}/{questionsList.length}) untuk membuka tombol
            </span>
          )}
        </div>
      </div>

      {/* Interactive Photo Zoom Lightbox Modal */}
      <PhotoZoomModal
        isOpen={isPhotoZoomOpen}
        onClose={() => setIsPhotoZoomOpen(false)}
        photoUrl={photoUrl}
        title={`📸 Mengamati Objek: ${bridgeResult.detectedObject || 'Foto Objek'}`}
        subtitle={`Kategori: ${bridgeResult.material || 'STEM'} • Alasan: ${bridgeResult.compatibilityReason || ''}`}
      />
    </div>
  );
};

