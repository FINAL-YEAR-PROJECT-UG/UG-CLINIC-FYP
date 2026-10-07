import { NextRequest, NextResponse } from "next/server.js";
import { AuthzError, requireAdmin } from "@/lib/staffAuthz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { renderStaffInvite } from "@/lib/staffInviteEmail";
import sendEmail from "@/lib/email";
import { getAuthCallbackRedirect } from "@/lib/authUrl";

export const runtime = "nodejs";

const VALID_STAFF_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const;
type StaffRole = (typeof VALID_STAFF_ROLES)[number];

function normalizeRole(r: unknown): StaffRole | null {
  const s = String(r || "").toUpperCase().trim();
  return VALID_STAFF_ROLES.includes(s as StaffRole) ? (s as StaffRole) : null;
}

function normalizeEmail(e: unknown): string | null {
  const s = String(e || "").trim().toLowerCase();
  return s.includes("@") ? s : null;
}

async function checkBootstrapSecret(request: NextRequest): Promise<boolean> {
  const setupSecret = process.env.STAFF_SETUP_SECRET;
  if (!setupSecret) return false;
  const incoming = request.headers.get("x-staff-setup-secret");
  return incoming === setupSecret;
}

async function requireAuth(request: NextRequest): Promise<void> {
  const isBootstrap = await checkBootstrapSecret(request);
  if (isBootstrap) return;
  await requireAdmin(request);
}

/** Send branded invitation email. Returns { sent, actionLink (on failure) } */
async function trySendInviteEmail(
  recipientEmail: string,
  role: string,
  actionLink: string,
  inviter?: { firstName?: string; lastName?: string; email?: string },
  recipientFirstName?: string,
  recipientLastName?: string,
): Promise<{ sent: boolean }> {
  try {
    const { subject, htmlBody } = renderStaffInvite({
      recipientEmail,
      role,
      actionLink,
      inviterFirstName: inviter?.firstName,
      inviterLastName: inviter?.lastName,
      inviterEmail: inviter?.email,
      firstName: recipientFirstName,
      lastName: recipientLastName,
    });
    await sendEmail(recipientEmail, subject, htmlBody);
    return { sent: true };
  } catch (error) {
    console.error(
      "[staff invite] Invitation email delivery failed:",
      error instanceof Error ? error.message : error,
    );
    return { sent: false };
  }
}

