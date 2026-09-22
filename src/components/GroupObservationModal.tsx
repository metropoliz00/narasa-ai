import React, { useState, useEffect } from 'react';
import { toast } from './Toast';
import {
  StudentGroup,
  LearningMission,
  UserProfile,
  GroupObservationRecord,
  MemberObservationScore,
  ObservationRubricIndicators
} from '../types';
import {
  Users,
  CheckCircle2,
  X,
  Award,
  BookOpen,
  Sparkles,
  Printer,
  Save,
  MessageSquare,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  Star,
  ShieldCheck,
  TrendingUp,
  Download
} from 'lucide-react';

interface GroupObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: StudentGroup | null;
  missions: LearningMission[];
  currentUser: UserProfile;
  existingRecord?: GroupObservationRecord | null;
  onSaveObservation: (record: GroupObservationRecord) => void;
}

const RUBRIC_DESCRIPTIONS = {
  participation: {
    label: 'Keaktifan & Partisipasi',
    icon: '🔥',
    desc: 'Keterlibatan aktif dalam menggali ide, mengamati objek, dan berpendapat.'
  },
  collaboration: {
    label: 'Kerjasama & Gotong Royong',
    icon: '🤝',
    desc: 'Saling tolong-menolong, menghargai peran teman, dan menjaga kekompakan.'
  },
  criticalThinking: {
    label: 'Penalaran Kritis & Solusi',
    icon: '💡',
    desc: 'Menganalisis sebab-akibat fenomena sekitar dan merumuskan bukti ilmiah.'
  },
  responsibility: {
    label: 'Tanggung Jawab Tugas',
    icon: '🎯',
    desc: 'Menuntaskan bagian tugasnya dengan disiplin dan tepat waktu.'
  },
  communication: {
    label: 'Komunikasi & Respek',
    icon: '🗣️',
    desc: 'Menyampaikan argumen santun dan aktif mendengarkan pandangan rekan.'
  }
};

