'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import UGLogo from './UGLogo';
import { Home, Info, CalendarDays, BookOpen, Phone, Menu, X } from '@/components/icons';
import { useMemo, useState, useCallback, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  const userRole = normalizeRole(user?.role);
  const isStaff = isAuthenticated && isStaffRole(userRole);

  const navLinks = useMemo(() => NAV_LINKS, []);

  const bookingHref = !isAuthenticated
    ? '/login'
    : isStaff
    ? '/staff/appointments'
    : '/demo-booking';
  const bookingCta = isStaff ? 'Manage Appointments' : 'Book Appointment';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_16px_-4px_rgba(15,23,42,0.10)]'
          : 'bg-white border-b border-gray-100 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <UGLogo size="md" href="/" />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={link.href !== '/'}
                  className={`
                    relative group flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'text-[#1e3a8a] bg-blue-50/70'
                      : 'text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50/50'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#1e3a8a]' : ''}`} />
                  {link.name}
                  {/* Active indicator */}
                  <span
                    className={`
                      absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full
                      bg-gradient-to-r from-[#1e3a8a] to-[#0EA5E9]
                      transition-all duration-300 origin-left
                      ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}
                    `}
                  />
                </Link>
              );
            })}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href={bookingHref}
              className="
                hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white
                shadow-[0_2px_8px_rgb(15,23,42,0.25)]
                hover:shadow-[0_6px_20px_rgb(30,58,138,0.35)]
                hover:from-[#1e3a8a] hover:to-[#2563EB]
                hover:-translate-y-0.5
                active:translate-y-0 active:scale-[0.98]
                transition-all duration-200
              "
            >
              {bookingCta}
            </Link>

            <button
              type="button"
              className="
                md:hidden p-2 rounded-lg text-gray-600
                hover:text-[#1e3a8a] hover:bg-blue-50
                transition-all duration-200 active:scale-95
              "
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <span className={`block transition-all duration-200 ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 animate-[slideDown_200ms_cubic-bezier(0.4,0,0.2,1)_both]">
            <div className="flex flex-col gap-1 pt-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={link.href !== '/'}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'text-[#1e3a8a] bg-blue-50 font-semibold'
                        : 'text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50/60 active:bg-blue-100'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className={`p-1 rounded-md ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    {link.name}
                  </Link>
                );
              })}
              <Link
                href={bookingHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  mt-2 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold
                  bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white
                  shadow-md hover:shadow-lg hover:from-[#1e3a8a] hover:to-[#2563EB]
                  transition-all duration-200 active:scale-[0.98]
                "
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
