import React, { useState } from 'react';
import { ConceptQuiz, QuizQuestion, QuizQuestionOption, TrueFalseStatement, TargetCompetency } from '../types';
import { toast } from './Toast';
import {
  X,
  Save,
  Trash2,
  Plus,
  Image as ImageIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  CheckSquare,
  HelpCircle,
  FileText,
  Brain,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Upload,
  AlertCircle
} from 'lucide-react';

interface QuizEditorModalProps {
  isOpen: boolean;
  quiz: ConceptQuiz;
  onClose: () => void;
  onSave: (updatedQuiz: ConceptQuiz) => void;
}

const PRESET_IMAGES = [
  { label: 'Kemasan Nutrisi', url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Grafik & Sains', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80' },
  { label: 'Eksperimen / Laboratorium', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80' },
  { label: 'Buku & Literasi', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Alam & Ekosistem', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80' }
];

export const QuizEditorModal: React.FC<QuizEditorModalProps> = ({
  isOpen,
  quiz,
  onClose,
  onSave
}) => {
  const [editedQuiz, setEditedQuiz] = useState<ConceptQuiz>({
    ...quiz,
    showContextImage: quiz.showContextImage !== false,
    questions: quiz.questions.map((q) => ({
      ...q,
      showImage: q.showImage !== false
    }))
  });

  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'metadata' | 'questions'>('questions');

  if (!isOpen) return null;

  const currentQ = editedQuiz.questions[activeQuestionIndex] || editedQuiz.questions[0];

  const handleUpdateQuizMetadata = (field: keyof ConceptQuiz, value: any) => {
    setEditedQuiz((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateQuestion = (qIndex: number, field: keyof QuizQuestion, value: any) => {
    setEditedQuiz((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex] = {
        ...newQuestions[qIndex],
        [field]: value
      };
      return {
        ...prev,
        questions: newQuestions,
        totalQuestions: newQuestions.length
      };
    });
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      questionType: 'single_choice',
      question: 'Tuliskan teks pertanyaan baru di sini...',
      stimulusText: 'Sajikan teks wacana atau skenario pengamatan di sini.',
      image: editedQuiz.contextImage || 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
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
      explanation: 'Penjelasan mengapa jawaban tersebut tepat.'
    };

    setEditedQuiz((prev) => {
      const updatedQs = [...prev.questions, newQ];
      return {
        ...prev,
        questions: updatedQs,
        totalQuestions: updatedQs.length
      };
    });
    setActiveQuestionIndex(editedQuiz.questions.length);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (editedQuiz.questions.length <= 1) {
      toast.warning('Jumlah Soal Minimal', 'Paket kuis minimal harus memiliki 1 butir soal.');
      return;
    }
    setEditedQuiz((prev) => {
      const updatedQs = prev.questions.filter((_, idx) => idx !== qIndex);
      return {
        ...prev,
        questions: updatedQs,
        totalQuestions: updatedQs.length
      };
    });
    if (activeQuestionIndex >= editedQuiz.questions.length - 1) {
      setActiveQuestionIndex(Math.max(0, editedQuiz.questions.length - 2));
    }
  };

  const handleMoveQuestion = (qIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? qIndex - 1 : qIndex + 1;
    if (targetIdx < 0 || targetIdx >= editedQuiz.questions.length) return;

    setEditedQuiz((prev) => {
      const newQs = [...prev.questions];
      const temp = newQs[qIndex];
      newQs[qIndex] = newQs[targetIdx];
      newQs[targetIdx] = temp;
      return { ...prev, questions: newQs };
    });
    setActiveQuestionIndex(targetIdx);
  };

  // Option handlers for single and multiple choice
  const handleUpdateOptionText = (qIndex: number, optId: string, text: string) => {
    const q = editedQuiz.questions[qIndex];
    if (!q.options) return;
    const updatedOpts = q.options.map((o) => (o.id === optId ? { ...o, text } : o));
    handleUpdateQuestion(qIndex, 'options', updatedOpts);
  };

  const handleAddOption = (qIndex: number) => {
    const q = editedQuiz.questions[qIndex];
    const opts = q.options || [];
    const newOpt = { id: `opt-${Date.now()}`, text: `Pilihan Jawaban ${String.fromCharCode(65 + opts.length)}` };
    handleUpdateQuestion(qIndex, 'options', [...opts, newOpt]);
  };

  const handleDeleteOption = (qIndex: number, optId: string) => {
    const q = editedQuiz.questions[qIndex];
    if (!q.options || q.options.length <= 2) {
      toast.warning('Pilihan Jawaban Terbatas', 'Pilihan ganda minimal harus memiliki 2 pilihan jawaban.');
      return;
    }
    const updatedOpts = q.options.filter((o) => o.id !== optId);
    handleUpdateQuestion(qIndex, 'options', updatedOpts);
  };

  const handleToggleMultipleChoiceCorrect = (qIndex: number, optId: string) => {
    const q = editedQuiz.questions[qIndex];
    const currentCorrectList = q.correctOptionIds || [];
    let updated: string[];
    if (currentCorrectList.includes(optId)) {
      updated = currentCorrectList.filter((id) => id !== optId);
    } else {
      updated = [...currentCorrectList, optId];
    }
    handleUpdateQuestion(qIndex, 'correctOptionIds', updated);
  };

  // Statement handlers for true_false
  const handleUpdateStatement = (qIndex: number, sIndex: number, field: 'statement' | 'correctAnswer', val: any) => {
    const q = editedQuiz.questions[qIndex];
    const statements = q.statements || [];
    const updated = statements.map((s, idx) => (idx === sIndex ? { ...s, [field]: val } : s));
    handleUpdateQuestion(qIndex, 'statements', updated);
  };

  const handleAddStatement = (qIndex: number) => {
    const q = editedQuiz.questions[qIndex];
    const statements = q.statements || [];
    const newStmt: TrueFalseStatement = {
      id: `s-${Date.now()}`,
      statement: 'Tuliskan pernyataan analisis di sini...',
      correctAnswer: true
    };
    handleUpdateQuestion(qIndex, 'statements', [...statements, newStmt]);
  };

  const handleDeleteStatement = (qIndex: number, sIndex: number) => {
    const q = editedQuiz.questions[qIndex];
    if (!q.statements || q.statements.length <= 1) {
      toast.warning('Pernyataan Minimal', 'Soal Benar/Salah minimal memiliki 1 pernyataan.');
      return;
    }
    const updated = q.statements.filter((_, idx) => idx !== sIndex);
    handleUpdateQuestion(qIndex, 'statements', updated);
  };

  const handleSaveAll = () => {
    onSave(editedQuiz);
    toast.success('Kuis Berhasil Disimpan!', `Paket kuis "${editedQuiz.title}" berhasil diperbarui.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-white flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white flex items-center gap-1">
                <Brain className="w-3 h-3" /> Editor Paket Soal
              </span>
              {quiz.isAiGenerated && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Hasil AI Generator
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              Edit & Sesuaikan Paket Soal Guru
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'questions'
                ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Butir Soal & Gambar ({editedQuiz.questions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Informasi & Sampul Paket Soal</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'metadata' && (
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-600 shrink-0" />
                <span>
                  <strong>Informasi Paket Soal:</strong> Sesuaikan judul, deskripsi, mata pelajaran, serta status penayangan gambar utama kuis.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Judul Paket Soal</label>
                  <input
                    type="text"
                    value={editedQuiz.title}
                    onChange={(e) => handleUpdateQuizMetadata('title', e.target.value)}
                    className="w-full p-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={editedQuiz.subject}
                    onChange={(e) => handleUpdateQuizMetadata('subject', e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Materi / Topik Utama</label>
                  <input
                    type="text"
                    value={editedQuiz.topic}
                    onChange={(e) => handleUpdateQuizMetadata('topic', e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Kelas & Fase</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editedQuiz.grade}
                      onChange={(e) => handleUpdateQuizMetadata('grade', e.target.value)}
                      placeholder="e.g. Kelas V"
                      className="p-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                    <input
                      type="text"
                      value={editedQuiz.phase}
                      onChange={(e) => handleUpdateQuizMetadata('phase', e.target.value)}
                      placeholder="e.g. Fase C"
                      className="p-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Durasi Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    value={editedQuiz.durationMinutes}
                    onChange={(e) => handleUpdateQuizMetadata('durationMinutes', Math.max(1, parseInt(e.target.value) || 15))}
                    className="w-full p-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Deskripsi & Petunjuk Umum</label>
                  <textarea
                    value={editedQuiz.description}
                    onChange={(e) => handleUpdateQuizMetadata('description', e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                {/* SAKELAR GAMBAR UTAMA PAKET SOAL */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Tampilkan Gambar Sampul / Utama Paket Soal
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Matikan jika Anda ingin paket soal ini murni berbasis wacana teks tanpa gambar utama.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateQuizMetadata('showContextImage', !editedQuiz.showContextImage)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        editedQuiz.showContextImage !== false
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {editedQuiz.showContextImage !== false ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ditampilkan</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Sembunyikan Gambar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editedQuiz.showContextImage !== false && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        URL Gambar Sampul Utama
                      </label>
                      <input
                        type="text"
                        value={editedQuiz.contextImage || ''}
                        onChange={(e) => handleUpdateQuizMetadata('contextImage', e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 text-xs font-mono text-slate-700 rounded-xl border border-slate-300 bg-white outline-none focus:ring-1 focus:ring-purple-500"
                      />

                      {editedQuiz.contextImage && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-36 bg-slate-900">
                          <img
                            src={editedQuiz.contextImage}
                            alt="Preview Sampul"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT SIDEBAR: LIST OF QUESTIONS */}
              <div className="lg:col-span-4 space-y-3 bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Daftar Butir Soal ({editedQuiz.questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {editedQuiz.questions.map((q, idx) => {
                    const isSelected = idx === activeQuestionIndex;
                    const qType = q.questionType || 'single_choice';

                    return (
                      <div
                        key={q.id || idx}
                        onClick={() => setActiveQuestionIndex(idx)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1 relative group ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              #{idx + 1}
                            </span>
                            <span>
                              {qType === 'single_choice' ? 'PG' : qType === 'multiple_choice' ? 'PG Kompleks' : qType === 'true_false' ? 'Benar/Salah' : 'Uraian'}
                            </span>
                          </span>

                          <div className="flex items-center gap-1">
                            {q.showImage === false && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                              }`} title="Gambar disembunyikan">
                                Tanpa Gambar
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveQuestion(idx, 'up');
                              }}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-black/10 disabled:opacity-20"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveQuestion(idx, 'down');
                              }}
                              disabled={idx === editedQuiz.questions.length - 1}
                              className="p-1 rounded hover:bg-black/10 disabled:opacity-20"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(idx);
                              }}
                              className="p-1 rounded hover:bg-rose-500 hover:text-white text-rose-500"
                              title="Hapus soal"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className={`line-clamp-2 text-[11px] leading-relaxed ${isSelected ? 'text-purple-100' : 'text-slate-600'}`}>
                          {q.question || '(Belum ada pertanyaan)'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT MAIN EDITOR AREA FOR CURRENT QUESTION */}
              {currentQ && (
                <div className="lg:col-span-8 space-y-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
                  {/* Top Q Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 font-display">
                        Mengedit Soal #{activeQuestionIndex + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {currentQ.questionType === 'multiple_choice' ? 'PG Kompleks' : currentQ.questionType === 'true_false' ? 'Benar / Salah' : currentQ.questionType === 'essay' ? 'Uraian' : 'Pilihan Ganda'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Jenis Soal:</label>
                      <select
                        value={currentQ.questionType || 'single_choice'}
                        onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'questionType', e.target.value)}
                        className="p-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 outline-none"
                      >
                        <option value="single_choice">Pilihan Ganda (Single Choice)</option>
                        <option value="multiple_choice">Pilihan Ganda Kompleks (Ceklis Multi)</option>
                        <option value="true_false">Benar / Salah (Tabel Pernyataan)</option>
                        <option value="essay">Uraian Berpikir Kritis (Koreksi Guru)</option>
                      </select>
                    </div>
                  </div>

                  {/* 1. TEKS PERTANYAAN */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Teks Pertanyaan / Soal Berpikir Kritis
                    </label>
                    <textarea
                      value={currentQ.question}
                      onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'question', e.target.value)}
                      rows={2}
                      className="w-full p-2.5 text-xs font-medium text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>

                  {/* 2. TEKS SKENARIO STIMULUS */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Skenario / Wacana Stimulus Pengamatan
                    </label>
                    <textarea
                      value={currentQ.stimulusText || currentQ.scenario || ''}
                      onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'stimulusText', e.target.value)}
                      rows={2}
                      placeholder="Masukkan konteks teks wacana..."
                      className="w-full p-2.5 text-xs text-slate-700 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>

                  {/* 3. PENGATURAN GAMBAR SOAL (IMAGE DISPLAY & CUSTOMIZATION TOGGLE) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Pengaturan Gambar / Visual Soal Ini
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Atur apakah gambar ditampilkan pada soal ini atau ganti gambar sesuai konteks.
                          </span>
                        </div>
                      </div>

                      {/* SAKELAR VISIBILITAS GAMBAR */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(activeQuestionIndex, 'showImage', currentQ.showImage === false)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          currentQ.showImage !== false
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {currentQ.showImage !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Gambar Ditampilkan</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Sembunyikan Gambar Soal</span>
                          </>
                        )}
                      </button>
                    </div>

                    {currentQ.showImage !== false && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            URL Gambar / Foto Bukti Visual Soal Ini
                          </label>
                          <input
                            type="text"
                            value={currentQ.image || ''}
                            onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'image', e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full p-2 text-xs font-mono text-slate-800 rounded-xl border border-slate-300 bg-white outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        {/* Preset Image Selection */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Pilih Gambar Preset Kontekstual:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_IMAGES.map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleUpdateQuestion(activeQuestionIndex, 'image', preset.url)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-400 text-[10px] font-bold text-slate-700 transition-all cursor-pointer shadow-2xs hover:bg-purple-50"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Image Preview Box */}
                        {currentQ.image && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200 h-36 bg-slate-900 shadow-2xs">
                            <img
                              src={currentQ.image}
                              alt="Preview Soal"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] backdrop-blur-xs font-medium">
                              Tampilan Gambar Aktif
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. EDIT OPTIONS / STATEMENTS / ESSAY RUBRIC ACCORDING TO QUESTION TYPE */}

                  {/* TYPE A: SINGLE CHOICE */}
                  {(currentQ.questionType === 'single_choice' || !currentQ.questionType) && (
                    <div className="space-y-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          Pilihan Jawaban (Pilih 1 Jawaban Benar)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(activeQuestionIndex)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold cursor-pointer hover:bg-blue-700"
                        >
                          + Tambah Opsi
                        </button>
                      </div>

                      <div className="space-y-2">
                        {currentQ.options?.map((opt, oIdx) => {
                          const isCorrect = currentQ.correctOptionId === opt.id;
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <div key={opt.id} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(activeQuestionIndex, 'correctOptionId', opt.id)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-400'
                                }`}
                                title={isCorrect ? 'Kunci Jawaban Benar' : 'Klik untuk jadikan kunci jawaban'}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleUpdateOptionText(activeQuestionIndex, opt.id, e.target.value)}
                                className={`flex-1 p-2 text-xs rounded-xl border outline-none font-medium ${
                                  isCorrect ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold' : 'border-slate-300 bg-white text-slate-800'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(activeQuestionIndex, opt.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TYPE B: MULTIPLE CHOICE (PG KOMPLEKS) */}
                  {currentQ.questionType === 'multiple_choice' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 block flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                          Pilihan Jawaban Kompleks (Centang Semua yang Benar)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(activeQuestionIndex)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-bold cursor-pointer hover:bg-purple-700"
                        >
                          + Tambah Opsi
                        </button>
                      </div>

                      <div className="space-y-2">
                        {currentQ.options?.map((opt, oIdx) => {
                          const isCorrect = (currentQ.correctOptionIds || []).includes(opt.id);

                          return (
                            <div key={opt.id} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleMultipleChoiceCorrect(activeQuestionIndex, opt.id)}
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                                  isCorrect
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                    : 'bg-white border-slate-300 text-slate-400 hover:border-purple-400'
                                }`}
                                title={isCorrect ? 'Diperhitungkan sebagai kunci jawaban benar' : 'Klik untuk jadikan kunci jawaban'}
                              >
                                {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-3 h-3 rounded-xs border border-slate-400" />}
                              </button>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleUpdateOptionText(activeQuestionIndex, opt.id, e.target.value)}
                                className={`flex-1 p-2 text-xs rounded-xl border outline-none font-medium ${
                                  isCorrect ? 'border-purple-400 bg-purple-50/50 text-purple-950 font-bold' : 'border-slate-300 bg-white text-slate-800'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(activeQuestionIndex, opt.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TYPE C: TRUE / FALSE (TABEL PERNYATAAN) */}
                  {currentQ.questionType === 'true_false' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-emerald-600" />
                          Pernyataan Analisis Konsep (Tabel Benar / Salah)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddStatement(activeQuestionIndex)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer hover:bg-emerald-700"
                        >
                          + Tambah Pernyataan
                        </button>
                      </div>

                      <div className="space-y-2">
                        {currentQ.statements?.map((stmt, sIdx) => (
                          <div key={stmt.id || sIdx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-5 shrink-0">#{sIdx + 1}</span>
                            <input
                              type="text"
                              value={stmt.statement}
                              onChange={(e) => handleUpdateStatement(activeQuestionIndex, sIdx, 'statement', e.target.value)}
                              className="flex-1 p-1.5 text-xs rounded-lg border border-slate-300 outline-none text-slate-800 font-medium"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateStatement(activeQuestionIndex, sIdx, 'correctAnswer', true)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stmt.correctAnswer
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
                                }`}
                              >
                                BENAR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatement(activeQuestionIndex, sIdx, 'correctAnswer', false)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  !stmt.correctAnswer
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-100'
                                }`}
                              >
                                SALAH
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStatement(activeQuestionIndex, sIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE D: ESSAY */}
                  {currentQ.questionType === 'essay' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                      <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        Rubrik Penilaian & Kunci Jawaban Ideal Guru (Soal Uraian)
                      </span>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Rubrik Penskoran Guru</label>
                          <textarea
                            value={currentQ.essayRubric || ''}
                            onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'essayRubric', e.target.value)}
                            rows={2}
                            placeholder="Pedoman skor 0 - 25..."
                            className="w-full p-2 text-xs text-slate-800 rounded-xl border border-slate-300 bg-white outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Contoh Jawaban Ideal / Poin Penalaran</label>
                          <textarea
                            value={currentQ.sampleAnswer || ''}
                            onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'sampleAnswer', e.target.value)}
                            rows={2}
                            placeholder="Acuan kunci penalaran ideal..."
                            className="w-full p-2 text-xs text-slate-800 rounded-xl border border-slate-300 bg-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EXPLANATION / PEMBAHASAN */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 block">
                      Teks Pembahasan & Refleksi Konsep
                    </label>
                    <textarea
                      value={currentQ.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full p-2.5 text-xs text-slate-800 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Paket Soal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
