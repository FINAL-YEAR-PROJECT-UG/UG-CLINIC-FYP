import { NextRequest, NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Registration endpoint is active. Use POST to register a new user.",
      endpoint: "/api/backend/auth/register",
    },
    { status: 200 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, GET, OPTIONS",
    },
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
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY;

    // If Supabase credentials are configured, use supabase-js client to sign up
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data, error } = await supabase.auth.signUp({
        email: String(email).trim().toLowerCase(),
        password: String(password),
        options: {
          data: {
            firstName: firstName ? String(firstName).trim() : "",
            lastName: lastName ? String(lastName).trim() : "",
            otherNames: otherNames ? String(otherNames).trim() : null,
            studentId: studentId ? String(studentId).trim() : null,
            phone: phone ? String(phone).trim() : null,
            gender: gender ?? null,
            isResident: isResident ?? null,
            program: program ?? null,
            role: "STUDENT",
          },
        },
      });

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
          },
          { status: error.status || 400 }
        );
      }

      const user = data.user;
      const formattedUser = {
        id: user?.id,
        email: user?.email,
        firstName: user?.user_metadata?.firstName || firstName,
        lastName: user?.user_metadata?.lastName || lastName,
        otherNames: user?.user_metadata?.otherNames || otherNames,
        studentId: user?.user_metadata?.studentId || studentId,
        phone: user?.user_metadata?.phone || phone,
        gender: user?.user_metadata?.gender || gender,
        isResident: user?.user_metadata?.isResident || isResident,
        program: user?.user_metadata?.program || program,
        role: user?.user_metadata?.role || "STUDENT",
        isActive: true,
      };

      // data.session is null when Supabase has email confirmation enabled.
      const requiresEmailConfirmation = !data.session;

      return NextResponse.json(
        {
          success: true,
          message: requiresEmailConfirmation
            ? "Registration successful. Please check your email to confirm your account."
            : "Registration successful",
          requiresEmailConfirmation,
          user: formattedUser,
          data: {
            user: formattedUser,
            session: data.session,
          },
        },
        { status: 201 }
      );
    }

    // Fallback: Forward to configured backend URL (e.g. Express backend)
    const apiBaseUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005/api"
    ).replace(/\/+$/, "");
    const backendUrl = `${apiBaseUrl}/auth/register`;
    const headers = new Headers(request.headers);
    headers.delete("connection");
    headers.delete("content-length");
    headers.delete("cookie");
    headers.delete("host");
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);

    return NextResponse.json(
      data ?? {
        success: false,
        message: "An error occurred during registration",
      },
      { status: upstream.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal registration error",
      },
      { status: 500 }
    );
  }
}
