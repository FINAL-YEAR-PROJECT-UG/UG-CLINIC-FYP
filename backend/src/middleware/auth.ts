import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check session first
    if (req.session && req.session.user) {
      req.user = {
        userId: req.session.user.userId || req.session.user.id,
        email: req.session.user.email,
        role: req.session.user.role,
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No active session',
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};
