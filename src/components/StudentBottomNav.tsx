import React from 'react';
import {
  Home,
  Camera,
  BookOpen,
  Brain,
  Lightbulb,
  HelpCircle,
  Mic,
  FolderKanban,
  Trophy
} from 'lucide-react';

export type StudentTab =
  | 'home'
  | 'explore'
  | 'quiz'
  | 'think'
  | 'solve'
  | 'reflect'
  | 'present'
  | 'portfolio'
  | 'achievement';

interface StudentBottomNavProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  hasActiveSession: boolean;
  isPresentationAllowed?: boolean;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveSession,
  isPresentationAllowed = true
}) => {
  // Minimalist, high-clarity navigation for mobile screens (easy for elementary students)
  const allTabs = [
    { id: 'home' as StudentTab, label: 'Beranda', icon: Home },
    { id: 'explore' as StudentTab, label: 'Misi', icon: BookOpen },
    { id: 'present' as StudentTab, label: 'Presentasi', icon: Mic },
    { id: 'portfolio' as StudentTab, label: 'Portofolio', icon: FolderKanban },
    { id: 'quiz' as StudentTab, label: 'Uji Konsep', icon: Brain }
  ];

  const tabs = allTabs.filter((t) => t.id !== 'present' || isPresentationAllowed);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center min-h-[48px] transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-[#4F8EF7] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#4F8EF7]'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-[64px] ${isActive ? 'font-bold text-[#4F8EF7]' : 'font-medium text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
