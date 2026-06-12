import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';

const prisma = new PrismaClient();

export interface StaffRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateStaff = async (req: StaffRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Session token is required',
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.revokedAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked session',
      });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      return res.status(401).json({
        success: false,
        message: 'Session expired',
      });
    }

    if (session.userId !== payload.userId) {
      return res.status(401).json({
        success: false,
        message: 'Session does not match user',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    if (!['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff only',
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: StaffRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

export const requireAdmin = authorizeRoles('ADMIN');
export const requireDoctor = authorizeRoles('DOCTOR', 'ADMIN');
export const requireReceptionist = authorizeRoles('RECEPTIONIST', 'DOCTOR', 'ADMIN');
