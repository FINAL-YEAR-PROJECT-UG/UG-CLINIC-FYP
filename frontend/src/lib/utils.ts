import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object'
  ) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string') return message;
  }
  if (err instanceof Error) {
    if (err.message === 'Network Error') {
      return 'Unable to reach the server. Please ensure the backend is running and try again.';
    }
    if (err.message) return err.message;
  }
  return fallback;
}

const STAFF_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];

export type AuthRoleInfo = {
  role?: string | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
};

export const STUDENT_BOOKING_LOGIN_ROUTE = '/login?next=%2Fdemo-booking';

export function normalizeRole(role?: string | null): string {
  return (role ?? '').toUpperCase().trim();
}

export function isStaffRole(role?: string | null): boolean {
  return STAFF_ROLES.includes(normalizeRole(role));
}

export function isStudentRole(role?: string | null): boolean {
  return normalizeRole(role) === 'STUDENT';
}

export function getBookingRouteForRole(role?: string | null, isAuth?: boolean): string {
  if (!isAuth) return '/login';
  const normRole = normalizeRole(role);
  if (isStaffRole(normRole)) return '/staff/appointments';
  if (normRole === 'STUDENT') return '/demo-booking';
  return '/login';
}

export function getBookingEntryRoute(info: AuthRoleInfo): string {
  if (info.isLoading) return STUDENT_BOOKING_LOGIN_ROUTE;
  if (!info.isAuthenticated) return STUDENT_BOOKING_LOGIN_ROUTE;
  return getBookingRouteForRole(info.role, info.isAuthenticated);
}

export function getHomeRouteForRole(role?: string | null, isAuth?: boolean): string {
  if (!isAuth) return '/';
  if (isStaffRole(role)) return '/staff/overview';
  return '/dashboard';
}

export function getLoginRouteForRole(role?: string | null): string {
  if (isStaffRole(role)) return '/staff-portal-access';
  return '/login';
}

export function navigateToBooking(router: AppRouterInstance, info: AuthRoleInfo): void {
  const target = getBookingEntryRoute(info);
  router.push(target);
}

export function navigateToHome(router: AppRouterInstance, info: AuthRoleInfo): void {
  const target = getHomeRouteForRole(info.role, info.isAuthenticated);
  router.push(target);
}
