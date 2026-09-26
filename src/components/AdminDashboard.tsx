import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { UserProfile, UserRole, LearningMission, StudentActivitySession, StudentGroup } from '../types';
import { toast } from './Toast';
import { NarasaLogo } from './NarasaLogo';
import { dbFetchSystemSettings, dbSaveSystemSettings } from '../lib/supabase';
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
  RefreshCw,
  Camera,
  Building2
} from 'lucide-react';
import { UserAccountModal } from './UserAccountModal';
import { SchoolSettingsManager } from './SchoolSettingsManager';
import { getDefaultAvatar } from '../data/avatarData';
import adminBannerBg from '../assets/images/literasi_numerasi_bright_bg_1789741597196.jpg';

interface AdminDashboardProps {
  users: UserProfile[];
  currentUser: UserProfile;
  missions?: LearningMission[];
  sessions?: StudentActivitySession[];
  groups?: StudentGroup[];
  initialTab?: 'accounts' | 'config' | 'schools' | 'school_settings';
  onAddUser: (userData: Omit<UserProfile, 'id'>) => void;
  onUpdateUser: (userData: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserProfile) => void;
  onRefreshData?: () => void;
  onUpdateSchoolName?: (schoolId: string, newSchoolName: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  currentUser,
  missions = [],
  sessions = [],
  groups = [],
  initialTab,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  onRefreshData,
  onUpdateSchoolName
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'config' | 'schools' | 'school_settings'>(
    initialTab || 'accounts'
  );
  const [selectedSchoolIdForEdit, setSelectedSchoolIdForEdit] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [accountFilterRole, setAccountFilterRole] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // School Gemini API Key states
  const [schoolApiKey, setSchoolApiKey] = useState(() => localStorage.getItem('narasa_school_gemini_key') || '');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavedApiKey, setIsSavedApiKey] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Load saved API Key & Settings from Database on mount
  useEffect(() => {
    setIsLoadingSettings(true);
    dbFetchSystemSettings()
      .then((settings) => {
        if (settings.geminiApiKey) {
          setSchoolApiKey(settings.geminiApiKey);
          localStorage.setItem('narasa_school_gemini_key', settings.geminiApiKey.trim());
        }
        if (settings.defaultModel) {
          setModelName(settings.defaultModel);
        }
        if (settings.visionSensitivity) {
          setStrictnessLevel(settings.visionSensitivity);
        }
      })
      .catch((e) => console.warn('Gagal memuat pengaturan sistem:', e))
      .finally(() => setIsLoadingSettings(false));
  }, []);

