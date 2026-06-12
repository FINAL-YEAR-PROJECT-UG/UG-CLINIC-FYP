import twilio, { Twilio } from 'twilio';

let client: Twilio | null = null;

function getTwilioClient(): Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid?.startsWith('AC') || !authToken) {
    return null;
  }

  if (!client) {
    client = twilio(accountSid, authToken);
  }

  return client;
}

export const sendOTPSMS = async (phone: string, otp: string) => {
  const twilioClient = getTwilioClient();

  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio is not configured. Skipping OTP SMS.');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your UG Clinic Portal verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error };
  }
};

export const sendPasswordResetSMS = async (phone: string, resetToken: string) => {
  const twilioClient = getTwilioClient();

  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio is not configured. Skipping password reset SMS.');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    const message = await twilioClient.messages.create({
      body: `UG Clinic Portal: Password reset requested. Use this link to reset your password: ${resetUrl}. This link will expire in 1 hour. If you didn't request this, ignore this message.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error };
  }
};
