import { NextRequest, NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VALID_STAFF_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const;
type StaffRole = (typeof VALID_STAFF_ROLES)[number];

async function getRequesterRole(
  request: NextRequest,
  supabaseUrl: string,
  anonKey: string
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token && typeof (request as any).cookies?.getAll === "function") {
    const allCookies: Array<{ name: string; value: string }> = (request as any).cookies.getAll();
    for (const c of allCookies) {
      if (c.name.includes("-auth-token")) {
        try {
          const parsed = JSON.parse(c.value);
          token = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
          if (token) break;
        } catch {
          token = c.value;
          break;
        }
      }
    }
  }

  if (!token) return null;

  try {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return (data.user.app_metadata?.role as string | undefined)?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-side protected staff user management endpoint.
 *
 * Requirements:
 * - Only callable by authenticated users with ADMIN role in app_metadata
 *   (or with a server-configured STAFF_SETUP_SECRET during initial bootstrap).
 * - Uses SUPABASE_SERVICE_ROLE_KEY strictly on the server; NEVER exposes it to the browser.
 * - Stores roles in Supabase app_metadata (tamper-proof from client-side user_metadata edits).
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "";

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Server configuration error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL is not set.",
        },
        { status: 500 }
      );
    }

    // 1. Authorization check: Requester must provide the setup secret OR be an ADMIN
    const setupSecret = process.env.STAFF_SETUP_SECRET;
    const incomingSecret = request.headers.get("x-staff-setup-secret");
    const isSetupAuthorized =
      Boolean(setupSecret) && Boolean(incomingSecret) && incomingSecret === setupSecret;

    if (!isSetupAuthorized) {
      const requesterRole = await getRequesterRole(request, supabaseUrl, anonKey);
      if (requesterRole !== "ADMIN") {
        return NextResponse.json(
          {
            success: false,
            message: "Forbidden: Only administrators can create or assign staff roles.",
          },
          { status: 403 }
        );
      }
    }

    // 2. Parse and validate body
    const body = await request.json();
    const { action, email, password, role, userId, firstName, lastName } = body;

    const normalizedRole = String(role || "").toUpperCase() as StaffRole;
    if (!VALID_STAFF_ROLES.includes(normalizedRole)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid role: "${role}". Must be one of: ${VALID_STAFF_ROLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "create") {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, message: "Email and password are required to create a staff account." },
          { status: 400 }
        );
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password: String(password),
        email_confirm: true, // Staff accounts created by admin are auto-confirmed
        app_metadata: { role: normalizedRole },
        user_metadata: {
          firstName: firstName ? String(firstName).trim() : "",
          lastName: lastName ? String(lastName).trim() : "",
          role: normalizedRole,
        },
      });

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Staff account for ${email} created successfully with role ${normalizedRole}.`,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: normalizedRole,
          },
        },
        { status: 201 }
      );
    }

    if (action === "assign_role") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "userId is required to assign a staff role." },
          { status: 400 }
        );
      }

      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        app_metadata: { role: normalizedRole },
      });

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Role ${normalizedRole} assigned to user ${userId}.`,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: normalizedRole,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Must be "create" or "assign_role".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
