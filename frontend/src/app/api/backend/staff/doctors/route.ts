import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

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

  // Build a count map: doctor_id -> appointment count (non-CANCELLED)
  const { data: apptCounts } = await supabase
    .from("appointments")
    .select("doctor_id")
    .not("doctor_id", "is", null)
    .not("status", "eq", "CANCELLED");

  const countMap: Record<string, number> = {};
  for (const row of apptCounts || []) {
    if (row.doctor_id) {
      countMap[row.doctor_id] = (countMap[row.doctor_id] || 0) + 1;
    }
  }

  // Try profiles table
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["DOCTOR", "ADMIN"])
      .eq("is_active", true);

    if (!error && profiles) {
      const doctors = profiles.map((p) => ({
        id: p.id,
        firstName: p.first_name || "",
        lastName: p.last_name || "",
        email: p.email,
        phone: p.phone || null,
        doctorStatus: p.doctor_status || "AVAILABLE",
        _count: { doctorAppointments: countMap[p.id] || 0 },
      }));

      return NextResponse.json({ success: true, data: { doctors } });
    }
  } catch {
    // profiles table not yet migrated — fall through to auth.admin
  }

  // Fallback: paginated auth.admin.listUsers
  const doctors: unknown[] = [];
  let page = 1;
  while (page <= 5) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      const role = String(u.app_metadata?.role || "").toUpperCase();
      if (role === "DOCTOR" || role === "ADMIN") {
        doctors.push({
          id: u.id,
          firstName: u.user_metadata?.firstName || "",
          lastName: u.user_metadata?.lastName || "",
          email: u.email,
          phone: u.user_metadata?.phone || null,
          doctorStatus: u.app_metadata?.doctorStatus || "AVAILABLE",
          _count: { doctorAppointments: countMap[u.id] || 0 },
        });
      }
    }
    if (data.users.length < 500) break;
    page++;
  }

  return NextResponse.json({ success: true, data: { doctors } });
}
