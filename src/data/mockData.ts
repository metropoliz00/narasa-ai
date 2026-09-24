import {
  UserProfile,
  LearningMission,
  StudentActivitySession,
  AchievementBadge,
  StudentProgressProfile,
  TeacherInsight,
  AssessmentRecord
} from '../types';
import studentBoy1 from '../assets/avatars/student_boy_1.jpg';
import studentBoy2 from '../assets/avatars/student_boy_2.jpg';
import studentGirlHijab from '../assets/avatars/student_girl_hijab.jpg';
import studentGirlRibbon from '../assets/avatars/student_girl_ribbon.jpg';
import teacherMale from '../assets/avatars/teacher_male.jpg';
import teacherFemale from '../assets/avatars/teacher_female.jpg';
import adminMale from '../assets/avatars/admin_male.jpg';
import adminFemale from '../assets/avatars/admin_female.jpg';

export const INITIAL_SYSTEM_USERS: UserProfile[] = [
  // 1. SISWA
  {
    id: 'user-student-1',
    name: 'Adit Pratama',
    role: 'student',
    gender: 'male',
    avatar: studentBoy1,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-A',
    classId: 'V-A',
    email: 'aditpratama@siswa.sdn01.sch.id',
    status: 'active',
    nisnNip: '0098451201',
    joinedDate: 'Juli 2024'
  },
  {
    id: 'user-student-2',
    name: 'Siti Rahma',
    role: 'student',
    gender: 'female',
    avatar: studentGirlHijab,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-A',
    classId: 'V-A',
    email: 'sitirahma@siswa.sdn01.sch.id',
    status: 'active',
    nisnNip: '0098451202',
    joinedDate: 'Juli 2024'
  },
  {
    id: 'user-student-3',
    name: 'Budi Santoso',
    role: 'student',
    gender: 'male',
    avatar: studentBoy2,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas V-B',
    classId: 'V-B',
    email: 'budisantoso@siswa.sdn01.sch.id',
    status: 'active',
    nisnNip: '0098451203',
    joinedDate: 'Juli 2024'
  },
  {
    id: 'user-student-4',
    name: 'Nabila Zahra',
    role: 'student',
    gender: 'female',
    avatar: studentGirlRibbon,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Kelas IV-A',
    classId: 'IV-A',
    email: 'nabilazahra@siswa.sdn01.sch.id',
    status: 'active',
    nisnNip: '0108451204',
    joinedDate: 'Juli 2025'
  },
  {
    id: 'user-student-5',
    name: 'Rizki Pratama',
    role: 'student',
    gender: 'male',
    avatar: studentBoy1,
    schoolName: 'SDN 02 Kenanga',
    schoolId: 'SDN02',
    className: 'Kelas V-A',
    classId: 'V-A',
    email: 'rizkipratama@siswa.sdn02.sch.id',
    status: 'active',
    nisnNip: '0098451999',
    joinedDate: 'Juli 2024'
  },

  // 2. GURU
  {
    id: 'user-teacher-1',
    name: 'Pak Dedy, S.Pd.',
    role: 'teacher',
    gender: 'male',
    avatar: teacherMale,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Wali Kelas V-A • Guru IPA & Matematika',
    classId: 'V-A',
    email: 'dedy.guru@sdn01nusantara.sch.id',
    status: 'active',
    nisnNip: '198504122010011005',
    phone: '0812-3456-7890',
    joinedDate: 'Januari 2020'
  },
  {
    id: 'user-teacher-3',
    name: 'Pak Hendra Wijaya, S.Pd.',
    role: 'teacher',
    gender: 'male',
    avatar: teacherMale,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Guru Kelas IV • Tematik & PJOK',
    classId: 'IV-A',
    email: 'hendra.wijaya@sdn01nusantara.sch.id',
    status: 'active',
    nisnNip: '199103152015031002',
    phone: '0815-5678-1234',
    joinedDate: 'Agustus 2022'
  },

  // 3. ADMIN SEKOLAH & ADMIN PUSAT
  {
    id: 'user-school-admin-1',
    name: 'Ibu Ratna, S.Kom.',
    role: 'school_admin',
    gender: 'female',
    avatar: adminFemale,
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    className: 'Admin Sekolah • SDN 01 Nusantara',
    classId: 'ALL',
    email: 'admin.sdn01@narasa.id',
    status: 'active',
    nisnNip: '198009182006042008',
    phone: '0811-2233-4455',
    joinedDate: 'Januari 2019'
  },
  {
    id: 'user-central-admin-1',
    name: 'Pak Irfan Maulana, M.T.',
    role: 'central_admin',
    gender: 'male',
    avatar: adminMale,
    schoolName: 'Pusat Data & Dinas Pendidikan Kota',
    schoolId: 'CENTRAL',
    className: 'Admin Pusat Nasional',
    classId: 'ALL',
    email: 'pusat@narasa.id',
    status: 'active',
    nisnNip: '199302102019031001',
    username: 'adminpusat',
    password: 'admin123',
    phone: '0812-9988-7766',
    joinedDate: 'Mei 2022'
  }
];

export const DEMO_USERS: Record<string, UserProfile> = {
  teacher: INITIAL_SYSTEM_USERS.find(u => u.role === 'teacher') || INITIAL_SYSTEM_USERS[5],
  student: INITIAL_SYSTEM_USERS.find(u => u.role === 'student') || INITIAL_SYSTEM_USERS[0],
  admin: INITIAL_SYSTEM_USERS.find(u => u.role === 'central_admin') || INITIAL_SYSTEM_USERS[INITIAL_SYSTEM_USERS.length - 1]
};

