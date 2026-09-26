import React, { useState, useMemo, useEffect } from 'react';
import { ExplorationQuestion, ScaffoldingLevels, AILearningBridgeResult, STEMStage, STEM_STAGES_CONFIG, STEMStageDefinition, StudentAnswers } from '../types';
import {
  Globe,
  Search,
  PenTool,
  Wrench,
  FlaskConical,
  BarChart2,
  RefreshCw,
  Megaphone,
  Brain,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Volume2,
  CheckCircle2,
  Layers,
  Check,
  Compass,
  AlertCircle,
  Lock,
  Unlock,
  X,
  BookOpen,
  Target,
  Info,
  ChevronRight,
  Play,
  LayoutGrid,
  Filter,
  ListOrdered,
  ZoomIn,
  Save
} from 'lucide-react';
import { PhotoZoomModal } from './PhotoZoomModal';
import { PatternPuzzleGame } from './PatternPuzzleGame';
import { StudentWritingAssistant } from './StudentWritingAssistant';
import { toast } from './Toast';

// Helper to generate natural, child-friendly, logical descriptions contextualized to the observed object
export const getStageContextualDescription = (
  stageId: STEMStage,
  detectedObject?: string,
  material?: string
): string => {
  const obj = detectedObject?.trim() || 'objek di fotomu';
  const mat = material?.trim() || 'materi pelajaran kita';

  switch (stageId) {
    case 'decomposition':
      return `Seperti membongkar balok mainan lego, yuk amati foto ${obj} ini! Kita urai dan cari tahu bagian-bagian atau benda apa saja yang menyusunnya, serta apa fungsi masing-masing bagian itu agar kita paham cara kerjanya.`;
    case 'pattern_recognition':
      return `Menjadi detektif cilik! Kita selidiki apakah ada bentuk yang berulang, susunan yang berbaris rapi, atau keteraturan waktu pada ${obj} ini yang cocok dengan konsep pelajaran ${mat}.`;
    case 'abstraction':
      return `Pakai kacamata fokus detektif! Dari semua hal yang terlihat pada ${obj}, kita pilih hal utama yang paling penting untuk dipelajari, dan kita simpan atau abaikan dulu detail hiasan atau debu kecil yang tidak berpengaruh.`;
    case 'algorithmic_thinking':
      return `Jadi kapten pembuat rencana! Kita susun urutan langkah 1, 2, 3 yang rapi dan teratur seperti petunjuk resep makanan lezat agar siapa saja bisa mencoba atau memanfaatkan ${obj} ini dari awal sampai berhasil!`;
    default:
      return `Amati foto ${obj} dan hubungkan secara logis dengan materi ${mat}.`;
  }
};

interface ChallengeStepProps {
  questions: ExplorationQuestion[];
  learningBridge: AILearningBridgeResult;
  photoUrl: string;
  studentId?: string;
  missionId?: string;
  onCompleteChallenge: (
    answers: StudentAnswers,
    scaffoldingUsed: { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]
  ) => void;
}

