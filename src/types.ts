export type UserRole = 'teacher' | 'student' | 'school_admin' | 'central_admin' | 'admin';

export interface Subject {
  id: string; // e.g., 'matematika'
  name: string; // e.g., 'Matematika'
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  gender?: 'male' | 'female';
  avatar: string;
  schoolName: string;
  schoolId: string;
  className: string;
  classId: string;
  email: string;
  status?: 'active' | 'inactive';
  nisnNip?: string;
  username?: string;
  password?: string;
  phone?: string;
  joinedDate?: string;
  isGroup?: boolean;
  groupId?: string;
  groupMembers?: string[];
  groupLeader?: string;
  groupMotto?: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  classId: string;
  className: string;
  leaderId?: string;
  leaderName?: string;
  memberIds: string[];
  memberNames: string[];
  avatar: string;
  email: string;
  username?: string;
  password?: string;
  motto?: string;
  color?: string;
  createdAt: string;
  accountUserId: string; // Associated UserProfile.id
}

export type CognitiveLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C4-C6';
export type TargetCompetency = 'literacy' | 'numeracy' | 'both';
export type CompatibilityLevel = 'Strong' | 'Moderate' | 'Weak';

export interface MissionFeatures {
  adaptiveDifficulty: boolean;
  scaffolding: boolean;
  reasoning: boolean;
  evidence: boolean;
  reflection: boolean;
  presentation: boolean;
  peerQuestion: boolean;
}

export interface LearningMission {
  id: string;
  idMapel: string; // ID Mapel untuk memisahkan tampilan setiap mapel
  title: string;
  grade: string;
  phase: string;
  subject: string;
  material: string;
  cp: string; // Capaian Pembelajaran
  tp: string; // Tujuan Pembelajaran
  indicators: string[];
  targetCompetency: TargetCompetency;
  cognitiveLevel: CognitiveLevel;
  strictCurriculumMode: boolean;
  features: MissionFeatures;
  description: string;
  isActive: boolean;
  createdAt: string;
  suggestedObjects?: string[];
}

export interface ScaffoldingLevels {
  level1: string; // Petunjuk kecil
  level2: string; // Pertanyaan penuntun
  level3: string; // Masalah dipecah menjadi langkah kecil
  level4: string; // Contoh analog sederhana
}

export type STEMStage =
  | 'real_problem' // 1. Masalah nyata
  | 'ask_inquire' // 2. Bertanya & mencari informasi
  | 'design_solution' // 3. Merancang solusi
  | 'prototype' // 4. Membuat produk/prototipe
  | 'testing' // 5. Menguji
  | 'data_analysis' // 6. Menganalisis data
  | 'improvement' // 7. Memperbaiki
  | 'communication' // 8. Mengomunikasikan hasil
  | 'challenge'
  | 'reasoning'
  | 'evidence'
  | 'strategy';

export interface STEMStageDefinition {
  id: STEMStage;
  stepNumber: number;
  title: string;
  badge: string;
  iconName: string;
  description: string;
  guidingPrompt: string;
  placeholder: string;
  microcopy: string;
}

