import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isDashboardRoute } from '@/components/providers/SessionTimeoutProvider';
import { logoutWithStore } from '@/lib/authApi';
import { isStaffRole } from '@/lib/utils';

interface UseInactivityTimeoutOptions {
  /** Minutes of inactivity before showing warning popup (default: 10) */
  warningMinutes?: number;
  /** Minutes of inactivity before auto-logout after warning (default: 2) */
  logoutMinutes?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

export function useInactivityTimeout({
  warningMinutes = 10,
  logoutMinutes = 2,
  enabled = true,
}: UseInactivityTimeoutOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const isSessionActive = Boolean(enabled && isAuthenticated && user && isDashboardRoute(pathname));

  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    const role = useAuthStore.getState().user?.role;
    await logoutWithStore();
    router.replace(isStaffRole(role) ? '/staff-portal-access' : '/login');
  }, [router]);

  const resetInactivityTimer = useCallback(() => {
    setShowWarning(false);
    setTimeRemaining(0);
  }, []);

  const handleStayLoggedIn = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (!isSessionActive) {
      setShowWarning(false);
      setTimeRemaining(0);
    }
  }, [isSessionActive]);

  useEffect(() => {
    if (!isSessionActive) return;

    let warningTimeoutId: NodeJS.Timeout;
    let logoutTimeoutId: NodeJS.Timeout;
    let countdownIntervalId: NodeJS.Timeout;

    const warningTime = warningMinutes * 60 * 1000;
    const logoutTime = logoutMinutes * 60 * 1000;

    const resetTimers = () => {
      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
      clearInterval(countdownIntervalId);
      setShowWarning(false);
      setTimeRemaining(0);

      // Set warning timer
      warningTimeoutId = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(logoutMinutes * 60);

        // Start countdown
        countdownIntervalId = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Set logout timer after warning
        logoutTimeoutId = setTimeout(() => {
          void handleLogout();
        }, logoutTime);
      }, warningTime);
    };

    // Activity event listeners
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    // Initial timer setup
    resetTimers();

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
      clearInterval(countdownIntervalId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isSessionActive, warningMinutes, logoutMinutes, showWarning, handleLogout]);

  return {
    showWarning,
    timeRemaining,
    handleStayLoggedIn,
    handleLogout,
  };
}
