import cron from 'node-cron';
import { Pool } from 'pg';

/**
 * Session Cleanup Job
 * Runs daily at 2:00 AM to clean up expired sessions from PostgreSQL
 * Prevents session table bloat and maintains database performance
 */

const SESSION_CLEANUP_CRON = '0 2 * * *'; // Run daily at 2:00 AM

export const startSessionCleanupJob = () => {
  const cronJob = cron.schedule(
    SESSION_CLEANUP_CRON,
    async () => {
      try {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });

        console.log('Starting session cleanup job...');

        // Delete expired sessions from the session table
        const result = await pool.query(
          `DELETE FROM session
           WHERE expire < NOW() - INTERVAL '1 day'`
        );

        console.log(`Session cleanup completed: ${result.rowCount} expired sessions removed`);

        await pool.end();
      } catch (error) {
        console.error('Session cleanup job failed:', error);
      }
    },
    {
      timezone: 'Africa/Accra', // University of Ghana timezone
    }
  );

  console.log('Session cleanup job scheduled (daily at 2:00 AM Ghana time)');

  return cronJob;
};

/**
 * Manual cleanup function for immediate session cleanup
 * Can be called via admin endpoint or during deployment
 */
export const cleanupExpiredSessions = async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    console.log('Starting manual session cleanup...');

    const result = await pool.query(
      `DELETE FROM session
       WHERE expire < NOW() - INTERVAL '1 day'`
    );

    console.log(`Manual session cleanup completed: ${result.rowCount} expired sessions removed`);

    await pool.end();

    return { success: true, deletedCount: result.rowCount };
  } catch (error) {
    console.error('Manual session cleanup failed:', error);
    return { success: false, error: String(error) };
  }
};

export default startSessionCleanupJob;
