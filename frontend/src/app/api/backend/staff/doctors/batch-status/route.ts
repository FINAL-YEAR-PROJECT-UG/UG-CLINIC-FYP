import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const DOCTOR_STATUSES = ["AVAILABLE", "BUSY", "ON_LEAVE"] as const;

export async function PATCH(request: NextRequest) {
  try {
    await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: false });
  } catch (e) {
    if (e instanceof AuthzError) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "").toUpperCase();
  if (!DOCTOR_STATUSES.includes(status as (typeof DOCTOR_STATUSES)[number])) {
    return NextResponse.json(
      { success: false, message: `status must be one of: ${DOCTOR_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const doctorIds = body.doctorIds;
  if (doctorIds !== undefined && (!Array.isArray(doctorIds) || doctorIds.some((id) => typeof id !== "string" || !id.trim()))) {
    return NextResponse.json({ success: false, message: "doctorIds must be an array of non-empty IDs" }, { status: 400 });
  }
  if (Array.isArray(doctorIds) && doctorIds.length === 0) {
    return NextResponse.json({ success: false, message: "doctorIds cannot be empty" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("profiles")
    .update({ doctor_status: status, updated_at: new Date().toISOString() })
    .in("role", ["DOCTOR", "ADMIN"])
    .eq("is_active", true);

  if (Array.isArray(doctorIds)) {
    query = query.in("id", [...new Set(doctorIds.map((id: string) => id.trim()))]);
  }

  const { data, error } = await query.select("id");
  if (error) {
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }

  const updatedCount = data?.length ?? 0;
  return NextResponse.json({
    success: true,
    message: `Updated ${updatedCount} doctor${updatedCount === 1 ? "" : "s"} to ${status}.`,
    data: { updatedCount, status },
  });
}
