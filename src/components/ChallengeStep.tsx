import React, { useState } from 'react';
import { ExplorationQuestion, ScaffoldingLevels, AILearningBridgeResult } from '../types';
import {
  Brain,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Volume2,
  CheckCircle,
  Layers,
  Search,
  MessageSquare,
  X
} from 'lucide-react';

interface ChallengeStepProps {
  questions: ExplorationQuestion[];
  learningBridge: AILearningBridgeResult;
  photoUrl: string;
  onCompleteChallenge: (answers: {
    challengeAnswer: string;
    reason: string;
    evidence: string;
    strategy: string;
    conclusion: string;
  }, scaffoldingUsed: { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]) => void;
}

export const ChallengeStep: React.FC<ChallengeStepProps> = ({
  questions,
  learningBridge,
  photoUrl,
  onCompleteChallenge
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form states
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [strategy, setStrategy] = useState('');
  const [conclusion, setConclusion] = useState('');

  // Scaffolding state
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [currentScaffoldLevel, setCurrentScaffoldLevel] = useState<1 | 2 | 3 | 4>(1);
  const [scaffoldingHistory, setScaffoldingHistory] = useState<
    { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]
  >([]);

  const activeQuestion = questions[currentStepIndex] || questions[0];

  const handleNextLevelScaffold = () => {
    if (currentScaffoldLevel < 4) {
      const nextLvl = (currentScaffoldLevel + 1) as 1 | 2 | 3 | 4;
      setCurrentScaffoldLevel(nextLvl);
      recordScaffold(nextLvl);
    }
  };

  const handleOpenScaffolding = () => {
    setShowScaffolding(true);
    if (scaffoldingHistory.length === 0) {
      recordScaffold(1);
    }
  };

  const recordScaffold = (level: 1 | 2 | 3 | 4) => {
    const hint = getHintText(activeQuestion?.scaffolding, level);
    setScaffoldingHistory((prev) => [
      ...prev,
      {
        questionId: activeQuestion.id,
        level,
        hintText: hint,
        requestedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const getHintText = (scaffolding: ScaffoldingLevels | undefined, level: number): string => {
    if (!scaffolding) return 'Perhatikan kembali detail objek di foto.';
    switch (level) {
      case 1:
        return scaffolding.level1;
      case 2:
        return scaffolding.level2;
      case 3:
        return scaffolding.level3;
      case 4:
        return scaffolding.level4;
      default:
        return scaffolding.level1;
    }
  };

  const handleReadAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAdvance = () => {
    if (currentStepIndex < questions.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setShowScaffolding(false);
      setCurrentScaffoldLevel(1);
    } else {
      // Completed all questions -> submit
      onCompleteChallenge(
        {
          challengeAnswer: challengeAnswer.trim() || 'Jawaban dihitung berdasarkan keteraturan waktu pada foto jam.',
          reason: reason.trim() || 'Saya memilih konsep KPK karena ada jadwal yang berulang.',
          evidence: evidence.trim() || 'Bukti kelipatan 4 dan 6 bertemu pada angka 12.',
          strategy: strategy.trim() || 'Menuliskan deret kelipatan secara terurut.',
          conclusion: conclusion.trim() || 'Interval waktu teratur dapat disinkronkan dengan KPK.'
        },
        scaffoldingHistory
      );
    }
  };

  const currentHint = getHintText(activeQuestion?.scaffolding, currentScaffoldLevel);

  // Microcopy by question stage
  const getStageHeader = () => {
    switch (activeQuestion.stage) {
      case 'challenge':
        return {
          badge: 'Tahap 1: Tantangan Utama',
          title: 'Apa jawabanmu?',
          placeholder: 'Tuliskan jawaban lengkapmu di sini...',
          microcopy: 'Lihat lebih dekat pada foto objek. Temukan informasi angka atau karakteristiknya!'
        };
      case 'reasoning':
        return {
          badge: 'Tahap 2: Alasan & Cara Berpikir',
          title: 'Mengapa kamu memilih jawaban tersebut?',
          placeholder: 'Jelaskan mengapa kamu memilih cara/jawaban itu...',
          microcopy: 'Sekarang pikirkan: Ceritakan apa alasan di balik pilihanmu dengan kata-katamu sendiri.'
        };
      case 'evidence':
        return {
          badge: 'Tahap 3: Bukti & Verifikasi',
          title: 'Tunjukkan bukti yang mendukung!',
          placeholder: 'Tuliskan langkah perhitungan, tabel, atau detail foto yang membuktikan jawabanmu...',
          microcopy: 'Tunjukkan buktinya! Bagaimana kamu memastikan jawabanmu masuk akal?'
        };
      default:
        return {
          badge: 'Tantangan Penalaran',
          title: 'Pemecahan Masalah',
          placeholder: 'Tuliskan jawabanmu...',
          microcopy: 'Selesaikan dengan cermat!'
        };
    }
  };

  const stageMeta = getStageHeader();

  const getCurrentInputValue = () => {
    if (currentStepIndex === 0) return challengeAnswer;
    if (currentStepIndex === 1) return reason;
    return evidence;
  };

  const setCurrentInputValue = (val: string) => {
    if (currentStepIndex === 0) setChallengeAnswer(val);
    else if (currentStepIndex === 1) setReason(val);
    else setEvidence(val);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Bar & Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-[#4F8EF7] flex items-center justify-center font-bold text-sm">
              {currentStepIndex + 1}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {stageMeta.badge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#25324B] font-display">
                {activeQuestion.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Langkah {currentStepIndex + 1} dari {questions.length}
            </span>
          </div>
        </div>

        {/* Step Progress indicators */}
        <div className="grid grid-cols-3 gap-2">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`h-2 rounded-full transition-all ${
                idx <= currentStepIndex
                  ? 'bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC]'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Question Card with Photo Context */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
        {/* Context Photo Thumbnail Strip */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <img
            src={photoUrl}
            alt="Objek kontekstual"
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="text-xs sm:text-sm text-slate-600 leading-snug">
            <span className="font-bold text-[#25324B] block">
              Konteks: {learningBridge.detectedObject}
            </span>
            <span>{learningBridge.context}</span>
          </div>
        </div>

        {/* Question Text Box */}
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5 rounded-2xl border border-blue-100 space-y-2 relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base sm:text-lg font-bold text-[#25324B] leading-relaxed">
              {activeQuestion.question}
            </p>
            <button
              onClick={() => handleReadAloud(activeQuestion.question)}
              className="p-2 rounded-xl text-blue-600 hover:bg-blue-100/60 transition-colors shrink-0"
              title="Bacakan Soal"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-blue-700 font-medium italic">
            💡 {stageMeta.microcopy}
          </p>
        </div>

        {/* Answer Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span>Jawaban / Penjelasanmu:</span>
            <span className="text-[11px] text-slate-400 lowercase font-normal">
              kata-katamu sendiri
            </span>
          </label>
          <textarea
            rows={4}
            value={getCurrentInputValue()}
            onChange={(e) => setCurrentInputValue(e.target.value)}
            placeholder={stageMeta.placeholder}
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#4F8EF7] focus:ring-3 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all resize-none shadow-xs"
          />
        </div>

        {/* Scaffolding Assistant Card (Adaptive 4-level tutoring) */}
        {!showScaffolding ? (
          <button
            onClick={handleOpenScaffolding}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-purple-300 bg-purple-50/60 hover:bg-purple-100/80 text-purple-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Merasa kesulitan? Minta Bantuan Tutor Adaptif</span>
          </button>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  L{currentScaffoldLevel}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-purple-900">
                    Bantuan Adaptif Level {currentScaffoldLevel}:{' '}
                    {currentScaffoldLevel === 1 && 'Petunjuk Kecil'}
                    {currentScaffoldLevel === 2 && 'Pertanyaan Penuntun'}
                    {currentScaffoldLevel === 3 && 'Langkah Kecil'}
                    {currentScaffoldLevel === 4 && 'Contoh Analog'}
                  </h4>
                  <p className="text-[10px] text-purple-600">
                    Petunjuk berpikir mandiri tanpa memberi jawaban langsung
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleReadAloud(currentHint)}
                className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-200/50"
                title="Dengarkan Petunjuk"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 bg-white/80 p-3.5 rounded-xl border border-purple-100 leading-relaxed font-medium">
              “{currentHint}”
            </p>

            {currentScaffoldLevel < 4 && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleNextLevelScaffold}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
                >
                  <span>Masih belum paham? Naikkan ke Bantuan Level {currentScaffoldLevel + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-3 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {scaffoldingHistory.length > 0 && (
              <span className="flex items-center gap-1 text-purple-600 font-medium">
                <Lightbulb className="w-3 h-3 text-amber-500" /> {scaffoldingHistory.length} petunjuk dibuka
              </span>
            )}
          </div>
          <button
            onClick={handleAdvance}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 text-sm sm:text-base active:scale-98"
          >
            <span>
              {currentStepIndex < questions.length - 1 ? 'Lanjut ke Alasan / Bukti' : 'Selesai & Refleksi'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