export const ChallengeStep: React.FC<ChallengeStepProps> = ({
  questions,
  learningBridge,
  photoUrl,
  studentId,
  missionId,
  onCompleteChallenge
}) => {
  // Storage key for student draft (scoped per student & mission with general fallback)
  const draftKey = studentId
    ? `narasa_challenge_draft_${studentId}_${missionId || 'general'}`
    : 'narasa_challenge_draft_current';

  // Helper to load saved draft from specific key
  const loadSavedDraft = () => {
    try {
      const keysToTry = studentId ? [draftKey] : ['narasa_challenge_draft_current'];
      for (const k of keysToTry) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.answers) {
            const hasText = Object.values(parsed.answers).some((val: any) => typeof val === 'string' && val.trim().length > 0);
            if (hasText || parsed.stepIndex > 0) {
              return parsed;
            }
          }
        }
      }
    } catch (e) {}
    return null;
  };

  const initialDraft = useMemo(() => loadSavedDraft(), [draftKey]);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState<boolean>(() => {
    if (initialDraft && initialDraft.answers) {
      return Object.values(initialDraft.answers).some((val: any) => typeof val === 'string' && val.trim().length > 0);
    }
    return false;
  });

  // Form states for all 4 CT steps with localStorage persistence
  const [stemAnswers, setStemAnswers] = useState<Record<string, string>>(() => {
    if (initialDraft && initialDraft.answers) {
      return {
        decomposition: initialDraft.answers.decomposition || '',
        pattern_recognition: initialDraft.answers.pattern_recognition || '',
        abstraction: initialDraft.answers.abstraction || '',
        algorithmic_thinking: initialDraft.answers.algorithmic_thinking || ''
      };
    }
    return {
      decomposition: '',
      pattern_recognition: '',
      abstraction: '',
      algorithmic_thinking: ''
    };
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    if (initialDraft && typeof initialDraft.stepIndex === 'number' && initialDraft.stepIndex >= 0 && initialDraft.stepIndex <= 3) {
      return initialDraft.stepIndex;
    }
    return 0;
  });

  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(() => {
    return initialDraft?.lastSavedAt || null;
  });

  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);
  const [isPatternPuzzleSolved, setIsPatternPuzzleSolved] = useState(false);

  // State for popup modal showing activity & instructions for a clicked stage
  const [selectedStageModal, setSelectedStageModal] = useState<{
    stage: STEMStageDefinition;
    index: number;
    question: ExplorationQuestion;
  } | null>(null);

  // Scaffolding state with localStorage restoration
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [currentScaffoldLevel, setCurrentScaffoldLevel] = useState<1 | 2 | 3 | 4>(1);
  const [scaffoldingHistory, setScaffoldingHistory] = useState<
    { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]
  >(() => {
    if (initialDraft && Array.isArray(initialDraft.scaffoldingHistory)) {
      return initialDraft.scaffoldingHistory;
    }
    return [];
  });

  // Helper to persist draft to localStorage
  const saveDraftToLocalStorage = (
    answersToSave: Record<string, string>,
    stepIdx: number,
    scaffolding: typeof scaffoldingHistory
  ) => {
    try {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const payload = JSON.stringify({
        answers: answersToSave,
        stepIndex: stepIdx,
        scaffoldingHistory: scaffolding,
        lastSavedAt: now
      });
      localStorage.setItem(draftKey, payload);
      localStorage.setItem('narasa_challenge_draft_current', payload);
      setLastAutoSavedTime(now);
      return now;
    } catch (e) {
      console.warn('Gagal menyimpan draft ke localStorage:', e);
      return null;
    }
  };

  // Auto-save draft whenever answers or step changes
  useEffect(() => {
    const hasAnyContent = Object.values(stemAnswers).some((v) => v.trim().length > 0);
    if (hasAnyContent || currentStepIndex > 0) {
      saveDraftToLocalStorage(stemAnswers, currentStepIndex, scaffoldingHistory);
    }
  }, [stemAnswers, currentStepIndex, scaffoldingHistory, draftKey]);

  // Build the complete 4 Computational Thinking questions list, merging AI questions or constructing tailored contextual questions
  const stemQuestions: ExplorationQuestion[] = useMemo(() => {
    return STEM_STAGES_CONFIG.map((stageCfg) => {
      const obj = learningBridge.detectedObject || 'objek di fotomu';
      const mat = learningBridge.material || 'materi pelajaran';

      let stageQuestion = stageCfg.guidingPrompt;
      let tag = stageCfg.title;
      let stageCriticalQuestions: string[] = stageCfg.criticalQuestions || [];

      let scaffoldingData = {
        level1: `Amati lagi foto ${obj}. Bagian apa yang paling pertama menarik perhatianmu?`,
        level2: `Bagaimana bagian tersebut berhubungan dengan materi ${mat}?`,
        level3: `Tuliskan dalam 1-2 kalimat sederhana dengan bahasamu sendiri.`,
        level4: `Bayangkan kamu sedang menceritakan rahasia foto ${obj} ini kepada teman dekatmu.`
      };

      switch (stageCfg.id) {
        case 'decomposition':
          stageQuestion = `Yuk amati foto ${obj} dengan saksama! Apa saja bagian-bagian atau benda penting yang kamu lihat menyusun ${obj} ini? Coba ceritakan apa fungsi atau peran masing-masing bagian tersebut dalam kehidupan nyata!`;
          tag = 'Membongkar Bagian Objek (Dekomposisi)';
          stageCriticalQuestions = [
            `Apa saja bagian atau elemen penyusun utama yang kamu lihat pada objek foto "${obj}" dari luar hingga ke bagian dalamnya?`,
            `Bagaimana bagian-bagian tersebut saling bekerja sama? Apa yang akan terjadi jika salah satu bagian penting rusak atau hilang?`,
            `Mengapa "${obj}" dirancang dengan susunan bagian seperti itu dalam kehidupan sehari-hari?`
          ];
          scaffoldingData = {
            level1: `Lihat foto ${obj} dari atas ke bawah: sebutkan setidaknya 2 atau 3 bagian berbeda yang tampak jelas!`,
            level2: `Apa tugas atau kegunaan dari masing-masing bagian ${obj} tersebut?`,
            level3: `Tuliskan dalam format rapi: 1) Bagian utama: ..., 2) Hubungan kerja bagian: ..., 3) Alasan rancangan: ...`,
            level4: `Seperti sepeda yang punya roda untuk melaju, rantai untuk mengayuh, dan stang untuk berbelok; ${obj} juga punya bagian dengan tugasnya masing-masing!`
          };
          break;
        case 'pattern_recognition':
          stageQuestion = `Perhatikan lebih dekat foto ${obj} ini! Adakah bentuk yang berulang, susunan garis atau benda yang teratur, jadwal berkala, atau kemiripan dengan konsep ${mat}? Ceritakan pola menarik apa yang berhasil kamu temukan!`;
          tag = 'Menemukan Keteraturan (Pengenalan Pola)';
          stageCriticalQuestions = [
            `Pola susunan, bentuk berulang, simetri, atau keteraturan apa yang paling jelas terlihat pada foto "${obj}"?`,
            `Bagaimana pola keteraturan pada "${obj}" ini membuktikan aturan atau konsep dalam materi ${mat}?`,
            `Jika "${obj}" ini diperbanyak atau digunakan di kondisi berbeda, apakah polanya akan tetap sama? Mengapa?`
          ];
          scaffoldingData = {
            level1: `Cari hal yang berulang atau memiliki bentuk serupa pada ${obj}. Apa yang kamu lihat?`,
            level2: `Apakah bentuknya memiliki pola susunan tertentu, atau kejadian yang berulang secara berkala?`,
            level3: `Tuliskan keteraturan yang kamu amati: 1) Pola yang saya temukan..., 2) Hubungan dengan materi..., 3) Prediksi jika kondisi berubah...`,
            level4: `Seperti deretan ubin lantai yang berjarak rapi atau jarum jam yang berputar teratur, ${obj} juga punya pola lho!`
          };
          break;
        case 'abstraction':
          stageQuestion = `Bayangkan kamu ingin menceritakan rahasia ${obj} ini kepada temanmu agar dia paham ${mat}! Informasi atau ciri apa yang PALING PENTING untuk dijelaskan, dan detail apa (seperti warna hiasan, bayangan, atau coretan kecil) yang bisa diabaikan dulu?`;
          tag = 'Memilih Hal yang Paling Penting (Abstraksi)';
          stageCriticalQuestions = [
            `Informasi atau ciri kunci apa yang PALING PENTING agar temanmu langsung paham cara kerja "${obj}" dan konsep ${mat}?`,
            `Detail atau hiasan apa (seperti warna cat latar, bayangan, atau goresan debu) yang BISA DIABAIKAN dulu karena tidak mempengaruhi fungsi utamanya?`,
            `Prinsip atau kesimpulan penting apa dari "${obj}" ini yang bisa kamu terapkan ke benda atau masalah lain?`
          ];
          scaffoldingData = {
            level1: `Jika kamu membuat sketsa cepat dari ${obj}, bagian mana yang WAJIB digambar agar orang langsung mengenalinya?`,
            level2: `Informasi apa yang paling berguna untuk materi ${mat}? Jadikan itu sebagai hal terpenting.`,
            level3: `Tuliskan dalam 3 poin: 1) Ciri paling penting (wajib), 2) Detail yang diabaikan dulu, 3) Pelajaran umum.`,
            level4: `Seperti denah peta sekolah: hanya menampilkan ruang kelas dan jalan utama, bukan setiap rumput di halaman!`
          };
          break;
        case 'algorithmic_thinking':
          stageQuestion = `Sekarang giliranmu menyusun jurus langkah! Buatlah urutan langkah-langkah yang rapi dan teratur (Langkah 1, Langkah 2, Langkah 3...) yang bisa kamu atau temanmu ikuti untuk menyelesaikan tantangan atau memahami cara kerja ${obj} ini dari awal sampai berhasil!`;
          tag = 'Menyusun Langkah 1, 2, 3 (Algoritma)';
          stageCriticalQuestions = [
            `Bagaimana urutan instruksi langkah demi langkah (Langkah 1, Langkah 2, Langkah 3...) yang paling runtut dan logis untuk memanfaatkan atau membuktikan cara kerja "${obj}"?`,
            `Langkah mana yang paling krusial dan butuh kehati-hatian ekstra agar rencana aksimu tidak gagal?`,
            `Bagaimana caramu membuktikan kepada teman sekelas bahwa urutan langkah yang kamu buat adalah cara yang paling praktis dan efektif?`
          ];
          scaffoldingData = {
            level1: `Tentukan hal pertama yang harus dilakukan: "Langkah 1: Mulai dengan..."`,
            level2: `Lalu apa langkah berikutnya? Urutkan tindakan secara logis sampai selesai.`,
            level3: `Tuliskan urutannya: 1) Langkah 1, 2, 3..., 2) Titik rawan kesalahan, 3) Cara pembuktian efektivitas.`,
            level4: `Seperti resep memasak telur dadar: pecahkan telur -> kocok dengan bumbu -> tuang ke wajan panas!`
          };
          break;
      }

      // Check if provided questions already have an item matching this stage
      const existing = questions.find((q) => q.stage === stageCfg.id);

      if (existing) {
        const isPlaceholderOrGeneric =
          !existing.question ||
          existing.question.toLowerCase().includes('pertanyaan ramah anak') ||
          existing.question.trim().length < 20;

        return {
          ...existing,
          stage: stageCfg.id,
          title: existing.title || stageCfg.title,
          question: isPlaceholderOrGeneric ? stageQuestion : existing.question,
          criticalQuestions: (existing.criticalQuestions && existing.criticalQuestions.length > 0) ? existing.criticalQuestions : stageCriticalQuestions,
          conceptTag: existing.conceptTag || tag,
          scaffolding: existing.scaffolding || scaffoldingData
        };
      }

      return {
        id: `q-stem-${stageCfg.id}`,
        stage: stageCfg.id,
        title: stageCfg.title,
        question: stageQuestion,
        criticalQuestions: stageCriticalQuestions,
        inputType: 'text',
        conceptTag: tag,
        scaffolding: scaffoldingData
      };
    });
  }, [questions, learningBridge]);

  const activeQuestion = stemQuestions[currentStepIndex] || stemQuestions[0];
  const activeStageConfig = STEM_STAGES_CONFIG[currentStepIndex] || STEM_STAGES_CONFIG[0];

  const getStageIcon = (stageId: STEMStage, className = 'w-4 h-4') => {
    switch (stageId) {
      case 'decomposition':
        return <Layers className={className} />;
      case 'pattern_recognition':
        return <LayoutGrid className={className} />;
      case 'abstraction':
        return <Filter className={className} />;
      case 'algorithmic_thinking':
        return <ListOrdered className={className} />;
      default:
        return <Brain className={className} />;
    }
  };

  const getStageColorTheme = (idx: number) => {
    const themes = [
      {
        gradient: 'from-blue-500 to-cyan-500',
        cardBg: 'bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/60',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-900',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        iconBg: 'bg-blue-500 text-white',
        ringColor: 'ring-blue-400',
        accentText: 'text-blue-600'
      },
      {
        gradient: 'from-indigo-500 to-blue-600',
        cardBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/60',
        borderColor: 'border-indigo-300',
        textColor: 'text-indigo-900',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        iconBg: 'bg-indigo-500 text-white',
        ringColor: 'ring-indigo-400',
        accentText: 'text-indigo-600'
      },
      {
        gradient: 'from-purple-500 to-indigo-600',
        cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/60',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-900',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'bg-purple-500 text-white',
        ringColor: 'ring-purple-400',
        accentText: 'text-purple-600'
      },
      {
        gradient: 'from-pink-500 to-rose-600',
        cardBg: 'bg-gradient-to-br from-pink-50/90 via-white to-rose-50/60',
        borderColor: 'border-pink-300',
        textColor: 'text-pink-900',
        badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
        iconBg: 'bg-pink-500 text-white',
        ringColor: 'ring-pink-400',
        accentText: 'text-pink-600'
      },
      {
        gradient: 'from-amber-500 to-orange-500',
        cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-900',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-500 text-white',
        ringColor: 'ring-amber-400',
        accentText: 'text-amber-600'
      },
      {
        gradient: 'from-emerald-500 to-teal-600',
        cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-900',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-500 text-white',
        ringColor: 'ring-emerald-400',
        accentText: 'text-emerald-600'
      },
      {
        gradient: 'from-teal-500 to-cyan-600',
        cardBg: 'bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/60',
        borderColor: 'border-teal-300',
        textColor: 'text-teal-900',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
        iconBg: 'bg-teal-500 text-white',
        ringColor: 'ring-teal-400',
        accentText: 'text-teal-600'
      },
      {
        gradient: 'from-violet-500 to-purple-600',
        cardBg: 'bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/60',
        borderColor: 'border-violet-300',
        textColor: 'text-violet-900',
        badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
        iconBg: 'bg-violet-500 text-white',
        ringColor: 'ring-violet-400',
        accentText: 'text-violet-600'
      }
    ];
    return themes[idx % themes.length];
  };

  const handleNextLevelScaffold = () => {
    if (currentScaffoldLevel < 4) {
      const nextLvl = (currentScaffoldLevel + 1) as 1 | 2 | 3 | 4;
      setCurrentScaffoldLevel(nextLvl);
      recordScaffold(nextLvl);
    }
  };

  const handleOpenScaffolding = () => {
    setShowScaffolding(true);
    if (!scaffoldingHistory.some((h) => h.questionId === activeQuestion.id && h.level === currentScaffoldLevel)) {
      recordScaffold(currentScaffoldLevel);
    }
  };

  const recordScaffold = (level: 1 | 2 | 3 | 4) => {
    const hint = getHintText(activeQuestion?.scaffolding, level);
    setScaffoldingHistory((prev) => [
      ...prev,
      {
        questionId: activeQuestion.id,
        level,
        hintText: hint,
        requestedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const getHintText = (scaffolding: ScaffoldingLevels | undefined, level: number): string => {
    if (!scaffolding) return 'Perhatikan kembali detail objek di foto dan konsep materi.';
    switch (level) {
      case 1:
        return scaffolding.level1;
      case 2:
        return scaffolding.level2;
      case 3:
        return scaffolding.level3;
      case 4:
        return scaffolding.level4;
      default:
        return scaffolding.level1;
    }
  };

  const handleReadAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentAnswerValue = stemAnswers[activeStageConfig.id] || '';

  const handleUpdateCurrentAnswer = (val: string) => {
    setStemAnswers((prev) => {
      const updated = {
        ...prev,
        [activeStageConfig.id]: val
      };
      saveDraftToLocalStorage(updated, currentStepIndex, scaffoldingHistory);
      return updated;
    });
  };

  const handleManualSaveDraft = () => {
    const savedTime = saveDraftToLocalStorage(stemAnswers, currentStepIndex, scaffoldingHistory);
    if (savedTime) {
      toast.success(
        'Draf Isian Tersimpan!',
        `Jawabanmu tersimpan di Local Storage (${savedTime}). Kamu bisa keluar aplikasi kapan saja tanpa khawatir jawabanmu hilang.`
      );
    } else {
      toast.error('Pemberitahuan', 'Penyimpanan lokal perangkat tidak dapat diakses.');
    }
  };

  const getStageLockStatus = (idx: number) => {
    const isCompleted = (stemAnswers[STEM_STAGES_CONFIG[idx].id] || '').trim().length >= 3;
    if (idx === 0) {
      return { isLocked: false, isCompleted };
    }
    // Previous stages must all be filled
    let isPreviousFilled = true;
    for (let i = 0; i < idx; i++) {
      const ans = (stemAnswers[STEM_STAGES_CONFIG[i].id] || '').trim();
      if (ans.length < 3) {
        isPreviousFilled = false;
        break;
      }
    }
    return {
      isLocked: !isPreviousFilled,
      isCompleted
    };
  };

  const [lockWarning, setLockWarning] = useState<string | null>(null);

  const handleGoToStep = (idx: number) => {
    const status = getStageLockStatus(idx);
    if (status.isLocked) {
      setLockWarning(`Selesaikan Tahap ${idx} (${STEM_STAGES_CONFIG[idx - 1].title}) terlebih dahulu untuk membuka gembok tahap ini! 🔓`);
      setTimeout(() => {
        setLockWarning((prev) => (prev?.includes(STEM_STAGES_CONFIG[idx - 1].title) ? null : prev));
      }, 4000);
      return;
    }
    setLockWarning(null);
    if (idx >= 0 && idx < stemQuestions.length) {
      setCurrentStepIndex(idx);
      setShowScaffolding(false);
      setCurrentScaffoldLevel(1);
    }
  };

  const handleOpenStagePopup = (stage: STEMStageDefinition, idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedStageModal({
      stage,
      index: idx,
      question: stemQuestions[idx] || stemQuestions[0]
    });
  };

  const handleAdvance = () => {
    // If on pattern_recognition and puzzle not solved yet:
    if (activeStageConfig.id === 'pattern_recognition' && !isPatternPuzzleSolved) {
      setLockWarning('Selesaikan atau susun puzzle foto di atas terlebih dahulu ya! 🧩');
      setTimeout(() => setLockWarning(null), 4000);
      return;
    }

    if (currentStepIndex < stemQuestions.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setShowScaffolding(false);
      setCurrentScaffoldLevel(1);
    } else {
      // Completed all 4 CT questions -> submit structured response
      const dec = stemAnswers.decomposition.trim() || 'Memecah masalah besar.';
      const pat = stemAnswers.pattern_recognition.trim() || 'Mengenali pola berulang.';
      const abs = stemAnswers.abstraction.trim() || 'Menyaring informasi penting.';
      const alg = stemAnswers.algorithmic_thinking.trim() || 'Membuat langkah sistematis.';

      const formattedAnswers: StudentAnswers = {
        // 4 CT stages
        decomposition: dec,
        patternRecognition: pat,
        abstraction: abs,
        algorithmicThinking: alg,
        // Compatibility fields
        challengeAnswer: `${dec} | Pola: ${pat}`,
        reason: `${abs} | Langkah: ${alg}`,
        evidence: `${dec}`,
        strategy: `${alg}`,
        conclusion: `${alg}`
      };

      onCompleteChallenge(formattedAnswers, scaffoldingHistory);
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}
    }
  };

  const handleResetDraft = () => {
    if (window.confirm('Apakah kamu ingin mengosongkan draf jawaban dan memulai kembali dari awal?')) {
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}
      setStemAnswers({
        decomposition: '',
        pattern_recognition: '',
        abstraction: '',
        algorithmic_thinking: ''
      });
      setCurrentStepIndex(0);
      setScaffoldingHistory([]);
      setLastAutoSavedTime(null);
    }
  };

  const currentHint = getHintText(activeQuestion?.scaffolding, currentScaffoldLevel);
  const isCurrentStepFilled = currentAnswerValue.trim().length >= 3;
  const answeredCount = Object.values(stemAnswers).filter((v) => v.trim().length >= 3).length;
  const hasDraftContent = Object.values(stemAnswers).some((v) => v.trim().length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 text-left">
      {/* 4-Step Computational Thinking Workflow Stepper Bar with interactive cards and connecting arrows */}
      <div className="bg-gradient-to-b from-white to-blue-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-indigo-200/90 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shadow-indigo-500/30 shrink-0">
              {currentStepIndex + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-indigo-200 shadow-2xs">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  4 Langkah Berpikir Komputasional 🚀
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Langkah {currentStepIndex + 1} dari {stemQuestions.length}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-[#1E293B] font-display flex items-center gap-1.5 truncate mt-0.5">
                {getStageIcon(activeStageConfig.id, 'w-5 h-5 text-indigo-600 shrink-0')}
                <span className="truncate">{activeStageConfig.title}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {/* Auto-saved badge */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Draf Tersimpan di Perangkat {lastAutoSavedTime ? `(${lastAutoSavedTime})` : ''}</span>
            </div>

            <span className="text-[11px] sm:text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{answeredCount}/{stemQuestions.length} Selesai ✨</span>
            </span>

            {hasDraftContent && (
              <button
                type="button"
                onClick={handleResetDraft}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-2 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                title="Hapus draf jawaban ini dan mulai dari awal"
              >
                Hapus Draf
              </button>
            )}
          </div>
        </div>

        {/* Restored from local draft notification */}
        {isRestoredFromDraft && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold animate-tab-fade shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Draf isian jawabanmu berhasil dimuat otomatis dari penyimpanan lokal (Local Storage)! Kamu dapat melanjutkan pengisian.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRestoredFromDraft(false)}
              className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
              title="Tutup pesan"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lock Warning Toast Notification if any */}
        {lockWarning && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-tab-fade shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="leading-snug">{lockWarning}</span>
          </div>
        )}

        {/* Info banner explaining click to view popup */}
        <div className="bg-blue-50/80 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center justify-between text-[11px] text-blue-900 font-semibold">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Klik kartu langkah untuk melihat <strong>Petunjuk & Panduan Objek</strong> lebih lengkap!</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-blue-700 border border-blue-200 hidden sm:inline">
            Interactive Flow
          </span>
        </div>

        {/* STEM Steps Cards with Visual Connecting Arrows */}
        <div className="overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
          <div className="flex items-center gap-2 min-w-max px-1">
            {STEM_STAGES_CONFIG.map((stage, idx) => {
              const status = getStageLockStatus(idx);
              const isCurrent = idx === currentStepIndex;
              const theme = getStageColorTheme(idx);
              const isLast = idx === STEM_STAGES_CONFIG.length - 1;

              return (
                <React.Fragment key={stage.id}>
                  {/* STEM Stage Card */}
                  <div
                    onClick={() => {
                      if (!status.isLocked) {
                        handleGoToStep(idx);
                      }
                      handleOpenStagePopup(stage, idx);
                    }}
                    className={`relative w-44 sm:w-48 p-3 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer group select-none shadow-2xs hover:shadow-md ${
                      isCurrent
                        ? `border-blue-500 bg-white ring-4 ring-blue-300/60 transform -translate-y-1 shadow-lg`
                        : status.isCompleted
                        ? `border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 hover:border-emerald-400 hover:-translate-y-0.5`
                        : !status.isLocked
                        ? `${theme.borderColor} ${theme.cardBg} hover:-translate-y-0.5`
                        : 'border-slate-200 bg-slate-100 text-slate-400 opacity-65'
                    }`}
                  >
                    {/* Top Row: Stage Step Badge & Lock/Unlock Icon */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-lg border shadow-2xs ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-700'
                            : status.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : !status.isLocked
                            ? theme.badgeBg
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        Langkah {idx + 1}
                      </span>

                      {/* Status icon */}
                      <div>
                        {status.isCompleted ? (
                          <div className="p-1 rounded-full bg-emerald-200 text-emerald-800 shadow-2xs" title="Selesai">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="p-1 rounded-full bg-blue-500 text-white animate-pulse shadow-xs" title="Tahap Aktif">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        ) : !status.isLocked ? (
                          <div className="p-1 rounded-full bg-blue-100 text-blue-600" title="Terbuka">
                            <Unlock className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-slate-200 text-slate-500" title="Terkunci">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Icon & Title */}
                    <div className="my-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : status.isCompleted
                              ? 'bg-emerald-600 text-white'
                              : !status.isLocked
                              ? theme.iconBg
                              : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          {getStageIcon(stage.id, 'w-4 h-4')}
                        </div>
                        <h4
                          className={`text-xs font-black truncate leading-tight ${
                            isCurrent
                              ? 'text-blue-950'
                              : status.isCompleted
                              ? 'text-emerald-950'
                              : !status.isLocked
                              ? theme.textColor
                              : 'text-slate-600'
                          }`}
                          title={stage.title}
                        >
                          {stage.title}
                        </h4>
                      </div>

                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                        {getStageContextualDescription(stage.id, learningBridge.detectedObject, learningBridge.material)}
                      </p>
                    </div>

                    {/* Bottom Action: Hint Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenStagePopup(stage, idx, e)}
                        className={`font-black flex items-center gap-1 hover:underline cursor-pointer ${
                          isCurrent ? 'text-blue-600' : status.isCompleted ? 'text-emerald-700' : 'text-indigo-600'
                        }`}
                      >
                        <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Petunjuk & Panduan</span>
                      </button>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Directional Connecting Arrow (except after last step) */}
                  {!isLast && (
                    <div className="flex items-center justify-center shrink-0 px-0.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          status.isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-2xs'
                            : isCurrent
                            ? 'bg-blue-100 text-blue-700 border border-blue-300 animate-pulse shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                        title={`Lanjut ke Langkah ${idx + 2}`}
                      >
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Detail Kegiatan & Petunjuk Tahap Berpikir Komputasional */}
      {selectedStageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-[90vh] flex flex-col text-left">
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 bg-gradient-to-r ${getStageColorTheme(selectedStageModal.index).gradient} text-white flex items-center justify-between gap-3 shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-xs shrink-0">
                  {getStageIcon(selectedStageModal.stage.id, 'w-6 h-6')}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white inline-block">
                    Langkah {selectedStageModal.index + 1} dari {stemQuestions.length} Berpikir Komputasional
                  </span>
                  <h3 className="text-lg sm:text-xl font-black font-display text-white mt-0.5">
                    {selectedStageModal.stage.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStageModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Instructions, Guiding Questions, and Concrete Examples */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800">
              {/* 1. Deskripsi & Tujuan Kegiatan Kontekstual */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-950 font-black">
                  <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>🎯 Misi Penyelidikan di Langkah Ini:</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {getStageContextualDescription(selectedStageModal.stage.id, learningBridge.detectedObject, learningBridge.material)}
                </p>
              </div>

              {/* 2. Hubungan dengan Objek Foto yang Diamati */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div
                  onClick={() => setIsPhotoZoomOpen(true)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-slate-300 hover:border-blue-500 shrink-0 shadow-2xs transition-all w-16 h-16 bg-slate-900"
                  title="Klik untuk memperbesar foto objek"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setIsPhotoZoomOpen(true);
                    }
                  }}
                >
                  <img
                    src={photoUrl}
                    alt="Objek foto"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-5 h-5 drop-shadow" />
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 bg-blue-600/90 text-white p-0.5 rounded text-[8px] flex items-center shadow-xs">
                    <ZoomIn className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-blue-700 block">Konteks Nyata Objek Foto:</span>
                    <button
                      type="button"
                      onClick={() => setIsPhotoZoomOpen(true)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>Zoom Foto</span>
                    </button>
                  </div>
                  <h5 className="font-extrabold text-[#1E293B] truncate">{learningBridge.detectedObject}</h5>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    Materi: <strong>{learningBridge.material}</strong> ({learningBridge.subject})
                  </p>
                </div>
              </div>

              {/* 3. Pertanyaan Pemantik & Instruksi Murid */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-950 font-black">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>❓ Pertanyaan Pemantik untuk Kamu:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReadAloud(selectedStageModal.question.question)}
                    className="p-1 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Dengarkan</span>
                  </button>
                </div>
                <p className="text-slate-800 font-bold leading-relaxed bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                  “{selectedStageModal.question.question}”
                </p>
                <div className="text-[11px] text-amber-800 flex items-center gap-1 pt-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{selectedStageModal.stage.microcopy}</span>
                </div>
              </div>

              {/* 4. Petunjuk Berpikir & Scaffolding Level */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 space-y-2">
                <div className="flex items-center gap-1.5 text-purple-950 font-black">
                  <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>💡 Petunjuk / Tips Mengerjakan:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-purple-900 font-medium">
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{selectedStageModal.question.scaffolding?.level1 || 'Fokus pada fakta nyata objek di foto.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{selectedStageModal.question.scaffolding?.level2 || 'Gunakan konsep pelajaran terkait.'}</span>
                  </li>
                </ul>
              </div>

              {/* 5. Jawaban Murid Saat Ini (jika sudah ada) */}
              {stemAnswers[selectedStageModal.stage.id]?.trim() ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Jawabanmu yang Tersimpan:
                  </span>
                  <p className="text-xs text-slate-800 italic bg-white p-2.5 rounded-xl border border-emerald-100">
                    “{stemAnswers[selectedStageModal.stage.id]}”
                  </p>
                </div>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStageModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 text-xs transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetIdx = selectedStageModal.index;
                  const status = getStageLockStatus(targetIdx);
                  if (status.isLocked) {
                    setLockWarning(`Tahap ini masih terkunci. Selesaikan tahap sebelumnya terlebih dahulu!`);
                  } else {
                    handleGoToStep(targetIdx);
                  }
                  setSelectedStageModal(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  getStageLockStatus(selectedStageModal.index).isLocked
                    ? 'bg-slate-400 opacity-80 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-blue-500/25'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {getStageLockStatus(selectedStageModal.index).isLocked
                    ? '🔒 Tahap Masih Terkunci'
                    : selectedStageModal.index === currentStepIndex
                    ? 'Sedang Dikerjakan di Bawah ⬇️'
                    : `Kerjakan Langkah ${selectedStageModal.index + 1} Sekarang 🚀`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main STEM Question Card with Photo Context */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border-2 border-slate-200 shadow-md space-y-5 sm:space-y-6">
        {/* Context Photo Strip with Click-to-Zoom */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border-2 border-blue-100">
          <div
            onClick={() => setIsPhotoZoomOpen(true)}
            className="group relative cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all shrink-0 w-full sm:w-28 h-36 sm:h-24 bg-slate-900"
            title="Klik untuk memperbesar foto objek agar dapat diamati dengan jelas"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsPhotoZoomOpen(true);
              }
            }}
          >
            <img
              src={photoUrl}
              alt="Objek kontekstual"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-1 text-center">
              <ZoomIn className="w-6 h-6 text-white drop-shadow-md animate-pulse" />
              <span className="text-[10px] font-black bg-blue-600/90 px-2 py-0.5 rounded-full shadow-xs">
                Klik untuk Zoom 🔍
              </span>
            </div>
            {/* Corner permanent badge so kids immediately see it's clickable */}
            <div className="absolute bottom-1.5 right-1.5 bg-blue-600/95 hover:bg-blue-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-white/20 backdrop-blur-xs">
              <ZoomIn className="w-3 h-3" />
              <span>Zoom Foto</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 leading-snug flex-1 w-full">
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-[#1E293B] text-sm sm:text-base">
                  📸 Objek Foto: {learningBridge.detectedObject}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900 border border-blue-300">
                  {learningBridge.material}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoZoomOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 text-[11px] font-extrabold inline-flex items-center gap-1.5 transition shadow-2xs hover:shadow-xs cursor-pointer ml-auto"
                title="Perbesar foto objek agar dapat diamati secara detail"
              >
                <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                <span>🔍 Amati Foto Jelas</span>
              </button>
            </div>
            <p className="text-slate-600 text-xs font-medium">
              {learningBridge.learningBridge}
            </p>
          </div>
        </div>

        {/* If on Pattern Recognition stage (Langkah 2: Pengenalan Pola), render Picture Puzzle Game */}
        {activeStageConfig.id === 'pattern_recognition' && (
          <PatternPuzzleGame
            photoUrl={photoUrl}
            objectName={learningBridge.detectedObject || 'Objek Pengamatan'}
            isSolved={isPatternPuzzleSolved}
            onSolve={() => setIsPatternPuzzleSolved(true)}
            onUnlockAnyway={() => setIsPatternPuzzleSolved(true)}
          />
        )}

        {/* Question & Answer Area: Locked on Pattern Recognition until puzzle is solved, otherwise open */}
        {activeStageConfig.id === 'pattern_recognition' && !isPatternPuzzleSolved ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-dashed border-amber-300 text-center space-y-2.5 shadow-2xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
              <Lock className="w-3.5 h-3.5" />
              <span>Pertanyaan Pola Terkunci Sementara</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 font-bold max-w-md mx-auto leading-relaxed">
              Ayo selesaikan susunan puzzle di atas dulu ya! Begitu kamu berhasil menyusun polanya dengan benar, pertanyaan eksplorasi dan kolom jawaban pola akan langsung terbuka! 🚀
            </p>
            <button
              type="button"
              onClick={() => setIsPatternPuzzleSolved(true)}
              className="text-xs text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <Unlock className="w-3 h-3" />
              <span>Buka pertanyaan sekarang tanpa menyelesaikan puzzle</span>
            </button>
          </div>
        ) : (
          <>
            {activeStageConfig.id === 'pattern_recognition' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  🔓 <strong>Puzzle Selesai!</strong> Sekarang lanjutkan dengan menjawab pertanyaan pola berikut berdasarkan pecahan gambar yang baru saja kamu amati:
                </span>
              </div>
            )}

            {/* Question Text Box with Stage Explainer */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50/60 to-blue-50/70 p-4 sm:p-6 rounded-2xl border-2 border-indigo-200 space-y-3.5 relative shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-200/90 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-300">
                  {getStageIcon(activeStageConfig.id, 'w-3.5 h-3.5')}
                  {activeStageConfig.badge}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenStagePopup(activeStageConfig, currentStepIndex)}
                    className="p-1.5 sm:p-2 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300 transition-colors shrink-0 flex items-center gap-1 text-xs font-black min-h-[36px] shadow-2xs cursor-pointer"
                    title="Buka Popup Petunjuk"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline">Lihat Panduan</span>
                  </button>
                  <button
                    onClick={() => handleReadAloud(activeQuestion.question)}
                    className="p-1.5 sm:p-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 flex items-center gap-1 text-xs font-bold min-h-[36px] shadow-2xs cursor-pointer"
                    title="Dengarkan Soal"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">Dengarkan</span>
                  </button>
                </div>
              </div>

              {/* Child-friendly Contextual Mission Box */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/90 border border-indigo-200 flex items-start gap-2.5 shadow-2xs text-xs sm:text-sm">
                <span className="text-lg shrink-0 mt-0.5">🎯</span>
                <div className="space-y-0.5">
                  <span className="font-extrabold text-indigo-950 block text-[11px] uppercase tracking-wide">
                    Misi Penyelidikan di Langkah Ini:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {getStageContextualDescription(activeStageConfig.id, learningBridge.detectedObject, learningBridge.material)}
                  </p>
                </div>
              </div>

              {/* Main Question Box & 2-3 Critical Thinking Spark Questions */}
              <div className="p-3.5 sm:p-5 rounded-xl bg-white border-2 border-indigo-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                  <span className="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span>Pertanyaan Pemantik Berpikir Kritis:</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                    {(activeQuestion.criticalQuestions?.length || 3)} Pertanyaan Analisis
                  </span>
                </div>

                {/* Subtext guiding child */}
                <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                  {activeQuestion.question}
                </p>

                {/* 2-3 Critical Thinking Questions List */}
                <div className="space-y-2.5 pt-1">
                  {(activeQuestion.criticalQuestions || [
                    activeQuestion.question
                  ]).map((cq, cqIdx) => {
                    const numberIcons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
                    const focusTitles = [
                      activeStageConfig.id === 'decomposition' ? 'Analisis Bagian' :
                      activeStageConfig.id === 'pattern_recognition' ? 'Pola & Keteraturan' :
                      activeStageConfig.id === 'abstraction' ? 'Fokus Utama' : 'Urutan Langkah',
                      activeStageConfig.id === 'decomposition' ? 'Hubungan Kerja' :
                      activeStageConfig.id === 'pattern_recognition' ? 'Bukti Materi' :
                      activeStageConfig.id === 'abstraction' ? 'Detail yang Disimpan' : 'Pencegahan Kesalahan',
                      activeStageConfig.id === 'decomposition' ? 'Alasan Rancangan' :
                      activeStageConfig.id === 'pattern_recognition' ? 'Prediksi Logis' :
                      activeStageConfig.id === 'abstraction' ? 'Pelajaran Umum' : 'Uji Efektivitas'
                    ];

                    return (
                      <div
                        key={cqIdx}
                        className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/40 border-2 border-indigo-100 hover:border-indigo-300 transition-all shadow-2xs flex items-start justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-base sm:text-lg shrink-0 mt-0.5 select-none">
                            {numberIcons[cqIdx] || `${cqIdx + 1}.`}
                          </span>
                          <div className="space-y-1 min-w-0">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-md border border-indigo-200">
                              {focusTitles[cqIdx] || `Poin Pertanyaan ${cqIdx + 1}`}
                            </span>
                            <p className="text-xs sm:text-sm font-extrabold text-[#1E293B] leading-relaxed">
                              {cq}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleReadAloud(cq)}
                          className="p-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shrink-0 transition-colors shadow-2xs cursor-pointer"
                          title="Dengarkan pertanyaan ini"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1 border-t border-indigo-200/70 flex items-center justify-between gap-2 text-xs text-indigo-900 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="leading-snug">{activeStageConfig.microcopy}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const template = `1) Jawaban Pertanyaan 1:\n...\n\n2) Jawaban Pertanyaan 2:\n...\n\n3) Jawaban Pertanyaan 3:\n...`;
                    if (!currentAnswerValue.trim()) {
                      handleUpdateCurrentAnswer(template);
                    } else if (!currentAnswerValue.includes('1)')) {
                      handleUpdateCurrentAnswer(`${currentAnswerValue}\n\n${template}`);
                    }
                  }}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/80 hover:bg-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-300 transition cursor-pointer shrink-0"
                  title="Salin template nomor ke kotak jawaban"
                >
                  📝 Isi Format 1-2-3
                </button>
              </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-blue-600" />
                  Tanggapan & Hasil Pemikiranmu:
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {currentAnswerValue.length} karakter
                </span>
              </label>
              <textarea
                rows={4}
                value={currentAnswerValue}
                onChange={(e) => handleUpdateCurrentAnswer(e.target.value)}
                placeholder={activeStageConfig.placeholder}
                className="w-full p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 focus:border-[#4F8EF7] focus:ring-4 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all resize-none shadow-xs font-medium placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 leading-normal"
              />

              {/* AI Writing Assistant for Natural Polish without changing meaning */}
              <StudentWritingAssistant
                currentAnswer={currentAnswerValue}
                stageId={activeStageConfig.id}
                stageTitle={activeStageConfig.title}
                question={activeQuestion.question}
                objectName={learningBridge.detectedObject}
                material={learningBridge.material}
                onApplyRefinedAnswer={(refinedText) => handleUpdateCurrentAnswer(refinedText)}
              />
            </div>

            {/* Scaffolding Assistant Card (Adaptive 4-level tutoring) */}
            {!showScaffolding ? (
              <button
                type="button"
                onClick={handleOpenScaffolding}
                className="w-full py-3 px-3 sm:px-4 rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 hover:border-purple-400 text-purple-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-2xs hover:shadow-xs"
              >
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
                <span className="leading-tight text-center">Butuh Bantuan? Buka Petunjuk Tutor Adaptif ✨</span>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-purple-50 via-pink-50/50 to-indigo-50 border-2 border-purple-200 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                      L{currentScaffoldLevel}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-purple-950 leading-snug">
                        Bantuan Adaptif Level {currentScaffoldLevel}:{' '}
                        {currentScaffoldLevel === 1 && 'Petunjuk Awal 💡'}
                        {currentScaffoldLevel === 2 && 'Pertanyaan Penuntun 🔍'}
                        {currentScaffoldLevel === 3 && 'Langkah Kecil 🪜'}
                        {currentScaffoldLevel === 4 && 'Contoh Analog Sederhana 🌟'}
                      </h4>
                      <p className="text-[10px] text-purple-700 font-medium">
                        Petunjuk berpikir mandiri tanpa memberi contekan langsung
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReadAloud(currentHint)}
                    className="p-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 shrink-0 cursor-pointer shadow-2xs"
                    title="Dengarkan Petunjuk"
                  >
                    <Volume2 className="w-4 h-4 text-purple-600" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 bg-white p-3.5 sm:p-4 rounded-xl border-2 border-purple-100 leading-relaxed font-semibold shadow-2xs">
                  “{currentHint}”
                </p>

                {currentScaffoldLevel < 4 && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleNextLevelScaffold}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <span>Naikkan ke Level {currentScaffoldLevel + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => handleGoToStep(currentStepIndex - 1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tahap Sebelumnya</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleManualSaveDraft}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-extrabold text-emerald-900 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer min-h-[46px] shadow-2xs"
              title="Simpan draf jawaban saat ini ke penyimpanan lokal perangkat (Local Storage)"
            >
              <Save className="w-4 h-4 text-emerald-600" />
              <span>Simpan Draf ke Perangkat</span>
            </button>

            <button
              type="button"
              onClick={handleAdvance}
              className="w-full sm:w-auto py-3 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98 cursor-pointer min-h-[48px]"
            >
              <span className="truncate">
                {currentStepIndex < stemQuestions.length - 1
                  ? `Lanjut Langkah ${currentStepIndex + 2}: ${STEM_STAGES_CONFIG[currentStepIndex + 1]?.title}`
                  : 'Selesai 4 Langkah & Lanjut Refleksi 🎉'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Photo Zoom Lightbox Modal */}
      <PhotoZoomModal
        isOpen={isPhotoZoomOpen}
        onClose={() => setIsPhotoZoomOpen(false)}
        photoUrl={photoUrl}
        title={`📸 Mengamati Objek: ${learningBridge.detectedObject || 'Foto Objek'}`}
        subtitle={`Materi Pelajaran: ${learningBridge.material || 'STEM'} (${learningBridge.subject || 'Sains'})`}
      />
    </div>
  );
};

