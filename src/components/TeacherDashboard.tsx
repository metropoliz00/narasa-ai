import React, { useState } from 'react';
import {
  LearningMission,
  StudentActivitySession,
  StudentProgressProfile,
  TeacherInsight,
  AssessmentRecord,
  UserProfile,
  StudentGroup,
  QuizSubmission,
  ConceptQuiz,
  GroupObservationRecord,
  PresentationSettings,
  PresentationAccessMode,
  Subject
} from '../types';
import { TeacherAnalytics } from './TeacherAnalytics';
import { UserAccountModal } from './UserAccountModal';
import { SchoolClassBadge } from './SchoolClassBadge';
import { TeacherGroupManagement } from './TeacherGroupManagement';
import { TeacherQuizAnalytics } from './TeacherQuizAnalytics';
import { AICriticalQuizGeneratorModal } from './AICriticalQuizGeneratorModal';
import { IndividualLoginCardsModal } from './IndividualLoginCardsModal';
import { toast } from './Toast';
import teacherBannerBg from '../assets/images/literasi_numerasi_bright_bg_1789741597196.jpg';
import {
  GraduationCap,
  Plus,
  X,
  Tv,
  BarChart3,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Eye,
  Play,
  Settings,
  ChevronRight,
  UserPlus,
  UserCheck,
  Search,
  ArrowRight,
  Edit,
  User as UserIcon,
  Brain,
  Award,
  Layers,
  Mic,
  SlidersHorizontal,
  MessageSquare,
  AlertCircle,
  Camera,
  Printer,
  RefreshCw,
  KeyRound
} from 'lucide-react';

interface TeacherDashboardProps {
  missions: LearningMission[];
  sessions: StudentActivitySession[];
  studentsProfiles: StudentProgressProfile[];
  insights: TeacherInsight[];
  assessments: AssessmentRecord[];
  users: UserProfile[];
  currentUser: UserProfile;
  groups: StudentGroup[];
  quizSubmissions: QuizSubmission[];
  conceptQuizzes: ConceptQuiz[];
  groupObservations?: GroupObservationRecord[];
  presentationSettings?: PresentationSettings;
  subjects?: Subject[];
  onAddSubject?: (name: string) => void;
  onDeleteSubject?: (id: string) => void;
  onSaveGroupObservation?: (record: GroupObservationRecord) => void;
  onUpdatePresentationSettings?: (settings: PresentationSettings) => void;
  onOpenNewMissionModal: () => void;
  onOpenClassroomPresentation: () => void;
  onViewSessionDetail: (session: StudentActivitySession) => void;
  onAddUser: (userData: Omit<UserProfile, 'id'>) => void;
  onUpdateUser: (userData: UserProfile) => void;
  onSwitchUser: (user: UserProfile) => void;
  onSaveGroup: (group: StudentGroup, associatedUser: UserProfile) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateQuizSubmission?: (submission: QuizSubmission) => void;
  onAddCustomQuiz?: (quiz: ConceptQuiz) => void;
  onOpenEditMissionModal?: (mission: LearningMission) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  missions,
  sessions,
  studentsProfiles,
  insights,
  assessments,
  users,
  currentUser,
  groups,
  quizSubmissions,
  conceptQuizzes,
  groupObservations = [],
  presentationSettings = {
    mode: 'both',
    allowPeerQuestions: true,
    notesForStudents: 'Silakan siapkan slide hasil eksplorasi lingkungan dan penalaran konsepmu!',
    updatedAt: '2026-09-19'
  },
  onSaveGroupObservation,
  onUpdatePresentationSettings,
  onOpenNewMissionModal,
  onOpenClassroomPresentation,
  onViewSessionDetail,
  onAddUser,
  onUpdateUser,
  onSwitchUser,
  onSaveGroup,
  onDeleteGroup,
  onUpdateQuizSubmission,
  onAddCustomQuiz,
  onOpenEditMissionModal,
  subjects = [],
  onAddSubject = () => {},
  onDeleteSubject = () => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'missions' | 'submissions' | 'groups' | 'quizzes' | 'presentation' | 'analytics' | 'students'>('missions');
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [presentationSaveNotice, setPresentationSaveNotice] = useState<string | null>(null);
  const [isAiQuizModalOpen, setIsAiQuizModalOpen] = useState(false);
  const [selectedMissionForQuiz, setSelectedMissionForQuiz] = useState<string | undefined>(undefined);
  const [isPrintIndividualModalOpen, setIsPrintIndividualModalOpen] = useState(false);
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const handleUpdateMode = (mode: PresentationAccessMode) => {
    if (onUpdatePresentationSettings) {
      onUpdatePresentationSettings({
        ...presentationSettings,
        mode,
        updatedAt: new Date().toISOString().split('T')[0]
      });
      setPresentationSaveNotice(`Mode presentasi diubah menjadi: ${
        mode === 'both' ? 'Berkelompok & Individu' : mode === 'group_only' ? 'Khusus Kelompok Saja' : 'Khusus Individu Saja'
      }`);
      setTimeout(() => setPresentationSaveNotice(null), 3000);
    }
  };

