export function getDayBounds(dateInput: Date | string): { startOfDay: Date; endOfDay: Date } {
  const d = new Date(dateInput);
  const startOfDay = new Date(d);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

export function normalizeToStartOfDay(dateInput: Date | string): Date {
  return getDayBounds(dateInput).startOfDay;
}

/** Statuses that count as an active booking (one per user per day). */
export const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'] as const;
