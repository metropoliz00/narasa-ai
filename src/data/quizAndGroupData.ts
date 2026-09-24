import { StudentGroup, ConceptQuiz, QuizSubmission, UserProfile, GroupObservationRecord, PresentationSettings } from '../types';
import { getDefaultAvatar } from './avatarData';

export const INITIAL_STUDENT_GROUPS: StudentGroup[] = [
  {
    id: 'group-garuda-va',
    name: 'Kelompok 1 - Garuda',
    schoolId: 'SDN01',
    schoolName: 'SDN 01 Nusantara',
    classId: 'V-A',
    className: 'Kelas V-A',
    leaderId: 'user-student-1',
    leaderName: 'Adit Pratama',
    memberIds: ['user-student-1', 'user-student-2'],
    memberNames: ['Adit Pratama', 'Siti Rahma', 'Bayu Nugroho', 'Dewi Lestari'],
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    email: 'kelompok1.garuda@siswa.sdn01.sch.id',
    username: 'kelompok1_garuda',
    password: '123456',
    motto: 'Teliti Menemukan, Kritis Menalar, Kompak Berbagi!',
    color: '#3B82F6',
    createdAt: '2026-09-12',
    accountUserId: 'user-group-1'
  },
  {
    id: 'group-rajawali-va',
    name: 'Kelompok 2 - Rajawali',
    schoolId: 'SDN01',
    schoolName: 'SDN 01 Nusantara',
    classId: 'V-A',
    className: 'Kelas V-A',
    leaderId: 'user-student-2',
    leaderName: 'Siti Rahma',
    memberIds: ['user-student-2'],
    memberNames: ['Siti Rahma', 'Bagas Saputra', 'Fatimah Az-Zahra', 'Dimas Anggara'],
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
    email: 'kelompok2.rajawali@siswa.sdn01.sch.id',
    username: 'kelompok2_rajawali',
    password: '123456',
    motto: 'Terbang Tinggi Menggapai Pemahaman Sains & Matematika.',
    color: '#10B981',
    createdAt: '2026-09-12',
    accountUserId: 'user-group-2'
  },
  {
    id: 'group-cendrawasih-va',
    name: 'Kelompok 3 - Cendrawasih',
    schoolId: 'SDN01',
    schoolName: 'SDN 01 Nusantara',
    classId: 'V-A',
    className: 'Kelas V-A',
    memberIds: [],
    memberNames: ['Anisa Putri', 'Reno Pratama', 'Hana Salsabila', 'Zaki Alfarizi'],
    avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150&auto=format&fit=crop&q=80',
    email: 'kelompok3.cendrawasih@siswa.sdn01.sch.id',
    username: 'kelompok3_cendrawasih',
    password: '123456',
    motto: 'Kreatif Bernalar, Hebat Berpresentasi!',
    color: '#8B5CF6',
    createdAt: '2026-09-14',
    accountUserId: 'user-group-3'
  },
  {
    id: 'group-komodo-vb',
    name: 'Kelompok 1 - Komodo',
    schoolId: 'SDN01',
    schoolName: 'SDN 01 Nusantara',
    classId: 'V-B',
    className: 'Kelas V-B',
    leaderId: 'user-student-3',
    leaderName: 'Budi Santoso',
    memberIds: ['user-student-3'],
    memberNames: ['Budi Santoso', 'Cahyo Utomo', 'Lestari Indah'],
    avatar: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=150&auto=format&fit=crop&q=80',
    email: 'kelompok1.komodo@siswa.sdn01.sch.id',
    username: 'kelompok1_komodo',
    password: '123456',
    motto: 'Tangguh dan Cermat Menyelesaikan Tantangan Nyata!',
    color: '#F59E0B',
    createdAt: '2026-09-15',
    accountUserId: 'user-group-4'
  }
];

