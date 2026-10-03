import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { sendApprovalEmail } from "@/lib/appointmentNotifications";

export const runtime = "nodejs";

/**
 * POST /api/backend/staff/auto-confirm-pending
 * ADMIN or DOCTOR: bulk-confirm all PENDING appointments that have a doctor assigned.
 * Safe to run multiple times (idempotent — skips already-CONFIRMED).
 *
 * Body: { dry_run?: boolean, send_emails?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    await requireStaffRole(request, { allow: ["ADMIN", "DOCTOR"], requireTrusted: true });
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const dryRun = Boolean(body.dry_run);
  const sendEmails = body.send_emails !== false; // default true

  const supabase = getSupabaseAdmin();

  // Fetch PENDING appointments that have a doctor assigned
  const { data: pending, error } = await supabase
    .from("appointments")
    .select("id, patient_email, patient_name, service_name, service_id, date, time_slot, approval_email_sent")
    .eq("status", "PENDING")
    .not("doctor_id", "is", null);

  if (error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const appointments = pending ?? [];

  if (appointments.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No PENDING appointments with assigned doctors found.",
      data: { confirmed: 0, dry_run: dryRun },
    });
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      message: `Dry run: would confirm ${appointments.length} appointment(s).`,
      data: { confirmed: appointments.length, dry_run: true, preview: appointments.map((a) => a.id) },
    });
  }

  const now = new Date().toISOString();
  const ids = appointments.map((a) => a.id);

  const { error: updateErr } = await supabase
    .from("appointments")
    .update({ status: "CONFIRMED", updated_at: now })
    .in("id", ids);

  if (updateErr)
    return NextResponse.json({ success: false, message: updateErr.message }, { status: 500 });

  // Fire-and-forget approval emails
  let emailsSent = 0;
  if (sendEmails) {
    const emailJobs = appointments
      .filter((a) => a.patient_email && !a.approval_email_sent)
      .map(async (a) => {
        try {
          await sendApprovalEmail({
            supabase,
            appointmentId: a.id,
            alreadySent: Boolean(a.approval_email_sent),
            to: a.patient_email,
            patientName: a.patient_name || "Student",
            serviceName: a.service_name || a.service_id,
            date: a.date,
            timeSlot: a.time_slot,
          });
          emailsSent++;
        } catch {
          // non-fatal
        }
      });
    await Promise.allSettled(emailJobs);
  }

  return NextResponse.json({
    success: true,
    message: `Confirmed ${ids.length} appointment(s). ${emailsSent} notification email(s) sent.`,
    data: { confirmed: ids.length, emails_sent: emailsSent, dry_run: false },
  });
}
