import { redisCache } from '../config/redis';

const CACHE_PREFIX = 'cache:';

export const cacheService = {
  // Cache user profile
  async cacheUserProfile(userId: string, userData: any, ttl: number = 300): Promise<void> {
    await redisCache.setex(
      `${CACHE_PREFIX}user:${userId}`,
      ttl,
      userData
    );
  },

  // Get cached user profile
  async getCachedUserProfile(userId: string): Promise<any> {
    return await redisCache.get(`${CACHE_PREFIX}user:${userId}`);
  },

  // Invalidate user cache
  async invalidateUserCache(userId: string): Promise<void> {
    await redisCache.del(`${CACHE_PREFIX}user:${userId}`);
  },

  // Cache dashboard data
  async cacheDashboardData(userId: string, data: any, ttl: number = 60): Promise<void> {
    await redisCache.setex(
      `${CACHE_PREFIX}dashboard:${userId}`,
      ttl,
      data
    );
  },

  // Get cached dashboard data
  async getCachedDashboardData(userId: string): Promise<any> {
    return await redisCache.get(`${CACHE_PREFIX}dashboard:${userId}`);
  },

  // Cache appointment data
  async cacheAppointment(appointmentId: string, data: any, ttl: number = 300): Promise<void> {
    await redisCache.setex(
      `${CACHE_PREFIX}appointment:${appointmentId}`,
      ttl,
      data
    );
  },

  // Get cached appointment
  async getCachedAppointment(appointmentId: string): Promise<any> {
    return await redisCache.get(`${CACHE_PREFIX}appointment:${appointmentId}`);
  },

  // Invalidate appointment cache
  async invalidateAppointmentCache(appointmentId: string): Promise<void> {
    await redisCache.del(`${CACHE_PREFIX}appointment:${appointmentId}`);
  },

  // Cache doctor availability
  async cacheDoctorAvailability(doctorId: string, status: string, ttl: number = 120): Promise<void> {
    await redisCache.setex(
      `${CACHE_PREFIX}doctor_status:${doctorId}`,
      ttl,
      status
    );
  },

  // Get cached doctor availability
  async getCachedDoctorAvailability(doctorId: string): Promise<string | null> {
    return await redisCache.get<string>(`${CACHE_PREFIX}doctor_status:${doctorId}`);
  },

  // Cache time slots
  async cacheTimeSlots(date: string, slots: any[], ttl: number = 300): Promise<void> {
    await redisCache.setex(
      `${CACHE_PREFIX}slots:${date}`,
      ttl,
      slots
    );
  },

  // Get cached time slots
  async getCachedTimeSlots(date: string): Promise<any[] | null> {
    return await redisCache.get<any[]>(`${CACHE_PREFIX}slots:${date}`);
  },

  // Rate limiting helper
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = `${CACHE_PREFIX}ratelimit:${identifier}`;
    const current = await redisCache.incr(key);
    
    if (current === 1) {
      await redisCache.setex(key, window, 0); // Set expiration on first request
    }
    
    return current <= limit;
  },

  // Clear all cache (use with caution)
  async clearAllCache(): Promise<void> {
    const pattern = `${CACHE_PREFIX}*`;
    // Note: In production, use SCAN instead of KEYS for better performance
    // This is a simplified version
  },
};