export const INITIAL_GROUP_USERS: UserProfile[] = [
  {
    id: 'user-group-1',
    name: 'Kelompok 1 - Garuda',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-A (Akun Kelompok)',
    classId: 'V-A',
    email: 'kelompok1.garuda@siswa.sdn01.sch.id',
    username: 'kelompok1_garuda',
    password: '123456',
    status: 'active',
    nisnNip: 'KEL-VA-001',
    joinedDate: 'September 2026',
    isGroup: true,
    groupId: 'group-garuda-va',
    groupMembers: ['Adit Pratama', 'Siti Rahma', 'Bayu Nugroho', 'Dewi Lestari'],
    groupLeader: 'Adit Pratama',
    groupMotto: 'Teliti Menemukan, Kritis Menalar, Kompak Berbagi!'
  },
  {
    id: 'user-group-2',
    name: 'Kelompok 2 - Rajawali',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-A (Akun Kelompok)',
    classId: 'V-A',
    email: 'kelompok2.rajawali@siswa.sdn01.sch.id',
    username: 'kelompok2_rajawali',
    password: '123456',
    status: 'active',
    nisnNip: 'KEL-VA-002',
    joinedDate: 'September 2026',
    isGroup: true,
    groupId: 'group-rajawali-va',
    groupMembers: ['Siti Rahma', 'Bagas Saputra', 'Fatimah Az-Zahra', 'Dimas Anggara'],
    groupLeader: 'Siti Rahma',
    groupMotto: 'Terbang Tinggi Menggapai Pemahaman Sains & Matematika.'
  },
  {
    id: 'user-group-3',
    name: 'Kelompok 3 - Cendrawasih',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150&auto=format&fit=crop&q=80',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-A (Akun Kelompok)',
    classId: 'V-A',
    email: 'kelompok3.cendrawasih@siswa.sdn01.sch.id',
    username: 'kelompok3_cendrawasih',
    password: '123456',
    status: 'active',
    nisnNip: 'KEL-VA-003',
    joinedDate: 'September 2026',
    isGroup: true,
    groupId: 'group-cendrawasih-va',
    groupMembers: ['Anisa Putri', 'Reno Pratama', 'Hana Salsabila', 'Zaki Alfarizi'],
    groupLeader: 'Anisa Putri',
    groupMotto: 'Kreatif Bernalar, Hebat Berpresentasi!'
  },
  {
    id: 'user-group-4',
    name: 'Kelompok 1 - Komodo',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=150&auto=format&fit=crop&q=80',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-B (Akun Kelompok)',
    classId: 'V-B',
    email: 'kelompok1.komodo@siswa.sdn01.sch.id',
    username: 'kelompok1_komodo',
    password: '123456',
    status: 'active',
    nisnNip: 'KEL-VB-001',
    joinedDate: 'September 2026',
    isGroup: true,
    groupId: 'group-komodo-vb',
    groupMembers: ['Budi Santoso', 'Cahyo Utomo', 'Lestari Indah'],
    groupLeader: 'Budi Santoso',
    groupMotto: 'Tangguh dan Cermat Menyelesaikan Tantangan Nyata!'
  }
];

