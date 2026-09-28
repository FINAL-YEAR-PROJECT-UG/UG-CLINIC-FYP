import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export const runtime = "nodejs";

async function forwardToBackend(request: NextRequest, context: RouteContext) {
  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005/api"
  ).replace(/\/+$/, "");
  const { path } = await context.params;
  const backendUrl = `${apiBaseUrl}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const cookie =
    token?.backendSessionCookie ?? request.cookies.get("connect.sid")?.value;
  const headers = new Headers(request.headers);

  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("cookie");
  headers.delete("host");

  if (cookie) {
    headers.set(
      "cookie",
      cookie.startsWith("connect.sid=") ? cookie : `connect.sid=${cookie}`
    );
  }

  try {
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const upstream = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
    const responseHeaders = new Headers();

    upstream.headers.forEach((value, name) => {
      if (
        !["connection", "content-encoding", "content-length", "transfer-encoding", "set-cookie"].includes(name)
      ) {
        responseHeaders.set(name, value);
      }
    });

    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders.set("set-cookie", setCookie);
    }

    return new NextResponse(
      [204, 304].includes(upstream.status) ? null : upstream.body,
      { status: upstream.status, headers: responseHeaders }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Backend service is unavailable" },
      { status: 502 }
    );
  }
}

export const GET = forwardToBackend;
export const POST = forwardToBackend;
export const PUT = forwardToBackend;
export const PATCH = forwardToBackend;
export const DELETE = forwardToBackend;
export const OPTIONS = forwardToBackend;
