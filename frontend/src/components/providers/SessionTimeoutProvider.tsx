'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { logoutWithStore } from '@/lib/authApi';
import { isStaffRole } from '@/lib/utils';

const IDLE_MS = 2 * 60 * 1000;
const PROMPT_MS = 2 * 60 * 1000;

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);

  const [showPrompt, setShowPrompt] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(PROMPT_MS / 1000));

  const lastActivityRef = useRef(Date.now());
  const promptDeadlineRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    idleTimerRef.current = null;
    countdownRef.current = null;
    promptDeadlineRef.current = null;
  }, []);

  const performLogout = useCallback(async () => {
    clearTimers();
    setShowPrompt(false);
    const role = useAuthStore.getState().user?.role;
    await logoutWithStore();
    router.replace(isStaffRole(role) ? '/staff-portal-access' : '/login');
  }, [clearTimers, router]);

  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;
    lastActivityRef.current = Date.now();
    if (showPrompt) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowPrompt(true);
      setSecondsLeft(Math.floor(PROMPT_MS / 1000));
      promptDeadlineRef.current = Date.now() + PROMPT_MS;

      countdownRef.current = setInterval(() => {
        const deadline = promptDeadlineRef.current;
        if (!deadline) return;
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          void performLogout();
        }
      }, 1000);
    }, IDLE_MS);
  }, [isAuthenticated, showPrompt, performLogout]);

  const stayActive = useCallback(() => {
    setShowPrompt(false);
    setSecondsLeft(Math.floor(PROMPT_MS / 1000));
    clearTimers();
    lastActivityRef.current = Date.now();
    resetIdleTimer();
  }, [clearTimers, resetIdleTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setShowPrompt(false);
      return;
    }

    const onActivity = () => {
      if (!showPrompt) resetIdleTimer();
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      clearTimers();
    };
  }, [isAuthenticated, showPrompt, resetIdleTimer, clearTimers]);

  return (
    <>
      {children}
      {showPrompt && isAuthenticated && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
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
              Your session has been idle. Click below to stay signed in, or you will be logged out automatically
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
                className="flex-1 py-3 px-4 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold hover:bg-blue-900 transition-colors"
              >
                I&apos;m still here
              </button>
              <button
                type="button"
                onClick={() => void performLogout()}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
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
