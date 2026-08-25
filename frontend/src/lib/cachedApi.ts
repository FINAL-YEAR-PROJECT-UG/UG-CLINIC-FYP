/**
 * UG Clinic Portal — Cached Staff API Layer
 *
 * Wraps the raw staffApi calls with:
 *  - Client-side in-memory cache (queryCache)
 *  - Stale-while-revalidate (instant UI, background refresh)
 *  - Automatic cache invalidation after mutations
 *  - Request deduplication (concurrent callers share one in-flight request)
 */

import { appointmentApi } from "./appointmentApi";
import {
  getAllStaffAppointments,
  getAllStaffResources,
  getAllStudents,
  getDoctors,
  getStaffDashboard,
  getTimeSlots,
  type StaffAppointment,
  type StaffAppointmentListParams,
  type StaffDashboardData,
  type StaffDoctor,
  type StaffResource,
  type StaffResourceListParams,
  type StaffStudent,
  type StaffStudentListParams,
  type StaffTimeSlot,
} from "./staffApi";
import { queryCache, CACHE_TTL, CACHE_KEYS } from "./queryCache";

// ── In-flight request deduplication ──────────────────────────────────────────
const _inflight = new Map<string, Promise<unknown>>();

async function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (_inflight.has(key)) {
    return _inflight.get(key) as Promise<T>;
  }
  const promise = fn().finally(() => _inflight.delete(key));
  _inflight.set(key, promise);
  return promise;
}

function buildParamsKey(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "" && value !== "all")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

interface CachedListResult<T> {
  data: T;
  total: number;
  page: number;
  pageSize: number;
  fromCache: boolean;
}

async function cachedListFetch<T>(opts: {
  key: string;
  force?: boolean;
  ttl: number;
  onRevalidate?: (data: T) => void;
  fetch: () => Promise<{ items: T; total: number; page: number; pageSize: number }>;
}): Promise<CachedListResult<T>> {
  const force = opts.force ?? false;
  const stale = queryCache.getStale<CachedListResult<T>>(opts.key);
  const fresh = !force && queryCache.isFresh(opts.key);

  if (fresh && stale) {
    return { ...stale, fromCache: true };
  }

  if (stale && !force) {
    void dedupe(opts.key, async () => {
      const result = await opts.fetch();
      const payload: CachedListResult<T> = {
        data: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        fromCache: false,
      };
      queryCache.set(opts.key, payload, opts.ttl);
      opts.onRevalidate?.(result.items);
    });
    return { ...stale, fromCache: true };
  }

  const result = await dedupe(opts.key, opts.fetch);
  const payload: CachedListResult<T> = {
    data: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    fromCache: false,
  };
  queryCache.set(opts.key, payload, opts.ttl);
  return payload;
}

// ── Appointments ──────────────────────────────────────────────────────────────

export type AppointmentListResult = CachedListResult<StaffAppointment[]>;

/**
 * Fetch paginated staff appointments with caching.
 * Returns stale data immediately (if cached) and triggers a background revalidation.
 */
export async function getCachedAppointments(
  params: StaffAppointmentListParams = {},
  opts?: {
    force?: boolean;
    onRevalidate?: (data: StaffAppointment[]) => void;
  },
): Promise<AppointmentListResult> {
  const paramsKey = buildParamsKey(params as Record<string, unknown>);
  const key = CACHE_KEYS.appointments(paramsKey);

  return cachedListFetch({
    key,
    force: opts?.force,
    ttl: CACHE_TTL.APPOINTMENTS,
    onRevalidate: opts?.onRevalidate,
    fetch: () => getAllStaffAppointments(params),
  });
}

/** Invalidate appointments cache (call after any mutation) */
export function invalidateAppointmentsCache(): void {
  queryCache.invalidatePrefix("appointments:");
}

// ── Doctors ──────────────────────────────────────────────────────────────────

export interface DoctorListResult {
  doctors: StaffDoctor[];
  fromCache: boolean;
}