export const DEFAULT_MISSIONS: LearningMission[] = [
  // ==================== MATEMATIKA (KPK & FPB) ====================
  {
    id: 'mission-kpk-fpb',
    idMapel: 'matematika',
    title: 'Misi 1: Eksplorasi Pola Interval & Keteraturan Berulang',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Matematika',
    material: 'Kelipatan Persekutuan Terkecil (KPK) & Faktor Persekutuan Terbesar (FPB)',
    cp: 'Peserta didik dapat memahami dan menyelesaikan masalah penalaran yang berkaitan dengan kelipatan and faktor dalam konteks kehidupan sehari-hari.',
    tp: 'Menerapkan konsep KPK dan FPB untuk menyelesaikan masalah nyata terkait interval waktu berulang dan pembagian merata dengan strategi logis.',
    indicators: [
      'Menemukan informasi kuantitatif berulang atau interval dari objek nyata di sekitar',
      'Menganalisis apakah situasi menuntut persekutuan kelipatan (KPK) atau pembagian faktor terbesar (FPB)',
      'Menyajikan alasan logis dan membuktikan hasil perhitungan secara terstruktur'
    ],
    targetCompetency: 'numeracy',
    cognitiveLevel: 'C4-C6',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Amati dan potret objek atau pola berulang di sekitarmu, seperti susunan ubin teratur, deret anak tangga dengan penanda langkah, atau jadwal kegiatan periodik untuk memahami konsep interval dan kelipatan (KPK).',
    isActive: true,
    createdAt: '2026-09-10',
    suggestedObjects: ['Pola susunan anak tangga bertingkat', 'Pola susunan paving block/keramik teratur', 'Papan jadwal piket & waktu berkala']
  },
  {
    id: 'mission-kpk-fpb-2',
    idMapel: 'matematika',
    title: 'Misi 2: Pola Putaran Kipas Angin',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Matematika',
    material: 'Kelipatan Persekutuan Terkecil (KPK) & Faktor Persekutuan Terbesar (FPB)',
    cp: 'Peserta didik dapat memahami dan menyelesaikan masalah penalaran yang berkaitan dengan kelipatan dan faktor dalam konteks kehidupan sehari-hari.',
    tp: 'Menerapkan konsep KPK dan FPB untuk menyelesaikan masalah nyata terkait interval waktu berulang dan pembagian merata dengan strategi logis.',
    indicators: [
      'Menganalisis putaran berulang kipas angin dengan kecepatan konstan',
      'Menyusun rasio dan kelipatan putaran yang seimbang',
      'Membuktikan hasil hitung persekutuan putaran secara terperinci'
    ],
    targetCompetency: 'numeracy',
    cognitiveLevel: 'C4',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Temukan dan potret kipas angin yang berputar di ruang kelas atau lorong sekolah. Hitung jumlah baling-balingnya dan pergerakan konstan berulang untuk memvisualisasikan kelipatan putaran.',
    isActive: false,
    createdAt: '2026-09-11',
    suggestedObjects: ['Kipas angin dinding kelas', 'Kipas angin langit-langit', 'Baling-baling exhaust fan']
  },
  {
    id: 'mission-kpk-fpb-3',
    idMapel: 'matematika',
    title: 'Misi 3: Pembagian Ubin Kelas',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Matematika',
    material: 'Kelipatan Persekutuan Terkecil (KPK) & Faktor Persekutuan Terbesar (FPB)',
    cp: 'Peserta didik dapat memahami dan menyelesaikan masalah penalaran yang berkaitan dengan kelipatan dan faktor dalam konteks kehidupan sehari-hari.',
    tp: 'Menerapkan konsep KPK dan FPB untuk menyelesaikan masalah nyata terkait interval waktu berulang dan pembagian merata dengan strategi logis.',
    indicators: [
      'Mengidentifikasi pembagian area lantai kelas secara presisi menggunakan ubin',
      'Menghitung faktor persekutuan terbesar (FPB) dari ukuran panjang dan lebar lantai',
      'Menyimpulkan rancangan ubin ideal tanpa tersisa'
    ],
    targetCompetency: 'numeracy',
    cognitiveLevel: 'C5',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Temukan dan potret susunan ubin lantai persegi di dalam kelas atau lorong. Hitung bagaimana ubin-ubin tersebut membagi ruangan secara merata untuk memahami konsep faktor pembagi terbesar.',
    isActive: false,
    createdAt: '2026-09-12',
    suggestedObjects: ['Ubin lantai kelas persegi', 'Keramik tangga sekolah', 'Paving block halaman depan']
  },
  {
    id: 'mission-kpk-fpb-4',
    idMapel: 'matematika',
    title: 'Misi 4: Susunan Kue Kantin',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Matematika',
    material: 'Kelipatan Persekutuan Terkecil (KPK) & Faktor Persekutuan Terbesar (FPB)',
    cp: 'Peserta didik dapat memahami dan menyelesaikan masalah penalaran yang berkaitan dengan kelipatan dan faktor dalam konteks kehidupan sehari-hari.',
    tp: 'Menerapkan konsep KPK dan FPB untuk menyelesaikan masalah nyata terkait interval waktu berulang dan pembagian merata dengan strategi logis.',
    indicators: [
      'Menganalisis pengelompokkan jenis jajanan pasar di nampan kantin sehat',
      'Menentukan jumlah piring saji maksimal yang dibutuhkan untuk membagi kue sama rata (FPB)',
      'Menyajikan visualisasi pembagian merata makanan'
    ],
    targetCompetency: 'numeracy',
    cognitiveLevel: 'C6',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Kunjungi kantin sekolah dan potret jajanan pasar atau kue yang diletakkan berjajar secara rapi di nampan. Amati bagaimana kue tersebut dikelompokkan secara merata untuk mempelajari FPB.',
    isActive: false,
    createdAt: '2026-09-13',
    suggestedObjects: ['Kue donat di piring saji', 'Lemper di nampan mika', 'Pastel goreng di baki kantin']
  },

  // ==================== IPAS (EKOSISTEM) ====================
  {
    id: 'mission-ipas-ekosistem',
    idMapel: 'ipas',
    title: 'Misi 1: Menemukan Produsen Hijau',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'IPAS',
    material: 'Ekosistem dan Keseimbangan Alam di Sekitar Kita',
    cp: 'Peserta didik menyelidiki bagaimana hubungan saling ketergantungan antara komponen biotik dan abiotik membentuk keseimbangan ekosistem.',
    tp: 'Menganalisis peran objek di lingkungan sekolah dalam mendukung kehidupan makhluk hidup dan mengajukan argumen berbasis bukti visual.',
    indicators: [
      'Mengidentifikasi komponen produsen biotik pada tanaman hijau yang difoto',
      'Menjelaskan peran klorofil dan fotosintesis dalam rantai makanan sekolah',
      'Menyusun deskripsi ketergantungan makhluk hidup lain kepada tanaman'
    ],
    targetCompetency: 'both',
    cognitiveLevel: 'C4',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Potret tanaman hijau atau pohon di sekitar halaman sekolah yang berperan sebagai produsen dalam rantai makanan, penghasil oksigen pendukung kehidupan ekosistem.',
    isActive: false,
    createdAt: '2026-09-08',
    suggestedObjects: ['Pohon peneduh di lapangan upacara', 'Tanaman lidah mertua di koridor', 'Rumput hijau subur di taman']
  },
  {
    id: 'mission-ipas-ekosistem-2',
    idMapel: 'ipas',
    title: 'Misi 2: Menyelidiki Komponen Abiotik',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'IPAS',
    material: 'Ekosistem dan Keseimbangan Alam di Sekitar Kita',
    cp: 'Peserta didik menyelidiki bagaimana hubungan saling ketergantungan antara komponen biotik dan abiotik membentuk keseimbangan ekosistem.',
    tp: 'Menganalisis peran objek di lingkungan sekolah dalam mendukung kehidupan makhluk hidup dan mengajukan argumen berbasis bukti visual.',
    indicators: [
      'Mengidentifikasi komponen non-hidup (abiotik) pendukung kesuburan tanaman',
      'Menjelaskan pengaruh kelembapan tanah atau batuan terhadap ekosistem mikro',
      'Menganalisis interaksi tanah-air-udara dengan tanaman pot'
    ],
    targetCompetency: 'both',
    cognitiveLevel: 'C4',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Temukan dan potret komponen tidak hidup (abiotik) seperti tanah, batu, atau genangan air yang membantu pertumbuhan tanaman dan menyokong kehidupan mikroorganisme sekitar.',
    isActive: false,
    createdAt: '2026-09-09',
    suggestedObjects: ['Tanah hitam subur di dalam pot', 'Bebatuan kerikil di kolam', 'Genangan air/air kran penyiram']
  },
  {
    id: 'mission-ipas-ekosistem-3',
    idMapel: 'ipas',
    title: 'Misi 3: Interaksi Makhluk Hidup',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'IPAS',
    material: 'Ekosistem dan Keseimbangan Alam di Sekitar Kita',
    cp: 'Peserta didik menyelidiki bagaimana hubungan saling ketergantungan antara komponen biotik dan abiotik membentuk keseimbangan ekosistem.',
    tp: 'Menganalisis peran objek di lingkungan sekolah dalam mendukung kehidupan makhluk hidup dan mengajukan argumen berbasis bukti visual.',
    indicators: [
      'Menemukan contoh simbiosis atau interaksi nyata antar makhluk hidup berbeda di sekolah',
      'Mendeskripsikan pergerakan atau perilaku serangga pendukung penyerbukan',
      'Menilai kestabilan interaksi biotik mikro'
    ],
    targetCompetency: 'both',
    cognitiveLevel: 'C5',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Amati dan potret interaksi atau hubungan nyata antara makhluk hidup berbeda, misalnya serangga kecil di daun, semut beriringan mencari makan, atau kupu-kupu yang hinggap di bunga.',
    isActive: false,
    createdAt: '2026-09-10',
    suggestedObjects: ['Semut hitam berbaris di batang pohon', 'Lebah atau kupu-kupu di mahkota bunga', 'Burung pipit bertengger di kabel listrik']
  },
  {
    id: 'mission-ipas-ekosistem-4',
    idMapel: 'ipas',
    title: 'Misi 4: Menjaga Keseimbangan dengan Tempat Sampah',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'IPAS',
    material: 'Ekosistem dan Keseimbangan Alam di Sekitar Kita',
    cp: 'Peserta didik menyelidiki bagaimana hubungan saling ketergantungan antara komponen biotik dan abiotik membentuk keseimbangan ekosistem.',
    tp: 'Menganalisis peran objek di lingkungan sekolah dalam mendukung kehidupan makhluk hidup dan mengajukan argumen berbasis bukti visual.',
    indicators: [
      'Menganalisis dampak pemilahan sampah organik dan anorganik bagi kesuburan tanah',
      'Menghubungkan kebersihan drainase dengan kesehatan ekosistem sekolah',
      'Mengusulkan aksi pelestarian lingkungan berbasis bukti visual'
    ],
    targetCompetency: 'both',
    cognitiveLevel: 'C6',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Potret sarana penjaga keseimbangan alam buatan di sekolah, seperti tempat sampah pilah atau saluran drainase air untuk menganalisis kebersihan dan pencegahan kerusakan ekosistem.',
    isActive: false,
    createdAt: '2026-09-11',
    suggestedObjects: ['Tempat sampah terpilah tiga warna', 'Saluran air bersih terawat', 'Komposter sampah organik daun']
  },

  // ==================== BAHASA INDONESIA (TEKS DESKRIPSI) ====================
  {
    id: 'mission-b-indo-deskripsi',
    idMapel: 'bahasa_indonesia',
    title: 'Misi 1: Keindahan Mading Sekolah',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Bahasa Indonesia',
    material: 'Teks Deskripsi Berbasis Panca Indra & Observasi Nyata',
    cp: 'Peserta didik mampu menulis teks deskripsi terperinci dengan memperhatikan ciri fisik, fungsi, dan kesan yang dirasakan.',
    tp: 'Menyusun deskripsi mendalam tentang suatu objek nyata di sekolah dengan kosakata baku, rincian pancaindra, dan bukti observasi.',
    indicators: [
      'Mengidentifikasi detail visual warna, bentuk, dan susunan mading sekolah',
      'Menggunakan kata sifat penginderaan visual yang kaya dan relevan',
      'Menyusun kerangka paragraf pembuka teks deskripsi objek mading'
    ],
    targetCompetency: 'literacy',
    cognitiveLevel: 'C4',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Cari dan potret Majalah Dinding (mading) sekolah yang penuh warna. Amati tata letak kertas, tulisan tangan, serta gambar dekoratif untuk bahan teks deskripsi visual pancaindra.',
    isActive: false,
    createdAt: '2026-09-05',
    suggestedObjects: ['Papan mading lobi sekolah', 'Kliping puisi bertulisan rapi', 'Gambar hiasan origami kertas warna-warni']
  },
  {
    id: 'mission-b-indo-deskripsi-2',
    idMapel: 'bahasa_indonesia',
    title: 'Misi 2: Kerapian Rak Perpustakaan',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Bahasa Indonesia',
    material: 'Teks Deskripsi Berbasis Panca Indra & Observasi Nyata',
    cp: 'Peserta didik mampu menulis teks deskripsi terperinci dengan memperhatikan ciri fisik, fungsi, dan kesan yang dirasakan.',
    tp: 'Menyusun deskripsi mendalam tentang suatu objek nyata di sekolah dengan kosakata baku, rincian pancaindra, dan bukti observasi.',
    indicators: [
      'Menemukan ciri fisik bahan, ukuran, dan tekstur rak buku perpustakaan',
      'Mendeskripsikan keheningan atmosfer perpustakaan menggunakan panca indera pendengaran dan perasaan',
      'Mengembangkan tulisan koheren tanpa menyisipkan asumsi fiktif'
    ],
    targetCompetency: 'literacy',
    cognitiveLevel: 'C4',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Kunjungi perpustakaan sekolah and potret deretan buku yang tersusun rapi di rak kayu. Rasakan kesan ketenangan dan kerapian susunan buku untuk memperkaya teks deskripsi fisik objek.',
    isActive: false,
    createdAt: '2026-09-06',
    suggestedObjects: ['Deretan novel cerita nusantara', 'Tumpukan kamus besar berdebu tipis', 'Papan penunjuk kategori buku kayu']
  },
  {
    id: 'mission-b-indo-deskripsi-3',
    idMapel: 'bahasa_indonesia',
    title: 'Misi 3: Aromatik Kantin Sehat',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Bahasa Indonesia',
    material: 'Teks Deskripsi Berbasis Panca Indra & Observasi Nyata',
    cp: 'Peserta didik mampu menulis teks deskripsi terperinci dengan memperhatikan ciri fisik, fungsi, dan kesan yang dirasakan.',
    tp: 'Menyusun deskripsi mendalam tentang suatu objek nyata di sekolah dengan kosakata baku, rincian pancaindra, dan bukti observasi.',
    indicators: [
      'Menggali deskripsi sensorik aroma, rasa, dan kehangatan etalase kantin',
      'Menuliskan detail fisik kemasan, kebersihan, dan susunan nampan saji',
      'Menyatukan pengamatan panca indra ke dalam kesimpulan utuh teks deskripsi'
    ],
    targetCompetency: 'literacy',
    cognitiveLevel: 'C5',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Potret suasana atau etalase makanan bersih di kantin sekolah. Amati bentuk wadah saji, warna makanan hangat, serta aroma lezat yang tercium untuk melatih menulis deskripsi pancaindra penciuman.',
    isActive: false,
    createdAt: '2026-09-07',
    suggestedObjects: ['Etalase kaca penutup makanan', 'Nampan saji berisi kue tradisional', 'Daftar menu makanan bersih tertempel dinding']
  },
  {
    id: 'mission-b-indo-deskripsi-4',
    idMapel: 'bahasa_indonesia',
    title: 'Misi 4: Gerbang Sekolah yang Gagah',
    grade: 'Kelas V',
    phase: 'Fase C',
    subject: 'Bahasa Indonesia',
    material: 'Teks Deskripsi Berbasis Panca Indra & Observasi Nyata',
    cp: 'Peserta didik mampu menulis teks deskripsi terperinci dengan memperhatikan ciri fisik, fungsi, dan kesan yang dirasakan.',
    tp: 'Menyusun deskripsi mendalam tentang suatu objek nyata di sekolah dengan kosakata baku, rincian pancaindra, dan bukti observasi.',
    indicators: [
      'Mendeskripsikan material, ketebalan, dan ukuran kokoh dari tiang/gerbang sekolah',
      'Menggambarkan kesan kemegahan atau keindahan gerbang depan sekolah',
      'Menyusun karya teks deskripsi akhir dengan bahasa baku yang objektif dan rapi'
    ],
    targetCompetency: 'literacy',
    cognitiveLevel: 'C6',
    strictCurriculumMode: true,
    features: {
      adaptiveDifficulty: true,
      scaffolding: true,
      reasoning: true,
      evidence: true,
      reflection: true,
      presentation: true,
      peerQuestion: true
    },
    description: 'Pergilah ke area depan sekolah, potret pilar gerbang utama sekolah atau papan nama sekolah. Amati bahan pembuatannya (seperti besi atau semen kokoh) untuk mendeskripsikan ciri fisik kekokohan dan fungsinya.',
    isActive: false,
    createdAt: '2026-09-08',
    suggestedObjects: ['Pilar beton gerbang berlapis batu alam', 'Papan nama sekolah dari logam mengkilap', 'Tanaman hias menjalar di tembok pagar depan']
  }
];

