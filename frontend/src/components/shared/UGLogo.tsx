'use client';

import Link from 'next/link';
import Image from 'next/image';

interface UGLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
  href?: string;
  className?: string;
}

export default function UGLogo({
  size = 'md',
  showText = true,
  textColor = 'text-gray-900',
  href = '/',
  className = '',
}: UGLogoProps) {
  const dimensions = {
    sm: { img: 32, text: 'text-sm', sub: 'text-[9px]' },
    md: { img: 42, text: 'text-base', sub: 'text-[11px]' },
    lg: { img: 52, text: 'text-lg', sub: 'text-xs' },
  }[size];

  const logoContent = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl border-2 border-gray-100 bg-white p-1 shadow-sm">
        <Image
          src="/logo.svg"
          alt="University of Ghana Health Services Logo"
          width={dimensions.img}
          height={dimensions.img}
          className="object-contain rounded-xl"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-poppins font-extrabold tracking-tight ${dimensions.text} ${textColor} leading-tight`}>
            UG CLINIC
          </span>
          <span className={`font-inter font-medium tracking-wider text-[#1e3a8a] uppercase ${dimensions.sub}`}>
            University of Ghana
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
