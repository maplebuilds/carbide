import CarbideLogo from '@/components/CarbideLogo';
import Link from 'next/link';

export const metadata = {
  title: 'About — Carbide',
  description: 'Carbide was built for first-time car buyers who are tired of walking into dealerships blind.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#07080d', color: '#d8dde8' }}>

      {/* Top nav */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-8 pb-4">
        <Link href="/" className="font-data text-[12px] uppercase tracking-[0.15em] text-[#00B4FF]/60 hover:text-[#00B4FF] transition-colors">
          ← Back to Carbide
        </Link>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center gap-10">

        <CarbideLogo size="lg" theme="dark" />

        <p className="font-data text-[13px] uppercase tracking-[0.2em] text-[#00B4FF]">
          Cut through the BS before you buy.
        </p>

        <div className="max-w-xl space-y-5 text-left">
          <p className="text-base leading-relaxed text-white/70" style={{ fontFamily: "'Martel', Georgia, serif" }}>
            Carbide was built for first-time car buyers who are tired of walking into dealerships blind.
            The average buyer spends less than an hour researching a vehicle they'll own for five years —
            and dealers know it.
          </p>
          <p className="text-base leading-relaxed text-white/70" style={{ fontFamily: "'Martel', Georgia, serif" }}>
            Punch in a VIN and Carbide instantly pulls real ownership costs — financing, insurance,
            fuel, maintenance, and total 3-year spend — so you know exactly what you're getting into
            before you sign anything. The AI verdict tells you whether it's a smart buy, what to watch
            out for, and the exact questions to ask the dealer that will make them uncomfortable.
          </p>
          <p className="text-base leading-relaxed text-white/70" style={{ fontFamily: "'Martel', Georgia, serif" }}>
            No signup. No upsells. Just the numbers.
          </p>
        </div>

        <div className="w-16 h-px" style={{ background: 'rgba(0,180,255,0.35)' }} />

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12">
          {[
            { value: 'Free', label: 'Always' },
            { value: 'VIN-powered', label: 'Real vehicle data' },
            { value: 'No signup', label: 'Required' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5">
              <p className="font-data font-semibold text-[20px] text-[#00B4FF]">{stat.value}</p>
              <p className="font-data text-[11px] uppercase tracking-[0.12em] text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-4 px-6 py-3 rounded-lg font-data text-[12px] uppercase tracking-wider text-white bg-[#00B4FF] hover:bg-[#0099e0] active:scale-95 transition-all"
        >
          Start a Report
        </Link>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-data text-[11px] text-white/20 text-center">
            Estimates are for informational purposes only. Always verify with a licensed dealer and insurance provider.
          </p>
        </div>
      </footer>

    </div>
  );
}
