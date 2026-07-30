import Redis from 'ioredis';

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Helper functions for common Redis operations
export const redisCache = {
  // Set a value with expiration
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.setex(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
  },

  // Get a value
  async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  // Delete a value
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  },

  // Set with expiration in seconds
  async setex(key: string, seconds: number, value: any): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await redisClient.setex(key, seconds, serializedValue);
  },

  // Get multiple values
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await redisClient.mget(keys);
    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  },

  // Delete multiple keys
  async delMultiple(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  },

  // Flush all data (use with caution)
  async flushAll(): Promise<void> {
    await redisClient.flushall();
  },

  // Get TTL of a key
  async ttl(key: string): Promise<number> {
    return await redisClient.ttl(key);
  },

  // Increment a value
  async incr(key: string): Promise<number> {
    return await redisClient.incr(key);
  },

  // Decrement a value
  async decr(key: string): Promise<number> {
    return await redisClient.decr(key);
  },

  // Set a value only if key doesn't exist
  async setnx(key: string, value: any): Promise<boolean> {
    const serializedValue = JSON.stringify(value);
    const result = await redisClient.setnx(key, serializedValue);
    return result === 1;
  },
};

// Export the Redis client for advanced operations
export default redisClient;
