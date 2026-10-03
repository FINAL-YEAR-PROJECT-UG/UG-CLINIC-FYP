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