export const FREE_EXPLORATION_MISSION: LearningMission = {
  id: 'mission-eksplorasi-bebas',
  idMapel: 'tematik',
  title: 'Eksplorasi Lingkungan Bebas (Deteksi Otomatis AI)',
  grade: 'Kelas V',
  phase: 'Fase C',
  subject: 'Tematik Kontekstual',
  material: 'Literasi Visual & Penalaran Konkret di Sekitar Kita',
  cp: 'Peserta didik mengamati objek konkret di lingkungan sekitar dan mengidentifikasi fenomena keteraturan ilmiah, pola kuantitatif, atau deskripsi objek nyata.',
  tp: 'Menghubungkan objek nyata di sekitar dengan konsep sains, matematika, atau deskripsi bahasa secara logis dan kritis.',
  indicators: [
    'Mengamati dan memotret fenomena nyata di lingkungan sekolah atau rumah',
    'Menjelaskan karakteristik, bentuk, atau fungsi objek secara terperinci',
    'Menemukan keterkaitan objek dengan konsep pengetahuan kontekstual'
  ],
  targetCompetency: 'both',
  cognitiveLevel: 'C4-C6',
  strictCurriculumMode: false,
  features: {
    adaptiveDifficulty: true,
    scaffolding: true,
    reasoning: true,
    evidence: true,
    reflection: true,
    presentation: true,
    peerQuestion: true
  },
  description: 'Bebas potret objek apa pun di sekolah atau sekitarmu (tumbuhan, alat, bangunan, ubin, dll). Kecerdasan buatan NARASA AI akan menganalisis objek dan mengaitkannya dengan topik kurikulum yang paling cocok.',
  isActive: true,
  createdAt: '2026-09-24',
  suggestedObjects: ['Tumbuhan / bunga di taman', 'Struktur bangunan atau pola ubin', 'Peralatan kelas / lingkungan', 'Benda apa pun di sekitarmu']
};