export const STEM_STAGES_CONFIG: STEMStageDefinition[] = [
  {
    id: 'real_problem',
    stepNumber: 1,
    title: 'Masalah Nyata',
    badge: 'Tahap 1: Masalah Nyata',
    iconName: 'Globe',
    description: 'Mengidentifikasi masalah autentik atau fenomena nyata dari objek yang difoto di lingkungan sekitar.',
    guidingPrompt: 'Apa masalah nyata atau fenomena menarik yang kamu temukan pada objek ini yang perlu diselesaikan atau dipahami?',
    placeholder: 'Ceritakan masalah nyata atau kebutuhan yang kamu amati pada objek foto ini...',
    microcopy: 'Amati objek dengan saksama. Temukan situasi nyata atau tantangan yang membutuhkan penyelidikan!'
  },
  {
    id: 'ask_inquire',
    stepNumber: 2,
    title: 'Bertanya & Mencari Informasi',
    badge: 'Tahap 2: Bertanya & Mencari Informasi',
    iconName: 'Search',
    description: 'Mengajukan pertanyaan kunci dan mengumpulkan informasi/konsep sains, matematika, atau teknologi yang relevan.',
    guidingPrompt: 'Apa pertanyaan utama yang muncul dan informasi/konsep apa yang perlu kamu cari tahu untuk memahami masalah tersebut?',
    placeholder: 'Tuliskan pertanyaan penting dan konsep sains/matematika yang kamu butuhkan...',
    microcopy: 'Ajukan pertanyaan penyelidikan! Konsep atau rumus apa yang dapat membantumu?'
  },
  {
    id: 'design_solution',
    stepNumber: 3,
    title: 'Merancang Solusi',
    badge: 'Tahap 3: Merancang Solusi',
    iconName: 'PenTool',
    description: 'Merumuskan ide kreatif, konsep perancangan, atau strategi logis untuk memecahkan masalah.',
    guidingPrompt: 'Bagaimana rancangan rencana atau strategi solusi yang kamu usulkan untuk mengatasi masalah nyata tersebut?',
    placeholder: 'Jelaskan sketsa rencana, metode, atau ide kreatif solusimu...',
    microcopy: 'Rancang solusimu! Uraikan langkah awal dan ide kreatif yang kamu rencanakan.'
  },
  {
    id: 'prototype',
    stepNumber: 4,
    title: 'Membuat Produk/Prototipe',
    badge: 'Tahap 4: Membuat Produk/Prototipe',
    iconName: 'Wrench',
    description: 'Menyusun langkah pembuatan produk nyata, model matematis, rekayasa alat, atau prototipe sederhana.',
    guidingPrompt: 'Bagaimana cara kamu mewujudkan produk, model kerja, atau prototipe sederhana dari rancangan solusi tersebut?',
    placeholder: 'Jelaskan bahan, alat, rumus model, atau langkah membuat prototipe solusimu...',
    microcopy: 'Wujudkan ide dalam bentuk nyata! Apa saja bahan atau langkah pembuatannya?'
  },
  {
    id: 'testing',
    stepNumber: 5,
    title: 'Menguji',
    badge: 'Tahap 5: Menguji',
    iconName: 'FlaskConical',
    description: 'Melakukan uji coba, simulasi, atau eksperimen langsung untuk menguji efektivitas prototipe/solusi.',
    guidingPrompt: 'Bagaimana cara kamu menguji prototipe/solusi tersebut? Apa saja kriteria keberhasilan yang kamu uji?',
    placeholder: 'Tuliskan cara kamu melakukan pengujian atau simulasi pada prototipe/modelmu...',
    microcopy: 'Uji solusimu! Bagaimana kamu menguji apakah prototipe tersebut bekerja dengan baik?'
  },
  {
    id: 'data_analysis',
    stepNumber: 6,
    title: 'Menganalisis Data',
    badge: 'Tahap 6: Menganalisis Data',
    iconName: 'BarChart2',
    description: 'Mencatat angka, mengolah data hasil pengujian, dan menafsirkan bukti kuantitatif/kualitatif.',
    guidingPrompt: 'Berdasarkan pengujian, apa data atau bukti angka yang kamu peroleh? Bagaimana analisis hasil perhitunganmu?',
    placeholder: 'Tuliskan data hitungan, tabel, grafik, atau fakta hasil pengujianmu...',
    microcopy: 'Tunjukkan bukti data! Gunakan perhitungan matematika atau tabel untuk menganalisis hasilnya.'
  },
  {
    id: 'improvement',
    stepNumber: 7,
    title: 'Memperbaiki',
    badge: 'Tahap 7: Memperbaiki',
    iconName: 'RefreshCw',
    description: 'Mengevaluasi kelemahan, melakukan perbaikan desain, dan menyempurnakan prototipe secara berulang (iteratif).',
    guidingPrompt: 'Kelemahan apa yang ditemukan dari hasil pengujian dan apa langkah perbaikan konkret yang kamu lakukan?',
    placeholder: 'Jelaskan bagian mana yang diperbaiki dan bagaimana caramu menjadikannya lebih optimal...',
    microcopy: 'Evaluasi & sempurnakan! Apa yang bisa dibuat lebih kuat, lebih cepat, atau lebih hemat?'
  },
  {
    id: 'communication',
    stepNumber: 8,
    title: 'Mengomunikasikan Hasil',
    badge: 'Tahap 8: Mengomunikasikan Hasil',
    iconName: 'Megaphone',
    description: 'Menyajikan kesimpulan, membagikan manfaat produk, dan mengomunikasikan temuan kepada rekan kelas.',
    guidingPrompt: 'Apa kesimpulan utama dari proyek STEM ini yang siap kamu komunikasikan dan presentasikan kepada teman-teman?',
    placeholder: 'Tuliskan kesimpulan akhir dan pesan utama yang akan kamu presentasikan...',
    microcopy: 'Bagikan karya hebatmu! Rangkum pesan kunci dan manfaat solusi untuk dipresentasikan.'
  }
];

