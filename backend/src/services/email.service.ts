import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer Transporter
 * Supports environment configurations:
 * - SMTP_HOST (defaults to smtp.gmail.com)
 * - SMTP_PORT (defaults to 587)
 * - SMTP_SECURE (defaults to port === 465)
 * - SMTP_USER
 * - SMTP_PASS
 */
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true' || port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port,
  secure,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

/**
 * Verify transporter connectivity on initialization or when requested
 */
export const verifyTransporterConnection = async (): Promise<boolean> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[EmailService] SMTP credentials not set. Running in development/simulated email mode.');
    return false;
  }
  try {
    await transporter.verify();
    console.info('[EmailService] SMTP server connection verified successfully.');
    return true;
  } catch (error) {
    console.error('[EmailService] SMTP server connection verification failed:', error);
    return false;
  }
};

/**
 * Helper to dispatch email with automatic development fallback logging
 */
async function sendMailSafely(mailOptions: nodemailer.SendMailOptions): Promise<{ success: boolean; error?: unknown; messageId?: string }> {
  const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

  if (!isConfigured) {
    console.info(`[EmailService DEV] Simulated dispatch to ${mailOptions.to}: "${mailOptions.subject}"`);
    return { success: true, messageId: 'simulated-dev-id' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Email sent successfully to ${mailOptions.to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${mailOptions.to}:`, error);
    return { success: false, error };
  }
}

const DEFAULT_SENDER = `"${process.env.FROM_NAME || 'UG Student Clinic'}" <${process.env.FROM_EMAIL || 'noreply@ugclinic-fyp.edu.gh'}>`;

/**
 * 1. Email Verification / Account Welcome Email with Verification Code or Link
 */
export const sendEmailVerificationEmail = async (
  email: string,
  verificationCode: string,
  firstName?: string
) => {
  const nameGreeting = firstName ? `Hello ${firstName},` : 'Hello,';
  const mailOptions = {
    from: DEFAULT_SENDER,
    to: email,
    subject: 'Verify Your Email Address - University of Ghana Student Clinic',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .header h1 { color: #1e3a8a; margin: 0 0 6px 0; font-size: 24px; }
          .badge { display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #1e3a8a; background-color: #e0e7ff; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
          .code-box { font-size: 32px; font-weight: 800; text-align: center; letter-spacing: 8px; color: #1e3a8a; margin: 28px 0; padding: 18px; background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; }
          .warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 24px 0; border-radius: 6px; font-size: 13px; color: #92400e; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">UG Student Clinic</span>
            <h1>Email Verification</h1>
          </div>
          <p>${nameGreeting}</p>
          <p>Thank you for registering on the University of Ghana Student Clinic platform. Please use the verification code below to verify your email address and activate your account:</p>
          <div class="code-box">${verificationCode}</div>
          <div class="warning">
            <p style="margin: 0 0 6px 0;"><strong>Important Security Notice:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>This verification code expires in 15 minutes.</li>
              <li>Never share this code with anyone. Clinic staff will never ask for your verification code.</li>
              <li>If you did not create an account on the UG Clinic portal, please disregard this email.</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Ghana Student Clinic. All rights reserved.<br>Legon Campus, Accra, Ghana</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return sendMailSafely(mailOptions);
};

/**
 * 2. OTP Verification Email (used for 2FA, OTP Login, Security Verifications)
 */
export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: DEFAULT_SENDER,
    to: email,
    subject: 'Your Verification Code - UG Clinic Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .header h1 { color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 700; }
          .otp-code { font-size: 34px; font-weight: 800; text-align: center; letter-spacing: 8px; color: #1e3a8a; margin: 28px 0; padding: 20px; background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; }
          .warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 24px 0; border-radius: 6px; font-size: 13px; color: #92400e; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>UG Student Clinic Security Code</h1>
          </div>
          <p>Hello,</p>
          <p>We received a sign-in or identity verification request for your UG Clinic account. Enter the one-time verification code below to proceed:</p>
          <div class="otp-code">${otp}</div>
          <div class="warning">
            <p style="margin: 0 0 6px 0;"><strong>Security Information:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>This code is valid for <strong>10 minutes</strong>.</li>
              <li>Do not share this code with anyone under any circumstances.</li>
              <li>If you did not initiate this request, someone may be attempting to access your account. Please change your password immediately.</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Ghana Student Clinic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return sendMailSafely(mailOptions);
};

/**
 * 3. Password Reset Email with Tokenized Link
 */
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const resetUrl = `${frontendUrl.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: DEFAULT_SENDER,
    to: email,
    subject: 'Password Reset Request - UG Clinic Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .header h1 { color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 700; }
          .button { display: inline-block; padding: 14px 28px; background-color: #1e3a8a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; text-align: center; }
          .link-box { word-break: break-all; color: #2563eb; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; }
          .warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 24px 0; border-radius: 6px; font-size: 13px; color: #92400e; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <p>Hello,</p>
          <p>We received a request to reset your password for the University of Ghana Student Clinic Portal. Click the button below to choose a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" target="_blank">Reset My Password</a>
          </div>
          <p style="margin-top: 20px; font-size: 14px;">If the button does not work, copy and paste this link into your browser:</p>
          <div class="link-box">${resetUrl}</div>
          <div class="warning">
            <p style="margin: 0 0 6px 0;"><strong>Important:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>This link will expire in <strong>1 hour</strong>.</li>
              <li>If you didn't request a password reset, please ignore this email. Your current password remains secure.</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Ghana Student Clinic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return sendMailSafely(mailOptions);
};

/**
 * 4. Appointment Confirmation Email
 */
export const sendAppointmentConfirmationEmail = async (params: {
  email: string;
  studentName: string;
  serviceName: string;
  doctorName?: string | null;
  date: string;
  timeSlot: string;
  appointmentId: string;
}) => {
  const mailOptions = {
    from: DEFAULT_SENDER,
    to: params.email,
    subject: `Appointment Confirmed: ${params.serviceName} - UG Clinic`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .header h1 { color: #1e3a8a; margin: 0; font-size: 22px; }
          .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748b; font-weight: 600; }
          .detail-val { color: #0f172a; font-weight: 700; text-align: right; }
          .guidance { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 6px; font-size: 13px; color: #1e40af; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <p>Hello <strong>${params.studentName}</strong>,</p>
          <p>Your medical appointment at the University of Ghana Student Clinic has been scheduled successfully.</p>
          <div class="details-card">
            <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-val">${params.serviceName}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-val">${params.date}</span></div>
            <div class="detail-row"><span class="detail-label">Time Slot:</span><span class="detail-val">${params.timeSlot}</span></div>
            ${params.doctorName ? `<div class="detail-row"><span class="detail-label">Attending Doctor:</span><span class="detail-val">Dr. ${params.doctorName}</span></div>` : ''}
            <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-val">Student Clinic, Legon Campus</span></div>
          </div>
          <div class="guidance">
            <strong>Arrival Instructions:</strong>
            <p style="margin: 6px 0 0 0;">Please report to the clinic front desk at least 10 minutes before your scheduled appointment time with your valid University of Ghana Student ID card.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Ghana Student Clinic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return sendMailSafely(mailOptions);
};

/**
 * 5. Appointment Rescheduled Email
 */
export const sendAppointmentRescheduledEmail = async (params: {
  email: string;
  studentName: string;
  serviceName: string;
  newDate: string;
  newTimeSlot: string;
}) => {
  const mailOptions = {
    from: DEFAULT_SENDER,
    to: params.email,
    subject: `Appointment Rescheduled: ${params.serviceName} - UG Clinic`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Rescheduled</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; }
          .header h1 { color: #d97706; margin: 0; font-size: 22px; }
          .details-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Rescheduled</h1>
          </div>
          <p>Hello <strong>${params.studentName}</strong>,</p>
          <p>Your appointment for <strong>${params.serviceName}</strong> has been rescheduled to:</p>
          <div class="details-card">
            <p style="margin: 4px 0;"><strong>New Date:</strong> ${params.newDate}</p>
            <p style="margin: 4px 0;"><strong>New Time Slot:</strong> ${params.newTimeSlot}</p>
            <p style="margin: 4px 0;"><strong>Venue:</strong> UG Student Clinic, Legon</p>
          </div>
          <p>If you have any questions or this time does not work for you, you can reschedule or manage your visit directly on your <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard">Student Dashboard</a>.</p>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Ghana Student Clinic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return sendMailSafely(mailOptions);
};

/**
 * 6. Appointment Cancellation Email
 */
export const sendAppointmentCancellationEmail = async (params: {
  email: string;
  studentName: string;
  serviceName: string;
  date: string;
  reason?: string;
}) => {
  const mailOptions = {
    from: DEFAULT_SENDER,
    to: params.email,
    subject: `Appointment Cancelled: ${params.serviceName} - UG Clinic`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Cancelled</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; }
          .header h1 { color: #dc2626; margin: 0; font-size: 22px; }
          .info-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 18px; margin: 20px 0; color: #991b1b; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Notice: Cancelled</h1>
          </div>
          <p>Hello <strong>${params.studentName}</strong>,</p>
          <p>Your appointment for <strong>${params.serviceName}</strong> scheduled for <strong>${params.date}</strong> has been cancelled.</p>
          ${params.reason ? `<div class="info-box"><strong>Reason:</strong> ${params.reason}</div>` : ''}
          <p>If you still require medical attention, you are welcome to book a new appointment at your convenience or visit the clinic during walk-in hours.</p>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Ghana Student Clinic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return sendMailSafely(mailOptions);
};

export default {
  verifyTransporterConnection,
  sendEmailVerificationEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentRescheduledEmail,
  sendAppointmentCancellationEmail,
};
