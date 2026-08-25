/**
 * Hybrid Cache Layer
 * 
 * Combines in-memory queryCache with persistent IndexedDB cache for optimal performance.
 * - Fast in-memory cache for frequently accessed data
 * - Persistent IndexedDB cache for offline support and cross-session data
 * - Automatic fallback and synchronization between cache layers
 */

import { queryCache } from './queryCache';
import { indexedDBCache } from './indexedDBCache';

interface HybridCacheOptions {
  /** Use in-memory cache (default: true) */
  useMemoryCache?: boolean;
  /** Use persistent IndexedDB cache (default: true) */
  usePersistentCache?: boolean;
  /** TTL for in-memory cache (default: 60s) */
  memoryTTL?: number;
  /** TTL for persistent cache (default: 24h) */
  persistentTTL?: number;
  /** Whether to persist to IndexedDB immediately (default: true) */
  persistImmediately?: boolean;
}

interface CacheResult<T> {
  data: T;
  source: 'memory' | 'persistent' | 'network';
  fromCache: boolean;
}

const DEFAULT_OPTIONS: HybridCacheOptions = {
  useMemoryCache: true,
  usePersistentCache: true,
  memoryTTL: 60_000, // 1 minute
  persistentTTL: 24 * 60 * 60_000, // 24 hours
  persistImmediately: true,
};

/**
 * Get data from hybrid cache with fallback chain
 */
export async function getFromHybridCache<T>(
  key: string,
  options: HybridCacheOptions = {}
): Promise<CacheResult<T> | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Try in-memory cache first (fastest)
  if (opts.useMemoryCache) {
    const memoryData = queryCache.get<T>(key);
    if (memoryData) {
      return { data: memoryData, source: 'memory', fromCache: true };
    }
  }

  // 2. Try persistent cache (good for offline)
  if (opts.usePersistentCache) {
    const persistentData = await indexedDBCache.get<T>(key);
    if (persistentData) {
      // Populate memory cache from persistent cache
      if (opts.useMemoryCache) {
        queryCache.set(key, persistentData, opts.memoryTTL);
      }
      return { data: persistentData, source: 'persistent', fromCache: true };
    }
  }

  return null;
}

/**
 * Set data in hybrid cache
 */
export async function setInHybridCache<T>(
  key: string,
  data: T,
  options: HybridCacheOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Set in memory cache
  if (opts.useMemoryCache) {
    queryCache.set(key, data, opts.memoryTTL);
  }

  // Set in persistent cache
  if (opts.usePersistentCache && opts.persistImmediately) {
    await indexedDBCache.set(key, data, opts.persistentTTL);
  }
}

/**
 * Fetch with hybrid caching - stale-while-revalidate pattern
 */
export async function fetchWithHybridCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: HybridCacheOptions = {}
): Promise<CacheResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Try to get from cache first
  const cached = await getFromHybridCache<T>(key, opts);
  
  if (cached) {
    // Return cached data immediately
    // Trigger background revalidation if data is stale
    if (opts.useMemoryCache && !queryCache.isFresh(key)) {
      // Revalidate in background
      void (async () => {
        try {
          const freshData = await fetchFn();
          await setInHybridCache(key, freshData, opts);
        } catch (error) {
          console.error('[HybridCache] Background revalidation failed:', error);
        }
      })();
    }
    return cached;
  }

  // No cache hit, fetch from network
  try {
    const data = await fetchFn();
    await setInHybridCache(key, data, opts);
    return { data, source: 'network', fromCache: false };
  } catch (error) {
    // If network fails, try to return stale data from persistent cache
    if (opts.usePersistentCache) {
      const staleData = await indexedDBCache.get<T>(key);
      if (staleData) {
        console.warn('[HybridCache] Returning stale data due to network error');
        return { data: staleData, source: 'persistent', fromCache: true };
      }
    }
    throw error;
  }
}

/**
 * Invalidate key in both cache layers
 */
export async function invalidateHybridCache(key: string): Promise<void> {
  queryCache.invalidate(key);
  await indexedDBCache.delete(key);
}

/**
 * Invalidate prefix in both cache layers
 */
export async function invalidateHybridCachePrefix(prefix: string): Promise<void> {
  queryCache.invalidatePrefix(prefix);
  await indexedDBCache.deletePrefix(prefix);
}

/**
 * Clear both cache layers
 */
export async function clearHybridCache(): Promise<void> {
  queryCache.clear();
  await indexedDBCache.clear();
}

/**
 * Get cache statistics
 */
export async function getHybridCacheStats() {
  const memoryStats = {
    size: queryCache['cache']?.size || 0,
    keys: Array.from(queryCache['cache']?.keys() || []),
  };

  const persistentStats = await indexedDBCache.getStats();

  return {
    memory: memoryStats,
    persistent: persistentStats,
  };
}

/**
 * Prefetch multiple keys into hybrid cache
 */
export async function prefetchHybridCache<T>(
  items: Array<{ key: string; fetchFn: () => Promise<T> }>,
  options: HybridCacheOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Filter out items that are already fresh in memory cache
  const itemsToFetch = items.filter(({ key }) => !queryCache.isFresh(key));

  // Fetch remaining items in parallel
  await Promise.allSettled(
    itemsToFetch.map(async ({ key, fetchFn }) => {
      try {
        const data = await fetchFn();
        await setInHybridCache(key, data, opts);
      } catch (error) {
        console.error(`[HybridCache] Prefetch failed for ${key}:`, error);
      }
    })
  );
}