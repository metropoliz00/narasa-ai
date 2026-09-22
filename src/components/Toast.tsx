import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  HelpCircle
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  danger?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  resolvePromise?: (value: boolean) => void;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => listener(copy));
  }

  public dismiss(id: string) {
    const item = this.toasts.find((t) => t.id === id);
    if (item && item.resolvePromise) {
      item.resolvePromise(false);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public success(title: string, message?: string, duration = 4000) {
    return this.show({ type: 'success', title, message, duration });
  }

  public error(title: string, message?: string, duration = 5000) {
    return this.show({ type: 'error', title, message, duration });
  }

  public warning(title: string, message?: string, duration = 4500) {
    return this.show({ type: 'warning', title, message, duration });
  }

  public info(title: string, message?: string, duration = 4000) {
    return this.show({ type: 'info', title, message, duration });
  }

  public alert(message: string, title = 'Perhatian') {
    return this.show({ type: 'info', title, message, duration: 5000 });
  }

  public confirm(options: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const item: ToastItem = {
        id,
        type: 'confirm',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Ya, Lanjutkan',
        cancelText: options.cancelText || 'Batal',
        danger: options.danger ?? false,
        duration: 0, // never auto-dismiss confirm toasts
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
        resolvePromise: resolve
      };
      this.toasts = [item, ...this.toasts];
      this.notify();
    });
  }

  private show(data: Omit<ToastItem, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const item: ToastItem = {
      ...data,
      id
    };
    // Keep max 5 visible toasts to avoid clutter
    this.toasts = [item, ...this.toasts].slice(0, 5);
    this.notify();
    return id;
  }
}

export const toast = new ToastManager();

// Intercept window.alert gracefully if in browser environment
if (typeof window !== 'undefined') {
  const originalAlert = window.alert;
  window.alert = (msg?: any) => {
    toast.info('Pemberitahuan', String(msg ?? ''));
  };
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => {
      setToasts(updated);
    });
  }, []);

  return (
    <div
      id="narasa-toast-container"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-3 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastCardProps {
  item: ToastItem;
}

const ToastCard: React.FC<ToastCardProps> = ({ item }) => {
  const [paused, setPaused] = useState(false);
  const duration = item.duration ?? 4000;
  const isConfirm = item.type === 'confirm';

  useEffect(() => {
    if (duration <= 0 || isConfirm) return;
    if (paused) return;

    const timer = setTimeout(() => {
      toast.dismiss(item.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, item.id, isConfirm, paused]);

  const handleConfirm = () => {
    if (item.onConfirm) item.onConfirm();
    if (item.resolvePromise) item.resolvePromise(true);
    toast.dismiss(item.id);
  };

  const handleCancel = () => {
    if (item.onCancel) item.onCancel();
    if (item.resolvePromise) item.resolvePromise(false);
    toast.dismiss(item.id);
  };

  const config = {
    success: {
      border: 'border-emerald-200/90 shadow-emerald-500/10',
      badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      progress: 'bg-emerald-500',
      icon: CheckCircle2,
      accentGlow: 'from-emerald-500/10 to-transparent'
    },
    error: {
      border: 'border-rose-200/90 shadow-rose-500/10',
      badge: 'bg-rose-50 text-rose-600 border border-rose-200',
      progress: 'bg-rose-500',
      icon: AlertCircle,
      accentGlow: 'from-rose-500/10 to-transparent'
    },
    warning: {
      border: 'border-amber-200/90 shadow-amber-500/10',
      badge: 'bg-amber-50 text-amber-600 border border-amber-200',
      progress: 'bg-amber-500',
      icon: AlertTriangle,
      accentGlow: 'from-amber-500/10 to-transparent'
    },
    info: {
      border: 'border-blue-200/90 shadow-blue-500/10',
      badge: 'bg-blue-50 text-blue-600 border border-blue-200',
      progress: 'bg-blue-500',
      icon: Info,
      accentGlow: 'from-blue-500/10 to-transparent'
    },
    confirm: {
      border: item.danger
        ? 'border-rose-200/90 shadow-rose-500/15'
        : 'border-indigo-200/90 shadow-indigo-500/15',
      badge: item.danger
        ? 'bg-rose-50 text-rose-600 border border-rose-200'
        : 'bg-indigo-50 text-indigo-600 border border-indigo-200',
      progress: item.danger ? 'bg-rose-500' : 'bg-indigo-500',
      icon: item.danger ? AlertCircle : HelpCircle,
      accentGlow: item.danger
        ? 'from-rose-500/10 to-transparent'
        : 'from-indigo-500/10 to-transparent'
    }
  }[item.type];

  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl border p-4 shadow-xl ${config.border} flex flex-col gap-2.5 transition-all`}
    >
      {/* Subtle top gradient glow */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accentGlow}`}
      />

      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.badge}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1 pt-0.5">
          <h4 className="text-sm font-bold text-slate-800 leading-snug">
            {item.title}
          </h4>
          {item.message && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line break-words">
              {item.message}
            </p>
          )}
        </div>

        {!isConfirm && (
          <button
            onClick={() => toast.dismiss(item.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Confirmation Actions */}
      {isConfirm && (
        <div className="flex items-center justify-end gap-2 pt-1 mt-0.5 border-t border-slate-100">
          <button
            onClick={handleCancel}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {item.cancelText || 'Batal'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
              item.danger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {item.confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      )}

      {/* Progress countdown line */}
      {duration > 0 && !isConfirm && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: paused ? '100%' : '0%' }}
            transition={{
              duration: duration / 1000,
              ease: 'linear'
            }}
            className={`h-full ${config.progress}`}
          />
        </div>
      )}
    </motion.div>
  );
};