export interface SamplePhotoItem {
  id: string;
  name: string;
  category: string;
  location: string;
  imageUrl: string;
  description: string;
  tags: string[];
}

export const SAMPLE_REAL_OBJECTS: SamplePhotoItem[] = [
  {
    id: 'sample-stairs',
    name: 'Deret Undakan Tangga & Ubin Sekolah',
    category: 'Struktur Bangunan',
    location: 'Tangga penghubung lantai 1 dan 2',
    imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
    description: 'Susunan anak tangga bertingkat dengan penanda jarak teratur dan ubin lantai bermotif barisan kelipatan.',
    tags: ['Interval berulang', 'Kelipatan jarak', 'Geometri', 'KPK FPB']
  },
  {
    id: 'sample-tree',
    name: 'Pohon Ketapang Lapangan Upacara',
    category: 'Lingkungan Alam',
    location: 'Sisi timur lapangan sekolah',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    description: 'Pohon berdaun lebat dengan naungan teduh, dahan bertingkat, dan burung pipit yang hinggap.',
    tags: ['Biotik', 'Ekosistem', 'Fotosintesis', 'Tinggi pohon', 'Teks Deskripsi']
  },
  {
    id: 'sample-trash-bins',
    name: 'Tempat Sampah Pilah 3 Warna',
    category: 'Fasilitas Kebersihan',
    location: 'Depan pintu perpustakaan sekolah',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    description: 'Tiga tong sampah berdampingan: hijau (organik), kuning (anorganik), dan merah (B3/residu).',
    tags: ['Volume', 'Kategori', 'Gotong royong', 'Statistika', 'Kebersihan']
  },
  {
    id: 'sample-bookshelf',
    name: 'Rak Buku Cerita Nusantara',
    category: 'Perpustakaan',
    location: 'Pojok baca ruang perpustakaan',
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80',
    description: 'Rak kayu 4 tingkat berisi tumpukan buku tematik beraneka warna dengan label nomor seri.',
    tags: ['Klasifikasi', 'Penjumlahan seri', 'Literasi teks', 'Perkalian kelompok']
  },
  {
    id: 'sample-bicycle',
    name: 'Sepeda Gunung di Parkiran Murid',
    category: 'Transportasi',
    location: 'Area parkir sepeda belakang mushola',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
    description: 'Sepeda beroda jeruji dua dengan gir rantai depan dan belakang serta speedometer digital.',
    tags: ['Keliling lingkaran', 'Rasio gigi', 'Energi gerak', 'Gaya gesek']
  },
  {
    id: 'sample-canteen-table',
    name: 'Meja Sajian Kantin Sehat',
    category: 'Kantin Sekolah',
    location: 'Stan Ibu Nurul lorong kantin',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    description: 'Piring dan wadah berisi 24 pastel isi sayur dan 36 lemper ketan yang ditata rapi dalam baris.',
    tags: ['FPB pembagian isi kotak', 'Kandungan gizi', 'Aritmetika sosial', 'Ekonomi']
  }
];

