import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyAccessToken, TokenPayload } from '../utils/jwt';
import { sendOTPSMS } from '../services/sms.service';
import crypto from 'crypto';

const SESSION_TIMEOUT_MINUTES = Number(process.env.SESSION_TIMEOUT_MINUTES) || 30;
const MAX_CONCURRENT_SESSIONS = Number(process.env.MAX_CONCURRENT_SESSIONS) || 3;

export const staffRegister = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    if (!['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be RECEPTIONIST, DOCTOR, or ADMIN',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
        twoFactorEnabled: true,
        maxSessions: MAX_CONCURRENT_SESSIONS,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating staff account',
    });
  }
};

export const staffLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, ipAddress, userAgent } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff only',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Please try again later',
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      if (user.failedLoginAttempts + 1 >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.twoFactorEnabled && !user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be verified for 2FA',
      });
    }

    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.oTPCode.create({
        data: {
          code: otp,
          userId: user.id,
          phone: user.phone || '',
          type: 'login_2fa',
          expiresAt,
        },
      });

      await sendOTPSMS(user.phone || '', otp);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your phone',
        requires2FA: true,
        data: {
          email: user.email,
        },
      });
    }

    const tokens = await createSession(user, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { email, otp, ipAddress, userAgent } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: 'login_2fa',
        usedAt: null,
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    const tokens = await createSession(user, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during 2FA verification',
    });
  }
};

const createSession = async (user: any, ipAddress: string, userAgent: string) => {
  const activeSessions = await prisma.session.count({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (activeSessions >= user.maxSessions) {
    const oldestSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivity: 'asc' },
    });

    if (oldestSession) {
      await prisma.session.update({
        where: { id: oldestSession.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokenPair(payload);

  return { ...tokens, sessionToken };
};

export const updateSessionActivity = async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers['x-session-token'] as string;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Session token required',
      });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
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

    await prisma.session.update({
      where: { id: session.id },
      data: {
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { id: session.userId },
      data: { lastActivityAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Session activity updated',
    });
  } catch (error) {
    console.error('Update session activity error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating session activity',
    });
  }
};

export const revokeSession = async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.params.sessionId);
    const { userId } = (req as any).user;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    res.status(200).json({
      success: false,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while revoking session',
    });
  }
};

export const revokeAllSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'All sessions revoked successfully',
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while revoking all sessions',
    });
  }
};

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivity: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching active sessions',
    });
  }
};

export const toggle2FA = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { enabled } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (enabled && !user?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number required to enable 2FA',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });

    res.status(200).json({
      success: true,
      message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while toggling 2FA',
    });
  }
};
