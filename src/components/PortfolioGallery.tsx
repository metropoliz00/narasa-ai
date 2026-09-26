import React, { useState } from 'react';
import {
  StudentActivitySession,
  UserProfile,
  StudentGroup,
  GroupObservationRecord
} from '../types';
import { StudentPortfolioReportModal } from './StudentPortfolioReportModal';
import {
  FolderKanban,
  Search,
  Calendar,
  BookOpen,
  Eye,
  CheckCircle2,
  Play,
  FileText,
  Brain,
  Lightbulb,
  ExternalLink,
  Filter,
  ChevronDown,
  Printer
} from 'lucide-react';

interface PortfolioGalleryProps {
  sessions: StudentActivitySession[];
  onOpenSessionPresentation: (session: StudentActivitySession) => void;
  users?: UserProfile[];
  currentUser?: UserProfile;
  groups?: StudentGroup[];
  groupObservations?: GroupObservationRecord[];
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  sessions,
  onOpenSessionPresentation,
  users = [],
  currentUser = {
    id: 'student-1',
    name: 'Siswa Narasa',
    email: 'siswa@narasa.sch.id',
    role: 'student',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-A',
    classId: 'class-5a',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  groups = [],
  groupObservations = []
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailSession, setActiveDetailSession] = useState<StudentActivitySession | null>(null);

  // Print Report Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetSessionId, setPrintTargetSessionId] = useState<string | null>(null);

  const subjects = ['all', ...Array.from(new Set(sessions.map((s) => s.subject)))];

  const filtered = sessions.filter((s) => {
    const matchSubj = selectedSubject === 'all' || s.subject === selectedSubject;
    const matchSearch =
      s.missionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.imageLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.learningBridge.detectedObject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubj && matchSearch;
  });

  const handleOpenPrintModal = (sessionId?: string) => {
    setPrintTargetSessionId(sessionId || null);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-100 text-[#4F8EF7]">
              <FolderKanban className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#25324B] font-display">
              Portofolio Digital Murid
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Galeri rekam jejak eksplorasi, penalaran, bukti, dan presentasi mandiri
          </p>
        </div>

        {/* Filter controls & Print Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Global Print Portfolio Button */}
          <button
            onClick={() => handleOpenPrintModal('all')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Cetak Laporan Lengkap Portofolio (PDF)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap Portofolio (PDF)</span>
          </button>

          {/* Subject Dropdown & Search bar row */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-36">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer shadow-2xs transition-all"
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj === 'all' ? 'Semua Mapel' : subj}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search bar */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari karya..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((session) => {
          const isNumeracy = session.subject.toLowerCase().includes('matematika');
          return (
          <div
            key={session.id}
            className={`rounded-3xl border-2 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group ${
              isNumeracy
                ? 'bg-gradient-to-b from-sky-50/40 via-white to-white border-sky-200/80 hover:border-sky-300'
                : 'bg-gradient-to-b from-emerald-50/40 via-white to-white border-emerald-200/80 hover:border-emerald-300'
            }`}
          >
            {/* Photo with Overlay Badges */}
            <div className="relative aspect-16/10 overflow-hidden bg-slate-900">
              <img
                src={session.image}
                alt={session.imageLabel}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black/70 backdrop-blur-xs text-white border border-white/20">
                  {session.subject}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/90 text-white backdrop-blur-xs shadow-2xs">
                  {isNumeracy ? '📐 Numerasi' : '🌱 Literasi'}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                <Calendar className="w-3 h-3 text-blue-300" />
                {session.completedAt}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#25324B] group-hover:text-[#4F8EF7] transition-colors line-clamp-1">
                    {session.imageLabel}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    👤 {session.studentName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                  {session.missionTitle}
                </p>

                <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1 mt-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#25324B] font-bold">
                    <Brain className="w-3.5 h-3.5 text-[#7C5CFC]" />
                    <span>Penalaran Kritis Murid:</span>
                  </div>
                  <p className="line-clamp-2 italic text-slate-700">“{session.answers.reason || session.answers.challengeAnswer}”</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setActiveDetailSession(session)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  title="Lihat Detail Proses"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Proses</span>
                </button>
                <button
                  onClick={() => handleOpenPrintModal(session.id)}
                  className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                  title="Cetak Lembar Portofolio PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => onOpenSessionPresentation(session)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] hover:shadow-md text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Putar Slide</span>
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Detail Modal for Full Thinking Journey */}
      {activeDetailSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {activeDetailSession.subject} • {activeDetailSession.missionTitle}
                </span>
                <h3 className="text-xl font-bold text-[#25324B] font-display">
                  {activeDetailSession.imageLabel}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailSession(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                <strong className="block text-blue-900 mb-1">👁️ Hasil Observasi:</strong>
                <p>{activeDetailSession.learningBridge.observation}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                <strong className="block text-purple-900 mb-1">🔗 Hubungan Pelajaran:</strong>
                <p>{activeDetailSession.learningBridge.learningBridge}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <strong className="block text-emerald-900 mb-1">💡 Solusi:</strong>
                <p>{activeDetailSession.answers.challengeAnswer}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                <strong className="block text-amber-900 mb-1">🧠 Alasan & Cara Berpikir:</strong>
                <p>{activeDetailSession.answers.reason}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                <strong className="block text-indigo-900 mb-1">🔍 Bukti & Perhitungan:</strong>
                <p>{activeDetailSession.answers.evidence}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
                <strong className="block text-rose-900 mb-1">🤔 Refleksi Murid:</strong>
                <p>
                  <strong>Hal yang dipelajari:</strong> {activeDetailSession.reflection.q2Learned}
                </p>
                <p className="mt-1">
                  <strong>Bagian tersulit:</strong> {activeDetailSession.reflection.q3Hardest}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-100">
              <button
                onClick={() => {
                  const s = activeDetailSession;
                  setActiveDetailSession(null);
                  handleOpenPrintModal(s.id);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen (PDF)</span>
              </button>

              <button
                onClick={() => {
                  const s = activeDetailSession;
                  setActiveDetailSession(null);
                  onOpenSessionPresentation(s);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Buka Mode Presentasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PORTFOLIO REPORT MODAL */}
      <StudentPortfolioReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        sessions={sessions}
        users={users}
        currentUser={currentUser}
        groups={groups}
        groupObservations={groupObservations}
        initialSelectedSessionId={printTargetSessionId}
      />
    </div>
  );
};