export const INITIAL_COMPLETED_SESSION: StudentActivitySession = {
  id: 'session-adit-interval-kpk',
  missionId: 'mission-kpk-fpb',
  missionTitle: 'Eksplorasi Pola Interval & Keteraturan Berulang',
  subject: 'Matematika',
  studentId: 'user-student-1',
  studentName: 'Adit Pratama',
  image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
  imageLabel: 'Pola Susunan Undakan Tangga & Ubin Sekolah',
  learningBridge: {
    detectedObject: 'Pola susunan undakan tangga dan ubin teratur',
    compatibility: 'Strong',
    compatibilityReason: 'Susunan undakan tangga dan penanda garis berulang adalah representasi interval waktu dan jarak yang sangat konkret untuk konsep KPK dan kelipatan.',
    observation: 'Saya melihat susunan anak tangga sekolah dengan penanda reflektor garis setiap kelipatan tertentu dan ubin berjarak sama. Pola ini berulang secara teratur di setiap undakan.',
    context: 'Pola keteraturan undakan dan interval langkah',
    learningBridge: 'Susunan undakan bertingkat menunjukkan pola yang berulang secara berkala. Jika ada dua penanda dengan selang jarak atau kegiatan tertentu (misalnya bel piket setiap 4 menit dan alarm stasiun baca setiap 6 menit), waktu mereka berbunyi bersama dapat dihitung menggunakan Kelipatan Persekutuan Terkecil (KPK).',
    simpleMaterialSummary: 'KPK (Kelipatan Persekutuan Terkecil) adalah angka kelipatan yang sama dan paling kecil dari dua bilangan atau lebih. Bayangkan seperti dua pelari yang melangkah dengan panjang berbeda lalu menginjak garis yang sama pada jarak tertentu!',
    soloTaxonomyLevel: 'Relational',
    soloDescription: 'Siswa berhasil menghubungkan pengamatan pola susunan undakan dengan konsep interval waktu berulang dan prinsip kelipatan persekutuan terkecil (KPK).',
    guidingQuestions: [
      'Bagaimana susunan berulang yang teratur bisa membantu kita memperkirakan titik temu dua jadwal atau jarak berbeda?',
      'Pernahkah kamu memperhatikan bunyi bel sekolah yang berdering bersamaan? Kapan itu terjadi?'
    ],
    subject: 'Matematika',
    material: 'KPK dan FPB dalam Kehidupan Sehari-hari',
    learningTarget: 'Menerapkan konsep KPK untuk mencari titik waktu pertemuan dua interval berulang',
    cognitiveLevel: 'C4-C6',
    questions: [
      {
        id: 'q-kpk-1',
        stage: 'challenge',
        title: 'Tantangan Pemecahan Masalah',
        question: 'Pada jadwal kelas, bel pengingat piket berbunyi setiap 4 menit, sedangkan alarm ganti stasiun baca berbunyi setiap 6 menit. Jika keduanya berbunyi bersamaan pada pukul 08.00, pada menit ke berapa lagi keduanya akan berbunyi bersamaan untuk pertama kali?',
        inputType: 'text',
        conceptTag: 'Penentuan KPK',
        scaffolding: {
          level1: 'Coba tuliskan menit-menit kelipatan dari bel piket (kelipatan 4) dan bel stasiun baca (kelipatan 6).',
          level2: 'Apakah kita mencari angka persekutuan yang paling kecil dari kedua jadwal tersebut?',
          level3: 'Kelipatan 4 = 4, 8, 12, 16... Kelipatan 6 = 6, 12, 18... Mana angka pertama yang sama pada kedua deret?',
          level4: 'Bayangkan dua katak melompat: katak pertama melompat 4 langkah sekali, katak kedua 6 langkah sekali. Kapan mereka mendarat di batu yang sama?'
        }
      },
      {
        id: 'q-kpk-2',
        stage: 'reasoning',
        title: 'Alasan dan Cara Berpikir',
        question: 'Mengapa kamu memilih menggunakan konsep KPK (Kelipatan Persekutuan Terkecil) dan bukan FPB untuk masalah jadwal berulang ini?',
        inputType: 'text',
        conceptTag: 'Penalaran Matematis',
        scaffolding: {
          level1: 'Ingat kata kuncinya: apakah kita membagi suatu kumpulan benda menjadi bagian lebih kecil, atau mencari waktu pertemuan di masa depan yang makin besar?',
          level2: 'KPK digunakan saat ada kegiatan yang berulang pada interval waktu tertentu dan kita ingin tahu kapan bertemu lagi.',
          level3: 'FPB untuk membagi adil, KPK untuk jadwal berulang. Jelaskan perbedaan kedua kebutuhan ini pada soal ini.',
          level4: 'Jika membagi 12 kue ke beberapa teman itu FPB. Tapi jika kegiatan berulang tiap beberapa menit, itu KPK.'
        }
      },
      {
        id: 'q-kpk-3',
        stage: 'evidence',
        title: 'Bukti & Langkah Perhitungan',
        question: 'Tuliskan langkah perhitunganmu dengan jelas! Tunjukkan deret kelipatan atau pohon faktor yang menjadi bukti jawabanmu.',
        inputType: 'text',
        conceptTag: 'Pembuktian Konkret',
        scaffolding: {
          level1: 'Tuliskan faktorisasi prima dari 4 dan 6, atau deret kelipatan keduanya.',
          level2: 'Faktorisasi: 4 = 2², 6 = 2 × 3. Untuk KPK, ambil semua faktor dengan pangkat terbesar.',
          level3: 'KPK = 2² × 3 = 4 × 3 = 12. Jadi menit ke-12 (pukul 08.12).',
          level4: 'Periksa kembali: 12 bisa dibagi 4 (hasil 3) dan 12 bisa dibagi 6 (hasil 2). Pas!'
        }
      }
    ]
  },
  answers: {
    challengeAnswer: 'Kedua bel akan berbunyi bersamaan lagi setelah 12 menit, yaitu pada pukul 08.12.',
    reason: 'Saya memilih konsep KPK karena kedua kegiatan berlangsung secara berulang terus menerus dengan interval tertentu. Kita mencari waktu ke depan saat kedua kelipatan bertemu di titik yang sama paling cepat, bukan membagi benda.',
    evidence: 'Bukti perhitungan saya: Kelipatan 4 = 4, 8, 12, 16, 20. Kelipatan 6 = 6, 12, 18, 24. Angka persekutuan pertama yang sama di kedua baris adalah 12. Menggunakan pohon faktor: 4 = 2², 6 = 2 × 3. KPK = 2² × 3 = 12.',
    strategy: 'Strategi saya adalah menuliskan tabel kelipatan di buku coretan, lalu melingkari angka kembar terkecil. Setelah itu saya buktikan ulang dengan faktorisasi prima.',
    conclusion: 'Jadi, jika ada dua peristiwa yang berulang dengan selang waktu 4 dan 6, mereka pasti bertemu setiap kelipatan 12 menit sekali.'
  },
  scaffoldingHistory: [
    {
      questionId: 'q-kpk-1',
      level: 1,
      hintText: 'Coba tuliskan menit-menit kelipatan dari bel piket (kelipatan 4) dan bel stasiun baca (kelipatan 6).',
      requestedAt: '2026-09-15 09:24'
    }
  ],
  reflection: {
    q1Found: 'Saya menemukan bahwa interval anak tangga dan susunan berulang sangat berhubungan dengan kelipatan angka dalam matematika.',
    q2Learned: 'Saya belajar membedakan kapan harus menggunakan KPK dan kapan FPB. Sekarang saya tahu kalau jadwal dan interval waktu itu pakai KPK.',
    q3Hardest: 'Bagian yang paling menantang adalah menjelaskan alasannya dengan kata-kata sendiri tanpa cuma menghafal rumus.',
    q4Solved: 'Saya membayangkan dua kejadian berjalan bersamaan dan menuliskan kelipatan menitnya satu per satu di kertas.',
    q5Improvement: 'Pada misi berikutnya, saya ingin mencoba menyelesaikan masalah dengan pohon faktor lebih cepat dan membuat gambar diagramnya.'
  },
  presentation: [
    {
      id: 'slide-1',
      slideNumber: 1,
      title: 'Hasil Eksplorasi Saya: Pola Interval & KPK',
      subtitle: 'Misi Matematika Kontekstual — Kelas V SDN 01 Nusantara',
      content: 'Halo teman-teman! Saya Adit Pratama. Hari ini saya menemukan matematika tersembunyi di dalam pola keteraturan dan interval berulang di sekitar sekolah.',
      image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
      speakingNotes: 'Beri salam pembuka dengan percaya diri. Sebutkan namamu dan objek menarik yang kamu amati di kelas.',
      layout: 'title'
    },
    {
      id: 'slide-2',
      slideNumber: 2,
      title: 'Apa yang Saya Temukan?',
      subtitle: 'Observasi Visual Objek Nyata',
      content: 'Dari foto susunan undakan tangga dan pola ubin sekolah, saya melihat pola berulang dengan interval yang teratur dan konsisten di setiap langkah.',
      bullets: [
        'Susunan undakan bertingkat berjarak sama',
        'Penanda langkah berjarak kelipatan teratur',
        'Pola pengulangan jarak dan waktu yang konstan'
      ],
      image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
      speakingNotes: 'Arahkan teman-teman melihat foto observasi. Jelaskan bagian-bagian yang kamu amati secara rinci.',
      layout: 'split-photo'
    },
    {
      id: 'slide-3',
      slideNumber: 3,
      title: 'Hubungannya dengan Pelajaran',
      subtitle: 'AI Learning Bridge: Pola Interval ke KPK & FPB',
      content: 'Pola keteraturan adalah contoh nyata dari kejadian berulang (interval). Ketika dua hal terjadi pada selang waktu atau jarak berbeda, titik pertemuannya diatur oleh konsep Kelipatan Persekutuan Terkecil (KPK).',
      bullets: [
        'Interval = waktu atau jarak yang berulang berkala',
        'KPK = titik temu pertama dari dua interval berbeda',
        'Bukan sekadar rumus hafalan, tapi pola nyata di sekitar kita'
      ],
      speakingNotes: 'Jelaskan hubungan antara ritme keteraturan dengan konsep KPK yang diberikan oleh guru.',
      layout: 'observation'
    },
    {
      id: 'slide-4',
      slideNumber: 4,
      title: 'Tantangan Saya',
      subtitle: 'Masalah Nyata yang Harus Diselesaikan',
      content: 'Bel piket kelas berbunyi setiap 4 menit. Bel stasiun baca berbunyi setiap 6 menit. Jika keduanya berbunyi bersamaan pukul 08.00, kapan keduanya akan berbunyi bersama lagi?',
      bullets: [
        'Kegiatan A: setiap 4 menit',
        'Kegiatan B: setiap 6 menit',
        'Waktu awal: 08.00 WIB',
        'Target: Menemukan waktu perjumpaan berikutnya'
      ],
      speakingNotes: 'Bacakan masalahnya dengan jelas agar teman-teman paham tantangan yang kamu hadapi.',
      layout: 'observation'
    },
    {
      id: 'slide-5',
      slideNumber: 5,
      title: 'Bukti & Data yang Digunakan',
      subtitle: 'Pencatatan Deret Kelipatan',
      content: 'Saya mencatat deret kelipatan dari menit ke menit untuk membuktikan waktu bertemunya kedua bel:',
      bullets: [
        'Kelipatan 4: 4, 8, 12, 16, 20, 24...',
        'Kelipatan 6: 6, 12, 18, 24, 30...',
        'Kelipatan yang sama: 12 dan 24',
        'Kelipatan terkecil yang sama adalah 12'
      ],
      speakingNotes: 'Tunjukkan deret kelipatan 4 dan 6. Ajak teman-teman melihat angka 12 yang pertama kali sama.',
      layout: 'reasoning'
    },
    {
      id: 'slide-6',
      slideNumber: 6,
      title: 'Cara Saya Berpikir & Strategi',
      subtitle: 'Mengapa Memilih KPK dan Bukan FPB?',
      content: 'Saya memilih konsep KPK karena kita mencari waktu masa depan saat dua jadwal berulang bertemu bersama. FPB digunakan jika kita ingin membagi kue atau kelompok secara adil menjadi lebih kecil.',
      bullets: [
        'KPK = Maju ke depan mencari perjumpaan jadwal',
        'FPB = Membagi adil ke dalam kelompok terbesar',
        'Menguji ulang hasil 12: 12 habis dibagi 4 dan habis dibagi 6'
      ],
      speakingNotes: 'Jelaskan alasan logismu mengapa masalah ini termasuk soal KPK, bukan soal FPB.',
      layout: 'reasoning'
    },
    {
      id: 'slide-7',
      slideNumber: 7,
      title: 'Solusi Saya',
      subtitle: 'Jawaban Akhir yang Terbukti Masuk Akal',
      content: 'Kedua bel akan berbunyi bersamaan pada menit ke-12 setelah pukul 08.00, yaitu tepat pada pukul 08.12 WIB.',
      bullets: [
        'Perhitungan: 08.00 + 12 menit = 08.12',
        'Bel piket berbunyi untuk ke-3 kalinya (3 × 4 = 12)',
        'Bel baca berbunyi untuk ke-2 kalinya (2 × 6 = 12)'
      ],
      speakingNotes: 'Sampaikan jawaban akhir dengan mantap dan sebutkan jam pastinya.',
      layout: 'solution'
    },
    {
      id: 'slide-8',
      slideNumber: 8,
      title: 'Kesimpulan Penting',
      subtitle: 'Hikmah Matematika di Sekitar Kita',
      content: 'Matematika tidak cuma ada di buku paket. Benda nyata seperti susunan anak tangga dan keteraturan di sekitar kita membantu memahami bagaimana konsep interval bekerja di dunia nyata melalui KPK.',
      bullets: [
        'KPK membantu menyinkronkan jadwal',
        'Observasi objek membuat matematika lebih mudah dibayangkan',
        'Penalaran lebih penting daripada sekadar menghafal rumus'
      ],
      speakingNotes: 'Tarik kesimpulan umum yang berkesan bagi seluruh kelas.',
      layout: 'conclusion'
    },
    {
      id: 'slide-9',
      slideNumber: 9,
      title: 'Refleksi Belajar Saya',
      subtitle: 'Tantangan dan Perbaikan ke Depan',
      content: 'Awalnya saya hampir tertukar antara KPK dan FPB. Bantuan petunjuk kecil dari NARASA AI membantu saya mengingat bahwa kejadian berulang itu adalah kelipatan. Saya ingin lebih mahir memakai faktorisasi prima.',
      bullets: [
        'Menemukan hubungan nyata jam & KPK',
        'Berhasil menuliskan alasan yang logis',
        'Ingin melatih diagram Venn pada eksplorasi berikutnya'
      ],
      speakingNotes: 'Jujur tentang kesulitanmu di awal dan bagaimana kamu berhasil mengatasinya.',
      layout: 'reflection'
    },
    {
      id: 'slide-10',
      slideNumber: 10,
      title: 'Terima Kasih!',
      subtitle: 'Ada pertanyaan atau tanggapan dari teman-teman?',
      content: '“Dunia di sekitarmu penuh dengan pertanyaan. Teruslah mengamati dan mencari alasannya!” — Adit Pratama',
      speakingNotes: 'Ucapkan terima kasih dan buka sesi tanya jawab untuk teman sekelas.',
      layout: 'conclusion'
    }
  ],
  peerQuestions: [
    {
      id: 'pq-1',
      askerName: 'Siti Rahma',
      avatar: studentGirlHijab,
      question: 'Adit, bagaimana kalau bel yang satu berbunyi tiap 4 menit dan yang satu lagi tiap 5 menit? Kapan ketemunya?',
      presenterAnswer: 'Karena 4 dan 5 tidak punya faktor prima persekutuan selain 1, maka KPK-nya langsung dikalikan: 4 × 5 = 20 menit! Jadi ketemunya menit ke-20.',
      aiCoachHint: 'Jawaban Adit sudah sangat tepat! Mengalikan dua bilangan yang saling prima adalah strategi cepat mencari KPK.',
      timestamp: 'Kemarin, 10:15'
    },
    {
      id: 'pq-2',
      askerName: 'Budi Santoso',
      avatar: studentBoy2,
      question: 'Kalau setelah pukul 08.12, kapan bunyi bersama lagi untuk kedua kalinya?',
      presenterAnswer: 'Tinggal ditambah 12 menit lagi dari 08.12, jadi pukul 08.24 (atau kelipatan kedua dari 12, yaitu 24 menit).',
      aiCoachHint: 'Bagus sekali! Kelipatan persekutuan berikutnya selalu mengikuti pola interval KPK tersebut.',
      timestamp: 'Kemarin, 10:20'
    }
  ],
  completedAt: '2026-09-15 10:30',
  status: 'completed',
  metrics: {
    literacyScore: 84,
    numeracyScore: 92,
    reasoningScore: 88,
    scaffoldingUsedCount: 1
  }
};

