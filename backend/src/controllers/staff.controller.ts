import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyAccessToken, TokenPayload } from '../utils/jwt';
import { issueStaffLoginOtp } from '../services/otp.service';
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
        message: 'Invalid staff role. Must be RECEPTIONIST, DOCTOR, or ADMIN',
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
        phoneVerified: Boolean(phone),
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid staff email or password',
      });
    }

    if (!['RECEPTIONIST', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Receptionist and Admin credentials are authorized to sign in.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your staff account is inactive. Please contact the administrator',
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'Your account is temporarily locked. Please try again later',
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const newCount = user.failedLoginAttempts + 1;
      const updates: any = {
        failedLoginAttempts: newCount,
      };
      if (newCount >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });

      return res.status(401).json({
        success: false,
        message: 'Invalid staff email or password',
      });
    }

    if (user.twoFactorEnabled) {
      try {
        const delivery = await issueStaffLoginOtp({
          id: user.id,
          email: user.email,
          phone: user.phone,
        });

        return res.status(200).json({
          success: true,
          message:
            delivery.channel === 'sms'
              ? `A verification code has been sent to ${delivery.maskedDestination}`
              : delivery.channel === 'email'
                ? `A verification code has been sent to ${delivery.maskedDestination}`
                : 'Enter the verification code shown below (development mode)',
          requires2FA: true,
          data: {
            email: user.email,
            deliveryChannel: delivery.channel,
            maskedDestination: delivery.maskedDestination,
            ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
          },
        });
      } catch (deliveryError: any) {
        console.error('Staff 2FA delivery error:', deliveryError);
        return res.status(503).json({
          success: false,
          message:
            deliveryError?.message ||
            'Could not send verification code. Please contact an administrator.',
        });
      }
    }

    const tokens = await createSession(user, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Staff login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          studentId: user.studentId,
          phone: user.phone,
          program: user.program,
          isActive: user.isActive,
        },
        tokens,
      },
    });
  } catch (error: any) {
    console.error('Staff login error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    const payload: any = {
      success: false,
      message: 'An error occurred during login',
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.details = error?.message || String(error);
      payload.code = error?.code;
    }
    res.status(500).json(payload);
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { email, otp, token, code, ipAddress, userAgent } = req.body;
    const otpValue = String(otp || token || code || '').trim();

    if (!email || !otpValue) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(404).json({
        success: false,
        message: 'Staff account not found',
      });
    }

    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        type: 'login_2fa',
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code. Please sign in again.',
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please sign in again.',
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please sign in again.',
      });
    }

    if (otpRecord.code !== otpValue) {
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    const tokens = await createSession(user, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Staff login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          studentId: user.studentId,
          phone: user.phone,
          program: user.program,
          isActive: user.isActive,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
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

export const resendStaff2FA = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(404).json({
        success: false,
        message: 'Staff account not found',
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled for this account',
      });
    }

    const delivery = await issueStaffLoginOtp({
      id: user.id,
      email: user.email,
      phone: user.phone,
    });

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent',
      data: {
        deliveryChannel: delivery.channel,
        maskedDestination: delivery.maskedDestination,
        ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
      },
    });
  } catch (error) {
    console.error('Resend staff 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not resend verification code',
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
      success: true,
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
      data: sessions.map((session: any) => ({
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

// ---------- Staff-side student record management ----------

export const listStudents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const { query = '', page = '1', pageSize = '25' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));

    const where: any = { role: 'STUDENT' };
    if (query) {
      where.OR = [
        { firstName: { contains: String(query), mode: 'insensitive' } },
        { lastName: { contains: String(query), mode: 'insensitive' } },
        { email: { contains: String(query), mode: 'insensitive' } },
        { studentId: { contains: String(query), mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (pageNum - 1) * size, take: size, orderBy: { createdAt: 'desc' }, select: { id: true, firstName: true, lastName: true, email: true, studentId: true, program: true, phone: true, createdAt: true } }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({ success: true, data: { students, total, page: pageNum, pageSize: size } });
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while listing students' });
  }
};

export const getStudent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const student = await prisma.user.findUnique({ where: { id }, select: { id: true, firstName: true, lastName: true, email: true, studentId: true, program: true, phone: true, gender: true, createdAt: true, updatedAt: true } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, data: { student } });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching student' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const { firstName, lastName, studentId, dateOfBirth, phone, program, gender, isActive } = req.body || {};

    const student = await prisma.user.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Prevent modification of immutable fields
    if (firstName !== undefined && firstName !== student.firstName) {
      return res.status(400).json({ success: false, message: 'First name cannot be modified after account creation' });
    }
    if (lastName !== undefined && lastName !== student.lastName) {
      return res.status(400).json({ success: false, message: 'Last name cannot be modified after account creation' });
    }
    if (studentId !== undefined && studentId !== student.studentId) {
      return res.status(400).json({ success: false, message: 'Student ID cannot be modified after account creation' });
    }
    if (dateOfBirth !== undefined && dateOfBirth !== student.dateOfBirth?.toISOString()) {
      return res.status(400).json({ success: false, message: 'Date of birth cannot be modified after account creation' });
    }

    const data: any = {};
    if (phone !== undefined) data.phone = String(phone);
    if (program !== undefined) data.program = String(program);
    if (gender !== undefined) data.gender = String(gender);
    if (isActive !== undefined) data.isActive = !!isActive;

    const updated = await prisma.user.update({ where: { id }, data });

    res.status(200).json({ success: true, message: 'Student updated', data: { student: updated } });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating student' });
  }
};

export const listDoctors = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        doctorStatus: true,
        _count: {
          select: {
            doctorAppointments: {
              where: {
                status: 'CONFIRMED',
              },
            },
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    res.status(200).json({ success: true, data: { doctors } });
  } catch (error) {
    console.error('List doctors error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching doctors' });
  }
};

export const updateDoctorStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const { doctorId, status } = req.body || {};
    const targetDoctorId = doctorId || user.userId;

    if (!status || !['AVAILABLE', 'BUSY', 'ON_LEAVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor status. Must be AVAILABLE, BUSY, or ON_LEAVE' });
    }

    const updated = await prisma.user.update({
      where: { id: targetDoctorId },
      data: { doctorStatus: status as any },
      select: { id: true, firstName: true, lastName: true, doctorStatus: true },
    });

    res.status(200).json({ success: true, message: 'Doctor status updated', data: { doctor: updated } });
  } catch (error) {
    console.error('Update doctor status error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating doctor status' });
  }
};

