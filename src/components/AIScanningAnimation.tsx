import React, { useState, useEffect } from 'react';
import { Eye, Search, Link2, Brain, Check, BookOpen, X } from 'lucide-react';

interface AIScanningAnimationProps {
  imageSrc: string;
  onFinishScan?: () => void;
  onCancel?: () => void;
}

export const AIScanningAnimation: React.FC<AIScanningAnimationProps> = ({
  imageSrc,
  onFinishScan,
  onCancel
}) => {
  const steps = [
    { icon: Eye, label: 'Mengamati objek visual...', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Search, label: 'Menganalisis bentuk, ritme, dan pola...', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Link2, label: 'Menghubungkan dengan materi guru...', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Brain, label: 'Menyiapkan tantangan penalaran...', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: BookOpen, label: 'Menyusun pertanyaan kontekstual...', color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl max-w-xl mx-auto text-center space-y-6">
      {/* Scanner Visual Frame */}
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 mx-auto max-w-md border-2 border-blue-400/40 shadow-inner">
        <img
          src={imageSrc}
          alt="Scanning target"
          className="w-full h-full object-cover opacity-80"
        />
        {/* Animated laser line */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#20C9A6] to-transparent shadow-[0_0_15px_#20C9A6] animate-[bounce_2.5s_infinite]" />
        <div className="absolute inset-0 bg-radial from-transparent via-blue-900/10 to-blue-950/40 pointer-events-none" />

        {/* Status Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Memproses Pengamatan</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="space-y-2.5 max-w-md mx-auto text-left">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-blue-50/90 border border-blue-200 shadow-xs scale-102'
                  : isDone
                  ? 'bg-slate-50/70 opacity-90'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-emerald-100 text-emerald-600'
                    : isCurrent
                    ? `${step.bg} ${step.color} animate-pulse`
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  isCurrent ? 'text-[#25324B] font-bold' : isDone ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {onCancel && (
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </div>
      )}
    </div>
  );
};