export const CLASS_STUDENTS_PROFILES: StudentProgressProfile[] = [
  {
    studentId: 'user-student-1',
    name: 'Adit Pratama',
    className: 'Kelas V-A',
    activitiesCount: 24,
    explorationsCount: 18,
    presentationsCount: 12,
    reflectionsCount: 20,
    scaffoldingCount: 8,
    literacyProgress: {
      locate: 88,
      understand: 85,
      interpret: 80,
      infer: 75,
      evaluate: 72,
      argument: 78,
      communicate: 82
    },
    numeracyProgress: {
      identify: 94,
      represent: 90,
      calculate: 88,
      apply: 85,
      strategy: 82,
      reason: 84,
      evaluate: 78,
      communicate: 80
    },
    overallLiteracy: 80,
    overallNumeracy: 85,
    overallReasoning: 81,
    overallCommunication: 81,
    recentBadges: ['explorer', 'thinker', 'evidence_hunter', 'problem_solver', 'presenter']
  },
  {
    studentId: 'user-student-2',
    name: 'Siti Rahma',
    className: 'Kelas V-A',
    activitiesCount: 22,
    explorationsCount: 16,
    presentationsCount: 10,
    reflectionsCount: 19,
    scaffoldingCount: 5,
    literacyProgress: {
      locate: 92,
      understand: 90,
      interpret: 88,
      infer: 82,
      evaluate: 80,
      argument: 85,
      communicate: 89
    },
    numeracyProgress: {
      identify: 85,
      represent: 80,
      calculate: 82,
      apply: 78,
      strategy: 75,
      reason: 76,
      evaluate: 74,
      communicate: 78
    },
    overallLiteracy: 87,
    overallNumeracy: 79,
    overallReasoning: 80,
    overallCommunication: 84,
    recentBadges: ['explorer', 'thinker', 'presenter', 'creator']
  },
  {
    studentId: 'user-student-3',
    name: 'Budi Santoso',
    className: 'Kelas V-A',
    activitiesCount: 19,
    explorationsCount: 14,
    presentationsCount: 8,
    reflectionsCount: 15,
    scaffoldingCount: 14,
    literacyProgress: {
      locate: 78,
      understand: 72,
      interpret: 68,
      infer: 65,
      evaluate: 60,
      argument: 66,
      communicate: 70
    },
    numeracyProgress: {
      identify: 82,
      represent: 76,
      calculate: 80,
      apply: 72,
      strategy: 68,
      reason: 70,
      evaluate: 64,
      communicate: 68
    },
    overallLiteracy: 70,
    overallNumeracy: 73,
    overallReasoning: 68,
    overallCommunication: 69,
    recentBadges: ['explorer', 'problem_solver']
  },
  {
    studentId: 'user-student-4',
    name: 'Rani Maharani',
    className: 'Kelas V-A',
    activitiesCount: 21,
    explorationsCount: 17,
    presentationsCount: 11,
    reflectionsCount: 18,
    scaffoldingCount: 7,
    literacyProgress: {
      locate: 86,
      understand: 84,
      interpret: 80,
      infer: 78,
      evaluate: 74,
      argument: 80,
      communicate: 82
    },
    numeracyProgress: {
      identify: 88,
      represent: 85,
      calculate: 84,
      apply: 82,
      strategy: 80,
      reason: 80,
      evaluate: 76,
      communicate: 81
    },
    overallLiteracy: 81,
    overallNumeracy: 82,
    overallReasoning: 80,
    overallCommunication: 82,
    recentBadges: ['explorer', 'thinker', 'evidence_hunter', 'presenter']
  }
];

