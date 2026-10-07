import { NextRequest, NextResponse } from "next/server.js";
import { sendAppointmentUpdateEmail } from "@/lib/appointmentNotifications";
import { AuthzError, requireAdmin } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * POST /api/backend/staff/auto-assign-doctors
 * Admin-only utility: for all PENDING appointments that have no doctor_id,
 * auto-assigns the next available doctor using a round-robin from public.profiles.
 *
 * Body: { dry_run?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const dryRun = Boolean(body.dry_run);

  const supabase = getSupabaseAdmin();

  // 1. Fetch all active doctors from profiles
  const { data: doctorProfiles, error: doctorErr } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("role", "DOCTOR")
    .eq("is_active", true);

  if (doctorErr) {
    return NextResponse.json({ success: false, message: doctorErr.message }, { status: 500 });
  }

  const doctors = doctorProfiles ?? [];
  if (doctors.length === 0) {
    return NextResponse.json({
      success: false,
      message: "No active doctors found in profiles table. Run the profiles migration and ensure doctors have been provisioned.",
    }, { status: 409 });
  }

  // 2. Fetch unassigned PENDING appointments
  const { data: unassigned, error: apptErr } = await supabase
    .from("appointments")
    .select("id, patient_name, patient_email, service_id, service_name, date, time_slot")
    .eq("status", "PENDING")
    .is("doctor_id", null);

  if (apptErr) {
    return NextResponse.json({ success: false, message: apptErr.message }, { status: 500 });
  }

  const appointments = unassigned ?? [];
  if (appointments.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No unassigned PENDING appointments found.",
      data: { assigned: 0, dry_run: dryRun },
    });
  }

  // 3. Round-robin assignment
  type AssignedItem = {
    appointment_id: string;
    doctor_id: string;
    doctor_name: string;
    patient_name: string | null;
    patient_email: string | null;
    service_id: string;
    service_name: string | null;
    date: string | null;
    time_slot: string | null;
  };
  const assigned: AssignedItem[] = appointments.map((appt, i) => {
    const doctor = doctors[i % doctors.length];
    const doctorName = [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") || doctor.email;
    return {
      appointment_id: appt.id,
      doctor_id: doctor.id,
      doctor_name: doctorName,
      patient_name: appt.patient_name,
      patient_email: appt.patient_email,
      service_id: appt.service_id,
      service_name: appt.service_name,
      date: appt.date,
      time_slot: appt.time_slot,
    };
  });

  if (dryRun) {
    return NextResponse.json({
      success: true,
      message: `Dry run: would assign ${assigned.length} appointment(s) to ${doctors.length} doctor(s).`,
      data: { assigned: assigned.length, dry_run: true, preview: assigned },
    });
  }

  // 4. Commit updates
  const now = new Date().toISOString();
  const results = await Promise.all(
    assigned.map(async (item) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({
          doctor_id: item.doctor_id,
          doctor_name: item.doctor_name,
          updated_at: now,
        })
        .eq("id", item.appointment_id)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        console.error("[appointment-assignment] Failed to assign doctor", {
          appointmentId: item.appointment_id,
          code: error?.code || null,
        });
        return { assigned: false, emailSent: false };
      }

      if (!item.patient_email || !item.date || !item.time_slot) {
        return { assigned: true, emailSent: false };
      }

      try {
        const notification = await sendAppointmentUpdateEmail({
          supabase,
          appointmentId: item.appointment_id,
          kind: "assignment",
          to: item.patient_email,
          patientName: item.patient_name || "Student",
          serviceName: item.service_name || item.service_id,
          date: item.date,
          timeSlot: item.time_slot,
          doctorName: item.doctor_name,
        });
        return { assigned: true, emailSent: notification.sent };
      } catch (error) {
        console.error("[appointment-notification] Auto-assignment email failed", {
          appointmentId: item.appointment_id,
          error: error instanceof Error ? error.name : "UNKNOWN_ERROR",
        });
        return { assigned: true, emailSent: false };
      }
    }),
  );
  const assignedCount = results.filter((result) => result.assigned).length;
  const failedCount = results.length - assignedCount;
  const emailFailedCount = results.filter((result) => result.assigned && !result.emailSent).length;

  return NextResponse.json({
    success: true,
    message: `Assigned ${assignedCount} of ${assigned.length} appointment(s). ${failedCount} assignments failed; ${emailFailedCount} email notifications failed.`,
    data: {
      assigned: assignedCount,
      assignedCount,
      failed: failedCount,
      emailFailed: emailFailedCount,
      dry_run: false,
    },
  });
}
