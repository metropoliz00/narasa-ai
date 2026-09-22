import React, { useState, useEffect, useRef } from 'react';
import { PresentationSlide, PeerQuestion } from '../types';
import { AIClientService } from '../services/aiClientService';
import { APP_LOGO } from '../constants/branding';
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
  UserCheck,
  CheckCircle2,
  Tv
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
  const [newAnswerText, setNewAnswerText] = useState('');
  const [activePeerQuestionId, setActivePeerQuestionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeSlide = slides[currentSlideIndex] || slides[0];

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
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onClose]);

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

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between select-none ${
        isFullscreen ? 'h-screen w-screen overflow-hidden' : ''
      }`}
    >
      {/* Top Bar Controls */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
            Slide {currentSlideIndex + 1} / {slides.length}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-300 hidden sm:inline flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-purple-400" />
            {presenterName} • NARASA Mode Presentasi
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Fullscreen Mode Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
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
              {isFullscreen ? 'Layar Normal' : 'Layar Penuh (Full Slide)'}
            </span>
          </button>

          {/* Toggle Speaking Notes */}
          <button
            onClick={() => setShowSpeakingNotes(!showSpeakingNotes)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              showSpeakingNotes
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden md:inline">
              {showSpeakingNotes ? 'Sembunyikan Catatan Berbicara' : 'Bantuan Berbicara'}
            </span>
          </button>

          {/* Exit / Close Presentation */}
          <button
            onClick={() => {
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Tutup Presentasi (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas (White Background with Literacy & Numeracy Decorations) */}
      <div className={`flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto bg-slate-900/60 ${isFullscreen ? 'bg-slate-950 p-2 sm:p-6 md:p-10' : ''}`}>
        <div className={`w-full max-w-5xl bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[480px] transition-all ${isFullscreen ? 'max-w-6xl min-h-[560px] shadow-blue-500/10' : ''}`}>
          {/* Literacy & Numeracy Decorative Badges in Corners */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-xs">
            <span>📚 Literasi Dasar</span>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-xs">
            <span>🧮 123 Numerasi Ceria</span>
          </div>
          <div className="absolute bottom-4 left-4 text-xs font-mono font-bold text-slate-300 select-none pointer-events-none">
            A B C • + − × ÷ = • 1 2 3
          </div>
          <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-700 bg-white/95 px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 backdrop-blur-xs transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-indigo-200 group cursor-default">
            <img
              src={APP_LOGO}
              alt="NARASA Logo"
              className="w-4 h-4 object-contain rounded transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6"
              referrerPolicy="no-referrer"
            />
            <span>NARASA Project</span>
          </div>

          {/* Slide Layouts - Clean Dark High-Contrast Typography on White Background */}
          {activeSlide.layout === 'title' ? (
            <div className="text-center space-y-6 relative z-10 max-w-3xl mx-auto py-4">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                {activeSlide.subtitle || 'Eksplorasi Kontekstual'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#25324B] font-display leading-tight tracking-tight">
                {activeSlide.title}
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
                {activeSlide.content}
              </p>
              {activeSlide.image && (
                <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden ring-4 ring-blue-500/25 shadow-xl mt-4">
                  <img
                    src={activeSlide.image}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ) : activeSlide.layout === 'split-photo' && activeSlide.image ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10 py-2">
              <div className="space-y-4">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
                  {activeSlide.subtitle}
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold font-display text-[#25324B]">
                  {activeSlide.title}
                </h2>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  {activeSlide.content}
                </p>
                {activeSlide.bullets && (
                  <ul className="space-y-2 pt-2">
                    {activeSlide.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-slate-700 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden ring-4 ring-slate-200 shadow-xl aspect-4/3 bg-slate-100">
                <img
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 relative z-10 max-w-3xl mx-auto py-4">
              <div className="space-y-2 text-center">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block">
                  {activeSlide.subtitle || 'Pembuktian Konsep'}
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold font-display text-[#25324B]">
                  {activeSlide.title}
                </h2>
              </div>

              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-normal bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs">
                {activeSlide.content}
              </p>

              {activeSlide.bullets && activeSlide.bullets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {activeSlide.bullets.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-blue-50/75 border border-blue-200 flex items-center gap-2.5 text-sm text-slate-800 font-medium shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Speaking Notes Drawer (🎙️ Bantuan Berbicara) */}
      {showSpeakingNotes && activeSlide.speakingNotes && (
        <div className="px-6 py-4 bg-amber-950/70 border-t border-amber-800/50 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-amber-100">
              <span className="font-bold text-amber-300 block">🎙️ Petunjuk Berbicara:</span>
              <span>“{activeSlide.speakingNotes}”</span>
            </div>
          </div>
          <button
            onClick={() => handleSpeak(activeSlide.speakingNotes)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 text-xs font-bold shrink-0 transition-colors"
          >
            Bacakan Contoh
          </button>
        </div>
      )}

      {/* Bottom Stage Navigation Controls */}
      <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>PREVIOUS</span>
        </button>

        {/* Center: Slide dots & Quick Fullscreen Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlideIndex
                    ? 'w-6 bg-[#4F8EF7]'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Menuju Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Keluar Layar Penuh (F)" : "Tayangkan Layar Penuh (F)"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-30 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <span>NEXT</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 💬 Tanya Teman Modal (Peer Question) */}
      {showPeerModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
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
                onClick={() => setShowPeerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {peerQuestions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Belum ada pertanyaan dari teman. Teman sekelasmu dapat bertanya sekarang!
                </p>
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
                              onClick={() => handleSendAnswer(pq.id)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5"
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
    </div>
  );
};
