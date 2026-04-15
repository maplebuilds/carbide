'use client';

import { Search, Clock, BarChart2 } from 'lucide-react';

export type Tab = 'search' | 'history' | 'compare';

interface NavTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  theme: 'dark' | 'light';
}

const tabs: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'search', label: 'Search', Icon: Search },
  { id: 'history', label: 'History', Icon: Clock },
  { id: 'compare', label: 'Compare', Icon: BarChart2 },
];

export default function NavTabs({ activeTab, onTabChange, theme }: NavTabsProps) {
  return (
    <nav className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-[#F5F5F5]'}`}>
      <div className="max-w-4xl mx-auto px-4 flex">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all min-w-0 flex-1 justify-center ${
                isActive
                  ? 'border-[#FF5E00] text-[#FF5E00]'
                  : theme === 'dark'
                  ? 'border-transparent text-white/40 hover:text-white/70'
                  : 'border-transparent text-black/40 hover:text-black/70'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
