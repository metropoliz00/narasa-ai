import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  Printer,
  Copy,
  Check,
  Scissors,
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  School,
  FileText,
  Info
} from 'lucide-react';
import { toast } from './Toast';
import { APP_LOGO } from '../constants/branding';

interface IndividualLoginCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: UserProfile[];
  currentUser: UserProfile;
  initialSelectedStudentId?: string | null;
}

export const IndividualLoginCardsModal: React.FC<IndividualLoginCardsModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  initialSelectedStudentId
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || 'all'
  );
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [cardLayout, setCardLayout] = useState<'compact' | 'standard' | 'large'>('standard');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Filter students to display
  const targetStudents = selectedStudentId === 'all'
    ? students
    : students.filter((s) => s.id === selectedStudentId);

  const getStudentCredentials = (student: UserProfile) => {
    // Username must be [NISN] as per user request, fallback to username or name if not set
    const username = student.nisnNip || student.username || student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const password = student.password || '123456';
    return { username, password };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAllCredentials = () => {
    let text = `=== DAFTAR KARTU LOGIN INDIVIDU MURID ===\n`;
    text += `Sekolah: ${currentUser.schoolName || 'SDN 01 Nusantara'}\n`;
    text += `Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n\n`;

    targetStudents.forEach((s, idx) => {
      const { username, password } = getStudentCredentials(s);
      text += `[${idx + 1}] ${s.name} (${s.className || 'Kelas V'})\n`;
      text += `Username (NISN): ${username}\n`;
      text += `Password: ${password}\n`;
      text += `-------------------------------------------\n`;
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success(
      'Kredensial Tersalin',
      `Data login ${targetStudents.length} murid berhasil disalin ke clipboard.`
    );
    setTimeout(() => setIsCopied(false), 2500);
  };

  const getGridClasses = () => {
    switch (cardLayout) {
      case 'compact':
        return 'grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3';
      case 'large':
        return 'grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl mx-auto print:grid-cols-1 print:gap-5';
      case 'standard':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Screen Only */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Kartu Individu Murid
                </span>
                <span className="text-xs text-slate-400">
                  {targetStudents.length} Kartu Terpilih
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white mt-0.5">
                Cetak Kartu Login Individu Murid
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls - Screen Only */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/90 shrink-0 no-print">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
            
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-600 shrink-0">Pilih Murid:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Murid ({students.length} Kartu)</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nisnNip ? `NISN: ${s.nisnNip}` : 'Belum ada NISN'})
                  </option>
                ))}
              </select>

              {/* Layout Option */}
              <span className="font-bold text-slate-600 ml-2 shrink-0">Ukuran Kartu:</span>
              <div className="inline-flex rounded-xl p-0.5 bg-slate-200 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setCardLayout('standard')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    cardLayout === 'standard'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sedang (4/A4)
                </button>
                <button
                  type="button"
                  onClick={() => setCardLayout('compact')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    cardLayout === 'compact'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kompak (6/A4)
                </button>
                <button
                  type="button"
                  onClick={() => setCardLayout('large')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    cardLayout === 'large'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Besar (2/A4)
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="flex items-center gap-4 flex-wrap text-slate-700 font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Tampilkan Password</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInstructions}
                  onChange={(e) => setShowInstructions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Panduan Login</span>
              </label>

              <button
                type="button"
                onClick={handleCopyAllCredentials}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 flex items-center gap-1 shadow-2xs transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Kredensial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Printable / Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 print:bg-white print:p-0">
          <div id="narasa-printable-area" className="w-full">
            
            {/* Header Document for Printout */}
            <div className="hidden print:flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-800 text-slate-900">
              <div>
                <h1 className="text-base font-black font-display tracking-tight uppercase">
                  {currentUser.schoolName || 'SDN 01 Nusantara'}
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  Kartu Kredensial Login Mandiri Murid • Platform Narasa (Literasi & Numerasi)
                </p>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <p>Tahun Ajaran 2024/2025</p>
                <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            {targetStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-semibold">Tidak ada murid yang dipilih untuk dicetak.</p>
              </div>
            ) : (
              <div className={getGridClasses()}>
                {targetStudents.map((student, index) => {
                  const { username, password } = getStudentCredentials(student);
                  const accentColor = '#4F8EF7'; // Consistent accent for individual student

                  return (
                    <div
                      key={student.id}
                      className="bg-white rounded-2xl border-2 border-dashed border-slate-300 print:border-slate-400 p-4 sm:p-5 relative flex flex-col justify-between shadow-xs print:shadow-none break-inside-avoid print:break-inside-avoid transition-all hover:border-indigo-400"
                      style={{
                        pageBreakInside: 'avoid'
                      }}
                    >
                      {/* Scissor Cut Line Marks */}
                      <div className="absolute -top-3 right-4 bg-white px-2 text-[10px] font-mono text-slate-400 flex items-center gap-1 select-none pointer-events-none no-print">
                        <Scissors className="w-3 h-3 text-slate-400" />
                        <span>Garis Potong #{index + 1}</span>
                      </div>

                      {/* Card Top Accent Bar */}
                      <div
                        className="h-2 rounded-t-xl -mt-4 sm:-mt-5 -mx-4 sm:-mx-5 mb-3"
                        style={{ backgroundColor: accentColor }}
                      />

                      <div className="space-y-3">
                        {/* Card Brand Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={APP_LOGO}
                              alt="Logo NARASA"
                              className="w-6 h-6 object-contain rounded-md shrink-0 transition-transform duration-300 hover:scale-125 hover:rotate-6 cursor-pointer"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-display font-black text-xs text-[#25324B] tracking-tight">
                              NARASA
                            </span>
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm border border-indigo-200">
                              KARTU INDIVIDU
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-700 block">
                              {student.className || 'Kelas V'}
                            </span>
                            <span className="text-[9px] text-slate-400 block truncate max-w-[130px]">
                              {currentUser.schoolName || 'SDN 01 Nusantara'}
                            </span>
                          </div>
                        </div>

                        {/* Student Identity Info */}
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            onError={(e) => {
                              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=4F8EF7&color=fff&bold=true`;
                              if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                                (e.target as HTMLImageElement).src = fallbackUrl;
                              }
                            }}
                            className="w-13 h-13 rounded-xl object-cover border-2 border-slate-200 shrink-0 bg-white"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-display font-black text-base text-[#1E293B] leading-tight truncate">
                              {student.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">
                              NISN: <strong className="text-slate-800">{student.nisnNip || '-'}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Login Credentials Box - High Contrast & Crisp */}
                        <div className="p-3 rounded-xl bg-slate-900 text-white print:bg-slate-900 print:text-white space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                            <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1 uppercase tracking-wider">
                              <KeyRound className="w-3 h-3 text-indigo-400" />
                              <span>Akun Login Mandiri</span>
                            </span>
                            <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700/50">
                              Aktif
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Username (NISN) Field */}
                            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">
                                Username (NISN):
                              </span>
                              <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block truncate">
                                {username}
                              </span>
                            </div>

                            {/* Password Field */}
                            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">
                                Password:
                              </span>
                              <span className="font-mono text-xs sm:text-sm font-black text-amber-300 block truncate">
                                {showPassword ? password : '••••••••'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Login Instructions / Step Guide */}
                        {showInstructions && (
                          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                            <p className="font-bold text-slate-700 flex items-center gap-1">
                              <Info className="w-3 h-3 text-indigo-500" />
                              <span>Petunjuk Masuk Mandiri:</span>
                            </p>
                            <ol className="list-decimal list-inside pl-0.5 space-y-0.5 text-slate-600">
                              <li>Buka aplikasi <strong>Narasa</strong> di tablet / laptop kelas.</li>
                              <li>Masukkan <strong>Username (NISN)</strong> dan <strong>Password</strong> di atas.</li>
                              <li>Kerjakan misi belajar mandiri & kerjakan uji pemahaman konsep!</li>
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                        <span>Narasa • Literasi & Numerasi</span>
                        <span>Simpan kartu ini secara pribadi</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer - Screen Only */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>
              Tips: Gunakan kertas <strong>A4</strong> dan atur margin ke <strong>Default/None</strong> pada dialog print.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu ({targetStudents.length})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