export const INITIAL_CONCEPT_QUIZZES: ConceptQuiz[] = [
  {
    id: 'quiz-kpk-fpb',
    missionId: 'mission-kpk-fpb',
    title: 'Uji Pemahaman Berpikir Kritis: Penalaran KPK & FPB Siklus Nyata',
    subject: 'Matematika',
    grade: 'Kelas V',
    phase: 'Fase C',
    topic: 'Kelipatan Persekutuan Terkecil & Faktor Persekutuan Terbesar',
    description: 'Asesmen berpikir kritis mengukur kemampuan bernalar matematis, menganalisis pola interval waktu, dan merancang pembagian merata objek sehari-hari.',
    durationMinutes: 10,
    targetCompetency: 'numeracy',
    passingScore: 75,
    totalQuestions: 1,
    isPublished: true,
    isAiGenerated: false,
    contextImage: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=700&auto=format&fit=crop&q=80',
    createdAt: '2026-09-15',
    questions: [
      {
        id: 'q1',
        questionType: 'single_choice',
        criticalThinkingSkill: 'Analisis Hubungan Sebab-Akibat Interval',
        cognitiveLevel: 'C4',
        conceptTag: 'Penalaran Interval KPK',
        maxScore: 100,
        image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Di lorong sekolah terdapat instalasi sains dengan dua lampu sensor cerdas: Lampu Hijau berkedip setiap 4 detik sekali, sedangkan Lampu Kuning berkedip setiap 6 detik sekali. Kedua lampu mulai dinyalakan bersamaan tepat pada detik ke-0 saat bel masuk sekolah berdentang.',
        scenario: 'Murid mengamati dua lampu hias gerbang sains sekolah dengan interval kedip berbeda.',
        question: 'Berdasarkan wacana di sebelah kiri, pada detik ke berapa kedua lampu sensor tersebut akan menyala bersamaan kembali untuk pertama kalinya?',
        options: [
          { id: 'opt_a', text: 'Detik ke-10 (karena 4 + 6 = 10 detik)' },
          { id: 'opt_b', text: 'Detik ke-12 (Kelipatan Persekutuan Terkecil dari 4 dan 6)' },
          { id: 'opt_c', text: 'Detik ke-24 (Hasil kali perkalian 4 × 6)' },
          { id: 'opt_d', text: 'Detik ke-2 (Faktor persekutuan terkecil)' }
        ],
        correctOptionId: 'opt_b',
        competencyType: 'numeracy',
        explanation: 'Untuk mencari peristiwa berulang bersamaan di masa depan, kita mencari Kelipatan Persekutuan Terkecil (KPK). Kelipatan 4 = 4, 8, 12, 16... Kelipatan 6 = 6, 12, 18... KPK(4,6) = 12 detik.'
      }
    ]
  },
  {
    id: 'quiz-ipas-ekosistem',
    missionId: 'mission-ipas-ekosistem',
    title: 'Uji Pemahaman Berpikir Kritis: Dinamika Rantai Makanan & Ekosistem',
    subject: 'IPAS',
    grade: 'Kelas V',
    phase: 'Fase C',
    topic: 'Komponen Biotik, Abiotik & Jaring-Jaring Kehidupan',
    description: 'Evaluasi pemahaman kritis hubungan saling ketergantungan makhluk hidup, dampak kepunahan predator, dan konservasi alam sekitar.',
    durationMinutes: 10,
    targetCompetency: 'both',
    passingScore: 75,
    totalQuestions: 1,
    isPublished: true,
    isAiGenerated: false,
    contextImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&auto=format&fit=crop&q=80',
    createdAt: '2026-09-14',
    questions: [
      {
        id: 'q1',
        questionType: 'single_choice',
        criticalThinkingSkill: 'Analisis Sebab-Akibat Perubahan Rantai Makanan',
        cognitiveLevel: 'C4',
        conceptTag: 'Dampak Perubahan Trofik',
        maxScore: 100,
        image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Di kebun botani sekolah terdapat jaring-jaring makanan: Tanaman Sawi → Ulat Daun → Burung Pipit → Ular Pohon. Karena area sekitar dibangun gedung baru, burung pipit banyak bermigrasi sehingga populasinya berkurang dari 40 ekor menjadi tersisa 2 ekor saja dalam sebulan.',
        scenario: 'Observasi kebun botani sekolah and penurunan populasi predator alami.',
        question: 'Berdasarkan wacana di sebelah kiri, apa dampak langsung yang paling nyata terhadap populasi ulat daun dan tanaman sawi di kebun?',
        options: [
          { id: 'opt_a', text: 'Ulat daun punah dan daun tanaman sawi menjadi sangat lebat tanpa hama' },
          { id: 'opt_b', text: 'Populasi ulat daun melonjak pesat sehingga tanaman sawi mengalami kerusakan parah' },
          { id: 'opt_c', text: 'Ular pohon akan segera beralih memakan tanaman sawi sebagai makanan baru' },
          { id: 'opt_d', text: 'Tanaman sawi langsung berhenti memproduksi klorofil' }
        ],
        correctOptionId: 'opt_b',
        competencyType: 'reasoning',
        explanation: 'Burung pipit adalah predator pengendali ulat daun. Bila burung pipit berkurang drastis, populasi ulat meledak dan memakan daun sawi hingga rusak.'
      }
    ]
  },
  {
    id: 'quiz-b-indo-deskripsi',
    missionId: 'mission-b-indo-deskripsi',
    title: 'Uji Pemahaman Berpikir Kritis: Analisis Teks Deskripsi & Bukti Visual',
    subject: 'Bahasa Indonesia',
    grade: 'Kelas V',
    phase: 'Fase C',
    topic: 'Ciri Sensorik, Kalimat Efektif & Bukti Visual',
    description: 'Mengukur kecermatan literasi kritis dalam membedakan fakta visual terukur dengan opini subjektif serta membuktikan kebenaran narasi.',
    durationMinutes: 10,
    targetCompetency: 'literacy',
    passingScore: 75,
    totalQuestions: 1,
    isPublished: true,
    isAiGenerated: false,
    contextImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&auto=format&fit=crop&q=80',
    createdAt: '2026-09-13',
    questions: [
      {
        id: 'q1',
        questionType: 'single_choice',
        criticalThinkingSkill: 'Analisis Detail Sensorik Observasi',
        cognitiveLevel: 'C4',
        conceptTag: 'Pancaindra Deskripsi',
        maxScore: 100,
        image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Teks Pengamatan Siswa:\n"Di sudut perpustakaan berdiri lemari jati bertingkat empat setinggi 180 sentimeter. Permukaannya berwarna cokelat gelap dengan urat kayu bergelombang halus. Ketika pintu kaca digeser, tercium aroma wangi kertas buku baru yang tersusun rapi menurut kategori fiksi dan sains."',
        scenario: 'Kutipan teks deskripsi suasana ruang perpustakaan sekolah.',
        question: 'Berdasarkan wacana di sebelah kiri, manakah perpaduan pancaindra yang paling dominan digunakan penulis dalam mendeskripsikan lemari tersebut?',
        options: [
          { id: 'opt_a', text: 'Penglihatan (tinggi, warna, urat kayu) dan Penciuman (aroma wangi kertas)' },
          { id: 'opt_b', text: 'Pengecapan dan Peraba rasa semata' },
          { id: 'opt_c', text: 'Pendengaran bunyi gesekan buku dan pengecapan aroma' },
          { id: 'opt_d', text: 'Hanya indra pendengaran bunyi pintu' }
        ],
        correctOptionId: 'opt_a',
        competencyType: 'literacy',
        explanation: 'Keterangan tinggi 180 cm, warna cokelat, dan urat kayu ditangkap indra penglihatan, sedangkan aroma wangi kertas ditangkap indra penciuman.'
      }
    ]
  }
];

