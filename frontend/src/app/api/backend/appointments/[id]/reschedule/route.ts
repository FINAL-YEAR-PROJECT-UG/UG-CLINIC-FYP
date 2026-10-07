import { NextRequest, NextResponse } from "next/server.js";
import { sendAppointmentUpdateEmail } from "@/lib/appointmentNotifications";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";
import { getSessionIdentity } from "@/lib/sessionIdentity";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { isValidAppointmentDate, normalizeAppointmentTime } from "@/lib/appointmentScheduling";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const identity = await getSessionIdentity(request);
  if (!identity?.userId && !identity?.email) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Appointments database is not configured." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const date = typeof body.date === "string" ? body.date : "";
  const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : "";
  const normalizedTime = normalizeAppointmentTime(timeSlot);
  if (!isValidAppointmentDate(date) || normalizedTime === null) {
    return NextResponse.json(
      { success: false, message: "A valid date and time are required" },
      { status: 400 },
    );
  }
  if (date < new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ success: false, message: "Appointments cannot be rescheduled into the past" }, { status: 400 });
  }

  let isStaff = false;
  try {
    await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: true });
    isStaff = true;
  } catch (error) {
    if (!(error instanceof AuthzError) || ![401, 403].includes(error.status)) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Authorization error" },
        { status: 500 },
      );
    }
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: readError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError || !existing) {
    return NextResponse.json(
      { success: false, message: readError?.message || "Appointment not found" },
      { status: readError ? 500 : 404 },
    );
  }

  const ownsRecord =
    isStaff ||
    (identity.userId && existing.user_id === identity.userId) ||
    (identity.email && existing.patient_email === identity.email);

  if (!ownsRecord) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(String(existing.status).toUpperCase())) {
    return NextResponse.json({ success: false, message: "This appointment can no longer be rescheduled" }, { status: 409 });
  }

  const { data: sameDayAppointments, error: conflictReadError } = await supabase
    .from("appointments")
    .select("id, time_slot, doctor_id")
    .eq("date", date)
    .in("status", ["PENDING", "CONFIRMED", "RESCHEDULED"])
    .neq("id", id);

  if (conflictReadError) {
    return NextResponse.json({ success: false, message: conflictReadError.message }, { status: 500 });
  }

  const conflict = (sameDayAppointments || []).some((appointment) => {
    const sameDoctor = Boolean(existing.doctor_id) && appointment.doctor_id === existing.doctor_id;
    return sameDoctor && normalizeAppointmentTime(appointment.time_slot) === normalizedTime;
  });
  if (conflict) {
    return NextResponse.json({ success: false, message: "The selected doctor already has an appointment at that time" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      date,
      time_slot: timeSlot,
      status: "RESCHEDULED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to reschedule" },
      { status: 500 },
    );
  }

  let emailNotification: { sent: boolean; error?: string } = {
    sent: false,
    error: data.patient_email ? "EMAIL_DISPATCH_FAILED" : "PATIENT_EMAIL_MISSING",
  };
  if (data.patient_email) {
    try {
      const result = await sendAppointmentUpdateEmail({
        supabase,
        appointmentId: id,
        kind: "reschedule",
        to: data.patient_email,
        patientName: data.patient_name || "Student",
        serviceName: data.service_name || data.service_id,
        date: data.date,
        timeSlot: data.time_slot,
        doctorName: data.doctor_name || undefined,
      });
      emailNotification = { sent: result.sent, error: result.error };
    } catch (dispatchError) {
      console.error("[appointment-notification] Reschedule email dispatch failed", {
        appointmentId: id,
        error: dispatchError instanceof Error ? dispatchError.name : "UNKNOWN_ERROR",
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Appointment rescheduled",
    emailNotification,
    data: { appointment: mapAppointmentRow(data as AppointmentRow) },
  });
}
