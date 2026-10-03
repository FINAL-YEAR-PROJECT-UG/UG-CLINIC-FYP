import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slotId: string }> };

// GET — any staff can read a single slot
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: false });
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const { slotId } = await context.params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("time_slots").select("*").eq("id", slotId).maybeSingle();

  if (error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json({ success: false, message: "Time slot not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: { slot: data } });
}

// PATCH — admin/doctor only; update capacity, status, or times
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireStaffRole(request, { allow: ["ADMIN", "DOCTOR"], requireTrusted: true });
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const { slotId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const allowedFields = ["start_time", "end_time", "capacity", "status", "doctor_name", "service_id", "service_name"] as const;
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }
  updates.updated_at = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("time_slots")
    .update(updates)
    .eq("id", slotId)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  if (!data)
    return NextResponse.json({ success: false, message: "Time slot not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: { slot: data } });
}

// DELETE — admin only; only AVAILABLE slots can be deleted
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireStaffRole(request, { allow: ["ADMIN"], requireTrusted: true });
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const { slotId } = await context.params;
  const supabase = getSupabaseAdmin();

  // Guard: cannot delete a slot that has bookings
  const { data: existing, error: readErr } = await supabase
    .from("time_slots")
    .select("status, booked_count")
    .eq("id", slotId)
    .maybeSingle();

  if (readErr)
    return NextResponse.json({ success: false, message: readErr.message }, { status: 500 });
  if (!existing)
    return NextResponse.json({ success: false, message: "Time slot not found" }, { status: 404 });
  if ((existing.booked_count ?? 0) > 0)
    return NextResponse.json(
      { success: false, message: "Cannot delete a slot that has bookings. Cancel the appointments first." },
      { status: 409 },
    );

  const { error } = await supabase.from("time_slots").delete().eq("id", slotId);
  if (error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Time slot deleted" });
}
