import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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
      { success: false, message: "Database not configured: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const status = searchParams.get("status");
  const doctorId = searchParams.get("doctorId");
  const serviceId = searchParams.get("serviceId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search")?.trim();

  const todayIso = new Date().toISOString().slice(0, 10);

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("appointments")
    .select("*", { count: "exact" })
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status && status !== "all") query = query.eq("status", status.toUpperCase());
  if (doctorId) query = query.eq("doctor_id", doctorId);
  if (serviceId) query = query.eq("service_id", serviceId);
  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (search) {
    query = query.or(
      `patient_email.ilike.%${search}%,patient_name.ilike.%${search}%,student_id.ilike.%${search}%,doctor_name.ilike.%${search}%,service_name.ilike.%${search}%,reason.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }

  const appointments = (data || []).map((row) => mapAppointmentRow(row as AppointmentRow));

  return NextResponse.json({
    success: true,
    data: { appointments, total: count ?? appointments.length, page, pageSize },
  });
}
