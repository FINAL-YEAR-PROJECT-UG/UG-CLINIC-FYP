import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { sendPasswordResetEmail, sendOTPEmail } from '../services/email.service';
import { sendOTPSMS, sendPasswordResetSMS } from '../services/sms.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, method = 'email' } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    if (method === 'email') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      });

      await sendPasswordResetEmail(email, resetToken);

      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } else if (method === 'sms') {
      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: 'No phone number associated with this account',
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      });

      await sendPasswordResetSMS(user.phone, resetToken);

      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent via SMS.',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid method',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    if (resetToken.usedAt) {
      return res.status(400).json({
        success: false,
        message: 'This reset token has already been used',
      });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired',
      });
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password',
    });
  }
};

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email, method = 'email' } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'If an account exists with this email, a verification code has been sent.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: {
        code: otp,
        userId: user.id,
        phone: user.phone || '',
        type: 'password_reset',
        expiresAt,
      },
    });

    if (method === 'email') {
      await sendOTPEmail(email, otp);
    } else if (method === 'sms') {
      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: 'No phone number associated with this account',
        });
      }
      await sendOTPSMS(user.phone, otp);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending the verification code',
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or OTP',
      });
    }

    const otpRecord = await prisma.otpCode.findFirst({
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

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: {
        attempts: { increment: 1 },
      },
    });

    if (otpRecord.attempts + 1 >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the OTP',
    });
  }
};

export const resetPasswordWithOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email',
      });
    }

    const otpRecord = await prisma.otpCode.findFirst({
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

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password with OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password',
    });
  }
};

export const setSecurityQuestions = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one security question',
      });
    }

    await prisma.securityQuestion.deleteMany({
      where: { userId },
    });

    for (const question of questions) {
      await prisma.securityQuestion.create({
        data: {
          userId,
          question: question.question,
          answer: question.answer,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Security questions set successfully',
    });
  } catch (error) {
    console.error('Set security questions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while setting security questions',
    });
  }
};

export const verifySecurityQuestions = async (req: Request, res: Response) => {
  try {
    const { email, answers } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { securityQuestions: true },
    });

    if (!user || user.securityQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No security questions found for this account',
      });
    }

    let correctAnswers = 0;
    for (const answer of answers) {
      const question = user.securityQuestions.find((q) => q.question === answer.question);
      if (question && question.answer === answer.answer) {
        correctAnswers++;
      }
    }

    if (correctAnswers === user.securityQuestions.length) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Security questions verified successfully',
        data: { resetToken },
      });
    }

    res.status(400).json({
      success: false,
      message: 'Incorrect answers to security questions',
    });
  } catch (error) {
    console.error('Verify security questions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying security questions',
    });
  }
};

export const generateBackupCodes = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    await prisma.backupRecoveryCode.deleteMany({
      where: { userId, usedAt: null },
    });

    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      await prisma.backupRecoveryCode.create({
        data: {
          code,
          userId,
        },
      });
      codes.push(code);
    }

    res.status(200).json({
      success: true,
      message: 'Backup recovery codes generated successfully',
      data: { codes },
    });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating backup codes',
    });
  }
};

export const verifyBackupCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or backup code',
      });
    }

    const backupCode = await prisma.backupRecoveryCode.findFirst({
      where: {
        userId: user.id,
        code: code.toUpperCase(),
        usedAt: null,
      },
    });

    if (!backupCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used backup code',
      });
    }

    await prisma.backupRecoveryCode.update({
      where: { id: backupCode.id },
      data: { usedAt: new Date() },
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Backup code verified successfully',
      data: { resetToken },
    });
  } catch (error) {
    console.error('Verify backup code error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying backup code',
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Your active sessions have been preserved.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while changing your password',
    });
  }
};
