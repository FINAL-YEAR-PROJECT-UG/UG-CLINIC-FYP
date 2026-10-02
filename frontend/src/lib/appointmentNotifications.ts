import { sendEmail as sendWithSendGrid } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationKind = "booking" | "approval";

type SendResult = {
  sent: boolean;
  provider: "sendgrid" | "resend" | null;
  error?: string;
};

function clinicFromName() {
  return (
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "UG Student Clinic <noreply@ug.edu.gh>"
  );
}

function bookingHtml(opts: {
  patientName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  reference: string;
}) {
  return `
    <p>Dear ${escapeHtml(opts.patientName)},</p>
    <p>Your University of Ghana Student Clinic appointment has been received.</p>
    <p>
      <strong>Reference:</strong> ${escapeHtml(opts.reference)}<br/>
      <strong>Service:</strong> ${escapeHtml(opts.serviceName)}<br/>
      <strong>Date:</strong> ${escapeHtml(opts.date)}<br/>
      <strong>Time:</strong> ${escapeHtml(opts.timeSlot)}
    </p>
    <p>Please bring your student ID and arrive 10 minutes early. You will receive another email if a doctor confirms this booking.</p>
    <p>UG Health Services</p>
  `;
}

function approvalHtml(opts: {
  patientName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  reference: string;
}) {
  return `
    <p>Dear ${escapeHtml(opts.patientName)},</p>
    <p>Your clinic appointment has been <strong>approved</strong> by a doctor.</p>
    <p>
      <strong>Reference:</strong> ${escapeHtml(opts.reference)}<br/>
      <strong>Service:</strong> ${escapeHtml(opts.serviceName)}<br/>
      <strong>Date:</strong> ${escapeHtml(opts.date)}<br/>
      <strong>Time:</strong> ${escapeHtml(opts.timeSlot)}
    </p>
    <p>Please arrive 10 minutes early with your student ID.</p>
    <p>UG Health Services</p>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendTransactionalEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    try {
      await sendWithSendGrid(to, subject, html);
      return { sent: true, provider: "sendgrid" };
    } catch (error) {
      return {
        sent: false,
        provider: "sendgrid",
        error: error instanceof Error ? error.name : "SENDGRID_FAILED",
      };
    }
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [to],
          subject,
          html,
        }),
      });
      if (!response.ok) {
        return { sent: false, provider: "resend", error: `RESEND_${response.status}` };
      }
      return { sent: true, provider: "resend" };
    } catch {
      return { sent: false, provider: "resend", error: "RESEND_FAILED" };
    }
  }

  return { sent: false, provider: null, error: "EMAIL_PROVIDER_NOT_CONFIGURED" };
}

function logDelivery(kind: NotificationKind, result: SendResult) {
  console.info("[appointment-notification]", {
    kind,
    sent: result.sent,
    provider: result.provider,
    error: result.error || null,
  });
}

export async function sendBookingConfirmationEmail(opts: {
  supabase: SupabaseClient;
  appointmentId: string;
  alreadySent: boolean;
  to: string;
  patientName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
}): Promise<SendResult> {
  if (opts.alreadySent) {
    return { sent: false, provider: null, error: "ALREADY_SENT" };
  }

  const year = new Date(opts.date).getFullYear();
  const reference = `UGC-${year}-${opts.appointmentId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const result = await sendTransactionalEmail(
    opts.to,
    "UG Student Clinic — appointment received",
    bookingHtml({
      patientName: opts.patientName,
      serviceName: opts.serviceName,
      date: opts.date,
      timeSlot: opts.timeSlot,
      reference,
    }),
  );
  logDelivery("booking", result);
  await recordNotification(opts.supabase, opts.appointmentId, "booking", result);
  return result;
}

export async function sendApprovalEmail(opts: {
  supabase: SupabaseClient;
  appointmentId: string;
  alreadySent: boolean;
  to: string;
  patientName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
}): Promise<SendResult> {
  if (opts.alreadySent) {
    return { sent: false, provider: null, error: "ALREADY_SENT" };
  }

  const year = new Date(opts.date).getFullYear();
  const reference = `UGC-${year}-${opts.appointmentId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const result = await sendTransactionalEmail(
    opts.to,
    "UG Student Clinic — appointment approved",
    approvalHtml({
      patientName: opts.patientName,
      serviceName: opts.serviceName,
      date: opts.date,
      timeSlot: opts.timeSlot,
      reference,
    }),
  );
  logDelivery("approval", result);
  await recordNotification(opts.supabase, opts.appointmentId, "approval", result);
  return result;
}

async function recordNotification(
  supabase: SupabaseClient,
  appointmentId: string,
  kind: NotificationKind,
  result: SendResult,
) {
  const flagColumn = kind === "booking" ? "booking_email_sent" : "approval_email_sent";
  const { data } = await supabase
    .from("appointments")
    .select("notification_logs")
    .eq("id", appointmentId)
    .maybeSingle();

  const logs = Array.isArray(data?.notification_logs) ? data.notification_logs.slice(-19) : [];
  logs.push({
    kind,
    sent: result.sent,
    provider: result.provider,
    error: result.error || null,
    at: new Date().toISOString(),
  });

  let update = supabase
    .from("appointments")
    .update({
      [flagColumn]: Boolean(result.sent),
      notification_logs: logs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (result.sent) {
    update = update.eq(flagColumn, false);
  }

  await update;
}

export { clinicFromName };
