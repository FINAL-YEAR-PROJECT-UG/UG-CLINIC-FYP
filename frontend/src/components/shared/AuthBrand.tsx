'use client';

import UGLogo from './UGLogo';

interface AuthBrandProps {
  className?: string;
}

export default function AuthBrand({ className }: AuthBrandProps) {
  return <UGLogo href="/" size="md" className={className} />;
}
