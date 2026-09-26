import React, { useState } from 'react';
import { StudentActivitySession } from '../types';
import { PresentationViewer } from './PresentationViewer';
import {
  Tv,
  X,
  Play,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Lightbulb,
  BookOpen
} from 'lucide-react';

interface ClassroomPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudentActivitySession[];
  onOpenProjector: (session: StudentActivitySession) => void;
}

export const ClassroomPresentationModal: React.FC<ClassroomPresentationModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onOpenProjector
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = sessions.filter(
    (s) => filterSubject === 'all' || s.subject === filterSubject
  );

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-left">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display">
                📺 Presentasi Layar Kelas (Proyektor)
              </h2>
              <p className="text-xs text-white/80">
                Pilih karya murid untuk ditayangkan di layar kelas bersama teman-teman
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Instructions */}
          <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-purple-950">
              <p className="font-bold">Tips Pedagogis Guru:</p>
              <p className="text-purple-800 mt-0.5 leading-relaxed">
                Tampilkan slide karya murid ke proyektor. Ajak presenter membaca slide dengan panduan 🎙️ Bantuan Berbicara, lalu buka sesi 💬 Tanya Teman untuk melatih argumentasi dan berpikir kritis sekelas!
              </p>
            </div>
          </div>

          {/* Student Works Grid to Pick */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pilih Karya Murid untuk Ditayangkan ({filtered.length}):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((s) => {
                const isSelected = s.id === selectedSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={s.image}
                          alt={s.imageLabel}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                          {s.subject}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#25324B] line-clamp-1">
                          {s.imageLabel}
                        </h4>
                        <p className="text-[11px] text-purple-700 font-medium">
                          Oleh: {s.studentName}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {s.missionTitle}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{s.presentation.length} Slide</span>
                      <span className="text-emerald-600 font-bold">Siap Tayang</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
            <span>Karya Terpilih:</span>
            <span className="font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
              👤 {selectedSession?.studentName}
            </span>
            <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
              📸 {selectedSession?.imageLabel}
            </span>
          </div>
          <button
            onClick={() => {
              if (selectedSession) {
                onClose();
                onOpenProjector(selectedSession);
              }
            }}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Tayangkan Sekarang di Layar Proyektor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