export async function getCachedDoctors(opts?: {
  force?: boolean;
  onRevalidate?: (data: StaffDoctor[]) => void;
}): Promise<DoctorListResult> {
  const key = CACHE_KEYS.doctors();
  const force = opts?.force ?? false;

  const stale = queryCache.getStale<StaffDoctor[]>(key);
  const fresh = !force && queryCache.isFresh(key);

  if (fresh && stale) {
    return { doctors: stale, fromCache: true };
  }

  if (stale && !force) {
    void dedupe(key, async () => {
      const data = await getDoctors();
      const list = Array.isArray(data.doctors) ? data.doctors : [];
      queryCache.set(key, list, CACHE_TTL.DOCTORS);
      opts?.onRevalidate?.(list);
    });
    return { doctors: stale, fromCache: true };
  }

  const data = await dedupe(key, () => getDoctors());
  const list = Array.isArray(data.doctors) ? data.doctors : [];
  queryCache.set(key, list, CACHE_TTL.DOCTORS);
  return { doctors: list, fromCache: false };
}

/** Invalidate doctors cache */
export function invalidateDoctorsCache(): void {
  queryCache.invalidate(CACHE_KEYS.doctors());
}

// ── Time Slots ────────────────────────────────────────────────────────────────

export interface TimeSlotsResult {
  timeSlots: StaffTimeSlot[];
  fromCache: boolean;
}

export async function getCachedTimeSlots(
  date: string,
  opts?: {
    force?: boolean;
    onRevalidate?: (data: StaffTimeSlot[]) => void;
  },
): Promise<TimeSlotsResult> {
  const key = CACHE_KEYS.timeSlots(date);
  const force = opts?.force ?? false;

  const stale = queryCache.getStale<StaffTimeSlot[]>(key);
  const fresh = !force && queryCache.isFresh(key);

  if (fresh && stale) {
    return { timeSlots: stale, fromCache: true };
  }

  if (stale && !force) {
    void dedupe(key, async () => {
      const data = await getTimeSlots(undefined, date);
      const list = Array.isArray(data.timeSlots) ? data.timeSlots : [];
      queryCache.set(key, list, CACHE_TTL.TIME_SLOTS);
      opts?.onRevalidate?.(list);
    });
    return { timeSlots: stale, fromCache: true };
  }

  const data = await dedupe(key, () => getTimeSlots(undefined, date));
  const list = Array.isArray(data.timeSlots) ? data.timeSlots : [];
  queryCache.set(key, list, CACHE_TTL.TIME_SLOTS);
  return { timeSlots: list, fromCache: false };
}

/** Invalidate time slots for a specific date (or all slots) */
export function invalidateTimeSlotsCache(date?: string): void {
  if (date) {
    queryCache.invalidate(CACHE_KEYS.timeSlots(date));
  } else {
    queryCache.invalidatePrefix("timeslots:");
  }
}

// ── Students ──────────────────────────────────────────────────────────────────

export type StudentListResult = CachedListResult<StaffStudent[]>;

export async function getCachedStudents(
  params: StaffStudentListParams = {},
  opts?: {
    force?: boolean;
    onRevalidate?: (data: StaffStudent[]) => void;
  },
): Promise<StudentListResult> {
  const page = params.page ?? 1;
  const query = params.query ?? "";
  const key = CACHE_KEYS.students(page, query);

  return cachedListFetch({
    key,
    force: opts?.force,
    ttl: CACHE_TTL.STUDENTS,
    onRevalidate: opts?.onRevalidate,
    fetch: () => getAllStudents(params),
  });
}

export function invalidateStudentsCache(): void {
  queryCache.invalidatePrefix("students:");
}

// ── Resources ─────────────────────────────────────────────────────────────────

export interface ResourceListResult {
  resources: StaffResource[];
  fromCache: boolean;
}

