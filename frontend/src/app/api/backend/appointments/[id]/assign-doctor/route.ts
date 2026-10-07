import { NextRequest, NextResponse } from "next/server.js";
import { sendAppointmentUpdateEmail } from "@/lib/appointmentNotifications";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";
import { normalizeAppointmentTime } from "@/lib/appointmentScheduling";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: true });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Appointments database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const doctorId = typeof body.doctorId === "string" ? body.doctorId.trim() : "";
  if (!doctorId) {
    return NextResponse.json({ success: false, message: "A doctor must be selected" }, { status: 400 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (appointmentError) {
    return NextResponse.json({ success: false, message: appointmentError.message }, { status: 500 });
  }
  if (!appointment) {
    return NextResponse.json({ success: false, message: "Appointment not found" }, { status: 404 });
  }
  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(String(appointment.status).toUpperCase())) {
    return NextResponse.json({ success: false, message: "This appointment can no longer be assigned" }, { status: 409 });
  }

  const { data: doctor, error: doctorError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("id", doctorId)
    .in("role", ["DOCTOR", "ADMIN"])
    .eq("is_active", true)
    .maybeSingle();

  if (doctorError) {
    return NextResponse.json({ success: false, message: doctorError.message }, { status: 500 });
  }
  if (!doctor) {
    return NextResponse.json({ success: false, message: "The selected doctor is not active or does not exist" }, { status: 404 });
  }

  const { data: doctorAppointments, error: scheduleError } = await supabase
    .from("appointments")
    .select("id, time_slot")
    .eq("doctor_id", doctor.id)
    .eq("date", appointment.date)
    .in("status", ["PENDING", "CONFIRMED", "RESCHEDULED"])
    .neq("id", id);

  if (scheduleError) {
    return NextResponse.json({ success: false, message: scheduleError.message }, { status: 500 });
  }
  const appointmentTime = normalizeAppointmentTime(appointment.time_slot);
  const hasScheduleConflict = (doctorAppointments || []).some(
    (item) => normalizeAppointmentTime(item.time_slot) === appointmentTime,
  );
  if (hasScheduleConflict) {
    return NextResponse.json({ success: false, message: "The selected doctor already has an appointment at that time" }, { status: 409 });
  }

  const doctorName = [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") || doctor.email;
  const { data: updated, error: updateError } = await supabase
    .from("appointments")
    .update({ doctor_id: doctor.id, doctor_name: doctorName, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ success: false, message: updateError?.message || "Failed to assign doctor" }, { status: 500 });
  }

  let emailNotification: { sent: boolean; error?: string } = {
    sent: false,
    error: appointment.patient_email ? "EMAIL_DISPATCH_FAILED" : "PATIENT_EMAIL_MISSING",
  };
  if (appointment.patient_email) {
    try {
      const result = await sendAppointmentUpdateEmail({
        supabase,
        appointmentId: id,
        kind: "assignment",
        to: appointment.patient_email,
        patientName: appointment.patient_name || "Student",
        serviceName: appointment.service_name || appointment.service_id,
        date: appointment.date,
        timeSlot: appointment.time_slot,
        doctorName,
      });
      emailNotification = { sent: result.sent, error: result.error };
    } catch (error) {
      console.error("[appointment-notification] Assignment email dispatch failed", {
        appointmentId: id,
        error: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Doctor assigned",
    emailNotification,
    data: { appointment: mapAppointmentRow(updated as AppointmentRow) },
  });
}
