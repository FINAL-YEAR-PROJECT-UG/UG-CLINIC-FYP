"use client";

import Link from 'next/link';
import { Phone, Mail, MapPin } from '@/components/icons';
import UGLogo from './UGLogo';

// ─── Social Media Icons (commented out until clinic gets official handles) ──────
// const FacebookIcon = () => (
//   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
//     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
//   </svg>
// );

// const TwitterIcon = () => (
//   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
//     <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
//   </svg>
// );

// const InstagramIcon = () => (
//   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
//     <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0z"/>
//   </svg>
// );

// const LinkedInIcon = () => (
//   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
//     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
//   </svg>
// );

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] text-white py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div>
            <UGLogo size="md" showText={true} textColor="text-white" href="/" />
            <p className="text-blue-200/80 text-sm leading-relaxed mt-4 max-w-[220px]">
              Providing quality healthcare services to support student wellbeing and academic success.
            </p>

            {/* ── Social Media (uncomment and add handles when clinic is ready) ── */}
            {/* <div className="flex gap-3 mt-5">
              <a href="https://facebook.com/CLINIC_HANDLE" target="_blank" rel="noopener noreferrer"
                 aria-label="Facebook" className="text-blue-300 hover:text-white transition-colors hover:scale-110 duration-200">
                <FacebookIcon />
              </a>
              <a href="https://twitter.com/CLINIC_HANDLE" target="_blank" rel="noopener noreferrer"
                 aria-label="Twitter / X" className="text-blue-300 hover:text-white transition-colors hover:scale-110 duration-200">
                <TwitterIcon />
              </a>
              <a href="https://instagram.com/CLINIC_HANDLE" target="_blank" rel="noopener noreferrer"
                 aria-label="Instagram" className="text-blue-300 hover:text-white transition-colors hover:scale-110 duration-200">
                <InstagramIcon />
              </a>
              <a href="https://linkedin.com/company/CLINIC_HANDLE" target="_blank" rel="noopener noreferrer"
                 aria-label="LinkedIn" className="text-blue-300 hover:text-white transition-colors hover:scale-110 duration-200">
                <LinkedInIcon />
              </a>
            </div> */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-blue-200/80">
              {[
                { label: 'Home', href: '/' },
                { label: 'About Us', href: '/about' },
                { label: 'Services', href: '/services' },
                { label: 'Health Resources', href: '/resources' },
                { label: 'Contact', href: '/contact' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-2.5 text-sm text-blue-200/80">
              {['General Consultation', 'Mental Health', 'Sexual Health', 'Vaccinations', 'Nutrition'].map((s) => (
                <li key={s}>
                  <Link href="/services" className="hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Contact Info</h3>
            <ul className="space-y-3 text-sm text-blue-200/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-blue-300 flex-shrink-0 mt-0.5" />
                <span>Student Clinic Building,<br />University of Ghana, Legon</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-blue-300 flex-shrink-0" />
                <span>+233 (0) 302 000 000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-blue-300 flex-shrink-0" />
                <span>clinic@ug.edu.gh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-blue-300/70">
            &copy; {new Date().getFullYear()} UG Student Clinic, University of Ghana. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs text-blue-300/70">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
