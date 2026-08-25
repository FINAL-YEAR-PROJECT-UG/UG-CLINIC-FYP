'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import UGLogo from './UGLogo';
import {
  Home,
  Info,
  CalendarDays,
  BookOpen,
  Phone,
  Menu,
  X,
} from '@/components/icons';
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
    <>
      {/* ── Fixed Navbar (Locked to top of screen throughout entire scroll) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.10)]'
            : 'bg-white border-b border-gray-100 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            {/* Logo */}
            <div
              onClick={handleLogoClick}
              className="cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UGLogo size="md" href="/" />
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <div key={link.name} className="relative py-1 flex flex-col items-center">
                    <Link
                      href={link.href}
                      prefetch={true}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium
                        transition-all duration-200
                        ${
                          isActive
                            ? 'text-[#1e3a8a] bg-blue-50/90 font-semibold shadow-xs'
                            : 'text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50/50'
                        }
                      `}
                    >
                      <span>{link.name}</span>
                    </Link>

                    {/* Active Indicator Underline */}
                    {isActive && (
                      <span className="w-8 h-0.5 rounded-full bg-[#1e3a8a] absolute -bottom-0.5" />
                    )}
                  </div>
                );
              })}
            </nav>

            {/* CTA Button + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <Link
                href={bookingHref}
                className="
                  hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold
                  bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white
                  shadow-[0_2px_8px_rgba(15,23,42,0.25)]
                  hover:shadow-[0_6px_20px_rgba(30,58,138,0.35)]
                  hover:from-[#1e3a8a] hover:to-[#2563EB]
                  hover:-translate-y-0.5
                  active:translate-y-0 active:scale-[0.98]
                  transition-all duration-200
                "
              >
                <span>{bookingCta}</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="
                  md:hidden p-2 rounded-xl text-gray-600 bg-gray-50 hover:text-[#1e3a8a] hover:bg-blue-50
                  transition-all duration-200 active:scale-95 border border-gray-200/60
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

          {/* Mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 pt-1 border-t border-gray-100 animate-[slideDown_200ms_cubic-bezier(0.4,0,0.2,1)_both]">
              <div className="flex flex-col gap-1 pt-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      prefetch={true}
                      className={`
                        flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${
                          isActive
                            ? 'text-[#1e3a8a] bg-blue-50 font-semibold shadow-xs'
                            : 'text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50/60 active:bg-blue-100'
                        }
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-[#1e3a8a]' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span>{link.name}</span>
                    </Link>
                  );
                })}

                <div className="pt-2 mt-2 border-t border-gray-100">
                  <Link
                    href={bookingHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="
                      w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold
                      bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white
                      shadow-md hover:shadow-lg hover:from-[#1e3a8a] hover:to-[#2563EB]
                      transition-all duration-200 active:scale-[0.98]
                    "
                  >
                    <span>{bookingCta}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Spacer Div so page content is never hidden behind the fixed navbar ── */}
      <div className="h-[73px] w-full" aria-hidden="true" />
    </>
  );
}
