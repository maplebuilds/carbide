'use client';

import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { saveEmail } from '@/lib/storage';
import { VehicleData } from '@/lib/types';

interface EmailCaptureProps {
  theme: 'dark' | 'light';
  vehicle: VehicleData;
}

export default function EmailCapture({ theme, vehicle }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      saveEmail(email);
      setSubmitted(true);
    }
  };

  const isDark = theme === 'dark';

  if (submitted) {
    return (
      <div className={`rounded-xl border p-5 flex items-center gap-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
        <Check size={20} className="text-[#00B4FF] flex-shrink-0" />
        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Got it. We&apos;ll send your {vehicle.year} {vehicle.make} {vehicle.model} report to {email}.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'border-white/10 bg-white/3' : 'border-black/10 bg-black/2'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Mail size={16} className={isDark ? 'text-white/40' : 'text-black/40'} />
        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          Save or Share
        </p>
      </div>
      <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        Want to save or share this report? Enter your email and we&apos;ll send you a copy. Totally optional.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`flex-1 px-4 py-3 rounded-lg text-sm border outline-none transition-colors min-w-0 ${
            isDark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00B4FF]/60'
              : 'bg-black/5 border-black/10 text-[#1a1a1a] placeholder:text-black/30 focus:border-[#00B4FF]/60'
          }`}
        />
        <button
          type="submit"
          disabled={!email.includes('@')}
          className={`px-5 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            email.includes('@')
              ? 'bg-[#00B4FF]/20 text-[#00B4FF] border border-[#00B4FF]/40 hover:bg-[#00B4FF]/30'
              : isDark
              ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
              : 'bg-black/5 text-black/20 border border-black/10 cursor-not-allowed'
          }`}
        >
          Send Report
        </button>
      </form>
    </div>
  );
}
