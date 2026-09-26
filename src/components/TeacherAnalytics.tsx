import React, { useState } from 'react';
import {
  StudentProgressProfile,
  TeacherInsight,
  AssessmentRecord
} from '../types';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Sparkles,
  Award,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  BookOpen,
  Calendar
} from 'lucide-react';

interface TeacherAnalyticsProps {
  studentsProfiles: StudentProgressProfile[];
  insights: TeacherInsight[];
  assessments: AssessmentRecord[];
  onSelectStudentProfile?: (profile: StudentProgressProfile) => void;
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  studentsProfiles,
  insights,
  assessments
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'literacy' | 'numeracy' | 'assessments'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgressProfile>(studentsProfiles[0]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-100 text-[#7C5CFC]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#25324B] font-display">
              Analitik Proses Berpikir & Perkembangan Murid
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Merekam proses berpikir, penggunaan bukti, dan kebutuhan bantuan murid — bukan hanya skor akhir
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          {[
            { id: 'overview', label: 'Ringkasan Kelas' },
            { id: 'literacy', label: 'Dimensi Literasi' },
            { id: 'numeracy', label: 'Dimensi Numerasi' },
            { id: 'assessments', label: 'Pre vs Post Test' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 md:flex-initial ${
                activeTab === tab.id
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pedagogical Insights Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Lightbulb className="w-4 h-4 text-[#7C5CFC]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Rekomendasi Pedagogis Guru • Literasi & Numerasi Berbasis Bukti
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`rounded-3xl p-5 border-2 shadow-2xs space-y-3 flex flex-col justify-between transition-all hover:shadow-md ${
                ins.type === 'strength'
                  ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border-emerald-200'
                  : ins.type === 'need_scaffold'
                  ? 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border-amber-200'
                  : 'bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/50 border-purple-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-2xs ${
                      ins.type === 'strength'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : ins.type === 'need_scaffold'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-purple-100 text-purple-900 border border-purple-300'
                    }`}
                  >
                    {ins.type === 'strength' && '🌱 Kekuatan Terdeteksi'}
                    {ins.type === 'need_scaffold' && '📐 Perlu Scaffolding'}
                    {ins.type === 'pedagogical_tip' && '💡 Saran Pedagogis'}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#25324B] leading-snug">
                  {ins.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {ins.content}
                </p>
                <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-[11px] text-slate-600 shadow-2xs">
                  <strong className="text-slate-800">📊 Bukti Data:</strong> {ins.evidenceData}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/80 text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                <span>💡 Aksi Guru:</span>
                <span className="font-semibold text-slate-800">{ins.actionRecommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Students Roster Table / Cards (Col 5) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Profil Murid Kelas V-A ({studentsProfiles.length})
            </h3>

            <div className="space-y-2">
              {studentsProfiles.map((st) => {
                const isSelected = selectedStudent.studentId === st.studentId;
                return (
                  <div
                    key={st.studentId}
                    onClick={() => setSelectedStudent(st)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#7C5CFC] bg-purple-50/70 shadow-xs ring-2 ring-purple-500/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[#25324B]">{st.name}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>{st.activitiesCount} Aktivitas</span>
                        <span>•</span>
                        <span className="text-purple-600 font-semibold">
                          {st.scaffoldingCount} Scaffolding
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#25324B]">
                        L: {st.overallLiteracy}% | N: {st.overallNumeracy}%
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Penalaran: {st.overallReasoning}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Student Deep Dive Profile (Col 7) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-purple-600 uppercase">
                  Profil Perkembangan
                </span>
                <h3 className="text-xl font-bold text-[#25324B] font-display">
                  {selectedStudent.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                {selectedStudent.className}
              </span>
            </div>

            {/* Quick 4 Stats (Section 33) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="text-[11px] text-blue-600 font-medium block">Aktivitas</span>
                <span className="text-lg font-bold text-blue-950 font-display">
                  {selectedStudent.activitiesCount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                <span className="text-[11px] text-purple-600 font-medium block">Eksplorasi</span>
                <span className="text-lg font-bold text-purple-950 font-display">
                  {selectedStudent.explorationsCount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[11px] text-emerald-600 font-medium block">Presentasi</span>
                <span className="text-lg font-bold text-emerald-950 font-display">
                  {selectedStudent.presentationsCount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-[11px] text-amber-600 font-medium block">Scaffolding</span>
                <span className="text-lg font-bold text-amber-950 font-display">
                  {selectedStudent.scaffoldingCount} kali
                </span>
              </div>
            </div>

            {/* Progress Bars for Core Capabilities */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Indeks Proses Berpikir Murid
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Kemampuan Literasi</span>
                    <span className="font-bold text-blue-600">{selectedStudent.overallLiteracy}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4F8EF7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedStudent.overallLiteracy}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Kemampuan Numerasi</span>
                    <span className="font-bold text-purple-600">{selectedStudent.overallNumeracy}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#7C5CFC] h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedStudent.overallNumeracy}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Penalaran & Bukti</span>
                    <span className="font-bold text-emerald-600">{selectedStudent.overallReasoning}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#20C9A6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedStudent.overallReasoning}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Komunikasi & Presentasi</span>
                    <span className="font-bold text-rose-600">{selectedStudent.overallCommunication}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FF7A7A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedStudent.overallCommunication}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note on Pedagogical Framing (Section 33 & 48) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              ℹ️ <strong>Catatan Pedagogis Guru:</strong> Data perkembangan belajar ini dirancang untuk memandu pemberian scaffolding yang tepat sasaran dan bukan sebagai diagnosis psikologis murid.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Literacy Dimension (Section 10 & 32) */}
      {activeTab === 'literacy' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#25324B] font-display flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 text-sm">🌱</span>
                <span>Dimensi Kemampuan Literasi Siswa (L1 – L6)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perkembangan dari menemukan informasi, memahami, menafsirkan, membuat inferensi, mengevaluasi, hingga argumentasi
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              📖 Rata-rata: {selectedStudent.overallLiteracy}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: 'L1', name: 'Menemukan Informasi', desc: 'Menemukan detail spesifik pada foto', val: selectedStudent.literacyProgress.locate },
              { code: 'L2', name: 'Memahami Informasi', desc: 'Menjelaskan fungsi dan arti objek', val: selectedStudent.literacyProgress.understand },
              { code: 'L3', name: 'Menafsirkan (Interpret)', desc: 'Menghubungkan pola objek dengan materi', val: selectedStudent.literacyProgress.interpret },
              { code: 'L4', name: 'Membuat Inferensi', desc: 'Menarik kesimpulan logis yang tidak tertulis langsung', val: selectedStudent.literacyProgress.infer },
              { code: 'L5', name: 'Mengevaluasi & Alasan', desc: 'Memberikan argumentasi kuat berbasis bukti', val: selectedStudent.literacyProgress.evaluate },
              { code: 'L6', name: 'Komunikasi & Kreasi', desc: 'Menyusun teks deskripsi dan menyajikan hasil', val: selectedStudent.literacyProgress.communicate }
            ].map((item) => (
              <div key={item.code} className="p-4.5 rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 space-y-2.5 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs border border-emerald-200 shadow-2xs">
                    {item.code}
                  </span>
                  <span className="text-sm font-black text-emerald-950 font-display">{item.val}%</span>
                </div>
                <h4 className="text-xs font-bold text-[#25324B]">{item.name}</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-snug">{item.desc}</p>
                <div className="w-full bg-emerald-100/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-emerald-200">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Numeracy Dimension (Section 11 & 32) */}
      {activeTab === 'numeracy' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#25324B] font-display flex items-center gap-2">
                <span className="p-1 rounded-lg bg-sky-100 text-sky-800 text-sm">📐</span>
                <span>Dimensi Kemampuan Numerasi Siswa (N1 – N8)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengenali info kuantitatif, membuat representasi, memilih strategi, menalar, mengevaluasi kewajaran hasil, dan mengomunikasikan matematika
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              🔢 Rata-rata: {selectedStudent.overallNumeracy}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { code: 'N1', name: 'Informasi Kuantitatif', val: selectedStudent.numeracyProgress.identify },
              { code: 'N2', name: 'Representasi Pola', val: selectedStudent.numeracyProgress.represent },
              { code: 'N3', name: 'Perhitungan & Estimasi', val: selectedStudent.numeracyProgress.calculate },
              { code: 'N4', name: 'Penerapan Masalah', val: selectedStudent.numeracyProgress.apply },
              { code: 'N5', name: 'Pemilihan Strategi', val: selectedStudent.numeracyProgress.strategy },
              { code: 'N6', name: 'Penalaran Matematis', val: selectedStudent.numeracyProgress.reason },
              { code: 'N7', name: 'Evaluasi Kewajaran', val: selectedStudent.numeracyProgress.evaluate },
              { code: 'N8', name: 'Komunikasi Matematis', val: selectedStudent.numeracyProgress.communicate }
            ].map((item) => (
              <div key={item.code} className="p-4 rounded-2xl border-2 border-sky-100 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/30 space-y-2.5 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs border border-sky-200 shadow-2xs">
                    {item.code}
                  </span>
                  <span className="text-sm font-black text-sky-950 font-display">{item.val}%</span>
                </div>
                <h4 className="text-xs font-bold text-[#25324B] leading-snug">{item.name}</h4>
                <div className="w-full bg-sky-100/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-sky-200">
                  <div className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Pre vs Post Assessment (Section 35) */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#25324B] font-display">
              Perbandingan Pre-Assessment & Post-Assessment
            </h3>
            <p className="text-xs text-slate-500">
              Mengukur perubahan performa penalaran literasi dan numerasi murid setelah menyelesaikan eksplorasi kontekstual
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assessments.filter((a) => a.studentId === selectedStudent.studentId).length === 0 ? (
              <p className="text-xs text-slate-400 py-6">Belum ada data asesmen untuk murid ini.</p>
            ) : (
              assessments
                .filter((a) => a.studentId === selectedStudent.studentId)
                .map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-5 rounded-3xl border ${
                      rec.type === 'pre'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-emerald-50/60 border-emerald-200'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          rec.type === 'pre'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        {rec.type === 'pre' ? 'Pre-Assessment (Awal)' : 'Post-Assessment (Akhir)'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rec.date}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Literasi</span>
                        <span className="text-base font-bold text-blue-600 font-display">
                          {rec.literacyScore}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Numerasi</span>
                        <span className="text-base font-bold text-purple-600 font-display">
                          {rec.numeracyScore}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Penalaran</span>
                        <span className="text-base font-bold text-emerald-600 font-display">
                          {rec.reasoningScore}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-white/70 p-3 rounded-xl border border-slate-100">
                      “{rec.notes}”
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
