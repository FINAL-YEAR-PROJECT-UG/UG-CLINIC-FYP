import 'dotenv/config';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface DevEmailRecord {
  id: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  sentAt: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  messageId?: string;
  previewUrl: string;
  extractedCode?: string;
  extractedLink?: string;
}

// In-memory ring buffer of recent emails dispatched during development
const MAX_DEV_EMAILS = 50;
const devEmailStore: DevEmailRecord[] = [];

export function getRecentDevEmails(): DevEmailRecord[] {
  return [...devEmailStore];
}

export function getDevEmailById(id: string): DevEmailRecord | undefined {
  return devEmailStore.find((e) => e.id === id);
}

export function clearRecentDevEmails(): void {
  devEmailStore.length = 0;
}

/**
 * Returns a safe summary of current SMTP settings (passwords masked)
 */
export function getSmtpConfigSummary() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim() || '';
  const configured = Boolean(user && process.env.SMTP_PASS?.trim());

  return {
    host,
    port,
    user: user ? `${user.slice(0, 3)}***@${user.split('@')[1] || ''}` : 'Not set',
    configured,
    fromEmail: process.env.FROM_EMAIL || 'noreply@ugclinic-fyp.edu.gh',
    fromName: process.env.FROM_NAME || 'UG Student Clinic',
  };
}

/**
 * Get or create Nodemailer Transporter dynamically with current env vars
 */
function createTransporter() {
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const rawUser = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  const isGmail = smtpHost.includes('gmail.com');
  const cleanedPass = isGmail && rawPass ? rawPass.replace(/\s+/g, '') : rawPass;

  return nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    pool: isGmail,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: rawUser && cleanedPass ? {
      user: rawUser,
      pass: cleanedPass,
    } : undefined,
  } as any);
}

let transporter = createTransporter();

/**
 * Re-initialize transporter (e.g. after env vars change)
 */
export function reloadTransporter() {
  transporter = createTransporter();
  return transporter;
}

/**
 * Verify transporter connectivity on initialization or when requested
 */
export const verifyTransporterConnection = async (): Promise<{ success: boolean; message: string; error?: any }> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const msg = 'SMTP credentials not set in backend/.env. Running in development/simulated email mode.';
    console.warn(`[EmailService] ${msg}`);
    return { success: false, message: msg };
  }
  try {
    reloadTransporter();
    await transporter.verify();
    const msg = `SMTP server connection (${process.env.SMTP_HOST || 'smtp.gmail.com'}) verified successfully!`;
    console.info(`[EmailService] ${msg}`);
    return { success: true, message: msg };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('[EmailService] SMTP server connection verification failed:', errorMsg);
    if (error?.code === 'EAUTH' || error?.responseCode === 535) {
      console.warn(`
[EmailService Troubleshooting: Gmail 535 BadCredentials]
1. If using Gmail, your regular Google password cannot be used directly.
2. 2-Step Verification must be enabled on your Google Account: https://myaccount.google.com/signinoptions/two-step-verification
3. Generate a 16-character App Password at: https://myaccount.google.com/apppasswords
4. Paste the 16-character App Password in backend/.env:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_full_email@gmail.com
   SMTP_PASS=your-16-character-app-password
`);
    }
    return { success: false, message: errorMsg, error };
  }
};

const DEFAULT_SENDER = `"${process.env.FROM_NAME || 'UG Student Clinic'}" <${process.env.FROM_EMAIL || 'noreply@ugclinic-fyp.edu.gh'}>`;

/**
 * Helper to dispatch email with development store and terminal logging
 */
async function sendMailSafely(mailOptions: nodemailer.SendMailOptions): Promise<{
  success: boolean;
  error?: unknown;
  messageId?: string;
  devEmailId?: string;
  previewUrl?: string;
}> {
  const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const id = crypto.randomBytes(6).toString('hex');
  const recipient = Array.isArray(mailOptions.to) ? mailOptions.to.join(', ') : String(mailOptions.to || '');
  const htmlContent = String(mailOptions.html || mailOptions.text || '');

  // Extract OTP or verification code if present
  const codeMatch = htmlContent.match(/class="(?:otp-code|code-box)"[^>]*>([0-9A-Za-z]{4,8})<\/div>/i) ||
                    htmlContent.match(/\b([0-9]{6})\b/);
  const extractedCode = codeMatch ? codeMatch[1] : undefined;

  // Extract reset or verification URL if present
  const linkMatch = htmlContent.match(/href="([^"]*token=[^"]*)"/i) ||
                    htmlContent.match(/href="(http[^"]+)"/i);
  const extractedLink = linkMatch ? linkMatch[1] : undefined;

  const serverPort = process.env.PORT || 3005;
  const previewUrl = `http://localhost:${serverPort}/api/dev/email/preview/${id}`;

  const record: DevEmailRecord = {
    id,
    to: recipient,
    from: String(mailOptions.from || DEFAULT_SENDER),
    subject: String(mailOptions.subject || 'No Subject'),
    html: htmlContent,
    text: typeof mailOptions.text === 'string' ? mailOptions.text : undefined,
    sentAt: new Date().toISOString(),
    status: isConfigured ? 'sent' : 'simulated',
    previewUrl,
    extractedCode,
    extractedLink,
  };

  devEmailStore.unshift(record);
  if (devEmailStore.length > MAX_DEV_EMAILS) {
    devEmailStore.pop();
  }

  // Visual terminal box for localhost debugging
  const border = '═'.repeat(60);
  console.log(`\n╔${border}╗`);
  console.log(`║ 📧 [EMAIL DISPATCHED] ${record.status.toUpperCase().padEnd(37)} ║`);
  console.log(`╟${border}╢`);
  console.log(`║ To:      ${recipient.slice(0, 48).padEnd(48)} ║`);
  console.log(`║ Subject: ${record.subject.slice(0, 48).padEnd(48)} ║`);
  if (extractedCode) {
    console.log(`║ Code:    ${('🔑 ' + extractedCode).padEnd(48)} ║`);
  }
  if (extractedLink) {
    console.log(`║ Link:    ${extractedLink.slice(0, 48).padEnd(48)} ║`);
  }
  console.log(`║ Preview: ${previewUrl.slice(0, 48).padEnd(48)} ║`);
  console.log(`╚${border}╝\n`);

  if (!isConfigured) {
    console.info(`[EmailService DEV] Simulated dispatch to ${recipient}: "${mailOptions.subject}"`);
    return { success: true, messageId: 'simulated-dev-id', devEmailId: id, previewUrl };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    record.messageId = info.messageId;
    record.status = 'sent';
    console.info(`[EmailService] Real email sent via SMTP to ${recipient} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId, devEmailId: id, previewUrl };
  } catch (error: any) {
    record.status = 'failed';
    record.error = error?.message || String(error);
    console.error(`[EmailService] Failed to send email via SMTP to ${recipient}:`, error?.message || error);
    return { success: false, error, devEmailId: id, previewUrl };
  }
}

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
