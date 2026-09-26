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
  Settings,
  Building2,
  IdCard,
  Sparkles
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
  onNavigateToSchoolSettings?: () => void;
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
  onNavigateToAdmin,
  onNavigateToSchoolSettings
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
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
          <Users className="w-3 h-3 text-amber-600" /> Akun Kelompok 👥
        </span>
      );
    }
    switch (user.role) {
      case 'student':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1 shadow-2xs">
            <User className="w-3 h-3 text-blue-600" /> Murid 🎓
          </span>
        );
      case 'teacher':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1 shadow-2xs">
            <GraduationCap className="w-3 h-3 text-purple-600" /> Guru 📚
          </span>
        );
      case 'school_admin':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-900 inline-flex items-center gap-1 border border-indigo-300 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-indigo-600" /> Admin Sekolah 🏫
          </span>
        );
      case 'central_admin':
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 inline-flex items-center gap-1 border border-emerald-300 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Admin Pusat ⚙️
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-indigo-100 shadow-xs relative">
      {/* Playful Colorful Top Rainbow Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-emerald-400" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18 gap-2">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <NarasaLogo size="md" withHoverAnimation={true} withGlow={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider font-display bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-2xs select-none">
                  NARASA
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 text-indigo-900 border border-indigo-300 shadow-2xs hidden xs:inline-flex sm:inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 animate-pulse"></span>
                  AI Kontekstual ✨
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block font-semibold truncate">
                Platform Pembelajaran Kontekstual Berbantuan AI
              </p>
            </div>
          </div>

          {/* Desktop Student Navigation Tabs (Colorful & Playful) */}
          {isAuthenticated && currentRole === 'student' && studentTab && onSelectStudentTab && (
            <nav className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-slate-100/90 via-blue-50/50 to-purple-50/50 p-1.5 rounded-2xl border-2 border-indigo-100 shadow-xs">
              {/* Tab 1: Beranda (Blue Theme) */}
              <button
                onClick={() => onSelectStudentTab('home')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'home'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-500/25 scale-102'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-white font-bold'
                }`}
              >
                <div className={`p-1 rounded-lg ${studentTab === 'home' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                  <Home className="w-3.5 h-3.5" />
                </div>
                <span>Beranda</span>
              </button>

              {/* Tab 2: Misi Belajar (Emerald Theme) */}
              <button
                onClick={() => onSelectStudentTab('explore')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'explore'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold shadow-md shadow-emerald-500/25 scale-102'
                    : 'text-slate-700 hover:text-emerald-700 hover:bg-white font-bold'
                }`}
              >
                <div className={`p-1 rounded-lg ${studentTab === 'explore' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <span>Misi Belajar</span>
              </button>

              {/* Tab 3: Presentasi (Pink/Purple Theme) */}
              {isPresentationAllowed && (
                <button
                  onClick={() => onSelectStudentTab('present')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    studentTab === 'present'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold shadow-md shadow-pink-500/25 scale-102'
                      : 'text-slate-700 hover:text-pink-700 hover:bg-white font-bold'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${studentTab === 'present' ? 'bg-white/20' : 'bg-pink-100 text-pink-600'}`}>
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span>Presentasi</span>
                </button>
              )}

              {/* Tab 4: Portofolio (Amber Theme) */}
              <button
                onClick={() => onSelectStudentTab('portfolio')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'portfolio'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-md shadow-amber-500/25 scale-102'
                    : 'text-slate-700 hover:text-amber-700 hover:bg-white font-bold'
                }`}
              >
                <div className={`p-1 rounded-lg ${studentTab === 'portfolio' ? 'bg-white/20' : 'bg-amber-100 text-amber-600'}`}>
                  <FolderKanban className="w-3.5 h-3.5" />
                </div>
                <span>Portofolio</span>
              </button>

              {/* Tab 5: Uji Pemahaman (Purple Theme) */}
              <button
                onClick={() => onSelectStudentTab('quiz')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  studentTab === 'quiz'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold shadow-md shadow-purple-500/25 scale-102'
                    : 'text-slate-700 hover:text-purple-700 hover:bg-white font-bold'
                }`}
              >
                <div className={`p-1 rounded-lg ${studentTab === 'quiz' ? 'bg-white/20' : 'bg-purple-100 text-purple-600'}`}>
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <span>Uji Pemahaman</span>
              </button>
            </nav>
          )}

          {/* Right Header Navigation: Pedagogical Journey & Profile Menu / Login Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Demo Journey Guide Button - Only on Front Page (when !isAuthenticated) */}
            {!isAuthenticated && (
              <button
                onClick={onOpenDemoJourney}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-purple-900 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 transition-all min-h-[40px] shadow-2xs active:scale-95"
                title="Lihat Alur Belajar Demo"
              >
                <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="hidden sm:inline">Alur Belajar 🧭</span>
              </button>
            )}

            {/* If NOT Authenticated: Show Standard Login Button */}
            {!isAuthenticated ? (
              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-all min-h-[40px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk 🚀</span>
              </button>
            ) : (
              /* If Authenticated: Colorful Profile Dropdown Menu Button */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-2xl border-2 transition-all text-left cursor-pointer active:scale-98 min-h-[42px] ${
                    isDropdownOpen
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-400 shadow-md ring-2 ring-purple-200'
                      : 'bg-gradient-to-r from-slate-50 to-blue-50/60 hover:from-white hover:to-blue-50 border-blue-200 hover:border-blue-400 shadow-2xs'
                  }`}
                  aria-expanded={isDropdownOpen}
                  title="Menu Akun & Profil"
                >
                  <div className="relative shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-indigo-400 shadow-xs"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        (currentUser.status || 'active') === 'active'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <div className="text-left leading-tight hidden sm:block max-w-[140px] md:max-w-[180px]">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-extrabold text-[#1E293B] truncate block">
                        {currentUser.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim()}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      {getRoleBadge(currentUser)}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="pl-0.5">
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isDropdownOpen ? 'rotate-180 text-purple-600' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Menu Box (Vibrant & Playful) */}
                {isDropdownOpen && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Mini Card Header in Dropdown */}
                    <div className="relative p-4 bg-gradient-to-br from-[#2D31FA] via-[#4F8EF7] to-[#7C5CFC] text-white overflow-hidden shadow-md">
                      {/* Decorative Background Accents */}
                      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute right-3 top-3 opacity-20 pointer-events-none">
                        <Sparkles className="w-12 h-12 text-white" />
                      </div>

                      <div className="relative flex items-start gap-3.5 z-10">
                        {/* Avatar & Camera Edit */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onOpenEditProfile();
                            }}
                            className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-lg block ring-3 ring-white/30 hover:ring-white transition-all active:scale-95"
                            title="Klik untuk ubah foto profil"
                          >
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-12 h-12 rounded-2xl object-cover"
                            />
                            <span className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Camera className="w-4 h-4" />
                            </span>
                          </button>
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white shadow-xs" title="Online" />
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 min-w-0 flex-1 text-left">
                          {/* Name */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <h4 className="font-extrabold text-base text-white tracking-tight truncate drop-shadow-xs">
                              {currentUser.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim()}
                            </h4>
                          </div>

                          {/* NISN / NIP Badge */}
                          {currentUser.nisnNip && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/15 backdrop-blur-md border border-white/25 text-white/95 text-[11px] font-extrabold font-mono shadow-2xs">
                              <IdCard className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                              <span>{currentUser.role === 'student' ? `NISN: ${currentUser.nisnNip}` : `NIP: ${currentUser.nisnNip}`}</span>
                            </div>
                          )}

                          {/* Class & School Name */}
                          <div className="pt-0.5 space-y-1 text-xs text-white/90">
                            {currentUser.className && (
                              <div className="flex items-center gap-1.5 font-bold">
                                <GraduationCap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                <span className="bg-amber-400/95 text-slate-900 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs">
                                  {currentUser.className.replace(/•?\s*Superadmin\s*Nasional/gi, '').replace(/\/\s*Superadmin/gi, '').trim()}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-100 truncate">
                              <Building2 className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                              <span className="truncate">{currentUser.schoolName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="p-2 space-y-1.5 text-left">
                      {/* Option: Edit Profile & Photo */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-between transition-colors min-h-[44px] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Settings className="w-4 h-4" />
                          </div>
                          <span>Atur Profil Saya</span>
                        </div>
                        <span className="text-[10px] text-blue-800 font-black bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                          Pengaturan
                        </span>
                      </button>

                      {/* Option: Pengaturan Sekolah (Hanya untuk Admin Pusat dan Admin Sekolah) */}
                      {(currentUser.role === 'central_admin' || currentUser.role === 'school_admin' || currentUser.role === 'admin') && onNavigateToSchoolSettings && (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onNavigateToSchoolSettings();
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer min-h-[44px]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span>Pengaturan Sekolah</span>
                          </div>
                          <span className="text-[10px] text-emerald-800 font-black bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            {currentUser.role === 'school_admin' ? 'Admin Sekolah' : 'Admin Pusat'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Divider & Logout Menu Item */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/80">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-black text-rose-600 hover:text-rose-700 hover:bg-rose-100/70 flex items-center justify-between transition-colors min-h-[44px] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span>Keluar Akun</span>
                        </div>
                        <span className="text-[10px] text-rose-500 font-bold">Akhiri Sesi</span>
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
