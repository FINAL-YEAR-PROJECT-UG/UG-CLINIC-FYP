"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import UGLogo from './UGLogo';
import { Home, Info, CalendarDays, BookOpen, Phone, Menu, X } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { normalizeRole, isStaffRole } from '@/lib/utils';

const NAV_LINKS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Services', href: '/services', icon: CalendarDays },
  { name: 'Health Resources', href: '/resources', icon: BookOpen },
  { name: 'Contact', href: '/contact', icon: Phone },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = normalizeRole(user?.role);
  const isStaff = isAuthenticated && isStaffRole(userRole);

  const navLinks = useMemo(() => NAV_LINKS, []);

  const bookingHref = isStaff ? '/staff/appointments' : '/login';
  const bookingCta = isStaff ? 'Manage Appointments' : 'Book Appointment';
  const homeHref = '/';

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      if (pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      e.preventDefault();
      router.push('/');
    },
    [router, pathname]
  );

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div onClick={handleLogoClick} className="cursor-pointer">
            <UGLogo size="md" href={homeHref} />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={link.href !== '/'}
                  className={`font-inter text-sm font-medium transition-all duration-200 ease-out flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#1e3a8a] border-b-2 border-[#1e3a8a] pb-1 font-semibold'
                      : 'text-gray-600 hover:text-[#1e3a8a] hover:scale-[1.03] active:scale-[0.98]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={bookingHref}
              className="hidden sm:inline-flex font-inter bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-xl px-6 py-2.5 transition-all duration-200 ease-out hover:shadow-lg active:scale-[0.97] items-center justify-center text-sm font-medium"
            >
              {bookingCta}
            </Link>

            <button
              type="button"
              className="md:hidden p-2 text-gray-600 hover:text-[#1e3a8a] transition-colors"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-[fadeSlideDown_200ms_ease-out]">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={link.href !== '/'}
                    className={`font-inter text-sm font-medium transition-all duration-200 ease-out flex items-center gap-2 px-2 py-2 rounded-lg ${
                      isActive
                        ? 'text-[#1e3a8a] bg-blue-50 font-semibold'
                        : 'text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50 active:bg-blue-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
              <Link
                href={bookingHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 w-full font-inter bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-xl px-6 py-2.5 transition-all duration-200 ease-out hover:shadow-lg active:scale-[0.98] inline-flex items-center justify-center text-sm font-medium"
              >
                {bookingCta}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
