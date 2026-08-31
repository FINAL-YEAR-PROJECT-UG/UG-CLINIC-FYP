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

export function isDoctorRole(role?: string | null): boolean {
  return normalizeRole(role) === 'DOCTOR';
}

export function isAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === 'ADMIN';
}

export function isReceptionistRole(role?: string | null): boolean {
  return normalizeRole(role) === 'RECEPTIONIST';
}

/** Admin and receptionist clinic-management privileges (not doctors). */
export function canManageClinicOperations(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'ADMIN' || r === 'RECEPTIONIST';
}

export function canAccessStudentRecords(role?: string | null): boolean {
  return canManageClinicOperations(role);
}

export function canManageResources(role?: string | null): boolean {
  return canManageClinicOperations(role);
}

export function getStaffPortalLabel(role?: string | null): string {
  if (isDoctorRole(role)) return 'DOCTOR PORTAL';
  if (isAdminRole(role)) return 'ADMINISTRATOR PORTAL';
  if (isReceptionistRole(role)) return 'RECEPTIONIST PORTAL';
  return 'STAFF PORTAL';
}

export function getStaffRoleLabel(role?: string | null): string {
  if (isDoctorRole(role)) return 'Doctor';
  if (isAdminRole(role)) return 'Administrator';
  if (isReceptionistRole(role)) return 'Receptionist';
  if (isStaffRole(role)) return 'Staff';
  return 'Staff';
}

export function getBookingRouteForRole(role?: string | null, isAuth?: boolean): string {
  if (!isAuth) return '/login';
  const normRole = normalizeRole(role);
  if (isStaffRole(normRole)) return '/staff/appointments';
  return '/demo-booking';
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

export function formatTimeLabel(time?: string | null): string {
  if (!time) return '';
  const trimmed = time.trim();
  const ampmMatch = trimmed.match(/(am|pm)/i);

  if (ampmMatch) {
    const ampm = ampmMatch[1].toUpperCase();
    const timeOnly = trimmed.replace(/(am|pm)/i, '').trim();
    const [hoursStr, minutesStr] = timeOnly.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || '00';
    if (isNaN(hours)) return time;
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  const [hoursStr, minutesStr] = trimmed.split(':');
  const hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) return time;
  const minutes = minutesStr || '00';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/(am|pm)/i);
  const ampm = ampmMatch ? ampmMatch[1].toUpperCase() : null;
  const timeOnly = trimmed.replace(/(am|pm)/i, '').trim();
  const [hoursStr, minutesStr] = timeOnly.split(':');
  let hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function getAppointmentTimestamp(dateIso: string, timeSlot: string): number {
  const d = new Date(dateIso);
  if (isNaN(d.getTime())) return 0;
  const minutes = parseTimeToMinutes(timeSlot);
  const dateBase = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return dateBase + minutes * 60 * 1000;
}

