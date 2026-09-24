import React, { useState, useEffect } from 'react';
import { UserProfile, SchoolProfile } from '../types';
import { toast } from './Toast';
import { dbUpsertSchool, dbDeleteSchool, dbFetchSchools, isSupabaseConfigured } from '../lib/supabase';
import {
  School,
  Building2,
  ShieldCheck,
  Award,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Globe,
  UserCheck,
  Calendar,
  Save,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Sparkles,
  Users,
  GraduationCap,
  Trash2,
  Search,
  LayoutGrid,
  FileText,
  Building
} from 'lucide-react';

export const INITIAL_SCHOOL_PROFILES: SchoolProfile[] = [
  {
    id: 'SDN01',
    name: 'SDN 01 Nusantara',
    npsn: '20104050',
    level: 'SD / MI',
    status: 'Negeri',
    accreditation: 'A (Unggul)',
    curriculum: 'Kurikulum Merdeka (Fase A, B, C)',
    headmaster: 'Dra. Hj. Siti Nurjanah, M.Pd.',
    headmasterNip: '197203151998032004',
    supervisorName: 'Dr. H. Bambang Soetopo, M.M.',
    supervisorNip: '196805121992031003',
    phone: '(021) 7890123',
    email: 'sdn01nusantara@kemdikbud.go.id',
    website: 'https://sdn01nusantara.sch.id',
    address: 'Jl. Pendidikan Merdeka No. 45',
    rtRw: '005/002',
    village: 'Menteng',
    district: 'Menteng',
    city: 'Kota Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10310',
    motto: 'Cerdas, Berkarakter, dan Berdaya Nalar Kritis',
    academicYear: '2024/2025',
    activeSemester: 'Ganjil',
    category: 'Sekolah Penggerak',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SDN02',
    name: 'SDN 02 Kenanga',
    npsn: '20104051',
    level: 'SD / MI',
    status: 'Negeri',
    accreditation: 'A (Unggul)',
    curriculum: 'Kurikulum Merdeka (Fase A, B, C)',
    headmaster: 'Drs. H. Mulyadi, M.Pd.',
    headmasterNip: '197008101995121001',
    supervisorName: 'Dr. H. Bambang Soetopo, M.M.',
    supervisorNip: '196805121992031003',
    phone: '(021) 7890456',
    email: 'sdn02kenanga@kemdikbud.go.id',
    website: 'https://sdn02kenanga.sch.id',
    address: 'Jl. Kenanga Asri No. 12',
    rtRw: '003/004',
    village: 'Cempaka Putih',
    district: 'Cempaka Putih',
    city: 'Kota Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10510',
    motto: 'Maju Bersama, Mandiri, dan Berprestasi',
    academicYear: '2024/2025',
    activeSemester: 'Ganjil',
    category: 'Sekolah Rujukan Kurikulum Merdeka',
    updatedAt: new Date().toISOString()
  }
];

interface SchoolSettingsManagerProps {
  currentUser: UserProfile;
  users: UserProfile[];
  initialSelectedSchoolId?: string;
  onUpdateSchoolName?: (schoolId: string, newSchoolName: string) => void;
}

