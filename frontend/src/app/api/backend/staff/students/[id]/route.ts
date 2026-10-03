import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireAdmin } from "@/lib/staffAuthz";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
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

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { success: false, message: "isActive (boolean) is required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: body.isActive })
    .eq("id", id);

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "profiles table not found — run migration 20261003000000_create_profiles_table.sql on Supabase.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, isActive: body.isActive });
}
