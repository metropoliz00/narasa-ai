import React, { useState, useMemo, useEffect } from 'react';
import {
  StudentActivitySession,
  GroupObservationRecord,
  StudentGroup,
  UserProfile,
  SchoolProfile
} from '../types';
import { INITIAL_SCHOOL_PROFILES } from './SchoolSettingsManager';
import { dbFetchSchools } from '../lib/supabase';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  Brain,
  Calendar,
  Users,
  UserCheck,
  Award,
  BookOpen,
  Eye,
  Camera,
  Layers,
  Sparkles,
  School,
  Check,
  Download,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { toast } from './Toast';

interface StudentPortfolioReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudentActivitySession[];
  users: UserProfile[];
  currentUser: UserProfile;
  groups?: StudentGroup[];
  groupObservations?: GroupObservationRecord[];
  initialSelectedSessionId?: string | null;
  initialSelectedStudentId?: string | null;
}

export const StudentPortfolioReportModal: React.FC<StudentPortfolioReportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  users,
  currentUser,
  groups = [],
  groupObservations = [],
  initialSelectedSessionId,
  initialSelectedStudentId
}) => {
  const [dbSchools, setDbSchools] = useState<SchoolProfile[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_schools_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SCHOOL_PROFILES;
  });

  useEffect(() => {
    let isMounted = true;
    dbFetchSchools().then((schools) => {
      if (isMounted && Array.isArray(schools) && schools.length > 0) {
        setDbSchools(schools);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load school profile data
  const schoolProfile: SchoolProfile = useMemo(() => {
    const match = dbSchools.find((s: SchoolProfile) => s.id === currentUser.schoolId);
    return match || dbSchools[0] || INITIAL_SCHOOL_PROFILES[0];
  }, [currentUser.schoolId, dbSchools]);

  // Selected session or 'all'
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialSelectedSessionId || (sessions.length > 0 ? sessions[0].id : 'all')
  );

  // Selected student / group filter
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialSelectedStudentId || currentUser.id || 'all'
  );

  // Toggle visible sections in printout
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [includeMetrics, setIncludeMetrics] = useState<boolean>(true);
  const [includeExploration, setIncludeExploration] = useState<boolean>(true);
  const [includeReasoning, setIncludeReasoning] = useState<boolean>(true);
  const [includeObservations, setIncludeObservations] = useState<boolean>(true);
  const [includePresentation, setIncludePresentation] = useState<boolean>(true);
  const [includeReflection, setIncludeReflection] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  if (!isOpen) return null;

  // Filter sessions based on selection
  const displayedSessions = sessions.filter((s) => {
    if (selectedSessionId !== 'all' && s.id !== selectedSessionId) {
      return false;
    }
    if (selectedUserId !== 'all') {
      const targetUser = users.find((u) => u.id === selectedUserId);
      if (targetUser) {
        const matchName = s.studentName.toLowerCase().includes(targetUser.name.toLowerCase());
        const matchId = s.studentId === targetUser.id;
        if (!matchName && !matchId) return false;
      }
    }
    return true;
  });

  // Find relevant observation records
  const findObservationForSession = (session: StudentActivitySession) => {
    // 1. Match by missionId and student/group name
    const match = groupObservations.find((obs) => {
      const matchMission = !obs.missionId || obs.missionId === session.missionId;
      const matchGroup = obs.groupName.toLowerCase() === session.studentName.toLowerCase();
      const matchMember = obs.memberScores?.some(
        (m) =>
          m.studentName.toLowerCase() === session.studentName.toLowerCase() ||
          m.studentId === session.studentId
      );
      return matchMission && (matchGroup || matchMember);
    });
    return match || groupObservations[0] || null;
  };

  const handlePrint = () => {
    toast.info('Menyiapkan Dokumen Cetak...', 'Dialog cetak PDF akan segera muncul.');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Helper date formatter
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:bg-white print:overflow-visible">
        
        {/* ==================== SCREEN ONLY HEADER & TOOLBAR ==================== */}
        <div className="no-print bg-white p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
              <Printer className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#25324B] font-display">
                  Cetak Laporan Portofolio Siswa & Kelompok
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Format PDF / A4
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dokumen resmi rekap portofolio, hasil observasi guru, dan slide presentasi kontekstual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================== SCREEN ONLY CONTROLS BAR ==================== */}
        <div className="no-print bg-slate-50 p-4 border-b border-slate-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Session Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Pilih Karya / Sesi Misi:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">📑 Semua Karya Portofolio Terdaftar ({sessions.length} Karya)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.imageLabel} — {s.studentName} ({s.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Filter Berdasarkan Siswa / Kelompok:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">👥 Semua Siswa & Kelompok</option>
                {users
                  .filter((u) => u.role === 'student')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.isGroup ? `[Kelompok] ${u.name}` : `[Siswa] ${u.name}`} ({u.className})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Section Visibility Checkboxes */}
          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sertakan Bagian:</span>
            </span>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Kop Sekolah</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeMetrics}
                onChange={(e) => setIncludeMetrics(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Metrik Capaian</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeExploration}
                onChange={(e) => setIncludeExploration(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Bukti Objek</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeReasoning}
                onChange={(e) => setIncludeReasoning(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Lembar Penalaran</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeObservations}
                onChange={(e) => setIncludeObservations(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Observasi Guru</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includePresentation}
                onChange={(e) => setIncludePresentation(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Slide Presentasi</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeReflection}
                onChange={(e) => setIncludeReflection(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Refleksi</span>
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer font-medium hover:border-blue-300">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Pengesahan</span>
            </label>
          </div>
        </div>

        {/* ==================== PRINTABLE CANVAS CONTAINER ==================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="narasa-printable-area"
            className="max-w-4xl mx-auto space-y-8 print:space-y-6"
          >
            {displayedSessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-300 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">Tidak Ada Karya Portofolio yang Sesuai</h4>
                <p className="text-xs text-slate-400">Silakan ubah filter sesi atau siswa di atas.</p>
              </div>
            ) : (
              displayedSessions.map((session, sIdx) => {
                const sessionUser = users.find(
                  (u) =>
                    u.name.toLowerCase() === session.studentName.toLowerCase() ||
                    u.id === session.studentId
                );
                const isGroup = sessionUser?.isGroup || session.studentName.toLowerCase().includes('kelompok');
                const observation = findObservationForSession(session);

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10 text-slate-900 break-inside-avoid print:shadow-none print:border-none print:p-0 print:m-0 space-y-6"
                  >
                    {/* 1. KOP SURAT RESMI SEKOLAH */}
                    {includeHeader && (
                      <div className="border-b-4 border-double border-slate-900 pb-3 text-center space-y-1">
                        <p className="text-[11px] uppercase tracking-widest font-bold text-slate-700">
                          PEMERINTAH PROVINSI {schoolProfile.province.toUpperCase()} • DINAS PENDIDIKAN
                        </p>
                        <h2 className="text-lg sm:text-xl font-black tracking-wide text-slate-900 uppercase font-sans">
                          {schoolProfile.name}
                        </h2>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          {schoolProfile.address}
                          {schoolProfile.village ? `, Kel. ${schoolProfile.village}` : ''}
                          {schoolProfile.district ? `, Kec. ${schoolProfile.district}` : ''}
                          {`, ${schoolProfile.city} ${schoolProfile.postalCode}`}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          NPSN: <span className="font-mono font-bold">{schoolProfile.npsn}</span> • Akreditasi: <strong>{schoolProfile.accreditation}</strong> • Telp: {schoolProfile.phone} • Email: {schoolProfile.email}
                        </p>
                      </div>
                    )}

                    {/* 2. JUDUL DOKUMEN & IDENTITAS LAPORAN */}
                    <div className="text-center space-y-1 pt-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase font-sans">
                        LEMBAR PORTOFOLIO & ASESMEN AUTENTIK SISWA
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-600">
                        Pembelajaran Kontekstual Berbasis Literasi & Numerasi • Kurikulum Merdeka
                      </p>
                      <div className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-3 py-0.5 rounded-full border border-slate-300">
                        Tahun Ajaran: {schoolProfile.academicYear} • Semester: {schoolProfile.activeSemester}
                      </div>
                    </div>

                    {/* 3. TABEL IDENTITAS SISWA / KELOMPOK */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-300 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex justify-between border-b border-slate-200/80 pb-1">
                          <span className="font-bold text-slate-600">Nama {isGroup ? 'Kelompok' : 'Murid'}:</span>
                          <span className="font-extrabold text-slate-900 text-right">{session.studentName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/80 pb-1">
                          <span className="font-bold text-slate-600">Kelas / Rombel:</span>
                          <span className="font-bold text-slate-900">{sessionUser?.className || 'Kelas V-A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/80 pb-1">
                          <span className="font-bold text-slate-600">Mata Pelajaran:</span>
                          <span className="font-bold text-blue-700">{session.subject}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/80 pb-1">
                          <span className="font-bold text-slate-600">Tanggal Selesai:</span>
                          <span className="font-bold text-slate-900">{session.completedAt || formattedToday}</span>
                        </div>
                        <div className="flex justify-between sm:col-span-2 border-b border-slate-200/80 pb-1">
                          <span className="font-bold text-slate-600">Judul Misi Pembelajaran:</span>
                          <span className="font-semibold text-slate-800 text-right">{session.missionTitle}</span>
                        </div>

                        {/* If Group, List Member Names */}
                        {isGroup && sessionUser?.groupMembers && sessionUser.groupMembers.length > 0 && (
                          <div className="sm:col-span-2 pt-1">
                            <span className="font-bold text-slate-600 block mb-0.5">
                              Anggota Tim Peneliti ({sessionUser.groupMembers.length} Siswa):
                            </span>
                            <p className="text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-slate-200 font-medium leading-relaxed">
                              {sessionUser.groupMembers.join(' • ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. BAGIAN I: METRIK & CAPAIAN KOMPETENSI */}
                    {includeMetrics && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>I. Rekapitulasi Capaian Kompetensi (Rubrik HOTS)</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-700 block uppercase">Literasi Membaca</span>
                            <span className="text-base sm:text-lg font-black text-blue-950 font-mono">
                              {session.metrics?.literacyScore || 88}/100
                            </span>
                            <span className="text-[9px] text-blue-600 block font-semibold">
                              {(session.metrics?.literacyScore || 88) >= 85 ? 'Sangat Mahir' : 'Mahir'}
                            </span>
                          </div>
                          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-700 block uppercase">Numerasi & Pola</span>
                            <span className="text-base sm:text-lg font-black text-emerald-950 font-mono">
                              {session.metrics?.numeracyScore || 92}/100
                            </span>
                            <span className="text-[9px] text-emerald-600 block font-semibold">
                              {(session.metrics?.numeracyScore || 92) >= 85 ? 'Sangat Mahir' : 'Mahir'}
                            </span>
                          </div>
                          <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200">
                            <span className="text-[10px] font-bold text-purple-700 block uppercase">Penalaran Kritis</span>
                            <span className="text-base sm:text-lg font-black text-purple-950 font-mono">
                              {session.metrics?.reasoningScore || 90}/100
                            </span>
                            <span className="text-[9px] text-purple-600 block font-semibold">
                              {(session.metrics?.reasoningScore || 90) >= 85 ? 'Sangat Mahir' : 'Mahir'}
                            </span>
                          </div>
                          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-800 block uppercase">Kemandirian Belajar</span>
                            <span className="text-base sm:text-lg font-black text-amber-950 font-mono">
                              {session.scaffoldingHistory?.length || 0} Bantuan
                            </span>
                            <span className="text-[9px] text-amber-700 block font-semibold">
                              {(session.scaffoldingHistory?.length || 0) <= 1 ? 'Mandiri Tinggi' : 'Terbimbing Baik'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. BAGIAN II: BUKTI TEMUAN OBJEK & JEMBATAN KONSEP (LEARNING BRIDGE) */}
                    {includeExploration && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <Camera className="w-4 h-4 text-blue-600" />
                          <span>II. Bukti Eksplorasi Objek Lingkungan Nyata</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          {/* Image Box */}
                          <div className="sm:col-span-1 space-y-1 text-center">
                            <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-900 aspect-4/3 flex items-center justify-center">
                              <img
                                src={session.image}
                                alt={session.imageLabel}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 block">
                              Objek: <strong>{session.imageLabel}</strong>
                            </span>
                          </div>

                          {/* Concept Bridge Breakdown */}
                          <div className="sm:col-span-2 space-y-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                              <span className="text-[10px] font-bold text-blue-700 uppercase block">
                                🔗 Jembatan Konsep Materi (Learning Bridge)
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed">
                                {session.learningBridge?.explanation ||
                                  'Objek yang difoto dihubungkan langsung dengan konsep materi sains dan pola matematika dalam kehidupan sehari-hari.'}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                              <span className="text-[10px] font-bold text-purple-700 uppercase block">
                                💡 Pertanyaan Pemantik Berpikir Kritis
                              </span>
                              <p className="text-slate-800 text-[11px] italic font-serif">
                                "{session.learningBridge?.criticalQuestion ||
                                  'Bagaimana cara membuktikan hubungan konsep ini dengan fenomena lingkungan sekitarmu?'}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. BAGIAN III: LEMBAR 4 PILAR BERPIKIR KOMPUTASIONAL (COMPUTATIONAL THINKING) */}
                    {includeReasoning && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-1">
                          <div className="flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-purple-600" />
                            <span>III. Lembar 4 Pilar Berpikir Komputasional (Computational Thinking)</span>
                          </div>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            4 Langkah Penyelidikan Kontekstual
                          </span>
                        </h4>

                        {/* If 4 CT answers are present */}
                        {session.answers?.decomposition || session.answers?.patternRecognition || session.answers?.abstraction || session.answers?.algorithmicThinking ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* 1. Dekomposisi */}
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                              <span className="font-extrabold text-blue-900 block text-[11px] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] inline-flex items-center justify-center font-bold">1</span>
                                🔍 Langkah 1: Dekomposisi (Membongkar Bagian Objek)
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/90 p-2.5 rounded-lg border border-blue-100 shadow-2xs font-medium">
                                {session.answers?.decomposition || '-'}
                              </p>
                            </div>

                            {/* 2. Pengenalan Pola */}
                            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1.5">
                              <span className="font-extrabold text-indigo-900 block text-[11px] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] inline-flex items-center justify-center font-bold">2</span>
                                🧩 Langkah 2: Pengenalan Pola (Menemukan Keteraturan)
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/90 p-2.5 rounded-lg border border-indigo-100 shadow-2xs font-medium">
                                {session.answers?.patternRecognition || '-'}
                              </p>
                            </div>

                            {/* 3. Abstraksi */}
                            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1.5">
                              <span className="font-extrabold text-purple-900 block text-[11px] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] inline-flex items-center justify-center font-bold">3</span>
                                🎯 Langkah 3: Abstraksi (Memilih yang Paling Penting)
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/90 p-2.5 rounded-lg border border-purple-100 shadow-2xs font-medium">
                                {session.answers?.abstraction || '-'}
                              </p>
                            </div>

                            {/* 4. Berpikir Algoritma */}
                            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                              <span className="font-extrabold text-emerald-900 block text-[11px] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] inline-flex items-center justify-center font-bold">4</span>
                                📋 Langkah 4: Berpikir Algoritma (Menyusun Langkah 1, 2, 3)
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/90 p-2.5 rounded-lg border border-emerald-100 shadow-2xs font-medium">
                                {session.answers?.algorithmicThinking || '-'}
                              </p>
                            </div>
                          </div>
                        ) : session.answers?.realProblem || session.answers?.prototype || session.answers?.testing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* 1. Masalah Nyata */}
                            <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-1">
                              <span className="font-extrabold text-rose-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] inline-flex items-center justify-center font-mono">1</span>
                                Masalah Nyata
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-rose-100">
                                {session.answers?.realProblem || session.answers?.challengeAnswer || '-'}
                              </p>
                            </div>

                            {/* 2. Bertanya & Mencari Info */}
                            <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1">
                              <span className="font-extrabold text-amber-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] inline-flex items-center justify-center font-mono">2</span>
                                Bertanya & Mencari Informasi
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-100">
                                {session.answers?.askInquire || session.answers?.reason || '-'}
                              </p>
                            </div>

                            {/* 3. Merancang Solusi */}
                            <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
                              <span className="font-extrabold text-blue-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] inline-flex items-center justify-center font-mono">3</span>
                                Merancang Solusi
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-blue-100">
                                {session.answers?.designSolution || session.answers?.strategy || '-'}
                              </p>
                            </div>

                            {/* 4. Membuat Produk/Prototipe */}
                            <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-1">
                              <span className="font-extrabold text-indigo-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] inline-flex items-center justify-center font-mono">4</span>
                                Membuat Produk/Prototipe
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-indigo-100">
                                {session.answers?.prototype || '-'}
                              </p>
                            </div>

                            {/* 5. Menguji */}
                            <div className="p-2.5 bg-cyan-50/50 rounded-xl border border-cyan-200 space-y-1">
                              <span className="font-extrabold text-cyan-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] inline-flex items-center justify-center font-mono">5</span>
                                Menguji
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-cyan-100">
                                {session.answers?.testing || '-'}
                              </p>
                            </div>

                            {/* 6. Menganalisis Data */}
                            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
                              <span className="font-extrabold text-emerald-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] inline-flex items-center justify-center font-mono">6</span>
                                Menganalisis Data
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-emerald-100">
                                {session.answers?.dataAnalysis || session.answers?.evidence || '-'}
                              </p>
                            </div>

                            {/* 7. Memperbaiki */}
                            <div className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1">
                              <span className="font-extrabold text-purple-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] inline-flex items-center justify-center font-mono">7</span>
                                Memperbaiki
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-purple-100">
                                {session.answers?.improvement || '-'}
                              </p>
                            </div>

                            {/* 8. Mengomunikasikan Hasil */}
                            <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
                              <span className="font-extrabold text-teal-800 block text-[11px] flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[9px] inline-flex items-center justify-center font-mono">8</span>
                                Mengomunikasikan Hasil
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-teal-100">
                                {session.answers?.communication || session.answers?.conclusion || '-'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-slate-300 space-y-1">
                              <span className="font-bold text-blue-900 block text-[11px]">
                                1. Identifikasi Objek & Jawaban Tantangan:
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200">
                                {session.answers?.challengeAnswer || 'Siswa berhasil mengidentifikasi komponen objek secara komprehensif.'}
                              </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-300 space-y-1">
                              <span className="font-bold text-purple-900 block text-[11px]">
                                2. Alasan & Hubungan Sebab-Akibat (Scientific/Mathematical Reasoning):
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200">
                                {session.answers?.reason || 'Siswa menguraikan mekanisme sebab-akibat dengan menghubungkan fakta teramati.'}
                              </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-300 space-y-1">
                              <span className="font-bold text-emerald-900 block text-[11px]">
                                3. Bukti Kontekstual & Kesimpulan Akhir:
                              </span>
                              <p className="text-slate-800 text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200">
                                {session.answers?.evidence || session.answers?.conclusion || 'Siswa menyimpulkan hasil investigasi dengan tepat.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 7. BAGIAN IV: LEMBAR OBSERVASI & PENILAIAN GURU */}
                    {includeObservations && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>IV. Hasil Observasi & Penilaian Kinerja Guru</span>
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-300 space-y-3 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px]">
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-slate-500 block">Partisipasi & Keaktifan</span>
                              <strong className="text-slate-900 text-xs">
                                {observation?.memberScores?.[0]?.indicators?.participation || 4}/4 (Sangat Baik)
                              </strong>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-slate-500 block">Gotong Royong</span>
                              <strong className="text-slate-900 text-xs">
                                {observation?.memberScores?.[0]?.indicators?.collaboration || 4}/4 (Sangat Baik)
                              </strong>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-slate-500 block">Penalaran Kritis</span>
                              <strong className="text-slate-900 text-xs">
                                {observation?.memberScores?.[0]?.indicators?.criticalThinking || 4}/4 (Sangat Baik)
                              </strong>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-slate-500 block">Tanggung Jawab</span>
                              <strong className="text-slate-900 text-xs">
                                {observation?.memberScores?.[0]?.indicators?.responsibility || 4}/4 (Sangat Baik)
                              </strong>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-200 sm:col-span-1 col-span-2">
                              <span className="text-slate-500 block">Komunikasi & Sikap</span>
                              <strong className="text-slate-900 text-xs">
                                {observation?.memberScores?.[0]?.indicators?.communication || 4}/4 (Sangat Baik)
                              </strong>
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                            <span className="font-bold text-slate-700 text-[10px] uppercase block">
                              Catatan Kualitatif Guru & Rekomendasi:
                            </span>
                            <p className="text-slate-800 text-[11px] italic font-serif">
                              "{observation?.groupNotes || 'Siswa menunjukkan antusiasme tinggi, argumen berbasis bukti nyata tersusun runtut, dan kolaborasi antar anggota sangat solid.'}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 8. BAGIAN V: SLIDE & PRESENTASI KELAS */}
                    {includePresentation && session.presentation && session.presentation.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>V. Ringkasan Slide & Narasi Presentasi Siswa</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {session.presentation.map((slide, slideIdx) => (
                            <div
                              key={slideIdx}
                              className="bg-slate-50 p-2.5 rounded-xl border border-slate-300 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px]">
                                <span className="font-bold text-indigo-700">Slide {slideIdx + 1}</span>
                                <span className="text-slate-500">{slide.title}</span>
                              </div>
                              <p className="text-[10px] text-slate-700 leading-snug line-clamp-3">
                                {slide.content}
                              </p>
                              {(slide.speakingNotes || slide.speakerNotes) && (
                                <p className="text-[9px] text-slate-500 italic bg-white p-1 rounded border border-slate-100">
                                  🎤 "{slide.speakingNotes || slide.speakerNotes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 9. BAGIAN VI: LEMBAR REFLEKSI DIRI */}
                    {includeReflection && session.reflection && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>VI. Lembar Refleksi Metakognisi Murid</span>
                        </h4>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                            <span className="font-bold text-slate-700 text-[10px] block">Hal Baru yang Dipahami:</span>
                            <p className="text-slate-800 text-[10px] italic">
                              "{session.reflection.q2Learned || 'Menemukan bahwa bentuk geometri dan konsep sains ada di sekeliling kita.'}"
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                            <span className="font-bold text-slate-700 text-[10px] block">Tantangan & Solusi yang Dilakukan:</span>
                            <p className="text-slate-800 text-[10px] italic">
                              "{session.reflection.q4Solved || session.reflection.q3Hardest || 'Mendiskusikan bersama rekan dan mencoba mengukur kembali secara teliti.'}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 10. BAGIAN VII: PENGESAHAN & TANDA TANGAN RESMI */}
                    {includeSignatures && (
                      <div className="pt-6 mt-4 border-t border-slate-300 break-inside-avoid">
                        <div className="text-right text-xs text-slate-700 mb-6">
                          <span>{schoolProfile.city}, {formattedToday}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center text-xs">
                          {/* Parent */}
                          <div className="space-y-16">
                            <span className="font-bold text-slate-700 block text-[11px]">
                              Orang Tua / Wali Siswa
                            </span>
                            <div className="border-b border-slate-800 w-32 mx-auto" />
                            <span className="text-[10px] text-slate-500 block -mt-14">
                              ( ..................................... )
                            </span>
                          </div>

                          {/* Teacher */}
                          <div className="space-y-16">
                            <span className="font-bold text-slate-700 block text-[11px]">
                              Guru Kelas / Pengampu
                            </span>
                            <div className="border-b border-slate-800 w-36 mx-auto" />
                            <div className="text-[10px] text-slate-900 block -mt-14 font-semibold">
                              {currentUser.role === 'teacher' ? currentUser.name : 'Pak Dedy, S.Pd.'}
                              <span className="text-[9px] text-slate-500 block font-mono">
                                NIP. {currentUser.nisnNip || '198504122010011008'}
                              </span>
                            </div>
                          </div>

                          {/* Headmaster */}
                          <div className="space-y-16">
                            <span className="font-bold text-slate-700 block text-[11px]">
                              Mengetahui, Kepala Sekolah
                            </span>
                            <div className="border-b border-slate-800 w-40 mx-auto" />
                            <div className="text-[10px] text-slate-900 block -mt-14 font-semibold">
                              {schoolProfile.headmaster}
                              <span className="text-[9px] text-slate-500 block font-mono">
                                NIP. {schoolProfile.headmasterNip}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================== SCREEN ONLY FOOTER ==================== */}
        <div className="no-print bg-white p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Format layout print-css telah diselaraskan untuk ukuran kertas A4.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
