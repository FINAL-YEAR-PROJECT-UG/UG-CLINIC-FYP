import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOTPSMS = async (phone: string, otp: string) => {
  try {
    const message = await client.messages.create({
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
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    
    const message = await client.messages.create({
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
