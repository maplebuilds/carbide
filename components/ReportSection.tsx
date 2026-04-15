'use client';

interface ReportSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  theme: 'dark' | 'light';
}

export default function ReportSection({ title, icon, children, theme }: ReportSectionProps) {
  return (
    <div className={`rounded-xl border p-5 sm:p-6 ${
      theme === 'dark' ? 'border-white/10 bg-white/3' : 'border-black/10 bg-black/2'
    }`}>
      <h2 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 ${
        theme === 'dark' ? 'text-white/40' : 'text-black/40'
      }`}>
        <span>{icon}</span>
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}
