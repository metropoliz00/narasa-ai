import React, { useState, useMemo } from 'react';
import { ExplorationQuestion, ScaffoldingLevels, AILearningBridgeResult, STEMStage, STEM_STAGES_CONFIG, StudentAnswers } from '../types';
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
  Unlock
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
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* 8-Step STEM Workflow Stepper Bar with interactive cards */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4F8EF7] to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {currentStepIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#4F8EF7]" />
                  Pola Berpikir STEM
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Tahap {currentStepIndex + 1} dari 8
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#25324B] font-display flex items-center gap-2">
                {getStageIcon(activeStageConfig.id, 'w-5 h-5 text-indigo-600')}
                {activeStageConfig.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {answeredCount} dari 8 Tahap Terisi
            </span>
          </div>
        </div>

        {/* Lock Warning Toast Notification if any */}
        {lockWarning && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-tab-fade">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{lockWarning}</span>
          </div>
        )}

        {/* 8 Interactive Premium STEM Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {STEM_STAGES_CONFIG.map((stage, idx) => {
            const status = getStageLockStatus(idx);
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleGoToStep(idx)}
                className={`p-2.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[92px] group/card hover-wiggle ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/75 ring-3 ring-blue-100 shadow-md transform -translate-y-1'
                    : status.isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/90 hover:border-emerald-300 hover:shadow-xs cursor-pointer'
                    : !status.isLocked
                    ? 'border-blue-200/80 bg-blue-50/10 hover:bg-blue-50/50 hover:border-blue-300 hover:shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-slate-100/50 text-slate-400 opacity-65 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : status.isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Misi {idx + 1}
                  </span>

                  {/* Lock Indicator with Animation */}
                  <div>
                    {status.isCompleted ? (
                      <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-600 animate-unlock-bounce">
                        <Unlock className="w-3 h-3" />
                      </div>
                    ) : isCurrent ? (
                      <div className="p-0.5 rounded-full bg-blue-100 text-blue-600 animate-pulse">
                        <Unlock className="w-3 h-3" />
                      </div>
                    ) : !status.isLocked ? (
                      <div className="p-0.5 rounded-full bg-blue-50 text-blue-400">
                        <Unlock className="w-3 h-3 text-blue-400" />
                      </div>
                    ) : (
                      <div className="p-0.5 rounded-full bg-slate-200 text-slate-400 lock-icon">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 space-y-0.5">
                  <div className="flex items-center gap-1">
                    {getStageIcon(stage.id, `w-3.5 h-3.5 ${
                      isCurrent ? 'text-blue-600' : status.isCompleted ? 'text-emerald-600' : 'text-slate-400'
                    }`)}
                  </div>
                  <span
                    className={`text-[10px] font-bold line-clamp-1 block leading-tight ${
                      isCurrent ? 'text-blue-900' : status.isCompleted ? 'text-emerald-900' : 'text-slate-600'
                    }`}
                    title={stage.title}
                  >
                    {stage.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main STEM Question Card with Photo Context */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
        {/* Context Photo Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <img
            src={photoUrl}
            alt="Objek kontekstual"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
          />
          <div className="space-y-1 text-xs sm:text-sm text-slate-700 leading-snug">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#25324B]">
                Konteks: {learningBridge.detectedObject}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {learningBridge.material}
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              {learningBridge.learningBridge}
            </p>
          </div>
        </div>

        {/* Question Text Box with Stage Explainer */}
        <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/40 p-5 sm:p-6 rounded-2xl border border-blue-200 space-y-3 relative">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              {getStageIcon(activeStageConfig.id, 'w-3.5 h-3.5')}
              {activeStageConfig.badge}
            </span>
            <button
              onClick={() => handleReadAloud(activeQuestion.question)}
              className="p-2 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors shrink-0 flex items-center gap-1 text-xs font-bold"
              title="Dengarkan Soal"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Bacakan</span>
            </button>
          </div>

          <p className="text-base sm:text-lg font-bold text-[#25324B] leading-relaxed">
            {activeQuestion.question}
          </p>

          <div className="pt-1 border-t border-blue-200/60 flex items-center gap-1.5 text-xs text-blue-800 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{activeStageConfig.microcopy}</span>
          </div>
        </div>

        {/* Answer Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-blue-600" />
              Tuliskan Pemikiran / Solusi untuk Tahap Ini:
            </span>
            <span className="text-[11px] text-slate-400 lowercase font-normal">
              {currentAnswerValue.length} karakter
            </span>
          </label>
          <textarea
            rows={4}
            value={currentAnswerValue}
            onChange={(e) => handleUpdateCurrentAnswer(e.target.value)}
            placeholder={activeStageConfig.placeholder}
            className="w-full p-4 rounded-2xl border border-slate-300 focus:border-[#4F8EF7] focus:ring-3 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all resize-none shadow-xs"
          />
        </div>

        {/* Scaffolding Assistant Card (Adaptive 4-level tutoring) */}
        {!showScaffolding ? (
          <button
            type="button"
            onClick={handleOpenScaffolding}
            className="w-full py-3 px-4 rounded-2xl border border-dashed border-purple-300 bg-purple-50/70 hover:bg-purple-100/90 text-purple-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Merasa kesulitan di tahap {activeStageConfig.title}? Minta Bantuan Tutor Adaptif</span>
          </button>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  L{currentScaffoldLevel}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-purple-900">
                    Bantuan Adaptif Level {currentScaffoldLevel}:{' '}
                    {currentScaffoldLevel === 1 && 'Petunjuk Awal'}
                    {currentScaffoldLevel === 2 && 'Pertanyaan Penuntun'}
                    {currentScaffoldLevel === 3 && 'Langkah Kecil'}
                    {currentScaffoldLevel === 4 && 'Contoh Analog Sederhana'}
                  </h4>
                  <p className="text-[10px] text-purple-600">
                    Petunjuk berpikir mandiri tanpa memberi contekan jawaban langsung
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleReadAloud(currentHint)}
                className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-200/50"
                title="Dengarkan Petunjuk"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 bg-white/90 p-4 rounded-xl border border-purple-100 leading-relaxed font-medium shadow-2xs">
              “{currentHint}”
            </p>

            {currentScaffoldLevel < 4 && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleNextLevelScaffold}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Masih butuh bantuan? Naikkan ke Level {currentScaffoldLevel + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => handleGoToStep(currentStepIndex - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
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
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-98 cursor-pointer"
            >
              <span>
                {currentStepIndex < stemQuestions.length - 1
                  ? `Lanjut ke Tahap ${currentStepIndex + 2}: ${STEM_STAGES_CONFIG[currentStepIndex + 1]?.title}`
                  : 'Selesai 8 Tahap STEM & Masuk Refleksi'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
