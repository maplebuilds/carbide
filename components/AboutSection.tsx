'use client';

import CarbideLogo from './CarbideLogo';

interface AboutSectionProps {
  theme: 'dark' | 'light';
}

export default function AboutSection({ theme }: AboutSectionProps) {
  const isDark = theme === 'dark';

  return (
    <section
      className="w-full mt-12 border-t"
      style={{ borderColor: 'rgba(0,180,255,0.15)', background: isDark ? 'rgba(0,180,255,0.03)' : 'rgba(0,180,255,0.04)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-8">

        {/* Large logo */}
        <CarbideLogo size="lg" theme={theme} />

        {/* Tagline */}
        <p className="font-data text-[13px] uppercase tracking-[0.2em] text-[#00B4FF]">
          Cut through the BS before you buy.
        </p>

        {/* About copy */}
        <div className="max-w-xl space-y-4">
          <p
            className={`text-base leading-relaxed ${isDark ? 'text-white/70' : 'text-black/65'}`}
            style={{ fontFamily: "'Martel', Georgia, serif" }}
          >
            Carbide was built for first-time car buyers who are tired of walking into dealerships blind.
            The average buyer spends less than an hour researching a vehicle they'll own for five years —
            and dealers know it.
          </p>
          <p
            className={`text-base leading-relaxed ${isDark ? 'text-white/70' : 'text-black/65'}`}
            style={{ fontFamily: "'Martel', Georgia, serif" }}
          >
            Punch in a VIN and Carbide instantly pulls real ownership costs — financing, insurance,
            fuel, maintenance, and total 3-year spend — so you know exactly what you're getting into
            before you sign anything. The AI verdict tells you whether it's a smart buy, what to watch
            out for, and the exact questions to ask the dealer that will make them uncomfortable.
          </p>
          <p
            className={`text-base leading-relaxed ${isDark ? 'text-white/70' : 'text-black/65'}`}
            style={{ fontFamily: "'Martel', Georgia, serif" }}
          >
            No signup. No upsells. Just the numbers.
          </p>
        </div>

        {/* Divider line */}
        <div className="w-16 h-px" style={{ background: 'rgba(0,180,255,0.35)' }} />

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-10">
          {[
            { value: 'Free', label: 'Always' },
            { value: 'VIN-powered', label: 'Real vehicle data' },
            { value: 'No signup', label: 'Required' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <p className="font-data font-semibold text-[18px] text-[#00B4FF]">{stat.value}</p>
              <p className={`font-data text-[11px] uppercase tracking-[0.12em] ${isDark ? 'text-white/30' : 'text-black/30'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
