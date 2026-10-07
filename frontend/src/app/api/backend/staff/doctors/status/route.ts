import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const DOCTOR_STATUSES = ["AVAILABLE", "BUSY", "ON_LEAVE"] as const;

export async function PATCH(request: NextRequest) {
  let identity;
  try {
    identity = await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: false });
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

  const doctorId = typeof body.doctorId === "string" && body.doctorId.trim()
    ? body.doctorId.trim()
    : identity.userId;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({ doctor_status: status, updated_at: new Date().toISOString() })
    .eq("id", doctorId)
    .in("role", ["DOCTOR", "ADMIN"])
    .eq("is_active", true)
    .select("id, doctor_status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, message: "Active doctor not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Doctor status updated", data: { doctor: data } });
}
