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
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative animate-pulse">
        <Image
          src={getImageSrc(logoIcon)}
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
