import React, { useState, useMemo } from 'react';
import { ExplorationQuestion, ScaffoldingLevels, AILearningBridgeResult, STEMStage, STEM_STAGES_CONFIG, STEMStageDefinition, StudentAnswers } from '../types';
import {
  Globe,
  Search,
  PenTool,
  Wrench,
  FlaskConical,
  BarChart2,
  RefreshCw,
  Megaphone,
  Brain,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Volume2,
  CheckCircle2,
  Layers,
  Check,
  Compass,
  AlertCircle,
  Lock,
  Unlock,
  X,
  BookOpen,
  Target,
  Info,
  ChevronRight,
  Play
} from 'lucide-react';

interface ChallengeStepProps {
  questions: ExplorationQuestion[];
  learningBridge: AILearningBridgeResult;
  photoUrl: string;
  onCompleteChallenge: (
    answers: StudentAnswers,
    scaffoldingUsed: { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]
  ) => void;
}

export const ChallengeStep: React.FC<ChallengeStepProps> = ({
  questions,
  learningBridge,
  photoUrl,
  onCompleteChallenge
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form states for all 8 STEM steps
  const [stemAnswers, setStemAnswers] = useState<Record<string, string>>({
    real_problem: '',
    ask_inquire: '',
    design_solution: '',
    prototype: '',
    testing: '',
    data_analysis: '',
    improvement: '',
    communication: ''
  });

  // State for popup modal showing activity & instructions for a clicked stage
  const [selectedStageModal, setSelectedStageModal] = useState<{
    stage: STEMStageDefinition;
    index: number;
    question: ExplorationQuestion;
  } | null>(null);

  // Scaffolding state
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [currentScaffoldLevel, setCurrentScaffoldLevel] = useState<1 | 2 | 3 | 4>(1);
  const [scaffoldingHistory, setScaffoldingHistory] = useState<
    { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]
  >([]);

  // Build the complete 8 STEM questions list, merging AI questions or constructing tailored defaults
  const stemQuestions: ExplorationQuestion[] = useMemo(() => {
    return STEM_STAGES_CONFIG.map((stageCfg, idx) => {
      // Check if provided questions already have an item matching this stage
      const existing = questions.find(
        (q) => q.stage === stageCfg.id || (idx === 0 && q.stage === 'challenge') || (idx === 5 && q.stage === 'evidence') || (idx === 6 && q.stage === 'reasoning')
      );

      if (existing) {
        return {
          ...existing,
          stage: stageCfg.id,
          title: existing.title || stageCfg.title,
          question: existing.question || stageCfg.guidingPrompt,
          conceptTag: existing.conceptTag || stageCfg.title
        };
      }

      // Generate contextual question matching the object & material
      let stageQuestion = stageCfg.guidingPrompt;
      let tag = stageCfg.title;
      const obj = learningBridge.detectedObject || 'objek yang diamati';
      const mat = learningBridge.material || 'materi pembelajaran';

      switch (stageCfg.id) {
        case 'real_problem':
          stageQuestion = `Berdasarkan pengamatan pada foto ${obj}, jelaskan masalah nyata atau kebutuhan apa di lingkungan sekolah/sehari-hari yang ingin kamu pecahkan menggunakan konsep ${mat}!`;
          tag = 'Identifikasi Masalah Autentik';
          break;
        case 'ask_inquire':
          stageQuestion = `Apa pertanyaan penyelidikan utama yang kamu ajukan? Informasi, data angka, atau konsep apa saja yang kamu perlukan dari materi ${mat}?`;
          tag = 'Inkuiri & Eksplorasi Konsep';
          break;
        case 'design_solution':
          stageQuestion = `Rancanglah ide solusi atau strategi logis untuk menyelesaikan masalah pada ${obj}. Bagaimana rencana langkah demi langkah yang kamu susun?`;
          tag = 'Rancangan Solusi Kritis';
          break;
        case 'prototype':
          stageQuestion = `Bagaimana kamu mewujudkan solusi tersebut ke dalam bentuk produk nyata, model matematis, skema kerja, atau prototipe sederhana?`;
          tag = 'Pembuatan Prototipe/Model';
          break;
        case 'testing':
          stageQuestion = `Lakukan pengujian terhadap prototipe atau model solusimu! Bagaimana kamu menguji ketepatan dan efektivitasnya dalam memecahkan masalah?`;
          tag = 'Uji Coba & Eksperimen';
          break;
        case 'data_analysis':
          stageQuestion = `Berdasarkan hasil pengujian, tuliskan data angka, hasil hitung, atau bukti observasi yang kamu peroleh. Apa makna data tersebut?`;
          tag = 'Analisis Data & Bukti';
          break;
        case 'improvement':
          stageQuestion = `Apakah ada kendala saat pengujian? Apa ide perbaikan atau penyempurnaan (iterasi) yang kamu lakukan agar solusimu lebih optimal?`;
          tag = 'Evaluasi & Iterasi Desain';
          break;
        case 'communication':
          stageQuestion = `Rangkum kesimpulan akhir dari proyek STEM ini! Apa pesan kunci dan manfaat solusi yang siap kamu sampaikan ke teman-teman di kelas?`;
          tag = 'Komunikasi Hasil & Presentasi';
          break;
      }

      return {
        id: `q-stem-${stageCfg.id}`,
        stage: stageCfg.id,
        title: stageCfg.title,
        question: stageQuestion,
        inputType: 'text',
        conceptTag: tag,
        scaffolding: {
          level1: `Petunjuk Awal: Fokus pada ${stageCfg.title.toLowerCase()} dari objek ${obj}. Apa yang terlihat paling jelas?`,
          level2: `Pertanyaan Penuntun: Bagaimana konsep ${mat} bisa membantumu di tahap ${stageCfg.title.toLowerCase()} ini?`,
          level3: `Langkah Kecil: Tuliskan satu poin utama dulu, lalu tambahkan penjelasan alasan secara teratur.`,
          level4: `Contoh Sederhana: Bayangkan kamu sedang menceritakan ide ${stageCfg.title.toLowerCase()} ini kepada teman sebangkumu.`
        }
      };
    });
  }, [questions, learningBridge]);

  const activeQuestion = stemQuestions[currentStepIndex] || stemQuestions[0];
  const activeStageConfig = STEM_STAGES_CONFIG[currentStepIndex] || STEM_STAGES_CONFIG[0];

  const getStageIcon = (stageId: STEMStage, className = 'w-4 h-4') => {
    switch (stageId) {
      case 'real_problem':
        return <Globe className={className} />;
      case 'ask_inquire':
        return <Search className={className} />;
      case 'design_solution':
        return <PenTool className={className} />;
      case 'prototype':
        return <Wrench className={className} />;
      case 'testing':
        return <FlaskConical className={className} />;
      case 'data_analysis':
        return <BarChart2 className={className} />;
      case 'improvement':
        return <RefreshCw className={className} />;
      case 'communication':
        return <Megaphone className={className} />;
      default:
        return <Brain className={className} />;
    }
  };

  const getStageColorTheme = (idx: number) => {
    const themes = [
      {
        gradient: 'from-blue-500 to-cyan-500',
        cardBg: 'bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/60',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-900',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        iconBg: 'bg-blue-500 text-white',
        ringColor: 'ring-blue-400',
        accentText: 'text-blue-600'
      },
      {
        gradient: 'from-indigo-500 to-blue-600',
        cardBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/60',
        borderColor: 'border-indigo-300',
        textColor: 'text-indigo-900',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        iconBg: 'bg-indigo-500 text-white',
        ringColor: 'ring-indigo-400',
        accentText: 'text-indigo-600'
      },
      {
        gradient: 'from-purple-500 to-indigo-600',
        cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/60',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-900',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'bg-purple-500 text-white',
        ringColor: 'ring-purple-400',
        accentText: 'text-purple-600'
      },
      {
        gradient: 'from-pink-500 to-rose-600',
        cardBg: 'bg-gradient-to-br from-pink-50/90 via-white to-rose-50/60',
        borderColor: 'border-pink-300',
        textColor: 'text-pink-900',
        badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
        iconBg: 'bg-pink-500 text-white',
        ringColor: 'ring-pink-400',
        accentText: 'text-pink-600'
      },
      {
        gradient: 'from-amber-500 to-orange-500',
        cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-900',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-500 text-white',
        ringColor: 'ring-amber-400',
        accentText: 'text-amber-600'
      },
      {
        gradient: 'from-emerald-500 to-teal-600',
        cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-900',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-500 text-white',
        ringColor: 'ring-emerald-400',
        accentText: 'text-emerald-600'
      },
      {
        gradient: 'from-teal-500 to-cyan-600',
        cardBg: 'bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/60',
        borderColor: 'border-teal-300',
        textColor: 'text-teal-900',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
        iconBg: 'bg-teal-500 text-white',
        ringColor: 'ring-teal-400',
        accentText: 'text-teal-600'
      },
      {
        gradient: 'from-violet-500 to-purple-600',
        cardBg: 'bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/60',
        borderColor: 'border-violet-300',
        textColor: 'text-violet-900',
        badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
        iconBg: 'bg-violet-500 text-white',
        ringColor: 'ring-violet-400',
        accentText: 'text-violet-600'
      }
    ];
    return themes[idx % themes.length];
  };

  const handleNextLevelScaffold = () => {
    if (currentScaffoldLevel < 4) {
      const nextLvl = (currentScaffoldLevel + 1) as 1 | 2 | 3 | 4;
      setCurrentScaffoldLevel(nextLvl);
      recordScaffold(nextLvl);
    }
  };

  const handleOpenScaffolding = () => {
    setShowScaffolding(true);
    if (!scaffoldingHistory.some((h) => h.questionId === activeQuestion.id && h.level === currentScaffoldLevel)) {
      recordScaffold(currentScaffoldLevel);
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
    if (!scaffolding) return 'Perhatikan kembali detail objek di foto dan konsep materi.';
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

  const currentAnswerValue = stemAnswers[activeStageConfig.id] || '';

  const handleUpdateCurrentAnswer = (val: string) => {
    setStemAnswers((prev) => ({
      ...prev,
      [activeStageConfig.id]: val
    }));
  };

  const getStageLockStatus = (idx: number) => {
    const isCompleted = (stemAnswers[STEM_STAGES_CONFIG[idx].id] || '').trim().length >= 3;
    if (idx === 0) {
      return { isLocked: false, isCompleted };
    }
    // Previous stages must all be filled
    let isPreviousFilled = true;
    for (let i = 0; i < idx; i++) {
      const ans = (stemAnswers[STEM_STAGES_CONFIG[i].id] || '').trim();
      if (ans.length < 3) {
        isPreviousFilled = false;
        break;
      }
    }
    return {
      isLocked: !isPreviousFilled,
      isCompleted
    };
  };

  const [lockWarning, setLockWarning] = useState<string | null>(null);

  const handleGoToStep = (idx: number) => {
    const status = getStageLockStatus(idx);
    if (status.isLocked) {
      setLockWarning(`Selesaikan Tahap ${idx} (${STEM_STAGES_CONFIG[idx - 1].title}) terlebih dahulu untuk membuka gembok tahap ini! 🔓`);
      setTimeout(() => {
        setLockWarning((prev) => (prev?.includes(STEM_STAGES_CONFIG[idx - 1].title) ? null : prev));
      }, 4000);
      return;
    }
    setLockWarning(null);
    if (idx >= 0 && idx < stemQuestions.length) {
      setCurrentStepIndex(idx);
      setShowScaffolding(false);
      setCurrentScaffoldLevel(1);
    }
  };

  const handleOpenStagePopup = (stage: STEMStageDefinition, idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedStageModal({
      stage,
      index: idx,
      question: stemQuestions[idx] || stemQuestions[0]
    });
  };

  const handleAdvance = () => {
    if (currentStepIndex < stemQuestions.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setShowScaffolding(false);
      setCurrentScaffoldLevel(1);
    } else {
      // Completed all 8 STEM questions -> submit structured response
      const rp = stemAnswers.real_problem.trim() || 'Identifikasi masalah nyata pada objek foto.';
      const ai = stemAnswers.ask_inquire.trim() || 'Pertanyaan penyelidikan dan pengumpulan informasi konsep.';
      const ds = stemAnswers.design_solution.trim() || 'Rancangan rencana solusi terstruktur.';
      const pt = stemAnswers.prototype.trim() || 'Pembuatan model atau prototipe solusi.';
      const ts = stemAnswers.testing.trim() || 'Uji coba prototipe sesuai kriteria.';
      const da = stemAnswers.data_analysis.trim() || 'Analisis data kuantitatif dan bukti pengujian.';
      const im = stemAnswers.improvement.trim() || 'Penyempurnaan dan perbaikan iteratif prototipe.';
      const cm = stemAnswers.communication.trim() || 'Kesimpulan dan pesan presentasi untuk kelas.';

      const formattedAnswers: StudentAnswers = {
        // 8 STEM stages
        realProblem: rp,
        askInquire: ai,
        designSolution: ds,
        prototype: pt,
        testing: ts,
        dataAnalysis: da,
        improvement: im,
        communication: cm,
        // Compatibility fields
        challengeAnswer: `${rp} | Solusi: ${ds}`,
        reason: `${ai} | Evaluasi: ${im}`,
        evidence: `${da} | Pengujian: ${ts}`,
        strategy: ds,
        conclusion: cm
      };

      onCompleteChallenge(formattedAnswers, scaffoldingHistory);
    }
  };

  const currentHint = getHintText(activeQuestion?.scaffolding, currentScaffoldLevel);
  const isCurrentStepFilled = currentAnswerValue.trim().length >= 3;
  const answeredCount = Object.values(stemAnswers).filter((v) => v.trim().length >= 3).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 text-left">
      {/* 8-Step STEM Workflow Stepper Bar with interactive cards and connecting arrows */}
      <div className="bg-gradient-to-b from-white to-blue-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-indigo-200/90 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shadow-indigo-500/30 shrink-0">
              {currentStepIndex + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-indigo-200 shadow-2xs">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  Alur Berpikir STEM 8-Langkah 🚀
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Tahap {currentStepIndex + 1} dari 8
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-[#1E293B] font-display flex items-center gap-1.5 truncate mt-0.5">
                {getStageIcon(activeStageConfig.id, 'w-5 h-5 text-indigo-600 shrink-0')}
                <span className="truncate">{activeStageConfig.title}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] sm:text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{answeredCount}/8 Selesai ✨</span>
            </span>
          </div>
        </div>

        {/* Lock Warning Toast Notification if any */}
        {lockWarning && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-tab-fade shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="leading-snug">{lockWarning}</span>
          </div>
        )}

        {/* Info banner explaining click to view popup */}
        <div className="bg-blue-50/80 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center justify-between text-[11px] text-blue-900 font-semibold">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Klik kartu tahap untuk melihat <strong>Petunjuk & Panduan Kegiatan</strong> lengkap!</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-blue-700 border border-blue-200 hidden sm:inline">
            Interactive Flow
          </span>
        </div>

        {/* STEM Steps Cards with Visual Connecting Arrows */}
        <div className="overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
          <div className="flex items-center gap-2 min-w-max px-1">
            {STEM_STAGES_CONFIG.map((stage, idx) => {
              const status = getStageLockStatus(idx);
              const isCurrent = idx === currentStepIndex;
              const theme = getStageColorTheme(idx);
              const isLast = idx === STEM_STAGES_CONFIG.length - 1;

              return (
                <React.Fragment key={stage.id}>
                  {/* STEM Stage Card */}
                  <div
                    onClick={() => {
                      if (!status.isLocked) {
                        handleGoToStep(idx);
                      }
                      handleOpenStagePopup(stage, idx);
                    }}
                    className={`relative w-44 sm:w-48 p-3 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer group select-none shadow-2xs hover:shadow-md ${
                      isCurrent
                        ? `border-blue-500 bg-white ring-4 ring-blue-300/60 transform -translate-y-1 shadow-lg`
                        : status.isCompleted
                        ? `border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 hover:border-emerald-400 hover:-translate-y-0.5`
                        : !status.isLocked
                        ? `${theme.borderColor} ${theme.cardBg} hover:-translate-y-0.5`
                        : 'border-slate-200 bg-slate-100 text-slate-400 opacity-65'
                    }`}
                  >
                    {/* Top Row: Stage Step Badge & Lock/Unlock Icon */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-lg border shadow-2xs ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-700'
                            : status.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : !status.isLocked
                            ? theme.badgeBg
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        Langkah {idx + 1}
                      </span>

                      {/* Status icon */}
                      <div>
                        {status.isCompleted ? (
                          <div className="p-1 rounded-full bg-emerald-200 text-emerald-800 shadow-2xs" title="Selesai">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="p-1 rounded-full bg-blue-500 text-white animate-pulse shadow-xs" title="Tahap Aktif">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        ) : !status.isLocked ? (
                          <div className="p-1 rounded-full bg-blue-100 text-blue-600" title="Terbuka">
                            <Unlock className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-slate-200 text-slate-500" title="Terkunci">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Icon & Title */}
                    <div className="my-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : status.isCompleted
                              ? 'bg-emerald-600 text-white'
                              : !status.isLocked
                              ? theme.iconBg
                              : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          {getStageIcon(stage.id, 'w-4 h-4')}
                        </div>
                        <h4
                          className={`text-xs font-black truncate leading-tight ${
                            isCurrent
                              ? 'text-blue-950'
                              : status.isCompleted
                              ? 'text-emerald-950'
                              : !status.isLocked
                              ? theme.textColor
                              : 'text-slate-600'
                          }`}
                          title={stage.title}
                        >
                          {stage.title}
                        </h4>
                      </div>

                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                        {stage.description}
                      </p>
                    </div>

                    {/* Bottom Action: Hint Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenStagePopup(stage, idx, e)}
                        className={`font-black flex items-center gap-1 hover:underline cursor-pointer ${
                          isCurrent ? 'text-blue-600' : status.isCompleted ? 'text-emerald-700' : 'text-indigo-600'
                        }`}
                      >
                        <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Petunjuk & Kegiatan</span>
                      </button>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Directional Connecting Arrow (except after last step) */}
                  {!isLast && (
                    <div className="flex items-center justify-center shrink-0 px-0.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          status.isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-2xs'
                            : isCurrent
                            ? 'bg-blue-100 text-blue-700 border border-blue-300 animate-pulse shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                        title={`Lanjut ke Langkah ${idx + 2}`}
                      >
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Detail Kegiatan & Petunjuk Tahap STEM */}
      {selectedStageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-[90vh] flex flex-col text-left">
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 bg-gradient-to-r ${getStageColorTheme(selectedStageModal.index).gradient} text-white flex items-center justify-between gap-3 shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-xs shrink-0">
                  {getStageIcon(selectedStageModal.stage.id, 'w-6 h-6')}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white inline-block">
                    Tahap {selectedStageModal.index + 1} dari 8 STEM
                  </span>
                  <h3 className="text-lg sm:text-xl font-black font-display text-white mt-0.5">
                    {selectedStageModal.stage.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStageModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Instructions, Guiding Questions, and Concrete Examples */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800">
              {/* 1. Deskripsi & Tujuan Kegiatan */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-950 font-black">
                  <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>🎯 Tujuan Kegiatan Tahap Ini:</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {selectedStageModal.stage.description}
                </p>
              </div>

              {/* 2. Hubungan dengan Objek Foto yang Diamati */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <img
                  src={photoUrl}
                  alt="Objek foto"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-300 shrink-0 shadow-2xs"
                />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase text-blue-700 block">Konteks Nyata Objek Foto:</span>
                  <h5 className="font-extrabold text-[#1E293B] truncate">{learningBridge.detectedObject}</h5>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    Materi: <strong>{learningBridge.material}</strong> ({learningBridge.subject})
                  </p>
                </div>
              </div>

              {/* 3. Pertanyaan Pemantik & Instruksi Murid */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-950 font-black">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>❓ Pertanyaan Pemantik Penyelidikan:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReadAloud(selectedStageModal.question.question)}
                    className="p-1 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Dengarkan</span>
                  </button>
                </div>
                <p className="text-slate-800 font-bold leading-relaxed bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                  “{selectedStageModal.question.question}”
                </p>
                <div className="text-[11px] text-amber-800 flex items-center gap-1 pt-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{selectedStageModal.stage.microcopy}</span>
                </div>
              </div>

              {/* 4. Petunjuk Berpikir & Scaffolding Level */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 space-y-2">
                <div className="flex items-center gap-1.5 text-purple-950 font-black">
                  <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>💡 Petunjuk / Tips Mengerjakan:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-purple-900 font-medium">
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{selectedStageModal.question.scaffolding?.level1 || 'Fokus pada fakta nyata objek.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{selectedStageModal.question.scaffolding?.level2 || 'Gunakan konsep pelajaran terkait.'}</span>
                  </li>
                </ul>
              </div>

              {/* 5. Jawaban Murid Saat Ini (jika sudah ada) */}
              {stemAnswers[selectedStageModal.stage.id]?.trim() ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Jawabanmu yang Tersimpan:
                  </span>
                  <p className="text-xs text-slate-800 italic bg-white p-2.5 rounded-xl border border-emerald-100">
                    “{stemAnswers[selectedStageModal.stage.id]}”
                  </p>
                </div>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStageModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 text-xs transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetIdx = selectedStageModal.index;
                  const status = getStageLockStatus(targetIdx);
                  if (status.isLocked) {
                    setLockWarning(`Tahap ini masih terkunci. Selesaikan tahap sebelumnya terlebih dahulu!`);
                  } else {
                    handleGoToStep(targetIdx);
                  }
                  setSelectedStageModal(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  getStageLockStatus(selectedStageModal.index).isLocked
                    ? 'bg-slate-400 opacity-80 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-blue-500/25'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {getStageLockStatus(selectedStageModal.index).isLocked
                    ? '🔒 Tahap Masih Terkunci'
                    : selectedStageModal.index === currentStepIndex
                    ? 'Sedang Dikerjakan di Bawah ⬇️'
                    : `Kerjakan Langkah ${selectedStageModal.index + 1} Sekarang 🚀`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main STEM Question Card with Photo Context */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-2 border-slate-200 shadow-md space-y-5 sm:space-y-6">
        {/* Context Photo Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border-2 border-blue-100">
          <img
            src={photoUrl}
            alt="Objek kontekstual"
            className="w-full sm:w-20 h-36 sm:h-20 rounded-xl sm:rounded-2xl object-cover border-2 border-blue-200 shrink-0 shadow-xs"
          />
          <div className="space-y-1 text-xs sm:text-sm text-slate-800 leading-snug">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-[#1E293B]">
                📸 Objek Foto: {learningBridge.detectedObject}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900 border border-blue-300">
                {learningBridge.material}
              </span>
            </div>
            <p className="text-slate-600 text-xs font-medium">
              {learningBridge.learningBridge}
            </p>
          </div>
        </div>

        {/* Question Text Box with Stage Explainer */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50/60 to-blue-50/70 p-4 sm:p-6 rounded-2xl border-2 border-indigo-200 space-y-2.5 sm:space-y-3 relative shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-200/90 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-300">
              {getStageIcon(activeStageConfig.id, 'w-3.5 h-3.5')}
              {activeStageConfig.badge}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenStagePopup(activeStageConfig, currentStepIndex)}
                className="p-1.5 sm:p-2 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300 transition-colors shrink-0 flex items-center gap-1 text-xs font-black min-h-[36px] shadow-2xs cursor-pointer"
                title="Buka Popup Petunjuk"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Lihat Panduan</span>
              </button>
              <button
                onClick={() => handleReadAloud(activeQuestion.question)}
                className="p-1.5 sm:p-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 flex items-center gap-1 text-xs font-bold min-h-[36px] shadow-2xs cursor-pointer"
                title="Dengarkan Soal"
              >
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dengarkan</span>
              </button>
            </div>
          </div>

          <p className="text-sm sm:text-lg font-bold text-[#1E293B] leading-relaxed">
            {activeQuestion.question}
          </p>

          <div className="pt-1.5 border-t border-indigo-200/70 flex items-center gap-1.5 text-xs text-indigo-900 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="leading-snug">{activeStageConfig.microcopy}</span>
          </div>
        </div>

        {/* Answer Input */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-blue-600" />
              Ide & Pemikiranmu:
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {currentAnswerValue.length} karakter
            </span>
          </label>
          <textarea
            rows={4}
            value={currentAnswerValue}
            onChange={(e) => handleUpdateCurrentAnswer(e.target.value)}
            placeholder={activeStageConfig.placeholder}
            className="w-full p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 focus:border-[#4F8EF7] focus:ring-4 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all resize-none shadow-xs font-medium"
          />
        </div>

        {/* Scaffolding Assistant Card (Adaptive 4-level tutoring) */}
        {!showScaffolding ? (
          <button
            type="button"
            onClick={handleOpenScaffolding}
            className="w-full py-3 px-3 sm:px-4 rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 hover:border-purple-400 text-purple-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-2xs hover:shadow-xs"
          >
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
            <span className="leading-tight text-center">Butuh Bantuan? Buka Petunjuk Tutor Adaptif ✨</span>
          </button>
        ) : (
          <div className="bg-gradient-to-br from-purple-50 via-pink-50/50 to-indigo-50 border-2 border-purple-200 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  L{currentScaffoldLevel}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-purple-950 leading-snug">
                    Bantuan Adaptif Level {currentScaffoldLevel}:{' '}
                    {currentScaffoldLevel === 1 && 'Petunjuk Awal 💡'}
                    {currentScaffoldLevel === 2 && 'Pertanyaan Penuntun 🔍'}
                    {currentScaffoldLevel === 3 && 'Langkah Kecil 🪜'}
                    {currentScaffoldLevel === 4 && 'Contoh Analog Sederhana 🌟'}
                  </h4>
                  <p className="text-[10px] text-purple-700 font-medium">
                    Petunjuk berpikir mandiri tanpa memberi contekan langsung
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleReadAloud(currentHint)}
                className="p-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 shrink-0 cursor-pointer shadow-2xs"
                title="Dengarkan Petunjuk"
              >
                <Volume2 className="w-4 h-4 text-purple-600" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 bg-white p-3.5 sm:p-4 rounded-xl border-2 border-purple-100 leading-relaxed font-semibold shadow-2xs">
              “{currentHint}”
            </p>

            {currentScaffoldLevel < 4 && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleNextLevelScaffold}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <span>Naikkan ke Level {currentScaffoldLevel + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => handleGoToStep(currentStepIndex - 1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tahap Sebelumnya</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAdvance}
              className="w-full sm:w-auto py-3 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98 cursor-pointer min-h-[48px]"
            >
              <span className="truncate">
                {currentStepIndex < stemQuestions.length - 1
                  ? `Lanjut Tahap ${currentStepIndex + 2}: ${STEM_STAGES_CONFIG[currentStepIndex + 1]?.title}`
                  : 'Selesai 8 Tahap & Refleksi'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

