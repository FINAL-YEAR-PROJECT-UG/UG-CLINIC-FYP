'use client';

import React from 'react';

interface SuccessCheckmarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
  alt?: string;
}

const sizeMap: Record<string, { px: number; cls: string }> = {
  xs: { px: 16, cls: 'w-4 h-4' },
  sm: { px: 20, cls: 'w-5 h-5' },
  md: { px: 28, cls: 'w-7 h-7' },
  lg: { px: 48, cls: 'w-12 h-12' },
  xl: { px: 80, cls: 'w-20 h-20' },
};

export default function SuccessCheckmark({
  size = 'xl',
  className = '',
  glow = true,
  animated = true,
  alt = 'Success',
}: SuccessCheckmarkProps) {
  const sizeInfo = typeof size === 'number'
    ? { px: size, cls: `w-[${size}px] h-[${size}px]` }
    : sizeMap[size] || sizeMap.xl;

  const isHero = typeof size === 'number' ? size >= 48 : (size === 'lg' || size === 'xl');

  if (isHero) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="relative inline-flex items-center justify-center">
          {/* Subtle pulsating ambient glow behind the badge */}
          {glow && (
            <div
              className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl pointer-events-none"
              style={{
                transform: 'scale(1.25)',
                animation: animated ? 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined,
              }}
            />
          )}

          {/* User's custom checkmark graphic */}
          <img
            src="/icons/green-check.png"
            alt={alt}
            width={sizeInfo.px}
            height={sizeInfo.px}
            className={`relative z-10 object-contain drop-shadow-[0_8px_20px_rgba(34,197,94,0.32)] select-none pointer-events-none ${
              animated ? 'animate-[scaleIn_320ms_cubic-bezier(0.34,1.56,0.64,1)_both]' : ''
            }`}
            style={{ width: `${sizeInfo.px}px`, height: `${sizeInfo.px}px` }}
          />
        </div>
      </div>
    );
  }

  return (
    <img
      src="/icons/green-check.png"
      alt={alt}
      width={sizeInfo.px}
      height={sizeInfo.px}
      className={`inline-block shrink-0 object-contain select-none pointer-events-none ${sizeInfo.cls} ${className}`}
      style={typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined}
    />
  );
}
