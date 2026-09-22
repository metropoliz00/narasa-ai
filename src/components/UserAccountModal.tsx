import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole } from '../types';
import { toast } from './Toast';
import {
  X,
  User,
  GraduationCap,
  ShieldCheck,
  Building,
  Phone,
  Hash,
  Sparkles,
  CheckCircle2,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<UserProfile, 'id'> & { id?: string }) => void;
  editingUser?: UserProfile | null;
  defaultRole?: UserRole;
  currentUser?: UserProfile;
}

const DEFAULT_AVATARS: Record<UserRole, string[]> = {
  student: [
    'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  ],
  teacher: [
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  ],
  school_admin: [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  ],
  central_admin: [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  ],
  admin: [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  ]
};

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  defaultRole = 'student',
  currentUser
}) => {
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('SDN 01 Nusantara');
  const [schoolId, setSchoolId] = useState('SDN01');
  const [className, setClassName] = useState('Kelas V-A');
  const [classId, setClassId] = useState('V-A');
  const [nisnNip, setNisnNip] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[defaultRole]?.[0] || DEFAULT_AVATARS.student[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<{ name: string; sizeKb: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isSchoolAdminLoggedIn = currentUser?.role === 'school_admin';
  const isSelf = !!(editingUser && currentUser && editingUser.id === currentUser.id);

  const MAX_FILE_SIZE = 500 * 1024; // 500 KB

  useEffect(() => {
    setFileError(null);
    setPhotoInfo(null);
    if (editingUser) {
      setRole(editingUser.role);
      setName(editingUser.name);
      setSchoolName(editingUser.schoolName);
      setSchoolId(editingUser.schoolId || 'SDN01');
      setClassName(editingUser.className);
      setClassId(editingUser.classId || 'V-A');
      setNisnNip(editingUser.nisnNip || '');
      setPhone(editingUser.phone || '');
      setStatus(editingUser.status || 'active');
      setAvatar(editingUser.avatar || DEFAULT_AVATARS[editingUser.role]?.[0] || DEFAULT_AVATARS.student[0]);
      setUsername(editingUser.username || '');
      setPassword(editingUser.password || '123456');
    } else {
      const initialRole = defaultRole;
      setRole(initialRole);
      setName('');
      if (isSchoolAdminLoggedIn && currentUser) {
        setSchoolName(currentUser.schoolName);
        setSchoolId(currentUser.schoolId);
      } else {
        setSchoolName('SDN 01 Nusantara');
        setSchoolId('SDN01');
      }
      setClassName(initialRole === 'student' ? 'Kelas V-A' : initialRole === 'teacher' ? 'Wali Kelas V-A • Guru IPA' : 'Admin Sekolah');
      setClassId(initialRole === 'student' ? 'V-A' : initialRole === 'teacher' ? 'V-A' : 'ALL');
      setNisnNip('');
      setPhone('');
      setStatus('active');
      setAvatar(DEFAULT_AVATARS[initialRole]?.[0] || DEFAULT_AVATARS.student[0]);
      setUsername('');
      setPassword('123456');
    }
  }, [editingUser, defaultRole, isOpen, currentUser, isSchoolAdminLoggedIn]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (!editingUser) {
      setAvatar(DEFAULT_AVATARS[newRole]?.[0] || DEFAULT_AVATARS.student[0]);
      setPhotoInfo(null);
      setFileError(null);
      if (newRole === 'student') {
        setClassName('Kelas V-A');
        setClassId('V-A');
      } else if (newRole === 'teacher') {
        setClassName('Wali Kelas V-A • Guru IPA');
        setClassId('V-A');
      } else if (newRole === 'school_admin') {
        setClassName('Admin Sekolah');
        setClassId('ALL');
      } else {
        setClassName('Admin Pusat / Superadmin');
        setClassId('ALL');
        setSchoolName('Pusat Data Pendidikan');
        setSchoolId('CENTRAL');
      }
    }
  };

  const handleFileProcess = (file: File) => {
    setFileError(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      const msg = 'Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WEBP.';
      setFileError(msg);
      toast.warning('Format Tidak Sesuai', msg);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (max 500 KB)
    if (file.size > MAX_FILE_SIZE) {
      const actualKb = (file.size / 1024).toFixed(1);
      const msg = `Ukuran foto (${actualKb} KB) melebihi batas maksimal 500 KB. Silakan pilih foto dengan ukuran lebih kecil atau lakukan kompresi terlebih dahulu.`;
      setFileError(msg);
      toast.error('Ukuran Melebihi Batas (Maks 500 KB)', `File Anda: ${actualKb} KB. Batas maksimal yang diizinkan adalah 500 KB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read file into Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAvatar(dataUrl);
      setPhotoInfo({
        name: file.name,
        sizeKb: (file.size / 1024).toFixed(1)
      });
      setFileError(null);
      toast.success(
        'Foto Profil Siap!',
        `Foto "${file.name}" (${(file.size / 1024).toFixed(1)} KB) berhasil diunggah. Klik Simpan untuk memperbarui profil.`
      );
    };
    reader.onerror = () => {
      const msg = 'Gagal membaca file foto. Silakan coba lagi.';
      setFileError(msg);
      toast.error('Gagal Membaca File', msg);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleResetAvatar = () => {
    const defaultAv = DEFAULT_AVATARS[role]?.[0] || DEFAULT_AVATARS.student[0];
    setAvatar(defaultAv);
    setPhotoInfo(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Foto Direset', 'Foto profil kembali ke avatar ilustrasi bawaan.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAvatar = avatar || DEFAULT_AVATARS[role]?.[0] || DEFAULT_AVATARS.student[0];

    onSave({
      id: editingUser?.id,
      name: name.trim(),
      role,
      avatar: finalAvatar,
      schoolName: schoolName.trim(),
      schoolId: schoolId.trim(),
      className: className.trim(),
      classId: classId.trim(),
      email: editingUser?.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@narasa.id`,
      status,
      nisnNip: nisnNip.trim(),
      phone: phone.trim(),
      username: username.trim() || undefined,
      password: password.trim() || undefined,
      joinedDate: editingUser?.joinedDate || 'Hari ini'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${
              role === 'student' ? 'bg-[#4F8EF7]' : role === 'teacher' ? 'bg-[#7C5CFC]' : 'bg-emerald-600'
            }`}>
              {role === 'student' ? <User className="w-5 h-5" /> : role === 'teacher' ? <GraduationCap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#25324B] font-display">
                {isSelf ? 'Atur Profil Saya' : editingUser ? 'Edit Data Akun' : 'Tambah Akun Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSelf 
                  ? 'Perbarui foto profil, nama, username, dan kata sandi Anda'
                  : 'Kelola kredensial & hak akses sesuai ID Sekolah & ID Kelas'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left text-xs sm:text-sm">
          {/* Menu Ubah Foto Profil (Maks. 500 KB) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#25324B] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Foto Profil Akun</span>
              </label>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Maksimal 500 KB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              {/* Avatar Preview */}
              <div className="relative shrink-0 group">
                <img
                  src={avatar}
                  alt="Preview Foto Profil"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer"
                  title="Klik untuk mengganti foto profil"
                >
                  <Upload className="w-4 h-4" />
                  <span>Ubah</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 w-full p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih / Upload Foto</span>
                  </button>

                  {photoInfo && (
                    <button
                      type="button"
                      onClick={handleResetAvatar}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus foto custom & gunakan avatar bawaan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  atau seret & letakkan foto ke area ini
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Format: JPG, PNG, WEBP • Batas ukuran: <strong>500 KB</strong>
                </p>

                {photoInfo && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[170px]">{photoInfo.name}</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">({photoInfo.sizeKb} KB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message if file size exceeds 500kb */}
            {fileError && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-tight font-medium">{fileError}</span>
              </div>
            )}

            {/* Preset Avatar Selection */}
            <div className="pt-2 border-t border-slate-200/70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Atau Pilih Avatar Pilihan:
                </span>
                {DEFAULT_AVATARS[role] && avatar !== DEFAULT_AVATARS[role][0] && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset Default</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                {(DEFAULT_AVATARS[role] || DEFAULT_AVATARS.student).map((avUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(avUrl);
                      setPhotoInfo(null);
                      setFileError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === avUrl
                        ? 'border-blue-600 scale-105 shadow-sm'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={`Pilih avatar bawaan ${idx + 1}`}
                  >
                    <img src={avUrl} alt={`Avatar ${idx + 1}`} className="w-9 h-9 object-cover" />
                    {avatar === avUrl && (
                      <span className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Peran Pengguna */}
          {!isSelf && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                Peran Pengguna <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                disabled={isSchoolAdminLoggedIn && editingUser?.role === 'school_admin'}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
              >
                <option value="student">🎓 Murid</option>
                <option value="teacher">📚 Guru</option>
                <option value="school_admin">🏫 Admin Sekolah</option>
                {!isSchoolAdminLoggedIn && <option value="central_admin">⚙️ Admin Pusat</option>}
              </select>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#25324B] uppercase block">
              Nama Lengkap {role === 'teacher' && '(Sertakan Gelar)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan Nama Lengkap"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
            />
          </div>

          {/* NISN / NIP & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                {role === 'student' ? 'NISN Murid' : 'NIP / NUPTK'}
              </label>
              <input
                type="text"
                disabled={isSelf}
                value={nisnNip}
                onChange={(e) => setNisnNip(e.target.value)}
                placeholder={role === 'student' ? 'Masukkan NISN Murid' : 'Masukkan NIP / NUPTK'}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none ${
                  isSelf ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7]'
                }`}
              />
            </div>

            {!isSelf ? (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                  Status Akun
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
                >
                  <option value="active">🟢 Aktif</option>
                  <option value="inactive">🔴 Nonaktif</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                  Status Akun Saya
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Aktif & Terverifikasi</span>
                </div>
              </div>
            )}
          </div>

          {/* Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                {role === 'student' ? 'Username Login (NISN)' : 'Username Akun'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'student' ? 'Masukkan NISN / username' : 'Masukkan username'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#25324B] uppercase block flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Kata Sandi Baru (Password)</span> <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Kata Sandi"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                  title={showPassword ? "Sembunyikan Sandi" : "Tampilkan Sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* School Details Block */}
          {!isSelf ? (
            <>
              {/* School ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                    ID Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSchoolAdminLoggedIn}
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder="Masukkan ID Sekolah"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none ${
                      isSchoolAdminLoggedIn ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7]'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                    Nama Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSchoolAdminLoggedIn}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Masukkan Nama Sekolah"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none ${
                      isSchoolAdminLoggedIn ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7]'
                    }`}
                  />
                </div>
              </div>

              {/* Class ID & Class Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                    ID Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    placeholder="Masukkan ID Kelas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#25324B] uppercase block">
                    Nama Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Masukkan Nama Kelas / Rombel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Beautiful Read-only Info Card for School/Class Affiliation */
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Afiliasi Sekolah & Kelas Anda
              </span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">Sekolah</span>
                  <span className="text-slate-800 font-bold block">{schoolName}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">Kelas / Rombel</span>
                  <span className="text-slate-800 font-bold block">{className}</span>
                </div>
              </div>
            </div>
          )}

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#25324B] uppercase block">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masukkan Nomor Telepon / WhatsApp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-[#4F8EF7] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#4F8EF7] text-white font-bold text-xs hover:bg-blue-600 shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingUser ? 'Simpan Perubahan' : 'Buat Akun Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
