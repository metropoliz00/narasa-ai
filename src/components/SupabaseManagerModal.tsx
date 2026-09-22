import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Terminal,
  X,
  Send
} from 'lucide-react';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  syncAllToSupabase,
  dbFetchUsers
} from '../lib/supabase';
import { UserProfile, LearningMission, StudentActivitySession } from '../types';

interface SupabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  missions: LearningMission[];
  sessions: StudentActivitySession[];
  onRefreshData?: () => void;
}

export const SupabaseManagerModal: React.FC<SupabaseManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  missions,
  sessions,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'guide'>('overview');
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; dataCount?: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await syncAllToSupabase(users, missions, sessions);
    setSyncResult(res);
    setIsSyncing(false);
    if (res.success && onRefreshData) {
      onRefreshData();
    }
  };

  const schemaSQL = `-- ==============================================================================
-- 🌟 NARASA - UNIFIED ALL-IN-ONE SUPABASE POSTGRESQL SCHEMA & SEED DATA 🌟
-- Platform Penalaran Kontekstual Berbasis Citra, Literasi, Numerasi & Presentasi
-- Tinggal copy dan paste seluruh script ini ke SQL Editor di Dashboard Supabase!
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('student', 'teacher', 'school_admin', 'central_admin', 'admin');
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

-- 3.1 SEKOLAH (Schools)
CREATE TABLE IF NOT EXISTS public.schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    npsn VARCHAR(20) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 KELAS / ROMBEL (Classes)
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

-- 3.3 PENGGUNA & PROFIL (Users)
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'student',
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE SET NULL,
    school_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(50),
    class_name VARCHAR(255) NOT NULL,
    nisn_nip VARCHAR(50),
    username VARCHAR(100),
    password VARCHAR(100),
    phone VARCHAR(30),
    status account_status_enum NOT NULL DEFAULT 'active',
    is_group BOOLEAN DEFAULT FALSE,
    group_members JSONB DEFAULT '[]'::jsonb,
    joined_date VARCHAR(50) DEFAULT 'Juli 2024',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.4 KELOMPOK BELAJAR (Student Groups)
CREATE TABLE IF NOT EXISTS public.student_groups (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE SET NULL,
    school_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(50) REFERENCES public.classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255) NOT NULL,
    leader_id VARCHAR(100) REFERENCES public.users(id) ON DELETE SET NULL,
    leader_name VARCHAR(255),
    member_ids JSONB DEFAULT '[]'::jsonb,
    member_names JSONB DEFAULT '[]'::jsonb,
    avatar TEXT,
    email VARCHAR(255),
    motto TEXT,
    color VARCHAR(30) DEFAULT '#3B82F6',
    account_user_id VARCHAR(100) REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.5 MISI PEMBELAJARAN (Learning Missions)
CREATE TABLE IF NOT EXISTS public.learning_missions (
    id VARCHAR(100) PRIMARY KEY,
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
    features JSONB DEFAULT '{"adaptiveDifficulty": true, "scaffolding": true, "reasoning": true, "evidence": true, "reflection": true, "presentation": true, "peerQuestion": true}'::jsonb,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    suggested_objects JSONB DEFAULT '[]'::jsonb,
    created_by VARCHAR(100) REFERENCES public.users(id) ON DELETE SET NULL,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.6 SESI AKTIVITAS & PORTOFOLIO (Student Activity Sessions)
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
    metrics JSONB NOT NULL DEFAULT '{"literacyScore": 85, "numeracyScore": 85, "reasoningScore": 85, "scaffoldingUsedCount": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.7 BANK SOAL KUIS (Concept Quizzes)
CREATE TABLE IF NOT EXISTS public.concept_quizzes (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    phase VARCHAR(20) NOT NULL DEFAULT 'Fase C',
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 15,
    passing_score NUMERIC(5,2) DEFAULT 75,
    badge_reward VARCHAR(100),
    created_by VARCHAR(100) REFERENCES public.users(id) ON DELETE SET NULL,
    school_id VARCHAR(50) REFERENCES public.schools(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.8 HASIL SUBMISI KUIS (Quiz Submissions)
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id VARCHAR(100) PRIMARY KEY,
    quiz_id VARCHAR(100) REFERENCES public.concept_quizzes(id) ON DELETE CASCADE,
    quiz_title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) REFERENCES public.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    group_members JSONB DEFAULT '[]'::jsonb,
    class_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(50),
    school_name VARCHAR(255) NOT NULL,
    school_id VARCHAR(50),
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    literacy_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    numeracy_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    reasoning_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    predicate VARCHAR(50),
    feedback TEXT,
    selected_answers JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.9 ASESMEN PRE/POST TEST (Student Assessments)
CREATE TABLE IF NOT EXISTS public.student_assessments (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES public.users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    type assessment_type_enum NOT NULL DEFAULT 'pre',
    literacy_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    numeracy_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    reasoning_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.10 INSIGHT PEDAGOGIS GURU (Teacher Insights)
CREATE TABLE IF NOT EXISTS public.teacher_insights (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    evidence_data TEXT,
    target_missions JSONB DEFAULT '[]'::jsonb,
    action_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.11 PENGATURAN SISTEM (App Settings)
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
ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public All Access for Schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Groups" ON public.student_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Missions" ON public.learning_missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Student Sessions" ON public.student_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Quizzes" ON public.concept_quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Quiz Submissions" ON public.quiz_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Assessments" ON public.student_assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for Insights" ON public.teacher_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Access for App Settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. SEED DATA AWAL (Idempotent ON CONFLICT)
INSERT INTO public.schools (id, name, npsn, address, city, province)
VALUES 
    ('SDN01', 'SDN 01 Nusantara', '20101234', 'Jl. Pendidikan Merdeka No. 45', 'Jakarta', 'DKI Jakarta'),
    ('CENTRAL', 'Pusat Data & Dinas Pendidikan', '99999999', 'Gedung Kemendikdasmen Lt. 8', 'Jakarta', 'DKI Jakarta')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address;

INSERT INTO public.classes (id, school_id, name, grade, phase, academic_year)
VALUES 
    ('V-A', 'SDN01', 'Kelas V-A (Sains & Penalaran)', 'Kelas V', 'Fase C', '2024/2025'),
    ('V-B', 'SDN01', 'Kelas V-B (Literasi & Numerasi)', 'Kelas V', 'Fase C', '2024/2025'),
    ('IV-A', 'SDN01', 'Kelas IV-A (Tematik)', 'Kelas IV', 'Fase B', '2024/2025')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.users (
    id, name, role, email, avatar, school_id, school_name, class_id, class_name, nisn_nip, username, password, phone, status, is_group, group_members, joined_date
) VALUES
    ('user-teacher-1', 'Pak Dedy, S.Pd.', 'teacher', 'dedy.guru@sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Wali Kelas V-A • Guru IPA & Matematika', '198504122010011005', 'dedy123', '123456', '0812-3456-7890', 'active', FALSE, '[]'::jsonb, 'Januari 2020'),
    ('user-teacher-3', 'Pak Hendra Wijaya, S.Pd.', 'teacher', 'hendra.wijaya@sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'IV-A', 'Guru Kelas IV • Tematik & PJOK', '199103152015031002', 'hendra123', '123456', '0815-5678-1234', 'active', FALSE, '[]'::jsonb, 'Agustus 2022'),
    ('user-school-admin-1', 'Ibu Ratna, S.Kom.', 'school_admin', 'admin.sdn01@narasa.id', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'ALL', 'Admin Sekolah • SDN 01 Nusantara', '198009182006042008', 'admin_sdn01', 'admin123', '0811-2233-4455', 'active', FALSE, '[]'::jsonb, 'Januari 2019'),
    ('user-central-admin-1', 'Pak Irfan Maulana, M.T.', 'central_admin', 'superadmin@narasa.id', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'CENTRAL', 'Pusat Data & Dinas Pendidikan Kota', 'ALL', 'Admin Pusat • Superadmin Nasional', '197905202003121001', 'superadmin', 'superadmin123', '0812-9988-7766', 'active', FALSE, '[]'::jsonb, 'Mei 2018'),
    ('user-student-1', 'Budi Santoso', 'student', 'budi.santoso@siswa.sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A (Sains & Penalaran)', '0098451234', 'budi123', '123456', '0813-1122-3344', 'active', FALSE, '[]'::jsonb, 'Juli 2024'),
    ('user-student-2', 'Siti Rahmawati', 'student', 'siti.rahmawati@siswa.sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A (Sains & Penalaran)', '0098451235', 'siti123', '123456', '0813-2233-4455', 'active', FALSE, '[]'::jsonb, 'Juli 2024'),
    ('user-student-3', 'Edo Pratama', 'student', 'edo.pratama@siswa.sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A (Sains & Penalaran)', '0098451236', 'edo123', '123456', '0813-3344-5566', 'active', FALSE, '[]'::jsonb, 'Juli 2024'),
    ('group-acc-1', 'Kelompok Garuda (Tim Investigasi Sains)', 'student', 'kelompok.garuda@sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A • Kelompok Belajar', 'KEL-001', 'garuda', '123456', '0812-7788-9900', 'active', TRUE, '["Budi Santoso", "Siti Rahmawati", "Edo Pratama"]'::jsonb, 'Juli 2024'),
    ('group-acc-2', 'Kelompok Rajawali (Eksplorasi Lingkungan)', 'student', 'kelompok.rajawali@sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A • Kelompok Belajar', 'KEL-002', 'rajawali', '123456', '0812-9900-1122', 'active', TRUE, '["Ayu Lestari", "Rizky Ramadhan", "Dewi Sartika"]'::jsonb, 'Juli 2024')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar = EXCLUDED.avatar,
    email = EXCLUDED.email,
    school_name = EXCLUDED.school_name,
    class_name = EXCLUDED.class_name,
    password = EXCLUDED.password,
    is_group = EXCLUDED.is_group,
    group_members = EXCLUDED.group_members;

INSERT INTO public.student_groups (
    id, name, school_id, school_name, class_id, class_name, leader_id, leader_name, member_ids, member_names, avatar, email, motto, color, account_user_id
) VALUES
    ('group-1', 'Kelompok Garuda (Tim Investigasi Sains)', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A', 'user-student-1', 'Budi Santoso', '["user-student-1", "user-student-2", "user-student-3"]'::jsonb, '["Budi Santoso", "Siti Rahmawati", "Edo Pratama"]'::jsonb, 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=150&auto=format&fit=crop&q=80', 'kelompok.garuda@sdn01nusantara.sch.id', 'Terbang Tinggi Menggapai Pemahaman Sains & Matematika.', '#2563EB', 'group-acc-1'),
    ('group-2', 'Kelompok Rajawali (Eksplorasi Lingkungan)', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A', 'user-student-4', 'Ayu Lestari', '["user-student-4", "user-student-5", "user-student-6"]'::jsonb, '["Ayu Lestari", "Rizky Ramadhan", "Dewi Sartika"]'::jsonb, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80', 'kelompok.rajawali@sdn01nusantara.sch.id', 'Tajam Mengamati, Cepat Memahami.', '#059669', 'group-acc-2')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, motto = EXCLUDED.motto;
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(schemaSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#25324B] font-display">
                  Integrasi Database Supabase
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConfigured ? '🟢 Kredensial Terpasang' : '🟡 Menunggu Konfigurasi'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Penyimpanan cloud terpusat untuk Data User, Misi Pembelajaran, dan Portofolio Murid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Status & Sinkronisasi</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Skrip SQL Schema & Seed</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Panduan Setup Supabase</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-left text-xs sm:text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Status Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-blue-50/50 border border-emerald-200/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Status Database PostgreSQL (Supabase)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isConfigured
                        ? 'Variabel environment Supabase terdeteksi. Anda dapat menguji koneksi atau menyinkronkan data langsung.'
                        : 'Aplikasi saat ini berjalan dengan penyimpanan Lokal (LocalStorage & Data Awal). Tambahkan kredensial di Settings / Environment untuk menghubungkan langsung ke Supabase.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs active:scale-98 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
                      <span>{isTesting ? 'Memeriksa...' : 'Uji Koneksi'}</span>
                    </button>
                    <button
                      onClick={handleSyncData}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke Supabase'}</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {syncResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                      syncResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {syncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{syncResult.message}</span>
                  </div>
                )}
              </div>

              {/* Data Table Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pengguna (Multi-Role)</span>
                  <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                  <p className="text-[11px] text-slate-500">
                    Murid ({users.filter(u => u.role === 'student').length}), Guru ({users.filter(u => u.role === 'teacher').length}), Admin ({users.filter(u => u.role.includes('admin')).length})
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Misi Pembelajaran</span>
                  <p className="text-2xl font-bold text-slate-900">{missions.length}</p>
                  <p className="text-[11px] text-slate-500">
                    Pembelajaran Mendalam IPAS & Matematika Fase C
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Karya & Sesi Murid</span>
                  <p className="text-2xl font-bold text-slate-900">{sessions.length}</p>
                  <p className="text-[11px] text-slate-500">
                    Portofolio foto, penalaran AI & slide presentasi
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Supabase PostgreSQL SQL Schema & Seed
                  </h4>
                  <p className="text-xs text-slate-500">
                    Jalankan SQL ini di <strong>Supabase Dashboard &gt; SQL Editor</strong> untuk membuat tabel `users`, `learning_missions`, `student_sessions`, `schools`, dan RLS policies.
                  </p>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Semua SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                  {schemaSQL}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
                Cara Menghubungkan Aplikasi NARASA ke Supabase (3 Langkah Mudah)
              </h4>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-700 text-xs">Langkah 1: Buat Proyek Supabase</span>
                  <p className="text-xs text-slate-600">
                    Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">supabase.com</a> dan buat proyek baru (contoh nama: <code>narasa-db</code>).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-700 text-xs">Langkah 2: Jalankan Skrip SQL</span>
                  <p className="text-xs text-slate-600">
                    Masuk ke menu <strong>SQL Editor</strong> di Supabase, lalu salin dan jalankan (Run) skrip SQL dari tab <strong>"Skrip SQL Schema & Seed"</strong> di atas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-700 text-xs">Langkah 3: Masukkan API Keys ke Settings</span>
                  <p className="text-xs text-slate-600">
                    Ambil <code>Project URL</code> dan <code>anon public key</code> dari menu <strong>Project Settings &gt; API</strong> di Supabase, lalu pasang di menu Settings environment variable:
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] mt-1 space-y-0.5">
                    <p>VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co</p>
                    <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-[11px] text-slate-500">
            Database PostgreSQL • Multi-Tenant & RLS Enabled
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
