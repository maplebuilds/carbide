'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Reading the odometer...',
  'Calculating true cost of ownership...',
  'Checking for dealer markup...',
  'Running depreciation numbers...',
  'Sniffing for hidden fees...',
  'Checking what the dealer paid at auction...',
  'Consulting the mechanic we wish you had...',
  'Crunching 3 years of ownership costs...',
  'Asking CarFax what they won\'t tell you for free...',
  'Estimating your insurance premium...',
  'Looking up reliability history...',
  'Mapping out your financing options...',
];

interface LoadingReportProps {
  theme: 'dark' | 'light';
}

export default function LoadingReport({ theme }: LoadingReportProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#FF5E00]/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF5E00] animate-spin"></div>
      </div>

      {/* Message */}
      <div className="h-8 flex items-center justify-center">
        <p
          className={`text-base sm:text-lg font-medium text-center transition-opacity duration-300 px-4 ${
            visible ? 'opacity-100' : 'opacity-0'
          } ${theme === 'dark' ? 'text-white/70' : 'text-black/60'}`}
        >
          {MESSAGES[index]}
        </p>
      </div>

      <p className={`text-sm ${theme === 'dark' ? 'text-white/30' : 'text-black/30'}`}>
        Building your full ownership report...
      </p>
    </div>
  );
}
