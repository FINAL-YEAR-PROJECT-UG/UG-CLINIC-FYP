import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

async function diagnoseStaffAccount(email: string) {
  try {
    console.log(`🔍 Diagnosing staff account: ${email}`);
    console.log('═'.repeat(80));

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ No account found with email: ${email}`);
      return;
    }

    console.log(`✅ Account found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   2FA Enabled: ${user.twoFactorEnabled ? 'Yes' : 'No'}`);
    console.log(`   Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
    console.log(`   Failed Login Attempts: ${user.failedLoginAttempts}`);
    console.log(`   Locked Until: ${user.lockedUntil ? user.lockedUntil.toLocaleString() : 'Not locked'}`);
    console.log(`   Max Sessions: ${user.maxSessions}`);
    console.log(`   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never'}`);
    console.log('─'.repeat(80));

    // Check recent login attempts
    const recentAttempts = await prisma.failedLoginAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (recentAttempts.length > 0) {
      console.log(`📋 Recent failed login attempts (${recentAttempts.length}):`);
      recentAttempts.forEach((attempt, index) => {
        console.log(`   ${index + 1}. ${attempt.createdAt.toLocaleString()} from ${attempt.ipAddress}`);
      });
    } else {
      console.log(`📋 No recent failed login attempts`);
    }

    // Check active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    console.log('─'.repeat(80));
    console.log(`📱 Active sessions: ${activeSessions.length}/${user.maxSessions}`);
    activeSessions.forEach((session, index) => {
      console.log(`   ${index + 1}. Created: ${session.createdAt.toLocaleString()}, Expires: ${session.expiresAt.toLocaleString()}`);
    });

    // Check OTP codes
    const recentOTPs = await prisma.oTPCode.findMany({
      where: {
        userId: user.id,
        type: 'login_2fa',
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    console.log('─'.repeat(80));
    console.log(`🔐 Recent OTP codes (${recentOTPs.length}):`);
    recentOTPs.forEach((otp, index) => {
      console.log(`   ${index + 1}. Code: ${otp.code}, Created: ${otp.createdAt.toLocaleString()}, Used: ${otp.usedAt ? 'Yes' : 'No'}, Expires: ${otp.expiresAt.toLocaleString()}`);
    });

    // Diagnose issues
    console.log('─'.repeat(80));
    console.log('🔧 Issues and Recommendations:');

    if (!user.isActive) {
      console.log('   ⚠️  Account is INACTIVE - Contact administrator to activate');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      console.log(`   ⚠️  Account is LOCKED for ${remainingMinutes} more minutes`);
    }

    if (user.twoFactorEnabled && !user.phoneVerified) {
      console.log('   ⚠️  2FA is enabled but phone is NOT verified - Cannot complete login');
    }

    if (user.twoFactorEnabled && user.phoneVerified) {
      console.log('   ℹ️  2FA is enabled - Login requires OTP code sent to phone');
      console.log('   ℹ️  If Twilio is not configured, OTP will not be sent');
    }

    if (user.failedLoginAttempts >= 5) {
      console.log('   ⚠️  Multiple failed login attempts - Account may be locked');
    }

    if (activeSessions.length >= user.maxSessions) {
      console.log('   ⚠️  Maximum sessions reached - Oldest session will be revoked on new login');
    }

  } catch (error) {
    console.error('❌ Error diagnosing account:', error);
  }
}

async function disable2FA(email: string) {
  try {
    console.log(`🔧 Disabling 2FA for: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ No account found with email: ${email}`);
      return false;
    }

    await prisma.user.update({
      where: { email },
      data: {
        twoFactorEnabled: false,
        phoneVerified: false,
      },
    });

    console.log(`✅ 2FA disabled for ${email}`);
    console.log(`ℹ️  You can now login without OTP verification`);
    return true;
  } catch (error) {
    console.error('❌ Error disabling 2FA:', error);
    return false;
  }
}

async function resetFailedAttempts(email: string) {
  try {
    console.log(`🔧 Resetting failed login attempts for: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ No account found with email: ${email}`);
      return false;
    }

    await prisma.user.update({
      where: { email },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log(`✅ Failed login attempts reset for ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error resetting failed attempts:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];

  if (!email && ['diagnose', 'disable-2fa', 'reset-attempts'].includes(command)) {
    console.log('❌ Email address is required');
    console.log('Usage: npm run diagnose-staff <command> <email>');
    console.log('Commands: diagnose, disable-2fa, reset-attempts');
    process.exit(1);
  }

  switch (command) {
    case 'diagnose':
      await diagnoseStaffAccount(email);
      break;
    
    case 'disable-2fa':
      await disable2FA(email);
      break;
    
    case 'reset-attempts':
      await resetFailedAttempts(email);
      break;
    
    default:
      console.log('Usage:');
      console.log('  npm run diagnose-staff diagnose <email>');
      console.log('  npm run diagnose-staff disable-2fa <email>');
      console.log('  npm run diagnose-staff reset-attempts <email>');
      console.log('');
      console.log('Examples:');
      console.log('  npm run diagnose-staff diagnose staff@clinic.ug.edu.gh');
      console.log('  npm run diagnose-staff disable-2fa staff@clinic.ug.edu.gh');
      console.log('  npm run diagnose-staff reset-attempts staff@clinic.ug.edu.gh');
      break;
  }

  await prisma.$disconnect();
}

main();