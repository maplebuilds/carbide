'use client';

interface CarbideLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CarbideLogo({ className = '', size = 'md' }: CarbideLogoProps) {
  const sizes = {
    sm: { fontSize: '1.25rem', letterSpacing: '0.15em' },
    md: { fontSize: '1.75rem', letterSpacing: '0.2em' },
    lg: { fontSize: '2.5rem', letterSpacing: '0.25em' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG C with diagonal cut */}
      <svg
        width={size === 'sm' ? 28 : size === 'md' ? 36 : 52}
        height={size === 'sm' ? 28 : size === 'md' ? 36 : 52}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* C shape using arc path */}
        <path
          d="M42 14 C36 7, 16 7, 10 20 C4 33, 10 46, 22 48 C30 49, 38 45, 42 40"
          stroke="#FF5E00"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Diagonal cut line */}
        <line x1="38" y1="6" x2="28" y2="46" stroke="#FF5E00" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </svg>

      {/* Wordmark */}
      <span
        className="font-black uppercase text-inherit"
        style={{ fontSize: s.fontSize, letterSpacing: s.letterSpacing }}
      >
        CARBIDE
      </span>
    </div>
  );
}
