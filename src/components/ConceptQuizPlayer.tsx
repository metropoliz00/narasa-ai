import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ConceptQuiz, QuizSubmission, UserProfile, QuizQuestion, TrueFalseStatement } from '../types';
import { toast } from './Toast';
import {
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  Users,
  Award,
  BookOpen,
  Brain,
  RotateCcw,
  Check,
  Zap,
  Info,
  FileText,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Edit3,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface ConceptQuizPlayerProps {
  quiz: ConceptQuiz;
  currentUser: UserProfile;
  onClose: () => void;
  onSubmitResult: (submission: QuizSubmission) => void;
  previousSubmission?: QuizSubmission | null;
}

export const ConceptQuizPlayer: React.FC<ConceptQuizPlayerProps> = ({
  quiz,
  currentUser,
  onClose,
  onSubmitResult,
  previousSubmission
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>(() => {
    return previousSubmission?.selectedAnswers || {};
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(!!previousSubmission);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(previousSubmission || null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isZoomImageOpen, setIsZoomImageOpen] = useState(false);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const currentQ: QuizQuestion | undefined = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  // Count answered questions
  const answeredCount = quiz.questions.filter((q) => {
    const ans = selectedAnswers[q.id];
    if (ans === undefined || ans === null) return false;
    if (q.questionType === 'true_false') {
      if (q.statements && q.statements.length > 0) {
        if (typeof ans !== 'object') return false;
        return q.statements.every((s) => typeof ans[s.id] === 'boolean');
      }
      return typeof ans === 'boolean';
    }
    if (typeof ans === 'string') return ans.trim().length > 0;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'boolean') return true;
    return false;
  }).length;

  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Handlers for question types
  const handleSelectSingleChoice = (questionId: string, optionId: string) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleToggleMultipleChoice = (questionId: string, optionId: string) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = currentList.includes(optionId);
      const updated = exists ? currentList.filter((id) => id !== optionId) : [...currentList, optionId];
      return {
        ...prev,
        [questionId]: updated
      };
    });
  };

  const handleSelectTrueFalse = (questionId: string, value: boolean) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSelectTrueFalseStatement = (questionId: string, statementId: string, value: boolean) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => {
      const prevAns = typeof prev[questionId] === 'object' && prev[questionId] !== null ? prev[questionId] : {};
      return {
        ...prev,
        [questionId]: {
          ...prevAns,
          [statementId]: value
        }
      };
    });
  };

  const handleChangeEssay = (questionId: string, text: string) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleFinishQuiz = async () => {
    if (answeredCount < totalQuestions) {
      const confirmed = await toast.confirm({
        title: 'Kumpulkan Kuis Sekarang?',
        message: `Kamu baru menjawab ${answeredCount} dari ${totalQuestions} butir soal. Masih ada soal yang belum diisi. Tetap selesaikan dan kumpulkan?`,
        confirmText: 'Ya, Kumpulkan',
        cancelText: 'Lanjut Menjawab',
        danger: true
      });
      if (!confirmed) {
        return;
      }
    }

    let correctCount = 0;
    let objectiveScore = 0;
    let objectiveTotalMax = 0;
    let quizTotalMax = 0;
    let hasEssay = false;
    let needsManualGrading = false;

    let literacyCorrect = 0;
    let literacyTotal = 0;
    let numeracyCorrect = 0;
    let numeracyTotal = 0;
    let reasoningCorrect = 0;
    let reasoningTotal = 0;

    quiz.questions.forEach((q) => {
      const qType = q.questionType || 'single_choice';
      const qMaxScore = q.maxScore ?? 25;
      quizTotalMax += qMaxScore;
      if (qType !== 'essay') {
        objectiveTotalMax += qMaxScore;
      }

      let isQuestionCorrect = false;

      if (qType === 'single_choice') {
        const studentAns = selectedAnswers[q.id];
        isQuestionCorrect = studentAns === q.correctOptionId;
        if (isQuestionCorrect) {
          correctCount++;
          objectiveScore += qMaxScore;
        }
      } else if (qType === 'multiple_choice') {
        const studentAnsList: string[] = Array.isArray(selectedAnswers[q.id]) ? selectedAnswers[q.id] : [];
        const correctList = q.correctOptionIds || [];
        const isExactMatch =
          studentAnsList.length === correctList.length &&
          studentAnsList.every((optId) => correctList.includes(optId));
        isQuestionCorrect = isExactMatch;
        if (isQuestionCorrect) {
          correctCount++;
          objectiveScore += qMaxScore;
        }
      } else if (qType === 'true_false') {
        const studentAns = selectedAnswers[q.id];
        if (q.statements && q.statements.length > 0) {
          const totalStatements = q.statements.length;
          let correctStmtCount = 0;
          q.statements.forEach((stmt) => {
            if (typeof studentAns === 'object' && studentAns !== null && studentAns[stmt.id] === stmt.correctAnswer) {
              correctStmtCount++;
            }
          });
          const earned = Math.round((correctStmtCount / totalStatements) * qMaxScore);
          objectiveScore += earned;
          isQuestionCorrect = correctStmtCount === totalStatements;
          if (isQuestionCorrect) {
            correctCount++;
          }
        } else {
          isQuestionCorrect = typeof studentAns === 'boolean' && studentAns === q.correctBooleanAnswer;
          if (isQuestionCorrect) {
            correctCount++;
            objectiveScore += qMaxScore;
          }
        }
      } else if (qType === 'essay') {
        hasEssay = true;
        needsManualGrading = true;
        const studentEssay = typeof selectedAnswers[q.id] === 'string' ? selectedAnswers[q.id].trim() : '';
        if (studentEssay.length >= 20) {
          isQuestionCorrect = true; // tentative student participation
        }
      }

      // Competencies
      if (q.competencyType === 'literacy' || q.competencyType === 'both') {
        literacyTotal++;
        if (isQuestionCorrect) literacyCorrect++;
      }
      if (q.competencyType === 'numeracy' || q.competencyType === 'both') {
        numeracyTotal++;
        if (isQuestionCorrect) numeracyCorrect++;
      }
      if (q.competencyType === 'reasoning' || q.competencyType === 'both') {
        reasoningTotal++;
        if (isQuestionCorrect) reasoningCorrect++;
      }
    });

    const finalScore = hasEssay
      ? objectiveScore
      : quizTotalMax > 0
      ? Math.round((objectiveScore / quizTotalMax) * 100)
      : Math.round((correctCount / totalQuestions) * 100);

    const literacyScore = literacyTotal > 0 ? Math.round((literacyCorrect / literacyTotal) * 100) : finalScore;
    const numeracyScore = numeracyTotal > 0 ? Math.round((numeracyCorrect / numeracyTotal) * 100) : finalScore;
    const reasoningScore = reasoningTotal > 0 ? Math.round((reasoningCorrect / reasoningTotal) * 100) : finalScore;

    let predicate: 'Sangat Mahir' | 'Mahir' | 'Cakap' | 'Perlu Bimbingan' = 'Perlu Bimbingan';
    if (finalScore >= 90) predicate = 'Sangat Mahir';
    else if (finalScore >= 75) predicate = 'Mahir';
    else if (finalScore >= 60) predicate = 'Cakap';

    let feedback = '';
    if (hasEssay && needsManualGrading) {
      feedback = currentUser.isGroup
        ? `Kerja tim yang hebat! Nilai objektif kelompok: ${objectiveScore}/${objectiveTotalMax || 75}. Soal uraian penalaran kritis telah tersimpan dan menunggu koreksi manual oleh Guru.`
        : `Jawabanmu berhasil dikirim! Nilai bagian objektif: ${objectiveScore}/${objectiveTotalMax || 75}. Guru akan memeriksa dan menilai uraian kritismu untuk melengkapi nilai akhir.`;
    } else if (finalScore >= 90) {
      feedback = currentUser.isGroup
        ? `Luar biasa! ${currentUser.name} menguasai konsep ${quiz.topic} dengan penalaran kritis dan kolaborasi yang sangat solid!`
        : `Luar biasa! ${currentUser.name} berhasil menjawab seluruh tantangan konsep dengan pemahaman yang mendalam.`;
    } else if (finalScore >= 75) {
      feedback = `Bagus sekali! Penguasaan materi ${quiz.topic} sudah mencapai standar ketuntasan Pembelajaran Mendalam. Perhatikan detail kecil pada soal penalaran.`;
    } else {
      feedback = `Cukup baik. Disarankan untuk meninjau kembali pembahasan konsep dan eksplorasi citra terkait topik ini.`;
    }

    const submission: QuizSubmission = {
      id: previousSubmission?.id || `submission-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isGroup: !!currentUser.isGroup,
      groupMembers: currentUser.groupMembers,
      className: currentUser.className,
      classId: currentUser.classId,
      schoolName: currentUser.schoolName,
      schoolId: currentUser.schoolId,
      score: finalScore,
      objectiveScore,
      essayScore: previousSubmission?.essayScore || 0,
      correctCount,
      totalQuestions,
      literacyScore,
      numeracyScore,
      reasoningScore,
      predicate,
      feedback,
      selectedAnswers,
      hasEssay,
      needsManualGrading,
      isGradedByTeacher: false,
      completedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      timeSpentSeconds: secondsElapsed
    };

    setSubmissionResult(submission);
    setIsCompleted(true);
    onSubmitResult(submission);

    if (finalScore >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
    setSubmissionResult(null);
    setSecondsElapsed(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getQuestionTypeBadge = (type?: string) => {
    switch (type) {
      case 'multiple_choice':
        return {
          label: 'Pilihan Ganda Kompleks',
          desc: 'Pilihlah semua opsi yang benar',
          icon: CheckSquare,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'true_false':
        return {
          label: 'Benar / Salah',
          desc: 'Verifikasi validitas pernyataan',
          icon: HelpCircle,
          color: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'essay':
        return {
          label: 'Uraian Berpikir Kritis',
          desc: 'Dikoreksi manual oleh Guru',
          icon: FileText,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      default:
        return {
          label: 'Pilihan Ganda',
          desc: 'Pilih 1 jawaban paling tepat',
          icon: CheckCircle2,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
    }
  };

  const isQuestionImageVisible = currentQ ? currentQ.showImage !== false : true;
  const isQuizContextImageVisible = quiz.showContextImage !== false;
  const rawImage = currentQ?.image || (isQuizContextImageVisible ? quiz.contextImage : undefined);
  const activeContextImage = (isQuestionImageVisible && rawImage) ? rawImage : undefined;

  const activeStimulusText = currentQ?.stimulusText || currentQ?.scenario || quiz.description;
  const currentBadgeInfo = getQuestionTypeBadge(currentQ?.questionType);
  const CurrentTypeIcon = currentBadgeInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Top Header */}
        <div className="px-5 sm:px-7 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-white shrink-0">
          <div className="space-y-0.5 max-w-2xl text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {quiz.subject} • {quiz.grade}
              </span>
              {currentUser.isGroup ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-600" /> Mode Kelompok: {currentUser.name}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {currentUser.name}
                </span>
              )}
              {quiz.isAiGenerated && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3" /> AI Generated
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#1E293B] font-display line-clamp-1">
              {quiz.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatTime(secondsElapsed)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Group Collaboration Alert Banner */}
        {currentUser.isGroup && !isCompleted && currentUser.groupMembers && (
          <div className="px-6 py-2 bg-amber-50/90 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Diskusi Kelompok:</strong> {currentUser.groupMembers.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Top Progress Bar */}
        {!isCompleted && (
          <div className="w-full bg-slate-100 h-1.5 shrink-0">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-1.5 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-left">
          {/* STATE 1: ACTIVE QUIZ IN SPLIT SCREEN LAYOUT */}
          {!isCompleted && currentQ && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: GAMBAR ATAU TEKS WACANA STIMULUS */}
              <div className="lg:col-span-6 space-y-4 bg-slate-50/80 rounded-3xl p-4 sm:p-5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Wacana Konseptual & Bukti Visual
                      </span>
                    </div>
                  </div>

                  {currentQ.criticalThinkingSkill && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {currentQ.criticalThinkingSkill}
                    </span>
                  )}
                </div>

                {/* Stimulus Context Image */}
                {activeContextImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-2xs">
                    <img
                      src={activeContextImage}
                      alt="Stimulus Visual Konteks"
                      className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="text-[11px] font-semibold text-white/90 drop-shadow-sm flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                        {currentQ.conceptTag || 'Bukti Visual Nyata'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsZoomImageOpen(true)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors cursor-pointer"
                        title="Perbesar gambar"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Stimulus Text / Wacana */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Teks Wacana & Data Nyata:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                    {activeStimulusText}
                  </p>
                </div>

                {/* Cognitive & Curriculum Indicators */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Level: {currentQ.cognitiveLevel || 'C4 Berpikir Kritis'}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1" title={currentQ.soloDescription || 'Taksonomi SOLO: Struktur Pemahaman'}>
                    🎯 SOLO: {currentQ.soloTaxonomyLevel || 'Relational'}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Kompetensi: {
                      currentQ.competencyType === 'literacy'
                        ? 'LITERASI'
                        : currentQ.competencyType === 'numeracy'
                        ? 'NUMERASI'
                        : currentQ.competencyType === 'reasoning'
                        ? 'PENALARAN'
                        : 'LITERASI & NUMERASI'
                    }
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-medium">
                    Fokus: {currentQ.conceptTag || 'Penalaran Berbasis Bukti'}
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: SOAL DAN PILIHAN JAWABAN (4 JENIS SOAL) */}
              <div className="lg:col-span-6 space-y-5">
                {/* Question Type & Progress Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-600 text-white font-mono shadow-2xs">
                      Soal {currentQuestionIndex + 1} / {totalQuestions}
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${currentBadgeInfo.color}`}>
                      <CurrentTypeIcon className="w-3.5 h-3.5" />
                      {currentBadgeInfo.label}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400">
                    Bobot: 25 Poin
                  </span>
                </div>

                {/* Question Prompt */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-left">
                  <h4 className="text-sm sm:text-base font-bold text-[#1E293B] leading-relaxed">
                    {currentQ.question}
                  </h4>
                </div>

                {/* --- RENDER SOAL BERDASARKAN 4 JENIS SOAL --- */}

                {/* JENIS 1: PILIHAN GANDA (SINGLE CHOICE) */}
                {(!currentQ.questionType || currentQ.questionType === 'single_choice') && (
                  <div className="space-y-2.5">
                    {currentQ.options?.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQ.id] === option.id;
                      const letter = String.fromCharCode(65 + idx);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectSingleChoice(currentQ.id, option.id)}
                          className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.005]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="leading-relaxed">{option.text}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 shrink-0 text-white ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* JENIS 2: PILIHAN GANDA KOMPLEKS (MULTIPLE CHOICE) */}
                {currentQ.questionType === 'multiple_choice' && (
                  <div className="space-y-2.5">
                    {currentQ.options?.map((option) => {
                        const selectedList: string[] = Array.isArray(selectedAnswers[currentQ.id])
                          ? selectedAnswers[currentQ.id]
                          : [];
                        const isSelected = selectedList.includes(option.id);

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleToggleMultipleChoice(currentQ.id, option.id)}
                            className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-start gap-3.5 border cursor-pointer ${
                              isSelected
                                ? 'bg-purple-700 text-white border-purple-700 shadow-md shadow-purple-600/20 scale-[1.005]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-white border-white text-purple-700 shadow-2xs'
                                  : 'bg-slate-50 border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            <span className="leading-relaxed">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>
                )}

                {/* JENIS 3: BENAR / SALAH (TRUE/FALSE) - TABEL PERNYATAAN KELOMPOK / MURID */}
                {currentQ.questionType === 'true_false' && (
                  <div className="space-y-4 pt-1">
                    {(() => {
                      // Normalize statements array so single statements or array statements both use the Column Table
                      const displayStatements: TrueFalseStatement[] =
                        currentQ.statements && currentQ.statements.length > 0
                          ? currentQ.statements
                          : [
                              {
                                id: 's1',
                                statement: currentQ.question || 'Pernyataan ini bernilai Benar atau Salah berdasarkan wacana.',
                                correctAnswer: currentQ.correctBooleanAnswer ?? true,
                              },
                            ];

                      const currentAnsObj = selectedAnswers[currentQ.id];
                      const isMulti = Boolean(currentQ.statements && currentQ.statements.length > 0);

                      return (
                        <div className="space-y-3.5">
                          {/* Table Container */}
                          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                            {/* Table Header Columns */}
                            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-100/90 border-b border-slate-200 items-center font-bold text-xs text-slate-700">
                              <div className="col-span-7 sm:col-span-8 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">#</span>
                                <span>Pernyataan Konsep & Penalaran</span>
                              </div>
                              <div className="col-span-2 sm:col-span-2 text-center">
                                <span className="inline-block px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200/80 w-full shadow-2xs">
                                  BENAR
                                </span>
                              </div>
                              <div className="col-span-3 sm:col-span-2 text-center">
                                <span className="inline-block px-2 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[11px] border border-rose-200/80 w-full shadow-2xs">
                                  SALAH
                                </span>
                              </div>
                            </div>

                            {/* Table Body - Statement Rows */}
                            <div className="divide-y divide-slate-100">
                              {displayStatements.map((stmt, sIdx) => {
                                const userChoice: boolean | undefined = isMulti
                                  ? typeof currentAnsObj === 'object' && currentAnsObj !== null
                                    ? currentAnsObj[stmt.id]
                                    : undefined
                                  : typeof currentAnsObj === 'boolean'
                                  ? currentAnsObj
                                  : undefined;

                                return (
                                  <div
                                    key={stmt.id || sIdx}
                                    className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center transition-colors ${
                                      typeof userChoice === 'boolean'
                                        ? userChoice
                                          ? 'bg-emerald-50/20'
                                          : 'bg-rose-50/20'
                                        : sIdx % 2 === 0
                                        ? 'bg-white'
                                        : 'bg-slate-50/40'
                                    }`}
                                  >
                                    {/* Column 1: Statement Text */}
                                    <div className="col-span-7 sm:col-span-8 flex items-start gap-2.5 pr-2">
                                      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 mt-0.5">
                                        {sIdx + 1}
                                      </span>
                                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                                        {stmt.statement}
                                      </p>
                                    </div>

                                    {/* Column 2: BENAR Button */}
                                    <div className="col-span-2 sm:col-span-2 flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isMulti) {
                                            handleSelectTrueFalseStatement(currentQ.id, stmt.id, true);
                                          } else {
                                            handleSelectTrueFalse(currentQ.id, true);
                                          }
                                        }}
                                        className={`w-full max-w-[105px] py-2.5 px-2 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                          userChoice === true
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/60'
                                        }`}
                                      >
                                        {userChoice === true ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>BENAR</span>
                                          </>
                                        ) : (
                                          <span className="text-[11px]">BENAR</span>
                                        )}
                                      </button>
                                    </div>

                                    {/* Column 3: SALAH Button */}
                                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isMulti) {
                                            handleSelectTrueFalseStatement(currentQ.id, stmt.id, false);
                                          } else {
                                            handleSelectTrueFalse(currentQ.id, false);
                                          }
                                        }}
                                        className={`w-full max-w-[105px] py-2.5 px-2 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                          userChoice === false
                                            ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-[1.02]'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-rose-400 hover:bg-rose-50/60'
                                        }`}
                                      >
                                        {userChoice === false ? (
                                          <>
                                            <X className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>SALAH</span>
                                          </>
                                        ) : (
                                          <span className="text-[11px]">SALAH</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* JENIS 4: URAIAN (ESSAY - KOREKSI MANUAL OLEH GURU) */}
                {currentQ.questionType === 'essay' && (
                  <div className="space-y-3">
                    {/* Essay Input Textarea */}
                    <div className="relative">
                      <textarea
                        value={selectedAnswers[currentQ.id] || ''}
                        onChange={(e) => handleChangeEssay(currentQ.id, e.target.value)}
                        placeholder="Ketikkan jawaban, langkah perhitungan, dan argumentasi kritismu di sini..."
                        rows={6}
                        className="w-full p-4 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans leading-relaxed shadow-inner"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1">
                        <span>
                          {((selectedAnswers[currentQ.id] || '') as string).trim().split(/\s+/).filter(Boolean).length} Kata
                        </span>
                        <span className="text-blue-600 font-medium">
                          {(selectedAnswers[currentQ.id] || '').length} Karakter
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fast Navigator Chips */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
                  {quiz.questions.map((q, idx) => {
                    const ans = selectedAnswers[q.id];
                    const isAnswered = (() => {
                      if (ans === undefined || ans === null) return false;
                      if (q.questionType === 'true_false') {
                        if (q.statements && q.statements.length > 0) {
                          if (typeof ans !== 'object') return false;
                          return q.statements.every((s) => typeof ans[s.id] === 'boolean');
                        }
                        return typeof ans === 'boolean';
                      }
                      if (typeof ans === 'string') return ans.trim().length > 0;
                      if (Array.isArray(ans)) return ans.length > 0;
                      if (typeof ans === 'boolean') return true;
                      return false;
                    })();
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-sm'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: HASIL KUIS & PEMBAHASAN DETAIL */}
          {isCompleted && submissionResult && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Score Header Card with White Theme & Literacy-Numeracy Background */}
              <div className="rounded-3xl p-6 sm:p-8 bg-white text-slate-900 relative overflow-hidden shadow-sm border border-slate-200/90 text-center space-y-5 group">
                {/* Background Image: Literacy & Numeracy */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80"
                    alt="Literasi dan Numerasi Pendidikan Dasar"
                    className="w-full h-full object-cover opacity-20 group-hover:scale-102 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Soft White Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/40 pointer-events-none" />
                </div>

                <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 border border-blue-200/80">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Hasil Uji Pemahaman Konsep Berpikir Kritis</span>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Big Circular Score */}
                  <div className="relative w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-500 flex flex-col items-center justify-center shadow-sm shrink-0">
                    <span className="text-3xl sm:text-4xl font-black font-display text-emerald-700">
                      {submissionResult.score}
                    </span>
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                      {submissionResult.needsManualGrading ? 'Skor Sementara' : 'Skor Akhir'}
                    </span>
                  </div>

                  {/* Summary Details */}
                  <div className="text-left space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white inline-block">
                        Predikat: {submissionResult.predicate}
                      </span>
                      {submissionResult.needsManualGrading && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Menunggu Koreksi Uraian Guru
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#1E293B]">
                      {submissionResult.userName}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                      {submissionResult.feedback}
                    </p>
                    <span className="text-[11px] text-slate-400 block pt-1">
                      Menjawab benar {submissionResult.correctCount} dari {submissionResult.totalQuestions} soal • Waktu: {formatTime(submissionResult.timeSpentSeconds)}
                    </span>
                  </div>
                </div>

                {/* Score breakdown: Objektif vs Uraian vs Literasi vs Numerasi vs Penalaran */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-white/10 text-xs">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Skor Objektif</span>
                    <span className="text-lg font-bold text-emerald-300 font-display">
                      {submissionResult.objectiveScore || 0} / 75
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Skor Uraian (Guru)</span>
                    <span className="text-lg font-bold text-amber-300 font-display">
                      {submissionResult.isGradedByTeacher ? `${submissionResult.essayScore} / 25` : 'Menunggu Koreksi'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Skor Literasi</span>
                    <span className="text-lg font-bold text-blue-300 font-display">
                      {submissionResult.literacyScore}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Skor Numerasi</span>
                    <span className="text-lg font-bold text-purple-300 font-display">
                      {submissionResult.numeracyScore}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Skor Penalaran</span>
                    <span className="text-lg font-bold text-emerald-300 font-display">
                      {submissionResult.reasoningScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Review for All Questions */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Pembahasan Konsep Berpikir Kritis & Kunci Jawaban</span>
                </h4>

                {quiz.questions.map((q, idx) => {
                  const qType = q.questionType || 'single_choice';
                  const studentAns = submissionResult.selectedAnswers[q.id];

                  let isCorrect = false;
                  if (qType === 'single_choice') {
                    isCorrect = studentAns === q.correctOptionId;
                  } else if (qType === 'multiple_choice') {
                    const studentAnsList = Array.isArray(studentAns) ? studentAns : [];
                    const correctList = q.correctOptionIds || [];
                    isCorrect =
                      studentAnsList.length === correctList.length &&
                      studentAnsList.every((optId: string) => correctList.includes(optId));
                  } else if (qType === 'true_false') {
                    if (q.statements && q.statements.length > 0) {
                      isCorrect = q.statements.every(
                        (s) => typeof studentAns === 'object' && studentAns !== null && studentAns[s.id] === s.correctAnswer
                      );
                    } else {
                      isCorrect = typeof studentAns === 'boolean' && studentAns === q.correctBooleanAnswer;
                    }
                  } else if (qType === 'essay') {
                    isCorrect = submissionResult.isGradedByTeacher
                      ? (submissionResult.essayScore || 0) >= 15
                      : true;
                  }

                  const badge = getQuestionTypeBadge(qType);

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-3xl border transition-all space-y-3 ${
                        qType === 'essay'
                          ? 'bg-amber-50/40 border-amber-200'
                          : isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              qType === 'essay'
                                ? 'bg-amber-500 text-white'
                                : isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {qType === 'essay' ? (
                              <Edit3 className="w-3.5 h-3.5" />
                            ) : isCorrect ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-bold text-xs text-slate-800">Soal {idx + 1}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                            {q.conceptTag}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold ${
                            qType === 'essay'
                              ? 'text-amber-700'
                              : isCorrect
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {qType === 'essay'
                            ? submissionResult.isGradedByTeacher
                              ? `+${submissionResult.essayScore} Poin (Dinilai Guru)`
                              : 'Menunggu Koreksi Manual Guru'
                            : qType === 'true_false' && q.statements && q.statements.length > 0
                            ? (() => {
                                const correctStmts = q.statements.filter(
                                  (s) => typeof studentAns === 'object' && studentAns !== null && studentAns[s.id] === s.correctAnswer
                                ).length;
                                const pts = Math.round((correctStmts / q.statements.length) * 25);
                                return correctStmts === q.statements.length
                                  ? '+25 Poin (Tuntas)'
                                  : correctStmts > 0
                                  ? `+${pts} Poin (${correctStmts}/${q.statements.length} Tepat)`
                                  : '0 Poin (Belum Tepat)';
                              })()
                            : isCorrect
                            ? '+25 Poin (Tuntas)'
                            : '0 Poin (Belum Tepat)'}
                        </span>
                      </div>

                      {/* Question Text */}
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{q.question}</p>

                      {/* Review details based on type */}
                      {qType === 'single_choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Jawabanmu:</span>
                            <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {q.options?.find((o) => o.id === studentAns)?.text || 'Tidak dijawab'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300">
                            <span className="text-[10px] text-emerald-800 font-bold block">Kunci Jawaban yang Benar:</span>
                            <span className="font-semibold text-emerald-950">
                              {q.options?.find((o) => o.id === q.correctOptionId)?.text}
                            </span>
                          </div>
                        </div>
                      )}

                      {qType === 'multiple_choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-400 block">Pilihan Jawabanmu:</span>
                            <div className="space-y-0.5">
                              {Array.isArray(studentAns) && studentAns.length > 0 ? (
                                studentAns.map((id: string) => (
                                  <div key={id} className="text-slate-700 font-medium">
                                    • {q.options?.find((o) => o.id === id)?.text}
                                  </div>
                                ))
                              ) : (
                                <span className="text-rose-600">Tidak ada opsi yang dipilih</span>
                              )}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 space-y-1">
                            <span className="text-[10px] text-emerald-800 font-bold block">Kunci Jawaban yang Benar:</span>
                            <div className="space-y-0.5">
                              {q.correctOptionIds?.map((id) => (
                                <div key={id} className="text-emerald-950 font-medium">
                                  • {q.options?.find((o) => o.id === id)?.text}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {qType === 'true_false' && (() => {
                        const reviewStmts: TrueFalseStatement[] =
                          q.statements && q.statements.length > 0
                            ? q.statements
                            : [
                                {
                                  id: 's1',
                                  statement: q.question || 'Pernyataan Evaluasi Konsep',
                                  correctAnswer: q.correctBooleanAnswer ?? true,
                                },
                              ];

                        const isMulti = Boolean(q.statements && q.statements.length > 0);
                        const correctCount = reviewStmts.filter((stmt) => {
                          const ansVal = isMulti
                            ? typeof studentAns === 'object' && studentAns !== null
                              ? studentAns[stmt.id]
                              : undefined
                            : typeof studentAns === 'boolean'
                            ? studentAns
                            : undefined;
                          return ansVal === stmt.correctAnswer;
                        }).length;

                        return (
                          <div className="space-y-3 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between text-[11px]">
                              <span className="font-semibold">Evaluasi Pernyataan Analisis Berpikir Kritis:</span>
                              <span className="font-bold text-slate-800">
                                {correctCount} dari {reviewStmts.length} Pernyataan Tepat
                              </span>
                            </div>

                            {/* Table Container */}
                            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                              {/* Table Header */}
                              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 font-bold text-[11px] text-slate-600">
                                <div className="col-span-6 flex items-center gap-1.5">
                                  <span>No. & Pernyataan</span>
                                </div>
                                <div className="col-span-2 text-center">Pilihanmu/Tim</div>
                                <div className="col-span-2 text-center">Kunci Jawaban</div>
                                <div className="col-span-2 text-center">Evaluasi</div>
                              </div>

                              {/* Table Body */}
                              <div className="divide-y divide-slate-100">
                                {reviewStmts.map((stmt, sIdx) => {
                                  const ansVal = isMulti
                                    ? typeof studentAns === 'object' && studentAns !== null
                                      ? studentAns[stmt.id]
                                      : undefined
                                    : typeof studentAns === 'boolean'
                                    ? studentAns
                                    : undefined;

                                  const isStmtCorrect = ansVal === stmt.correctAnswer;

                                  return (
                                    <div
                                      key={stmt.id || sIdx}
                                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${
                                        isStmtCorrect ? 'bg-emerald-50/30' : 'bg-rose-50/30'
                                      }`}
                                    >
                                      {/* Pernyataan */}
                                      <div className="col-span-6 flex items-start gap-2 pr-1">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center border border-slate-200 mt-0.5">
                                          {sIdx + 1}
                                        </span>
                                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                                          {stmt.statement}
                                        </p>
                                      </div>

                                      {/* Pilihan User */}
                                      <div className="col-span-2 text-center">
                                        <span
                                          className={`inline-block px-2 py-1 rounded-lg font-bold text-[10px] border ${
                                            ansVal === true
                                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                                              : ansVal === false
                                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                                              : 'bg-slate-100 text-slate-500 border-slate-200'
                                          }`}
                                        >
                                          {ansVal === true ? 'BENAR' : ansVal === false ? 'SALAH' : 'Kosong'}
                                        </span>
                                      </div>

                                      {/* Kunci Jawaban */}
                                      <div className="col-span-2 text-center">
                                        <span
                                          className={`inline-block px-2 py-1 rounded-lg font-extrabold text-[10px] border ${
                                            stmt.correctAnswer
                                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                              : 'bg-rose-100 text-rose-900 border-rose-300'
                                          }`}
                                        >
                                          {stmt.correctAnswer ? 'BENAR' : 'SALAH'}
                                        </span>
                                      </div>

                                      {/* Status Evaluasi */}
                                      <div className="col-span-2 text-center">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[10px] ${
                                            isStmtCorrect
                                              ? 'bg-emerald-600 text-white shadow-2xs'
                                              : 'bg-rose-600 text-white shadow-2xs'
                                          }`}
                                        >
                                          {isStmtCorrect ? '✓ Tepat' : '✗ Salah'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {qType === 'essay' && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-400 block font-bold">Jawaban Uraian Murid:</span>
                            <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                              {typeof studentAns === 'string' && studentAns.trim() ? studentAns : 'Belum diisi'}
                            </p>
                          </div>

                          {q.sampleAnswer && (
                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                              <span className="text-[10px] text-emerald-800 block font-bold">Contoh Jawaban Ideal Acuan:</span>
                              <p className="text-emerald-900 leading-relaxed font-normal">
                                {q.sampleAnswer}
                              </p>
                            </div>
                          )}

                          {submissionResult.essayGrading && submissionResult.essayGrading[q.id] && (
                            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-purple-900">
                                <span>Nilai dari Guru: {submissionResult.essayGrading[q.id].score} / {submissionResult.essayGrading[q.id].maxScore} Poin</span>
                                <span className="text-[10px] text-purple-600">{submissionResult.essayGrading[q.id].gradedAt}</span>
                              </div>
                              <p className="text-purple-800 leading-relaxed">
                                "{submissionResult.essayGrading[q.id].feedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation box */}
                      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Penjelasan Konsep & Logika Berpikir Kritis:</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Actions */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kumpulkan & Selesai</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Kerjakan Ulang</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Zoom Preview Gambar Wacana */}
      {isZoomImageOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsZoomImageOpen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomImageOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeContextImage}
              alt="Zoomed Context"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <p className="text-xs text-white/80 mt-3 text-center">
              {currentQ?.conceptTag || 'Bukti visual konteks pengamatan'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
