import { NextRequest, NextResponse } from "next/server.js";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

/**
 * Supabase Auth callback handler.
 *
 * Supabase email-confirmation links redirect to
 *   <site_url>/api/auth/callback?code=<pkce_code>
 *
 * Without this route the request falls through to NextAuth's catch-all
 * which returns: "Callback for provider type credentials not supported"
 *
 * This handler exchanges the PKCE `code` for a session, writes the session
 * cookies onto the redirect response, and forwards the user to /dashboard
 * (or /login on error).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    // No code — not a Supabase callback; send to login.
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[auth/callback] Supabase env vars are not configured.");
    return NextResponse.redirect(`${origin}/login?error=configuration`);
  }

  const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return response;
}
