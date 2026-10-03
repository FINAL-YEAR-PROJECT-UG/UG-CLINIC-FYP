/**
 * Staff invitation email template renderer.
 * Returns { subject, htmlBody, textBody } — caller passes to sendEmail().
 */

export interface StaffInviteParams {
  recipientEmail: string;
  role: string;
  actionLink: string;
  inviterFirstName?: string;
  inviterLastName?: string;
  inviterEmail?: string;
  expiresHours?: number;
  firstName?: string;
  lastName?: string;
}

function roleLabel(role: string): string {
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return "Administrator";
  if (r === "DOCTOR") return "Doctor";
  if (r === "RECEPTIONIST") return "Clinician / Receptionist";
  return role;
}

export function renderStaffInvite(params: StaffInviteParams): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const {
    recipientEmail,
    role,
    actionLink,
    inviterFirstName,
    inviterLastName,
    inviterEmail,
    expiresHours = 24,
    firstName,
    lastName,
  } = params;

  const displayRole = roleLabel(role);
  const recipientName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || recipientEmail;

  const inviterName =
    inviterFirstName && inviterLastName
      ? `${inviterFirstName} ${inviterLastName}`
      : inviterFirstName || inviterEmail || "University of Ghana Clinic";

  const subject = `[UG Clinic] Staff Access Invitation — ${displayRole} Role`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 12px;
               border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 40px; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; }
    .header p  { margin: 4px 0 0; color: #93c5fd; font-size: 13px; }
    .badge { display: inline-block; background: rgba(59,130,246,0.25); color: #93c5fd;
             border: 1px solid rgba(147,197,253,0.4); border-radius: 999px;
             padding: 2px 10px; font-size: 11px; font-weight: 700; letter-spacing: .05em;
             text-transform: uppercase; margin-bottom: 12px; }
    .body { padding: 32px 40px; color: #334155; font-size: 15px; line-height: 1.65; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: #1e3a8a; color: #fff;
              text-decoration: none; padding: 14px 32px; border-radius: 8px;
              font-weight: 700; font-size: 15px; }
    .expire { background: #fefce8; border: 1px solid #fde047; border-radius: 8px;
              padding: 12px 16px; font-size: 13px; color: #713f12; margin: 24px 0; }
    .footer { background: #f1f5f9; padding: 20px 40px; font-size: 12px; color: #64748b;
              text-align: center; border-top: 1px solid #e2e8f0; }
    .link-fallback { word-break: break-all; color: #3b82f6; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="badge">Staff Invitation</span>
      <h1>University of Ghana Clinic</h1>
      <p>Secure Staff Portal Access</p>
    </div>
    <div class="body">
      <p>Hello ${recipientName},</p>
      <p>
        You have been invited to join the <strong>University of Ghana Health Services</strong>
        staff portal as a <strong>${displayRole}</strong>.
        ${inviterName ? `This invitation was sent by <strong>${inviterName}</strong>.` : ""}
      </p>
      <div class="cta">
        <a href="${actionLink}">Accept Invitation &amp; Set Password</a>
      </div>
      <div class="expire">
        ⏰ This invitation link expires in <strong>${expiresHours} hours</strong>.
        If it expires, contact your administrator for a new invitation.
      </div>
      <p>
        If the button above does not work, copy and paste this link into your browser:
      </p>
      <p class="link-fallback">${actionLink}</p>
      <p>
        If you did not expect this invitation, please ignore this email.
        No account will be created unless you click the link above.
      </p>
    </div>
    <div class="footer">
      University of Ghana Clinic · Staff Access Invitation<br />
      This is an automated message — please do not reply.
    </div>
  </div>
</body>
</html>`;

  const textBody = `University of Ghana Clinic — Staff Access Invitation
=====================================================

Hello ${recipientName},

You have been invited to join the University of Ghana Health Services staff portal
as a ${displayRole}.
${inviterName ? `Invited by: ${inviterName}` : ""}

Accept your invitation and set your password here:
${actionLink}

This link expires in ${expiresHours} hours.

If you did not expect this invitation, please ignore this email.

---
University of Ghana Clinic · Staff Access Invitation
`;

  return { subject, htmlBody, textBody };
}
