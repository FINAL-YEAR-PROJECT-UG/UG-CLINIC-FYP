import { NextRequest, NextResponse } from "next/server.js";
import { getSessionIdentity, isStaffRole } from "@/lib/sessionIdentity";
import { AuthzError, requireStaffRole, STAFF_ROLES } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const identity = await getSessionIdentity(request);
  if (!identity?.userId && !identity?.email) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Appointments database is not configured." },
      { status: 503 },
    );
  }

  // Determine if caller is staff (server-revalidated via Supabase app_metadata)
  let isStaff = identity?.role ? isStaffRole(identity.role) : false;
  if (!isStaff) {
    try {
      await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: true });
      isStaff = true;
    } catch (e) {
      if (e instanceof AuthzError && e.status === 403) {
        isStaff = false;
      } else if (e instanceof AuthzError && e.status === 401) {
        isStaff = false;
      } else {
        // Config/network error — propagate
        return NextResponse.json(
          { success: false, message: e instanceof Error ? e.message : "Authorization error" },
          { status: 500 },
        );
      }
    }
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();
  const { data: existing, error: readError } = await supabase
    .from("appointments")
    .select("id, user_id, patient_email, status")
    .eq("id", id)
    .maybeSingle();

  if (readError || !existing) {
    return NextResponse.json(
      { success: false, message: readError?.message || "Appointment not found" },
      { status: readError ? 500 : 404 },
    );
  }

  // Staff can cancel any appointment; patients can only cancel their own
  const ownsRecord =
    isStaff ||
    (identity.userId && existing.user_id === identity.userId) ||
    (identity.email && existing.patient_email === identity.email);

  if (!ownsRecord) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "CANCELLED",
      notes: [existing.status, body.cancellationReason, body.cancellationNote]
        .filter(Boolean)
        .join(" | "),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Appointment cancelled",
  });
}
