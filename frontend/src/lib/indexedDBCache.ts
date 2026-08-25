/**
 * IndexedDB Persistent Cache
 * 
 * Provides persistent caching using IndexedDB to complement the in-memory queryCache.
 * Data persists across browser sessions and can be used for offline functionality.
 * Falls back gracefully if IndexedDB is not available.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private dbName = 'ug-clinic-cache';
  private dbVersion = 1;
  private storeName = 'cache';
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize IndexedDB database
   */
  private async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Check if IndexedDB is available
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          console.warn('[IndexedDB] Not available in this environment');
          return false;
        }

        return new Promise<boolean>((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.dbVersion);

          request.onerror = () => {
            console.error('[IndexedDB] Failed to open database:', request.error);
            resolve(false);
          };

          request.onsuccess = () => {
            this.db = request.result;
            this.isInitialized = true;
            console.log('[IndexedDB] Database initialized successfully');
            resolve(true);
          };

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create object store with keyPath
            if (!db.objectStoreNames.contains(this.storeName)) {
              const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
              
              // Create indexes for efficient queries
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('expiry', 'timestamp', { unique: false });
            }
          };
        });
      } catch (error) {
        console.error('[IndexedDB] Initialization failed:', error);
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Get cached data from IndexedDB
   */
  async get<T>(key: string): Promise<T | null> {
    const initialized = await this.init();
    if (!initialized || !this.db) return null;

    try {
      return new Promise<T | null>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as CacheEntry<T> | undefined;
          
          if (!entry) {
            resolve(null);
            return;
          }

          // Check if entry has expired
          const isExpired = Date.now() - entry.timestamp > entry.ttl;
          if (isExpired) {
            // Remove expired entry
            void this.delete(key);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Get failed:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Get error:', error);
      return null;
    }
  }

  /**
   * Store data in IndexedDB with TTL
   */
  async set<T>(key: string, data: T, ttl: number = 60_000): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.db) return false;

    try {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const entry: CacheEntry<T> = {
          key,
          data,
          timestamp: Date.now(),
          ttl,
        };

        const request = store.put(entry);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Set failed:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Set error:', error);
      return false;
    }
  }

  /**
   * Delete specific entry from IndexedDB
   */
  async delete(key: string): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.db) return false;

    try {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Delete failed:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete all entries matching a prefix
   */
  async deletePrefix(prefix: string): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.db) return false;

    try {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        
        const request = index.openCursor();
        let deletedCount = 0;

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entry = cursor.value as CacheEntry<unknown>;
            if (entry.key.startsWith(prefix)) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            resolve(deletedCount > 0);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDB] Delete prefix failed:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Delete prefix error:', error);
      return false;
    }
  }

  /**
   * Clear all entries from IndexedDB
   */
  async clear(): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.db) return false;

    try {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Clear failed:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Clear error:', error);
      return false;
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<number> {
    const initialized = await this.init();
    if (!initialized || !this.db) return 0;

    try {
      return new Promise<number>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        
        const request = index.openCursor();
        let deletedCount = 0;
        const now = Date.now();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entry = cursor.value as CacheEntry<unknown>;
            if (now - entry.timestamp > entry.ttl) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            console.log(`[IndexedDB] Cleaned up ${deletedCount} expired entries`);
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDB] Cleanup failed:', request.error);
          resolve(0);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStats(): Promise<{ count: number; size: number }> {
    const initialized = await this.init();
    if (!initialized || !this.db) return { count: 0, size: 0 };

    try {
      return new Promise<{ count: number; size: number }>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const countRequest = store.count();
        let totalSize = 0;

        countRequest.onsuccess = () => {
          const count = countRequest.result;
          
          // Estimate size by iterating through all entries
          const cursorRequest = store.openCursor();
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) {
              try {
                const entry = cursor.value;
                totalSize += JSON.stringify(entry).length;
              } catch (e) {
                // Skip entries that can't be serialized
              }
              cursor.continue();
            } else {
              resolve({ count, size: totalSize });
            }
          };

          cursorRequest.onerror = () => {
            resolve({ count, size: totalSize });
          };
        };

        countRequest.onerror = () => {
          console.error('[IndexedDB] Get stats failed:', countRequest.error);
          resolve({ count: 0, size: 0 });
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Get stats error:', error);
      return { count: 0, size: 0 };
    }
  }
}

// Singleton instance
export const indexedDBCache = new IndexedDBCache();

// Auto-cleanup expired entries on initialization (every 24 hours)
if (typeof window !== 'undefined') {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Run cleanup on page load
  setTimeout(() => {
    void indexedDBCache.cleanupExpired();
  }, 5000); // Wait 5 seconds after page load
  
  // Schedule periodic cleanup
  setInterval(() => {
    void indexedDBCache.cleanupExpired();
  }, CLEANUP_INTERVAL);
}