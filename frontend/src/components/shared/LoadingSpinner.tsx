'use client';

import Image from 'next/image';
import logoIcon from '@/Assets/logo.svg';

const getImageSrc = (image: any) => {
  if (typeof image === 'string') return image;
  if (image.src) return image.src;
  return image;
};

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 80, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 ${className}`}>
      {/* Animated ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer spinning ring */}
        <span
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0369A1] border-r-[#0369A1]/40"
          style={{
            animation: 'spin 900ms cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
        {/* Inner spinning ring (counter) */}
        <span
          className="absolute inset-2 rounded-full border-[2px] border-transparent border-b-[#1e3a8a]/60"
          style={{
            animation: 'spin 1200ms cubic-bezier(0.4,0,0.6,1) infinite reverse',
          }}
        />
        {/* Logo center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full overflow-hidden"
            style={{ width: size * 0.54, height: size * 0.54 }}
          >
            <Image
              src={getImageSrc(logoIcon)}
              alt="Loading…"
              width={size * 0.54}
              height={size * 0.54}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Text */}
      <p
        className="text-[0.8125rem] font-semibold tracking-wide text-[#6B7A8D]"
        style={{ animation: 'softPulse 2s ease-in-out infinite' }}
      >
        Loading…
      </p>
    </div>
  );
}
