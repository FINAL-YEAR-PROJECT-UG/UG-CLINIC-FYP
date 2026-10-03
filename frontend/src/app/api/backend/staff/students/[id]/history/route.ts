import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: false });
  } catch (e) {
    if (e instanceof AuthzError) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Database not configured: SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  // Try profiles table first
  let student: Record<string, unknown> | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profile) {
      student = {
        id: profile.id,
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        otherNames: "",
        studentId: profile.student_id || "",
        email: profile.email,
        phone: profile.phone || "",
        program: "",
        gender: "",
        isResident: "",
        isActive: profile.is_active,
        createdAt: profile.created_at,
      };
    }
  } catch {
    // profiles table not yet migrated
  }

  // If not found in profiles, synthesize from appointments
  if (!student) {
    const { data: apptRow } = await supabase
      .from("appointments")
      .select("user_id, patient_name, patient_email, student_id")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!apptRow) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
    }

    const nameParts = String(apptRow.patient_name || "").split(" ");
    student = {
      id: apptRow.user_id,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      otherNames: "",
      studentId: apptRow.student_id || "",
      email: apptRow.patient_email || "",
      phone: "",
      program: "",
      gender: "",
      isResident: "",
      isActive: true,
      createdAt: null,
    };
  }

  // Get appointment history
  const { data: appts, error: apptsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (apptsError) {
    return NextResponse.json({ success: false, message: apptsError.message }, { status: 500 });
  }

  const appointments = (appts || []).map((r) => mapAppointmentRow(r as AppointmentRow));

  return NextResponse.json({
    success: true,
    data: { student: { ...student, appointments } },
  });
}
