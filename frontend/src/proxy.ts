import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const [token, sessionCookie] = await Promise.all([
    getToken({ req: request, secret: process.env.NEXTAUTH_SECRET }),
    Promise.resolve(request.cookies.get('connect.sid')),
  ]);

  if (!token && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token?.user?.role?.toUpperCase();

  if (staffRoutes.some(route => pathname.startsWith(route)) && token &&
      !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(userRole ?? '')) {
    return NextResponse.redirect(new URL('/staff-portal-access', request.url));
  }

  if (studentRoutes.some(route => pathname.startsWith(route)) && token && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by backend)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