export const ALL_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'explorer',
    title: '🔎 Explorer Sejati',
    description: 'Mengamati dan memotret 5 objek berbeda di lingkungan sekolah dengan teliti.',
    icon: 'Compass',
    isUnlocked: true,
    unlockedAt: '2026-09-12',
    color: '#4F8EF7'
  },
  {
    id: 'thinker',
    title: '🧠 Deep Thinker',
    description: 'Menyertakan alasan logis pada setiap jawaban tantangan tanpa melewatkan tahapan.',
    icon: 'Brain',
    isUnlocked: true,
    unlockedAt: '2026-09-14',
    color: '#7C5CFC'
  },
  {
    id: 'evidence_hunter',
    title: '🔍 Evidence Hunter',
    description: 'Menggunakan data visual foto dan langkah pembuktian konkret dalam solusi.',
    icon: 'SearchCheck',
    isUnlocked: true,
    unlockedAt: '2026-09-15',
    color: '#20C9A6'
  },
  {
    id: 'problem_solver',
    title: '💡 Problem Solver',
    description: 'Menyelesaikan tantangan kognitif tingkat tinggi (C4-C6) dengan mandiri.',
    icon: 'Lightbulb',
    isUnlocked: true,
    unlockedAt: '2026-09-15',
    color: '#FFC857'
  },
  {
    id: 'presenter',
    title: '🎤 Bintang Presenter',
    description: 'Menyusun dan membawakan presentasi hasil belajar di depan kelas dengan percaya diri.',
    icon: 'Mic',
    isUnlocked: true,
    unlockedAt: '2026-09-16',
    color: '#FF7A7A'
  },
  {
    id: 'creator',
    title: '🚀 Kreator Solusi',
    description: 'Membuat model pemecahan alternatif atau pertanyaan baru untuk teman sekelas.',
    icon: 'Sparkles',
    isUnlocked: false,
    color: '#9333EA'
  }
];

