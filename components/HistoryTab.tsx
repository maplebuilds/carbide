'use client';

import { Clock, ChevronRight, Trash2 } from 'lucide-react';
import { HistoryItem } from '@/lib/types';

interface HistoryTabProps {
  history: HistoryItem[];
  theme: 'dark' | 'light';
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function HistoryTab({ history, theme, onSelect, onClear }: HistoryTabProps) {
  const isDark = theme === 'dark';

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Clock size={40} className={isDark ? 'text-white/20' : 'text-black/20'} />
        <p className={`text-base font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>No reports yet</p>
        <p className={`text-sm text-center max-w-xs ${isDark ? 'text-white/25' : 'text-black/25'}`}>
          Search a VIN to generate your first report. It&apos;ll show up here so you can reference it later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          Recently Viewed ({history.length})
        </h2>
        <button
          onClick={onClear}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            isDark ? 'text-white/30 hover:text-red-400 hover:bg-red-500/10' : 'text-black/30 hover:text-red-500 hover:bg-red-500/10'
          }`}
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <button
            key={item.vin}
            onClick={() => onSelect(item)}
            className={`w-full text-left rounded-xl border p-4 transition-all hover:border-[#00B4FF]/40 group ${
              isDark ? 'border-white/10 bg-white/3 hover:bg-white/5' : 'border-black/10 bg-black/2 hover:bg-black/5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                  {item.year} {item.make} {item.model}
                  {item.trim && <span className="text-[#00B4FF] ml-1 font-normal">{item.trim}</span>}
                </p>
                <p className={`text-xs font-mono mt-0.5 truncate ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                  {item.vin}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/25' : 'text-black/25'}`}>
                  Viewed {new Date(item.dateViewed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <ChevronRight size={18} className={`flex-shrink-0 transition-colors ${isDark ? 'text-white/20 group-hover:text-[#00B4FF]' : 'text-black/20 group-hover:text-[#00B4FF]'}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