export const SchoolSettingsManager: React.FC<SchoolSettingsManagerProps> = ({
  currentUser,
  users,
  initialSelectedSchoolId,
  onUpdateSchoolName
}) => {
  // Access Control: Only central_admin and school_admin (or system admin) can access
  const isCentralAdmin = currentUser.role === 'central_admin' || currentUser.role === 'admin';
  const isSchoolAdmin = currentUser.role === 'school_admin';
  const hasAccess = isCentralAdmin || isSchoolAdmin;

  // Persistent schools data state
  const [schools, setSchools] = useState<SchoolProfile[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_schools_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat profil sekolah dari localStorage:', e);
    }
    return INITIAL_SCHOOL_PROFILES;
  });

  // Ensure all schools from user profiles exist in schools list
  useEffect(() => {
    const existingIds = new Set(schools.map((s) => s.id));
    const missingSchools: SchoolProfile[] = [];

    users.forEach((u) => {
      if (u.schoolId && u.schoolId !== 'CENTRAL' && !existingIds.has(u.schoolId)) {
        existingIds.add(u.schoolId);
        missingSchools.push({
          id: u.schoolId,
          name: u.schoolName || `Sekolah ${u.schoolId}`,
          npsn: `2010${Math.floor(1000 + Math.random() * 9000)}`,
          level: 'SD / MI',
          status: 'Negeri',
          accreditation: 'A (Unggul)',
          curriculum: 'Kurikulum Merdeka',
          headmaster: 'Drs. Pimpinan Sekolah, M.Pd.',
          headmasterNip: '197501012000031001',
          supervisorName: 'Dr. Pengawas Pembina, M.M.',
          supervisorNip: '196805121992031003',
          phone: '(021) 7890000',
          email: `${u.schoolId.toLowerCase()}@kemdikbud.go.id`,
          website: `https://${u.schoolId.toLowerCase()}.sch.id`,
          address: 'Jl. Pendidikan No. 01',
          rtRw: '001/001',
          village: 'Pusat',
          district: 'Pusat',
          city: 'Kota Jakarta Pusat',
          province: 'DKI Jakarta',
          postalCode: '10110',
          motto: 'Maju Bersama, Berdaya Nalar Kritis',
          academicYear: '2024/2025',
          activeSemester: 'Ganjil',
          category: 'Sekolah Binaan',
          updatedAt: new Date().toISOString()
        });
      }
    });

    if (missingSchools.length > 0) {
      setSchools((prev) => {
        const next = [...prev, ...missingSchools];
        try {
          localStorage.setItem('narasa_schools_profile_data', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [users]);

  // Selected school id
  // For school_admin: strictly locked to their schoolId
  // For central_admin: can select any school, defaults to initialSelectedSchoolId, first or SDN01
  const initialSelectedId = isSchoolAdmin
    ? currentUser.schoolId || 'SDN01'
    : initialSelectedSchoolId || schools[0]?.id || 'SDN01';

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(initialSelectedId);

  // Sync when initialSelectedSchoolId prop changes
  useEffect(() => {
    if (initialSelectedSchoolId && (!isSchoolAdmin || initialSelectedSchoolId === currentUser.schoolId)) {
      setSelectedSchoolId(initialSelectedSchoolId);
    }
  }, [initialSelectedSchoolId, isSchoolAdmin, currentUser.schoolId]);

  // Current editing form state
  const activeSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0] || INITIAL_SCHOOL_PROFILES[0];
  const [formData, setFormData] = useState<SchoolProfile>({ ...activeSchool });

  // Sub-tabs: 'form' for detailed editing, 'list' for managing the Supabase schools table
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'list'>('form');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add School Modal state (central admin only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolNpsn, setNewSchoolNpsn] = useState('');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('Kota Jakarta Pusat');

  // Update formData when selectedSchoolId changes
  useEffect(() => {
    const s = schools.find((item) => item.id === selectedSchoolId);
    if (s) {
      setFormData({ ...s });
    }
  }, [selectedSchoolId, schools]);

  // Keep schoolAdmin locked to their own school
  useEffect(() => {
    if (isSchoolAdmin && currentUser.schoolId && selectedSchoolId !== currentUser.schoolId) {
      setSelectedSchoolId(currentUser.schoolId);
    }
  }, [isSchoolAdmin, currentUser.schoolId]);

  // If user has no access, show access denied card
  if (!hasAccess) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-rose-900">Akses Dibatasi</h3>
          <p className="text-sm text-rose-700 mt-1">
            Menu Pengaturan Sekolah hanya dapat diakses oleh <strong>Admin Pusat</strong> dan <strong>Admin Sekolah</strong>.
          </p>
        </div>
        <p className="text-xs text-rose-500">
          Akun Anda saat ini login sebagai peran <strong>{currentUser.role}</strong>. Silakan beralih ke akun Admin untuk mengelola data sekolah.
        </p>
      </div>
    );
  }

  // Calculate live statistics for selected school
  const schoolUsers = users.filter((u) => u.schoolId === activeSchool.id);
  const studentCount = schoolUsers.filter((u) => u.role === 'student').length;
  const teacherCount = schoolUsers.filter((u) => u.role === 'teacher').length;
  const distinctClasses = Array.from(
    new Set(schoolUsers.filter((u) => u.classId && u.classId !== 'ALL').map((u) => u.className))
  );

  const handleInputChange = (field: keyof SchoolProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Load from Supabase on mount if available
  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured()) {
      dbFetchSchools().then((remoteSchools) => {
        if (isMounted && Array.isArray(remoteSchools) && remoteSchools.length > 0) {
          setSchools(remoteSchools);
          try {
            localStorage.setItem('narasa_schools_profile_data', JSON.stringify(remoteSchools));
          } catch (e) {}
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Gagal Menyimpan', 'Nama resmi sekolah tidak boleh kosong.');
      return;
    }
    if (!formData.npsn.trim()) {
      toast.error('Gagal Menyimpan', 'NPSN sekolah harus diisi.');
      return;
    }

    const updatedSchool: SchoolProfile = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    const updatedList = schools.map((s) => (s.id === updatedSchool.id ? updatedSchool : s));
    setSchools(updatedList);
    localStorage.setItem('narasa_schools_profile_data', JSON.stringify(updatedList));

    // Propagate to Supabase if connected
    await dbUpsertSchool(updatedSchool);

    // Propagate school name update if needed
    if (onUpdateSchoolName && formData.name !== activeSchool.name) {
      onUpdateSchoolName(activeSchool.id, formData.name);
    }

    toast.success(
      'Pengaturan Sekolah Disimpan',
      `Data sekolah ${formData.name} berhasil disimpan dan disinkronkan ke basis data.`
    );
  };

  const handleResetToDefault = () => {
    const original = INITIAL_SCHOOL_PROFILES.find((s) => s.id === selectedSchoolId);
    if (original) {
      setFormData({ ...original });
      toast.info('Form Direset', 'Data formulir dikembalikan ke nilai awal.');
    }
  };

  // Add new school handler (Admin Pusat only)
  const handleAddNewSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolNpsn.trim() || !newSchoolId.trim()) {
      toast.error('Data Belum Lengkap', 'Nama sekolah, ID, dan NPSN wajib diisi.');
      return;
    }

    const normalizedId = newSchoolId.toUpperCase().replace(/\s+/g, '_');
    if (schools.some((s) => s.id === normalizedId)) {
      toast.error('ID Sekolah Sudah Ada', `Sekolah dengan ID ${normalizedId} sudah terdaftar.`);
      return;
    }

    const newSchool: SchoolProfile = {
      id: normalizedId,
      name: newSchoolName.trim(),
      npsn: newSchoolNpsn.trim(),
      level: 'SD / MI',
      status: 'Negeri',
      accreditation: 'A (Unggul)',
      curriculum: 'Kurikulum Merdeka (Fase A, B, C)',
      headmaster: 'Kepala Sekolah Baru, M.Pd.',
      headmasterNip: '197501012000011001',
      supervisorName: 'Pengawas Pembina Dinas',
      phone: '(021) 1234567',
      email: `${normalizedId.toLowerCase()}@sekolah.sch.id`,
      address: 'Jl. Raya Pendidikan No. 1',
      city: newSchoolCity,
      province: 'DKI Jakarta',
      postalCode: '10000',
      motto: 'Mewujudkan Profil Pelajar Pancasila',
      academicYear: '2024/2025',
      activeSemester: 'Ganjil',
      category: 'Sekolah Mitra Narasa',
      updatedAt: new Date().toISOString()
    };

    const nextSchools = [...schools, newSchool];
    setSchools(nextSchools);
    localStorage.setItem('narasa_schools_profile_data', JSON.stringify(nextSchools));

    // Save to Supabase
    await dbUpsertSchool(newSchool);

    setSelectedSchoolId(newSchool.id);
    setIsAddModalOpen(false);
    setNewSchoolName('');
    setNewSchoolNpsn('');
    setNewSchoolId('');

    toast.success('Sekolah Baru Terdaftar', `${newSchool.name} berhasil ditambahkan dan disimpan ke database.`);
  };

  // Delete school handler (Admin Pusat only)
  const handleDeleteSchool = async (school: SchoolProfile) => {
    if (schools.length <= 1) {
      toast.error('Gagal Menghapus', 'Minimal harus ada 1 sekolah terdaftar dalam sistem.');
      return;
    }

    setIsDeleting(true);
    try {
      await dbDeleteSchool(school.id);
      const remainingSchools = schools.filter((s) => s.id !== school.id);
      setSchools(remainingSchools);

      // If active school is the one deleted, switch to the first remaining school
      if (selectedSchoolId === school.id) {
        setSelectedSchoolId(remainingSchools[0]?.id || 'SDN01');
      }

      setSchoolToDelete(null);
      toast.success(
        'Sekolah Berhasil Dihapus',
        `Data sekolah ${school.name} (${school.npsn}) telah dihapus dari tabel Supabase.`
      );
    } catch (err) {
      toast.error('Gagal Menghapus', 'Terjadi kesalahan saat menghapus data sekolah dari Supabase.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list of schools for the List view
  const filteredSchools = schools.filter((s) => {
    const q = schoolSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.npsn.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.headmaster && s.headmaster.toLowerCase().includes(q)) ||
      (s.accreditation && s.accreditation.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Authorization Badge */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Building2 className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight font-display">
                Pengaturan & Data Master Sekolah
              </h2>
              {isCentralAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Pusat (Akses Semua Sekolah)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Sekolah ({activeSchool.name})
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {isCentralAdmin
                ? 'Kelola identitas resmi, legalitas NPSN, pimpinan sekolah, dan kalender akademik seluruh sekolah mitra binaan Dinas Pendidikan.'
                : `Kelola identitas resmi, legalitas NPSN, pimpinan, dan kontak operasional untuk ${activeSchool.name}.`}
            </p>
          </div>

          {/* Quick Info / Add School Button for Central Admin */}
          <div className="flex items-center gap-2 shrink-0">
            {isCentralAdmin && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sekolah Mitra</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Daftar Sekolah vs Formulir Edit) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Daftar Sekolah Supabase</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {schools.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('form')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'form'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Form Pengaturan & Profil</span>
            <span className="text-[10px] text-slate-400 max-w-[140px] truncate hidden sm:inline">
              ({formData.name})
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Tabel Supabase: <code className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md">public.schools</code></span>
        </div>
      </div>

      {/* VIEW MODE 1: DAFTAR SEKOLAH SUPABASE (LIST & MANAGE) */}
      {activeSubTab === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* List Controls: Search & Stats */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama sekolah, NPSN, kota, pimpinan..."
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-500 font-medium">
                  Menampilkan <strong>{filteredSchools.length}</strong> dari <strong>{schools.length}</strong> satuan pendidikan
                </span>
                {isCentralAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Sekolah</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* School Grid Cards */}
          {filteredSchools.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Building className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-700">Tidak Ada Sekolah yang Ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada data sekolah yang cocok dengan kata kunci pencarian "{schoolSearchQuery}".
              </p>
              {schoolSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSchoolSearchQuery('')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchools.map((sch) => {
                const isCurrentActive = sch.id === selectedSchoolId;
                const affiliatedUsers = users.filter((u) => u.schoolId === sch.id);
                const students = affiliatedUsers.filter((u) => u.role === 'student');
                const teachers = affiliatedUsers.filter((u) => u.role === 'teacher');

                return (
                  <div
                    key={sch.id}
                    className={`bg-white rounded-3xl p-5 border transition-all duration-200 space-y-4 hover:shadow-md flex flex-col justify-between relative overflow-hidden ${
                      isCurrentActive
                        ? 'border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    {isCurrentActive && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                        Aktif di Formulir
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Card Header: Icon, Name & NPSN */}
                      <div className="flex items-start gap-3.5 pr-14">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          <School className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#25324B] truncate leading-tight">
                            {sch.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              NPSN: {sch.npsn}
                            </span>
                            <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              ID: {sch.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badges: Level, Status, Accreditation */}
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {sch.level || 'SD / MI'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sch.status || 'Negeri'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Akreditasi {sch.accreditation || 'A'}
                        </span>
                        {sch.category && (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {sch.category}
                          </span>
                        )}
                      </div>

                      {/* Info Details: Headmaster, Address, Contact */}
                      <div className="bg-slate-50/80 rounded-2xl p-3 space-y-2 border border-slate-100 text-[11px]">
                        <div className="flex items-start gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-700 block">Kepala Sekolah:</span>
                            <span className="text-slate-600">{sch.headmaster || '-'}</span>
                            {sch.headmasterNip && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                NIP. {sch.headmasterNip}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="truncate">
                            <span className="text-slate-600">
                              {sch.address ? `${sch.address}, ` : ''}{sch.city || 'Kota Jakarta Pusat'}, {sch.province || 'DKI Jakarta'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                          <span>📧 {sch.email || 'Email belum diisi'}</span>
                          <span>📞 {sch.phone || 'Telp belum diisi'}</span>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                        <div className="p-2 bg-purple-50/50 rounded-xl border border-purple-100/50">
                          <span className="text-[10px] text-purple-600 font-medium block">Murid Terdaftar</span>
                          <span className="font-bold text-purple-900">{students.length} Siswa</span>
                        </div>
                        <div className="p-2 bg-amber-50/50 rounded-xl border border-amber-100/50">
                          <span className="text-[10px] text-amber-600 font-medium block">Pendidik</span>
                          <span className="font-bold text-amber-900">{teachers.length} Guru</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolId(sch.id);
                          setActiveSubTab('form');
                          toast.info('Sekolah Dipilih', `Memuat formulir profil ${sch.name}.`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer flex-1 justify-center"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Pilih & Edit Profil</span>
                      </button>

                      {isCentralAdmin && (
                        <button
                          type="button"
                          onClick={() => setSchoolToDelete(sch)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          title="Hapus data sekolah dari Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: FORM PENGATURAN & IDENTITAS SEKOLAH */}
      {activeSubTab === 'form' && (
        <div className="space-y-6 animate-in fade-in duration-200">
      {/* School Selector (Active with prominent Dropdown for Central Admin, Informative for School Admin) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sekolah yang Sedang Dikelola & Diedit
                </span>
                {isCentralAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Akses Penuh Edit
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#25324B] flex flex-wrap items-center gap-2 mt-0.5">
                <span>{formData.name}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono border border-slate-200">
                  NPSN: {formData.npsn}
                </span>
              </h3>
            </div>
          </div>

          {/* School Selector Switcher (Dropdown for Central Admin) */}
          {isCentralAdmin ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-600 sm:pl-2 whitespace-nowrap flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Sekolah:</span>
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-500 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[220px]"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.npsn}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Otorisasi: <strong>{activeSchool.name} - {activeSchool.npsn}</strong></span>
            </div>
          )}
        </div>

        {/* Live Metrics of Selected School */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100/60">
            <span className="text-[11px] text-blue-600 font-medium block">Jenjang & Status</span>
            <span className="text-xs sm:text-sm font-bold text-blue-950 mt-0.5 block">
              {formData.level} • {formData.status}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
            <span className="text-[11px] text-emerald-600 font-medium block">Akreditasi BAN-S/M</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-950 mt-0.5 block">
              {formData.accreditation}
            </span>
          </div>
          <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100/60">
            <span className="text-[11px] text-purple-600 font-medium block">Murid Terdaftar</span>
            <span className="text-xs sm:text-sm font-bold text-purple-950 mt-0.5 block">
              {studentCount} Murid
            </span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/60">
            <span className="text-[11px] text-amber-700 font-medium block">Guru & Rombel</span>
            <span className="text-xs sm:text-sm font-bold text-amber-950 mt-0.5 block">
              {teacherCount} Guru • {Math.max(distinctClasses.length, 1)} Kelas
            </span>
          </div>
        </div>
      </div>

      {/* Main School Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1: IDENTITAS RESMI SEKOLAH */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
                  <School className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#25324B]">1. Identitas & Legalitas Satuan Pendidikan</h4>
                  <p className="text-[11px] text-slate-500">Data pokok sekolah sesuai Dapodik dan SK Operasional</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Nama Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nama Sekolah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    NPSN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.npsn}
                    onChange={(e) => handleInputChange('npsn', e.target.value)}
                    placeholder="NPSN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  >
                    <option value="SD / MI">SD / MI (Sekolah Dasar)</option>
                    <option value="SMP / MTs">SMP / MTs (Sekolah Menengah Pertama)</option>
                    <option value="SMA / MA">SMA / MA (Sekolah Menengah Atas)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Status Sekolah</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'Negeri' | 'Swasta')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  >
                    <option value="Negeri">Negeri (Pemerintah)</option>
                    <option value="Swasta">Swasta (Yayasan / Mandiri)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Akreditasi BAN-S/M</label>
                  <select
                    value={formData.accreditation}
                    onChange={(e) => handleInputChange('accreditation', e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  >
                    <option value="A (Unggul)">A (Unggul)</option>
                    <option value="B (Baik)">B (Baik)</option>
                    <option value="C">C (Cukup)</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Kurikulum Pembelajaran</label>
                  <input
                    type="text"
                    value={formData.curriculum}
                    onChange={(e) => handleInputChange('curriculum', e.target.value)}
                    placeholder="Kurikulum Pembelajaran (misal: Kurikulum Merdeka)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Kategori / Program Khusus Sekolah</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Kategori / Program Khusus Sekolah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: KEPALA SEKOLAH & PENGAWAS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                  <UserCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#25324B]">2. Kepemimpinan & Pengawas Pembina</h4>
                  <p className="text-[11px] text-slate-500">Penanggung jawab legalitas dan pengesahan rapor/portofolio</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Nama Kepala Sekolah (Lengkap Gelar)
                  </label>
                  <input
                    type="text"
                    value={formData.headmaster}
                    onChange={(e) => handleInputChange('headmaster', e.target.value)}
                    placeholder="Nama Kepala Sekolah (Lengkap Gelar)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    NIP / NUPTK Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.headmasterNip}
                    onChange={(e) => handleInputChange('headmasterNip', e.target.value)}
                    placeholder="NIP / NUPTK Kepala Sekolah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Nama Pengawas Pembina Dinas
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorName || ''}
                    onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                    placeholder="Nama Pengawas Pembina Dinas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    NIP Pengawas Pembina
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorNip || ''}
                    onChange={(e) => handleInputChange('supervisorNip', e.target.value)}
                    placeholder="NIP Pengawas Pembina"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: ALAMAT & LOKASI GEOGRAFIS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#25324B]">3. Alamat & Wilayah Geografis</h4>
                  <p className="text-[11px] text-slate-500">Alamat presisi satuan pendidikan untuk kop surat dan sertifikat</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Alamat Lengkap Jalan</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Alamat Lengkap Jalan / Gedung"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">RT / RW</label>
                  <input
                    type="text"
                    value={formData.rtRw || ''}
                    onChange={(e) => handleInputChange('rtRw', e.target.value)}
                    placeholder="RT / RW"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Kelurahan / Desa</label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    placeholder="Kelurahan / Desa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="Kecamatan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Kota / Kabupaten"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    placeholder="Provinsi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Kode Pos</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Kode Pos"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: KONTAK RESMI & KALENDER AKADEMIK */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                  <Phone className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#25324B]">4. Kontak Resmi & Kalender Akademik</h4>
                  <p className="text-[11px] text-slate-500">Saluran komunikasi dinas dan periode tahun pembelajaran aktif</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Nomor Telepon Kantor</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Nomor Telepon Kantor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Email Resmi Sekolah</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email Resmi Sekolah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Website Resmi</label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="Website Resmi Sekolah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Tahun Ajaran Aktif
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    placeholder="Tahun Ajaran Aktif"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Semester Berjalan</label>
                  <select
                    value={formData.activeSemester}
                    onChange={(e) => handleInputChange('activeSemester', e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  >
                    <option value="Ganjil">Semester Ganjil (1)</option>
                    <option value="Genap">Semester Genap (2)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Motto / Slogan Pendidikan Kontekstual
                  </label>
                  <input
                    type="text"
                    value={formData.motto || ''}
                    onChange={(e) => handleInputChange('motto', e.target.value)}
                    placeholder="Motto / Slogan Pendidikan Kontekstual"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Official School Identity Card Preview & Action Bar */}
          <div className="space-y-6">
            {/* Action Bar Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 sticky top-24">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Simpan Konfigurasi
              </h4>
              <p className="text-xs text-slate-500">
                Pastikan data yang Anda masukkan sesuai dengan dokumen operasional sekolah dan sinkron dengan sistem Dapodik.
              </p>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Data Sekolah</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Asli</span>
              </button>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tersimpan di Penyimpanan Aman Narasa</span>
              </div>
            </div>

            {/* Live Official Kop Surat & Profile Card Preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                    Pratinjau Kop Surat Resmi
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {formData.accreditation}
                </span>
              </div>

              {/* Kop Surat Mock */}
              <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-inner text-center space-y-1 font-serif">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-sans font-bold">
                  Pemerintah Provinsi {formData.province} • Dinas Pendidikan
                </p>
                <h5 className="text-xs font-black tracking-wide font-sans text-slate-900 uppercase">
                  {formData.name}
                </h5>
                <p className="text-[9px] text-slate-500 leading-tight font-sans">
                  {formData.address}, {formData.village ? `Kel. ${formData.village}, ` : ''}Kec. {formData.district || formData.city}, {formData.city} {formData.postalCode}
                </p>
                <p className="text-[8px] text-slate-400 font-sans">
                  Telp: {formData.phone} • Email: {formData.email} {formData.website ? `• Web: ${formData.website}` : ''}
                </p>
                <div className="w-full h-0.5 bg-slate-900 my-1"></div>
                <div className="w-full h-px bg-slate-400 mb-2"></div>

                <div className="text-left font-sans text-[10px] pt-1 text-slate-700">
                  <p className="font-semibold italic">"{formData.motto || 'Pendidikan Bermakna & Berkarakter'}"</p>
                </div>
              </div>

              {/* Key metadata pills */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-slate-700/40 text-[11px]">
                  <span className="text-slate-400">Kepala Sekolah:</span>
                  <span className="font-bold text-white text-right">{formData.headmaster}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700/40 text-[11px]">
                  <span className="text-slate-400">NIP.</span>
                  <span className="font-mono text-slate-200">{formData.headmasterNip}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700/40 text-[11px]">
                  <span className="text-slate-400">Tahun Ajaran:</span>
                  <span className="font-bold text-white">{formData.academicYear} ({formData.activeSemester})</span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-slate-400">Kurikulum:</span>
                  <span className="font-bold text-blue-300">{formData.curriculum}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )}

      {/* MODAL HAPUS SEKOLAH (Admin Pusat Saja - Sinkronisasi Supabase) */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900">Hapus Satuan Pendidikan?</h4>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus data dari tabel <code>public.schools</code></p>
              </div>
            </div>

            <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100 space-y-2 text-xs text-rose-900">
              <p className="font-semibold">
                Apakah Anda yakin ingin menghapus data sekolah ini?
              </p>
              <div className="bg-white/80 rounded-xl p-3 border border-rose-200/50 space-y-1 text-slate-800">
                <div className="font-bold text-sm text-[#25324B]">{schoolToDelete.name}</div>
                <div className="text-[11px] text-slate-600 font-mono">NPSN: {schoolToDelete.npsn} | ID: {schoolToDelete.id}</div>
                <div className="text-[11px] text-slate-500">Kepala Sekolah: {schoolToDelete.headmaster || '-'}</div>
              </div>

              {(() => {
                const countAffiliated = users.filter((u) => u.schoolId === schoolToDelete.id).length;
                if (countAffiliated > 0) {
                  return (
                    <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200/70">
                      ⚠️ Terdapat <strong>{countAffiliated} akun pengguna</strong> (guru/siswa) yang saat ini berafiliasi dengan sekolah ini.
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSchoolToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteSchool(schoolToDelete)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus dari Supabase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SEKOLAH BARU (Admin Pusat Saja) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Plus className="w-5 h-5" />
                </span>
                <h4 className="text-base font-bold text-[#25324B]">Tambah Sekolah Mitra Baru</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewSchool} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">ID Unik Sekolah (Kode Singkat)</label>
                <input
                  type="text"
                  required
                  placeholder="ID Unik Sekolah (Kode Singkat)"
                  value={newSchoolId}
                  onChange={(e) => setNewSchoolId(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Sekolah"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">NPSN</label>
                <input
                  type="text"
                  required
                  placeholder="NPSN"
                  value={newSchoolNpsn}
                  onChange={(e) => setNewSchoolNpsn(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Kota / Wilayah</label>
                <input
                  type="text"
                  placeholder="Kota / Wilayah"
                  value={newSchoolCity}
                  onChange={(e) => setNewSchoolCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  Simpan Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
