import { prisma } from '../lib/prisma';
import { sendOTPEmail } from './email.service';
import { sendOTPSMS } from './sms.service';

const OTP_TTL_MS = 10 * 60 * 1000;

export type OtpDeliveryResult = {
  channel: 'sms' | 'email' | 'dev';
  devCode?: string;
  maskedDestination: string;
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function issueStaffLoginOtp(user: {
  id: string;
  email: string;
  phone: string | null;
}): Promise<OtpDeliveryResult> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.oTPCode.updateMany({
    where: {
      userId: user.id,
      type: 'login_2fa',
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  await prisma.oTPCode.create({
    data: {
      code: otp,
      userId: user.id,
      phone: user.phone || user.email,
      type: 'login_2fa',
      expiresAt,
    },
  });

  let delivered = false;
  let channel: OtpDeliveryResult['channel'] = 'dev';
  let maskedDestination = maskEmail(user.email);

  if (user.phone && isSmsConfigured()) {
    const smsResult = await sendOTPSMS(user.phone, otp);
    if (smsResult.success) {
      delivered = true;
      channel = 'sms';
      maskedDestination = maskPhone(user.phone);
    }
  }

  if (!delivered && isEmailConfigured()) {
    const emailResult = await sendOTPEmail(user.email, otp);
    if (emailResult.success) {
      delivered = true;
      channel = 'email';
      maskedDestination = maskEmail(user.email);
    }
  }

  const devCode =
    process.env.NODE_ENV !== 'production' && !delivered ? otp : undefined;

  if (!delivered && !devCode) {
    throw new Error(
      'Unable to deliver verification code. Configure SMTP or Twilio, or run in development mode.'
    );
  }

  console.info(
    `[2FA] Staff login OTP for ${user.email} via ${channel}${devCode ? ` (dev: ${devCode})` : ''}`
  );

  return { channel, devCode, maskedDestination };
}
