'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { logoutWithStore } from '@/lib/authApi';
import { isStaffRole } from '@/lib/utils';

// 15 min idle before showing the timeout warning prompt
const IDLE_MS = 15 * 60 * 1000;
// 3 min grace period to respond before auto-logout
const PROMPT_MS = 3 * 60 * 1000;

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;

/**
 * Returns true only if the given pathname is within the student dashboard or staff dashboard.
 * Explicitly excludes all public pages and the staff login page (/staff-portal-access).
 */
export function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  // Student dashboard: /dashboard or any /dashboard/* subpaths
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return true;
  }

  // Staff dashboard: /staff or any /staff/* subpaths (excludes /staff-portal-access)
  if (pathname === '/staff' || pathname.startsWith('/staff/')) {
    return true;
  }

  return false;
}

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Active ONLY when:
  // 1. The user is logged in with an authenticated user session
  // 2. The user is actively viewing either the student dashboard or staff dashboard
  // Explicitly disabled for users viewing public site pages, auth pages, or staff portal login
  const isProtectedSessionActive = Boolean(isAuthenticated && user && isDashboardRoute(pathname));

  const [showPrompt, setShowPrompt] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(PROMPT_MS / 1000));

  const performLogout = useCallback(async () => {
    setShowPrompt(false);
    const role = useAuthStore.getState().user?.role;
    await logoutWithStore();
    router.replace(isStaffRole(role) ? '/staff-portal-access' : '/login');
  }, [router]);

  // If the user navigates away from dashboard or is no longer authenticated, dismiss prompt and reset
  useEffect(() => {
    if (!isProtectedSessionActive) {
      setShowPrompt(false);
      setSecondsLeft(Math.floor(PROMPT_MS / 1000));
    }
  }, [isProtectedSessionActive]);

  // Effect 1: Idle detection (active only when logged in on a dashboard route AND prompt is not visible)
  useEffect(() => {
    if (!isProtectedSessionActive || showPrompt) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const startIdleTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setShowPrompt(true);
      }, IDLE_MS);
    };

    const onActivity = () => {
      startIdleTimer();
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    startIdleTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      if (timer) clearTimeout(timer);
    };
  }, [isProtectedSessionActive, showPrompt]);

  // Effect 2: Countdown timer (active only when prompt is visible on active dashboard session)
  useEffect(() => {
    if (!isProtectedSessionActive || !showPrompt) {
      setSecondsLeft(Math.floor(PROMPT_MS / 1000));
      return;
    }

    const initialSeconds = Math.floor(PROMPT_MS / 1000);
    setSecondsLeft(initialSeconds);
    const deadline = Date.now() + PROMPT_MS;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        void performLogout();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isProtectedSessionActive, showPrompt, performLogout]);

  const stayActive = useCallback(() => {
    setShowPrompt(false);
    setSecondsLeft(Math.floor(PROMPT_MS / 1000));
  }, []);

  return (
    <>
      {children}
      {showPrompt && isProtectedSessionActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Session timeout</p>
            <h2 id="session-timeout-title" className="mt-2 text-xl font-extrabold text-slate-900">
              Are you still there?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your session has been idle. Do you want to stay logged in? You will be logged out automatically
              in{' '}
              <span className="font-mono font-bold text-[#1e3a8a]">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
              .
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={stayActive}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold hover:bg-blue-900 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Stay logged in
              </button>
              <button
                type="button"
                onClick={() => void performLogout()}
                className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold leading-tight text-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                Log out now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
