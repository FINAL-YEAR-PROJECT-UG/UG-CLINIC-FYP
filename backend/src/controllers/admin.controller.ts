import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { cleanupExpiredSessions } from '../jobs/sessionCleanup';

/**
 * Admin controller for system maintenance operations
 */

export const triggerSessionCleanup = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if (!role || role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    const result = await cleanupExpiredSessions();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Session cleanup completed successfully',
        data: {
          deletedCount: result.deletedCount,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Session cleanup failed',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Trigger session cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during session cleanup',
    });
  }
};

export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if (!role || role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    // Basic system health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
    };

    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching system health',
    });
  }
};