export interface ExplorationQuestion {
  id: string;
  stage: STEMStage;
  title: string;
  question: string;
  subtext?: string;
  placeholder?: string;
  inputType: 'text' | 'number' | 'choice';
  options?: string[];
  scaffolding: ScaffoldingLevels;
  conceptTag: string;
}

export interface AILearningBridgeResult {
  detectedObject: string;
  compatibility: CompatibilityLevel;
  compatibilityReason: string;
  observation: string; // 👁️ Yang Saya Lihat
  context: string;
  learningBridge: string; // 🔗 Hubungannya dengan Pelajaran
  explanation?: string; // Legacy alias
  criticalQuestion?: string; // Legacy alias
  simpleMaterialSummary?: string; // 📖 Ringkasan Materi Sederhana untuk Murid
  soloTaxonomyLevel?: 'Pre-structural' | 'Uni-structural' | 'Multi-structural' | 'Relational' | 'Extended Abstract'; // 🎯 Taksonomi SOLO Eksplorasi
  soloDescription?: string; // Penjelasan level pemahaman SOLO
  guidingQuestions: string[]; // 💡 Pertanyaan Pematik untuk Murid
  subject: string; // 📚 Materi
  material: string;
  learningTarget: string; // 🎯 Target Belajar
  cognitiveLevel: CognitiveLevel;
  questions: ExplorationQuestion[];
  alternativeContextSuggestion?: string;
}

export interface PresentationSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  bullets?: string[];
  image?: string;
  speakingNotes: string; // 🎙️ Bantuan Berbicara
  speakerNotes?: string; // Compatibility alias
  layout: 'title' | 'split-photo' | 'observation' | 'reasoning' | 'solution' | 'reflection' | 'conclusion';
}

export interface PeerQuestion {
  id: string;
  askerName: string;
  avatar: string;
  question: string;
  presenterAnswer?: string;
  aiCoachHint?: string;
  timestamp: string;
}

export interface StudentAnswers {
  // 8 Pola Berpikir STEM
  realProblem?: string; // 1. Masalah Nyata
  askInquire?: string; // 2. Bertanya & Mencari Informasi
  designSolution?: string; // 3. Merancang Solusi
  prototype?: string; // 4. Membuat Produk/Prototipe
  testing?: string; // 5. Menguji
  dataAnalysis?: string; // 6. Menganalisis Data
  improvement?: string; // 7. Memperbaiki
  communication?: string; // 8. Mengomunikasikan Hasil

  // Compatibility fields
  challengeAnswer?: string;
  reason?: string;
  evidence?: string;
  strategy?: string;
  conclusion?: string;
  [key: string]: any;
}

export type LearningBridgeResult = AILearningBridgeResult;

export interface StudentReflection {
  q1Found: string; // Apa yang kamu temukan?
  q2Learned: string; // Apa yang kamu pelajari?
  q3Hardest: string; // Bagian mana yang paling sulit?
  q4Solved: string; // Bagaimana kamu menyelesaikannya?
  q5Improvement: string; // Apa yang akan kamu lakukan lebih baik berikutnya?
}

export interface StudentActivitySession {
  id: string;
  missionId: string;
  missionTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  image: string;
  imageLabel: string;
  learningBridge: AILearningBridgeResult;
  answers: StudentAnswers;
  scaffoldingHistory: {
    questionId: string;
    level: 1 | 2 | 3 | 4;
    hintText: string;
    requestedAt: string;
  }[];
  reflection: StudentReflection;
  presentation: PresentationSlide[];
  peerQuestions: PeerQuestion[];
  completedAt: string;
  status: 'draft' | 'completed';
  metrics: {
    literacyScore: number;
    numeracyScore: number;
    reasoningScore: number;
    scaffoldingUsedCount: number;
  };
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  color: string;
}

