import React, { useState, useEffect } from 'react';
import { LearningMission, CognitiveLevel, TargetCompetency, Subject } from '../types';
import {
  Sparkles,
  X,
  BookOpen,
  Target,
  Layers,
  ShieldCheck,
  Check,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface MissionCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMission: (mission: LearningMission) => void;
  editingMission?: LearningMission | null;
  subjects?: Subject[];
}

export const MissionCreatorModal: React.FC<MissionCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveMission,
  editingMission,
  subjects = []
}) => {
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('Kelas V');
  const [phase, setPhase] = useState('Fase C (Kelas 5-6)');
  const [subject, setSubject] = useState('Matematika');
  const [material, setMaterial] = useState('');
  const [cp, setCp] = useState('');
  const [tp, setTp] = useState('');
  const [indicatorsText, setIndicatorsText] = useState('');
  const [targetCompetency, setTargetCompetency] = useState<TargetCompetency>('numeracy');
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>('C4-C6');
  const [strictCurriculumMode, setStrictCurriculumMode] = useState<boolean>(true); // Default: ON (Section 5)
  const [description, setDescription] = useState('');

  // Feature Toggles (Section 4)
  const [features, setFeatures] = useState({
    adaptiveDifficulty: true,
    scaffolding: true,
    reasoning: true,
    evidence: true,
    reflection: true,
    presentation: true,
    peerQuestion: true
  });

  useEffect(() => {
    if (editingMission) {
      setTitle(editingMission.title || '');
      setGrade(editingMission.grade || 'Kelas V');
      setPhase(editingMission.phase || 'Fase C (Kelas 5-6)');
      setSubject(editingMission.subject || (subjects[0]?.name || 'Matematika'));
      setMaterial(editingMission.material || '');
      setCp(editingMission.cp || '');
      setTp(editingMission.tp || '');
      setIndicatorsText(editingMission.indicators ? editingMission.indicators.join('\n') : '');
      setTargetCompetency(editingMission.targetCompetency || 'numeracy');
      setCognitiveLevel(editingMission.cognitiveLevel || 'C4-C6');
      setStrictCurriculumMode(editingMission.strictCurriculumMode ?? true);
      setDescription(editingMission.description || '');
      setFeatures(editingMission.features || {
        adaptiveDifficulty: true,
        scaffolding: true,
        reasoning: true,
        evidence: true,
        reflection: true,
        presentation: true,
        peerQuestion: true
      });
    } else {
      setTitle('');
      setGrade('Kelas V');
      setPhase('Fase C (Kelas 5-6)');
      setSubject(subjects[0]?.name || 'Matematika');
      setMaterial('');
      setCp('');
      setTp('');
      setIndicatorsText('');
      setTargetCompetency('numeracy');
      setCognitiveLevel('C4-C6');
      setStrictCurriculumMode(true);
      setDescription('');
      setFeatures({
        adaptiveDifficulty: true,
        scaffolding: true,
        reasoning: true,
        evidence: true,
        reflection: true,
        presentation: true,
        peerQuestion: true
      });
    }
  }, [editingMission, isOpen]);

  if (!isOpen) return null;

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !material) return;

    const indicators = indicatorsText
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const foundSubject = subjects.find(
      (s) => s.name.toLowerCase() === subject.toLowerCase()
    );
    const idMapel = foundSubject
      ? foundSubject.id
      : subject.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

    const updatedMission: LearningMission = {
      ...editingMission,
      id: editingMission ? editingMission.id : `mission-${Date.now()}`,
      idMapel,
      title,
      grade,
      phase,
      subject,
      material,
      cp: cp || 'Peserta didik mampu menalar dan menerapkan konsep ke dalam lingkungan nyata.',
      tp: tp || 'Menerapkan materi pembelajaran dalam konteks pemecahan masalah autentik.',
      indicators: indicators.length > 0 ? indicators : ['Mengidentifikasi informasi', 'Menjelaskan alasan logis'],
      targetCompetency,
      cognitiveLevel,
      strictCurriculumMode,
      features,
      description: description || 'Misi eksplorasi objek di lingkungan sekitar sekolah.',
      isActive: editingMission ? editingMission.isActive : true,
      createdAt: editingMission ? editingMission.createdAt : new Date().toISOString().split('T')[0],
      suggestedObjects: editingMission ? (editingMission.suggestedObjects || ['Benda nyata', 'Lingkungan sekitar']) : ['Benda nyata di ruang kelas', 'Lingkungan halaman sekolah']
    };

    onSaveMission(updatedMission);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] text-left">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display">
                {editingMission ? 'Ubah Rencana Misi Pembelajaran' : 'Rancang Misi Pembelajaran Baru'}
              </h2>
              <p className="text-xs text-white/80">
                {editingMission ? 'Perbarui Capaian Pembelajaran, materi pokok, dan indikator keberhasilan' : 'Guru menentukan arah materi dan kompetensi, sistem memandu nalar eksplorasi murid'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Curriculum Alignment Toggle Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
            <div className="space-y-0.5 max-w-lg">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Keselarasan Penuh dengan Silabus Guru</span>
              </div>
              <p className="text-[11px] text-blue-700">
                Menjamin pertanyaan dan tantangan kontekstual tetap fokus pada Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) yang Anda tetapkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStrictCurriculumMode(!strictCurriculumMode)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                strictCurriculumMode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {strictCurriculumMode ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          {/* Activity Name */}
          <div className="space-y-1">
            <label className="font-bold text-[#25324B] uppercase text-[11px]">Nama Aktivitas</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Petualangan KPK & FPB di Jam Dinding"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Grid: Subject, Class, Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">Mata Pelajaran</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none text-xs"
              >
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.name}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">Kelas</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none text-xs"
              >
                <option>Kelas IV</option>
                <option>Kelas V</option>
                <option>Kelas VI</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">Fase</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none text-xs"
              >
                <option>Fase B (Kelas 3-4)</option>
                <option>Fase C (Kelas 5-6)</option>
              </select>
            </div>
          </div>

          {/* Materi Pokok */}
          <div className="space-y-1">
            <label className="font-bold text-[#25324B] uppercase text-[11px]">Materi Pokok</label>
            <input
              type="text"
              required
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Contoh: KPK dan FPB dalam Kehidupan Sehari-hari"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* CP & TP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">
                Capaian Pembelajaran (CP)
              </label>
              <textarea
                rows={2}
                value={cp}
                onChange={(e) => setCp(e.target.value)}
                placeholder="Deskripsi Capaian Pembelajaran Kurikulum..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-xs resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">
                Tujuan Pembelajaran (TP)
              </label>
              <textarea
                rows={2}
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                placeholder="Tujuan spesifik yang harus dicapai murid..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-xs resize-none"
              />
            </div>
          </div>

          {/* Indikator Keberhasilan */}
          <div className="space-y-1">
            <label className="font-bold text-[#25324B] uppercase text-[11px]">
              Indikator Keberhasilan (Satu per baris)
            </label>
            <textarea
              rows={2}
              value={indicatorsText}
              onChange={(e) => setIndicatorsText(e.target.value)}
              placeholder="1. Menemukan pola interval berulang dari foto&#10;2. Menganalisis alasan logis KPK atau FPB&#10;3. Membuktikan perhitungan"
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-xs resize-none"
            />
          </div>

          {/* Target Kompetensi & Level Kognitif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">
                Target Kompetensi
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['literacy', 'numeracy', 'both'] as TargetCompetency[]).map((tc) => (
                  <button
                    key={tc}
                    type="button"
                    onClick={() => setTargetCompetency(tc)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      targetCompetency === tc
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tc === 'literacy' && 'Literasi'}
                    {tc === 'numeracy' && 'Numerasi'}
                    {tc === 'both' && 'Keduanya'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#25324B] uppercase text-[11px]">
                Level Kognitif
              </label>
              <div className="flex flex-wrap gap-1">
                {(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C4-C6'] as CognitiveLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCognitiveLevel(lvl)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      cognitiveLevel === lvl
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pedagogical Feature Toggles (Section 4) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-[#25324B] uppercase text-[11px] block">
              Fitur Pedagogis yang Diaktifkan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'scaffolding', label: 'Tutor Scaffolding' },
                { key: 'reasoning', label: 'Penalaran Konsep' },
                { key: 'evidence', label: 'Bukti (Evidence)' },
                { key: 'reflection', label: 'Refleksi Diri' },
                { key: 'presentation', label: 'Auto Presentasi' },
                { key: 'peerQuestion', label: 'Tanya Teman' },
                { key: 'adaptiveDifficulty', label: 'Kesulitan Adaptif' }
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFeature(f.key as any)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    (features as any)[f.key]
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <span>{f.label}</span>
                  {(features as any)[f.key] && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-md hover:shadow-blue-500/20 active:scale-98 transition-all"
            >
              {editingMission ? 'Simpan Perubahan' : 'Terbitkan Misi Pembelajaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
