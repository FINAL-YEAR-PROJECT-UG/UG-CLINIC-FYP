'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Calendar,
  Users,
  FileText,
  Settings,
} from '@/components/icons';
import { canAccessStudentRecords, canManageClinicOperations, normalizeRole } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: typeof Activity;
  show: boolean;
};

export default function StaffNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const role = normalizeRole(userRole);

  const items: NavItem[] = [
    { name: 'Overview & Analytics', href: '/staff/overview', icon: Activity, show: true },
    {
      name: canManageClinicOperations(role) ? 'Appointments & Slots' : 'My Appointments',
      href: '/staff/appointments',
      icon: Calendar,
      show: true,
    },
    { name: 'Student Records', href: '/staff/students', icon: Users, show: canAccessStudentRecords(role) },
    { name: 'Resources', href: '/staff/resources', icon: FileText, show: true },
    { name: 'Settings', href: '/staff/settings', icon: Settings, show: true },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E2E8F0] p-2 mb-8 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
      <div className="flex gap-1.5 flex-wrap">
        {items
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative group flex items-center gap-2 px-4 py-2.5 rounded-xl
                  font-semibold text-[0.8125rem] tracking-[-0.01em]
                  transition-all duration-200 overflow-hidden
                  ${isActive
                    ? 'text-white shadow-[0_4px_14px_rgba(15,23,42,0.28)]'
                    : 'text-[#4B5A6E] hover:text-[#0F172A] hover:bg-[#F1F4F9] hover:shadow-sm hover:-translate-y-px'
                  }
                `}
              >
                {/* Active background gradient */}
                <span
                  className={`
                    absolute inset-0 rounded-xl transition-opacity duration-200
                    bg-gradient-to-r from-[#0F172A] to-[#1e3a8a]
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `}
                />

                {/* Hover shimmer */}
                <span
                  className="
                    absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                    bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,179,237,0.10)_0%,transparent_70%)]
                  "
                />

                {/* Icon */}
                <span className="relative z-10">
                  <Icon
                    className={`w-4 h-4 transition-all duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[#6B7A8D]'
                    }`}
                  />
                </span>

                {/* Label */}
                <span className="relative z-10">{item.name}</span>

                {/* Active dot indicator */}
                {isActive && (
                  <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                )}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
