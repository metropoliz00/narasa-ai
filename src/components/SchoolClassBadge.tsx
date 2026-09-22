import React from 'react';

interface SchoolClassBadgeProps {
  classNameStr: string;
  schoolNameStr: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SchoolClassBadge: React.FC<SchoolClassBadgeProps> = ({
  classNameStr,
  schoolNameStr,
  size = 'sm'
}) => {
  if (size === 'lg') {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 text-xs font-bold text-blue-950 shadow-xs">
        <span className="flex items-center gap-1 text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-blue-100 shadow-2xs">
          <span>🎒</span> <span>{classNameStr}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1 text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-indigo-100 shadow-2xs">
          <span>🏫</span> <span>{schoolNameStr}</span>
        </span>
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/70 text-xs font-bold text-blue-900 shadow-2xs">
        <span className="text-blue-600">🎒</span>
        <span>{classNameStr}</span>
        <span className="text-slate-300">•</span>
        <span className="text-indigo-600">🏫</span>
        <span>{schoolNameStr}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 text-[10px] font-bold text-blue-900 shadow-2xs">
      <span className="text-blue-600 shrink-0">🎒</span>
      <span className="truncate">{classNameStr}</span>
      <span className="text-slate-300">•</span>
      <span className="text-indigo-600 shrink-0">🏫</span>
      <span className="truncate">{schoolNameStr}</span>
    </div>
  );
};
