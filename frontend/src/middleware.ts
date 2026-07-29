import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected booking routes that require authentication (NextAuth session)
const PROTECTED_BOOKING_ROUTES = ['/demo-booking'];

// Public routes that should never be redirected
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/services',
  '/resources',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/staff-portal-access',
  '/verify-otp',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this is a protected booking route
  const isProtectedBookingRoute = PROTECTED_BOOKING_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // If not a protected route, allow access
  if (!isProtectedBookingRoute) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
    });

    if (!token) {
      // Allow request to proceed to client-side route guard (which uses Zustand auth store)
      return NextResponse.next();
    }

    // Check if user has appropriate role for the route
    const userRole = token.user?.role?.toUpperCase();

    // Student booking route requires student role
    if (pathname.startsWith('/demo-booking')) {
      if (userRole !== 'STUDENT') {
        // User is not student, redirect to appropriate route
        const staffRoles = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];
        if (userRole && staffRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/staff/appointments', req.url));
        }
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Authenticated and has correct role - allow access
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware auth check failed:', error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: ['/demo-booking/:path*'],
};
