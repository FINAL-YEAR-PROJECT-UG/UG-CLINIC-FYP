import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server.js";

export type SessionIdentity = {
  userId: string | null;
  email: string | null;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

const STAFF_ROLES = new Set(["ADMIN", "DOCTOR", "RECEPTIONIST"]);
const APPROVER_ROLES = new Set(["ADMIN", "DOCTOR"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export async function getSessionIdentity(
  request: NextRequest,
): Promise<SessionIdentity | null> {
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

    return {
      userId,
      email: email ? String(email).trim().toLowerCase() : null,
      studentId: (user?.studentId as string | undefined) || null,
      firstName: (user?.firstName as string | undefined) || null,
      lastName: (user?.lastName as string | undefined) || null,
      role: String(user?.role || "STUDENT").toUpperCase(),
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

/** PostgREST `or` filter for matching a student without trusting a client-supplied role. */
export function identityMatchFilter(identity: SessionIdentity): string {
  const parts: string[] = [];
  const quote = (value: string) => `"${value.replaceAll('"', "")}"`;
  if (identity.userId) parts.push(`user_id.eq.${quote(identity.userId)}`);
  if (identity.email) parts.push(`patient_email.eq.${quote(identity.email)}`);
  if (identity.studentId) parts.push(`student_id.eq.${quote(identity.studentId)}`);
  return parts.join(",");
}