export interface StudentProgressProfile {
  studentId: string;
  name: string;
  className: string;
  activitiesCount: number;
  explorationsCount: number;
  presentationsCount: number;
  reflectionsCount: number;
  scaffoldingCount: number;
  literacyProgress: {
    locate: number; // Menemukan informasi
    understand: number; // Memahami
    interpret: number; // Interpretasi
    infer: number; // Inferensi
    evaluate: number; // Evaluasi
    argument: number; // Argumentasi/Alasan
    communicate: number; // Komunikasi
  };
  numeracyProgress: {
    identify: number; // Info kuantitatif
    represent: number; // Representasi
    calculate: number; // Perhitungan
    apply: number; // Penerapan
    strategy: number; // Strategi
    reason: number; // Penalaran
    evaluate: number; // Evaluasi
    communicate: number; // Komunikasi matematis
  };
  overallLiteracy: number;
  overallNumeracy: number;
  overallReasoning: number;
  overallCommunication: number;
  recentBadges: string[];
}

export interface TeacherInsight {
  id: string;
  title: string;
  type: 'strength' | 'need_scaffold' | 'pedagogical_tip';
  content: string;
  evidenceData: string;
  targetMissions: string[];
  actionRecommendation: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  type: 'pre' | 'post';
  literacyScore: number;
  numeracyScore: number;
  reasoningScore: number;
  date: string;
  notes: string;
}

export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface TrueFalseStatement {
  id: string; // e.g. "s1", "s2", "s3"
  statement: string; // Teks pernyataan penalaran kritis
  correctAnswer: boolean; // true = Benar, false = Salah
}

export interface QuizQuestion {
  id: string;
  questionType?: QuizQuestionType; // 'single_choice' | 'multiple_choice' | 'true_false' | 'essay'
  question: string;
  scenario?: string; // Teks konteks / skenario singkat
  stimulusText?: string; // Teks wacana / bacaan literasi-numerasi berpikir kritis
  image?: string; // Gambar atau foto konteks nyata
  showImage?: boolean; // Sakelar/pengaturan apakah gambar soal ditampilkan (default: true)
  options?: QuizQuestionOption[]; // Untuk single_choice dan multiple_choice
  correctOptionId?: string; // Untuk single_choice
  correctOptionIds?: string[]; // Untuk multiple_choice (Pilihan Ganda Kompleks)
  correctBooleanAnswer?: boolean; // Untuk true_false tunggal (kompatibilitas)
  statements?: TrueFalseStatement[]; // Untuk soal Benar/Salah: 1 pertanyaan dengan 3 pernyataan
  essayRubric?: string; // Panduan rubrik koreksi guru
  sampleAnswer?: string; // Kunci jawaban acuan / poin penalaran penting
  maxScore?: number; // Skor maksimal soal uraian
  criticalThinkingSkill?: string; // Misal: Analisis Bukti Visual, Sintesis Solusi, Penalaran Sebab-Akibat
  competencyType: 'literacy' | 'numeracy' | 'reasoning' | 'both';
  cognitiveLevel: 'C3' | 'C4' | 'C5' | 'C6';
  soloTaxonomyLevel?: 'Pre-structural' | 'Uni-structural' | 'Multi-structural' | 'Relational' | 'Extended Abstract';
  soloDescription?: string;
  conceptTag: string;
  explanation: string;
}

export interface ConceptQuiz {
  id: string;
  missionId?: string;
  title: string;
  subject: string;
  grade: string;
  phase: string;
  topic: string;
  description: string;
  durationMinutes: number;
  targetCompetency: TargetCompetency;
  passingScore: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  isPublished: boolean;
  isAiGenerated?: boolean;
  contextImage?: string;
  showContextImage?: boolean; // Sakelar/pengaturan apakah gambar utama paket soal ditampilkan (default: true)
  createdAt: string;
}

