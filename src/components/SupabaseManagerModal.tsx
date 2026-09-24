import React, { useState, useEffect, useMemo } from 'react';
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
  Send,
  Download
} from 'lucide-react';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  syncAllToSupabase,
  dbFetchUsers
} from '../lib/supabase';
import { UserProfile, LearningMission, StudentActivitySession, StudentGroup } from '../types';
import { generateDatabaseSchemaSQL } from '../lib/sqlSchemaGenerator';

interface SupabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  missions: LearningMission[];
  sessions: StudentActivitySession[];
  groups?: StudentGroup[];
  onRefreshData?: () => void;
}

export const SupabaseManagerModal: React.FC<SupabaseManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  missions,
  sessions,
  groups = [],
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'guide'>('overview');
  const [copied, setCopied] = useState(false);
  const [includeUserData, setIncludeUserData] = useState(true);
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

  const schemaSQL = useMemo(() => {
    return generateDatabaseSchemaSQL({
      users,
      missions,
      groups,
      includeData: includeUserData
    });
  }, [users, missions, groups, includeUserData]);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(schemaSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const element = document.createElement('a');
    const file = new Blob([schemaSQL], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = includeUserData ? 'narasa_schema_dan_data_saya.sql' : 'narasa_schema_ddl_murni.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Skema Database Supabase PostgreSQL</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Data Asli Pengguna
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Skema dibuat secara dinamis menggunakan data akun Anda saat ini ({users.length} akun, {missions.length} misi). Tanpa data dummy.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSQL}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
                    title="Unduh file .sql"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .sql</span>
                  </button>
                  <button
                    onClick={handleCopySQL}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Semua SQL'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setIncludeUserData(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    includeUserData
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Skema DDL + Data Saya ({users.length} Akun)
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeUserData(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !includeUserData
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hanya Struktur Tabel (DDL Murni)
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
