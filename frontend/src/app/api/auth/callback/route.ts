import { NextRequest, NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";

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
 * This handler exchanges the PKCE `code` for a session and redirects
 * the user to the dashboard (or /login on error).
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

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Email confirmed — redirect to the originally requested page (default: /dashboard).
  const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/dashboard`;
  return NextResponse.redirect(redirectUrl);
}
