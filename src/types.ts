export type UserRole = 'teacher' | 'student' | 'school_admin' | 'central_admin' | 'admin';

export interface Subject {
  id: string; // e.g., 'matematika'
  name: string; // e.g., 'Matematika'
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
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

export interface ExplorationQuestion {
  id: string;
  stage: 'challenge' | 'reasoning' | 'evidence' | 'strategy';
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
  challengeAnswer: string;
  reason: string;
  evidence: string;
  strategy: string;
  conclusion: string;
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
  answers: {
    challengeAnswer: string;
    reason: string;
    evidence: string;
    strategy: string;
    conclusion: string;
  };
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
