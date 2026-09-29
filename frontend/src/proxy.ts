import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Protect private pages using NextAuth sessions, with Express sessions retained for staff login.
 */

const publicRoutes = [
  '/',
  '/about',
  '/services',
  '/resources',
  '/contact',
  '/accessibility',
  '/privacy',
  '/terms',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/staff-portal-access',
  '/demo-booking', // Allow public access to booking demo
];

const staffRoutes = [
  '/staff',
];

const studentRoutes = [
  '/dashboard',
];

const STAFF_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];

function preserveSupabaseSession(response: NextResponse, supabaseResponse: NextResponse) {
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options);
  });

  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = supabaseResponse.headers.get(header);
    if (value) response.headers.set(header, value);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response: supabaseResponse, claims } = await updateSession(request);

  const isPublicRoute = publicRoutes.some((route) =>
    route === '/'
      ? pathname === '/'
      : pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return supabaseResponse;
  }

  const [token, sessionCookie] = await Promise.all([
    getToken({ req: request, secret: process.env.NEXTAUTH_SECRET }),
    Promise.resolve(request.cookies.get('connect.sid')),
  ]);
  const appMetadata = claims?.app_metadata as { role?: unknown } | undefined;
  const supabaseRole = typeof appMetadata?.role === 'string'
    ? appMetadata.role.toUpperCase()
    : undefined;
  const userRole = token?.user?.role?.toUpperCase() ?? supabaseRole;
  const hasSupabaseSession = typeof claims?.sub === 'string';

  if (!token && !sessionCookie && !hasSupabaseSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return preserveSupabaseSession(NextResponse.redirect(loginUrl), supabaseResponse);
  }

  if (staffRoutes.some((route) => pathname.startsWith(route)) && !sessionCookie &&
      !STAFF_ROLES.includes(userRole ?? '')) {
    return preserveSupabaseSession(
      NextResponse.redirect(new URL('/staff-portal-access', request.url)),
      supabaseResponse
    );
  }

  if (studentRoutes.some((route) => pathname.startsWith(route)) && userRole && userRole !== 'STUDENT') {
    return preserveSupabaseSession(
      NextResponse.redirect(new URL('/login', request.url)),
      supabaseResponse
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:css|js|mjs|map|json|webmanifest|xml|txt|svg|png|jpe?g|gif|webp|avif|ico|mp4|webm|mov|mp3|wav|ogg|woff2?|ttf|otf|pdf)$).*)',
  ],
};
