export interface BuildHeadersOptions {
  cookie?: string;
  backendUrl: string;
  supabaseKey?: string;
  supabaseUrl?: string;
}

export function buildUpstreamHeaders(
  incomingHeaders: Headers,
  options?: BuildHeadersOptions
): Headers {
  const headers = new Headers(incomingHeaders);

  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("cookie");
  headers.delete("host");

  if (options?.cookie) {
    headers.set(
      "cookie",
      options.cookie.startsWith("connect.sid=")
        ? options.cookie
        : `connect.sid=${options.cookie}`
    );
  }

  const supabaseKey =
    options?.supabaseKey ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (supabaseKey) {
    if (!headers.has("apikey")) {
      headers.set("apikey", supabaseKey);
    }

    const supabaseUrl =
      options?.supabaseUrl ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL;

    const isSupabase =
      (Boolean(options?.backendUrl) && options!.backendUrl.includes("supabase.co")) ||
      Boolean(
        supabaseUrl &&
          options?.backendUrl &&
          options.backendUrl.startsWith(supabaseUrl.replace(/\/+$/, ""))
      );

    if (isSupabase && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${supabaseKey}`);
    }
  }

  return headers;
}
