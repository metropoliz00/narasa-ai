import React, { useState, useRef, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { StudentTab } from './StudentBottomNav';
import { SchoolClassBadge } from './SchoolClassBadge';
import { NarasaLogo } from './NarasaLogo';
import {
  Camera,
  HelpCircle,
  ChevronDown,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  GraduationCap,
  Home,
  BookOpen,
  Mic,
  FolderKanban,
  Brain,
  Users,
  Settings
} from 'lucide-react';

interface NavbarProps {
  isAuthenticated: boolean;
  currentRole: UserRole;
  currentUser: UserProfile;
  studentTab?: StudentTab;
  onSelectStudentTab?: (tab: StudentTab) => void;
  isPresentationAllowed?: boolean;
  onOpenDemoJourney: () => void;
  onStartExploration: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onOpenEditProfile: () => void;
  onNavigateToAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAuthenticated,
  currentRole,
  currentUser,
  studentTab,
  onSelectStudentTab,
  isPresentationAllowed = true,
  onOpenDemoJourney,
  onStartExploration,
  onOpenLoginModal,
  onLogout,
  onOpenEditProfile,
  onNavigateToAdmin
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (user: UserProfile) => {
    if (user.isGroup) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
          <Users className="w-2.5 h-2.5 text-amber-600" /> Akun Kelompok
        </span>
      );
    }
    switch (user.role) {
      case 'student':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 inline-flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> Murid
          </span>
        );
      case 'teacher':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 inline-flex items-center gap-1">
            <GraduationCap className="w-2.5 h-2.5" /> Guru
          </span>
        );
      case 'school_admin':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 inline-flex items-center gap-1 border border-indigo-200">
            <ShieldCheck className="w-2.5 h-2.5" /> Admin Sekolah
          </span>
        );
      case 'central_admin':
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1 border border-emerald-200">
            <ShieldCheck className="w-2.5 h-2.5" /> Admin Pusat
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <NarasaLogo size="md" withHoverAnimation={true} withGlow={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-wider font-display bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent drop-shadow-2xs select-none">
                  NARASA
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  AI Kontekstual
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block font-medium">
                Platform Pembelajaran Kontekstual Berbasis Observasi
              </p>
            </div>
          </div>

          {/* Desktop Student Navigation Tabs (Shown on Desktop screens md and up) */}
          {isAuthenticated && currentRole === 'student' && studentTab && onSelectStudentTab && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => onSelectStudentTab('home')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'home'
                    ? 'bg-white text-[#4F8EF7] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Beranda</span>
              </button>
              <button
                onClick={() => onSelectStudentTab('explore')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'explore'
                    ? 'bg-white text-[#4F8EF7] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Misi Belajar</span>
              </button>
              {isPresentationAllowed && (
                <button
                  onClick={() => onSelectStudentTab('present')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    studentTab === 'present'
                      ? 'bg-white text-[#4F8EF7] font-bold shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>Presentasi</span>
                </button>
              )}
              <button
                onClick={() => onSelectStudentTab('portfolio')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'portfolio'
                    ? 'bg-white text-[#4F8EF7] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Portofolio</span>
              </button>
              <button
                onClick={() => onSelectStudentTab('quiz')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'quiz'
                    ? 'bg-white text-[#4F8EF7] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                }`}
              >
                <Brain className="w-4 h-4 text-purple-600" />
                <span>Uji Pemahaman</span>
              </button>
            </nav>
          )}

          {/* Right Header Navigation: Pedagogical Journey & Profile Menu / Login Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Journey Guide Button - Only on Front Page (when !isAuthenticated) */}
            {!isAuthenticated && (
              <button
                onClick={onOpenDemoJourney}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Lihat Alur Belajar Demo"
              >
                <HelpCircle className="w-4 h-4 text-[#7C5CFC]" />
                <span className="hidden md:inline">Alur Pedagogis</span>
              </button>
            )}

            {/* If NOT Authenticated: Show Standard Login Button */}
            {!isAuthenticated ? (
              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </button>
            ) : (
              /* If Authenticated: Standard Profile Dropdown Menu */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-2xl border transition-all text-left cursor-pointer active:scale-98 ${
                    isDropdownOpen
                      ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                      : 'bg-slate-50 hover:bg-white border-slate-200/80 hover:border-blue-300 shadow-2xs'
                  }`}
                  aria-expanded={isDropdownOpen}
                  title="Menu Akun & Profil"
                >
                  <div className="relative shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/20"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        (currentUser.status || 'active') === 'active'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <div className="text-left leading-tight hidden xs:block sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#25324B] max-w-[120px] sm:max-w-[160px] truncate">
                        {currentUser.name}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      {getRoleBadge(currentUser)}
                    </div>
                  </div>

                  {/* Mobile chevron */}
                  <div className="xs:hidden sm:hidden pl-1">
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Menu Box */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Mini Card in Dropdown */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="relative group rounded-xl overflow-hidden shrink-0 cursor-pointer"
                        title="Klik untuk ubah foto profil (maks 500 KB)"
                      >
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20"
                        />
                        <span className="absolute inset-0 bg-slate-900/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Camera className="w-4 h-4" />
                        </span>
                      </button>
                      <div className="space-y-0.5 min-w-0 flex-1 text-left">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-sm text-[#25324B] truncate">
                            {currentUser.name}
                          </h4>
                          {getRoleBadge(currentUser)}
                        </div>
                        {currentUser.username ? (
                          <p className="text-xs text-blue-600 font-medium truncate">@{currentUser.username}</p>
                        ) : currentUser.nisnNip ? (
                          <p className="text-xs text-slate-500 font-mono truncate">
                            {currentUser.role === 'student' ? `NISN: ${currentUser.nisnNip}` : `NIP: ${currentUser.nisnNip}`}
                          </p>
                        ) : null}
                        <p className="text-[11px] text-slate-400 truncate">
                          {currentUser.className} • {currentUser.schoolName}
                        </p>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="p-2 space-y-1 text-left">
                      {/* Option: Edit Profile & Photo */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings className="w-4 h-4 text-blue-500" />
                          <span>Atur Profil Saya</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                          Pengaturan
                        </span>
                      </button>
                    </div>

                    {/* Divider & Logout Menu Item */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <LogOut className="w-4 h-4" />
                          <span>Keluar (Logout)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">Akhiri Sesi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
