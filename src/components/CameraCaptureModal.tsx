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
  Image as ImageIcon
} from 'lucide-react';
import { toast } from './Toast';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPhoto: (imageDataUrl: string, objectNameHint: string) => void;
  activeMissionTitle: string;
  activeMissionSubject: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onConfirmPhoto,
  activeMissionTitle,
  activeMissionSubject
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
      setCameraError('Kamera tidak dapat diakses atau izin belum diberikan. Kamu dapat mengunggah foto melalui tab Unggah Foto.');
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
      const defaultName = `Eksplorasi ${activeMissionSubject}`;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
      
      {/* Shutter Camera Flash Effect */}
      {isShutterFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-flash-effect" />
      )}

      {/* --- RENDER PREVIEW/FORM MODE (If photo is already taken) --- */}
      {selectedPhoto ? (
        <div className="flex flex-col h-full overflow-y-auto bg-slate-900 text-white p-4 sm:p-6 justify-center">
          <div className="max-w-5xl w-full mx-auto bg-slate-950/80 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Form */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  Hasil Tangkapan
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white mt-1">
                  Lembar Detektif Pengamatan Gambar
                </h3>
                <p className="text-xs text-slate-400">
                  Misi: <strong className="text-slate-300">{activeMissionTitle}</strong> • {activeMissionSubject}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
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
                  className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
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
                      <span>1. Nama Objek yang Diamati (Contoh: "Bunga", "Batu"):</span>
                    </label>
                    <input
                      type="text"
                      value={objectTitle}
                      onChange={(e) => setObjectTitle(e.target.value)}
                      placeholder="Masukkan nama objek pengamatan..."
                      className="w-full p-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                    />
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
                      placeholder="Deskripsikan bentuk, warna, pola, jumlah, atau kegunaan objek tersebut..."
                      className="w-full p-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <p className="text-[10px] sm:text-xs text-slate-300 leading-snug">
                    Bagus sekali! Pengamatan kognitifmu akan dianalisis secara instan oleh kecerdasan buatan NARASA AI untuk menguji pemahaman literasimu.
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
          <div className="p-4 sm:p-5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-20 shrink-0">
            {/* Left Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
              <div>
                <span className="text-[10px] font-extrabold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/60 uppercase tracking-widest block w-fit">
                  KAMERA NARASA
                </span>
                <h4 className="text-xs sm:text-sm font-black font-display tracking-tight text-white mt-0.5">
                  Misi: {activeMissionTitle}
                </h4>
              </div>
            </div>

            {/* Right Quick Toggles */}
            <div className="flex items-center gap-2">
              {activeMode === 'live' && isCameraActive && (
                <>
                  {/* Grid Lines Toggler */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowGrid(!showGrid);
                      toast.info('Garis Bantu', showGrid ? 'Garis bantu dimatikan' : 'Garis bantu dinyalakan');
                    }}
                    className={`p-2.5 rounded-full transition-all ${
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
                    className={`p-2.5 rounded-full transition-all ${
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
                    className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all active:rotate-180 duration-300"
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
                className="p-2.5 rounded-full bg-black/50 hover:bg-red-600 text-white transition-colors"
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
                    <div className="border-r border-white/20" />
                    <div className="border-r border-white/20" />
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
                        Pastikan kamu mengizinkan akses kamera pada browser/ponselmu untuk pengalaman terbaik.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
                      >
                        Nyalakan Kamera
                      </button>
                      <button
                        onClick={() => setActiveMode('upload')}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all"
                      >
                        Gunakan Unggah Foto
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
          <div className="p-6 bg-black z-20 shrink-0 flex flex-col items-center justify-between gap-4">
            
            {/* Tabs Selector HUD */}
            <div className="inline-flex rounded-full p-0.5 bg-slate-900 border border-slate-800">
              <button
                onClick={() => {
                  setActiveMode('live');
                  startCamera(facingMode);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
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
                className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-90"
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
                  {/* Subtle camera icon inside red ring dot */}
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
                  className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
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
