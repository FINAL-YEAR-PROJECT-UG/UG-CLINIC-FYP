import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../utils/jwt';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, studentId, phone, program } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { studentId: studentId || undefined }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }
      if (existingUser.studentId === studentId) {
        return res.status(409).json({
          success: false,
          message: 'Student ID already registered',
        });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        studentId: studentId || null,
        phone: phone || null,
        program: program || null,
        role: 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studentId: true,
        phone: true,
        program: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(payload);

    // Store refresh token in database
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${remainingTime} minutes`,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      // Log failed attempt
      await prisma.failedLoginAttempt.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
        },
      });

      // Check if account should be locked
      if (updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: lockoutUntil,
          },
        });

        return res.status(423).json({
          success: false,
          message: `Account locked due to too many failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes`,
        });
      }

      const remainingAttempts = MAX_FAILED_ATTEMPTS - updatedUser.failedLoginAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${remainingAttempts} attempts remaining`,
      });
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(payload);

    // Store refresh token in database
    const refreshTokenExpiry = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for remember me
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Revoke the refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    if (storedToken.revokedAt) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked',
      });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
      });
    }

    // Verify the token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new token pair
    const newTokens = generateTokenPair(payload);

    // Revoke old refresh token and create new one
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newRefreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: newTokens.refreshToken,
        userId: storedToken.userId,
        expiresAt: newRefreshTokenExpiry,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: newTokens,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during token refresh',
    });
  }
};

export const loginWithOTP = async (req: Request, res: Response) => {
  try {
    const { email, studentId, otp, rememberMe } = req.body;

    // Find user by email and studentId
    const user = await prisma.user.findFirst({
      where: {
        email,
        studentId,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Verify OTP
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: 'password_reset',
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

    // Mark OTP as used
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(payload);

    // Store refresh token in database
    const refreshTokenExpiry = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for remember me
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('Login with OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studentId: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile',
    });
  }
};
