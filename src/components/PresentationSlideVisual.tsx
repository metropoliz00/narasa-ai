import React from 'react';
import { PresentationSlide } from '../types';
import {
  Layers,
  Search,
  Filter,
  ListOrdered,
  Sparkles,
  CheckCircle2,
  ZoomIn,
  Target,
  Trophy,
  ArrowRight,
  Eye,
  BookOpen,
  Lightbulb,
  Compass,
  MessageSquare
} from 'lucide-react';

interface PresentationSlideVisualProps {
  slide: PresentationSlide;
  onOpenPhotoZoom?: (photoUrl: string, title?: string) => void;
}

export const PresentationSlideVisual: React.FC<PresentationSlideVisualProps> = ({
  slide,
  onOpenPhotoZoom
}) => {
  const photo = slide.image;
  const visualType = slide.supportVisualType || (
    slide.layout === 'decomposition' ? 'decomposition' :
    slide.layout === 'pattern' ? 'pattern' :
    slide.layout === 'abstraction' ? 'abstraction' :
    slide.layout === 'algorithm' ? 'algorithm' :
    slide.layout === 'reflection' ? 'reflection' :
    slide.layout === 'conclusion' ? 'summary' :
    photo ? 'photo' : 'summary'
  );

  return (
    <div className="w-full h-full flex flex-col justify-center space-y-3">
      {/* 1. REAL PHOTO CONTAINER WITH ZOOM BUTTON (if photo exists) */}
      {photo && (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-950/80 max-h-56 sm:max-h-64 flex items-center justify-center">
          <img
            src={photo}
            alt={slide.title}
            className="w-full h-full max-h-56 sm:max-h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {onOpenPhotoZoom && (
              <button
                type="button"
                onClick={() => onOpenPhotoZoom(photo, slide.title)}
                className="px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Perbesar Foto</span>
              </button>
            )}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-blue-300" />
            <span>Foto Objek Nyata</span>
          </div>
        </div>
      )}

      {/* 2. STAGE-SPECIFIC INFOGRAPHIC DIAGRAMS */}
      {visualType === 'decomposition' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Diagram Urai Dekomposisi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-900">
              3 Komponen Kunci
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
            <div className="p-2 rounded-xl bg-white border border-indigo-200 shadow-2xs space-y-1">
              <div className="w-6 h-6 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                1
              </div>
              <span className="block text-slate-800 leading-tight">Bagian Luar / Struktur</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-indigo-200 shadow-2xs space-y-1">
              <div className="w-6 h-6 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                2
              </div>
              <span className="block text-slate-800 leading-tight">Bagian Inti / Mekanisme</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-indigo-200 shadow-2xs space-y-1">
              <div className="w-6 h-6 mx-auto rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                3
              </div>
              <span className="block text-slate-800 leading-tight">Fungsi Nyata Tiap Bagian</span>
            </div>
          </div>
        </div>
      )}

      {visualType === 'pattern' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-amber-600" />
              Infografis Keteraturan Pola
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
              Pola Terbukti
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                🔄
              </div>
              <div>
                <span className="font-extrabold text-amber-950 block">Pola Berulang</span>
                <span className="text-slate-600 text-[10px]">Bentuk / susunan teratur</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                📐
              </div>
              <div>
                <span className="font-extrabold text-orange-950 block">Kaidah Materi</span>
                <span className="text-slate-600 text-[10px]">Sesuai konsep pelajaran</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {visualType === 'abstraction' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-purple-600" />
              Penyaringan Fokus Abstraksi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
              Fokus Jelas
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs text-emerald-950">
              <span className="font-extrabold flex items-center gap-1 text-[11px] mb-0.5">
                🎯 Fokus Utama
              </span>
              <p className="text-[10px] text-emerald-800 leading-snug">
                Sifat & ukuran esensial yang menentukan cara kerja
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs text-slate-700">
              <span className="font-extrabold flex items-center gap-1 text-[11px] mb-0.5">
                🔍 Detail Pengalih
              </span>
              <p className="text-[10px] text-slate-600 leading-snug">
                Warna hiasan/debu yang tidak mempengaruhi konsep
              </p>
            </div>
          </div>
        </div>
      )}

      {visualType === 'algorithm' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              Alur Langkah Algoritma (1-2-3)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
              Runtun & Teratur
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-center text-[10px] font-bold">
            <div className="flex-1 p-2 rounded-xl bg-white border border-emerald-200 shadow-2xs">
              <span className="w-5 h-5 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-black mb-1">
                1
              </span>
              <span className="text-slate-800 block">Langkah Awal</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div className="flex-1 p-2 rounded-xl bg-white border border-emerald-200 shadow-2xs">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500 text-white flex items-center justify-center font-black mb-1">
                2
              </span>
              <span className="text-slate-800 block">Aksi Inti</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div className="flex-1 p-2 rounded-xl bg-white border border-emerald-200 shadow-2xs">
              <span className="w-5 h-5 mx-auto rounded-full bg-blue-500 text-white flex items-center justify-center font-black mb-1">
                3
              </span>
              <span className="text-slate-800 block">Hasil & Uji</span>
            </div>
          </div>
        </div>
      )}

      {visualType === 'reflection' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-yellow-950 font-black text-xs">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Pencapaian Berpikir Kritis & STEM</span>
          </div>
          <p className="text-slate-700 text-xs leading-relaxed font-medium">
            Pengalaman langsung mengamati objek nyata membangun rasa ingin tahu ilmiah dan keterampilan berpikir pemecahan masalah.
          </p>
        </div>
      )}

      {/* Key Takeaway Callout if present */}
      {slide.keyHighlight && (
        <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xs flex items-start gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-yellow-300 block uppercase tracking-wider">
              Intisari Penting:
            </span>
            <p className="text-slate-200 font-medium leading-snug">{slide.keyHighlight}</p>
          </div>
        </div>
      )}
    </div>
  );
};
