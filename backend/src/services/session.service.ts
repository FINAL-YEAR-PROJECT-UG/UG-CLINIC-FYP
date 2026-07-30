import { redisCache } from '../config/redis';

interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 30 * 60; // 30 minutes

export const sessionService = {
  // Create a new session
  async createSession(sessionId: string, userData: SessionData): Promise<void> {
    const sessionData: SessionData = {
      ...userData,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    await redisCache.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      sessionData
    );
  },

  // Get session data
  async getSession(sessionId: string): Promise<SessionData | null> {
    return await redisCache.get<SessionData>(`${SESSION_PREFIX}${sessionId}`);
  },

  // Update session activity (refreshes TTL)
  async updateActivity(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (sessionData) {
      sessionData.lastActivity = Date.now();
      await redisCache.setex(
        `${SESSION_PREFIX}${sessionId}`,
        SESSION_TTL,
        sessionData
      );
    }
  },

  // Delete session (logout)
  async deleteSession(sessionId: string): Promise<void> {
    await redisCache.del(`${SESSION_PREFIX}${sessionId}`);
  },

  // Delete all user sessions
  async deleteUserSessions(userId: string): Promise<void> {
    // This would require scanning keys, which is not ideal for production
    // For production, consider maintaining a user->sessions mapping
    const pattern = `${SESSION_PREFIX}*`;
    // Note: In production, use a more efficient approach
    // This is a simplified version
  },

  // Check if session exists
  async sessionExists(sessionId: string): Promise<boolean> {
    return await redisCache.exists(`${SESSION_PREFIX}${sessionId}`);
  },

  // Get session TTL
  async getSessionTTL(sessionId: string): Promise<number> {
    return await redisCache.ttl(`${SESSION_PREFIX}${sessionId}`);
  },
};
