'use client';

interface CarbideLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export default function CarbideLogo({ className = '', size = 'md', theme = 'dark' }: CarbideLogoProps) {
  const scales = { sm: 0.42, md: 0.58, lg: 0.85 };
  const scale = scales[size];
  const w = Math.round(520 * scale);
  const h = Math.round(120 * scale);

  // Text and gauge lines change with theme; accents stay blue
  const inkColor = theme === 'dark' ? '#F2F3F5' : '#1a1a1a';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 120"
      width={w}
      height={h}
      fill="none"
      className={className}
      aria-label="Carbide"
    >
      {/* Speedometer mark */}
      <g stroke={inkColor}>
        <line x1="12" y1="70" x2="22" y2="70" strokeWidth="3"/>
        <line x1="16.95" y1="54.15" x2="25.46" y2="58.94" strokeWidth="1.5"/>
        <line x1="27.82" y1="41.41" x2="34.82" y2="48.41" strokeWidth="1.5"/>
        <line x1="42.79" y1="33.01" x2="47.57" y2="41.52" strokeWidth="1.5"/>
        <line x1="60" y1="22" x2="60" y2="32" strokeWidth="3"/>
        <line x1="77.21" y1="33.01" x2="72.43" y2="41.52" strokeWidth="1.5"/>
        <line x1="92.18" y1="41.41" x2="85.18" y2="48.41" strokeWidth="1.5"/>
        <line x1="103.05" y1="54.15" x2="94.54" y2="58.94" strokeWidth="1.5"/>
        <line x1="108" y1="70" x2="98" y2="70" strokeWidth="3"/>
      </g>
      <g transform="rotate(-32 60 70)">
        <path d="M60 66.5 L102 66.5 L110 70 L102 73.5 L60 73.5 Z" fill="#00B4FF"/>
        <rect x="72" y="69" width="20" height="2" fill={theme === 'dark' ? '#0A0B0D' : '#ffffff'}/>
      </g>
      <circle cx="60" cy="70" r="4.5" fill={theme === 'dark' ? '#0A0B0D' : '#ffffff'} stroke="#00B4FF" strokeWidth="2.5"/>

      {/* Wordmark — "carb" + "i" pin + "de" */}
      <g fontFamily="'JetBrains Mono', ui-monospace, monospace" fontWeight="600" fontSize="72" fill={inkColor} letterSpacing="-1.5">
        <text x="140" y="82">carb</text>
        <text x="323" y="82">de</text>
      </g>

      {/* "i" replaced by fuel-gauge pin */}
      <g transform="translate(312 24)">
        <circle cx="3.5" cy="5" r="4.5" fill={theme === 'dark' ? '#0A0B0D' : '#ffffff'} stroke="#00B4FF" strokeWidth="2.5"/>
        <path d="M0 13 L7 13 L7 52 L3.5 60 L0 52 Z" fill="#00B4FF"/>
        <rect x="2.5" y="24" width="2" height="20" fill={theme === 'dark' ? '#0A0B0D' : '#ffffff'}/>
      </g>
    </svg>
  );
}
