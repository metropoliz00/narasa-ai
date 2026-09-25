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
  // Colorful, high-clarity navigation for mobile screens (super engaging for elementary students)
  const allTabs = [
    {
      id: 'home' as StudentTab,
      label: 'Beranda',
      icon: Home,
      color: 'blue',
      activeBg: 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30',
      activeText: 'text-blue-700',
      inactiveIcon: 'text-blue-500 bg-blue-50'
    },
    {
      id: 'explore' as StudentTab,
      label: 'Misi Belajar',
      icon: BookOpen,
      color: 'emerald',
      activeBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30',
      activeText: 'text-emerald-700',
      inactiveIcon: 'text-emerald-500 bg-emerald-50'
    },
    {
      id: 'present' as StudentTab,
      label: 'Presentasi',
      icon: Mic,
      color: 'pink',
      activeBg: 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30',
      activeText: 'text-pink-700',
      inactiveIcon: 'text-pink-500 bg-pink-50'
    },
    {
      id: 'portfolio' as StudentTab,
      label: 'Portofolio',
      icon: FolderKanban,
      color: 'amber',
      activeBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
      activeText: 'text-amber-700',
      inactiveIcon: 'text-amber-500 bg-amber-50'
    },
    {
      id: 'quiz' as StudentTab,
      label: 'Uji Konsep',
      icon: Brain,
      color: 'purple',
      activeBg: 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30',
      activeText: 'text-purple-700',
      inactiveIcon: 'text-purple-500 bg-purple-50'
    }
  ];

  const tabs = allTabs.filter((t) => t.id !== 'present' || isPresentationAllowed);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-indigo-100 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 py-1 px-1 rounded-2xl flex flex-col items-center justify-center min-h-[50px] transition-all active:scale-95 cursor-pointer`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? `${tab.activeBg} scale-105`
                    : `${tab.inactiveIcon} hover:scale-102`
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[68px] ${isActive ? `font-black ${tab.activeText}` : 'font-bold text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
