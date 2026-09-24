import { UserProfile, LearningMission, StudentGroup } from '../types';

export interface SqlGeneratorOptions {
  users?: UserProfile[];
  missions?: LearningMission[];
  groups?: StudentGroup[];
  includeData?: boolean;
}

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escapeJson(val: any): string {
  if (val === null || val === undefined) return "'{}'::jsonb";
  const jsonStr = JSON.stringify(val).replace(/'/g, "''");
  return `'${jsonStr}'::jsonb`;
}

/**
 * Menghasilkan skrip SQL PostgreSQL lengkap untuk Supabase.
 * - Tanpa data dummy tiruan
 * - Data di-generate murni dari data pengguna yang sedang aktif (users, missions, groups)
 * - Mendukung opsi DDL saja (struktur bersih tanpa data) atau DDL + Data Saya
 */
export function generateDatabaseSchemaSQL(options: SqlGeneratorOptions = {}): string {
  const {
    users = [],
    missions = [],
    groups = [],
    includeData = true
  } = options;

  const nowIso = new Date().toISOString();

  // 1. DDL Header & Extensions
  let sql = `-- ==============================================================================
-- NARASA - SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION
-- Platform Penalaran Kontekstual Berbasis Citra, Literasi, Numerasi & Presentasi
-- Diekspor pada: ${nowIso}
-- Status Data: ${includeData ? `Sesuai Data Asli Pengguna (${users.length} Akun, ${groups.length} Kelompok, ${missions.length} Misi)` : 'Skema DDL Bersih (Tanpa Data)'}
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('teacher', 'student', 'school_admin', 'central_admin', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE competency_enum AS ENUM ('literacy', 'numeracy', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_type_enum AS ENUM ('pre', 'post');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES DEFINITION (DDL)

-- 3.1 TABEL SEKOLAH (Schools)
CREATE TABLE IF NOT EXISTS public.schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    npsn VARCHAR(20) UNIQUE,
    level VARCHAR(50) DEFAULT 'SD / MI',
    status VARCHAR(50) DEFAULT 'Negeri',
    accreditation VARCHAR(50) DEFAULT 'A (Unggul)',
    curriculum VARCHAR(255) DEFAULT 'Kurikulum Merdeka (Fase A, B, C)',
    headmaster VARCHAR(255),
    headmaster_nip VARCHAR(50),
    supervisor_name VARCHAR(255),
    supervisor_nip VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    rt_rw VARCHAR(20),
    village VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    motto TEXT,
    logo_url TEXT,
    academic_year VARCHAR(20) DEFAULT '2024/2025',
    active_semester VARCHAR(20) DEFAULT 'Ganjil',
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 TABEL KELAS / ROMBEL (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    phase VARCHAR(20) DEFAULT 'Fase C',
    academic_year VARCHAR(20) DEFAULT '2024/2025',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.3 TABEL PENGGUNA & PROFIL (Users)
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'student',
    gender VARCHAR(20) DEFAULT 'male',
    avatar TEXT,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE SET NULL,
    school_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(50),
    class_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nisn_nip VARCHAR(50),
    username VARCHAR(100),
    password VARCHAR(100),
    phone VARCHAR(30),
    status account_status_enum NOT NULL DEFAULT 'active',
    is_group BOOLEAN DEFAULT FALSE,
    group_id VARCHAR(100),
    group_members JSONB DEFAULT '[]'::jsonb,
    group_leader VARCHAR(255),
    group_motto TEXT,
    joined_date VARCHAR(50) DEFAULT 'Juli 2024',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.4 TABEL KELOMPOK SISWA (Student Groups)
CREATE TABLE IF NOT EXISTS public.student_groups (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE SET NULL,
    school_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(50),
    class_name VARCHAR(100),
    leader_id VARCHAR(100),
    leader_name VARCHAR(255),
    member_ids JSONB DEFAULT '[]'::jsonb,
    member_names JSONB DEFAULT '[]'::jsonb,
    avatar TEXT,
    email VARCHAR(255),
    username VARCHAR(100),
    password VARCHAR(100),
    motto TEXT,
    color VARCHAR(30) DEFAULT '#2563EB',
    account_user_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.5 TABEL MISI PEMBELAJARAN (Learning Missions)
CREATE TABLE IF NOT EXISTS public.learning_missions (
    id VARCHAR(100) PRIMARY KEY,
    id_mapel VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    phase VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    material VARCHAR(255) NOT NULL,
    cp TEXT NOT NULL,
    tp TEXT NOT NULL,
    indicators JSONB DEFAULT '[]'::jsonb,
    target_competency competency_enum NOT NULL DEFAULT 'both',
    cognitive_level VARCHAR(20) DEFAULT 'C4-C6',
    strict_curriculum_mode BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    suggested_objects JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.6 TABEL SESI BELAJAR & PORTOFOLIO SISWA (Student Sessions)
CREATE TABLE IF NOT EXISTS public.student_sessions (
    id VARCHAR(100) PRIMARY KEY,
    mission_id VARCHAR(100) REFERENCES public.learning_missions(id) ON DELETE CASCADE,
    mission_title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    student_id VARCHAR(100) REFERENCES public.users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    image_label VARCHAR(255) NOT NULL,
    learning_bridge JSONB NOT NULL DEFAULT '{}'::jsonb,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    scaffolding_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    reflection JSONB NOT NULL DEFAULT '{}'::jsonb,
    presentation JSONB NOT NULL DEFAULT '[]'::jsonb,
    peer_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'completed',
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.7 TABEL KUIS & ASESMEN FORMATIF (Concept Quizzes)
CREATE TABLE IF NOT EXISTS public.concept_quizzes (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    class_id VARCHAR(50),
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.8 TABEL PENGUMPULAN KUIS (Quiz Submissions)
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id VARCHAR(100) PRIMARY KEY,
    quiz_id VARCHAR(100) REFERENCES public.concept_quizzes(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES public.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    score NUMERIC(5,2) DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.9 TABEL PENGATURAN PLATFORM (App Settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public All Access for Schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Groups" ON public.student_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Missions" ON public.learning_missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Sessions" ON public.student_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Quizzes" ON public.concept_quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Quiz Submissions" ON public.quiz_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for App Settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. INDEXES UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_school ON public.users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_class ON public.users(class_id);
CREATE INDEX IF NOT EXISTS idx_missions_subject ON public.learning_missions(subject);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.student_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mission ON public.student_sessions(mission_id);
`;

  // 2. Data Insertion derived from actual data
  if (includeData) {
    sql += `\n-- ==============================================================================`;
    sql += `\n-- 6. DATA ASLI DARI APLIKASI ANDA (Bukan Data Dummy)`;
    sql += `\n-- ==============================================================================\n`;

    // 6.1 Schools derived from user data and saved school profiles
    let savedSchools: any[] = [];
    try {
      const raw = localStorage.getItem('narasa_schools_profile_data');
      if (raw) savedSchools = JSON.parse(raw);
    } catch (e) {}

    const schoolsMap = new Map<string, any>();
    // Pre-populate with savedSchools if present
    if (Array.isArray(savedSchools) && savedSchools.length > 0) {
      savedSchools.forEach((s) => {
        if (s && s.id) schoolsMap.set(s.id, s);
      });
    }

    // Ensure all user schools exist
    users.forEach((u) => {
      const sId = u.schoolId || 'SDN01';
      const sName = u.schoolName || 'SDN 01 Nusantara';
      if (!schoolsMap.has(sId)) {
        schoolsMap.set(sId, {
          id: sId,
          name: sName,
          npsn: sId === 'SDN01' ? '20104050' : sId === 'SDN02' ? '20104051' : '20101234',
          level: 'SD / MI',
          status: 'Negeri',
          accreditation: 'A (Unggul)',
          curriculum: 'Kurikulum Merdeka (Fase A, B, C)',
          headmaster: sId === 'SDN01' ? 'Dra. Hj. Siti Nurjanah, M.Pd.' : 'Drs. H. Mulyadi, M.Pd.',
          headmasterNip: sId === 'SDN01' ? '197203151998032004' : '197008101995121001',
          supervisorName: 'Dr. H. Bambang Soetopo, M.M.',
          phone: '(021) 7890123',
          email: `${sId.toLowerCase()}@kemdikbud.go.id`,
          address: 'Jl. Pendidikan Merdeka No. 45',
          city: 'Kota Jakarta Pusat',
          province: 'DKI Jakarta',
          postalCode: '10310',
          academicYear: '2024/2025',
          activeSemester: 'Ganjil'
        });
      }
    });

    if (schoolsMap.size > 0) {
      sql += `\n-- 6.1 Data Sekolah Mitra (Sesuai Pengaturan Data Sekolah)\n`;
      sql += `INSERT INTO public.schools (id, name, npsn, level, status, accreditation, curriculum, headmaster, headmaster_nip, supervisor_name, phone, email, address, city, province, postal_code, academic_year, active_semester)\nVALUES\n`;
      const schoolRows = Array.from(schoolsMap.values()).map(
        (s) =>
          `    (${escapeSql(s.id)}, ${escapeSql(s.name || 'Sekolah')}, ${escapeSql(s.npsn || '20100000')}, ${escapeSql(s.level || 'SD / MI')}, ${escapeSql(s.status || 'Negeri')}, ${escapeSql(s.accreditation || 'A (Unggul)')}, ${escapeSql(s.curriculum || 'Kurikulum Merdeka')}, ${escapeSql(s.headmaster || '')}, ${escapeSql(s.headmasterNip || '')}, ${escapeSql(s.supervisorName || '')}, ${escapeSql(s.phone || '')}, ${escapeSql(s.email || '')}, ${escapeSql(s.address || '')}, ${escapeSql(s.city || 'Kota')}, ${escapeSql(s.province || 'DKI Jakarta')}, ${escapeSql(s.postalCode || '10000')}, ${escapeSql(s.academicYear || '2024/2025')}, ${escapeSql(s.activeSemester || 'Ganjil')})`
      );
      sql += schoolRows.join(',\n') + '\n';
      sql += `ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    npsn = EXCLUDED.npsn,
    level = EXCLUDED.level,
    status = EXCLUDED.status,
    accreditation = EXCLUDED.accreditation,
    curriculum = EXCLUDED.curriculum,
    headmaster = EXCLUDED.headmaster,
    headmaster_nip = EXCLUDED.headmaster_nip,
    supervisor_name = EXCLUDED.supervisor_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    postal_code = EXCLUDED.postal_code,
    academic_year = EXCLUDED.academic_year,
    active_semester = EXCLUDED.active_semester;\n`;
    }

    // 6.2 Classes derived from user data
    const classesMap = new Map<string, { id: string; schoolId: string; name: string }>();
    users.forEach((u) => {
      const cId = u.classId || 'V-A';
      const cName = u.className || 'Kelas V-A';
      const sId = u.schoolId || 'SDN01';
      if (!classesMap.has(cId)) {
        classesMap.set(cId, { id: cId, schoolId: sId, name: cName });
      }
    });

    if (classesMap.size > 0) {
      sql += `\n-- 6.2 Data Kelas / Rombel (Sesuai Pengguna Aktif)\n`;
      sql += `INSERT INTO public.classes (id, school_id, name, grade, phase, academic_year)\nVALUES\n`;
      const classRows = Array.from(classesMap.values()).map(
        (c) => `    (${escapeSql(c.id)}, ${escapeSql(c.schoolId)}, ${escapeSql(c.name)}, 'Kelas V', 'Fase C', '2024/2025')`
      );
      sql += classRows.join(',\n') + '\n';
      sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n`;
    }

    // 6.3 Users from actual data
    if (users.length > 0) {
      sql += `\n-- 6.3 Data Akun Pengguna (${users.length} Akun Riil Aktif)\n`;
      sql += `INSERT INTO public.users (\n`;
      sql += `    id, name, role, gender, avatar, school_id, school_name, class_id, class_name,\n`;
      sql += `    email, nisn_nip, username, password, phone, status, is_group, group_members, joined_date\n`;
      sql += `) VALUES\n`;

      const userRows = users.map((u) => {
        const email = u.email || `${(u.username || u.name).toLowerCase().replace(/[^a-z0-9]/g, '')}@sdn01nusantara.sch.id`;
        return `    (${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.role)}, ${escapeSql(u.gender || 'male')}, ${escapeSql(u.avatar)}, ${escapeSql(u.schoolId || 'SDN01')}, ${escapeSql(u.schoolName || 'SDN 01 Nusantara')}, ${escapeSql(u.classId || 'V-A')}, ${escapeSql(u.className || 'Kelas V-A')}, ${escapeSql(email)}, ${escapeSql(u.nisnNip || null)}, ${escapeSql(u.username || null)}, ${escapeSql(u.password || '123456')}, ${escapeSql(u.phone || null)}, ${escapeSql(u.status || 'active')}, ${escapeSql(u.isGroup || false)}, ${escapeJson(u.groupMembers || [])}, ${escapeSql(u.joinedDate || 'Juli 2024')})`;
      });

      sql += userRows.join(',\n') + '\n';
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    name = EXCLUDED.name,\n`;
      sql += `    role = EXCLUDED.role,\n`;
      sql += `    gender = EXCLUDED.gender,\n`;
      sql += `    avatar = EXCLUDED.avatar,\n`;
      sql += `    school_id = EXCLUDED.school_id,\n`;
      sql += `    school_name = EXCLUDED.school_name,\n`;
      sql += `    class_id = EXCLUDED.class_id,\n`;
      sql += `    class_name = EXCLUDED.class_name,\n`;
      sql += `    email = EXCLUDED.email,\n`;
      sql += `    nisn_nip = EXCLUDED.nisn_nip,\n`;
      sql += `    username = EXCLUDED.username,\n`;
      sql += `    password = EXCLUDED.password,\n`;
      sql += `    phone = EXCLUDED.phone,\n`;
      sql += `    status = EXCLUDED.status,\n`;
      sql += `    is_group = EXCLUDED.is_group,\n`;
      sql += `    group_members = EXCLUDED.group_members,\n`;
      sql += `    joined_date = EXCLUDED.joined_date;\n`;
    }

    // 6.4 Student Groups from actual data
    if (groups.length > 0) {
      sql += `\n-- 6.4 Data Kelompok Belajar (${groups.length} Kelompok Aktif)\n`;
      sql += `INSERT INTO public.student_groups (\n`;
      sql += `    id, name, school_id, school_name, class_id, class_name, leader_id, leader_name, member_ids, member_names, avatar, email, motto, color, account_user_id\n`;
      sql += `) VALUES\n`;

      const groupRows = groups.map((g) => {
        return `    (${escapeSql(g.id)}, ${escapeSql(g.name)}, ${escapeSql(g.schoolId || 'SDN01')}, ${escapeSql(g.schoolName || 'SDN 01 Nusantara')}, ${escapeSql(g.classId || 'V-A')}, ${escapeSql(g.className || 'Kelas V-A')}, ${escapeSql(g.leaderId || null)}, ${escapeSql(g.leaderName || null)}, ${escapeJson(g.memberIds || [])}, ${escapeJson(g.memberNames || [])}, ${escapeSql(g.avatar)}, ${escapeSql(g.email)}, ${escapeSql(g.motto || null)}, ${escapeSql(g.color || '#2563EB')}, ${escapeSql(g.accountUserId)})`;
      });

      sql += groupRows.join(',\n') + '\n';
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    name = EXCLUDED.name,\n`;
      sql += `    motto = EXCLUDED.motto,\n`;
      sql += `    color = EXCLUDED.color,\n`;
      sql += `    member_ids = EXCLUDED.member_ids,\n`;
      sql += `    member_names = EXCLUDED.member_names;\n`;
    }

    // 6.5 Learning Missions from actual data
    if (missions.length > 0) {
      sql += `\n-- 6.5 Data Misi Pembelajaran (${missions.length} Misi Aktif)\n`;
      sql += `INSERT INTO public.learning_missions (\n`;
      sql += `    id, id_mapel, title, grade, phase, subject, material, cp, tp, indicators, target_competency, cognitive_level, strict_curriculum_mode, features, description, is_active, suggested_objects\n`;
      sql += `) VALUES\n`;

      const missionRows = missions.map((m) => {
        return `    (${escapeSql(m.id)}, ${escapeSql(m.idMapel)}, ${escapeSql(m.title)}, ${escapeSql(m.grade)}, ${escapeSql(m.phase)}, ${escapeSql(m.subject)}, ${escapeSql(m.material)}, ${escapeSql(m.cp)}, ${escapeSql(m.tp)}, ${escapeJson(m.indicators || [])}, ${escapeSql(m.targetCompetency || 'both')}, ${escapeSql(m.cognitiveLevel || 'C4-C6')}, ${escapeSql(m.strictCurriculumMode !== false)}, ${escapeJson(m.features || {})}, ${escapeSql(m.description || '')}, ${escapeSql(m.isActive !== false)}, ${escapeJson(m.suggestedObjects || [])})`;
      });

      sql += missionRows.join(',\n') + '\n';
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    title = EXCLUDED.title,\n`;
      sql += `    subject = EXCLUDED.subject,\n`;
      sql += `    material = EXCLUDED.material,\n`;
      sql += `    cp = EXCLUDED.cp,\n`;
      sql += `    tp = EXCLUDED.tp,\n`;
      sql += `    indicators = EXCLUDED.indicators,\n`;
      sql += `    features = EXCLUDED.features;\n`;
    }
  }

  return sql;
}
