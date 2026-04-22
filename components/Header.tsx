'use client';

import { Sun, Moon } from 'lucide-react';
import CarbideLogo from './CarbideLogo';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 border-b ${
      theme === 'dark' ? 'bg-[#0e0e10] border-white/10' : 'bg-[#F5F5F5] border-black/10'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <CarbideLogo size="sm" theme={theme} />

        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className={`p-2 rounded-full transition-colors ${
            theme === 'dark'
              ? 'text-white/60 hover:text-white hover:bg-white/10'
              : 'text-black/60 hover:text-black hover:bg-black/10'
          }`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