  const handleSaveSchoolApiKey = async () => {
    const key = schoolApiKey.trim();
    localStorage.setItem('narasa_school_gemini_key', key);
    setIsSavedApiKey(true);

    // Save to Database (Server file system & Supabase)
    await dbSaveSystemSettings({
      geminiApiKey: key,
      defaultModel: modelName,
      visionSensitivity: strictnessLevel
    });

    toast.success(
      'API Key Tersimpan di Database!',
      'Kunci API Key Gemini Sekolah Anda telah tersimpan secara permanen di database server dan aktif untuk seluruh rombel & kelas.'
    );
    setTimeout(() => setIsSavedApiKey(false), 3500);
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

  // Template, Export & Import Handlers (Excel .xlsx with customized column widths & headers)
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'Nama Lengkap': 'Budi Santoso',
          'Peran': 'student',
          'Username': 'budisantoso',
          'Password': 'password123',
          'Nama Sekolah': 'SDN 01 Nusantara',
          'ID Sekolah': 'SDN01',
          'Rombel / Kelas': 'Kelas V-A',
          'ID Kelas': 'V-A',
          'NISN / NIP': '0123456789',
          'Nomor Telepon': '081234567890',
          'Jenis Kelamin': 'male',
          'Status Akun': 'active',
          'Tipe Akun': 'Individu',
          'Daftar Anggota Kelompok': ''
        },
        {
          'Nama Lengkap': 'Kelompok Peneliti Cilik Garuda',
          'Peran': 'student',
          'Username': 'kelompokgaruda',
          'Password': 'garuda2024',
          'Nama Sekolah': 'SDN 01 Nusantara',
          'ID Sekolah': 'SDN01',
          'Rombel / Kelas': 'Kelas V-A',
          'ID Kelas': 'V-A',
          'NISN / NIP': 'KELOMPOK-01',
          'Nomor Telepon': '081234567891',
          'Jenis Kelamin': 'male',
          'Status Akun': 'active',
          'Tipe Akun': 'Kelompok',
          'Daftar Anggota Kelompok': 'Budi Santoso; Siti Rahmawati; Ahmad Dani; Ayu Lestari'
        },
        {
          'Nama Lengkap': 'Dra. Siti Aminah, M.Pd.',
          'Peran': 'teacher',
          'Username': 'sitiaminah',
          'Password': 'guru2024',
          'Nama Sekolah': 'SDN 01 Nusantara',
          'ID Sekolah': 'SDN01',
          'Rombel / Kelas': 'Wali Kelas V-A • Guru IPA',
          'ID Kelas': 'V-A',
          'NISN / NIP': '198001012005012001',
          'Nomor Telepon': '081122334455',
          'Jenis Kelamin': 'female',
          'Status Akun': 'active',
          'Tipe Akun': 'Individu',
          'Daftar Anggota Kelompok': ''
        },
        {
          'Nama Lengkap': 'Drs. Hendro Wibowo, M.Si.',
          'Peran': 'school_admin',
          'Username': 'hendrowibowo',
          'Password': 'admin123',
          'Nama Sekolah': 'SDN 01 Nusantara',
          'ID Sekolah': 'SDN01',
          'Rombel / Kelas': 'Admin Sekolah',
          'ID Kelas': 'ALL',
          'NISN / NIP': '197503121999031002',
          'Nomor Telepon': '081399887766',
          'Jenis Kelamin': 'male',
          'Status Akun': 'active',
          'Tipe Akun': 'Individu',
          'Daftar Anggota Kelompok': ''
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Set explicit optimal column widths for clean readability
      worksheet['!cols'] = [
        { wch: 34 }, // Nama Lengkap
        { wch: 18 }, // Peran
        { wch: 22 }, // Username
        { wch: 18 }, // Password
        { wch: 28 }, // Nama Sekolah
        { wch: 14 }, // ID Sekolah
        { wch: 28 }, // Rombel / Kelas
        { wch: 12 }, // ID Kelas
        { wch: 24 }, // NISN / NIP
        { wch: 18 }, // Nomor Telepon
        { wch: 16 }, // Jenis Kelamin
        { wch: 14 }, // Status Akun
        { wch: 16 }, // Tipe Akun
        { wch: 45 }  // Daftar Anggota Kelompok
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Templat_Akun_Pengguna');
      XLSX.writeFile(workbook, 'Template_Import_Akun_NARASA.xlsx');

      toast.success(
        'Templat Excel Berhasil Diunduh!',
        'Gunakan file Template_Import_Akun_NARASA.xlsx untuk mengisi data akun siswa, kelompok, guru, atau admin.'
      );
    } catch (err) {
      console.error('Download template error:', err);
      toast.error('Gagal Mengunduh Templat', 'Terjadi kesalahan saat membuat file templat Excel.');
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredUsers.map((u, idx) => {
        const isGroup = u.isGroup || (u.groupMembers && u.groupMembers.length > 0);
        return {
          'No': idx + 1,
          'Nama Lengkap': u.name,
          'Peran': u.role,
          'Username': u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          'Password': u.password || '123456',
          'Nama Sekolah': u.schoolName || '',
          'ID Sekolah': u.schoolId || '',
          'Rombel / Kelas': u.className || '',
          'ID Kelas': u.classId || '',
          'NISN / NIP': u.nisnNip || '',
          'Nomor Telepon': u.phone || '',
          'Jenis Kelamin': u.gender || 'male',
          'Status Akun': u.status || 'active',
          'Tipe Akun': isGroup ? 'Kelompok' : 'Individu',
          'Daftar Anggota Kelompok': (u.groupMembers || []).join('; ')
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set explicit column widths for clean export table
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 34 }, // Nama Lengkap
        { wch: 18 }, // Peran
        { wch: 22 }, // Username
        { wch: 18 }, // Password
        { wch: 28 }, // Nama Sekolah
        { wch: 14 }, // ID Sekolah
        { wch: 28 }, // Rombel / Kelas
        { wch: 12 }, // ID Kelas
        { wch: 24 }, // NISN / NIP
        { wch: 18 }, // Nomor Telepon
        { wch: 16 }, // Jenis Kelamin
        { wch: 14 }, // Status Akun
        { wch: 16 }, // Tipe Akun
        { wch: 45 }  // Daftar Anggota Kelompok
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Akun_Pengguna');
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Data_Akun_Pengguna_NARASA_${dateStr}.xlsx`);

      toast.success(
        'Ekspor Excel Berhasil!',
        `Berhasil mengekspor ${exportData.length} data akun ke file Data_Akun_Pengguna_NARASA_${dateStr}.xlsx.`
      );
    } catch (err) {
      console.error('Export Excel error:', err);
      toast.error('Gagal Ekspor Excel', 'Terjadi kesalahan saat mengekspor data ke Excel.');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          toast.warning('File Excel Kosong', 'Tidak ada baris data yang ditemukan dalam file Excel.');
          return;
        }

        let addedCount = 0;
        rawRows.forEach((row: any) => {
          // Normalize column headers (supports both Indonesian and English keys)
          const name = (row['Nama Lengkap'] || row['nama'] || row['name'] || row['Nama'] || '').toString().trim();
          if (!name) return;

          const rawRole = (row['Peran'] || row['role'] || row['peran'] || 'student').toString().toLowerCase().trim();
          let role: UserRole = 'student';
          if (rawRole.includes('teacher') || rawRole.includes('guru')) role = 'teacher';
          else if (rawRole.includes('school_admin') || rawRole.includes('admin sekolah')) role = 'school_admin';
          else if (rawRole.includes('central_admin') || rawRole.includes('admin pusat') || rawRole === 'admin') role = 'central_admin';

          const username = (row['Username'] || row['username'] || row['User Name'] || name.toLowerCase().replace(/[^a-z0-9]/g, '')).toString().replace(/^@/, '').trim();
          const password = (row['Password'] || row['password'] || row['Kata Sandi'] || '123456').toString().trim();
          const schoolName = (row['Nama Sekolah'] || row['schoolName'] || row['sekolah'] || 'SDN 01 Nusantara').toString().trim();
          const schoolId = (row['ID Sekolah'] || row['schoolId'] || 'SDN01').toString().trim();
          const className = (row['Rombel / Kelas'] || row['className'] || row['kelas'] || (role === 'student' ? 'Kelas V-A' : role === 'teacher' ? 'Wali Kelas V-A • Guru IPA' : 'Admin Sekolah')).toString().trim();
          const classId = (row['ID Kelas'] || row['classId'] || (role === 'student' ? 'V-A' : role === 'teacher' ? 'V-A' : 'ALL')).toString().trim();
          const nisnNip = (row['NISN / NIP'] || row['nisnNip'] || row['nisn'] || row['nip'] || '').toString().trim();
          const phone = (row['Nomor Telepon'] || row['phone'] || row['telepon'] || row['no_hp'] || '').toString().trim();
          
          const rawGender = (row['Jenis Kelamin'] || row['gender'] || 'male').toString().toLowerCase().trim();
          const gender: 'male' | 'female' = rawGender.includes('fem') || rawGender.includes('perempuan') || rawGender.includes('wanita') || rawGender === 'p' ? 'female' : 'male';
          
          const rawStatus = (row['Status Akun'] || row['status'] || 'active').toString().toLowerCase().trim();
          const status: 'active' | 'inactive' = rawStatus.includes('inact') || rawStatus.includes('non') || rawStatus.includes('tidak') ? 'inactive' : 'active';

          const rawType = (row['Tipe Akun'] || row['isGroup'] || '').toString().toLowerCase();
          const rawMembers = (row['Daftar Anggota Kelompok'] || row['groupMembers'] || row['anggota'] || '').toString().trim();
          const isGroup = rawType.includes('kelompok') || rawMembers.length > 0;
          const groupMembers = rawMembers ? rawMembers.split(/[;,]/).map((m: string) => m.trim()).filter(Boolean) : undefined;

          onAddUser({
            name,
            role,
            username,
            password,
            schoolName,
            schoolId,
            className,
            classId,
            nisnNip,
            phone,
            gender,
            status,
            isGroup,
            groupMembers,
            email: `${username}@narasa.sch.id`,
            avatar: getDefaultAvatar(role, gender),
            joinedDate: 'Juli 2024'
          });
          addedCount++;
        });

        toast.success(
          'Impor Excel Berhasil!',
          `Berhasil mengimpor ${addedCount} data akun pengguna baru dari file Excel.`
        );
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        toast.error('Gagal Membaca File Excel', 'Format file Excel tidak valid atau rusak. Silakan gunakan templat resmi NARASA.');
      } finally {
        if (excelInputRef.current) {
          excelInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // System config states
  const [modelName, setModelName] = useState('gemini-3.1-flash-lite');
  const [strictnessLevel, setStrictnessLevel] = useState('Strict (Sangat Disiplin Kurikulum)');
  const [scaffoldingSensitivity, setScaffoldingSensitivity] = useState('Tinggi (Responsif 4 Level)');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveConfig = async () => {
    setIsSaved(true);
    await dbSaveSystemSettings({
      geminiApiKey: schoolApiKey.trim(),
      defaultModel: modelName,
      visionSensitivity: strictnessLevel
    });
    toast.success(
      'Konfigurasi Disimpan ke Database!',
      'Pengaturan scaffold AI, model Gemini, dan sensitivitas kurikulum berhasil disimpan secara permanen di database server.'
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 text-left">
      {/* Header Banner with White Theme & Literacy-Numeracy Illustration */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-slate-200/90 bg-white group">
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            <NarasaLogo size="sm" withHoverAnimation={true} withGlow={true} containerClassName="rounded-xl" />
            <h1 className="text-lg sm:text-2xl font-bold font-display text-[#1E293B]">
              Panel Administrator & Manajemen Akun
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Kelola data akun murid, guru pengampu, administrator, serta keselarasan kurikulum Pembelajaran Mendalam.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenCreate('student')}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-[#4F8EF7] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'schools'
              ? 'bg-[#4F8EF7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Sekolah & Rombel Mitra</span>
        </button>

        {/* Tab 4: Pengaturan Sekolah (Hanya untuk Admin Pusat & Admin Sekolah) */}
        {(currentUser.role === 'central_admin' || currentUser.role === 'school_admin' || currentUser.role === 'admin') && (
          <button
            onClick={() => setActiveTab('school_settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'school_settings'
                ? 'bg-[#4F8EF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Pengaturan Sekolah</span>
          </button>
        )}
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
                    className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Unduh Templat Excel (.xlsx)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden lg:inline">Templat Excel</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="px-2.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Ekspor Data ke Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden lg:inline">Ekspor Excel</span>
                  </button>
                  <button
                    onClick={() => excelInputRef.current?.click()}
                    className="px-2.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Impor Akun dari Excel (.xlsx)"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden lg:inline">Impor Excel</span>
                  </button>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-[#25324B]">{u.name}</span>
                                  {u.gender && (
                                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                                      u.gender === 'female'
                                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                                    }`}>
                                      {u.gender === 'female' ? '👧 Putri' : '👦 Putra'}
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                                      Akun Anda
                                    </span>
                                  )}
                                </div>
                                {u.nisnNip && (
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    {u.role === 'student' ? 'NISN: ' : 'NIP. '}
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
                  API Key ini disimpan secara aman di database server dan disinkronkan otomatis untuk seluruh siswa & guru di sekolah ini tanpa antre dengan kuota platform global.
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
                    <CheckCircle2 className="w-4 h-4" /> API Key berhasil disimpan ke Database Server!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Kosongkan jika ingin menggunakan kuota API Key bawaan server.
                  </span>
                )}
                <button
                  onClick={handleSaveSchoolApiKey}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simpan API Key ke Database</span>
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
                  <option value="gemini-3.1-flash-lite">Google Gemini 3.1 Flash Lite (Sangat Cepat, Stabil & Tanpa Antre)</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                  <option value="gemini-3.8-flash">Google Gemini 3.8 Flash</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Penalaran Kompleks)</option>
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

              {/* Quick Settings Shortcut (Central Admin or Matching School Admin) */}
              {(currentUser.role === 'central_admin' || currentUser.role === 'admin' || (currentUser.role === 'school_admin' && currentUser.schoolId === sch.id)) && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedSchoolIdForEdit(sch.id);
                      setActiveTab('school_settings');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Kelola Data Sekolah Ini</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. PENGATURAN SEKOLAH TAB (Hanya untuk Admin Pusat & Admin Sekolah) */}
      {activeTab === 'school_settings' && (
        <SchoolSettingsManager
          currentUser={currentUser}
          users={users}
          initialSelectedSchoolId={selectedSchoolIdForEdit}
          onUpdateSchoolName={onUpdateSchoolName}
        />
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