export const INITIAL_QUIZ_SUBMISSIONS: QuizSubmission[] = [
  {
    id: 'sub-1',
    quizId: 'quiz-kpk-fpb',
    quizTitle: 'Uji Pemahaman Berpikir Kritis: Penalaran KPK & FPB Siklus Nyata',
    subject: 'Matematika',
    userId: 'user-group-1',
    userName: 'Kelompok 1 - Garuda',
    userAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    isGroup: true,
    groupMembers: ['Adit Pratama', 'Siti Rahma', 'Bayu Nugroho', 'Dewi Lestari'],
    className: 'Kelas V-A',
    classId: 'V-A',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    score: 100,
    objectiveScore: 100,
    essayScore: 0,
    correctCount: 1,
    totalQuestions: 1,
    literacyScore: 100,
    numeracyScore: 100,
    reasoningScore: 100,
    predicate: 'Sangat Mahir',
    feedback: 'Luar biasa! Kelompok Garuda menunjukkan penalaran kritis dan komputasi KPK/FPB tepat sempurna.',
    selectedAnswers: {
      q1: 'opt_b'
    },
    hasEssay: false,
    needsManualGrading: false,
    isGradedByTeacher: true,
    completedAt: '2026-09-17 09:30',
    timeSpentSeconds: 120
  },
  {
    id: 'sub-2',
    quizId: 'quiz-ipas-ekosistem',
    quizTitle: 'Uji Pemahaman Berpikir Kritis: Dinamika Rantai Makanan & Ekosistem',
    subject: 'IPAS',
    userId: 'user-student-1',
    userName: 'Adit Pratama',
    userAvatar: getDefaultAvatar('student', 'male'),
    isGroup: false,
    className: 'Kelas V-A',
    classId: 'V-A',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    score: 100,
    objectiveScore: 100,
    essayScore: 0,
    correctCount: 1,
    totalQuestions: 1,
    literacyScore: 100,
    numeracyScore: 100,
    reasoningScore: 100,
    predicate: 'Sangat Mahir',
    feedback: 'Pemahaman konsep rantai makanan dan ketergantungan antar organisme sangat solid.',
    selectedAnswers: {
      q1: 'opt_b'
    },
    hasEssay: false,
    needsManualGrading: false,
    isGradedByTeacher: true,
    completedAt: '2026-09-18 10:15',
    timeSpentSeconds: 95
  },
  {
    id: 'sub-3',
    quizId: 'quiz-kpk-fpb',
    quizTitle: 'Uji Pemahaman Berpikir Kritis: Penalaran KPK & FPB Siklus Nyata',
    subject: 'Matematika',
    userId: 'user-group-2',
    userName: 'Kelompok 2 - Rajawali',
    userAvatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
    isGroup: true,
    groupMembers: ['Siti Rahma', 'Bagas Saputra', 'Fatimah Az-Zahra', 'Dimas Anggara'],
    className: 'Kelas V-A',
    classId: 'V-A',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    score: 100,
    objectiveScore: 100,
    essayScore: 0,
    correctCount: 1,
    totalQuestions: 1,
    literacyScore: 100,
    numeracyScore: 100,
    reasoningScore: 100,
    predicate: 'Sangat Mahir',
    feedback: 'Hebat sekali! Kelompok Rajawali berhasil menyimpulkan FPB/KPK dengan cermat.',
    selectedAnswers: {
      q1: 'opt_b'
    },
    hasEssay: false,
    needsManualGrading: false,
    isGradedByTeacher: true,
    completedAt: '2026-09-19 08:30',
    timeSpentSeconds: 140
  }
];

