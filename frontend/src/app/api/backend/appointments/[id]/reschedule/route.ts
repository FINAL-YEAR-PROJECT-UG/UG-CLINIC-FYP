import { NextRequest, NextResponse } from "next/server.js";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";
import { getSessionIdentity, isStaffRole } from "@/lib/sessionIdentity";
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
  const date = body.date;
  const timeSlot = body.timeSlot;
  if (!date || !timeSlot) {
    return NextResponse.json(
      { success: false, message: "Date and time slot are required" },
      { status: 400 },
    );
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
    isStaffRole(identity.role) ||
    (identity.userId && existing.user_id === identity.userId) ||
    (identity.email && existing.patient_email === identity.email);
  if (!ownsRecord) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
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

  return NextResponse.json({
    success: true,
    message: "Appointment rescheduled",
    data: { appointment: mapAppointmentRow(data as AppointmentRow) },
  });
}