export const TEACHER_INSIGHTS: TeacherInsight[] = [
  {
    id: 'ti-1',
    title: 'Kekuatan: Murid Mahir Menemukan Bukti Sensorik Visual',
    type: 'strength',
    content: 'Sebagian besar murid (84%) sudah mampu mengidentifikasi objek dan menuliskan informasi kuantitatif dari foto secara rinci.',
    evidenceData: 'Rata-rata skor tahap Observasi & Identify mencapai 89/100 pada misi pola interval dan kantin.',
    targetMissions: ['mission-kpk-fpb', 'mission-ipas-ekosistem'],
    actionRecommendation: 'Pertahankan aktivitas observasi langsung. Mulai tingkatkan ke tahap evaluasi kritis (C5).'
  },
  {
    id: 'ti-2',
    title: 'Perhatian: Murid Membutuhkan Bantuan dalam Menjelaskan Bukti (Evidence)',
    type: 'need_scaffold',
    content: 'Beberapa murid (32%) langsung menuliskan jawaban akhir tanpa menguraikan deret kelipatan atau pohon faktor sebagai bukti verifikasi.',
    evidenceData: 'Level scaffolding yang paling sering diminta adalah Level 1 & 2 pada pertanyaan bukti matematis.',
    targetMissions: ['mission-kpk-fpb'],
    actionRecommendation: 'Aktifkan scaffolding otomatis bertingkat dan gunakan template kalimat bukti penuntun.'
  },
  {
    id: 'ti-3',
    title: 'Tips Pedagogis: Optimalkan Sesi Tanya Teman di Proyektor Kelas',
    type: 'pedagogical_tip',
    content: 'Saat presentasi kelas ditayangkan, interaksi tanya-jawab antar murid terbukti meningkatkan pemahaman nalar sebesar 18%.',
    evidenceData: 'Sesi peer question Adit & Siti menghasilkan retensi konsep KPK yang stabil pada kuis berikutnya.',
    targetMissions: ['mission-kpk-fpb', 'mission-b-indo-deskripsi'],
    actionRecommendation: 'Jadwalkan 10 menit di akhir jam pelajaran untuk fitur Presentasi Kelas.'
  }
];

export const ASSESSMENT_DATA: AssessmentRecord[] = [
  {
    id: 'ass-1',
    studentId: 'user-student-1',
    studentName: 'Adit Pratama',
    type: 'pre',
    literacyScore: 68,
    numeracyScore: 70,
    reasoningScore: 64,
    date: '2026-08-25',
    notes: 'Pemahaman dasar cukup baik, namun sering kesulitan merangkai alasan tertulis.'
  },
  {
    id: 'ass-2',
    studentId: 'user-student-1',
    studentName: 'Adit Pratama',
    type: 'post',
    literacyScore: 82,
    numeracyScore: 88,
    reasoningScore: 84,
    date: '2026-09-17',
    notes: 'Peningkatan signifikan pada artikulasi alasan dan pemilihan konsep KPK/FPB kontekstual.'
  },
  {
    id: 'ass-3',
    studentId: 'user-student-2',
    studentName: 'Siti Rahma',
    type: 'pre',
    literacyScore: 75,
    numeracyScore: 68,
    reasoningScore: 69,
    date: '2026-08-25',
    notes: 'Literasi awal tinggi, numerasi perlu peningkatan dalam permodelan soal cerita.'
  },
  {
    id: 'ass-4',
    studentId: 'user-student-2',
    studentName: 'Siti Rahma',
    type: 'post',
    literacyScore: 89,
    numeracyScore: 81,
    reasoningScore: 82,
    date: '2026-09-17',
    notes: 'Sangat baik dalam menghubungkan teks deskripsi dengan data kuantitatif.'
  }
];
