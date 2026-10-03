import { NextRequest, NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";
import { getEmailRedirectTo } from "@/lib/authUrl";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Registration endpoint is active. Use POST to register a new user.",
      endpoint: "/api/backend/auth/register",
    },
    { status: 200 },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "POST, GET, OPTIONS" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      email,
      password,
      firstName,
      lastName,
      otherNames,
      studentId,
      phone,
      gender,
      isResident,
      program,
      // body.role is SILENTLY IGNORED — we always set STUDENT via service role
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

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
            "Registration service unavailable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL not configured.",
        },
        { status: 503 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const origin =
      (request as unknown as { nextUrl?: { origin: string } }).nextUrl?.origin ||
      (request.url ? new URL(request.url).origin : undefined);
    const emailRedirectTo = getEmailRedirectTo(origin, "/auth/callback");

    const userMetadata: Record<string, unknown> = {
      firstName: firstName ? String(firstName).trim() : "",
      lastName: lastName ? String(lastName).trim() : "",
      otherNames: otherNames ? String(otherNames).trim() : null,
      studentId: studentId ? String(studentId).trim() : null,
      phone: phone ? String(phone).trim() : null,
      gender: gender ?? null,
      isResident: isResident ?? null,
      program: program ?? null,
      role: "STUDENT", // display-only in user_metadata
    };

    // Use service role to create user with STUDENT role forced in app_metadata
    const adminClient = getSupabaseAdmin();
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: false, // will send confirmation email below
      app_metadata: { role: "STUDENT" }, // authorization source of truth
      user_metadata: userMetadata,
    });

    if (createError) {
      return NextResponse.json(
        { success: false, message: createError.message },
        { status: createError.status || 400 },
      );
    }

    const createdUser = createData.user;

    // Mirror to public.profiles (non-fatal if table doesn't exist yet)
    try {
      await adminClient.from("profiles").upsert(
        {
          id: createdUser.id,
          email: normalizedEmail,
          role: "STUDENT",
          first_name: userMetadata.firstName as string | null,
          last_name: userMetadata.lastName as string | null,
          phone: (userMetadata.phone as string | null) || null,
          student_id: (userMetadata.studentId as string | null) || null,
          is_active: true,
        },
        { onConflict: "id" },
      );
    } catch {
      // profiles table may not exist yet — non-fatal
    }

    const formattedUser = {
      id: createdUser.id,
      email: createdUser.email,
      firstName: userMetadata.firstName,
      lastName: userMetadata.lastName,
      otherNames: userMetadata.otherNames,
      studentId: userMetadata.studentId,
      phone: userMetadata.phone,
      gender: userMetadata.gender,
      isResident: userMetadata.isResident,
      program: userMetadata.program,
      role: "STUDENT",
      isActive: true,
    };

    // Check if project has email confirmation ON by trying to sign in
    // (service-role createUser does not create a session)
    if (createdUser.email_confirmed_at) {
      // Email confirmation OFF — sign in and return session
      const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: signInData } = await anonClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: String(password),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Registration successful",
          requiresEmailConfirmation: false,
          user: formattedUser,
          data: { user: formattedUser, session: signInData?.session ?? null },
        },
        { status: 201 },
      );
    }

    // Email confirmation ON — send confirmation email via public client resend
    try {
      const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await anonClient.auth.resend({ type: "signup", email: normalizedEmail, options: { emailRedirectTo } });
    } catch {
      // non-fatal — user was created, confirmation email may still go out
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please check your email to confirm your account.",
        requiresEmailConfirmation: true,
        user: formattedUser,
        data: { user: formattedUser, session: null },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal registration error",
      },
      { status: 500 },
    );
  }
}
