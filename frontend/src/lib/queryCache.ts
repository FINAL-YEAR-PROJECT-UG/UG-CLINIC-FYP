/**
 * UG Clinic Portal — Lightweight Client-Side Query Cache
 *
 * Provides in-memory caching with TTL for API responses to prevent
 * redundant network calls. Mimics SWR stale-while-revalidate strategy.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached data if still fresh, or undefined if stale/missing.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }

  /**
   * Get stale data even if expired (stale-while-revalidate pattern).
   * Useful for showing old data instantly while fetching in background.
   */
  getStale<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    return entry?.data;
  }

  /**
   * Store data in cache with a TTL.
   * @param key   Cache key (e.g. "appointments", "doctors", "timeslots:2024-08-21")
   * @param data  The data to cache
   * @param ttl   Time-to-live in milliseconds (default: 60s)
   */
  set<T>(key: string, data: T, ttl = 60_000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * Invalidate specific keys (e.g. after a mutation).
   */
  invalidate(...keys: string[]): void {
    keys.forEach((k) => this.cache.delete(k));
  }

  /**
   * Invalidate all keys that match a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  /**
   * Clear everything.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if a key is still fresh.
   */
  isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp <= entry.ttl;
  }

  /**
   * Get cache statistics.
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance shared across the entire app session
export const queryCache = new QueryCache();

// Cache TTL presets
export const CACHE_TTL = {
  /** Appointments list — 30 seconds (changes frequently) */
  APPOINTMENTS: 30_000,
  /** Doctor list — 2 minutes (changes less frequently) */
  DOCTORS: 120_000,
  /** Time slots for a given date — 45 seconds */
  TIME_SLOTS: 45_000,
  /** Student list — 3 minutes */
  STUDENTS: 180_000,
  /** Resources — 5 minutes */
  RESOURCES: 300_000,
  /** Static reference data — 10 minutes */
  STATIC: 600_000,
} as const;

// Cache key builders
export const CACHE_KEYS = {
  appointments: (paramsKey = "default") => `appointments:${paramsKey}`,
  doctors: () => "doctors",
  timeSlots: (date: string) => `timeslots:${date}`,
  students: (page: number, query = "") => `students:${page}:${query}`,
  resources: (paramsKey = "default") => `resources:${paramsKey}`,
  myAppointments: () => "my-appointments",
  staffDashboard: () => "staff-dashboard",
} as const;