  const handleTogglePeerQuestions = () => {
    if (onUpdatePresentationSettings) {
      onUpdatePresentationSettings({
        ...presentationSettings,
        allowPeerQuestions: !presentationSettings.allowPeerQuestions,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleUpdateNotes = (notes: string) => {
    if (onUpdatePresentationSettings) {
      onUpdatePresentationSettings({
        ...presentationSettings,
        notesForStudents: notes,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }
  };

  // Teacher rule: Data students only match schoolId and classId
  const studentAccounts = users.filter((u) => 
    u.role === 'student' && 
    !u.isGroup &&
    (!currentUser.schoolId || u.schoolId === currentUser.schoolId) && 
    (!currentUser.classId || currentUser.classId === 'ALL' || u.classId === currentUser.classId)
  );
  const filteredStudents = studentAccounts.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q) ||
      (s.nisnNip && s.nisnNip.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Welcome Hero for Teacher with White Theme & Literacy-Numeracy Background */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm border border-slate-200/90 bg-white group">
        {/* Background Image: Vivid Literacy & Numeracy */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={teacherBannerBg}
            alt="Literasi dan Numerasi Pendidikan Dasar"
            className="w-full h-full object-cover object-right opacity-70 group-hover:scale-102 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Soft White Gradient Overlays for High Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent md:w-3/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="pt-1">
              <SchoolClassBadge classNameStr={currentUser.className} schoolNameStr={currentUser.schoolName} size="md" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-display tracking-tight text-[#1E293B]">
              Ruang Eksplorasi <span className="text-[#4F8EF7]">{currentUser.name}</span>
            </h1>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewMissionModal}
              className="px-4 py-2.5 rounded-xl bg-[#4F8EF7] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Learning Mission</span>
            </button>
            <button
              onClick={onOpenClassroomPresentation}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Tv className="w-4 h-4 text-purple-300" />
              <span>Presentasi Kelas</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/80">
          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs backdrop-blur-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Total Murid</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-[#1E293B]">
              {studentAccounts.length} Murid
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs backdrop-blur-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Kelompok Belajar</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-blue-600">
              {groups.length} Tim
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs backdrop-blur-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Uji Pemahaman</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-emerald-600">
              {quizSubmissions.length} Nilai
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs backdrop-blur-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Eksplorasi Masuk</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-amber-600">
              {sessions.length} Karya
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('missions')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'missions'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Learning Missions ({missions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'groups'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Kelompok Belajar ({groups.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('quizzes')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'quizzes'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-4 h-4 text-emerald-400" />
          <span>Uji Pemahaman & Rekap Nilai ({quizSubmissions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'submissions'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Aktivitas & Karya ({sessions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'analytics'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analitik Berpikir</span>
        </button>
        <button
          onClick={() => setActiveSubTab('presentation')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'presentation'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mic className="w-4 h-4 text-purple-300" />
          <span>Pengaturan Presentasi</span>
        </button>
        <button
          onClick={() => setActiveSubTab('students')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'students'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Daftar Murid ({studentAccounts.length})</span>
        </button>
      </div>

      {/* Quick Mode Control Bar for Presentation Feature */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 rounded-2xl border border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                Akses Fitur Presentasi Kelas
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Kontrol Dashboard Guru
              </span>
            </div>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              Siapa yang dapat mengakses menu & fitur Presentasi?
            </p>
          </div>
        </div>

        {/* 3 Mode Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-purple-200 shadow-2xs">
          <button
            type="button"
            onClick={() => handleUpdateMode('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              presentationSettings.mode === 'both'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kelompok & Individu</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdateMode('group_only')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              presentationSettings.mode === 'group_only'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Khusus Kelompok</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdateMode('individual_only')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              presentationSettings.mode === 'individual_only'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Khusus Individu</span>
          </button>
        </div>
      </div>

      {presentationSaveNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{presentationSaveNotice}</span>
        </div>
      )}

      {/* Tab: Groups Management */}
      {activeSubTab === 'groups' && (
        <TeacherGroupManagement
          groups={groups}
          users={users}
          currentUser={currentUser}
          quizSubmissions={quizSubmissions}
          sessions={sessions}
          groupObservations={groupObservations}
          missions={missions}
          onSaveObservation={onSaveGroupObservation}
          onSaveGroup={onSaveGroup}
          onDeleteGroup={onDeleteGroup}
          onSwitchUser={onSwitchUser}
          onOpenQuizForGroup={() => setActiveSubTab('quizzes')}
        />
      )}

      {/* Tab: Quiz & Assessment Analytics */}
      {activeSubTab === 'quizzes' && (
        <TeacherQuizAnalytics
          quizzes={conceptQuizzes}
          submissions={quizSubmissions}
          currentUser={currentUser}
          users={users}
          onUpdateSubmission={onUpdateQuizSubmission}
          onOpenAiQuizGenerator={() => {
            setSelectedMissionForQuiz(undefined);
            setIsAiQuizModalOpen(true);
          }}
          onAddCustomQuiz={onAddCustomQuiz}
        />
      )}

      {/* Tab 1: Learning Missions */}
      {activeSubTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mata Pelajaran:
              </span>
              <select
                id="subject-filter-teacher"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">📖 Semua Mata Pelajaran</option>
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Kelola Mapel</span>
              </button>
              <button
                onClick={onOpenNewMissionModal}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Misi Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {missions
              .filter((m) => selectedSubjectId === 'all' || m.idMapel === selectedSubjectId)
              .map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {m.subject} • {m.grade}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Fase C
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-[#25324B] leading-snug">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {m.material}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <p>
                      <strong>TP:</strong> {m.tp}
                    </p>
                    <p>
                      <strong>Target:</strong> {m.targetCompetency === 'literacy' ? 'LITERASI' : m.targetCompetency === 'numeracy' ? 'NUMERASI' : 'LITERASI & NUMERASI'} • Level {m.cognitiveLevel}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Misi Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenEditMissionModal) {
                          onOpenEditMissionModal(m);
                        }
                      }}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit misi pembelajaran ini"
                    >
                      <Edit className="w-3 h-3 text-blue-600" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMissionForQuiz(m.id);
                      setIsAiQuizModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Generate paket soal berpikir kritis AI untuk misi ini"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>Buat Soal AI</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Submissions Stream */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Karya & Refleksi Murid yang Telah Masuk
            </h3>
            <button
              onClick={onOpenClassroomPresentation}
              className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Buka Presentasi Layar Kelas</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={session.image}
                    alt={session.imageLabel}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#25324B]">
                        {session.studentName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700">
                        {session.subject}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Objek: {session.imageLabel} ({session.learningBridge.detectedObject})
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      Alasan: “{session.answers.reason}”
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-[#25324B] block">
                      Skor Penalaran: {session.metrics.reasoningScore}%
                    </span>
                    <span className="text-[10px] text-purple-600 font-medium">
                      {session.scaffoldingHistory.length}x Scaffolding Digunakan
                    </span>
                  </div>

                  <button
                    onClick={() => onViewSessionDetail(session)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Periksa Alur</span>
                  </button>

                  <button
                    onClick={onOpenClassroomPresentation}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-purple-700" />
                    <span>Tayangkan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Teacher Analytics */}
      {activeSubTab === 'analytics' && (
        <TeacherAnalytics
          studentsProfiles={studentsProfiles}
          insights={insights}
          assessments={assessments}
        />
      )}

      {/* Tab: Presentation Settings */}
      {activeSubTab === 'presentation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-purple-600 uppercase flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Konfigurasi Pembelajaran Kelas</span>
                </span>
                <h3 className="text-xl font-bold text-slate-800 font-display mt-1">
                  Pengaturan Fitur Presentasi Siswa & Kelompok
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
                  Tentukan apakah menu dan fitur presentasi ditampilkan untuk akun siswa mandiri (individu), akun kelompok belajar, atau keduanya secara bersamaan.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-purple-600" />
                <span>Mode Aktif: {
                  presentationSettings.mode === 'both'
                    ? 'Berkelompok & Individu'
                    : presentationSettings.mode === 'group_only'
                    ? 'Khusus Kelompok'
                    : 'Khusus Individu'
                }</span>
              </div>
            </div>

            {/* Mode Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Pilih Target Akses Menu Presentasi:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Both */}
                <div
                  onClick={() => handleUpdateMode('both')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    presentationSettings.mode === 'both'
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                        Default & Fleksibel
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Berkelompok & Individu
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menu Presentasi muncul untuk <strong>semua siswa</strong>, baik yang masuk dengan akun mandiri/individu maupun akun kelompok belajar.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-purple-100 text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
                    {presentationSettings.mode === 'both' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span>Mode Sedang Aktif</span>
                      </>
                    ) : (
                      <span>Klik untuk Memilih</span>
                    )}
                  </div>
                </div>

                {/* Option 2: Group Only */}
                <div
                  onClick={() => handleUpdateMode('group_only')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    presentationSettings.mode === 'group_only'
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                        Fokus Kolaborasi Tim
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Khusus Kelompok Saja
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menu Presentasi <strong>hanya muncul</strong> saat login menggunakan akun kelompok belajar. Akun siswa perorangan tidak menampilkan menu presentasi.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-blue-100 text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
                    {presentationSettings.mode === 'group_only' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span>Mode Sedang Aktif</span>
                      </>
                    ) : (
                      <span>Klik untuk Memilih</span>
                    )}
                  </div>
                </div>

                {/* Option 3: Individual Only */}
                <div
                  onClick={() => handleUpdateMode('individual_only')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    presentationSettings.mode === 'individual_only'
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        3
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        Tugas Mandiri
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Khusus Siswa Individu
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menu Presentasi <strong>hanya muncul</strong> untuk akun siswa mandiri. Akun kelompok belajar tidak menampilkan menu presentasi.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-amber-100 text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                    {presentationSettings.mode === 'individual_only' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span>Mode Sedang Aktif</span>
                      </>
                    ) : (
                      <span>Klik untuk Memilih</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
              {/* Toggle Peer Questions */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Sesi Diskusi & Tanya Jawab Rekan</span>
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Mengaktifkan form pertanyaan umpan balik audiens saat presentasi berlangsung di kelas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePeerQuestions}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    presentationSettings.allowPeerQuestions
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  <span>Status: {presentationSettings.allowPeerQuestions ? 'Aktif (Murid Dapat Bertanya)' : 'Non-Aktif'}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-black/20">
                    {presentationSettings.allowPeerQuestions ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Instructions for Students */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Petunjuk Guru untuk Siswa / Tim Presentasi</span>
                </span>
                <textarea
                  rows={3}
                  value={presentationSettings.notesForStudents || ''}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  placeholder="Contoh: Setiap kelompok memiliki waktu 5 menit untuk mempresentasikan hasil temuan..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  Tersimpan otomatis
                </span>
              </div>
            </div>

            {/* Visual Preview Guide */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                <span>Simulasi Tampilan Navigasi Murid Saat Ini:</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                {presentationSettings.mode === 'both' ? (
                  <>Semua siswa (baik <strong>Siswa Individu</strong> maupun <strong>Kelompok Belajar</strong>) akan melihat tombol tab <strong>"Presentasi"</strong> di navbar atas dan navigasi bawah mobile.</>
                ) : presentationSettings.mode === 'group_only' ? (
                  <>Hanya akun <strong>Kelompok Belajar</strong> yang melihat tombol <strong>"Presentasi"</strong>. Siswa mandiri tidak melihat tab ini.</>
                ) : (
                  <>Hanya akun <strong>Siswa Individu</strong> yang melihat tombol <strong>"Presentasi"</strong>. Akun kelompok tidak melihat tab ini.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Student Account Management */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari murid berdasarkan nama, NISN, atau kelas..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedStudentForPrint('all');
                  setIsPrintIndividualModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Buka pratinjau & cetak kartu login individu murid"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Cetak Kartu Login</span>
              </button>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#4F8EF7] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Murid Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Tidak ada murid yang ditemukan.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isOnline = (student.status || 'active') === 'active';
                const progress = studentsProfiles.find((p) => p.name.toLowerCase().includes(student.name.toLowerCase().split(' ')[0]));

                return (
                  <div
                    key={student.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(student);
                            setIsStudentModalOpen(true);
                          }}
                          className="relative group rounded-xl overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          title="Klik untuk ubah foto profil atau data murid (maks 500 KB)"
                        >
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20"
                          />
                          <span className="absolute inset-0 bg-slate-900/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Camera className="w-4 h-4" />
                          </span>
                        </button>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-[#25324B] text-sm">{student.name}</h4>
                          <div className="pt-0.5">
                            <SchoolClassBadge classNameStr={student.className} schoolNameStr={student.schoolName} size="sm" />
                          </div>
                          {student.nisnNip && (
                            <p className="text-[11px] text-slate-400 font-mono">NISN: {student.nisnNip}</p>
                          )}
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isOnline ? '🟢 Aktif' : '🔴 Nonaktif'}
                      </span>
                    </div>

                    {/* Progress preview */}
                    <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Selesai Misi</span>
                        <span className="font-bold text-blue-600">{progress ? progress.activitiesCount : 1} Misi</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nalar Kritis</span>
                        <span className="font-bold text-purple-600">{progress ? Math.round((progress.overallLiteracy + progress.overallNumeracy) / 2) : 88}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Kemampuan</span>
                        <span className="font-bold text-emerald-600">C4-C6</span>
                      </div>
                    </div>

                    {/* Login Account Box with Individual Card Printing & Password Randomization */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pb-1.5 border-b border-slate-200">
                        <span className="flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Kredensial Login Murid</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForPrint(student.id);
                              setIsPrintIndividualModalOpen(true);
                            }}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-[9px] transition-all cursor-pointer"
                            title="Cetak kartu login murid ini"
                          >
                            <Printer className="w-2.5 h-2.5" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 min-w-0">
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Username (NISN):</span>
                          <span className="font-mono text-slate-700 font-bold block truncate">{student.nisnNip || student.username || student.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-between min-w-0">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Password (Acak):</span>
                            <span className="font-mono text-slate-700 font-bold block truncate">{student.password || '123456'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newPass = Math.floor(100000 + Math.random() * 900000).toString();
                              onUpdateUser({
                                ...student,
                                password: newPass
                              });
                              toast.success('Password Diacak', `Password baru untuk "${student.name}" berhasil diganti menjadi ${newPass}`);
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-amber-500 rounded-md transition-colors shrink-0 ml-1"
                            title="Acak password baru"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setIsStudentModalOpen(true);
                        }}
                        className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Data</span>
                      </button>

                      <button
                        onClick={() => onSwitchUser(student)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#4F8EF7] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Lihat Tampilan Murid Ini"
                      >
                        <span>Lihat Sebagai Murid</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Student Add/Edit Modal */}
      <UserAccountModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={(data) => {
          const studentData = {
            ...data,
            role: 'student' as const,
            schoolId: currentUser.schoolId,
            schoolName: currentUser.schoolName,
            classId: currentUser.classId,
            className: currentUser.className.includes('Kelas') ? currentUser.className.split('•')[0].trim() : data.className
          };
          if (data.id) {
            onUpdateUser(studentData as UserProfile);
          } else {
            onAddUser(studentData);
          }
        }}
        editingUser={editingStudent}
        defaultRole="student"
        currentUser={currentUser}
      />

      {/* AI Critical Thinking Quiz Generator Modal */}
      <AICriticalQuizGeneratorModal
        isOpen={isAiQuizModalOpen}
        onClose={() => {
          setIsAiQuizModalOpen(false);
          setSelectedMissionForQuiz(undefined);
        }}
        missions={missions}
        initialMissionId={selectedMissionForQuiz}
        onQuizGenerated={(newQuiz) => {
          if (onAddCustomQuiz) {
            onAddCustomQuiz(newQuiz);
          }
          setIsAiQuizModalOpen(false);
          setSelectedMissionForQuiz(undefined);
        }}
        currentUser={currentUser}
      />

      {/* Individual Login Cards Print Modal */}
      <IndividualLoginCardsModal
        isOpen={isPrintIndividualModalOpen}
        onClose={() => {
          setIsPrintIndividualModalOpen(false);
          setSelectedStudentForPrint(null);
        }}
        students={studentAccounts}
        currentUser={currentUser}
        initialSelectedStudentId={selectedStudentForPrint}
      />

      {/* Dynamic Subjects Manager Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-xl flex flex-col space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">Kelola Mata Pelajaran</h3>
              </div>
              <button 
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form to Add New Subject */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('newSubjectName') as HTMLInputElement;
                const name = input.value.trim();
                if (name) {
                  onAddSubject(name);
                  form.reset();
                }
              }}
              className="flex gap-2"
            >
              <input
                name="newSubjectName"
                type="text"
                required
                placeholder="Nama Mata Pelajaran baru..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 placeholder-slate-400 text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Tambah
              </button>
            </form>

            {/* List of Current Subjects */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Daftar Mapel Terdaftar
              </span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {subjects.map((subj) => {
                  const isDefault = ['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'seni_budaya'].includes(subj.id);
                  return (
                    <div 
                      key={subj.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        {subj.name}
                      </span>
                      {isDefault ? (
                        <span className="text-[9px] font-bold bg-slate-200/70 text-slate-500 px-2 py-0.5 rounded-md border border-slate-300/40">
                          Sistem
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDeleteSubject(subj.id)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline p-1 cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
