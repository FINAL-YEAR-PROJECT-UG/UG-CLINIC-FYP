import { Router, Request, Response } from 'express';
import {
  verifyTransporterConnection,
  getSmtpConfigSummary,
  getRecentDevEmails,
  getDevEmailById,
  clearRecentDevEmails,
  sendEmailVerificationEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentRescheduledEmail,
  sendAppointmentCancellationEmail,
  reloadTransporter,
} from '../services/email.service';

const router = Router();

/**
 * GET /api/dev/email/status
 * Check SMTP status and configuration
 */
router.get('/status', async (_req: Request, res: Response) => {
  const summary = getSmtpConfigSummary();
  const emails = getRecentDevEmails();
  res.json({
    success: true,
    smtp: summary,
    inboxCount: emails.length,
    recentEmails: emails.slice(0, 5).map((e) => ({
      id: e.id,
      to: e.to,
      subject: e.subject,
      status: e.status,
      sentAt: e.sentAt,
      extractedCode: e.extractedCode,
      previewUrl: e.previewUrl,
    })),
  });
});

/**
 * POST /api/dev/email/verify
 * Actively test SMTP connection
 */
router.post('/verify', async (_req: Request, res: Response) => {
  try {
    const result = await verifyTransporterConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || String(err) });
  }
});

/**
 * GET /api/dev/email/inbox
 * Get all intercepted / dispatched emails in current session
 */
router.get('/inbox', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: getRecentDevEmails().length,
    emails: getRecentDevEmails(),
  });
});

/**
 * DELETE /api/dev/email/inbox
 * Clear the dev inbox
 */
router.delete('/inbox', (_req: Request, res: Response) => {
  clearRecentDevEmails();
  res.json({ success: true, message: 'Dev email inbox cleared.' });
});

/**
 * GET /api/dev/email/preview/:id
 * Render raw HTML email directly in the browser
 */
router.get('/preview/:id', (req: Request, res: Response) => {
  const emailId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const email = getDevEmailById(emailId);
  if (!email) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Email Not Found</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; color: #475569;">
          <h2>404 - Email Not Found</h2>
          <p>No email found with ID <code>${emailId}</code> in the current local session.</p>
          <a href="/api/dev/email/ui" style="color: #0369a1; text-decoration: underline;">Return to Email Testing Dashboard</a>
        </body>
      </html>
    `);
  }

  res.setHeader('Content-Type', 'text/html');
  return res.send(email.html);
});

/**
 * POST /api/dev/email/send-test
 * Dispatch test emails for any of the 6 clinic services
 */
router.post('/send-test', async (req: Request, res: Response) => {
  const {
    type = 'otp',
    to = process.env.SMTP_USER || 'student@st.ug.edu.gh',
    firstName = 'Kwame',
    studentName = 'Kwame Mensah',
    serviceName = 'General Consultation',
    doctorName = 'K. Boateng',
    date = 'Friday, 10th October 2026',
    timeSlot = '09:30 AM - 10:00 AM',
    reason = 'Doctor scheduled emergency ward round',
  } = req.body || {};

  const cleanTo = String(to).trim();

  try {
    let result: any;

    switch (type) {
      case 'verification': {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        result = await sendEmailVerificationEmail(cleanTo, code, firstName);
        break;
      }
      case 'otp': {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        result = await sendOTPEmail(cleanTo, otp);
        break;
      }
      case 'password-reset': {
        const fakeToken = `dev-reset-token-${Date.now()}`;
        result = await sendPasswordResetEmail(cleanTo, fakeToken);
        break;
      }
      case 'appointment-confirmed': {
        result = await sendAppointmentConfirmationEmail({
          email: cleanTo,
          studentName,
          serviceName,
          doctorName,
          date,
          timeSlot,
          appointmentId: `APT-${Date.now().toString().slice(-6)}`,
        });
        break;
      }
      case 'appointment-rescheduled': {
        result = await sendAppointmentRescheduledEmail({
          email: cleanTo,
          studentName,
          serviceName,
          newDate: date,
          newTimeSlot: timeSlot,
        });
        break;
      }
      case 'appointment-cancelled': {
        result = await sendAppointmentCancellationEmail({
          email: cleanTo,
          studentName,
          serviceName,
          date,
          reason,
        });
        break;
      }
      case 'all': {
        const results = [];
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        results.push(await sendEmailVerificationEmail(cleanTo, code, firstName));
        results.push(await sendOTPEmail(cleanTo, code));
        results.push(await sendPasswordResetEmail(cleanTo, `dev-token-${Date.now()}`));
        results.push(
          await sendAppointmentConfirmationEmail({
            email: cleanTo,
            studentName,
            serviceName,
            doctorName,
            date,
            timeSlot,
            appointmentId: `APT-${Date.now().toString().slice(-6)}`,
          })
        );
        results.push(
          await sendAppointmentRescheduledEmail({
            email: cleanTo,
            studentName,
            serviceName,
            newDate: date,
            newTimeSlot: timeSlot,
          })
        );
        results.push(
          await sendAppointmentCancellationEmail({
            email: cleanTo,
            studentName,
            serviceName,
            date,
            reason,
          })
        );
        return res.json({
          success: true,
          message: `Dispatched all 6 test email templates to ${cleanTo}`,
          count: results.length,
          recentInbox: getRecentDevEmails().slice(0, 6),
        });
      }
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid email type '${type}'. Valid types: 'verification', 'otp', 'password-reset', 'appointment-confirmed', 'appointment-rescheduled', 'appointment-cancelled', 'all'`,
        });
    }

    res.json({
      success: result.success,
      type,
      recipient: cleanTo,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      error: result.error,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || String(err) });
  }
});

