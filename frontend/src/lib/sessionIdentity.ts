import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server.js";
import { createClient } from "@supabase/supabase-js";

export type SessionIdentity = {
  userId: string | null;
  email: string | null;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  /** true when role was validated server-side via Supabase app_metadata */
  trustedRole?: boolean;
};

const STAFF_ROLES = new Set(["ADMIN", "DOCTOR", "RECEPTIONIST"]);
const APPROVER_ROLES = new Set(["ADMIN", "DOCTOR"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/** Extract bearer token from Authorization header or Supabase cookie. */
function extractToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7).trim();

  // Supabase client sets sb-*-auth-token cookies
  const allCookies = request.cookies.getAll();
  for (const c of allCookies) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(c.value);
        const at = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
        if (at && typeof at === "string") return at;
      } catch {
        if (c.value && !c.value.startsWith("{")) return c.value;
      }
    }
  }
  return undefined;
}

/** Resolve role from Supabase access token via getUser() (server-side, trusted). */
async function resolveSupabaseIdentity(
  request: NextRequest,
): Promise<SessionIdentity | null> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  if (!supabaseUrl || !anonKey) return null;

  const token = extractToken(request);
  if (!token) return null;

  try {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;

    const user = data.user;
    const appRole =
      typeof user.app_metadata?.role === "string"
        ? user.app_metadata.role.toUpperCase()
        : undefined;
    const metaRole =
      typeof user.user_metadata?.role === "string"
        ? user.user_metadata.role.toUpperCase()
        : undefined;

    // app_metadata.role is the authoritative source (service-role only writes)
    const role = appRole ?? metaRole ?? "STUDENT";

    return {
      userId: user.id,
      email: user.email ? String(user.email).trim().toLowerCase() : null,
      studentId: (user.user_metadata?.studentId as string | undefined) || null,
      firstName: (user.user_metadata?.firstName as string | undefined) || null,
      lastName: (user.user_metadata?.lastName as string | undefined) || null,
      role,
      trustedRole: Boolean(appRole), // trusted only when from app_metadata
    };
  } catch {
    return null;
  }
}

export async function getSessionIdentity(
  request: NextRequest,
): Promise<SessionIdentity | null> {
  // 1. Try Supabase session first (app_metadata.role is authoritative)
  try {
    const supabaseIdentity = await resolveSupabaseIdentity(request);
    if (supabaseIdentity) {
      // If we also have a NextAuth token, use its studentId if Supabase lacks it
      try {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });
        if (token) {
          const user = asRecord(token.user);
          const naStudentId =
            (user?.studentId as string | undefined) ||
            (token.studentId as string | undefined) ||
            null;
          if (!supabaseIdentity.studentId && naStudentId) {
            supabaseIdentity.studentId = naStudentId;
          }
          // Supplement firstName/lastName from NextAuth if missing
          if (!supabaseIdentity.firstName) {
            supabaseIdentity.firstName =
              (user?.firstName as string | undefined) || null;
          }
          if (!supabaseIdentity.lastName) {
            supabaseIdentity.lastName =
              (user?.lastName as string | undefined) || null;
          }
        }
      } catch {
        // NextAuth token is optional; ignore errors
      }
      return supabaseIdentity;
    }
  } catch {
    // fall through to NextAuth
  }

  // 2. Fall back to NextAuth JWT (role not trusted from app_metadata)
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) return null;

    const user = asRecord(token.user);
    const userId =
      (user?.id as string | undefined) ||
      (token.sub as string | undefined) ||
      (token.id as string | undefined) ||
      null;
    const email =
      (user?.email as string | undefined) ||
      (token.email as string | undefined) ||
      null;
    const inlineRole = String(user?.role || "STUDENT").toUpperCase();

    return {
      userId,
      email: email ? String(email).trim().toLowerCase() : null,
      studentId: (user?.studentId as string | undefined) || null,
      firstName: (user?.firstName as string | undefined) || null,
      lastName: (user?.lastName as string | undefined) || null,
      role: inlineRole,
      trustedRole: false, // NextAuth inline role is NOT trusted for authz
    };
  } catch {
    return null;
  }
}

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.has(String(role).toUpperCase());
}

export function canApproveAppointments(role: string): boolean {
  return APPROVER_ROLES.has(String(role).toUpperCase());
}

export function canAccessStudentRecords(role: string): boolean {
  return isStaffRole(role);
}

/** PostgREST `or` filter for matching a student without trusting a client-supplied role. */
export function identityMatchFilter(identity: SessionIdentity): string {
  const parts: string[] = [];
  const quote = (value: string) => `"${value.replaceAll('"', "")}"`;
  if (identity.userId) parts.push(`user_id.eq.${quote(identity.userId)}`);
  if (identity.email) parts.push(`patient_email.eq.${quote(identity.email)}`);
  if (identity.studentId) parts.push(`student_id.eq.${quote(identity.studentId)}`);
  return parts.join(",");
}