export const INITIAL_GROUPS = INITIAL_STUDENT_GROUPS;

export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  mode: 'both', // 'both' | 'group_only' | 'individual_only'
  allowPeerQuestions: true,
  notesForStudents: 'Silakan siapkan slide hasil eksplorasi lingkungan dan penalaran konsepmu!',
  updatedAt: '2026-09-19'
};

export const INITIAL_GROUP_OBSERVATIONS: GroupObservationRecord[] = [
  {
    id: 'obs-garuda-1',
    groupId: 'group-garuda-va',
    groupName: 'Kelompok 1 - Garuda',
    classId: 'V-A',
    className: 'Kelas V-A',
    teacherId: 'user-teacher-1',
    teacherName: 'Dedy Nugraha, S.Pd.',
    missionId: 'mission-ekosistem-1',
    missionTitle: 'Misi Jaring-Jaring Makanan & Ekosistem Sawah',
    activityTopic: 'Observasi Rantai Makanan & Dampak Serangga pada Tanaman',
    date: '2026-09-18',
    groupCohesion: 4, // Sangat Baik
    taskQuality: 4,   // Sangat Baik
    averageGroupScore: 89,
    groupNotes: 'Kelompok Garuda menunjukkan kerjasama yang luar biasa. Setiap anggota berkontribusi aktif dan saling melengkapi saat mendiskusikan hubungan jaring-jaring makanan di sekitar sekolah.',
    createdAt: '2026-09-18 11:45',
    memberScores: [
      {
        studentId: 'user-student-1',
        studentName: 'Adit Pratama',
        isLeader: true,
        indicators: {
          participation: 4,
          collaboration: 4,
          criticalThinking: 4,
          responsibility: 4,
          communication: 4
        },
        totalScore: 100,
        predicate: 'Sangat Baik',
        notes: 'Memimpin pembagian tugas tim dengan sangat tertib dan mampu memotivasi seluruh anggota berpendapat.'
      },
      {
        studentId: 'user-student-2',
        studentName: 'Siti Rahma',
        indicators: {
          participation: 4,
          collaboration: 4,
          criticalThinking: 4,
          responsibility: 4,
          communication: 3
        },
        totalScore: 95,
        predicate: 'Sangat Baik',
        notes: 'Sangat teliti mencatat data pengamatan lapangan dan mengaitkan dengan konsep rantai makanan.'
      },
      {
        studentId: 'member-bayu',
        studentName: 'Bayu Nugroho',
        indicators: {
          participation: 3,
          collaboration: 4,
          criticalThinking: 3,
          responsibility: 3,
          communication: 3
        },
        totalScore: 80,
        predicate: 'Baik',
        notes: 'Aktif membantu dokumentasi foto dan mendengarkan penjelasan rekan kelompok.'
      },
      {
        studentId: 'member-dewi',
        studentName: 'Dewi Lestari',
        indicators: {
          participation: 3,
          collaboration: 3,
          criticalThinking: 3,
          responsibility: 4,
          communication: 3
        },
        totalScore: 80,
        predicate: 'Baik',
        notes: 'Bertanggung jawab merapikan catatan hasil kerja kelompok dan siap mempresentasikan bagian refleksi.'
      }
    ]
  },
  {
    id: 'obs-rajawali-1',
    groupId: 'group-rajawali-va',
    groupName: 'Kelompok 2 - Rajawali',
    classId: 'V-A',
    className: 'Kelas V-A',
    teacherId: 'user-teacher-1',
    teacherName: 'Dedy Nugraha, S.Pd.',
    missionId: 'mission-matematika-kpk',
    missionTitle: 'Misi Penalaran KPK & FPB Kontekstual',
    activityTopic: 'Simulasi Pembagian Biji Tanaman dan Jadwal Penyiraman',
    date: '2026-09-17',
    groupCohesion: 4,
    taskQuality: 3,
    averageGroupScore: 86,
    groupNotes: 'Kelompok Rajawali sangat bersemangat memecahkan teka-teki FPB. Diskusi berlangsung hangat dan menghargai masukan teman.',
    createdAt: '2026-09-17 10:30',
    memberScores: [
      {
        studentId: 'user-student-2',
        studentName: 'Siti Rahma',
        isLeader: true,
        indicators: {
          participation: 4,
          collaboration: 4,
          criticalThinking: 4,
          responsibility: 4,
          communication: 4
        },
        totalScore: 100,
        predicate: 'Sangat Baik',
        notes: 'Inisiatif tinggi dalam menyusun strategi pembagian FPB secara konkret.'
      },
      {
        studentId: 'member-bagas',
        studentName: 'Bagas Saputra',
        indicators: {
          participation: 4,
          collaboration: 3,
          criticalThinking: 3,
          responsibility: 4,
          communication: 3
        },
        totalScore: 85,
        predicate: 'Baik',
        notes: 'Membantu menghitung kelipatan dan berani bertanya jika menemukan keraguan.'
      },
      {
        studentId: 'member-fatimah',
        studentName: 'Fatimah Az-Zahra',
        indicators: {
          participation: 4,
          collaboration: 4,
          criticalThinking: 3,
          responsibility: 3,
          communication: 4
        },
        totalScore: 90,
        predicate: 'Sangat Baik',
        notes: 'Komunikasi sangat santun dan mendukung suasana belajar yang kondusif.'
      },
      {
        studentId: 'member-dimas',
        studentName: 'Dimas Anggara',
        indicators: {
          participation: 3,
          collaboration: 3,
          criticalThinking: 3,
          responsibility: 3,
          communication: 3
        },
        totalScore: 75,
        predicate: 'Baik',
        notes: 'Fokus mengerjakan tugas perhitungannya dengan baik.'
      }
    ]
  }
];
