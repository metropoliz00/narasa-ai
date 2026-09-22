import { StudentGroup, ConceptQuiz, QuizSubmission, UserProfile, GroupObservationRecord, PresentationSettings } from '../types';

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
    durationMinutes: 15,
    targetCompetency: 'numeracy',
    passingScore: 75,
    totalQuestions: 4,
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
      },
      {
        id: 'q2',
        questionType: 'multiple_choice',
        criticalThinkingSkill: 'Evaluasi Bukti Pembagian Merata',
        cognitiveLevel: 'C4',
        conceptTag: 'Pembagian Merata FPB',
        image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Siswa kelompok piket kelas merapikan 36 buku tulis dan 24 pensil gambar dari lemari inventaris. Guru meminta alat tulis tersebut dikemas ke dalam sejumlah kotak hadiah untuk adik kelas dengan syarat setiap kotak memuat jenis dan jumlah barang yang sama banyak tanpa ada sisa.',
        scenario: 'Pengemasan paket alat tulis kelas merata tanpa sisa.',
        question: 'Pilihlah SEMUA pernyataan yang BENAR terkait rencana pengemasan alat tulis tersebut (Jawaban lebih dari satu):',
        options: [
          { id: 'opt_a', text: 'Jumlah paket terbanyak yang dapat dibentuk adalah 12 paket (FPB dari 36 dan 24).' },
          { id: 'opt_b', text: 'Setiap paket akan berisi tepat 3 buah buku tulis (36 ÷ 12).' },
          { id: 'opt_c', text: 'Setiap paket akan berisi tepat 2 buah pensil gambar (24 ÷ 12).' },
          { id: 'opt_d', text: 'Jumlah paket terbanyak adalah 72 paket karena menggunakan KPK.' }
        ],
        correctOptionIds: ['opt_a', 'opt_b', 'opt_c'],
        competencyType: 'numeracy',
        explanation: 'Membagi barang menjadi beberapa paket sama rata tanpa sisa hingga jumlah paket terbanyak menggunakan FPB. FPB(36, 24) = 12 paket. Tiap paket berisi 3 buku dan 2 pensil.'
      },
      {
        id: 'q3',
        questionType: 'true_false',
        criticalThinkingSkill: 'Inferensi & Verifikasi Hipotesis',
        cognitiveLevel: 'C4',
        conceptTag: 'Penalaran Metode Matematika',
        image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Dua armada Bus Sekolah beroperasi dari terminal yang sama: Bus Jalur 1 berangkat setiap 15 menit sekali, sedangkan Bus Jalur 2 berangkat setiap 20 menit sekali. Tepat pukul 06.00 pagi, kedua bus berangkat bersama-sama untuk putaran pertama.',
        scenario: 'Pemeriksaan validitas logika matematika dalam jadwal transportasi.',
        question: 'Berdasarkan wacana di sebelah kiri, tentukan apakah setiap pernyataan berikut bernilai BENAR atau SALAH:',
        statements: [
          {
            id: 's1',
            statement: 'Untuk mengetahui kapan kedua bus akan berangkat bersamaan lagi di waktu mendatang, kita harus mencari Kelipatan Persekutuan Terkecil (KPK) dari interval 15 dan 20.',
            correctAnswer: true
          },
          {
            id: 's2',
            statement: 'Kedua bus akan berangkat bersamaan kembali pada menit ke-35 setelah pukul 06.00 karena 15 + 20 = 35 menit.',
            correctAnswer: false
          },
          {
            id: 's3',
            statement: 'Kedua bus akan berangkat bersamaan tepat setiap 60 menit sekali (pukul 07.00, 08.00, dst.) karena KPK dari 15 dan 20 adalah 60.',
            correctAnswer: true
          }
        ],
        correctBooleanAnswer: false,
        competencyType: 'reasoning',
        explanation: 'Pernyataan 1 BENAR (kejadian berkala masa depan menggunakan KPK). Pernyataan 2 SALAH (waktu bersamaan bukan penjumlahan interval). Pernyataan 3 BENAR (KPK 15 dan 20 adalah 60 menit atau 1 jam).'
      },
      {
        id: 'q4',
        questionType: 'essay',
        criticalThinkingSkill: 'Sintesis Solusi Jadwal & Argumentasi Kritis',
        cognitiveLevel: 'C5',
        conceptTag: 'Optimasi Sistem Nyata',
        image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Di sekolah, Regu Adiwiyata menyiram taman setiap 3 hari sekali, Regu Perpustakaan mengecek buku setiap 4 hari sekali, dan Regu Kompos mengaduk pupuk setiap 6 hari sekali. Pada tanggal 1 Oktober, ketiga regu bertugas bersamaan. Pengurus kelas mengusulkan agar jadwal Regu Kompos diubah menjadi setiap 5 hari sekali agar mereka tidak terlalu sering bertugas serentak di hari yang sama.',
        scenario: 'Dilema penjadwalan gotong royong regu siswa sekolah.',
        question: 'Analisislah usulan tersebut! Hitung tanggal pertemuan berikutnya pada jadwal lama (3, 4, 6 hari) dan bandingkan jika jadwal diubah menjadi (3, 4, 5 hari). Apakah menurutmu perubahan tersebut menguntungkan? Jelaskan alasan kritismu!',
        essayRubric: 'Rubrik Penskoran Guru: Skor 21-25 jika menghitung KPK(3,4,6)=12 hari (tanggal 13 Oktober) dan KPK(3,4,5)=60 hari (30 November) secara tepat, serta memberikan argumentasi logis mengenai efektivitas beban kerja regu. Skor 11-20 jika perhitungan benar namun alasan singkat. Skor 1-10 jika perhitungan salah.',
        sampleAnswer: 'KPK lama (3,4,6) = 12 hari (bertemu lagi 13 Okt). KPK baru (3,4,5) = 60 hari (bertemu 60 hari kemudian). Usulan ini efektif karena ketiga regu tidak akan bentrok di hari yang sama selama 2 bulan ke depan.',
        maxScore: 25,
        competencyType: 'reasoning',
        explanation: 'Soal uraian ini menguji kemampuan menghitung KPK tiga bilangan sekaligus penalaran kritis dalam pengelolaan jadwal tim.'
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
    durationMinutes: 15,
    targetCompetency: 'both',
    passingScore: 75,
    totalQuestions: 4,
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
        image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Di kebun botani sekolah terdapat jaring-jaring makanan: Tanaman Sawi → Ulat Daun → Burung Pipit → Ular Pohon. Karena area sekitar dibangun gedung baru, burung pipit banyak bermigrasi sehingga populasinya berkurang dari 40 ekor menjadi tersisa 2 ekor saja dalam sebulan.',
        scenario: 'Observasi kebun botani sekolah dan penurunan populasi predator alami.',
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
      },
      {
        id: 'q2',
        questionType: 'multiple_choice',
        criticalThinkingSkill: 'Evaluasi Interaksi Komponen Biotik & Abiotik',
        cognitiveLevel: 'C4',
        conceptTag: 'Sinergi Ekosistem Tanah',
        image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Siswa meneliti sepetak tanah subur di bawah pohon rindang sekolah. Mereka menemukan cacing tanah yang bergerak di dalam lorong tanah, daun-daun kering yang membusuk, tetesan air hujan yang meresap, dan batu-batu kerikil kecil di permukaan.',
        scenario: 'Penyelidikan kesuburan tanah dan interaksi antar komponen ekosistem.',
        question: 'Pilihlah SEMUA pernyataan yang BENAR mengenai peran komponen pada stimulus wacana di sebelah kiri (Jawaban lebih dari satu):',
        options: [
          { id: 'opt_a', text: 'Cacing tanah (biotik) membuat lorong-lorong yang melancarkan aliran oksigen dan air ke akar tanaman.' },
          { id: 'opt_b', text: 'Daun kering yang membusuk menyediakan bahan organik yang akan diurai dekomposer menjadi humus kaya hara.' },
          { id: 'opt_c', text: 'Air resapan (abiotik) berperan melarutkan mineral tanah agar dapat diserap akar tumbuhan.' },
          { id: 'opt_d', text: 'Batu kerikil berfungsi sebagai produsen utama penghasil oksigen tanah.' }
        ],
        correctOptionIds: ['opt_a', 'opt_b', 'opt_c'],
        competencyType: 'both',
        explanation: 'Batu kerikil adalah benda abiotik bukan produsen. Cacing tanah, daun lapuk, dan air bekerja sama menyuburkan tanah dan mendukung pertumbuhan produsen.'
      },
      {
        id: 'q3',
        questionType: 'true_false',
        criticalThinkingSkill: 'Evaluasi Hipotesis Sains Lingkungan',
        cognitiveLevel: 'C5',
        conceptTag: 'Fungsi Dekomposer',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Di taman sekolah, terdapat tumpukan daun lapuk yang dihuni jamur kapang dan bakteri pengurai. Doni berpendapat: "Jika seluruh jamur dan bakteri pengurai di taman disemprot cairan kimia sampai mati bersih, taman sekolah akan lebih indah dan tanaman akan tumbuh lebih sehat karena terbebas dari organisme lain."',
        scenario: 'Pengujian hipotesis pemusnahan dekomposer pada siklus rantai makanan.',
        question: 'Berdasarkan prinsip aliran materi dan siklus nutrisi ekosistem di sebelah kiri, tentukan apakah setiap pernyataan berikut bernilai BENAR atau SALAH:',
        statements: [
          {
            id: 's1',
            statement: 'Bakteri dan jamur pengurai (dekomposer) berperan vital mendaur ulang zat hara dari sisa tanaman mati untuk diserap kembali oleh akar tanaman.',
            correctAnswer: true
          },
          {
            id: 's2',
            statement: 'Membasmi seluruh mikroorganisme pengurai tanah akan mempercepat pertumbuhan tanaman mawar karena tanah terbebas dari makhluk hidup lain.',
            correctAnswer: false
          },
          {
            id: 's3',
            statement: 'Keseimbangan ekosistem taman sekolah sangat bergantung pada interaksi timbal balik antara komponen biotik (pengurai, tanaman) dan komponen abiotik (tanah, air, udara).',
            correctAnswer: true
          }
        ],
        correctBooleanAnswer: false,
        competencyType: 'reasoning',
        explanation: 'Pernyataan 1 BENAR (dekomposer mendaur ulang materi). Pernyataan 2 SALAH (tanpa pengurai tanah menjadi tandus kekurangan mineral organik). Pernyataan 3 BENAR (keseimbangan ekosistem tercipta dari interaksi biotik-abiotik).'
      },
      {
        id: 'q4',
        questionType: 'essay',
        criticalThinkingSkill: 'Sintesis Solusi Konservasi Autentik',
        cognitiveLevel: 'C5',
        conceptTag: 'Pengendalian Hama Hayati',
        image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Di kebun sekolah, pohon jeruk terserang hama kutu putih. Petugas kebersihan sekolah hendak menyemprotkan insektisida kimia dosis tinggi setiap hari. Akan tetapi, kelompok siswa menyadari bahwa di kebun itu juga hidup lebah madu yang membantu penyerbukan bunga serta terdapat kolam ikan nila di sebelahnya.',
        scenario: 'Dilema pemanfaatan pestisida kimia versus keseimbangan ekosistem sekolah.',
        question: 'Sebagai siswa yang memiliki daya nalar kritis, rancanglah sebuah solusi alternatif ramah lingkungan untuk mengatasi hama kutu putih tanpa merusak rantai makanan! Jelaskan bagaimana solusimu menjaga lebah dan ikan tetap aman!',
        essayRubric: 'Rubrik Penskoran Guru: Skor 21-25 jika solusi realistis berbasis biologi (seperti pemanfaatan predator alami ladybug / semprotan nabati bawang putih dan sabun lerak), menjelaskan proteksi lebah dan ikan, serta logis. Skor 11-20 jika ide bagus namun kurang terinci. Skor 1-10 jika jawaban tidak ilmiah.',
        sampleAnswer: 'Solusi ramah lingkungan: Menggunakan musuh alami seperti kumbang koksi (ladybug) pemangsa kutu daun atau pestisida nabati berbahan rebusan daun mimba/bawang putih. Cara ini membasmi kutu tanpa racun kimia yang membunuh lebah dan meracuni kolam ikan.',
        maxScore: 25,
        competencyType: 'both',
        explanation: 'Soal menguji kemampuan sintesis ide ilmiah berbasis pemahaman rantai makanan dan pemecahan masalah nyata.'
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
    durationMinutes: 12,
    targetCompetency: 'literacy',
    passingScore: 75,
    totalQuestions: 4,
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
      },
      {
        id: 'q2',
        questionType: 'multiple_choice',
        criticalThinkingSkill: 'Evaluasi Fakta Objektif vs Opini Subjektif',
        cognitiveLevel: 'C4',
        conceptTag: 'Fakta vs Opini',
        image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Dalam kegiatan jurnalis cilik, empat siswa menuliskan kalimat deskripsi tentang tugu jam gerbang sekolah:\n(1) "Tugu jam itu tingginya 4 meter dengan dinding bata merah berlapis semen putih."\n(2) "Tugu jam tersebut tampak sangat membosankan dan kurang megah dibanding sekolah lain."\n(3) "Jarum panjang jam berdetak setiap satu detik mengelilingi piringan berdiameter 60 cm."\n(4) "Tugu jam sekolah kami adalah tugu paling terindah di seluruh kota."',
        scenario: 'Analisis kalimat pada laporan pengamatan observasi lapangan.',
        question: 'Pilihlah SEMUA kalimat yang merupakan FAKTA OBJEKTIF yang dapat diverifikasi datanya (Jawaban lebih dari satu):',
        options: [
          { id: 'opt_a', text: 'Kalimat (1) karena menyajikan ukuran tinggi 4 meter dan bahan material fisik yang nyata.' },
          { id: 'opt_b', text: 'Kalimat (2) karena menyatakan pendapat pribadi mengenai tampilan tugu.' },
          { id: 'opt_c', text: 'Kalimat (3) karena mencatat ukuran diameter 60 cm dan gerak jarum detik yang terukur.' },
          { id: 'opt_d', text: 'Kalimat (4) karena memuat klaim terindah yang tidak berstandar ukuran.' }
        ],
        correctOptionIds: ['opt_a', 'opt_c'],
        competencyType: 'reasoning',
        explanation: 'Kalimat (1) dan (3) adalah fakta objektif terukur tanpa kata sifat penilaian subjektif. Kalimat (2) dan (4) adalah opini pribadi.'
      },
      {
        id: 'q3',
        questionType: 'true_false',
        criticalThinkingSkill: 'Verifikasi Relevansi Bukti Citra & Kaidah Bahasa',
        cognitiveLevel: 'C4',
        conceptTag: 'Validasi Bukti Visual',
        image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Dalam menyusun portofolio pengamatan deskripsi sekolah, kelompok siswa menyertakan foto autentik objek nyata hasil jepretan kamera ponsel mereka, mencantumkan ukuran terukur, serta menuliskan catatan hasil wawancara dengan narasumber penjaga sekolah.',
        scenario: 'Kaidah penyusunan portofolio ilmiah dan penulisan deskripsi sekolah dasar.',
        question: 'Berdasarkan prinsip metodologi observasi dan literasi kritis di sebelah kiri, tentukan apakah setiap pernyataan berikut bernilai BENAR atau SALAH:',
        statements: [
          {
            id: 's1',
            statement: 'Menyertakan foto autentik hasil jepretan langsung siswa merupakan bukti data primer yang memperkuat keabsahan fakta dalam laporan deskripsi.',
            correctAnswer: true
          },
          {
            id: 's2',
            statement: 'Kalimat seperti "taman sekolah ini adalah taman terindah dan paling menakjubkan di dunia" tergolong sebagai kalimat fakta objektif.',
            correctAnswer: false
          },
          {
            id: 's3',
            statement: 'Teks deskripsi yang bermutu tinggi menyajikan ciri-ciri fisik objek yang terukur dan dapat diverifikasi oleh panca indra pembaca.',
            correctAnswer: true
          }
        ],
        correctBooleanAnswer: true,
        competencyType: 'literacy',
        explanation: 'Pernyataan 1 BENAR (foto autentik adalah bukti primer). Pernyataan 2 SALAH (kalimat tersebut merupakan opini subjektif dengan superlatif berlebih). Pernyataan 3 BENAR (deskripsi objektif bersandar pada data sensorik terverifikasi).'
      },
      {
        id: 'q4',
        questionType: 'essay',
        criticalThinkingSkill: 'Sintesis Penulisan Deskripsi Kritis',
        cognitiveLevel: 'C5',
        conceptTag: 'Konstruksi Paragraf Deskripsi Presisi',
        image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=700&auto=format&fit=crop&q=80',
        stimulusText: 'Perhatikan foto dan konteks di samping! Banyak siswa sering menulis deskripsi yang hanya berisi kata sifat umum seperti: "Tempat itu sangat bagus dan ramai." Hal ini membuat pembaca tidak bisa membayangkan wujud asli objek secara nyata.',
        scenario: 'Tantangan menulis deskripsi objektif bermutu tinggi.',
        question: 'Tuliskan sebuah paragraf deskripsi singkat (3-4 kalimat) tentang salah satu benda pengamatanmu di sekolah! Syarat: Wajib menyertakan minimal 2 rincian indra (misal warna/ukuran/bunyi/tekstur) dan HANYA menggunakan fakta terukur tanpa kata opini subjektif!',
        essayRubric: 'Rubrik Penskoran Guru: Skor 21-25 jika memuat 3-4 kalimat padu, minimal 2 rincian sensorik spesifik, bebas dari kata opini subjektif, dan runtut. Skor 11-20 jika ada 1 rincian sensorik atau masih tercampur opini. Skor 1-10 jika kalimat tidak membentuk teks deskripsi.',
        sampleAnswer: 'Contoh jawaban yang baik: "Meja guru di depan kelas terbuat dari kayu jati berwarna cokelat madu berukuran panjang 120 sentimeter dan lebar 70 sentimeter. Permukaannya dilapisi kaca bening setebal lima milimeter yang dingin dan licin saat disentuh. Di atas meja tersebut tertata rapi tiga tumpuk buku bersampul biru dan sebuah vas keramik putih."',
        maxScore: 25,
        competencyType: 'literacy',
        explanation: 'Soal uraian melatih siswa menyusun teks deskripsi berbasis pengamatan sensorik objektif dan fakta konkret.'
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
    objectiveScore: 75,
    essayScore: 25,
    correctCount: 4,
    totalQuestions: 4,
    literacyScore: 95,
    numeracyScore: 100,
    reasoningScore: 100,
    predicate: 'Sangat Mahir',
    feedback: 'Luar biasa! Kelompok Garuda menunjukkan penalaran kritis, komputasi KPK/FPB tepat, dan analisis uraian optimasi jadwal sangat solutif.',
    selectedAnswers: {
      q1: 'opt_b',
      q2: ['opt_a', 'opt_b', 'opt_c'],
      q3: false,
      q4: 'KPK lama(3,4,6) = 12 hari (tanggal 13 Oktober). Jika diubah menjadi (3,4,5), KPK menjadi 60 hari. Usulan ini sangat efektif karena jadwal kerja regu tidak akan bentrok di hari yang sama selama 2 bulan ke depan, sehingga murid bisa fokus bertugas tanpa terbebani tugas ganda.'
    },
    essayGrading: {
      q4: {
        score: 25,
        maxScore: 25,
        feedback: 'Perhitungan KPK tiga bilangan tepat sempurna (12 hari vs 60 hari) dan kesimpulan beban kerja kelompok sangat matang.',
        gradedAt: '2026-09-17 10:15',
        teacherName: 'Dedy Nugraha, S.Pd.'
      }
    },
    hasEssay: true,
    needsManualGrading: false,
    isGradedByTeacher: true,
    completedAt: '2026-09-17 09:30',
    timeSpentSeconds: 420
  },
  {
    id: 'sub-2',
    quizId: 'quiz-ipas-ekosistem',
    quizTitle: 'Uji Pemahaman Berpikir Kritis: Dinamika Rantai Makanan & Ekosistem',
    subject: 'IPAS',
    userId: 'user-student-1',
    userName: 'Adit Pratama',
    userAvatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    className: 'Kelas V-A',
    classId: 'V-A',
    schoolName: 'SDN 01 Nusantara',
    schoolId: 'SDN01',
    score: 99,
    objectiveScore: 75,
    essayScore: 24,
    correctCount: 4,
    totalQuestions: 4,
    literacyScore: 100,
    numeracyScore: 95,
    reasoningScore: 100,
    predicate: 'Sangat Mahir',
    feedback: 'Pemahaman konsep rantai makanan, identifikasi peran dekomposer, dan usulan insektisida alami sangat aplikatif dan ramah lingkungan.',
    selectedAnswers: {
      q1: 'opt_b',
      q2: ['opt_a', 'opt_b', 'opt_c'],
      q3: false,
      q4: 'Solusi ramah lingkungan alternatif adalah membuat semprotan nabati dari air rebusan daun mimba dan bawang putih dicampur sedikit sabun cuci piring ramah lingkungan. Selain itu bisa melepaskan kumbang koksi (ladybug) pemangsa kutu putih. Cara ini membasmi kutu tanpa membunuh lebah penyerbuk dan air siraman yang jatuh ke kolam tidak akan meracuni ikan nila.'
    },
    essayGrading: {
      q4: {
        score: 24,
        maxScore: 25,
        feedback: 'Sintesis solusi sangat cerdas menggabungkan biokontrol kumbang koksi dan pestisida nabati. Perlindungan terhadap lebah dan ikan dijelaskan secara spesifik.',
        gradedAt: '2026-09-18 11:00',
        teacherName: 'Dedy Nugraha, S.Pd.'
      }
    },
    hasEssay: true,
    needsManualGrading: false,
    isGradedByTeacher: true,
    completedAt: '2026-09-18 10:15',
    timeSpentSeconds: 380
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
    score: 75,
    objectiveScore: 75,
    essayScore: 0,
    correctCount: 3,
    totalQuestions: 4,
    literacyScore: 80,
    numeracyScore: 75,
    reasoningScore: 80,
    predicate: 'Cakap',
    feedback: 'Nilai objektif: 75/75 (100% benar). Menunggu koreksi manual soal uraian oleh guru.',
    selectedAnswers: {
      q1: 'opt_b',
      q2: ['opt_a', 'opt_b', 'opt_c'],
      q3: false,
      q4: 'Menurut kelompok kami, pada jadwal awal KPK dari 3, 4, dan 6 adalah 12 hari, jadi mereka bertemu lagi tanggal 13 Oktober. Jika diganti menjadi 5 hari, KPK dari 3, 4, dan 5 adalah 60 hari. Perubahan ini menurut kami sangat bagus karena tugas piket menjadi tidak bertumpuk di tanggal yang sama.'
    },
    hasEssay: true,
    needsManualGrading: true, // <--- PERLU DIKOREKSI MANUAL OLEH GURU!
    isGradedByTeacher: false,
    completedAt: '2026-09-19 08:30',
    timeSpentSeconds: 490
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
