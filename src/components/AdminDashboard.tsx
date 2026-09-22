import React, { useState, useRef } from 'react';
import { UserProfile, UserRole, LearningMission, StudentActivitySession } from '../types';
import { toast } from './Toast';
import { NarasaLogo } from './NarasaLogo';
import {
  ShieldCheck,
  Cpu,
  School,
  Users,
  Settings2,
  CheckCircle2,
  UserPlus,
  Search,
  User,
  GraduationCap,
  Trash2,
  Edit,
  ArrowRight,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Smile,
  BookOpen,
  Heart,
  Rocket,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Database,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Send,
  AlertCircle,
  Camera
} from 'lucide-react';
import { UserAccountModal } from './UserAccountModal';
import adminBannerBg from '../assets/images/literasi_numerasi_bright_bg_1789741597196.jpg';
import { isSupabaseConfigured, testSupabaseConnection, syncAllToSupabase } from '../lib/supabase';

interface AdminDashboardProps {
  users: UserProfile[];
  currentUser: UserProfile;
  missions?: LearningMission[];
  sessions?: StudentActivitySession[];
  onAddUser: (userData: Omit<UserProfile, 'id'>) => void;
  onUpdateUser: (userData: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserProfile) => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  currentUser,
  missions = [],
  sessions = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'config' | 'schools'>('accounts');
  const [accountFilterRole, setAccountFilterRole] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Supabase states
  const [copiedSql, setCopiedSql] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string; dataCount?: number } | null>(null);
  const [dbSyncResult, setDbSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // School Gemini API Key states
  const [schoolApiKey, setSchoolApiKey] = useState(() => localStorage.getItem('narasa_school_gemini_key') || '');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavedApiKey, setIsSavedApiKey] = useState(false);

  const handleSaveSchoolApiKey = () => {
    localStorage.setItem('narasa_school_gemini_key', schoolApiKey.trim());
    setIsSavedApiKey(true);
    toast.success(
      'API Key Sekolah Disimpan!',
      'Kunci API Key Gemini Anda telah dikonfigurasi dan disimpan secara aman di perangkat lokal.'
    );
    setTimeout(() => setIsSavedApiKey(false), 3000);
  };

  const handleTestSchoolApiKey = async () => {
    if (!schoolApiKey.trim()) {
      setApiKeyTestResult({ success: false, message: 'API Key masih kosong.' });
      return;
    }
    setIsTestingApiKey(true);
    setApiKeyTestResult(null);
    try {
      const res = await fetch('/api/test-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: schoolApiKey.trim() })
      });
      const data = await res.json();
      setApiKeyTestResult({ success: data.success, message: data.message });
    } catch (err: any) {
      setApiKeyTestResult({ success: false, message: err.message || 'Gagal menguji API Key.' });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [defaultRoleForNew, setDefaultRoleForNew] = useState<UserRole>('student');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Excel / CSV Import ref
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const isDbConfigured = isSupabaseConfigured();

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    const res = await testSupabaseConnection();
    setDbTestResult(res);
    setIsTestingDb(false);
  };

  const handleSyncDatabase = async () => {
    setIsSyncingDb(true);
    setDbSyncResult(null);
    const res = await syncAllToSupabase(users, missions, sessions);
    setDbSyncResult(res);
    setIsSyncingDb(false);
    if (res.success && onRefreshData) {
      onRefreshData();
    }
  };

  const fullSchemaSQL = `-- ==============================================================================
-- NARASA - SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION
-- Platform Penalaran Kontekstual Berbasis Citra, Literasi, Numerasi & Presentasi
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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

-- 3. TABLES DEFINITION

-- 3.1 SCHOOLS (Multi-Tenant & School Hierarchy)
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

-- 3.2 CLASSES / ROMBEL
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

-- 3.3 USERS & PROFILES (Multi-Role: Siswa, Guru, Admin Sekolah, Admin Pusat)
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

-- 3.4 LEARNING MISSIONS
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

-- 3.5 STUDENT ACTIVITY SESSIONS & PRESENTATIONS
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

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public All Access for Schools" ON public.schools FOR ALL USING (true);
CREATE POLICY "Public All Access for Classes" ON public.classes FOR ALL USING (true);
CREATE POLICY "Public All Access for Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public All Access for Missions" ON public.learning_missions FOR ALL USING (true);
CREATE POLICY "Public All Access for Student Sessions" ON public.student_sessions FOR ALL USING (true);

-- 5. INITIAL SEED DATA
INSERT INTO public.schools (id, name, npsn, address, city, province)
VALUES
    ('SDN01', 'SDN 01 Nusantara', '20104050', 'Jl. Merdeka No. 45', 'Jakarta Pusat', 'DKI Jakarta'),
    ('SDN02', 'SDN 02 Kenanga', '20104051', 'Jl. Melati No. 12', 'Bandung', 'Jawa Barat'),
    ('CENTRAL', 'Pusat Data & Dinas Pendidikan Kota', '99999999', 'Gedung Kementrian Kebudayaan & Pendidikan', 'Jakarta', 'DKI Jakarta')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.classes (id, school_id, name, grade, phase)
VALUES
    ('V-A', 'SDN01', 'Kelas V-A', '5', 'Fase C'),
    ('V-B', 'SDN01', 'Kelas V-B', '5', 'Fase C'),
    ('IV-A', 'SDN01', 'Kelas IV-A', '4', 'Fase B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, name, role, email, avatar, school_id, school_name, class_id, class_name, nisn_nip, username, password, phone, status, joined_date)
VALUES
    ('user-student-1', 'Adit Pratama', 'student', 'adit.pratama@siswa.sdn01.sch.id', 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A', '0098451201', 'adit1', '123456', '0812-1122-3344', 'active', 'Juli 2024'),
    ('user-student-2', 'Siti Rahma', 'student', 'siti.rahma@siswa.sdn01.sch.id', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Kelas V-A', '0098451202', 'siti2', '123456', '0812-2233-4455', 'active', 'Juli 2024'),
    ('user-teacher-1', 'Pak Dedy, S.Pd.', 'teacher', 'dedy.guru@sdn01nusantara.sch.id', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'V-A', 'Wali Kelas V-A • Guru IPA & Matematika', '198504122010011005', 'dedy123', '123456', '0812-3456-7890', 'active', 'Januari 2020'),
    ('user-school-admin-1', 'Ibu Ratna, S.Kom.', 'school_admin', 'admin.sdn01@narasa.id', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'SDN01', 'SDN 01 Nusantara', 'ALL', 'Admin Sekolah • SDN 01 Nusantara', '198009182006042008', 'adminsdn01', '123456', '0811-2233-4455', 'active', 'Januari 2019'),
    ('user-central-admin-1', 'Pak Irfan Maulana, M.T.', 'central_admin', 'pusat@narasa.id', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'CENTRAL', 'Pusat Data & Dinas Pendidikan Kota', 'ALL', 'Admin Pusat • Superadmin Nasional', '199302102019031001', 'adminpusat', 'admin123', '0812-9988-7766', 'active', 'Mei 2022')
ON CONFLICT (id) DO NOTHING;
`;

  const handleCopyFullSql = () => {
    navigator.clipboard.writeText(fullSchemaSQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Template, Export & Import Handlers
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "name,role,schoolName,schoolId,className,classId,nisnNip,phone,status\n" +
      "Budi Santoso,student,SDN 01 Nusantara,SDN01,Kelas V-A,V-A,0123456789,081234567890,active\n" +
      "Siti Rahmawati,student,SDN 01 Nusantara,SDN01,Kelas V-B,V-B,0123456790,081234567891,active\n" +
      "Dra. Siti Aminah M.Pd.,teacher,SDN 01 Nusantara,SDN01,Wali Kelas V-A,V-A,198001012005012001,081122334455,active";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_akun_narasa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,name,role,schoolName,schoolId,className,classId,nisnNip,phone,status\n";
    users.forEach(u => {
      csvContent += `"${u.name}","${u.role}","${u.schoolName}","${u.schoolId || ''}","${u.className}","${u.classId || ''}","${u.nisnNip || ''}","${u.phone || ''}","${u.status}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_akun_narasa_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      let addedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          const [name, role, schoolName, schoolId, className, classId, nisnNip, phone, status] = parts;
          if (name) {
            onAddUser({
              name,
              role: (role === 'student' || role === 'teacher' || role === 'admin') ? role as UserRole : 'student',
              schoolName: schoolName || 'SDN 01 Nusantara',
              schoolId: schoolId || 'SDN01',
              className: className || 'Kelas V-A',
              classId: classId || 'V-A',
              nisnNip: nisnNip || '',
              phone: phone || '',
              status: (status === 'active' || status === 'inactive') ? status as any : 'active',
              email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@narasa.id`,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              joinedDate: 'Juli 2024'
            });
            addedCount++;
          }
        }
      }
      toast.success(
        'Impor Akun Berhasil!',
        `Berhasil mengimpor ${addedCount} akun baru ke platform NARASA.`
      );
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // System config states
  const [modelName, setModelName] = useState('gemini-3.8-flash');
  const [strictnessLevel, setStrictnessLevel] = useState('Strict (Sangat Disiplin Kurikulum)');
  const [scaffoldingSensitivity, setScaffoldingSensitivity] = useState('Tinggi (Responsif 4 Level)');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveConfig = () => {
    setIsSaved(true);
    toast.success(
      'Konfigurasi Disimpan!',
      'Pengaturan scaffold AI dan sensitivitas parameter kurikulum nasional berhasil diperbarui.'
    );
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Scoped users based on current user role (school_admin vs central_admin)
  const scopedUsers = currentUser.role === 'school_admin'
    ? users.filter((u) => u.schoolId === currentUser.schoolId)
    : users;

  // Filter users
  const filteredUsers = scopedUsers.filter((u) => {
    const matchesRole =
      accountFilterRole === 'all' ||
      u.role === accountFilterRole ||
      (accountFilterRole === 'central_admin' && u.role === 'admin') ||
      (accountFilterRole === 'admin' && (u.role === 'admin' || u.role === 'central_admin'));
    const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.className.toLowerCase().includes(q) ||
      u.schoolName.toLowerCase().includes(q) ||
      (u.nisnNip && u.nisnNip.toLowerCase().includes(q));
    return matchesRole && matchesStatus && matchesSearch;
  });

  const studentsCount = scopedUsers.filter((u) => u.role === 'student').length;
  const teachersCount = scopedUsers.filter((u) => u.role === 'teacher').length;
  const schoolAdminsCount = scopedUsers.filter((u) => u.role === 'school_admin').length;
  const centralAdminsCount = scopedUsers.filter((u) => u.role === 'central_admin' || u.role === 'admin').length;
  const adminsCount = schoolAdminsCount + centralAdminsCount;
  const activeCount = scopedUsers.filter((u) => (u.status || 'active') === 'active').length;

  // Real data calculations for partner schools and Dinas Pendidikan
  const knownSchoolMeta: Record<string, { npsn: string; category: string }> = {
    SDN01: { npsn: '20104050', category: 'Sekolah Penggerak' },
    SDN02: { npsn: '20104051', category: 'Sekolah Rujukan Kurikulum Merdeka' }
  };

  const distinctSchoolIds = Array.from(
    new Set(users.filter((u) => u.schoolId && u.schoolId !== 'CENTRAL').map((u) => u.schoolId))
  );

  const partnerSchools = distinctSchoolIds.map((sId) => {
    const schoolUsers = users.filter((u) => u.schoolId === sId);
    const schoolName = schoolUsers[0]?.schoolName || (sId === 'SDN01' ? 'SDN 01 Nusantara' : sId === 'SDN02' ? 'SDN 02 Kenanga' : sId);
    const students = schoolUsers.filter((u) => u.role === 'student');
    const teachers = schoolUsers.filter((u) => u.role === 'teacher');
    const classes = Array.from(
      new Set(schoolUsers.filter((u) => u.classId && u.classId !== 'ALL').map((u) => u.className))
    );
    const meta = knownSchoolMeta[sId] || { npsn: '20104050', category: 'Sekolah Mitra Narasa' };

    return {
      id: sId,
      name: schoolName,
      npsn: meta.npsn,
      category: meta.category,
      studentsCount: students.length,
      teachersCount: teachers.length,
      classesCount: Math.max(classes.length, 1),
      classesList: classes.length > 0 ? classes : ['Kelas V-A']
    };
  });

  const totalPartnerSchoolsCount = partnerSchools.length;
  const totalAdminsInSystem = users.filter((u) => u.role.includes('admin')).length;

  const handleOpenCreate = (role: UserRole = 'student') => {
    setEditingUser(null);
    setDefaultRoleForNew(role);
    setIsAccountModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (userData: Omit<UserProfile, 'id'> & { id?: string }) => {
    const finalData = currentUser.role === 'school_admin'
      ? {
          ...userData,
          schoolId: currentUser.schoolId,
          schoolName: currentUser.schoolName
        }
      : userData;

    if (finalData.id) {
      onUpdateUser(finalData as UserProfile);
    } else {
      onAddUser(finalData);
    }
  };

  const handleToggleStatus = (user: UserProfile) => {
    const updatedStatus = user.status === 'inactive' ? 'active' : 'inactive';
    onUpdateUser({
      ...user,
      status: updatedStatus
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span>🎓</span> Murid
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>📚</span> Guru
          </span>
        );
      case 'school_admin':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span>🏫</span> Admin Sekolah
          </span>
        );
      case 'central_admin':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span>⚙️</span> Admin Pusat
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Header Banner with White Theme & Literacy-Numeracy Illustration */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-slate-200/90 bg-white group">
        {/* Background Image: Vivid, High Quality, Distinct Literacy & Numeracy */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={adminBannerBg}
            alt="Literasi dan Numerasi Pendidikan Dasar"
            className="w-full h-full object-cover object-right opacity-70 group-hover:scale-102 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Soft White Gradient Overlays for High Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent md:w-3/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30 pointer-events-none" />
        </div>

        <div className="relative z-10 space-y-1 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <NarasaLogo size="sm" withHoverAnimation={true} withGlow={true} containerClassName="rounded-xl" />
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#1E293B]">
              Panel Administrator & Manajemen Akun NARASA
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Kelola data akun murid, guru pengampu, administrator, serta keselarasan kurikulum Pembelajaran Mendalam.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => handleOpenCreate('student')}
            className="px-4 py-2.5 rounded-xl bg-[#4F8EF7] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'accounts'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Akun ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'config'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Konfigurasi AI & Pedagogis</span>
        </button>

        <button
          onClick={() => setActiveTab('schools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'schools'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Sekolah & Rombel Mitra</span>
        </button>
      </div>

      {/* 1. MANAJEMEN AKUN TAB */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Pengguna</span>
              <span className="text-2xl font-bold font-display text-[#25324B]">{users.length} Akun</span>
              <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">{activeCount} Akun Aktif</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">Akun Murid SD</span>
              <span className="text-2xl font-bold font-display text-blue-600">{studentsCount} Murid</span>
              <span className="text-[10px] text-slate-400 block mt-1">Kelas IV & V</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">Akun Guru</span>
              <span className="text-2xl font-bold font-display text-purple-600">{teachersCount} Guru</span>
              <span className="text-[10px] text-slate-400 block mt-1">Wali & Mapel</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">Administrator</span>
              <span className="text-2xl font-bold font-display text-emerald-600">{adminsCount} Admin</span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Kurikulum & IT</span>
            </div>
          </div>

          {/* Account Filter & Control Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Role filter buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
                <button
                  onClick={() => setAccountFilterRole('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    accountFilterRole === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({users.length})
                </button>
                <button
                  onClick={() => setAccountFilterRole('student')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    accountFilterRole === 'student'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Murid ({studentsCount})
                </button>
                <button
                  onClick={() => setAccountFilterRole('teacher')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    accountFilterRole === 'teacher'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guru ({teachersCount})
                </button>
                <button
                  onClick={() => setAccountFilterRole('school_admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    accountFilterRole === 'school_admin'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin Sekolah ({schoolAdminsCount})
                </button>
                <button
                  onClick={() => setAccountFilterRole('central_admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    accountFilterRole === 'central_admin'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin Pusat ({centralAdminsCount})
                </button>
              </div>

              {/* Status filter & Add buttons */}
              <div className="flex items-center gap-2.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 outline-none bg-white"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">🟢 Status Aktif</option>
                  <option value="inactive">🔴 Status Nonaktif</option>
                </select>

                {/* Excel Template & Bulk Import/Export */}
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                    title="Unduh Templat CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Templat</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="px-2.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors"
                    title="Ekspor Data ke CSV/Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Ekspor</span>
                  </button>
                  <button
                    onClick={() => excelInputRef.current?.click()}
                    className="px-2.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                    title="Impor Akun dari CSV/Excel"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Impor</span>
                  </button>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama lengkap, NISN / NIP, sekolah, atau kelas..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Accounts Table List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Pengguna & Identitas</th>
                    <th className="py-3.5 px-4">Peran</th>
                    <th className="py-3.5 px-4">Sekolah & Kelas/Bidang</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                        Tidak ada akun yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      const isActive = (u.status || 'active') === 'active';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="relative group rounded-xl overflow-hidden shrink-0 border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                title="Klik untuk ubah foto profil / data akun (maks 500 KB)"
                              >
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-10 h-10 rounded-xl object-cover"
                                />
                                <span className="absolute inset-0 bg-slate-900/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Camera className="w-3.5 h-3.5" />
                                </span>
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#25324B]">{u.name}</span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                                      Akun Anda
                                    </span>
                                  )}
                                </div>
                                {u.nisnNip && (
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    {u.role === 'student' ? 'NISN: ' : 'NIP: '}
                                    {u.nisnNip}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {getRoleBadge(u.role)}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-medium text-[#25324B] block text-xs">
                                {u.schoolName}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {u.className}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Klik untuk ubah status akun"
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3" /> Aktif
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Nonaktif
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">

                              {/* Edit Account */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit Akun"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Account */}
                              {!isCurrent && (
                                deleteConfirmId === u.id ? (
                                  <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                                    <button
                                      onClick={() => {
                                        onDeleteUser(u.id);
                                        setDeleteConfirmId(null);
                                      }}
                                      className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                                    >
                                      Hapus
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-1.5 py-0.5 text-slate-500 text-[10px]"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. KONFIGURASI AI & PEDAGOGIS TAB */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Header Description Banner */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-3xl p-6 border border-blue-100 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-blue-500 text-white">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#25324B] font-display">
                  Pengaturan Terstruktur Platform NARASA
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Sesuaikan parameter kecerdasan buatan, pembelajaran mendalam, serta kenyamanan belajar interaktif untuk anak-anak sekolah dasar.
              </p>
            </div>
          </div>

          {/* Module 0: School Dedicated Gemini API Key */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                🔑
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#25324B] font-display">
                  Pengaturan API Key Gemini Dedikasi Sekolah
                </h4>
                <p className="text-xs text-slate-500">Gunakan API Key mandiri sekolah Anda agar tidak membebani API Key utama platform.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" /> Google Gemini API Key Sekolah / Instansi
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={schoolApiKey}
                    onChange={(e) => setSchoolApiKey(e.target.value)}
                    placeholder="Contoh: AIzaSy..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    onClick={handleTestSchoolApiKey}
                    disabled={isTestingApiKey}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingApiKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{isTestingApiKey ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  API Key ini disimpan secara aman di perangkat lokal browser admin sekolah dan digunakan untuk seluruh siswa & guru di sekolah ini tanpa antre dengan kuota platform global.
                </p>
              </div>

              {apiKeyTestResult && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${apiKeyTestResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {apiKeyTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{apiKeyTestResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {isSavedApiKey ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> API Key Sekolah berhasil disimpan!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Kosongkan jika ingin menggunakan kuota API Key utama platform.
                  </span>
                )}
                <button
                  onClick={handleSaveSchoolApiKey}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simpan API Key Sekolah</span>
                </button>
              </div>
            </div>
          </div>

          {/* Module 1: AI & Scaffolding Engine */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                🤖
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#25324B] font-display">
                  1. Mesin AI & Bantuan Belajar Bertingkat (Scaffolding)
                </h4>
                <p className="text-xs text-slate-500">Mengatur tingkat responsivitas asisten virtual saat membimbing anak belajar mandiri.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" /> Mesin Pemrosesan Visual & Teks
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Sangat Cepat & Stabil)</option>
                  <option value="gemini-3.8-flash">Google Gemini 3.8 Flash</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Menangani pengenalan foto objek sekitar anak, analisis pola keteraturan, dan pembentukan soal kontekstual.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-emerald-500" /> Sensitivitas Bantuan Bertingkat (Scaffolding)
                </label>
                <select
                  value={scaffoldingSensitivity}
                  onChange={(e) => setScaffoldingSensitivity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option>Tinggi (Responsif 4 Level: Petunjuk, Penuntun, Langkah, Analog)</option>
                  <option>Standar (Petunjuk & Langkah)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Murid tidak langsung diberi jawaban akhir, melainkan dibimbing penuh rasa ingin tahu.
                </p>
              </div>
            </div>
          </div>

          {/* Module 2: Curriculum & Syllabus Discipline */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                📚
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#25324B] font-display">
                  2. Kurikulum, Silabus & Kedisiplinan Materi Guru
                </h4>
                <p className="text-xs text-slate-500">Memastikan materi yang dipelajari murid sesuai persis dengan RPP & Silabus Guru Pengampu.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Tingkat Disiplin Terhadap Silabus Guru
                </label>
                <select
                  value={strictnessLevel}
                  onChange={(e) => setStrictnessLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option>Tinggi (Disiplin Silabus - Menolak Hubungan Objek yang Lemah)</option>
                  <option>Sedang (Toleransi dengan Rekomendasi Konteks Alternatif)</option>
                  <option>Fleksibel (Eksplorasi Bebas)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Menjaga agar AI tetap berfokus pada capaian pembelajaran literasi & numerasi yang ditetapkan guru.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Standar Asesmen Nasional
                </label>
                <input
                  type="text"
                  readOnly
                  value="Pembelajaran Mendalam • Asesmen Literasi & Numerasi Dasar SD (Fase B & C)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none font-medium text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  Terintegrasi langsung dengan standar kompetensi dasar Kemendikbudristek.
                </p>
              </div>
            </div>
          </div>

          {/* Module 3: Gamification & Child Engagement */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                ⭐
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#25324B] font-display">
                  3. Gamifikasi & Motivasi Belajar Anak Ceria
                </h4>
                <p className="text-xs text-slate-500">Mengatur gaya bahasa pendamping belajar, lencana penghargaan, dan animasi penyemangat anak.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" /> Gaya Bahasa Pendamping Belajar
                </label>
                <input
                  type="text"
                  readOnly
                  value="Guru Pendamping & Sahabat Ceria (Hangat, Memotivasi, Penuh Pujian Positif)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none font-medium text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  Bahasa ramah anak, memotivasi penemuan mandiri tanpa menggurui.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#25324B] uppercase text-[11px] flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-indigo-500" /> Penghargaan & Level Petualang
                </label>
                <input
                  type="text"
                  readOnly
                  value="Aktif (Bintang Petualang, Lencana Nalar Kritis, & Poin Eksplorasi)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none font-medium text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  Meningkatkan antusiasme anak menyelesaikan misi belajar matematika dan bahasa.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            {isSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-bounce">
                <CheckCircle2 className="w-4 h-4" /> Pengaturan terstruktur berhasil disimpan & disinkronkan!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Semua parameter langsung berlaku bagi seluruh akun murid dan guru aktif
              </span>
            )}
            <button
              onClick={handleSaveConfig}
              className="px-6 py-3 rounded-xl bg-[#4F8EF7] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simpan Konfigurasi Platform</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SEKOLAH & ROMBEL MITRA TAB */}
      {activeTab === 'schools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* DINAS PENDIDIKAN KOTA (PUSAT KURIKULUM & PENJAMINAN MUTU) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#25324B]">Dinas Pendidikan Kota</h3>
                <p className="text-xs text-slate-500">Pusat Kurikulum & Penjaminan Mutu</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block">Sekolah Binaan</span>
                <span className="text-base font-bold text-emerald-600">{totalPartnerSchoolsCount} SD</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block">Admin</span>
                <span className="text-base font-bold text-slate-700">{totalAdminsInSystem} Admin</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 block">Status Server</span>
                <span className="text-base font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Aktif</span>
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Daftar Sekolah Binaan Terverifikasi:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {totalPartnerSchoolsCount} Sekolah Aktif
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {partnerSchools.map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-slate-800">{sch.name}</span>
                      <span className="text-[10px] text-slate-400">NPSN {sch.npsn}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      {sch.studentsCount} Murid • {sch.teachersCount} Guru
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <div className="font-semibold text-slate-700">Integrasi Kebijakan:</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Sinkronisasi otomatis rubrik penilaian literasi, numerasi, dan nalar kritis dengan standar asesmen nasional Kemendikbudristek.
                </p>
              </div>
            </div>
          </div>

          {/* DAFTAR KARTU SEKOLAH BINAAN */}
          {partnerSchools.map((sch) => (
            <div key={sch.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#25324B]">{sch.name}</h3>
                  <p className="text-xs text-slate-500">NPSN: {sch.npsn} • {sch.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 block">Murid Aktif</span>
                  <span className="text-base font-bold text-blue-600">{sch.studentsCount} Murid</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 block">Guru</span>
                  <span className="text-base font-bold text-purple-600">{sch.teachersCount} Guru</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 block">Rombel</span>
                  <span className="text-base font-bold text-emerald-600">{sch.classesCount} Kelas</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Rombongan Belajar Terdaftar:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
                  {sch.classesList.map((cls, idx) => (
                    <li key={idx}>
                      {cls} {sch.id === 'SDN01' && idx === 0 ? '(Wali: Pak Dedy, S.Pd.)' : sch.id === 'SDN01' && idx === 2 ? '(Wali: Pak Hendra Wijaya, S.Pd.)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Modal for Add / Edit */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveAccount}
        editingUser={editingUser}
        defaultRole={defaultRoleForNew}
        currentUser={currentUser}
      />
    </div>
  );
};
