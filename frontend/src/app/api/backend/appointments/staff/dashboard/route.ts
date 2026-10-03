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
      { success: false, message: "Database not configured: SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdmin();
  const todayIso = new Date().toISOString().slice(0, 10);

  // Fetch all appointments once for summary counts
  const { data: allRows, error: allError } = await supabase
    .from("appointments")
    .select("id, status, created_at, date, time_slot, doctor_id");

  if (allError) {
    return NextResponse.json({ success: false, message: allError.message }, { status: 500 });
  }

  const rows = allRows || [];
  const totalAppointments = rows.length;
  const todayAppointments = rows.filter((r) => r.date === todayIso).length;
  const pendingAppointments = rows.filter((r) => r.status === "PENDING").length;
  const confirmedAppointments = rows.filter((r) => r.status === "CONFIRMED").length;
  const completedAppointments = rows.filter((r) => r.status === "COMPLETED").length;
  const cancelledAppointments = rows.filter((r) => r.status === "CANCELLED").length;

  // Doctor & student counts from profiles (graceful if table DNE)
  let doctorCount = 0;
  let studentCount = 0;
  try {
    const { count: dc } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["DOCTOR", "ADMIN"])
      .eq("is_active", true);
    doctorCount = dc ?? 0;
    const { count: sc } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "STUDENT");
    studentCount = sc ?? 0;
  } catch {
    // profiles table not yet migrated — counts remain 0
  }

  // Recent 10 appointments
  const { data: recentRows } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Upcoming 10 (PENDING or CONFIRMED, ordered by date+time)
  const { data: upcomingRows } = await supabase
    .from("appointments")
    .select("*")
    .in("status", ["PENDING", "CONFIRMED"])
    .gte("date", todayIso)
    .order("date", { ascending: true })
    .order("time_slot", { ascending: true })
    .limit(10);

  // Daily trends: last 14 days
  const trendDays: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    trendDays.push({ date: ds, count: rows.filter((r) => r.date === ds).length });
  }

  return NextResponse.json({
    success: true,
    data: {
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      doctorCount,
      studentCount,
      servicesTotal: 11,
      recentAppointments: (recentRows || []).map((r) => mapAppointmentRow(r as AppointmentRow)),
      upcomingAppointments: (upcomingRows || []).map((r) => mapAppointmentRow(r as AppointmentRow)),
      dailyTrends: trendDays,
    },
  });
}
