import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  ArrowRight,
  X,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Sparkles,
  HelpCircle,
  Tag,
  Info,
  Zap,
  ZapOff,
  Grid,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  Target,
  BookOpen,
  Check,
  Search,
  Compass
} from 'lucide-react';
import { LearningMission } from '../types';
import { FREE_EXPLORATION_MISSION, DEFAULT_MISSIONS } from '../data/mockData';
import { toast } from './Toast';

export interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPhoto: (imageDataUrl: string, objectNameHint: string) => void;
  activeMission?: LearningMission | null;
  missions?: LearningMission[];
  onSelectMission?: (mission: LearningMission | null) => void;
  // Legacy / fallback props
  activeMissionTitle?: string;
  activeMissionSubject?: string;
  suggestedObjects?: string[];
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onConfirmPhoto,
  activeMission,
  missions = DEFAULT_MISSIONS,
  onSelectMission,
  activeMissionTitle,
  activeMissionSubject,
  suggestedObjects = []
}) => {
  const [activeMode, setActiveMode] = useState<'live' | 'upload'>('live');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoHint, setPhotoHint] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoPortrait, setIsVideoPortrait] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  // Mission selection modal state
  const [isMissionPickerOpen, setIsMissionPickerOpen] = useState(false);
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<'all' | 'matematika' | 'ipas' | 'bahasa_indonesia'>('all');

  // Currently active mission inside the camera (only if it is a teacher-activated mission)
  const [currentMission, setCurrentMission] = useState<LearningMission | null>(() => {
    if (activeMission && activeMission.isActive && activeMission.id !== 'mission-eksplorasi-bebas') {
      return activeMission;
    }
    return null;
  });

  // Keep currentMission in sync when activeMission prop or modal open status updates
  useEffect(() => {
    if (activeMission && activeMission.isActive && activeMission.id !== 'mission-eksplorasi-bebas') {
      setCurrentMission(activeMission);
    } else {
      setCurrentMission(null);
    }
  }, [activeMission, isOpen]);

  // Is this specific camera session attached to a mission actively enabled by the teacher?
  const isTeacherActivated = Boolean(
    currentMission && currentMission.isActive && currentMission.id !== 'mission-eksplorasi-bebas'
  );

  // Derived labels
  const currentTitle = isTeacherActivated ? (currentMission?.title || activeMissionTitle || '') : '';
  const currentSubject = isTeacherActivated ? (currentMission?.subject || activeMissionSubject || '') : '';
  const currentSuggested = isTeacherActivated
    ? (currentMission?.suggestedObjects && currentMission.suggestedObjects.length > 0
        ? currentMission.suggestedObjects
        : suggestedObjects)
    : [];

  // New observation inquiry states so students can explore and detail their photo
  const [objectTitle, setObjectTitle] = useState<string>('');
  const [studentObservation, setStudentObservation] = useState<string>('');
  const [studentQuestion, setStudentQuestion] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when closing or switching mode
  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      try {
        videoRef.current.pause();
      } catch (e) {
        // safe ignore
      }
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedPhoto(null);
      setPhotoHint('');
      setObjectTitle('');
      setStudentObservation('');
      setStudentQuestion('');
      setIsVideoPortrait(false);
      setIsFlashActive(false);
      setIsMissionPickerOpen(false);
    } else {
      if (activeMode === 'live') {
        startCamera(facingMode);
      }
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  const startCamera = async (currentFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          if (video.videoHeight && video.videoWidth) {
            setIsVideoPortrait(video.videoHeight > video.videoWidth);
          }
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              if (err.name !== 'AbortError') {
                console.warn('Video play error:', err);
              }
            });
          }
        };
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin belum diberikan. Kamu dapat mengunggah foto melalui tab Unggah Berkas.');
      setIsCameraActive(false);
    }
  };

  const handleToggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    toast.info('Kamera Diputar', `Menggunakan kamera ${nextFacing === 'user' ? 'depan (selfie)' : 'belakang'}`);
    startCamera(nextFacing);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    
    // Play a shutter flash effect
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If front camera, mirror the snapshot to look natural
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedPhoto(dataUrl);
      const defaultName = `Eksplorasi ${currentSubject}`;
      setPhotoHint(defaultName);
      setObjectTitle(defaultName);
      stopCamera();
      toast.success('Foto Berhasil Diambil', 'Tuliskan hasil pengamatanmu sekarang!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          setIsVideoPortrait(img.height > img.width);
        };
        img.src = event.target.result as string;

        setSelectedPhoto(event.target.result as string);
        const friendlyName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setPhotoHint(friendlyName);
        setObjectTitle(friendlyName);
        toast.success('Berkas Diunggah', 'Silakan lengkapi catatan pengamatan di bawah!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setSelectedPhoto(null);
    setPhotoHint('');
    setObjectTitle('');
    setStudentObservation('');
    setStudentQuestion('');
    if (activeMode === 'live') {
      startCamera(facingMode);
    }
  };

  const handleSelectMissionItem = (m: LearningMission | null) => {
    if (m && m.isActive && m.id !== 'mission-eksplorasi-bebas') {
      setCurrentMission(m);
      if (onSelectMission) {
        onSelectMission(m);
      }
      toast.success('Misi Aktif Dipilih', m.title);
    } else {
      setCurrentMission(null);
      if (onSelectMission) {
        onSelectMission(null);
      }
      toast.info('Mode Eksplorasi Bebas', 'Kamera siap memotret tanpa ikatan materi');
    }
    setIsMissionPickerOpen(false);
  };

  const handleProceed = () => {
    if (selectedPhoto) {
      const combinedHint = [
        `Objek: ${objectTitle || photoHint || 'Objek Pengamatan'}`,
        studentObservation ? `Hasil Pengamatan Siswa: ${studentObservation}` : '',
        studentQuestion ? `Pertanyaan Tambahan Siswa: ${studentQuestion}` : ''
      ].filter(Boolean).join(' | ');

      onConfirmPhoto(selectedPhoto, combinedHint);
      onClose();
    }
  };

  // Filter missions for the picker - ONLY SHOW MISSIONS ACTIVATED BY THE TEACHER
  const filteredMissions = missions.filter((m) => {
    if (!m.isActive) return false;

    if (selectedSubjectTab !== 'all') {
      if (selectedSubjectTab === 'matematika' && m.subject !== 'Matematika') return false;
      if (selectedSubjectTab === 'ipas' && m.subject !== 'IPAS') return false;
      if (selectedSubjectTab === 'bahasa_indonesia' && m.subject !== 'Bahasa Indonesia') return false;
    }
    if (missionSearchQuery.trim()) {
      const q = missionSearchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSubject = m.subject.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchMaterial = m.material.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchDesc && !matchMaterial) return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
      
      {/* Shutter Camera Flash Effect */}
      {isShutterFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-flash-effect" />
      )}

      {/* --- MISSION PICKER MODAL SHEET (OVERLAY) --- */}
      {isMissionPickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col text-white animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Target className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold font-display text-white">
                    Pilih Target Misi Belajar
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih salah satu misi kurikulum atau gunakan mode eksplorasi bebas mandiri
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMissionPickerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="py-3 space-y-2.5 shrink-0 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={missionSearchQuery}
                  onChange={(e) => setMissionSearchQuery(e.target.value)}
                  placeholder="Cari misi, materi, atau kata kunci..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Subject Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'all', label: 'Semua Misi' },
                  { id: 'matematika', label: 'Matematika' },
                  { id: 'ipas', label: 'IPAS' },
                  { id: 'bahasa_indonesia', label: 'Bahasa Indonesia' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedSubjectTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                      selectedSubjectTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mission List Options (Scrollable) */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
              
              {/* Option 1: Free Exploration Option */}
              <div
                onClick={() => handleSelectMissionItem(FREE_EXPLORATION_MISSION)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  !currentMission || currentMission.id === FREE_EXPLORATION_MISSION.id
                    ? 'bg-gradient-to-r from-purple-950/60 to-blue-950/60 border-purple-500 shadow-lg ring-1 ring-purple-500/50'
                    : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                          Eksplorasi Bebas
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Deteksi Otomatis AI</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Eksplorasi Lingkungan Bebas (Bebas Potret Objek Apapun)
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Bebas potret objek apa saja di sekitarmu (tumbuhan, alat, bangunan, ubin, dll). AI NARASA akan mendeteksi objek secara otomatis dan mengaitkannya dengan topik kurikulum yang relevan.
                      </p>
                    </div>
                  </div>
                  {(!currentMission || currentMission.id === FREE_EXPLORATION_MISSION.id) && (
                    <span className="p-1 rounded-full bg-purple-500 text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Curriculum Missions List */}
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                Daftar Misi yang Diaktifkan Guru ({filteredMissions.length}):
              </div>

              {filteredMissions.map((m) => {
                const isSelected = currentMission?.id === m.id;
                const subjectColor =
                  m.subject === 'Matematika'
                    ? 'text-blue-400 bg-blue-500/20 border-blue-500/30'
                    : m.subject === 'IPAS'
                    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/20 border-amber-500/30';

                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMissionItem(m)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${subjectColor}`}>
                            {m.subject}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{m.grade}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {m.title}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {m.description}
                        </p>
                        {m.suggestedObjects && m.suggestedObjects.length > 0 && (
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-semibold">Objek disarankan:</span>
                            {m.suggestedObjects.map((obj, oIdx) => (
                              <span
                                key={oIdx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-750 text-slate-300"
                              >
                                {obj}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isSelected ? (
                        <span className="p-1 rounded-full bg-blue-500 text-white shrink-0 mt-1">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-bold transition-all shrink-0 mt-1"
                        >
                          Pilih
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredMissions.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tidak ada misi yang cocok dengan pencarian "{missionSearchQuery}".
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsMissionPickerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup & Lanjutkan Memotret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER PREVIEW/FORM MODE (If photo is already taken) --- */}
      {selectedPhoto ? (
        <div className="flex flex-col h-full overflow-y-auto bg-slate-900 text-white p-4 sm:p-6 justify-center">
          <div className="max-w-5xl w-full mx-auto bg-slate-950/80 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Form */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                    Hasil Tangkapan
                  </span>
                  {isTeacherActivated && currentSubject && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {currentSubject}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white mt-1">
                  Lembar Detektif Pengamatan Gambar
                </h3>
                {isTeacherActivated && (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-slate-400">
                      Misi: <strong className="text-slate-200">{currentTitle}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsMissionPickerOpen(true)}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <span>(Ubah Misi)</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Content Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Image Preview Card */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                <div className={`relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl ${isVideoPortrait ? 'aspect-[3/4] max-h-[45vh]' : 'aspect-video'} w-full flex items-center justify-center`}>
                  <img
                    src={selectedPhoto}
                    alt="Preview Pengamatan"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 border border-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>FOTO DIKONFIRMASI</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 text-slate-300" />
                  <span>Ambil Ulang / Unggah Gambar Lain</span>
                </button>
              </div>

              {/* Data Form */}
              <div className="md:col-span-7 bg-slate-900/50 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Lengkapi Catatan Detektif:</span>
                  </div>

                  {/* Input 1 */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      <span>1. Nama Objek yang Diamati:</span>
                    </label>
                    <input
                      type="text"
                      value={objectTitle}
                      onChange={(e) => setObjectTitle(e.target.value)}
                      placeholder="Masukkan nama objek yang kamu potret..."
                      className="w-full p-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                    />

                    {/* Quick suggestion pills from mission */}
                    {currentSuggested.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">Contoh cepat:</span>
                        {currentSuggested.map((suggested, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              setObjectTitle(suggested);
                              setPhotoHint(suggested);
                            }}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-750 transition-colors cursor-pointer"
                          >
                            + {suggested}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input 2 */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>2. Apa saja detail menarik yang kamu temukan?</span>
                    </label>
                    <textarea
                      value={studentObservation}
                      onChange={(e) => setStudentObservation(e.target.value)}
                      rows={4}
                      placeholder="Deskripsikan bentuk, warna, pola, jumlah, atau keteraturan objek yang kamu amati..."
                      className="w-full p-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <p className="text-[10px] sm:text-xs text-slate-300 leading-snug">
                    Bagus sekali! Pengamatan kognitifmu akan dianalisis secara mendalam oleh kecerdasan buatan NARASA AI untuk menguji pemahaman literasi & numerasimu.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleProceed}
                disabled={!objectTitle.trim()}
                className={`py-3 px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm transition-all active:scale-95 ${
                  objectTitle.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                    : 'bg-slate-800 cursor-not-allowed opacity-50 text-slate-400'
                }`}
              >
                <span>Kirim Hasil Pengamatan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- RENDER ACTIVE FULL-SCREEN CAMERA APP VIEW --- */
        <div className="relative w-full h-full flex flex-col justify-between text-white">
          
          {/* Top Control Bar (Overlay on Camera App) */}
          <div className="p-3 sm:p-5 bg-gradient-to-b from-black/85 to-transparent flex items-center justify-between z-20 shrink-0">
            {/* Left Info with Interactive Mission Selector (Only shows mission when activated by teacher) */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full ${isTeacherActivated ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse shrink-0`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-extrabold text-blue-400 bg-blue-950/90 px-2 py-0.5 rounded border border-blue-900/60 uppercase tracking-widest">
                    {isTeacherActivated ? 'MISI AKTIF GURU' : 'KAMERA EKSPLORASI'}
                  </span>
                  {isTeacherActivated && currentSubject && (
                    <span className="text-[9px] font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                      {currentSubject}
                    </span>
                  )}
                </div>

                {/* Interactive Mission Switcher Button - ONLY APPEARS ON MISSIONS ACTIVATED BY THE TEACHER */}
                {isTeacherActivated ? (
                  <button
                    type="button"
                    onClick={() => setIsMissionPickerOpen(true)}
                    className="group flex items-center gap-1.5 text-left mt-0.5 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-900/80 transition-colors cursor-pointer"
                    title="Misi ini diaktifkan oleh guru. Ketuk untuk mengganti misi aktif lainnya."
                  >
                    <h4 className="text-xs sm:text-sm font-black font-display tracking-tight text-white group-hover:text-blue-300 transition-colors line-clamp-1 max-w-[180px] sm:max-w-md">
                      Misi: {currentTitle}
                    </h4>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                    <span className="hidden sm:inline-block text-[9px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                      Ganti Misi
                    </span>
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Mode Bebas • Deteksi Otomatis AI
                  </p>
                )}
              </div>
            </div>

            {/* Right Quick Toggles */}
            <div className="flex items-center gap-2 shrink-0">
              {activeMode === 'live' && isCameraActive && (
                <>
                  {/* Grid Lines Toggler */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowGrid(!showGrid);
                      toast.info('Garis Bantu', showGrid ? 'Garis bantu dimatikan' : 'Garis bantu dinyalakan');
                    }}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      showGrid ? 'bg-blue-600 text-white' : 'bg-black/50 hover:bg-black/80 text-slate-300'
                    }`}
                    title="Garis Bantu Fotografi"
                  >
                    <Grid className="w-4 h-4" />
                  </button>

                  {/* Flash Switcher */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlashActive(!isFlashActive);
                      toast.info('Flash Kamera', !isFlashActive ? 'Lampu flash simulasi diaktifkan' : 'Flash dimatikan');
                    }}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      isFlashActive ? 'bg-amber-500 text-black' : 'bg-black/50 hover:bg-black/80 text-slate-300'
                    }`}
                    title="Simulasi Flash Kamera"
                  >
                    {isFlashActive ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                  </button>

                  {/* Camera Rotation/Switch */}
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all active:rotate-180 duration-300 cursor-pointer"
                    title="Putar Kamera depan/belakang"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Close/Exit App */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="p-2.5 rounded-full bg-black/50 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Batal & Keluar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Centered Large Immersive Viewfinder / Camera Screen */}
          <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden z-10 select-none">
            {activeMode === 'live' ? (
              <div className={`relative w-full h-full flex items-center justify-center ${isVideoPortrait ? 'max-w-[100vw]' : ''}`}>
                
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
                    isVideoPortrait ? 'object-cover' : 'object-contain'
                  } transition-transform duration-300`}
                />

                {/* Simulated Focus Reticle Corner Brackets */}
                {isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-pulse">
                    <div className="w-20 h-20 border-2 border-yellow-400/70 rounded-lg relative flex items-center justify-center">
                      {/* Autofocus crosshair */}
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-yellow-400 bg-black/40 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                        AF-AUTO
                      </span>
                    </div>
                  </div>
                )}

                {/* Rule-of-Thirds Grid Lines */}
                {isCameraActive && showGrid && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-none" />
                  </div>
                )}

                {/* If camera is not active yet (Permissions / loading) */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 space-y-4 bg-slate-950 text-center">
                    <Camera className="w-14 h-14 text-slate-600 animate-bounce" />
                    <div className="max-w-md space-y-2">
                      <p className="text-sm font-bold text-white">
                        {cameraError || 'Mempersiapkan Kamera Full-Screen...'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Pastikan kamu mengizinkan akses kamera pada browser/ponselmu untuk pengalaman observasi terbaik.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Nyalakan Kamera
                      </button>
                      <button
                        onClick={() => setActiveMode('upload')}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        Gunakan Unggah Berkas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* --- FILE UPLOAD VIEW --- */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="max-w-md w-full border-2 border-dashed border-slate-800 hover:border-blue-500 rounded-3xl p-8 cursor-pointer transition-colors bg-slate-900/50 hover:bg-blue-950/20 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-850 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-3 border border-slate-750">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Pilih Berkas Pengamatan
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Ketuk untuk mengambil berkas gambar dari galeri perangkatmu (JPG, PNG, WEBP)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Control Deck / Shutter Station (Immersive Camera HUD) */}
          <div className="p-5 sm:p-6 bg-black z-20 shrink-0 flex flex-col items-center justify-between gap-3.5">
            
            {/* Tabs Selector HUD */}
            <div className="inline-flex rounded-full p-0.5 bg-slate-900 border border-slate-800">
              <button
                onClick={() => {
                  setActiveMode('live');
                  startCamera(facingMode);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'live'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kamera Langsung
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  setActiveMode('upload');
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'upload'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unggah Berkas
              </button>
            </div>

            {/* Shutter Action HUD */}
            <div className="w-full max-w-lg flex items-center justify-between px-6">
              
              {/* Gallery Mini Circle */}
              <button
                type="button"
                onClick={() => {
                  setActiveMode('upload');
                  fileInputRef.current?.click();
                }}
                className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-90 cursor-pointer"
                title="Buka Galeri Foto"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Huge Shutter Capture Button */}
              {activeMode === 'live' ? (
                <button
                  onClick={takeSnapshot}
                  disabled={!isCameraActive}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isCameraActive 
                      ? 'bg-white hover:scale-105 active:scale-95 shadow-2xl cursor-pointer ring-4 ring-white/20' 
                      : 'bg-slate-800 cursor-not-allowed opacity-40'
                  }`}
                  title="Ambil Foto Pengamatan"
                >
                  <span className="absolute inset-1.5 rounded-full border border-black bg-white" />
                  {/* Red indicator inside shutter */}
                  <span className="w-4 h-4 rounded-full bg-red-600 animate-pulse-subtle" />
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-slate-900 ring-4 ring-blue-600/30 text-white"
                  title="Pilih Berkas"
                >
                  <Upload className="w-7 h-7" />
                </button>
              )}

              {/* Flip camera shortcut */}
              {activeMode === 'live' ? (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  disabled={!isCameraActive}
                  className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Putar Kamera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-11 h-11" /> // empty spacer
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
