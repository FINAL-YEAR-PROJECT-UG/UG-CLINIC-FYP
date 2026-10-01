import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type SupabaseClaims = Record<string, unknown>;

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  claims: SupabaseClaims | null;
}> {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { response, claims: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(cacheHeaders).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims();
    return {
      response,
      claims: error ? null : ((data?.claims as SupabaseClaims | null | undefined) ?? null),
    };
  } catch {
    return { response, claims: null };
  }
}
