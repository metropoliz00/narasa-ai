import React, { useState } from 'react';
import { ConceptQuiz, QuizSubmission, UserProfile } from '../types';
import { ConceptQuizPlayer } from './ConceptQuizPlayer';
import {
  Brain,
  Award,
  BookOpen,
  Clock,
  Sparkles,
  Users,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Zap,
  Target,
  BarChart2,
  ShieldAlert,
  Camera,
  CheckSquare,
  HelpCircle,
  FileText,
  Edit3,
  Filter
} from 'lucide-react';

interface StudentQuizHubProps {
  quizzes: ConceptQuiz[];
  currentUser: UserProfile;
  quizSubmissions: QuizSubmission[];
  onSubmitQuizResult: (submission: QuizSubmission) => void;
}

export const StudentQuizHub: React.FC<StudentQuizHubProps> = ({
  quizzes,
  currentUser,
  quizSubmissions,
  onSubmitQuizResult
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'all' | string>('all');
  const [activeQuizToPlay, setActiveQuizToPlay] = useState<ConceptQuiz | null>(null);

  // Filter submissions for this user/group
  const mySubmissions = quizSubmissions.filter(
    (s) => s.userId === currentUser.id || s.userName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const filteredQuizzes = quizzes.filter((q) => {
    return selectedSubject === 'all' || q.subject === selectedSubject;
  });

  const averageScore = mySubmissions.length > 0
    ? Math.round(mySubmissions.reduce((acc, s) => acc + s.score, 0) / mySubmissions.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16">
      {/* Hero Banner with White Theme & Literacy-Numeracy Background */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 relative overflow-hidden shadow-sm border border-slate-200/90 group">
        {/* Background Image: Literacy & Numeracy */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80"
            alt="Literasi dan Numerasi Pendidikan Dasar"
            className="w-full h-full object-cover object-right opacity-25 group-hover:scale-102 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Soft White Gradient Overlays for High Contrast & Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/75 md:w-3/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#1E293B]">
              Uji Pemahaman Konsep <span className="text-blue-600">Literasi & Numerasi</span>
            </h1>

            {currentUser.isGroup && currentUser.groupMembers && (
              <div className="pt-2 text-xs text-amber-800 flex items-center gap-1.5 font-semibold">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Anggota Tim: {currentUser.groupMembers.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Quick Summary Box */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs text-center min-w-[110px]">
                <span className="text-[10px] text-slate-500 block font-semibold">Kuis Selesai</span>
                <span className="text-xl font-bold font-display text-emerald-600">
                  {mySubmissions.length} / {quizzes.length}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs text-center min-w-[110px]">
                <span className="text-[10px] text-slate-500 block font-semibold">Rata-rata Nilai</span>
                <span className="text-xl font-bold font-display text-amber-600">
                  {averageScore} / 100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Mata Pelajaran (Dropdown) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Pilih Mata Pelajaran</span>
            <span className="text-[11px] text-slate-500 hidden sm:block">Menampilkan {filteredQuizzes.length} kuis tantangan</span>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 cursor-pointer shadow-2xs transition-all"
          >
            <option value="all">Semua Mapel ({quizzes.length})</option>
            <option value="Matematika">Matematika ({quizzes.filter((q) => q.subject === 'Matematika').length})</option>
            <option value="IPAS">IPAS ({quizzes.filter((q) => q.subject === 'IPAS').length})</option>
            <option value="Bahasa Indonesia">Bahasa Indonesia ({quizzes.filter((q) => q.subject === 'Bahasa Indonesia').length})</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Quiz List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredQuizzes.map((quiz) => {
          const submission = mySubmissions.find((s) => s.quizId === quiz.id);
          const isDone = !!submission;

          return (
            <div
              key={quiz.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 relative ${
                isDone
                  ? 'bg-white border-emerald-200 shadow-xs'
                  : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {quiz.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {quiz.grade}
                    </span>
                    {quiz.isAiGenerated && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-purple-600" /> AI
                      </span>
                    )}
                  </div>

                  {isDone ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai ({submission.score}/100)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-600" /> Belum Dikerjakan
                    </span>
                  )}
                </div>

                {/* Context photo thumbnail if available */}
                {quiz.contextImage && (
                  <div className="h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                    <img
                      src={quiz.contextImage}
                      alt={quiz.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                      <span className="text-[11px] text-white font-medium flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-300" /> Stimulus Visual Split Screen
                      </span>
                    </div>
                  </div>
                )}

                {/* Title and Description */}
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] leading-snug font-display">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {quiz.description}
                  </p>
                </div>

                {/* Previous Result Summary if completed */}
                {isDone && (
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900">Predikat: {submission.predicate}</span>
                      <span className="text-emerald-700 font-semibold">{submission.completedAt}</span>
                    </div>
                    {submission.needsManualGrading && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        <Edit3 className="w-3 h-3" /> Soal uraian sedang menunggu koreksi guru
                      </span>
                    )}
                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveQuizToPlay(quiz)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isDone
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                >
                  {isDone ? (
                    <>
                      <RotateCcw className="w-4 h-4 text-amber-300" />
                      <span>Lihat Pembahasan & Kerjakan Ulang</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Mulai Uji Pemahaman {currentUser.isGroup ? 'Kelompok' : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiz Player Modal when active (Split Screen View) */}
      {activeQuizToPlay && (
        <ConceptQuizPlayer
          quiz={activeQuizToPlay}
          currentUser={currentUser}
          onClose={() => setActiveQuizToPlay(null)}
          onSubmitResult={(sub) => {
            onSubmitQuizResult(sub);
          }}
          previousSubmission={mySubmissions.find((s) => s.quizId === activeQuizToPlay.id)}
        />
      )}
    </div>
  );
};
