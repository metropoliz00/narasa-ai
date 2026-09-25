import React from 'react';
import { UserProfile, UserRole } from '../types';
import {
  Sparkles,
  BookOpen,
  Calculator,
  Lightbulb,
  CheckCircle2,
  Presentation
} from 'lucide-react';
import { NarasaLogo } from './NarasaLogo';
import literacyNumeracyImg from '../assets/images/literasi_numerasi_sd_1789740595507.jpg';
import literacyNumeracyBrightBg from '../assets/images/literasi_numerasi_bright_bg_1789741597196.jpg';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
  onOpenRegisterModal: (role?: UserRole) => void;
  onOpenLoginModal?: () => void;
  onStartExploration?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  onOpenRegisterModal,
  onOpenLoginModal,
  onStartExploration
}) => {
  // Demo users by role for instant access if desired
  const studentUsers = users.filter((u) => u.role === 'student');
  const teacherUsers = users.filter((u) => u.role === 'teacher');
  const adminUsers = users.filter((u) => u.role === 'admin');

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 text-left animate-in fade-in duration-300">
      {/* 1. EXPANDED HERO BANNER WITH VIBRANT LITERACY & NUMERACY BACKGROUND */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-lg relative overflow-hidden border border-slate-200/90 bg-white group min-h-[220px] sm:min-h-[260px] flex items-center">
        {/* Background Image: Vivid, High Quality, Distinct Literacy & Numeracy */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={literacyNumeracyBrightBg}
            alt="Ilustrasi Literasi dan Numerasi Murid Sekolah Dasar"
            className="w-full h-full object-cover object-right lg:object-center opacity-85 group-hover:scale-102 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Subtle soft white gradient on left side for crisp text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/85 to-transparent lg:w-3/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/30 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3.5 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <NarasaLogo size="lg" withHoverAnimation={true} withGlow={true} />
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50/95 text-blue-700 border border-blue-200 shadow-xs backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Platform Pembelajaran Kontekstual & Literasi-Numerasi</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-[#1E293B] leading-snug sm:leading-tight">
            Menghubungkan Alam Sekitar dengan Kecakapan Literasi & Numerasi
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-normal bg-white/70 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none p-2.5 lg:p-0 rounded-xl max-w-2xl">
            <strong className="font-extrabold font-display bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">NARASA AI</strong> mentransformasikan objek dunia nyata menjadi laboratorium belajar sains dan matematika interaktif. Murid mengamati fenomena sekitar, mengukur pola spasial numerik, dan menyusun narasi ilmiah dengan bimbingan perancah berpikir tingkat tinggi.
          </p>
        </div>
      </div>

      {/* 2. EXPANDED FULL-WIDTH LITERACY & NUMERACY VISUAL SHOWCASE */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                Visualisasi Pembelajaran Kontekstual
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Pembelajaran Mendalam (Fase A, B, C)
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-[#25324B] font-display mt-2 leading-snug">
              Eksplorasi Literasi & Numerasi dari Fenomena Sekitar
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
            Integrasi multimodal AI membantu murid memahami esensi literasi sains dan logika numerasi langsung dari lingkungan nyata.
          </p>
        </div>

        {/* Expansive Full-Width Visual Display */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md group">
          <img
            src={literacyNumeracyImg}
            alt="Ilustrasi Literasi dan Numerasi Murid Sekolah Dasar"
            className="w-full h-64 sm:h-96 lg:h-[420px] object-cover object-center group-hover:scale-101 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Overlay Content with Highlight Tags */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-transparent flex flex-col justify-end p-4 sm:p-8 text-white">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-blue-500/90 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                Literasi Kontekstual
              </span>
              <span className="px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-500/90 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <Calculator className="w-3.5 h-3.5" />
                Numerasi Spasial & Geometri
              </span>
              <span className="px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-purple-500/90 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <Lightbulb className="w-3.5 h-3.5" />
                Nalar Kritis HOTS
              </span>
            </div>
            <h3 className="text-base sm:text-2xl font-bold font-display text-white max-w-3xl leading-snug">
              Membangun Kemampuan Berpikir Kritis Murid SD Melalui Observasi Nyata
            </h3>
            <p className="text-xs sm:text-sm text-slate-200/90 max-w-3xl mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed">
              Setiap foto yang diambil murid secara instan dianalisis untuk menemukan fakta sains, estimasi matematika, perbandingan rasio, serta memandu murid menarik kesimpulan logis.
            </p>
          </div>
        </div>

        {/* 3. CORE PILLARS OF LITERACY & NUMERACY (Responsive Grid Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-1 sm:pt-2">
          {/* Pillar 1 */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/60 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-blue-950 font-display">
              1. Literasi Kontekstual
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Mengenali objek, memahami konsep sains alam sekitar, serta memperkaya kosakata ilmiah dan narasi argumentatif.
            </p>
            <div className="text-[11px] font-bold text-blue-800 pt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Kosakata & Fakta Ilmiah</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-emerald-950 font-display">
              2. Numerasi Terapan
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Kalkulasi estimasi ukuran, perbandingan skala, pengenalan bentuk geometri 2D/3D, dan pengukuran kuantitatif.
            </p>
            <div className="text-[11px] font-bold text-emerald-800 pt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Matematika Realistik</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/60 border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-purple-950 font-display">
              3. Scaffolding Nalar Kritis
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Bimbingan perancah bertingkat (ZPD) yang memicu nalar murid menemukan jawaban tanpa langsung memberi contekan.
            </p>
            <div className="text-[11px] font-bold text-purple-800 pt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Pertanyaan Pemantik HOTS</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
              <Presentation className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-amber-950 font-display">
              4. Portofolio & Presentasi
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Menghasilkan bahan tayang kelas, slide refleksi belajar, dan asesmen formatif Pembelajaran Mendalam secara otomatis.
            </p>
            <div className="text-[11px] font-bold text-amber-800 pt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Presentasi Otomatis Kelas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
