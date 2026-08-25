"use client";

import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Ultra-smooth, zero-delay page transition wrapper.
 * Re-triggers CSS pageEnter on route change without blocking or buffering children.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-[pageEnter_200ms_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}
