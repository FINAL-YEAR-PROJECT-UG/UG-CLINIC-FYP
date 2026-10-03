import type { NextRequest } from "next/server.js";
import { getSessionIdentity, isStaffRole as baseIsStaffRole } from "@/lib/sessionIdentity";

export class AuthzError extends Error {
  public readonly status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

export const STAFF_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const;
export const DIRECTORY_WRITE_ROLES = ["ADMIN", "DOCTOR"] as const;
export const APPOINTMENT_APPROVER_ROLES = ["ADMIN", "DOCTOR"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AnyRole = StaffRole | "STUDENT" | (string & {});

export function isStaffRole(role: string): boolean {
  return baseIsStaffRole(role);
}

export type RequireStaffOptions = {
  allow: readonly AnyRole[];
  requireTrusted?: boolean;
};

export type StaffIdentity = {
  userId: string;
  email: string;
  role: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
};

async function resolveIdentity(request: NextRequest): Promise<StaffIdentity> {
  const identity = await getSessionIdentity(request);
  if (!identity) {
    throw new AuthzError("Unauthorized: no active session", 401);
  }
  if (!identity.userId) {
    throw new AuthzError("Unauthorized: missing user identifier", 401);
  }
  const email = identity.email;
  if (!email) {
    throw new AuthzError("Unauthorized: missing email", 401);
  }
  return {
    userId: identity.userId,
    email,
    role: String(identity.role || "STUDENT").toUpperCase(),
    studentId: identity.studentId,
    firstName: identity.firstName,
    lastName: identity.lastName,
  };
}

export async function requireStaffRole(
  request: NextRequest,
  options: RequireStaffOptions,
): Promise<StaffIdentity> {
  const identity = await resolveIdentity(request);
  const allowed = new Set((options.allow ?? STAFF_ROLES).map((r) => String(r).toUpperCase()));
  const role = String(identity.role).toUpperCase();
  if (!allowed.has(role)) {
    throw new AuthzError(
      `Forbidden: role ${role} is not allowed. Required one of: ${Array.from(allowed).join(", ")}`,
      403,
    );
  }
  if (options.requireTrusted && !isStaffRole(role)) {
    throw new AuthzError("Forbidden: trusted staff role required", 403);
  }
  return identity;
}

export async function requireAdmin(request: NextRequest): Promise<StaffIdentity> {
  return requireStaffRole(request, { allow: ["ADMIN"], requireTrusted: true });
}

export async function requireAppointmentApprover(
  request: NextRequest,
): Promise<StaffIdentity> {
  return requireStaffRole(request, {
    allow: APPOINTMENT_APPROVER_ROLES,
    requireTrusted: true,
  });
}
