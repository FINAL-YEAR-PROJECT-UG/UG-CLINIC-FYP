import { NextResponse } from "next/server.js";

export const runtime = "nodejs";

/**
 * Catch-all for unmatched /api/backend/* routes.
 * The Vercel app stores clinic data in Supabase and does not proxy to Railway/Prisma.
 */
async function disabled() {
  return NextResponse.json(
    {
      success: false,
      message:
        "This endpoint is not available on the Vercel app. Appointments, registration, and auth run against Supabase — the Railway/Prisma backend is not used here.",
    },
    { status: 404 },
  );
}

export const GET = disabled;
export const POST = disabled;
export const PUT = disabled;
export const PATCH = disabled;
export const DELETE = disabled;
export const OPTIONS = disabled;
