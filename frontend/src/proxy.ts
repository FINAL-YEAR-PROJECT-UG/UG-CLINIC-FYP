import { NextResponse } from 'next/server.js';
import type { NextRequest } from 'next/server.js';
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
  '/auth/callback', // Allow public access to auth callback for confirmation
];

const staffRoutes = [
  '/staff',
];

const studentRoutes = [
  '/dashboard',
  '/demo-booking',
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
  const supabaseRole =
    typeof appMetadata?.role === 'string' ? appMetadata.role.toUpperCase() : undefined;
  const hasSupabaseSession = typeof claims?.sub === 'string';

  // Supabase app_metadata.role is authoritative when a Supabase session exists.
  // NextAuth inline role is a fallback only when no Supabase session is present.
  let userRole: string | undefined;
  if (hasSupabaseSession) {
    userRole = supabaseRole ?? 'STUDENT';
  } else {
    const naRole = (token?.user as Record<string, unknown> | undefined)
      ?.role as string | undefined;
    userRole = naRole?.toUpperCase() ?? supabaseRole;
  }

  const isStaffPath = staffRoutes.some((route) => pathname.startsWith(route));
  const isStudentPath = studentRoutes.some((route) => pathname.startsWith(route));

  // Protect staff routes: require authenticated session with trusted staff role
  if (isStaffPath) {
    if (!token && !sessionCookie && !hasSupabaseSession) {
      const staffLoginUrl = new URL('/staff-portal-access', request.url);
      staffLoginUrl.searchParams.set('redirect', pathname);
      return preserveSupabaseSession(NextResponse.redirect(staffLoginUrl), supabaseResponse);
    }
    if (!userRole || !STAFF_ROLES.includes(userRole)) {
      // Authenticated but wrong role: redirect with error + redirect param so
      // user can re-authenticate as staff and return to intended page.
      const redirectUrl = new URL('/staff-portal-access', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized');
      redirectUrl.searchParams.set('redirect', pathname);
      return preserveSupabaseSession(NextResponse.redirect(redirectUrl), supabaseResponse);
    }
    return supabaseResponse;
  }

  // Protect student routes: require authenticated session with STUDENT role
  if (isStudentPath) {
    if (!token && !sessionCookie && !hasSupabaseSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return preserveSupabaseSession(NextResponse.redirect(loginUrl), supabaseResponse);
    }
    if (userRole && userRole !== 'STUDENT') {
      return preserveSupabaseSession(
        NextResponse.redirect(new URL('/staff/overview', request.url)),
        supabaseResponse
      );
    }
    return supabaseResponse;
  }

  // Default protected routes
  if (!token && !sessionCookie && !hasSupabaseSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return preserveSupabaseSession(NextResponse.redirect(loginUrl), supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:css|js|mjs|map|json|webmanifest|xml|txt|svg|png|jpe?g|gif|webp|avif|ico|mp4|webm|mov|mp3|wav|ogg|woff2?|ttf|otf|pdf)$).*)',
  ],
};
