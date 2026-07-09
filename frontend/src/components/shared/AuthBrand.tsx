'use client';

import Image from 'next/image';
import logoIcon from '@/Assets/logo.svg';
import { getImageSrc } from '@/lib/assets';

interface AuthBrandProps {
  className?: string;
}

export default function AuthBrand({ className }: AuthBrandProps) {
  return (
    <div className={className ?? 'flex items-center gap-3'}>
      <Image
        src={getImageSrc(logoIcon)}
        alt="UG Clinic Logo"
        width={36}
        height={36}
        className="rounded-lg object-contain"
      />
      <div>
        <div className="text-sm font-semibold text-slate-950">UG Student Clinic</div>
        <div className="text-xs text-slate-500">Quality Healthcare for Students</div>
      </div>
    </div>
  );
}
