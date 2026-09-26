import React, { useState, useEffect, useRef } from 'react';
import { StudentGroup, UserProfile } from '../types';
import {
  studentBoy1,
  studentBoy2,
  studentGirlHijab,
  studentGirlRibbon,
  teacherMale,
  teacherFemale
} from '../data/avatarData';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Crown,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  AtSign,
  Copy,
  Upload,
  Camera
} from 'lucide-react';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGroup: (group: StudentGroup, associatedUser: UserProfile) => void;
  existingGroup?: StudentGroup | null;
  studentsInClass: UserProfile[];
  currentSchoolId: string;
  currentSchoolName: string;
  currentClassId: string;
  currentClassName: string;
}

export const formatGroupUsername = (nameStr: string): string => {
  return nameStr
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');
};

const AVATAR_OPTIONS = [
  studentBoy1,
  studentGirlHijab,
  studentBoy2,
  studentGirlRibbon,
  teacherMale,
  teacherFemale
];

const COLOR_OPTIONS = [
  { name: 'Biru Samudra', hex: '#3B82F6' },
  { name: 'Hijau Zamrud', hex: '#10B981' },
  { name: 'Ungu Kreatif', hex: '#8B5CF6' },
  { name: 'Kuning Jingga', hex: '#F59E0B' },
  { name: 'Merah Berani', hex: '#EF4444' },
  { name: 'Cyan Cerdas', hex: '#06B6D4' }
];

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  onClose,
  onSaveGroup,
  existingGroup,
  studentsInClass,
  currentSchoolId,
  currentSchoolName,
  currentClassId,
  currentClassName
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(currentClassId || 'V-A');
  const [selectedClassName, setSelectedClassName] = useState(currentClassName || 'Kelas V-A');
  const [selectedMemberNames, setSelectedMemberNames] = useState<string[]>([]);
  const [customStudentInput, setCustomStudentInput] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [motto, setMotto] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0].hex);
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WEBP.');
      return;
    }
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE) {
      alert('Ukuran foto terlalu besar. Maksimal adalah 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAvatar(dataUrl);
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

  useEffect(() => {
    if (existingGroup) {
      setName(existingGroup.name);
      setUsername(existingGroup.username || formatGroupUsername(existingGroup.name));
      setPassword(existingGroup.password || '123456');
      setSelectedClassId(existingGroup.classId);
      setSelectedClassName(existingGroup.className);
      setSelectedMemberNames(existingGroup.memberNames || []);
      setLeaderName(existingGroup.leaderName || '');
      setMotto(existingGroup.motto || '');
      setAvatar(existingGroup.avatar || AVATAR_OPTIONS[0]);
      setColor(existingGroup.color || COLOR_OPTIONS[0].hex);
      setEmail(existingGroup.email);
    } else {
      const defaultName = 'Kelompok 1 - Garuda';
      setName(defaultName);
      setUsername('kelompok1_garuda');
      setPassword('123456');
      setSelectedClassId(currentClassId || 'V-A');
      setSelectedClassName(currentClassName || 'Kelas V-A');
      setSelectedMemberNames([]);
      setLeaderName('');
      setMotto('Teliti Menemukan, Kritis Menalar, Kompak Berbagi!');
      setAvatar(AVATAR_OPTIONS[0]);
      setColor(COLOR_OPTIONS[0].hex);
      setEmail('kelompok1.garuda@siswa.sdn01.sch.id');
    }
    setErrorMsg(null);
  }, [existingGroup, isOpen, currentClassId, currentClassName]);

  if (!isOpen) return null;

  // Auto-generate username and email based on group name
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedUsername = formatGroupUsername(val);
    setUsername(generatedUsername);
    if (!existingGroup) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      const classSlug = selectedClassId.toLowerCase().replace(/[^a-z0-9]/g, '');
      setEmail(`${clean}.${classSlug}@siswa.sdn01.sch.id`);
    }
  };

  const toggleStudentMember = (studentName: string) => {
    if (selectedMemberNames.includes(studentName)) {
      const next = selectedMemberNames.filter((n) => n !== studentName);
      setSelectedMemberNames(next);
      if (leaderName === studentName) {
        setLeaderName(next[0] || '');
      }
    } else {
      const next = [...selectedMemberNames, studentName];
      setSelectedMemberNames(next);
      if (!leaderName) {
        setLeaderName(studentName);
      }
    }
  };

  const handleAddCustomStudent = () => {
    const trimmed = customStudentInput.trim();
    if (!trimmed) return;
    if (selectedMemberNames.includes(trimmed)) {
      setErrorMsg('Nama murid sudah ada dalam daftar anggota.');
      return;
    }
    const next = [...selectedMemberNames, trimmed];
    setSelectedMemberNames(next);
    if (!leaderName) {
      setLeaderName(trimmed);
    }
    setCustomStudentInput('');
    setErrorMsg(null);
  };

  const handleRemoveMember = (memberName: string) => {
    const next = selectedMemberNames.filter((n) => n !== memberName);
    setSelectedMemberNames(next);
    if (leaderName === memberName) {
      setLeaderName(next[0] || '');
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Harap masukkan nama kelompok.');
      return;
    }

    if (selectedMemberNames.length === 0) {
      setErrorMsg('Pilih atau tambahkan minimal 1 murid anggota kelompok.');
      return;
    }

    const finalUsername = (username.trim() || formatGroupUsername(name)).toLowerCase();
    const finalPassword = password.trim() || '123456';

    const groupId = existingGroup?.id || `group-${Date.now()}`;
    const accountUserId = existingGroup?.accountUserId || `user-group-${Date.now()}`;

    // Map selected names to user IDs if they exist in studentsInClass
    const memberIds = selectedMemberNames
      .map((mName) => {
        const found = studentsInClass.find((s) => s.name.toLowerCase() === mName.toLowerCase());
        return found?.id;
      })
      .filter((id): id is string => !!id);

    const leader = studentsInClass.find((s) => s.name.toLowerCase() === leaderName.toLowerCase());

    const newGroup: StudentGroup = {
      id: groupId,
      name: name.trim(),
      schoolId: currentSchoolId || 'SDN01',
      schoolName: currentSchoolName || 'SDN 01 Nusantara',
      classId: selectedClassId,
      className: selectedClassName,
      leaderId: leader?.id,
      leaderName: leaderName || selectedMemberNames[0] || '',
      memberIds,
      memberNames: selectedMemberNames,
      avatar,
      email: email.trim().toLowerCase(),
      username: finalUsername,
      password: finalPassword,
      motto: motto.trim(),
      color,
      createdAt: existingGroup?.createdAt || new Date().toISOString().split('T')[0],
      accountUserId
    };

    const groupUserProfile: UserProfile = {
      id: accountUserId,
      name: name.trim(),
      role: 'student',
      avatar,
      schoolName: currentSchoolName || 'SDN 01 Nusantara',
      schoolId: currentSchoolId || 'SDN01',
      className: `${selectedClassName} (Akun Kelompok)`,
      classId: selectedClassId,
      email: email.trim().toLowerCase(),
      username: finalUsername,
      password: finalPassword,
      status: 'active',
      nisnNip: `KEL-${selectedClassId}-${groupId.slice(-4).toUpperCase()}`,
      joinedDate: 'September 2026',
      isGroup: true,
      groupId: groupId,
      groupMembers: selectedMemberNames,
      groupLeader: leaderName || selectedMemberNames[0] || '',
      groupMotto: motto.trim()
    };

    onSaveGroup(newGroup, groupUserProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#25324B] font-display">
                {existingGroup ? 'Edit Kelompok Belajar' : 'Bentuk Kelompok Belajar Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Membuat kelompok dan menerbitkan akun login kelompok dengan Username & Password settingan Guru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Basic Info: Name and Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nama Kelompok *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="cth: Kelompok 1 - Garuda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Rombongan Belajar (Kelas) *</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedClassName(e.target.value === 'V-A' ? 'Kelas V-A' : e.target.value === 'V-B' ? 'Kelas V-B' : 'Kelas IV-A');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
              >
                <option value="V-A">Kelas V-A (Fase C)</option>
                <option value="V-B">Kelas V-B (Fase C)</option>
                <option value="IV-A">Kelas IV-A (Fase B)</option>
              </select>
            </div>
          </div>

          {/* 2. Login Credentials Configuration (Username & Password by Teacher) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                Kredensial Akun Login Kelompok
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Username Kelompok *</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="cth: kelompok1_garuda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password Kelompok *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {/* Quick Password Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">Pilihan cepat:</span>
                  {['123456', 'kelompok123', 'sdn01hebat'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPassword(preset)}
                      className="px-2 py-0.5 rounded-lg text-[9px] bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 font-bold transition-all cursor-pointer shadow-3xs"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Motto & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Semboyan / Motto Kelompok</label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="cth: Teliti, Kritis, Kompak Berbagi!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Warna Identitas Tim</label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white ${
                      color === c.hex ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {color === c.hex && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Group Photo Direct Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Foto Profil / Logo Kelompok</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                Format: JPG, PNG, WEBP (Maks 1 MB)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt="Preview Foto Kelompok"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 bg-white"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/40 hover:bg-slate-900/60 transition-colors rounded-2xl flex flex-col items-center justify-center text-white text-[9px] font-bold gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti</span>
                </button>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 w-full p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih / Upload Foto Kelompok</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Student Member Selection */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Murid Anggota Kelompok ({selectedMemberNames.length} Terpilih) *</span>
              </label>
              <span className="text-[11px] text-slate-400">Rekomendasi: 3 - 5 Murid</span>
            </div>

            {/* Existing Student Fast-Pill Select */}
            {studentsInClass.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Klik untuk menambah/menghapus murid kelas {selectedClassName}:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {studentsInClass.map((student) => {
                    const isSelected = selectedMemberNames.includes(student.name);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudentMember(student.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        <span>{student.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Student Name Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customStudentInput}
                onChange={(e) => setCustomStudentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomStudent();
                  }
                }}
                placeholder="Ketik nama murid lainnya lalu klik Tambah..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomStudent}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Murid</span>
              </button>
            </div>

            {/* List of Chosen Members with Leader Assignment */}
            {selectedMemberNames.length > 0 && (
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">
                  Daftar Anggota & Penentuan Ketua:
                </span>
                <div className="space-y-1.5">
                  {selectedMemberNames.map((mName, idx) => {
                    const isLeader = leaderName === mName;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-blue-200/70 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{mName}</span>
                          {isLeader && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-600" /> Ketua Kelompok
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isLeader && (
                            <button
                              type="button"
                              onClick={() => setLeaderName(mName)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                            >
                              Jadikan Ketua
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(mName)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Hapus dari kelompok"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Credentials Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Kredensial Akun Kelompok untuk Masuk Aplikasi</span>
              </div>
              <span className="text-[10px] text-slate-400">Siap Digunakan Login</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Username (Sesuai Nama):</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {username || formatGroupUsername(name) || '-'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(username || formatGroupUsername(name), 'username')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Salin Username"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Password Settingan Guru:</span>
                  <span className="font-mono text-amber-400 font-bold">{password || '123456'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(password || '123456', 'password')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Salin Password"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {copiedField && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{copiedField === 'username' ? 'Username' : 'Password'} berhasil disalin ke clipboard!</span>
              </div>
            )}

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Murid dalam kelompok ini dapat login ke aplikasi menggunakan <strong>Username</strong> serta <strong>Password</strong> yang telah disetting oleh guru di atas.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{existingGroup ? 'Perbarui Kelompok' : 'Simpan & Buat Akun Kelompok'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
