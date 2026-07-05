'use client';

import { Loader2 } from 'lucide-react';

interface LoadingAnimationProps {
  size?: number;
  text?: string;
}

export default function LoadingAnimation({ size = 48, text = 'Loading...' }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* UG Logo with spinning animation */}
        <div 
          className="flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold animate-pulse"
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.36 
          }}
        >
          UG
        </div>
        {/* Spinning ring around logo */}
        <div 
          className="absolute inset-0 rounded-lg border-4 border-blue-400 border-t-transparent animate-spin"
          style={{ width: size + 8, height: size + 8, left: -4, top: -4 }}
        />
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}
