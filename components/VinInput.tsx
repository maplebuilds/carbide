'use client';

import { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';

interface VinInputProps {
  onSubmit: (vin: string) => void;
  loading: boolean;
  theme: 'dark' | 'light';
  error?: string;
}

export default function VinInput({ onSubmit, loading, theme, error }: VinInputProps) {
  const [vin, setVin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = vin.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    if (cleaned.length === 17) {
      onSubmit(cleaned);
    }
  };

  const cleaned = vin.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  const isValid = cleaned.length === 17;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero text */}
      <div className="text-center mb-8">
        <h1
          className={`text-4xl sm:text-6xl mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'
          }`}
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 600, letterSpacing: '-0.03em' }}
        >
          Cut Through the BS.
        </h1>
        <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
          Enter a VIN number to get the full ownership cost breakdown — free, instant, no signup.
        </p>
      </div>

      {/* VIN form */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className={`flex flex-col sm:flex-row gap-3 p-2 rounded-xl border-2 transition-colors ${
          error
            ? 'border-red-500/60'
            : theme === 'dark'
            ? 'border-white/10 bg-white/5 focus-within:border-[#00B4FF]/60'
            : 'border-black/10 bg-black/5 focus-within:border-[#00B4FF]/60'
        }`}>
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              className={`w-full bg-transparent px-3 py-3 pr-14 text-base sm:text-lg font-mono tracking-widest outline-none placeholder:opacity-30 ${
                theme === 'dark' ? 'text-white placeholder:text-white' : 'text-[#1a1a1a] placeholder:text-[#1a1a1a]'
              }`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none ${
              cleaned.length === 17
                ? 'text-[#00B4FF]'
                : theme === 'dark' ? 'text-white/30' : 'text-black/30'
            }`}>
              {cleaned.length}/17
            </span>
          </div>
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all ${
              isValid && !loading
                ? 'bg-[#00B4FF] text-white hover:bg-[#0099e0] active:scale-95'
                : theme === 'dark'
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-black/10 text-black/30 cursor-not-allowed'
            }`}
          >
            <Search size={16} />
            Analyze
          </button>
        </div>

        {/* Hint */}
        <div className="mt-2 px-1">
          <p className={`text-xs ${theme === 'dark' ? 'text-white/30' : 'text-black/30'}`}>
            VIN is 17 characters — found on your dashboard, door frame, or title
          </p>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Example VINs hint */}
      <div className="mt-6 text-center">
        <p className={`text-xs ${theme === 'dark' ? 'text-white/20' : 'text-black/20'}`}>
          Where to find your VIN: dashboard near windshield · driver's door jamb · vehicle title · insurance card
        </p>
      </div>
    </div>
  );
}
