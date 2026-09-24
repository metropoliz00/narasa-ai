import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ConceptQuiz, QuizSubmission, UserProfile } from '../types';
import { ConceptQuizPlayer } from './ConceptQuizPlayer';
import { QuizEditorModal } from './QuizEditorModal';
import { toast } from './Toast';
import {
  Award,
  BookOpen,
  Users,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Plus,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  X,
  Edit3,
  Check,
  FileText,
  Lightbulb,
  Save,
  MessageSquare,
  Play,
  CheckSquare,
  HelpCircle,
  ShieldCheck,
  Brain,
  Target,
  ChevronDown
} from 'lucide-react';

interface TeacherQuizAnalyticsProps {
  quizzes: ConceptQuiz[];
  submissions: QuizSubmission[];
  currentUser: UserProfile;
  users: UserProfile[];
  onAddCustomQuiz?: (quiz: ConceptQuiz) => void;
  onUpdateSubmission?: (submission: QuizSubmission) => void;
  onOpenAiQuizGenerator?: () => void;
}

export const TeacherQuizAnalytics: React.FC<TeacherQuizAnalyticsProps> = ({
  quizzes,
  submissions,
  currentUser,
  users,
  onAddCustomQuiz,
  onUpdateSubmission,
  onOpenAiQuizGenerator
}) => {
  const [teacherSubTab, setTeacherSubTab] = useState<'submissions' | 'bank'>('submissions');
  const [previewingQuiz, setPreviewingQuiz] = useState<ConceptQuiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<ConceptQuiz | null>(null);
  const [bankSubjectFilter, setBankSubjectFilter] = useState<'all' | string>('all');

  const [selectedQuizId, setSelectedQuizId] = useState<'all' | string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'group' | 'individual'>('all');
  const [selectedGradingFilter, setSelectedGradingFilter] = useState<'all' | 'needs_grading' | 'graded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingSubmission, setInspectingSubmission] = useState<QuizSubmission | null>(null);

  // Manual essay grading state
  const [gradingScore, setGradingScore] = useState<number>(20);
  const [gradingFeedback, setGradingFeedback] = useState<string>('Analisis berbasis bukti sangat logis dan argumentasi kontekstual tersusun runtut.');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter submissions by teacher class scope
  const classSubmissions = submissions.filter((s) => {
    const matchesSchool = !currentUser.schoolId || s.schoolId === currentUser.schoolId;
    const matchesClass = !currentUser.classId || currentUser.classId === 'ALL' || s.classId === currentUser.classId;
    return matchesSchool && matchesClass;
  });

  const filteredSubmissions = classSubmissions.filter((s) => {
    const matchesQuiz = selectedQuizId === 'all' || s.quizId === selectedQuizId;
    const matchesType =
      selectedTypeFilter === 'all' ||
      (selectedTypeFilter === 'group' && s.isGroup) ||
      (selectedTypeFilter === 'individual' && !s.isGroup);
    const matchesGrading =
      selectedGradingFilter === 'all' ||
      (selectedGradingFilter === 'needs_grading' && s.needsManualGrading) ||
      (selectedGradingFilter === 'graded' && s.isGradedByTeacher);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.userName.toLowerCase().includes(q) ||
      s.quizTitle.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      (s.groupMembers && s.groupMembers.some((m) => m.toLowerCase().includes(q)));
    return matchesQuiz && matchesType && matchesGrading && matchesSearch;
  });

  // Calculate statistics
  const totalSubmissionsCount = classSubmissions.length;
  const avgScore = totalSubmissionsCount > 0
    ? Math.round(classSubmissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissionsCount)
    : 0;
  const passedCount = classSubmissions.filter((s) => s.score >= 75).length;
  const passRate = totalSubmissionsCount > 0 ? Math.round((passedCount / totalSubmissionsCount) * 100) : 0;
  const groupSubmissionsCount = classSubmissions.filter((s) => s.isGroup).length;
  const needsGradingCount = classSubmissions.filter((s) => s.needsManualGrading).length;

  const handleExportCSV = () => {
    try {
      const exportData = filteredSubmissions.map((s, idx) => {
        const typeStr = s.isGroup ? 'Kelompok Belajar' : 'Individu';
        const membersStr = s.groupMembers ? s.groupMembers.join('; ') : '-';
        const gradingStr = s.needsManualGrading ? 'Menunggu Koreksi Guru' : s.isGradedByTeacher ? 'Telah Dikoreksi Guru' : 'Otomatis';
        return {
          'No': idx + 1,
          'Nama Murid / Kelompok': s.userName,
          'Tipe': typeStr,
          'Anggota Tim': membersStr,
          'Kuis / Materi': s.quizTitle,
          'Mata Pelajaran': s.subject,
          'Skor Nilai': s.score,
          'Predikat': s.predicate,
          'Status Koreksi': gradingStr,
          'Skor Literasi (%)': `${s.literacyScore}%`,
          'Skor Numerasi (%)': `${s.numeracyScore}%`,
          'Skor Penalaran (%)': `${s.reasoningScore}%`,
          'Waktu Selesai': s.completedAt
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 30 }, // Nama Murid / Kelompok
        { wch: 18 }, // Tipe
        { wch: 35 }, // Anggota Tim
        { wch: 32 }, // Kuis / Materi
        { wch: 20 }, // Mata Pelajaran
        { wch: 12 }, // Skor Nilai
        { wch: 14 }, // Predikat
        { wch: 24 }, // Status Koreksi
        { wch: 18 }, // Skor Literasi (%)
        { wch: 18 }, // Skor Numerasi (%)
        { wch: 20 }, // Skor Penalaran (%)
        { wch: 24 }  // Waktu Selesai
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Nilai_Kuis');
      const filename = `Rekap_Nilai_Uji_Pemahaman_${currentUser.classId || 'Kelas'}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast.success(
        'Ekspor Excel Berhasil!',
        `Berhasil mengekspor ${exportData.length} data nilai kuis ke file ${filename}.`
      );
    } catch (err) {
      console.error('Export quiz grades excel error:', err);
      toast.error('Gagal Ekspor Excel', 'Terjadi kesalahan saat mengekspor rekap nilai.');
    }
  };

  const openGradingModal = (sub: QuizSubmission) => {
    setInspectingSubmission(sub);
    setGradingScore(sub.essayScore !== undefined && sub.essayScore > 0 ? sub.essayScore : 20);
    setSaveSuccessMsg(null);

    // If already graded, prefill previous feedback
    if (sub.essayGrading) {
      const firstGradingKey = Object.keys(sub.essayGrading)[0];
      if (firstGradingKey && sub.essayGrading[firstGradingKey]?.feedback) {
        setGradingFeedback(sub.essayGrading[firstGradingKey].feedback);
      }
    }
  };

  const handleSaveManualGrading = (essayQuestionId: string) => {
    if (!inspectingSubmission) return;

    const baseObjective = inspectingSubmission.objectiveScore !== undefined
      ? inspectingSubmission.objectiveScore
      : Math.max(0, inspectingSubmission.score - (inspectingSubmission.essayScore || 0));

    const newTotalScore = Math.min(100, Math.max(0, baseObjective + Number(gradingScore)));

    let newPredicate: 'Sangat Mahir' | 'Mahir' | 'Cakap' | 'Perlu Bimbingan' = 'Perlu Bimbingan';
    if (newTotalScore >= 90) newPredicate = 'Sangat Mahir';
    else if (newTotalScore >= 75) newPredicate = 'Mahir';
    else if (newTotalScore >= 60) newPredicate = 'Cakap';

    const updatedSubmission: QuizSubmission = {
      ...inspectingSubmission,
      essayScore: Number(gradingScore),
      score: newTotalScore,
      objectiveScore: baseObjective,
      predicate: newPredicate,
      needsManualGrading: false,
      isGradedByTeacher: true,
      feedback: `Nilai Akhir: ${newTotalScore}/100. Catatan Guru: ${gradingFeedback}`,
      essayGrading: {
        ...(inspectingSubmission.essayGrading || {}),
        [essayQuestionId]: {
          score: Number(gradingScore),
          maxScore: 25,
          feedback: gradingFeedback,
          gradedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
          teacherName: currentUser.name
        }
      }
    };

    setInspectingSubmission(updatedSubmission);
    setSaveSuccessMsg(`Nilai uraian (${gradingScore}/25) berhasil disimpan! Skor akhir menjadi ${newTotalScore}/100 (${newPredicate}).`);
    toast.success(
      'Nilai Uraian Disimpan!',
      `Nilai berhasil disimpan. Skor akhir: ${newTotalScore}/100 (${newPredicate}).`
    );

    if (onUpdateSubmission) {
      onUpdateSubmission(updatedSubmission);
    }
  };

  const activeQuizForInspection = inspectingSubmission
    ? quizzes.find((q) => q.id === inspectingSubmission.quizId)
    : null;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner with White Theme & Literacy-Numeracy Background */}
      <div className="bg-white rounded-3xl p-6 text-slate-900 relative overflow-hidden shadow-sm border border-slate-200/90 group">
        {/* Background Image: Literacy & Numeracy */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80"
            alt="Literasi dan Numerasi Pendidikan Dasar"
            className="w-full h-full object-cover object-right opacity-25 group-hover:scale-102 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Soft White Gradient Overlays for High Contrast & Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/75 md:w-3/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Asesmen Formatif & Rekapitulasi Nilai
              </span>
              {needsGradingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs animate-pulse">
                  <Edit3 className="w-3 h-3" /> {needsGradingCount} Uraian Perlu Dikoreksi
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#1E293B]">
              Rekap Nilai & Analisis Pemahaman Konsep
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/80 text-slate-700">
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Rata-rata Kelas</span>
            <span className="text-xl font-bold text-emerald-600 font-display">{avgScore} / 100</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Tingkat Ketuntasan (≥75)</span>
            <span className="text-xl font-bold text-blue-600 font-display">{passRate}% Tuntas</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Menunggu Koreksi Guru</span>
            <span className="text-xl font-bold text-amber-600 font-display">{needsGradingCount} Uraian</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Bank Soal Konsep</span>
            <span className="text-xl font-bold text-cyan-700 font-display">{quizzes.length} Paket</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Rekap Nilai vs Bank Soal & Generator AI */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTeacherSubTab('submissions')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            teacherSubTab === 'submissions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Rekapitulasi Nilai & Koreksi Uraian ({classSubmissions.length})</span>
          {needsGradingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-extrabold animate-pulse">
              {needsGradingCount} Perlu Koreksi
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTeacherSubTab('bank')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            teacherSubTab === 'bank'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Bank Paket Soal & Generator AI ({quizzes.length})</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 font-extrabold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Akun Guru
          </span>
        </button>
      </div>

      {/* SUBTAB 1: REKAPITULASI NILAI */}
      {teacherSubTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama murid, kelompok, materi..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">Semua Paket Soal</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.subject} - {q.title.slice(0, 30)}...
              </option>
            ))}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">Semua Tipe Akun</option>
            <option value="group">Kelompok Belajar Saja</option>
            <option value="individual">Individu Saja</option>
          </select>

          <select
            value={selectedGradingFilter}
            onChange={(e) => setSelectedGradingFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">Semua Status Koreksi</option>
            <option value="needs_grading">Perlu Koreksi Manual ({needsGradingCount})</option>
            <option value="graded">Sudah Dikoreksi</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Murid / Kelompok</th>
                <th className="py-3.5 px-4">Paket Kuis / Mapel</th>
                <th className="py-3.5 px-4 text-center">Skor Akhir</th>
                <th className="py-3.5 px-4">Status Koreksi</th>
                <th className="py-3.5 px-4">Literasi</th>
                <th className="py-3.5 px-4">Numerasi</th>
                <th className="py-3.5 px-4">Penalaran</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((sub) => {
                const isGroup = sub.isGroup;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User / Group column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={sub.userAvatar}
                          alt={sub.userName}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{sub.userName}</span>
                            {isGroup && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                                <Users className="w-2.5 h-2.5 text-amber-600" /> Tim
                              </span>
                            )}
                          </div>
                          {isGroup && sub.groupMembers ? (
                            <span className="text-[10px] text-slate-500 line-clamp-1">
                              Anggota: {sub.groupMembers.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">{sub.className}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quiz title & subject */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block line-clamp-1">
                        {sub.quizTitle}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">{sub.subject}</span>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black font-display ${
                          sub.score >= 90
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : sub.score >= 75
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : sub.score >= 60
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {sub.score}
                      </span>
                    </td>

                    {/* Status Koreksi */}
                    <td className="py-3.5 px-4">
                      {sub.needsManualGrading ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-amber-600" /> Perlu Koreksi Guru
                        </span>
                      ) : sub.isGradedByTeacher ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Uraian: +{sub.essayScore}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {sub.predicate}
                        </span>
                      )}
                    </td>

                    {/* Sub scores */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {sub.literacyScore}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {sub.numeracyScore}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {sub.reasoningScore}%
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {sub.completedAt}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openGradingModal(sub)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          sub.needsManualGrading
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                        title={sub.needsManualGrading ? 'Koreksi Soal Uraian' : 'Lihat Rincian Jawaban'}
                      >
                        {sub.needsManualGrading ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Koreksi Uraian</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="p-10 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Belum ada data nilai uji pemahaman yang sesuai filter</p>
            <p className="text-[11px] text-slate-400">
              Instruksikan murid atau kelompok belajar untuk mengerjakan soal uji pemahaman di aplikasi.
            </p>
          </div>
        )}
      </div>
    </div>
  )}

  {/* SUBTAB 2: BANK SOAL & GENERATOR AI GURU */}
  {teacherSubTab === 'bank' && (
    <div className="space-y-6">
      {/* Teacher Authority Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                Pusat Pembuatan & Manajemen Paket Soal (Hak Akses Guru)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                Otoritas Guru
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenAiQuizGenerator && (
            <button
              type="button"
              onClick={onOpenAiQuizGenerator}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Soal AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const newQuizTemplate: ConceptQuiz = {
                id: `quiz-custom-${Date.now()}`,
                title: 'Paket Soal Berpikir Kritis Baru',
                subject: 'IPAS',
                grade: 'Kelas V',
                phase: 'Fase C',
                topic: 'Ekosistem dan Lingkungan',
                description: 'Paket soal evaluasi berpikir kritis dan pemahaman konsep autentik.',
                durationMinutes: 15,
                targetCompetency: 'both',
                passingScore: 70,
                totalQuestions: 1,
                isPublished: true,
                isAiGenerated: false,
                contextImage: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
                showContextImage: true,
                createdAt: new Date().toISOString(),
                questions: [
                  {
                    id: `q-${Date.now()}-1`,
                    questionType: 'single_choice',
                    question: 'Tuliskan teks pertanyaan soal berpikir kritis di sini...',
                    stimulusText: 'Tuliskan wacana atau skenario pengamatan...',
                    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
                    showImage: true,
                    options: [
                      { id: 'opt-1', text: 'Pilihan Jawaban A' },
                      { id: 'opt-2', text: 'Pilihan Jawaban B' },
                      { id: 'opt-3', text: 'Pilihan Jawaban C' },
                      { id: 'opt-4', text: 'Pilihan Jawaban D' }
                    ],
                    correctOptionId: 'opt-1',
                    criticalThinkingSkill: 'Analisis Bukti',
                    competencyType: 'literacy',
                    cognitiveLevel: 'C4',
                    conceptTag: 'Penalaran Konsep',
                    explanation: 'Penjelasan mengapa jawaban A tepat.'
                  }
                ]
              };
              setEditingQuiz(newQuizTemplate);
            }}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            <span>Buat Soal Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Mata Pelajaran (Dropdown) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Filter Bank Soal</span>
            <span className="text-[11px] text-slate-500 hidden sm:block">
              Menampilkan {quizzes.filter((q) => bankSubjectFilter === 'all' || q.subject === bankSubjectFilter).length} soal
            </span>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <select
            value={bankSubjectFilter}
            onChange={(e) => setBankSubjectFilter(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 cursor-pointer shadow-2xs transition-all"
          >
            <option value="all">Semua Mapel ({quizzes.length})</option>
            <option value="IPAS">IPAS ({quizzes.filter((q) => q.subject === 'IPAS').length})</option>
            <option value="Matematika">Matematika ({quizzes.filter((q) => q.subject === 'Matematika').length})</option>
            <option value="Bahasa Indonesia">Bahasa Indonesia ({quizzes.filter((q) => q.subject === 'Bahasa Indonesia').length})</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Quizzes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes
          .filter((q) => bankSubjectFilter === 'all' || q.subject === bankSubjectFilter)
          .map((quiz) => {
            const quizSubmissionCount = submissions.filter((s) => s.quizId === quiz.id).length;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Thumbnail */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={quiz.contextImage || quiz.questions[0]?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600/90 text-white backdrop-blur-xs">
                        {quiz.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600/90 text-white backdrop-blur-xs">
                        {quiz.targetCompetency === 'literacy' ? 'LITERASI' : quiz.targetCompetency === 'numeracy' ? 'NUMERASI' : 'LITERASI & NUMERASI'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] text-blue-200 font-medium block">
                        Topik: {quiz.topic}
                      </span>
                      <h4 className="font-bold text-sm line-clamp-1 font-display">
                        {quiz.title}
                      </h4>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <div>
                        <strong className="text-slate-800">Materi:</strong> {quiz.topic} • {quiz.grade} ({quiz.phase})
                      </div>
                    </div>

                    {/* 4 Question Types Badges */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        4 Butir Soal Berpikir Kritis:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {quiz.questions.map((q, idx) => {
                          const qType = q.questionType;
                          return (
                            <span
                              key={q.id}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                qType === 'single_choice'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : qType === 'multiple_choice'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : qType === 'true_false'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              #{idx + 1} {qType === 'single_choice' ? 'PG' : qType === 'multiple_choice' ? 'PG Kompleks' : qType === 'true_false' ? 'Benar/Salah' : 'Uraian'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{quizSubmissionCount} murid/kelompok</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingQuiz(quiz)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit pertanyaan, wacana, dan sakelar gambar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Soal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewingQuiz(quiz)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  )}

      {/* Submission Detail & Manual Grading Modal */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-[#25324B] font-display">
                  Rincian Jawaban & Koreksi Uraian Guru
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectingSubmission.userName} • {inspectingSubmission.quizTitle}
                </p>
              </div>
              <button
                onClick={() => setInspectingSubmission(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Score & Predicate summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500">Skor Total & Predikat</span>
                  <div className="text-2xl font-black text-blue-900 font-display">
                    {inspectingSubmission.score} / 100 • {inspectingSubmission.predicate}
                  </div>
                  <span className="text-[11px] text-slate-600">
                    Objektif: {inspectingSubmission.objectiveScore ?? Math.max(0, inspectingSubmission.score - (inspectingSubmission.essayScore || 0))} Poin | Uraian: {inspectingSubmission.essayScore ?? 0} Poin
                  </span>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-0.5">
                  <div>Literasi: <strong>{inspectingSubmission.literacyScore}%</strong></div>
                  <div>Numerasi: <strong>{inspectingSubmission.numeracyScore}%</strong></div>
                  <div>Penalaran: <strong>{inspectingSubmission.reasoningScore}%</strong></div>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Group members if group */}
              {inspectingSubmission.isGroup && inspectingSubmission.groupMembers && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1">Anggota Tim Penjawab:</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectingSubmission.groupMembers.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 font-semibold">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* --- KOREKSI MANUAL SOAL URAIAN (JIKA ADA) --- */}
              {activeQuizForInspection?.questions
                ?.filter((q) => q.questionType === 'essay')
                .map((essayQ) => {
                  const studentEssayAnswer = inspectingSubmission.selectedAnswers[essayQ.id] || '';

                  return (
                    <div key={essayQ.id} className="p-5 rounded-3xl border-2 border-amber-200 bg-amber-50/30 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/70">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-black text-xs">
                            Soal Uraian Berpikir Kritis
                          </span>
                          <span className="text-xs font-bold text-amber-950">
                            {essayQ.criticalThinkingSkill || 'Evaluasi & Sintesis'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-800">
                          Maksimal 25 Poin
                        </span>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pertanyaan Uraian:</span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">{essayQ.question}</p>
                      </div>

                      {/* Student's answer */}
                      <div className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-1 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Jawaban Uraian yang Ditulis Murid:
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                          {studentEssayAnswer.trim() ? `“${studentEssayAnswer}”` : '*(Murid tidak mengisi jawaban uraian)*'}
                        </p>
                      </div>

                      {/* Teacher Rubric & Sample Answer Guide */}
                      {essayQ.essayRubric && (
                        <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1">
                          <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            Rubrik Penskoran Guru (Pedoman Penilaian):
                          </span>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            {essayQ.essayRubric}
                          </p>
                          {essayQ.sampleAnswer && (
                            <p className="text-[11px] pt-1 text-emerald-800 border-t border-slate-200 mt-1">
                              <strong>Kunci/Contoh Jawaban Ideal:</strong> {essayQ.sampleAnswer}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Teacher Grading Inputs */}
                      <div className="p-4 rounded-2xl bg-white border border-amber-300 space-y-3 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Edit3 className="w-4 h-4 text-amber-600" />
                            <span>Beri Skor Penilaian Guru (0 - 25 Poin):</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="25"
                              value={gradingScore}
                              onChange={(e) => setGradingScore(Math.min(25, Math.max(0, Number(e.target.value))))}
                              className="w-20 p-2 rounded-xl border border-slate-300 text-center font-bold text-base text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-400">/ 25 Poin</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>Catatan Masukan & Umpan Balik Guru untuk Murid:</span>
                          </label>
                          <textarea
                            value={gradingFeedback}
                            onChange={(e) => setGradingFeedback(e.target.value)}
                            rows={3}
                            placeholder="Tuliskan catatan apresiasi atau perbaikan penalaran siswa..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveManualGrading(essayQ.id)}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan & Terapkan Nilai Uraian Guru</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

              {/* General Feedback note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Umpan Balik & Rekomendasi Terkini:</span>
                <p className="text-slate-600 leading-relaxed">{inspectingSubmission.feedback}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/60">
              <button
                onClick={() => setInspectingSubmission(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Preview Modal for Quiz Player */}
      {previewingQuiz && (
        <ConceptQuizPlayer
          quiz={previewingQuiz}
          currentUser={currentUser}
          onClose={() => setPreviewingQuiz(null)}
          onSubmitResult={() => {}}
        />
      )}

      {/* Teacher Quiz Editor Modal */}
      {editingQuiz && (
        <QuizEditorModal
          isOpen={Boolean(editingQuiz)}
          quiz={editingQuiz}
          onClose={() => setEditingQuiz(null)}
          onSave={(updatedQuiz) => {
            if (onAddCustomQuiz) {
              onAddCustomQuiz(updatedQuiz);
            }
            setEditingQuiz(null);
          }}
        />
      )}
    </div>
  );
};