/**
 * GET /api/dev/email/ui or GET /api/dev/email
 * Rich interactive HTML test console
 */
router.get(['/ui', '/'], (_req: Request, res: Response) => {
  const summary = getSmtpConfigSummary();
  const emails = getRecentDevEmails();

  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UG Clinic - Local Mail Testing Suite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  <!-- Top Navigation -->
  <header class="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-md">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-sky-500/20">
          ✉️
        </div>
        <div>
          <h1 class="text-base font-extrabold tracking-tight">UG Student Clinic Mail Tester</h1>
          <p class="text-xs text-slate-400">Localhost Email Delivery & Preview Suite</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="testConnection()" id="verify-btn" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 border border-slate-700 transition-all flex items-center gap-1.5">
          <span>⚡</span> Verify SMTP
        </button>
        <button onclick="clearInbox()" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-all">
          Clear Inbox
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <!-- Status & Configuration Banner -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">SMTP Host</span>
        <div class="text-sm font-bold text-slate-800 mt-1">${summary.host}:${summary.port}</div>
      </div>
      <div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configured User</span>
        <div class="text-sm font-bold text-slate-800 mt-1">${summary.user}</div>
      </div>
      <div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sender Identity</span>
        <div class="text-sm font-bold text-slate-800 mt-1 truncate">${summary.fromEmail}</div>
      </div>
      <div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
        <div class="mt-1 flex items-center gap-2" id="smtp-badge">
          ${
            summary.configured
              ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">● Configured (Ready)</span>'
              : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">● Simulated (No SMTP credentials)</span>'
          }
        </div>
      </div>
    </div>

    <!-- Alert banner -->
    <div id="alert-banner" class="hidden p-4 rounded-xl text-sm font-medium transition-all"></div>

    <!-- Test Dispatch Form & Templates -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Dispatch Test Email</h2>
          <p class="text-xs text-slate-500">Trigger any transactional email service on localhost</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-slate-600">Send To:</label>
          <input
            id="target-email"
            type="email"
            value="${process.env.SMTP_USER || 'student@st.ug.edu.gh'}"
            placeholder="student@st.ug.edu.gh"
            class="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium w-64 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      <!-- Quick Trigger Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- 1. Email Verification -->
        <button onclick="sendTest('verification')" class="text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:shadow-md transition-all group bg-gradient-to-br hover:from-sky-50/50 hover:to-white">
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="text-xl">✉️</span>
            <span class="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">1. Email Verification</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">Sends new student account welcome email with 6-digit verification code.</p>
        </button>

        <!-- 2. OTP Security Code -->
        <button onclick="sendTest('otp')" class="text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group bg-gradient-to-br hover:from-emerald-50/50 hover:to-white">
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="text-xl">🔐</span>
            <span class="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">2. 2FA / Login OTP</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">Sends time-sensitive one-time passcode for identity verification.</p>
        </button>

        <!-- 3. Password Reset -->
        <button onclick="sendTest('password-reset')" class="text-left p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all group bg-gradient-to-br hover:from-purple-50/50 hover:to-white">
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="text-xl">🔑</span>
            <span class="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors">3. Password Reset</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">Sends password reset request with tokenized URL button.</p>
        </button>

        <!-- 4. Appointment Confirmed -->
        <button onclick="sendTest('appointment-confirmed')" class="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group bg-gradient-to-br hover:from-blue-50/50 hover:to-white">
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="text-xl">📅</span>
            <span class="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">4. Appointment Confirmed</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">Sends appointment details, doctor name, time slot & arrival guidance.</p>
        </button>

        <!-- 5. Appointment Rescheduled -->
        <button onclick="sendTest('appointment-rescheduled')" class="text-left p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all group bg-gradient-to-br hover:from-amber-50/50 hover:to-white">
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="text-xl">🔄</span>
            <span class="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">5. Appointment Rescheduled</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">Sends rescheduled notice with new date, time, and patient directions.</p>
        </button>

        <!-- 6. Appointment Cancelled -->
        <button onclick="sendTest('appointment-cancelled')" class="text-left p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:shadow-md transition-all group bg-gradient-to-br hover:from-red-50/50 hover:to-white">
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="text-xl">❌</span>
            <span class="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">6. Appointment Cancelled</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">Sends cancellation notice along with reason and re-booking instructions.</p>
        </button>
      </div>

      <!-- Batch All Button -->
      <div class="pt-2 flex justify-end">
        <button onclick="sendTest('all')" class="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <span>🚀</span> Dispatch All 6 Test Templates at Once
        </button>
      </div>
    </div>

    <!-- Local Mailbox / Dispatched History -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Local Mailbox Log (${emails.length})</h2>
          <p class="text-xs text-slate-500">Emails dispatched in this session (stored in-memory, instant preview)</p>
        </div>
        <button onclick="loadInbox()" class="text-xs font-bold text-sky-600 hover:underline">
          🔄 Refresh
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <th class="py-2.5 px-3">Status</th>
              <th class="py-2.5 px-3">Subject</th>
              <th class="py-2.5 px-3">Recipient</th>
              <th class="py-2.5 px-3">Code / Token</th>
              <th class="py-2.5 px-3">Sent Time</th>
              <th class="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody id="inbox-tbody" class="divide-y divide-slate-100">
            ${
              emails.length === 0
                ? '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-medium">No emails dispatched yet in this session. Click any template above to test!</td></tr>'
                : emails
                    .map(
                      (e) => `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-3">
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    e.status === 'sent'
                      ? 'bg-emerald-100 text-emerald-800'
                      : e.status === 'simulated'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-red-100 text-red-800'
                  }">
                    ${e.status.toUpperCase()}
                  </span>
                </td>
                <td class="py-3 px-3 font-semibold text-slate-800 max-w-[200px] truncate">${e.subject}</td>
                <td class="py-3 px-3 text-slate-600 truncate max-w-[150px]">${e.to}</td>
                <td class="py-3 px-3">
                  ${
                    e.extractedCode
                      ? `<code class="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-indigo-700">${e.extractedCode}</code>`
                      : '<span class="text-slate-400">-</span>'
                  }
                </td>
                <td class="py-3 px-3 text-slate-400">${new Date(e.sentAt).toLocaleTimeString()}</td>
                <td class="py-3 px-3 text-right">
                  <a href="${e.previewUrl}" target="_blank" class="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded font-bold transition-colors">
                    Preview HTML ↗
                  </a>
                </td>
              </tr>
            `
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <script>
    function showAlert(text, type = 'success') {
      const banner = document.getElementById('alert-banner');
      banner.className = 'p-4 rounded-xl text-sm font-medium transition-all ' +
        (type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200');
      banner.innerHTML = text;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 5000);
    }

    async function testConnection() {
      const btn = document.getElementById('verify-btn');
      btn.innerText = 'Testing...';
      try {
        const res = await fetch('/api/dev/email/verify', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showAlert('✅ ' + data.message, 'success');
          document.getElementById('smtp-badge').innerHTML = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">● Connected (Verified)</span>';
        } else {
          showAlert('❌ ' + data.message, 'error');
        }
      } catch (err) {
        showAlert('❌ Error: ' + err.message, 'error');
      } finally {
        btn.innerHTML = '<span>⚡</span> Verify SMTP';
      }
    }

    async function sendTest(type) {
      const to = document.getElementById('target-email').value;
      showAlert('⏳ Dispatching ' + type + ' email...', 'success');
      try {
        const res = await fetch('/api/dev/email/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, to }),
        });
        const data = await res.json();
        if (data.success) {
          showAlert('✅ Successfully dispatched: ' + type + (data.previewUrl ? ' (<a href="' + data.previewUrl + '" target="_blank" class="underline font-bold">Open Preview</a>)' : ''), 'success');
          loadInbox();
        } else {
          showAlert('⚠️ Dispatched with warning: ' + (data.error || data.message), 'error');
          loadInbox();
        }
      } catch (err) {
        showAlert('❌ Failed: ' + err.message, 'error');
      }
    }

    async function clearInbox() {
      if (!confirm('Clear recent email log?')) return;
      await fetch('/api/dev/email/inbox', { method: 'DELETE' });
      loadInbox();
      showAlert('Local inbox cleared.', 'success');
    }

    async function loadInbox() {
      const res = await fetch('/api/dev/email/inbox');
      const data = await res.json();
      const tbody = document.getElementById('inbox-tbody');
      if (!data.emails || data.emails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-medium">No emails dispatched yet in this session.</td></tr>';
        return;
      }
      tbody.innerHTML = data.emails.map(e => \`
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-3 px-3">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold \${
              e.status === 'sent' ? 'bg-emerald-100 text-emerald-800' :
              e.status === 'simulated' ? 'bg-sky-100 text-sky-800' : 'bg-red-100 text-red-800'
            }">
              \${e.status.toUpperCase()}
            </span>
          </td>
          <td class="py-3 px-3 font-semibold text-slate-800 max-w-[200px] truncate">\${e.subject}</td>
          <td class="py-3 px-3 text-slate-600 truncate max-w-[150px]">\${e.to}</td>
          <td class="py-3 px-3">
            \${e.extractedCode ? \`<code class="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-indigo-700">\${e.extractedCode}</code>\` : '<span class="text-slate-400">-</span>'}
          </td>
          <td class="py-3 px-3 text-slate-400">\${new Date(e.sentAt).toLocaleTimeString()}</td>
          <td class="py-3 px-3 text-right">
            <a href="\${e.previewUrl}" target="_blank" class="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded font-bold transition-colors">
              Preview HTML ↗
            </a>
          </td>
        </tr>
      \`).join('');
    }
  </script>
</body>
</html>
  `);
});

export default router;
