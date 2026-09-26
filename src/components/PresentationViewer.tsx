import React, { useState, useEffect, useRef } from 'react';
import { PresentationSlide, PeerQuestion } from '../types';
import { APP_LOGO } from '../constants/branding';
import { PhotoZoomModal } from './PhotoZoomModal';
import { PresentationSlideVisual } from './PresentationSlideVisual';
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  MessageSquare,
  Lightbulb,
  Send,
  X,
  CheckCircle2,
  Tv,
  Layers,
  Search,
  Filter,
  ListOrdered,
  Sparkles,
  Trophy,
  Target,
  ZoomIn,
  Grid,
  Flame,
  ArrowRight
} from 'lucide-react';

interface PresentationViewerProps {
  slides: PresentationSlide[];
  onClose: () => void;
  peerQuestions: PeerQuestion[];
  onAddPeerAnswer?: (questionId: string, answer: string) => void;
  presenterName: string;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  slides,
  onClose,
  peerQuestions,
  onAddPeerAnswer,
  presenterName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakingNotes, setShowSpeakingNotes] = useState(true);
  const [showPeerModal, setShowPeerModal] = useState(false);
  const [showSlideDrawer, setShowSlideDrawer] = useState(false);
  const [newAnswerText, setNewAnswerText] = useState('');
  const [activePeerQuestionId, setActivePeerQuestionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });

  // Photo zoom state
  const [zoomPhotoData, setZoomPhotoData] = useState<{ url: string; title: string } | null>(null);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  if (!activeSlide) return null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed or restricted:', err);
      setIsFullscreen((prev) => !prev);
    }
  };

  // Sync fullscreen state with browser changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside peer question modal input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLaserActive((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowSlideDrawer((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (zoomPhotoData) {
          setZoomPhotoData(null);
        } else if (showSlideDrawer) {
          setShowSlideDrawer(false);
        } else if (showPeerModal) {
          setShowPeerModal(false);
        } else if (!document.fullscreenElement) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onClose, zoomPhotoData, showSlideDrawer, showPeerModal]);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendAnswer = (qId: string) => {
    if (newAnswerText.trim() && onAddPeerAnswer) {
      onAddPeerAnswer(qId, newAnswerText.trim());
      setNewAnswerText('');
      setActivePeerQuestionId(null);
    }
  };

  // Laser Pointer Mouse Movement
  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLaserActive) {
      const rect = e.currentTarget.getBoundingClientRect();
      setLaserPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Helper stage color themes
  const getStageTheme = (layout: string, title: string) => {
    if (layout === 'decomposition' || title.toLowerCase().includes('dekomposisi')) {
      return {
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        accentBg: 'bg-indigo-50 border-indigo-200',
        icon: <Layers className="w-4 h-4 text-indigo-600" />,
        name: 'Langkah 1: Dekomposisi'
      };
    }
    if (layout === 'pattern' || title.toLowerCase().includes('pola')) {
      return {
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        accentBg: 'bg-amber-50 border-amber-200',
        icon: <Search className="w-4 h-4 text-amber-600" />,
        name: 'Langkah 2: Pengenalan Pola'
      };
    }
    if (layout === 'abstraction' || title.toLowerCase().includes('abstraksi')) {
      return {
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
        accentBg: 'bg-purple-50 border-purple-200',
        icon: <Filter className="w-4 h-4 text-purple-600" />,
        name: 'Langkah 3: Abstraksi'
      };
    }
    if (layout === 'algorithm' || title.toLowerCase().includes('algoritma')) {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        accentBg: 'bg-emerald-50 border-emerald-200',
        icon: <ListOrdered className="w-4 h-4 text-emerald-600" />,
        name: 'Langkah 4: Berpikir Algoritma'
      };
    }
    if (layout === 'reflection' || title.toLowerCase().includes('refleksi')) {
      return {
        badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
        accentBg: 'bg-yellow-50 border-yellow-200',
        icon: <Trophy className="w-4 h-4 text-amber-500" />,
        name: 'Refleksi Pembelajaran'
      };
    }
    return {
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
      accentBg: 'bg-blue-50 border-blue-200',
      icon: <Sparkles className="w-4 h-4 text-blue-600" />,
      name: 'Eksplorasi Kontekstual'
    };
  };

  const currentTheme = getStageTheme(activeSlide.layout, activeSlide.title);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between select-none ${
        isFullscreen ? 'h-screen w-screen overflow-hidden' : ''
      }`}
    >
      {/* Top Bar Controls */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md z-20">
        {/* Left: Slide Progress & Presenter info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600/30 text-blue-300 border border-blue-500/40 font-mono shadow-xs">
            Slide {currentSlideIndex + 1} / {slides.length}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-200 hidden sm:inline flex items-center gap-1.5 truncate max-w-xs md:max-w-md">
            <Tv className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-purple-300">{presenterName}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 truncate">NARASA Mode Presentasi Proyektor</span>
          </span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Laser Pointer Toggle */}
          <button
            type="button"
            onClick={() => setIsLaserActive(!isLaserActive)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isLaserActive
                ? 'bg-red-600 text-white shadow-md shadow-red-500/30 ring-1 ring-red-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Penunjuk Laser Merah (Tekan L)"
          >
            <Flame className={`w-4 h-4 ${isLaserActive ? 'text-yellow-300 animate-pulse' : 'text-red-400'}`} />
            <span className="hidden md:inline">{isLaserActive ? 'Laser Aktif' : 'Laser (L)'}</span>
          </button>

          {/* Slide Overview Grid Drawer */}
          <button
            type="button"
            onClick={() => setShowSlideDrawer(!showSlideDrawer)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showSlideDrawer
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Daftar Semua Slide (Tekan G)"
          >
            <Grid className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Semua Slide</span>
          </button>

          {/* Fullscreen Mode Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer ${
              isFullscreen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isFullscreen ? 'Keluar Layar Penuh (F / ESC)' : 'Tayangkan Layar Penuh (F)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-blue-400" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Layar Normal' : 'Layar Penuh (F)'}
            </span>
          </button>

          {/* Toggle Speaking Notes */}
          <button
            type="button"
            onClick={() => setShowSpeakingNotes(!showSpeakingNotes)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showSpeakingNotes
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Tampilkan / Sembunyikan Bantuan Berbicara"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">
              {showSpeakingNotes ? 'Catatan Bicara' : 'Panduan Bicara'}
            </span>
          </button>

          {/* Tanya Teman Button */}
          <button
            type="button"
            onClick={() => setShowPeerModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Buka Sesi Tanya Teman"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Tanya Teman</span>
            {peerQuestions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-purple-700 text-[10px] font-black flex items-center justify-center">
                {peerQuestions.length}
              </span>
            )}
          </button>

          {/* Exit / Close Presentation */}
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
            title="Tutup Presentasi (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas Container */}
      <div
        onMouseMove={handleMouseMoveCanvas}
        className={`flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto bg-slate-900/80 relative ${
          isFullscreen ? 'bg-slate-950 p-2 sm:p-6 md:p-8' : ''
        }`}
      >
        {/* Laser pointer circle on canvas if active */}
        {isLaserActive && (
          <div
            className="pointer-events-none fixed z-50 w-5 h-5 rounded-full bg-red-500/90 shadow-[0_0_15px_6px_rgba(239,68,68,0.9)] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              left: `${laserPos.x}px`,
              top: `${laserPos.y}px`
            }}
          />
        )}

        {/* 16:9 Aspect Widescreen Slide Board */}
        <div
          className={`w-full max-w-5xl bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px] sm:min-h-[520px] transition-all text-slate-900 ${
            isFullscreen ? 'max-w-6xl min-h-[580px] shadow-blue-500/10' : ''
          }`}
        >
          {/* Top Decorative Corner Badges */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${currentTheme.badgeBg}`}>
                {currentTheme.icon}
                <span>{activeSlide.badge || currentTheme.name}</span>
              </span>
              {activeSlide.tags && activeSlide.tags.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {activeSlide.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                <span>📚 Literasi & Numerasi Kontekstual</span>
              </span>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-extrabold shadow-2xs">
                <img
                  src={APP_LOGO}
                  alt="Logo"
                  className="w-4 h-4 object-contain rounded"
                />
                <span>NARASA Project</span>
              </div>
            </div>
          </div>

          {/* SLIDE CONTENT LAYOUTS */}
          <div className="py-4 my-auto flex-1 flex flex-col justify-center">
            {/* 1. TITLE / HERO COVER SLIDE */}
            {activeSlide.layout === 'title' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center max-w-4xl mx-auto py-2">
                <div className="md:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{activeSlide.subtitle || 'Proyek Penalaran STEM'}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F172A] font-display leading-tight tracking-tight">
                    {activeSlide.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                    {activeSlide.content}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-800 flex items-center gap-2">
                      <span>👤 Presenter:</span>
                      <span className="text-blue-700">{presenterName}</span>
                    </div>
                    {activeSlide.keyHighlight && (
                      <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-600" />
                        <span>{activeSlide.keyHighlight}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Hero Photo Visual */}
                <div className="md:col-span-5 flex justify-center">
                  {activeSlide.image ? (
                    <div
                      onClick={() => setZoomPhotoData({ url: activeSlide.image!, title: activeSlide.title })}
                      className="group relative cursor-pointer overflow-hidden rounded-3xl border-4 border-white ring-4 ring-blue-200 shadow-2xl aspect-square w-52 sm:w-64 bg-slate-900 transition-all hover:scale-105"
                      title="Klik untuk memperbesar foto cover"
                    >
                      <img
                        src={activeSlide.image}
                        alt="Cover Objek"
                        className="w-full h-full object-cover group-hover:brightness-105 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                        <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                        <span className="text-[10px] font-black bg-black/60 px-2 py-0.5 rounded-full">
                          Perbesar Foto
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white text-center truncate">
                        📸 Objek Pengamatan Siswa
                      </div>
                    </div>
                  ) : (
                    <div className="w-52 sm:w-64 aspect-square rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-center p-6 shadow-xl">
                      <Sparkles className="w-12 h-12 text-yellow-300" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 2. SPLIT LAYOUT FOR ALL OTHER STAGES WITH SUPPORTING VISUALS */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-1">
                {/* Left Column: Descriptive Content & Bullet points */}
                <div className="lg:col-span-7 space-y-3.5 text-left">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-wider block">
                      {activeSlide.subtitle}
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-[#0F172A] leading-tight">
                      {activeSlide.title}
                    </h2>
                  </div>

                  {/* Main narrative block */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200 shadow-2xs text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {activeSlide.content}
                  </div>

                  {/* Structured Bullets / Findings */}
                  {activeSlide.bullets && activeSlide.bullets.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {activeSlide.bullets.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-100 flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-semibold shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Interactive Visuals, Real Photo & Diagrams */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <PresentationSlideVisual
                    slide={activeSlide}
                    onOpenPhotoZoom={(url, title) => setZoomPhotoData({ url, title: title || activeSlide.title })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Info on Slide */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>
              Langkah {currentSlideIndex + 1} dari {slides.length} • {activeSlide.title}
            </span>
            <span className="hidden sm:inline">
              Presenter: <strong className="text-slate-700">{presenterName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Speaking Notes Drawer (🎙️ Panduan Berbicara Siswa) */}
      {showSpeakingNotes && activeSlide.speakingNotes && (
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-amber-950/80 border-t border-amber-800/50 backdrop-blur-md flex items-center justify-between gap-3 text-left z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-amber-100 min-w-0">
              <span className="font-extrabold text-amber-300 block text-[11px] uppercase tracking-wide">
                🎙️ Bantuan Bicara Murid:
              </span>
              <p className="font-medium text-amber-50 line-clamp-2 leading-relaxed">
                “{activeSlide.speakingNotes}”
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSpeak(activeSlide.speakingNotes)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer border border-amber-400/30"
            title="Dengarkan contoh cara membacakan slide ini"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Bacakan Contoh</span>
          </button>
        </div>
      )}

      {/* Bottom Slide Navigation Toolbar */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/95 flex items-center justify-between z-10">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-30 transition cursor-pointer min-h-[40px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        {/* Center: Slide dots indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlideIndex
                  ? 'w-7 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xs'
                  : 'w-2.5 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Menuju Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-30 transition hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer min-h-[40px]"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 📋 SLIDE OVERVIEW GRID DRAWER / MODAL */}
      {showSlideDrawer && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-left shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-display">
                    Daftar Semua Slide Presentasi ({slides.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Klik pada slide mana saja untuk melompat langsung
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSlideDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {slides.map((s, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      setShowSlideDrawer(false);
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isActive
                        ? 'border-blue-500 bg-blue-950/50 ring-2 ring-blue-400/40 shadow-md'
                        : 'border-slate-800 bg-slate-850 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        Slide {idx + 1}
                      </span>
                      {s.image && <span className="text-[10px] text-blue-400">📸 Foto</span>}
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {s.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {s.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 💬 Tanya Teman Modal (Peer Question) */}
      {showPeerModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-left shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-600/30 text-purple-300">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    💬 Tanya Teman (Peer Question)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pertanyaan dari teman sekelas setelah menyimak presentasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPeerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {peerQuestions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 font-bold">
                    Belum ada pertanyaan dari teman.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ajak teman sekelasmu mengajukan pertanyaan atau tanggapan menarik!
                  </p>
                </div>
              ) : (
                peerQuestions.map((pq) => (
                  <div
                    key={pq.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={pq.avatar}
                          alt={pq.askerName}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/30"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{pq.askerName}</p>
                          <p className="text-[10px] text-slate-400">{pq.timestamp}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                        Teman Sekelas
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                      “{pq.question}”
                    </p>

                    {pq.aiCoachHint && (
                      <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/50 text-[11px] text-blue-200 flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                        <span>
                          <strong>Tips Menjawab:</strong> {pq.aiCoachHint}
                        </span>
                      </div>
                    )}

                    {pq.presenterAnswer ? (
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-xs text-emerald-200">
                        <strong className="block text-emerald-300 mb-0.5">
                          Jawaban {presenterName}:
                        </strong>
                        {pq.presenterAnswer}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={activePeerQuestionId === pq.id ? newAnswerText : ''}
                          onFocus={() => setActivePeerQuestionId(pq.id)}
                          onChange={(e) => setNewAnswerText(e.target.value)}
                          placeholder="Jawab pertanyaan temanmu..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 outline-none"
                        />
                        {activePeerQuestionId === pq.id && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSendAnswer(pq.id)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Kirim Jawaban</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔍 PHOTO FULLSCREEN LIGHTBOX ZOOM MODAL */}
      {zoomPhotoData && (
        <PhotoZoomModal
          isOpen={true}
          onClose={() => setZoomPhotoData(null)}
          photoUrl={zoomPhotoData.url}
          title={`📸 Mengamati Foto Slide: ${zoomPhotoData.title}`}
          subtitle={`Presenter: ${presenterName} • NARASA Project`}
        />
      )}
    </div>
  );
};
