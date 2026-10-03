import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireAdmin } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/backend/resources/staff
 * Admin-only: lists all provisioned staff members (role != 'STUDENT') from public.profiles.
 *
 * Query params:
 *   role    — filter by role (ADMIN|DOCTOR|RECEPTIONIST)
 *   active  — "true"|"false" filter by is_active
 *   search  — partial match on email, first_name, last_name
 *   page, pageSize
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)));
  const roleFilter = searchParams.get("role")?.toUpperCase();
  const activeFilter = searchParams.get("active");
  const search = searchParams.get("search")?.trim();

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name, student_id, is_active, created_at, updated_at", { count: "exact" })
    .not("role", "eq", "STUDENT")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (roleFilter && ["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(roleFilter))
    query = query.eq("role", roleFilter);
  if (activeFilter === "true") query = query.eq("is_active", true);
  else if (activeFilter === "false") query = query.eq("is_active", false);
  if (search)
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
    );

  const { data, error, count } = await query;
  if (error)
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });

  const staff = (data || []).map((p) => ({
    id: p.id,
    email: p.email,
    role: p.role,
    firstName: p.first_name,
    lastName: p.last_name,
    displayName: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email,
    isActive: p.is_active,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  return NextResponse.json({
    success: true,
    data: { staff, total: count ?? staff.length, page, pageSize },
  });
}

/**
 * PATCH /api/backend/resources/staff
 * Admin-only: update a staff member's role or active status.
 * Body: { userId: string, role?: string, is_active?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    if (e instanceof AuthzError)
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured())
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { userId, role, is_active } = body;

  if (!userId)
    return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });

  const ALLOWED_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (role !== undefined) {
    const normalizedRole = String(role).toUpperCase();
    if (!ALLOWED_ROLES.includes(normalizedRole))
      return NextResponse.json(
        { success: false, message: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` },
        { status: 400 },
      );
    updates.role = normalizedRole;
  }
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const supabase = getSupabaseAdmin();

  // Update profiles table
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, email, role, is_active")
    .single();

  if (profileErr)
    return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  if (!profile)
    return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });

  // Also update app_metadata.role in auth.users via Admin API
  if (role !== undefined) {
    const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: profile.role },
    });
    if (authErr) {
      console.warn("[resources/staff PATCH] app_metadata update failed:", authErr.message);
      // non-fatal — profile is authoritative
    }
  }

  return NextResponse.json({
    success: true,
    message: "Staff member updated",
    data: { staff: profile },
  });
}
