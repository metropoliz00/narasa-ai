import React, { useState, useEffect } from 'react';
import { PresentationSlide, UserProfile } from '../types';
import { AIClientService } from '../services/aiClientService';
import { adaptSlidesToUser } from '../utils/presentationUtils';
import { toast } from './Toast';
import {
  Sparkles,
  Play,
  Edit3,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  Volume2,
  Layout,
  Check,
  Loader2,
  FileText,
  UserCheck,
  BookOpen
} from 'lucide-react';

interface PresentationEditorProps {
  slides: PresentationSlide[];
  onUpdateSlides: (slides: PresentationSlide[]) => void;
  onLaunchPresentation: () => void;
  currentUser?: UserProfile;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  slides,
  onUpdateSlides,
  onLaunchPresentation,
  currentUser
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishSuccessMessage, setPolishSuccessMessage] = useState(false);

  // Automatically adapt slides to the active user whenever currentUser is passed or changes
  useEffect(() => {
    if (currentUser?.name) {
      const adapted = adaptSlidesToUser(slides, currentUser);
      const isDifferent = adapted.some((s, i) =>
        s.title !== slides[i]?.title ||
        s.subtitle !== slides[i]?.subtitle ||
        s.content !== slides[i]?.content ||
        s.speakingNotes !== slides[i]?.speakingNotes
      );
      if (isDifferent) {
        onUpdateSlides(adapted);
      }
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.schoolName, currentUser?.className]);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const handleUpdateActiveSlide = (fields: Partial<PresentationSlide>) => {
    const updated = slides.map((s, idx) => {
      if (idx === currentSlideIndex) {
        return { ...s, ...fields };
      }
      return s;
    });
    onUpdateSlides(updated);
  };

  const handlePolishWithAI = async () => {
    if (!activeSlide) return;
    setIsPolishing(true);
    try {
      const result = await AIClientService.polishSlide(
        activeSlide.title,
        activeSlide.content,
        activeSlide.speakingNotes,
        currentUser?.name,
        currentUser?.schoolName,
        currentUser?.className
      );
      handleUpdateActiveSlide({
        title: result.polishedTitle || activeSlide.title,
        content: result.polishedContent || activeSlide.content,
        speakingNotes: result.polishedNotes || activeSlide.speakingNotes
      });
      setPolishSuccessMessage(true);
      setTimeout(() => setPolishSuccessMessage(false), 3000);
    } catch (e) {
      console.warn('Polish failed');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleAddSlide = () => {
    const newSlide: PresentationSlide = {
      id: `slide-custom-${Date.now()}`,
      slideNumber: slides.length + 1,
      title: 'Slide Tambahan Baru',
      subtitle: 'Catatan Observasi Ekstra',
      content: 'Tuliskan ide atau temuan menarik lainnya di sini untuk teman sekelasmu.',
      speakingNotes: 'Ceritakan gagasan ini dengan jelas kepada teman-teman.',
      layout: 'observation'
    };
    onUpdateSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, idx) => idx !== index);
    // re-number slides
    const renumbered = updated.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    onUpdateSlides(renumbered);
    setCurrentSlideIndex(Math.max(0, index - 1));
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentSlideIndex > 0) {
      const updated = [...slides];
      const temp = updated[currentSlideIndex];
      updated[currentSlideIndex] = updated[currentSlideIndex - 1];
      updated[currentSlideIndex - 1] = temp;
      const renumbered = updated.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
      onUpdateSlides(renumbered);
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (direction === 'down' && currentSlideIndex < slides.length - 1) {
      const updated = [...slides];
      const temp = updated[currentSlideIndex];
      updated[currentSlideIndex] = updated[currentSlideIndex + 1];
      updated[currentSlideIndex + 1] = temp;
      const renumbered = updated.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
      onUpdateSlides(renumbered);
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-xl bg-purple-100 text-[#7C5CFC]">
              <Edit3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#25324B] font-display">
              Studio Presentasi Murid
            </h2>
            {currentUser && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Akun: {currentUser.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 leading-relaxed">
            <span>Rangkuman karya dan refleksi milik</span>
            <span className="inline-flex items-center gap-1 font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {currentUser?.name || 'Murid'}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs text-[11px]">
              <span className="text-amber-600">🏷️</span>
              {currentUser?.className || 'Kelas V'}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs text-[11px]">
              <span className="text-emerald-600">🏫</span>
              {currentUser?.schoolName || 'SDN 01 Nusantara'}
            </span>
            <span>telah disusun menjadi <strong className="text-purple-700 font-extrabold">{slides.length} slide</strong> siap tampil.</span>
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto shrink-0 pt-1 xl:pt-0">
          <button
            type="button"
            onClick={handleAddSlide}
            className="px-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Tambah Slide</span>
          </button>
          <button
            type="button"
            onClick={onLaunchPresentation}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-extrabold hover:shadow-lg hover:shadow-blue-500/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Mulai Tampil (Mode Tayang)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Thumbnail Strip & Reorder (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3 max-h-[680px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Daftar Slide ({slides.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveSlide('up')}
                disabled={currentSlideIndex === 0}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="Pindah ke Atas"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveSlide('down')}
                disabled={currentSlideIndex === slides.length - 1}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="Pindah ke Bawah"
              >
                <MoveDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {slides.map((slide, index) => {
              const isActive = index === currentSlideIndex;
              return (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'border-[#4F8EF7] bg-blue-50/70 shadow-xs ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {slide.image ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 shadow-2xs relative">
                      <img src={slide.image} alt="Thumbnail" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[9px] font-black px-1 rounded-tl">
                        {slide.slideNumber}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#4F8EF7] text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {slide.slideNumber}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#25324B] truncate">
                      {slide.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {slide.subtitle || slide.content}
                    </p>
                  </div>
                  {slides.length > 1 && isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(index);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Slide Editor Canvas (Col 8) */}
        {activeSlide ? (
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                  Slide {activeSlide.slideNumber} dari {slides.length}
                </span>
              </div>

              {/* Rapiikan Kalimat Button */}
              <button
                onClick={handlePolishWithAI}
                disabled={isPolishing}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center gap-1.5"
              >
                {isPolishing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                )}
                <span>Rapiikan Kalimat</span>
              </button>
            </div>

            {polishSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Teks slide berhasil dirapikan agar lebih jelas saat dipresentasikan!</span>
              </div>
            )}

            {/* Slide Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Judul Slide</label>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => handleUpdateActiveSlide({ title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-base text-[#25324B] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            {/* Slide Subtitle Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Subjudul / Topik</label>
              <input
                type="text"
                value={activeSlide.subtitle || ''}
                onChange={(e) => handleUpdateActiveSlide({ subtitle: e.target.value })}
                placeholder="Tambahkan subjudul..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            {/* Slide Content Box */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Isi Teks Slide</label>
              <textarea
                rows={4}
                value={activeSlide.content}
                onChange={(e) => handleUpdateActiveSlide({ content: e.target.value })}
                className="w-full p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Optional Bullets */}
            {activeSlide.bullets && activeSlide.bullets.length > 0 && (
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-600 uppercase">Poin-Poin Ringkas</label>
                <div className="space-y-1.5">
                  {activeSlide.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#4F8EF7] shrink-0" />
                      <input
                        type="text"
                        value={b}
                        onChange={(e) => {
                          const newBullets = [...(activeSlide.bullets || [])];
                          newBullets[bIdx] = e.target.value;
                          handleUpdateActiveSlide({ bullets: newBullets });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🎙️ Bantuan Berbicara (Speaking Notes) */}
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>🎙️ Bantuan Berbicara (Presenter Notes)</span>
              </div>
              <textarea
                rows={2}
                value={activeSlide.speakingNotes}
                onChange={(e) => handleUpdateActiveSlide({ speakingNotes: e.target.value })}
                className="w-full p-3 rounded-xl border border-amber-200/80 bg-white/90 text-xs text-slate-700 focus:border-amber-400 outline-none resize-none"
                placeholder="Tuliskan petunjuk apa yang harus kamu katakan saat slide ini muncul..."
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Slide Sebelumnya
              </button>
              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlideIndex === slides.length - 1}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 disabled:opacity-40 flex items-center gap-1.5"
              >
                Slide Berikutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center gap-3">
             <BookOpen className="w-10 h-10 text-slate-400" />
             <p className="text-slate-500 font-medium">Belum ada materi presentasi.</p>
             <p className="text-slate-400 text-xs">Selesaikan misi belajarmu terlebih dahulu untuk membuat presentasi otomatis!</p>
          </div>
        )}
      </div>
    </div>
  );
};
