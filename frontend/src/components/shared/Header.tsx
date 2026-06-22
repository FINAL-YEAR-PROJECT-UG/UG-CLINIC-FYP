"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Health Resources', href: '/resources' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/home/logo.svg"
              alt="UG Clinic Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <p className="font-bold text-blue-900 text-sm">UG Student Clinic</p>
              <p className="text-xs text-gray-500">Quality Healthcare for Students</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-900 border-b-2 border-blue-900 pb-1'
                      : 'text-gray-600 hover:text-blue-900'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          <Link href="/demo-booking">
            <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-md px-5 transition-colors">
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
