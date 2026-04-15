'use client';

interface FooterProps {
  theme: 'dark' | 'light';
}

export default function Footer({ theme }: FooterProps) {
  return (
    <footer className={`border-t mt-12 py-6 ${
      theme === 'dark' ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-[#F5F5F5]'
    }`}>
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className={`text-xs ${theme === 'dark' ? 'text-white/30' : 'text-black/30'}`}>
          Estimates are for informational purposes only. Always verify with a licensed dealer and insurance provider.
        </p>
        <p className={`text-xs font-mono ${theme === 'dark' ? 'text-white/20' : 'text-black/20'}`}>
          v0.1.0
        </p>
      </div>
    </footer>
  );
}
