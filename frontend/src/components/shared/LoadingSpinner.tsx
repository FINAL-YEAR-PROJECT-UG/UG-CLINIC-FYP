'use client';

import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 80, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative animate-pulse">
        <Image
          src="/home/logo.svg"
          alt="Loading..."
          width={size}
          height={size}
          className="animate-bounce"
          priority
        />
      </div>
      <p className="mt-4 text-gray-600 text-sm animate-pulse">Loading...</p>
    </div>
  );
}
