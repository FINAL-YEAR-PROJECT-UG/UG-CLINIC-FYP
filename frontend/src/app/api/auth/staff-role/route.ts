import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, STAFF_ROLES, requireStaffRole } from "@/lib/staffAuthz";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const caller = await requireStaffRole(request, { allow: STAFF_ROLES, requireTrusted: true });
    return NextResponse.json({
      success: true,
      role: caller.role,
      firstName: caller.firstName ?? null,
      lastName: caller.lastName ?? null,
      email: caller.email ?? null,
    });
  } catch (e) {
    if (e instanceof AuthzError) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : "Role lookup failed" },
      { status: 500 },
    );
  }
}