export async function getCachedResources(
  params: StaffResourceListParams = {},
  opts?: {
    force?: boolean;
    onRevalidate?: (data: StaffResource[]) => void;
  },
): Promise<ResourceListResult> {
  const paramsKey = buildParamsKey(params as Record<string, unknown>);
  const key = CACHE_KEYS.resources(paramsKey);
  const force = opts?.force ?? false;

  const stale = queryCache.getStale<StaffResource[]>(key);
  const fresh = !force && queryCache.isFresh(key);

  if (fresh && stale) {
    return { resources: stale, fromCache: true };
  }

  if (stale && !force) {
    void dedupe(key, async () => {
      const data = await getAllStaffResources(params);
      const list = Array.isArray(data.resources) ? data.resources : [];
      queryCache.set(key, list, CACHE_TTL.RESOURCES);
      opts?.onRevalidate?.(list);
    });
    return { resources: stale, fromCache: true };
  }

  const data = await dedupe(key, () => getAllStaffResources(params));
  const list = Array.isArray(data.resources) ? data.resources : [];
  queryCache.set(key, list, CACHE_TTL.RESOURCES);
  return { resources: list, fromCache: false };
}

export function invalidateResourcesCache(): void {
  queryCache.invalidatePrefix("resources:");
}

// ── Staff Dashboard ───────────────────────────────────────────────────────────

export interface DashboardResult {
  dashboard: StaffDashboardData;
  fromCache: boolean;
}

export async function getCachedStaffDashboard(opts?: {
  force?: boolean;
  onRevalidate?: (data: StaffDashboardData) => void;
}): Promise<DashboardResult> {
  const key = CACHE_KEYS.staffDashboard();
  const force = opts?.force ?? false;

  const stale = queryCache.getStale<StaffDashboardData>(key);
  const fresh = !force && queryCache.isFresh(key);

  if (fresh && stale) {
    return { dashboard: stale, fromCache: true };
  }

  if (stale && !force) {
    void dedupe(key, async () => {
      const data = await getStaffDashboard();
      queryCache.set(key, data, CACHE_TTL.APPOINTMENTS);
      opts?.onRevalidate?.(data);
    });
    return { dashboard: stale, fromCache: true };
  }

  const data = await dedupe(key, () => getStaffDashboard());
  queryCache.set(key, data, CACHE_TTL.APPOINTMENTS);
  return { dashboard: data, fromCache: false };
}

export function invalidateStaffDashboardCache(): void {
  queryCache.invalidate(CACHE_KEYS.staffDashboard());
}

// ── Student Appointments ──────────────────────────────────────────────────────

export interface MyAppointmentsResult {
  appointments: Awaited<ReturnType<typeof appointmentApi.getMyAppointments>>;
  fromCache: boolean;
}

export async function getCachedMyAppointments(opts?: {
  force?: boolean;
  onRevalidate?: (data: MyAppointmentsResult["appointments"]) => void;
}): Promise<MyAppointmentsResult> {
  const key = CACHE_KEYS.myAppointments();
  const force = opts?.force ?? false;

  const stale = queryCache.getStale<MyAppointmentsResult["appointments"]>(key);
  const fresh = !force && queryCache.isFresh(key);

  if (fresh && stale) {
    return { appointments: stale, fromCache: true };
  }

  if (stale && !force) {
    void dedupe(key, async () => {
      const data = await appointmentApi.getMyAppointments();
      queryCache.set(key, data, CACHE_TTL.APPOINTMENTS);
      opts?.onRevalidate?.(data);
    });
    return { appointments: stale, fromCache: true };
  }

  const data = await dedupe(key, () => appointmentApi.getMyAppointments());
  queryCache.set(key, data, CACHE_TTL.APPOINTMENTS);
  return { appointments: data, fromCache: false };
}

export function invalidateMyAppointmentsCache(): void {
  queryCache.invalidate(CACHE_KEYS.myAppointments());
}

/** Invalidate all staff-related caches after a mutation */
export function invalidateAllStaffCaches(): void {
  invalidateAppointmentsCache();
  invalidateDoctorsCache();
  invalidateTimeSlotsCache();
  invalidateStudentsCache();
  invalidateResourcesCache();
  invalidateStaffDashboardCache();
}