const SCALE_LABELS: Record<number, { text: string; badge: string }> = {
  4: { text: '4 - Sangat Baik / Membudaya', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  3: { text: '3 - Baik / Berkembang Harapan', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  2: { text: '2 - Cukup / Mulai Berkembang', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  1: { text: '1 - Perlu Bimbingan', badge: 'bg-rose-100 text-rose-800 border-rose-300' }
};

const calculatePredicate = (score: number): 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' => {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 75) return 'Baik';
  if (score >= 60) return 'Cukup';
  return 'Perlu Bimbingan';
};

const calculateMemberScore = (indicators: ObservationRubricIndicators): number => {
  const sum =
    indicators.participation +
    indicators.collaboration +
    indicators.criticalThinking +
    indicators.responsibility +
    indicators.communication;
  // Scale out of 20 to 100
  return Math.round((sum / 20) * 100);
};

export const GroupObservationModal: React.FC<GroupObservationModalProps> = ({
  isOpen,
  onClose,
  group,
  missions,
  currentUser,
  existingRecord,
  onSaveObservation
}) => {
  if (!isOpen || !group) return null;

  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    existingRecord?.missionId || missions[0]?.id || ''
  );
  const [activityTopic, setActivityTopic] = useState<string>(
    existingRecord?.activityTopic || 'Observasi Lapangan & Penalaran Konsep Objek Nyata'
  );
  const [groupCohesion, setGroupCohesion] = useState<number>(existingRecord?.groupCohesion || 4);
  const [taskQuality, setTaskQuality] = useState<number>(existingRecord?.taskQuality || 4);
  const [groupNotes, setGroupNotes] = useState<string>(
    existingRecord?.groupNotes ||
      `Kelompok ${group.name} aktif berkolaborasi dan mampu menghubungkan temuan lapangan dengan materi kurikulum.`
  );

  // Initialize individual member scores from group.memberNames / existingRecord
  const [memberScores, setMemberScores] = useState<MemberObservationScore[]>(() => {
    if (existingRecord && existingRecord.memberScores.length > 0) {
      return existingRecord.memberScores;
    }

    const members = group.memberNames && group.memberNames.length > 0
      ? group.memberNames
      : ['Anggota 1', 'Anggota 2'];

    return members.map((name, idx) => {
      const isLeader = group.leaderName ? group.leaderName.toLowerCase() === name.toLowerCase() : idx === 0;
      const initialIndicators: ObservationRubricIndicators = {
        participation: isLeader ? 4 : 3,
        collaboration: 4,
        criticalThinking: 3,
        responsibility: 4,
        communication: 3
      };
      const totalScore = calculateMemberScore(initialIndicators);
      return {
        studentId: `member-${group.id}-${idx}`,
        studentName: name,
        isLeader,
        indicators: initialIndicators,
        totalScore,
        predicate: calculatePredicate(totalScore),
        notes: isLeader
          ? 'Aktif mengkoordinasi pembagian peran dan memimpin diskusi dengan baik.'
          : 'Berpartisipasi aktif dalam pengamatan dan pengerjaan tugas kelompok.'
      };
    });
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (existingRecord) {
      setSelectedMissionId(existingRecord.missionId || missions[0]?.id || '');
      setActivityTopic(existingRecord.activityTopic || 'Observasi Lapangan & Penalaran Konsep Objek Nyata');
      setGroupCohesion(existingRecord.groupCohesion || 4);
      setTaskQuality(existingRecord.taskQuality || 4);
      setGroupNotes(existingRecord.groupNotes || '');
      setMemberScores(existingRecord.memberScores);
    } else if (group) {
      const members = group.memberNames && group.memberNames.length > 0
        ? group.memberNames
        : ['Anggota 1', 'Anggota 2'];

      setMemberScores(
        members.map((name, idx) => {
          const isLeader = group.leaderName ? group.leaderName.toLowerCase() === name.toLowerCase() : idx === 0;
          const initialIndicators: ObservationRubricIndicators = {
            participation: isLeader ? 4 : 3,
            collaboration: 4,
            criticalThinking: 3,
            responsibility: 4,
            communication: 3
          };
          const totalScore = calculateMemberScore(initialIndicators);
          return {
            studentId: `member-${group.id}-${idx}`,
            studentName: name,
            isLeader,
            indicators: initialIndicators,
            totalScore,
            predicate: calculatePredicate(totalScore),
            notes: isLeader
              ? 'Aktif mengkoordinasi pembagian peran dan memimpin diskusi dengan baik.'
              : 'Berpartisipasi aktif dalam pengamatan dan pengerjaan tugas kelompok.'
          };
        })
      );
    }
  }, [group, existingRecord, missions]);

  // Update specific indicator for a member
  const handleScoreChange = (
    memberIndex: number,
    indicatorKey: keyof ObservationRubricIndicators,
    value: number
  ) => {
    setMemberScores((prev) => {
      const updated = [...prev];
      const current = updated[memberIndex];
      const newIndicators = {
        ...current.indicators,
        [indicatorKey]: value
      };
      const newTotal = calculateMemberScore(newIndicators);
      updated[memberIndex] = {
        ...current,
        indicators: newIndicators,
        totalScore: newTotal,
        predicate: calculatePredicate(newTotal)
      };
      return updated;
    });
  };

  const handleNotesChange = (memberIndex: number, notes: string) => {
    setMemberScores((prev) => {
      const updated = [...prev];
      updated[memberIndex] = {
        ...updated[memberIndex],
        notes
      };
      return updated;
    });
  };

  // Quick preset: Set all members to high active score
  const handleApplyQuickPreset = (presetScore: 3 | 4) => {
    setMemberScores((prev) =>
      prev.map((m) => {
        const newIndicators: ObservationRubricIndicators = {
          participation: presetScore,
          collaboration: presetScore,
          criticalThinking: presetScore,
          responsibility: presetScore,
          communication: presetScore
        };
        const newTotal = calculateMemberScore(newIndicators);
        return {
          ...m,
          indicators: newIndicators,
          totalScore: newTotal,
          predicate: calculatePredicate(newTotal)
        };
      })
    );
    setNotification(`Skor semua anggota berhasil diatur ke level ${presetScore}!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Average group score
  const averageGroupScore = Math.round(
    memberScores.reduce((acc, m) => acc + m.totalScore, 0) / (memberScores.length || 1)
  );

  const handleSave = () => {
    const selectedMission = missions.find((m) => m.id === selectedMissionId);
    const newRecord: GroupObservationRecord = {
      id: existingRecord?.id || `obs-${group.id}-${Date.now()}`,
      groupId: group.id,
      groupName: group.name,
      classId: group.classId,
      className: group.className,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      missionId: selectedMissionId,
      missionTitle: selectedMission?.title || 'Observasi Mandiri Terarah',
      activityTopic,
      date: new Date().toISOString().split('T')[0],
      groupCohesion,
      taskQuality,
      averageGroupScore,
      groupNotes,
      memberScores,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    onSaveObservation(newRecord);
    setNotification('✅ Rubrik Observasi & Skor Anggota Kelompok Berhasil Disimpan!');
    toast.success(
      'Observasi Disimpan!',
      `Rubrik observasi untuk kelompok "${group?.name || ''}" berhasil disimpan ke sistem.`
    );
    setTimeout(() => {
      setNotification(null);
      onClose();
    }, 1200);
  };

  const handleExportCSV = () => {
    const selectedMission = missions.find((m) => m.id === selectedMissionId);
    let csv = `RUBRIK OBSERVASI AKTIVITAS KELOMPOK\n`;
    csv += `Kelompok,${group.name}\n`;
    csv += `Kelas,${group.className}\n`;
    csv += `Guru Penilai,${currentUser.name}\n`;
    csv += `Misi / Aktivitas,${selectedMission?.title || activityTopic}\n`;
    csv += `Tanggal Observasi,${new Date().toLocaleDateString('id-ID')}\n`;
    csv += `Kekompakan Tim,${groupCohesion}/4\n`;
    csv += `Kualitas Tugas,${taskQuality}/4\n`;
    csv += `Rata-rata Kelompok,${averageGroupScore}\n`;
    csv += `Catatan Umum Guru,"${groupNotes.replace(/"/g, '""')}"\n\n`;

    csv += `No,Nama Anggota,Peran,Keaktifan,Kerjasama,Nalar Kritis,Tanggung Jawab,Komunikasi,Total Skor (100),Predikat,Catatan Observasi\n`;
    memberScores.forEach((m, idx) => {
      csv += `${idx + 1},"${m.studentName}",${m.isLeader ? 'Ketua Kelompok' : 'Anggota'},${m.indicators.participation},${m.indicators.collaboration},${m.indicators.criticalThinking},${m.indicators.responsibility},${m.indicators.communication},${m.totalScore},"${m.predicate}","${(m.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rubrik_Observasi_${group.name.replace(/\s+/g, '_')}_${group.className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMission = missions.find((m) => m.id === selectedMissionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
              <Users className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Rubrik Observasi Guru
                </span>
                <span className="text-xs text-blue-100 font-medium">
                  {group.className} • {group.schoolName}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white mt-0.5">
                Observasi Aktivitas: {group.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 text-left">
          {notification && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Context & Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Misi Pembelajaran yang Diobservasi
              </label>
              <select
                value={selectedMissionId}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Topik Aktivitas / Tugas Proyek
              </label>
              <input
                type="text"
                value={activityTopic}
                onChange={(e) => setActivityTopic(e.target.value)}
                placeholder="Contoh: Eksplorasi Hubungan Rantai Makanan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
              </input>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">Rata-Rata Tim</span>
                <span className="text-2xl font-bold font-display text-blue-700">
                  {averageGroupScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </span>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                averageGroupScore >= 90
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : averageGroupScore >= 75
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                {calculatePredicate(averageGroupScore)}
              </span>
            </div>
          </div>

          {/* Rubric Dimension Guidance Banner */}
          <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-blue-950 font-display">
                  Panduan Rubrik Observasi Aktivitas Kelompok (Pembelajaran Mendalam)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-blue-700 font-medium hidden sm:inline">Set Cepat Semua:</span>
                <button
                  type="button"
                  onClick={() => handleApplyQuickPreset(4)}
                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Semua Skor 4
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickPreset(3)}
                  className="px-2 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-800 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Semua Skor 3
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[11px] text-slate-600 pt-1">
              {Object.entries(RUBRIC_DESCRIPTIONS).map(([key, item]) => (
                <div key={key} className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Group Level Dynamics Evaluation */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>1. Observasi Dinamika & Iklim Kerjasama Kelompok</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Kekompakan & Iklim Kerjasama Tim:</span>
                  <span className="font-bold text-blue-600">Skor {groupCohesion} / 4</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGroupCohesion(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        groupCohesion === val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val === 4 ? '4 (Kompak)' : val === 3 ? '3 (Baik)' : val === 2 ? '2 (Cukup)' : '1 (Perlu Bimbingan)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Ketercapaian Hasil & Bukti Lapangan:</span>
                  <span className="font-bold text-blue-600">Skor {taskQuality} / 4</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTaskQuality(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        taskQuality === val
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val === 4 ? '4 (Tuntas)' : val === 3 ? '3 (Lengkap)' : val === 2 ? '2 (Sebagian)' : '1 (Minim)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Catatan Observasi Guru untuk Kelompok:
              </label>
              <textarea
                rows={2}
                value={groupNotes}
                onChange={(e) => setGroupNotes(e.target.value)}
                placeholder="Tuliskan catatan dinamika kelompok, apresiasi kekompakan, atau aspek yang perlu ditingkatkan..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          {/* Individual Member Observation Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>2. Penilaian Skor Masing-Masing Anggota Kelompok ({memberScores.length} Siswa)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Berikan skor 1 - 4 pada setiap indikator perilaku kolaboratif anggota kelompok.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {memberScores.map((member, mIdx) => (
                <div
                  key={member.studentId}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 shadow-xs space-y-4 transition-all"
                >
                  {/* Member Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {member.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-900 font-display">
                            {member.studentName}
                          </h5>
                          {member.isLeader && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              👑 Ketua Kelompok
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Anggota #{mIdx + 1} • {group.name}
                        </span>
                      </div>
                    </div>

                    {/* Calculated Member Score */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Skor Observasi</span>
                        <span className="text-lg font-extrabold text-blue-700 font-display">
                          {member.totalScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        member.totalScore >= 90
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : member.totalScore >= 75
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {member.predicate}
                      </span>
                    </div>
                  </div>

                  {/* 5 Indicators Scoring Grid for This Member */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(Object.keys(RUBRIC_DESCRIPTIONS) as Array<keyof ObservationRubricIndicators>).map((key) => {
                      const info = RUBRIC_DESCRIPTIONS[key];
                      const currentValue = member.indicators[key] || 3;
                      return (
                        <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 truncate" title={info.label}>
                              {info.icon} {info.label}
                            </span>
                            <span className="text-[11px] font-extrabold text-blue-600">{currentValue}</span>
                          </div>

                          <div className="grid grid-cols-4 gap-1">
                            {[1, 2, 3, 4].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleScoreChange(mIdx, key, val)}
                                className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentValue === val
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'
                                }`}
                                title={`Skor ${val}`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes for this individual member */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={member.notes || ''}
                      onChange={(e) => handleNotesChange(mIdx, e.target.value)}
                      placeholder={`Catatan observasi untuk ${member.studentName}...`}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Ekspor Rekap Nilai (.CSV)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Rubrik Observasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