/** Find existing user by email via paginated listUsers (up to 5000). */
async function findUserByEmail(
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  email: string,
) {
  const perPage = 500;
  let page = 1;
  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthzError) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ success: false, message: "Authorization check failed" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const action = String(body.action || "list").toLowerCase();
  const adminClient = getSupabaseAdmin();
  const recoveryRedirect = getAuthCallbackRedirect(request.nextUrl.origin, {
    type: "recovery",
    next: "/reset-password?from=invite",
  });
  const inviteRedirect = getAuthCallbackRedirect(request.nextUrl.origin, {
    type: "invite",
    next: "/reset-password?from=invite",
  });

  // ─── ACTION: list ──────────────────────────────────────────────────────────
  if (action === "list" || !["invite_or_link", "invite", "create", "assign_role"].includes(action)) {
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(body.perPage || body.pageSize) || 100));
    const query = String(body.query || "").toLowerCase().trim();

    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const staffUsers = (data?.users || [])
      .filter((u) => {
        const role = String(u.app_metadata?.role || "").toUpperCase();
        return VALID_STAFF_ROLES.includes(role as StaffRole);
      })
      .filter((u) => {
        if (!query) return true;
        const meta = u.user_metadata as Record<string, string> | undefined;
        const searchable = [
          u.email,
          meta?.firstName,
          meta?.lastName,
          u.app_metadata?.role,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(query);
      })
      .map((u) => ({
        id: u.id,
        email: u.email,
        role: String(u.app_metadata?.role || "").toUpperCase(),
        firstName: u.user_metadata?.firstName || null,
        lastName: u.user_metadata?.lastName || null,
        phone: u.user_metadata?.phone || null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        emailConfirmedAt: u.email_confirmed_at,
        invitedAt: u.invited_at,
        emailConfirmed: Boolean(u.email_confirmed_at),
      }));

    return NextResponse.json({
      success: true,
      data: { users: staffUsers, total: staffUsers.length, page, pageSize },
    });
  }

  // ─── ACTION: invite_or_link ────────────────────────────────────────────────
  if (["invite_or_link", "invite", "create"].includes(action)) {
    // Reject any password field — invitation-only flow
    if (body.password && String(body.password).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "password is not accepted for staff provisioning. Invitations use the email-only flow — provide email and role only.",
        },
        { status: 400 },
      );
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ success: false, message: "Valid email is required" }, { status: 400 });
    }

    const role = normalizeRole(body.role);
    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid role. Must be one of: ${VALID_STAFF_ROLES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const firstName = String(body.firstName || "").trim() || undefined;
    const lastName = String(body.lastName || "").trim() || undefined;
    const phone = String(body.phone || "").trim() || undefined;
    const resendInvite = Boolean(body.resendInvite);
    const inviter = body.inviter as
      | { firstName?: string; lastName?: string; email?: string }
      | undefined;

    const userMeta: Record<string, unknown> = {
      role,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
    };

    // Check if user already exists
    const existing = await findUserByEmail(adminClient, email);

    if (existing) {
      // Update role in app_metadata (preserving other keys)
      const oldAppMeta = existing.app_metadata as Record<string, unknown> | undefined;
      const previousRole = String(oldAppMeta?.role || "").toUpperCase();

      const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(
        existing.id,
        {
          app_metadata: { ...oldAppMeta, role },
          user_metadata: {
            ...(existing.user_metadata as Record<string, unknown> | undefined),
            ...userMeta,
          },
        },
      );
      if (updateError) {
        return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
      }

      // Mirror to public.profiles
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from("profiles").upsert(
          {
            id: existing.id,
            email,
            role,
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
            is_active: true,
            ...(role === "DOCTOR" || role === "ADMIN" ? { doctor_status: "AVAILABLE" } : {}),
          },
          { onConflict: "id" },
        );
      } catch {
        // profiles table may not exist yet — non-fatal
      }

      const needsInvite = !existing.email_confirmed_at || resendInvite;
      let actionLink: string | undefined;
      let emailSent = false;

      if (needsInvite) {
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: existing.email_confirmed_at ? "recovery" : "invite",
          email,
          options: {
            redirectTo: existing.email_confirmed_at ? recoveryRedirect : inviteRedirect,
          },
        });
        if (!linkError && linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
          const sendResult = await trySendInviteEmail(
            email,
            role,
            actionLink,
            inviter,
            firstName,
            lastName,
          );
          emailSent = sendResult.sent;
        }
      }

      const mode = previousRole !== role ? "role_updated" : "linked";
      const response: Record<string, unknown> = {
        success: !needsInvite || emailSent,
        mode,
        message: needsInvite
          ? emailSent
            ? `Staff account linked and invitation email sent to ${email}`
            : `Staff account linked but invitation email could not be sent`
          : `Staff account role ${mode === "role_updated" ? "updated to " + role : "confirmed"} for ${email}`,
        user: {
          id: updated?.user?.id,
          email,
          role,
          previousRole: previousRole || null,
        },
      };

      // Only expose actionLink when email send FAILED
      if (needsInvite && !emailSent && actionLink) {
        response.actionLink = actionLink;
      }

      return NextResponse.json(response, { status: needsInvite && !emailSent ? 502 : 200 });
    }

    // User does NOT exist — create via generateLink (invite flow)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: userMeta,
        redirectTo: inviteRedirect,
      },
    });

    if (linkError || !linkData?.user) {
      return NextResponse.json(
        { success: false, message: linkError?.message || "Failed to generate invitation link" },
        { status: 500 },
      );
    }

    const newUserId = linkData.user.id;
    const actionLink = linkData.properties?.action_link;

    // CRITICAL: set app_metadata.role — generateLink only writes to user_metadata
    await adminClient.auth.admin.updateUserById(newUserId, {
      app_metadata: { role },
    });

    // Mirror to public.profiles
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("profiles").upsert(
        {
          id: newUserId,
          email,
          role,
          first_name: firstName || null,
          last_name: lastName || null,
          phone: phone || null,
          is_active: true,
          ...(role === "DOCTOR" || role === "ADMIN" ? { doctor_status: "AVAILABLE" } : {}),
        },
        { onConflict: "id" },
      );
    } catch {
      // non-fatal
    }

    let emailSent = false;
    if (actionLink) {
      const sendResult = await trySendInviteEmail(email, role, actionLink, inviter, firstName, lastName);
      emailSent = sendResult.sent;
    }

    const response: Record<string, unknown> = {
      success: emailSent,
      mode: "invited",
      message: emailSent
        ? `Invitation email sent to ${email} as ${role}`
        : `Staff user created but invitation email could not be sent`,
      user: { id: newUserId, email, role },
    };

    // Only expose actionLink when email send FAILED
    if (!emailSent && actionLink) {
      response.actionLink = actionLink;
    }

    return NextResponse.json(response, { status: emailSent ? 201 : 502 });
  }

  // ─── ACTION: assign_role ───────────────────────────────────────────────────
  if (action === "assign_role") {
    const userId = String(body.userId || "").trim();
    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });
    }

    const role = normalizeRole(body.role);
    if (!role) {
      return NextResponse.json(
        { success: false, message: `Invalid role. Must be one of: ${VALID_STAFF_ROLES.join(", ")}` },
        { status: 400 },
      );
    }

    const { data: existing, error: getError } = await adminClient.auth.admin.getUserById(userId);
    if (getError || !existing?.user) {
      return NextResponse.json(
        { success: false, message: getError?.message || "User not found" },
        { status: 404 },
      );
    }

    const oldAppMeta = existing.user.app_metadata as Record<string, unknown> | undefined;
    const previousRole = String(oldAppMeta?.role || "").toUpperCase();

    const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { ...oldAppMeta, role },
    });
    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 400 });
    }

    // Mirror to profiles
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("profiles").upsert(
        {
          id: userId,
          email: existing.user.email!,
          role,
          is_active: true,
          ...(role === "DOCTOR" || role === "ADMIN"
            ? { doctor_status: "AVAILABLE" }
            : { doctor_status: null }),
        },
        { onConflict: "id" },
      );
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      success: true,
      mode: "role_updated",
      previousRole,
      role,
      user: { id: updated?.user?.id, email: updated?.user?.email, role },
    });
  }

  return NextResponse.json(
    { success: false, message: "Invalid action. Must be: list, invite_or_link, or assign_role" },
    { status: 400 },
  );
}
