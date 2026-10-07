import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RepeatMode = "none" | "daily" | "weekdays";

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function eachDayInRange(startDate: string, endDate: string, mode: RepeatMode): string[] {
  const days: string[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    const dayOfWeek = new Date(cur + "T00:00:00Z").getUTCDay(); // 0=Sun, 6=Sat
    if (mode === "none") {
      days.push(cur);
      break;
    } else if (mode === "daily") {
      days.push(cur);
    } else if (mode === "weekdays" && dayOfWeek >= 1 && dayOfWeek <= 5) {
      days.push(cur);
    }
    cur = addDays(cur, 1);
    if (days.length > 365) break; // safety cap
  }
  return days;
}

// POST /api/backend/appointments/timeslots/batch
// Body: {
//   doctor_id, doctor_name?, service_id?, service_name?,
//   start_date, end_date,
//   repeat: "none"|"daily"|"weekdays",
//   slots: [{ start_time, end_time, capacity? }]
// }
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
  const {
    doctor_id,
    doctor_name,
    service_id,
    service_name,
    start_date,
    end_date,
    repeat = "none",
    slots = [],
  } = body;

  if (!doctor_id || !start_date || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json(
      { success: false, message: "doctor_id, start_date, and at least one slot definition are required" },
      { status: 400 },
    );
  }

  const endDateResolved = end_date || start_date;
  const days = eachDayInRange(start_date, endDateResolved, repeat as RepeatMode);
  const now = new Date().toISOString();

  const rows = days.flatMap((date) =>
    slots.map((slot: { start_time: string; end_time: string; capacity?: number }) => ({
      date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      doctor_id,
      doctor_name: doctor_name || null,
      service_id: service_id || null,
      service_name: service_name || null,
      capacity: slot.capacity ?? 1,
      booked_count: 0,
      status: "AVAILABLE",
      created_at: now,
      updated_at: now,
    })),
  );

  if (rows.length === 0) {
    return NextResponse.json({ success: false, message: "No slots to create for given date range/repeat pattern" }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ success: false, message: "Batch too large: max 500 slots per request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("time_slots")
    .insert(rows)
    .select("id, date, start_time, end_time, doctor_id, capacity, status");

  if (error) {
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, data: { created: data?.length ?? rows.length, slots: data } },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest) {
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
  const date = typeof body.date === "string" ? body.date : "";
  const action = String(body.action || "").toUpperCase();
  const sessionFilter = String(body.sessionFilter || "ALL").toUpperCase();
  const fromTime = typeof body.fromTime === "string" ? body.fromTime.slice(0, 5) : "";
  const actions = ["OPEN", "CLOSE", "EXPAND", "REDUCE", "RESET", "SYNC_DOCTORS"];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !actions.includes(action)) {
    return NextResponse.json({ success: false, message: "A valid date and supported action are required" }, { status: 400 });
  }
  if (!["ALL", "MORNING", "AFTERNOON"].includes(sessionFilter)) {
    return NextResponse.json({ success: false, message: "sessionFilter must be ALL, MORNING, or AFTERNOON" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: slots, error: slotsError } = await supabase
    .from("time_slots")
    .select("*")
    .eq("date", date)
    .order("start_time", { ascending: true });
  if (slotsError) {
    return NextResponse.json({ success: false, message: slotsError.message, code: slotsError.code }, { status: 500 });
  }

  let selected = slots || [];
  if (sessionFilter !== "ALL") {
    selected = selected.filter((slot) => {
      const hour = Number(String(slot.start_time).slice(0, 2));
      return sessionFilter === "MORNING" ? hour < 12 : hour >= 12;
    });
  }
  if (fromTime && /^\d{2}:\d{2}$/.test(fromTime)) {
    selected = selected.filter((slot) => String(slot.start_time).slice(0, 5) >= fromTime);
  }

  if (selected.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No time slots matched the requested date and filters.",
      data: { updatedCount: 0, timeSlots: [] },
    });
  }

  let availableDoctorCount: number | undefined;
  if (action === "SYNC_DOCTORS") {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["DOCTOR", "ADMIN"])
      .eq("is_active", true)
      .eq("doctor_status", "AVAILABLE");
    if (error) {
      return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
    }
    availableDoctorCount = count ?? 0;
  }

  const updatedSlots: Record<string, unknown>[] = [];
  const groups = new Map<string, { ids: string[]; updates: Record<string, unknown> }>();
  for (const slot of selected) {
    let updates: Record<string, unknown>;
    if (action === "CLOSE" || action === "OPEN") {
      updates = { status: action === "CLOSE" ? "UNAVAILABLE" : "AVAILABLE" };
    } else {
      const currentCapacity = Number(slot.capacity ?? 1);
      const bookedCount = Number(slot.booked_count ?? 0);
      const requestedCapacity = action === "EXPAND"
        ? currentCapacity + 1
        : action === "REDUCE"
          ? currentCapacity - 1
          : action === "SYNC_DOCTORS"
            ? availableDoctorCount!
            : Number(body.maxBookings ?? 1);
      const capacity = Math.max(bookedCount, requestedCapacity);
      if (!Number.isInteger(capacity) || capacity < 0) {
        return NextResponse.json({ success: false, message: "maxBookings must be a non-negative integer" }, { status: 400 });
      }
      updates = { capacity };
    }

    const key = JSON.stringify(updates);
    const group = groups.get(key) ?? { ids: [], updates };
    group.ids.push(String(slot.id));
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const { data, error } = await supabase
      .from("time_slots")
      .update({ ...group.updates, updated_at: new Date().toISOString() })
      .in("id", group.ids)
      .select("*");
    if (error) {
      return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
    }
    updatedSlots.push(...(data || []));
  }

  const timeSlots = updatedSlots.map((row) => ({
    id: row.id,
    serviceId: row.service_id ?? null,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    isAvailable: row.status === "AVAILABLE",
    maxBookings: row.capacity ?? 1,
    currentBookings: row.booked_count ?? 0,
    service: row.service_name ? { id: row.service_id ?? "", name: row.service_name } : undefined,
  }));

  return NextResponse.json({
    success: true,
    message: `Updated ${timeSlots.length} time slot${timeSlots.length === 1 ? "" : "s"}.`,
    data: { updatedCount: timeSlots.length, timeSlots },
  });
}
