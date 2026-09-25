import React, { useState } from 'react';
import { ConceptQuiz, LearningMission, UserProfile } from '../types';
import { QuizEditorModal } from './QuizEditorModal';
import {
  X,
  Sparkles,
  BookOpen,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Brain,
  Layers,
  ArrowRight,
  FileText,
  CheckSquare,
  HelpCircle,
  Clock,
  Target,
  Upload,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';

interface AICriticalQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: LearningMission[];
  onQuizGenerated: (newQuiz: ConceptQuiz) => void;
  currentUser: UserProfile;
  initialMissionId?: string;
  initialImageUrl?: string;
}

export const AICriticalQuizGeneratorModal: React.FC<AICriticalQuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  missions,
  onQuizGenerated,
  currentUser,
  initialMissionId,
  initialImageUrl
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    initialMissionId || (missions.length > 0 ? missions[0].id : '')
  );
  const [customTopic, setCustomTopic] = useState('');
  const [photoUrl, setPhotoUrl] = useState(
    initialImageUrl || 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80'
  );
  const [objectHint, setObjectHint] = useState('Kemasan makanan berlabel nutrisi & komposisi');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedQuizPreview, setGeneratedQuizPreview] = useState<ConceptQuiz | null>(null);
  const [isEditingInEditor, setIsEditingInEditor] = useState(false);

  // Question configuration state (count and score per question type)
  const [qConfig, setQConfig] = useState({
    single_choice: { count: 1, score: 25 },
    multiple_choice: { count: 1, score: 25 },
    true_false: { count: 1, score: 25 },
    essay: { count: 1, score: 25 },
  });

  if (!isOpen) return null;

  const currentMission = missions.find((m) => m.id === selectedMissionId) || missions[0];

  const totalQuestionsCount =
    qConfig.single_choice.count +
    qConfig.multiple_choice.count +
    qConfig.true_false.count +
    qConfig.essay.count;

  const totalMaxScorePossible =
    qConfig.single_choice.count * qConfig.single_choice.score +
    qConfig.multiple_choice.count * qConfig.multiple_choice.score +
    qConfig.true_false.count * qConfig.true_false.score +
    qConfig.essay.count * qConfig.essay.score;

  const handleGenerate = async () => {
    if (totalQuestionsCount <= 0) {
      setErrorMsg('Minimal harus menentukan minimal 1 butir soal untuk di-generate.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        mission: currentMission
          ? {
              id: currentMission.id,
              subject: currentMission.subject,
              material: customTopic.trim() || currentMission.material,
              tp: currentMission.tp,
              indicators: currentMission.indicators,
              targetCompetency: currentMission.targetCompetency,
              grade: currentMission.grade
            }
          : {
              id: 'custom-mission',
              subject: 'IPAS',
              material: customTopic || 'Ekosistem dan Rantai Makanan',
              tp: 'Menganalisis keterkaitan antar makhluk hidup dan lingkungannya',
              indicators: ['Mengidentifikasi produsen dan konsumen', 'Menghitung transfer energi'],
              targetCompetency: 'both',
              grade: 'Kelas V'
            },
        imageBase64OrUrl: photoUrl,
        objectHint: objectHint || currentMission?.material || 'Objek pengamatan di sekitar',
        customTitle: `Uji Pemahaman Berpikir Kritis: ${customTopic || currentMission?.material || 'Pengamatan Autentik'}`,
        questionConfigs: qConfig
      };

      const customKey =
        localStorage.getItem('narasa_school_gemini_key') ||
        localStorage.getItem('school_gemini_api_key') ||
        localStorage.getItem('gemini_api_key');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey && customKey.trim() !== '') {
        headers['x-school-gemini-key'] = customKey.trim();
      }

      const response = await fetch('/api/generate-critical-thinking-quiz', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gagal menghubungi server AI (Status ${response.status})`);
      }

      const data: ConceptQuiz = await response.json();
      // Ensure text-only quiz format (no context image or question images) as requested
      data.contextImage = undefined;
      data.questions.forEach((q) => {
        q.image = undefined;
      });

      setGeneratedQuizPreview(data);
    } catch (err: any) {
      console.error('Error generating AI quiz:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat membuat soal dengan AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndUse = () => {
    if (generatedQuizPreview) {
      onQuizGenerated(generatedQuizPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Generator Soal Berpikir Kritis AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                  Pembelajaran Mendalam • HOTS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Otomatis menghasilkan 4 jenis soal (PG, PG Kompleks, Benar/Salah, Uraian) berbasis konteks citra & TP.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {!generatedQuizPreview ? (
            <div className="space-y-5">
              {/* Target Mission Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pilih Misi Pembelajaran & Tujuan Pembelajaran (TP):</span>
                </label>
                <select
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                >
                  {missions.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.subject}] {m.title} — {m.tp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mission Summary Card */}
              {currentMission && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">{currentMission.title}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 font-semibold text-[10px]">
                      {currentMission.subject} • {currentMission.grade}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Tujuan Pembelajaran (TP):</strong> {currentMission.tp}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    <strong>Target Kompetensi:</strong> {currentMission.targetCompetency === 'literacy' ? 'LITERASI' : currentMission.targetCompetency === 'numeracy' ? 'NUMERASI' : 'LITERASI & NUMERASI'}
                  </p>
                </div>
              )}

              {/* Context Image & Object Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>URL Foto / Citra Objek Nyata:</span>
                  </label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 font-mono"
                  />
                  {photoUrl && (
                    <div className="mt-2 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Objek Nyata / Konteks Teramati:</span>
                    </label>
                    <input
                      type="text"
                      value={objectHint}
                      onChange={(e) => setObjectHint(e.target.value)}
                      placeholder="Contoh: Kemasan biskuit, susunan ubin, tanaman pot, daun mangga..."
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Topik Khusus / Penekanan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Contoh: Konversi satuan berat & nilai gizi makanan"
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Question Configuration (Jumlah & Skor per Jenis Soal) */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold flex items-center gap-1.5 text-purple-900">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Atur Jumlah & Skor Soal per Jenis:
                  </span>
                  <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                    Total: {totalQuestionsCount} Soal • {totalMaxScorePossible} Poin Maksimal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Pilihan Ganda */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-blue-700 font-bold">1. Pilihan Ganda (PG)</strong>
                      <span className="text-[10px] text-slate-500">C4 Single Choice</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={qConfig.single_choice.count}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              single_choice: { ...qConfig.single_choice, count: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Skor / Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={qConfig.single_choice.score}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              single_choice: { ...qConfig.single_choice, score: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PG Kompleks */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-purple-700 font-bold">2. PG Kompleks</strong>
                      <span className="text-[10px] text-slate-500">C4 Multi Select</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={qConfig.multiple_choice.count}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              multiple_choice: { ...qConfig.multiple_choice, count: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Skor / Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={qConfig.multiple_choice.score}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              multiple_choice: { ...qConfig.multiple_choice, score: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Benar / Salah */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-700 font-bold">3. Benar / Salah</strong>
                      <span className="text-[10px] text-slate-500">C4 True / False</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={qConfig.true_false.count}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              true_false: { ...qConfig.true_false, count: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Skor / Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={qConfig.true_false.score}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              true_false: { ...qConfig.true_false, score: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Uraian */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-700 font-bold">4. Uraian</strong>
                      <span className="text-[10px] text-slate-500">C5 Evaluasi</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={qConfig.essay.count}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              essay: { ...qConfig.essay, count: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Skor / Soal</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={qConfig.essay.score}
                          onChange={(e) =>
                            setQConfig({
                              ...qConfig,
                              essay: { ...qConfig.essay, score: Math.max(0, parseInt(e.target.value) || 0) }
                            })
                          }
                          className="w-full p-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW GENERATED QUIZ */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Berhasil Membuat Paket Soal Berpikir Kritis!
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {generatedQuizPreview.questions.length} Butir Soal Berpikir Kritis • Total Skor: {generatedQuizPreview.questions.reduce((a, b) => a + (b.maxScore ?? 25), 0)} Poin
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInEditor(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit & Sesuaikan Soal AI Guru</span>
                  </button>
                  <button
                    onClick={() => setGeneratedQuizPreview(null)}
                    className="text-xs font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    Generate Ulang
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">
                      {generatedQuizPreview.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {generatedQuizPreview.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingInEditor(true)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-purple-600 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Edit judul & gambar kuis"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit Detail</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {generatedQuizPreview.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-800 flex items-center gap-2">
                          <span>Soal {idx + 1}: {q.questionType === 'multiple_choice' ? 'PG Kompleks' : q.questionType === 'true_false' ? 'Benar/Salah' : q.questionType === 'essay' ? 'Uraian' : 'Pilihan Ganda'}</span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] border border-blue-200">
                            {q.maxScore ?? 25} Poin
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Quick Toggle Image Visibility */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedQs = [...generatedQuizPreview.questions];
                              updatedQs[idx] = { ...q, showImage: q.showImage === false };
                              setGeneratedQuizPreview({ ...generatedQuizPreview, questions: updatedQs });
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              q.showImage !== false
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Klik untuk tampilkan/sembunyikan gambar pada soal ini"
                          >
                            {q.showImage !== false ? (
                              <>
                                <Eye className="w-3 h-3 text-purple-600" />
                                <span>Gambar Aktif</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-400" />
                                <span>Gambar Sembunyi</span>
                              </>
                            )}
                          </button>

                          <span className="text-purple-600 text-[11px] font-semibold">{q.criticalThinkingSkill}</span>
                        </div>
                      </div>

                      <p className="text-slate-700 text-xs line-clamp-2">{q.question}</p>

                      {/* Display small thumbnail if showImage is true */}
                      {q.showImage !== false && (q.image || generatedQuizPreview.contextImage) && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <img
                            src={q.image || generatedQuizPreview.contextImage}
                            alt="Visual Soal"
                            className="w-12 h-9 object-cover rounded-md border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] text-slate-500 truncate">
                            Visual: {q.image || generatedQuizPreview.contextImage}
                          </span>
                        </div>
                      )}

                      {q.questionType === 'essay' && (
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          * Dilengkapi rubrik penskoran manual guru (0-{q.maxScore ?? 25} poin)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quiz Editor Modal */}
        {generatedQuizPreview && isEditingInEditor && (
          <QuizEditorModal
            isOpen={isEditingInEditor}
            quiz={generatedQuizPreview}
            onClose={() => setIsEditingInEditor(false)}
            onSave={(updatedQuiz) => {
              setGeneratedQuizPreview(updatedQuiz);
              setIsEditingInEditor(false);
            }}
          />
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>

          {!generatedQuizPreview ? (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: isLoading ? '1s' : '0s' }} />
              <span>{isLoading ? 'Sedang Menganalisis & Membuat Soal...' : 'Generate Soal Berpikir Kritis'}</span>
            </button>
          ) : (
            <button
              onClick={handleSaveAndUse}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Buka Uji Pemahaman Ini</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
