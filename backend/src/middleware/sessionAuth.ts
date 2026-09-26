import { Request, Response, NextFunction } from 'express';
import { SessionUserData } from '../types/session';

export interface SessionAuthRequest extends Request {
  user?: SessionUserData;
}

/**
 * Middleware that validates the active session stored in Postgres.
 * Checks req.session.user and attaches it to req.user for downstream controllers.
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No active session',
    });
  }

  // Populate req.user for backward-compatibility with existing controllers
  (req as any).user = req.session.user;
  next();
};

/**
 * Role-based authorization middleware for session-authenticated requests.
 */
export const authorizeSession = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session?.user || (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

export const authorize = authorizeSession;
export default authenticateSession;
