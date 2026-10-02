import { NextRequest, NextResponse } from "next/server.js";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";
import { sendApprovalEmail } from "@/lib/appointmentNotifications";
import {
  canApproveAppointments,
  getSessionIdentity,
} from "@/lib/sessionIdentity";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const identity = await getSessionIdentity(request);
  if (!identity) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  if (!canApproveAppointments(identity.role)) {
    return NextResponse.json(
      { success: false, message: "Forbidden: doctor or admin only" },
      { status: 403 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Appointments database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const nextStatus = String(body.status || "").toUpperCase();

  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return NextResponse.json(
      { success: false, message: "Invalid appointment status" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: readError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json(
      { success: false, message: readError.message, code: readError.code },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { success: false, message: "Appointment not found" },
      { status: 404 },
    );
  }

  const previousStatus = String(existing.status || "").toUpperCase();
  const { data: updated, error: updateError } = await supabase
    .from("appointments")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      {
        success: false,
        message: updateError?.message || "Failed to update appointment status",
        code: updateError?.code,
      },
      { status: 500 },
    );
  }

  const isFirstApproval =
    previousStatus !== "CONFIRMED" &&
    nextStatus === "CONFIRMED" &&
    !updated.approval_email_sent;

  if (isFirstApproval && updated.patient_email) {
    try {
      await sendApprovalEmail({
        supabase,
        appointmentId: updated.id,
        alreadySent: Boolean(updated.approval_email_sent),
        to: updated.patient_email,
        patientName: updated.patient_name || "Student",
        serviceName: updated.service_name || updated.service_id,
        date: updated.date,
        timeSlot: updated.time_slot,
      });
    } catch {
      console.info("[appointment-notification]", {
        kind: "approval",
        sent: false,
        error: "DISPATCH_FAILED",
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Appointment status updated",
    data: { appointment: mapAppointmentRow(updated as AppointmentRow) },
  });
}
