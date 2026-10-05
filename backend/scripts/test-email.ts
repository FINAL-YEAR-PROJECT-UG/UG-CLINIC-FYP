/**
 * CLI Test Script for UG Clinic Email Delivery
 *
 * Usage:
 *   npx ts-node scripts/test-email.ts
 *   npx ts-node scripts/test-email.ts --all
 *   npx ts-node scripts/test-email.ts --type=otp --to=myemail@gmail.com
 *   npx ts-node scripts/test-email.ts --verify-only
 */
import 'dotenv/config';
import {
  verifyTransporterConnection,
  getSmtpConfigSummary,
  sendEmailVerificationEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentRescheduledEmail,
  sendAppointmentCancellationEmail,
} from '../src/services/email.service';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split('=')[1];
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return undefined;
};

const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const targetType = getArg('type') || (hasFlag('all') ? 'all' : (hasFlag('verify-only') ? 'verify-only' : 'otp'));
const targetTo = getArg('to') || process.env.SMTP_USER || 'student@st.ug.edu.gh';

async function run() {
  console.log('\n============================================================');
  console.log('   🏥 UG STUDENT CLINIC - LOCALHOST EMAIL TESTING SUITE     ');
  console.log('============================================================\n');

  const summary = getSmtpConfigSummary();
  console.log('📋 SMTP Configuration:');
  console.log(`   • Host:        ${summary.host}:${summary.port}`);
  console.log(`   • User:        ${summary.user}`);
  console.log(`   • From:        ${summary.fromEmail}`);
  console.log(`   • Configured:  ${summary.configured ? '✅ Yes (Real SMTP)' : '⚠️ No (Simulated/Dev Mode)'}`);
  console.log(`   • Target Recipient: ${targetTo}\n`);

  console.log('⏳ Verifying SMTP server connection...');
  const connResult = await verifyTransporterConnection();

  if (connResult.success) {
    console.log(`✅ [SMTP OK] ${connResult.message}\n`);
  } else {
    console.log(`⚠️ [SMTP WARNING] ${connResult.message}\n`);
  }

  if (targetType === 'verify-only') {
    console.log('Done (verify-only specified).');
    process.exit(connResult.success ? 0 : 1);
  }

  console.log(`🚀 Dispatching test email(s) [Mode: ${targetType.toUpperCase()}] to ${targetTo}...\n`);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const templates: Record<string, () => Promise<any>> = {
    verification: () =>
      sendEmailVerificationEmail(targetTo, '583921', 'Emmanuel'),

    otp: () =>
      sendOTPEmail(targetTo, '749204'),

    'password-reset': () =>
      sendPasswordResetEmail(targetTo, 'test-reset-token-' + Date.now()),

    'appointment-confirmed': () =>
      sendAppointmentConfirmationEmail({
        email: targetTo,
        studentName: 'Emmanuel Oteng',
        serviceName: 'General Consultation',
        doctorName: 'Dr. K. Boateng',
        date: dateStr,
        timeSlot: '10:00 AM - 10:30 AM',
        appointmentId: 'APT-' + Date.now().toString().slice(-6),
      }),

    'appointment-rescheduled': () =>
      sendAppointmentRescheduledEmail({
        email: targetTo,
        studentName: 'Emmanuel Oteng',
        serviceName: 'General Consultation',
        newDate: dateStr,
        newTimeSlot: '02:00 PM - 02:30 PM',
      }),

    'appointment-cancelled': () =>
      sendAppointmentCancellationEmail({
        email: targetTo,
        studentName: 'Emmanuel Oteng',
        serviceName: 'Dental Checkup',
        date: dateStr,
        reason: 'Attending physician scheduled for emergency surgery',
      }),
  };

  if (targetType === 'all') {
    for (const [name, fn] of Object.entries(templates)) {
      console.log(`\n--- Sending: ${name.toUpperCase()} ---`);
      const res = await fn();
      console.log(`Result: ${res.success ? '✅ Sent' : '❌ Failed'} | ID: ${res.messageId || 'N/A'}`);
      if (res.previewUrl) {
        console.log(`HTML Preview: ${res.previewUrl}`);
      }
      // Pacing delay to avoid SMTP rate-limiting on Gmail
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    console.log('\n🎉 All 6 templates dispatched successfully!');
  } else if (templates[targetType]) {
    const res = await templates[targetType]();
    console.log(`\nResult: ${res.success ? '✅ Sent' : '❌ Failed'} | ID: ${res.messageId || 'N/A'}`);
    if (res.previewUrl) {
      console.log(`HTML Preview: ${res.previewUrl}`);
    }
  } else {
    console.error(`❌ Unknown type "${targetType}".`);
    console.log('Available types:');
    console.log('  verification');
    console.log('  otp');
    console.log('  password-reset');
    console.log('  appointment-confirmed');
    console.log('  appointment-rescheduled');
    console.log('  appointment-cancelled');
    console.log('  all');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('💡 TIP: You can also open the interactive Web Mail Tester at:');
  console.log(`   http://localhost:${process.env.PORT || 3005}/api/dev/email/ui`);
  console.log('============================================================\n');
}

run().catch((err) => {
  console.error('Fatal error running email test:', err);
  process.exit(1);
});
