import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Custom proxy for route protection
 * Since we're using custom session-based auth (not NextAuth),
 * this proxy checks for session cookies and redirects unauthenticated users
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('connect.sid');

  // If no session cookie and trying to access protected route, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check for staff routes
  if (staffRoutes.some(route => pathname.startsWith(route))) {
    // Staff routes need additional role checking via API
    // This is a basic check; detailed role verification happens in API calls
    return NextResponse.next();
  }

  // Check for student routes
  if (studentRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
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
