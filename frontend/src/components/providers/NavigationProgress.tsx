"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Ultra-responsive top-of-page navigation progress bar.
 * Fires instantly on link click and completes in < 50ms upon route change without getting stuck.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeTimer = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeout = useRef<NodeJS.Timeout | null>(null);
  const prevPathname = useRef(pathname);

  const clearAllTimers = () => {
    if (activeTimer.current) clearInterval(activeTimer.current);
    if (safetyTimeout.current) clearTimeout(safetyTimeout.current);
  };

  // Immediate completion whenever pathname changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      clearAllTimers();
      setProgress(100);
      const doneTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 60);
      return () => clearTimeout(doneTimer);
    }
  }, [pathname]);

  // Intercept click on any internal link
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // Skip external links, hashes, same-page anchors, or special protocols
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      // If already on the same page, do nothing
      if (href === window.location.pathname) {
        return;
      }

      clearAllTimers();
      setProgress(40);
      setVisible(true);

      // Fast ramp-up
      let currentProgress = 40;
      activeTimer.current = setInterval(() => {
        currentProgress = Math.min(currentProgress + 30, 92);
        setProgress(currentProgress);
      }, 25);

      // Safety timeout: Auto dismiss in 600ms if already resolved
      safetyTimeout.current = setTimeout(() => {
        clearAllTimers();
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 50);
      }, 600);
    };

    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      clearAllTimers();
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-[2.5px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.8),0_0_20px_rgba(6,182,212,0.5)] transition-all duration-100 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
