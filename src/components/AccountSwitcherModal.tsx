import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { SchoolClassBadge } from './SchoolClassBadge';
import {
  X,
  User,
  GraduationCap,
  ShieldCheck,
  Search,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  Edit2
} from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenCreateModal: (role?: UserRole) => void;
  onOpenEditModal: (user: UserProfile) => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectUser,
  onOpenCreateModal,
  onOpenEditModal
}) => {
  const [activeTab, setActiveTab] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === 'all' || u.role === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.className.toLowerCase().includes(q) ||
      (u.nisnNip && u.nisnNip.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const getRoleBadge = (user: UserProfile) => {
    if (user.isGroup) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
          👥 Kelompok ({user.groupMembers?.length || 0} Murid)
        </span>
      );
    }
    switch (user.role) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-3 h-3" /> Murid
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <GraduationCap className="w-3 h-3" /> Guru
          </span>
        );
      case 'school_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3" /> Admin Sekolah
          </span>
        );
      case 'central_admin':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3" /> Admin Pusat
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-[#25324B] font-display">
              Manajemen & Penggantian Akun
            </h3>
            <p className="text-xs text-slate-500">
              Beralih profil pengguna atau kelola data akun murid, guru, dan admin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Active Card */}
        <div className="p-4 mx-6 mt-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20 shadow-xs"
            />
            <div className="text-left space-y-0.5">
              <span className="text-sm font-bold text-[#25324B] block">{currentUser.name}</span>
              <div>{getRoleBadge(currentUser)}</div>
            </div>
          </div>
          <button
            onClick={() => onOpenEditModal(currentUser)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
            title="Edit Profil Saya"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-6 pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'student'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Murid ({users.filter((u) => u.role === 'student').length})
              </button>
              <button
                onClick={() => setActiveTab('teacher')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'teacher'
                    ? 'bg-white text-purple-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Guru ({users.filter((u) => u.role === 'teacher').length})
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin ({users.filter((u) => u.role === 'admin').length})
              </button>
            </div>

            {/* Add User Button */}
            <button
              onClick={() => onOpenCreateModal(activeTab === 'all' ? undefined : activeTab)}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#4F8EF7] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-600 shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Akun</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, NISN/NIP, atau kelas..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* User Accounts List */}
        <div className="px-6 pb-6 overflow-y-auto space-y-2 flex-1 text-left">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada akun yang sesuai dengan pencarian.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isCurrent = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-[#4F8EF7] bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-[#25324B] truncate block">
                        {u.name}
                      </span>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {getRoleBadge(u)}
                        {u.status === 'inactive' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-600">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      {u.nisnNip && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {u.role === 'student' ? 'NISN: ' : 'NIP: '}
                          {u.nisnNip}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenEditModal(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <span>Masuk</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