export const getStudentHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          include: {
            service: { select: { id: true, name: true, category: true } },
            doctor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, data: { student } });
  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching student history' });
  }
};

export const autoAssignDoctors = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    // Find unassigned appointments
    const unassigned = await prisma.appointment.findMany({
      where: {
        doctorId: null,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (unassigned.length === 0) {
      return res.status(200).json({ success: true, message: 'No unassigned appointments found.', data: { assignedCount: 0 } });
    }

    // Find available doctors
    const availableDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true, doctorStatus: 'AVAILABLE' },
      include: {
        _count: {
          select: { doctorAppointments: { where: { status: 'CONFIRMED' } } },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    if (availableDoctors.length === 0) {
      return res.status(400).json({ success: false, message: 'No available doctors currently on status FREE/AVAILABLE.' });
    }

    let count = 0;
    for (let i = 0; i < unassigned.length; i++) {
      const targetDoctor = availableDoctors[i % availableDoctors.length];
      await prisma.appointment.update({
        where: { id: unassigned[i].id },
        data: { doctorId: targetDoctor.id, status: 'CONFIRMED' },
      });
      count++;
    }

    res.status(200).json({
      success: true,
      message: `Automated assignment complete: Assigned ${count} appointment(s) to active doctors.`,
      data: { assignedCount: count },
    });
  } catch (error) {
    console.error('Auto assign doctors error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during automated doctor assignment' });
  }
};

export const autoConfirmPending = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const updated = await prisma.appointment.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    res.status(200).json({
      success: true,
      message: `Batch auto-confirmation complete: Confirmed ${updated.count} pending booking(s).`,
      data: { confirmedCount: updated.count },
    });
  } catch (error) {
    console.error('Auto confirm pending error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during batch confirmation' });
  }
};



