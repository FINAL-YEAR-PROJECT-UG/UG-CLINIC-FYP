import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// GET /api/backend/appointments/timeslots
// Query params: date, doctorId, status, page, pageSize
export async function GET(request: NextRequest) {
  try {
    await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: false });
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Database not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "100", 10)));
  const date = searchParams.get("date");
  const doctorId = searchParams.get("doctorId");
  const serviceId = searchParams.get("serviceId");
  const status = searchParams.get("status");

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("time_slots")
    .select("*", { count: "exact" })
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (date) query = query.eq("date", date);
  if (doctorId) query = query.eq("doctor_id", doctorId);
  if (serviceId) query = query.eq("service_id", serviceId);
  if (status && status !== "all") query = query.eq("status", status.toUpperCase());

  const { data, error, count } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return NextResponse.json(
        { success: false, message: "Time slots are not configured. Apply the Supabase time-slots migration." },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }

  // Map snake_case DB columns → camelCase for the frontend
  const timeSlots = (data || []).map((row: {
    id: string;
    service_id?: string | null;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    is_available?: boolean | null;
    capacity?: number | null;
    max_bookings?: number | null;
    booked_count?: number | null;
    current_bookings?: number | null;
    service_name?: string | null;
  }) => ({
    id: row.id,
    serviceId: row.service_id ?? null,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    isAvailable: row.status === 'AVAILABLE' || row.is_available === true,
    maxBookings: row.capacity ?? row.max_bookings ?? 1,
    currentBookings: row.booked_count ?? row.current_bookings ?? 0,
    service: row.service_name ? { id: row.service_id ?? '', name: row.service_name } : undefined,
  }));

  return NextResponse.json({
    success: true,
    data: { timeSlots, total: count ?? 0, page, pageSize },
  });
}

// POST /api/backend/appointments/timeslots
// Body: { date, start_time, end_time, doctor_id, doctor_name, service_id?, service_name?, capacity? }
export async function POST(request: NextRequest) {
  try {
    await requireStaffRole(request, { allow: ["ADMIN", "DOCTOR"], requireTrusted: true });
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const { date, start_time, end_time, doctor_id, doctor_name, service_id, service_name, capacity } = body;

  if (!date || !start_time || !end_time || !doctor_id) {
    return NextResponse.json(
      { success: false, message: "date, start_time, end_time, and doctor_id are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("time_slots")
    .insert({
      date,
      start_time,
      end_time,
      doctor_id,
      doctor_name: doctor_name || null,
      service_id: service_id || null,
      service_name: service_name || null,
      capacity: capacity ?? 1,
      status: "AVAILABLE",
      booked_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { slot: data } }, { status: 201 });
}
