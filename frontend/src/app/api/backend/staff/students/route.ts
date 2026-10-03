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

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const query = (searchParams.get("query") || searchParams.get("search") || "").trim();

  const supabase = getSupabaseAdmin();

  // Check if profiles table exists
  const { error: checkError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "STUDENT")
    .limit(1);

  if (checkError && (checkError.code === "42P01" || checkError.message?.includes("does not exist"))) {
    return NextResponse.json({
      success: true,
      data: {
        students: [],
        total: 0,
        page,
        pageSize,
        notice:
          "profiles table not found — run migration 20261003000000_create_profiles_table.sql on Supabase.",
      },
    });
  }

  let profilesQuery = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "STUDENT")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (query) {
    profilesQuery = profilesQuery.or(
      `email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,student_id.ilike.%${query}%`,
    );
  }

  const { data, error, count } = await profilesQuery;
  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  const students = (data || []).map((p) => ({
    id: p.id,
    firstName: p.first_name || "",
    lastName: p.last_name || "",
    otherNames: "",
    studentId: p.student_id || "",
    email: p.email,
    phone: p.phone || "",
    program: "",
    gender: "",
    isResident: "",
    isActive: p.is_active,
    createdAt: p.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: { students, total: count ?? students.length, page, pageSize },
  });
}