export interface EssayGradingRecord {
  score: number; // Nilai yang diberikan guru
  maxScore: number; // Nilai maksimum soal
  feedback: string; // Catatan koreksi & umpan balik guru
  gradedAt: string;
  teacherName: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isGroup: boolean;
  groupMembers?: string[];
  className: string;
  classId: string;
  schoolName: string;
  schoolId: string;
  score: number; // 0 - 100
  objectiveScore?: number; // Nilai otomatis dari PG, PG Kompleks, Benar/Salah
  essayScore?: number; // Nilai manual dari koreksi guru
  correctCount: number;
  totalQuestions: number;
  literacyScore: number;
  numeracyScore: number;
  reasoningScore: number;
  predicate: 'Sangat Mahir' | 'Mahir' | 'Cakap' | 'Perlu Bimbingan';
  feedback: string;
  selectedAnswers: Record<string, any>; // questionId -> optionId | optionIds[] | boolean | string
  essayGrading?: Record<string, EssayGradingRecord>; // questionId -> detail koreksi guru
  hasEssay?: boolean; // Apakah ada soal uraian
  needsManualGrading?: boolean; // Menandai apakah menunggu koreksi guru
  isGradedByTeacher?: boolean; // Ditandai setelah guru menyimpan koreksi
  completedAt: string;
  timeSpentSeconds: number;
}

// ==================== GROUP OBSERVATION RUBRIC & SCORES ====================
export interface ObservationRubricIndicators {
  participation: number; // 1-4: Keaktifan & Partisipasi dalam Diskusi
  collaboration: number; // 1-4: Kerjasama & Gotong Royong
  criticalThinking: number; // 1-4: Penalaran Kritis & Ide Solusi
  responsibility: number; // 1-4: Tanggung Jawab & Kontribusi Pembagian Tugas
  communication: number; // 1-4: Komunikasi & Sikap Menghargai Rekan
}

export interface MemberObservationScore {
  studentId: string;
  studentName: string;
  isLeader?: boolean;
  indicators: ObservationRubricIndicators;
  totalScore: number; // 0 - 100
  predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  notes?: string;
}

export interface GroupObservationRecord {
  id: string;
  groupId: string;
  groupName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  missionId?: string;
  missionTitle?: string;
  activityTopic: string;
  date: string;
  groupCohesion: number; // 1-4: Kekompakan dan Dinamika Tim
  taskQuality: number; // 1-4: Kualitas & Ketercapaian Hasil Eksplorasi
  averageGroupScore: number; // 0-100 Rata-rata skor anggota
  groupNotes: string; // Catatan observasi guru untuk kelompok
  memberScores: MemberObservationScore[];
  createdAt: string;
}

// ==================== PRESENTATION ACCESS SETTING ====================
export type PresentationAccessMode = 'both' | 'group_only' | 'individual_only';

export interface PresentationSettings {
  mode: PresentationAccessMode; // 'both' | 'group_only' | 'individual_only'
  allowPeerQuestions: boolean;
  notesForStudents?: string;
  updatedAt: string;
}

// ==================== SCHOOL PROFILE & DATA SETTINGS ====================
export interface SchoolProfile {
  id: string; // e.g. 'SDN01'
  name: string; // 'SDN 01 Nusantara'
  npsn: string; // '20104050'
  level: string; // 'SD / MI'
  status: 'Negeri' | 'Swasta';
  accreditation: 'A (Unggul)' | 'B (Baik)' | 'C' | 'Belum Terakreditasi';
  curriculum: string; // 'Kurikulum Merdeka'
  headmaster: string; // 'Dra. Hj. Siti Nurjanah, M.Pd.'
  headmasterNip: string; // '197203151998032004'
  supervisorName?: string; // Pengawas Pembina Dinas
  supervisorNip?: string;
  phone: string; // '(021) 7890123'
  email: string; // 'sdn01nusantara@kemdikbud.go.id'
  website?: string; // 'https://sdn01nusantara.sch.id'
  address: string; // 'Jl. Pendidikan Merdeka No. 45'
  rtRw?: string; // '005/002'
  village?: string; // 'Menteng'
  district?: string; // 'Menteng'
  city: string; // 'Kota Jakarta Pusat'
  province: string; // 'DKI Jakarta'
  postalCode: string; // '10310'
  motto?: string; // 'Cerdas, Berkarakter, dan Berdaya Nalar Kritis'
  logoUrl?: string; // Logo sekolah
  academicYear: string; // '2024/2025'
  activeSemester: 'Ganjil' | 'Genap';
  category?: string; // 'Sekolah Penggerak' | 'Sekolah Rujukan'
  totalStudents?: number;
  totalTeachers?: number;
  classesList?: string[];
  updatedAt?: string;
}
