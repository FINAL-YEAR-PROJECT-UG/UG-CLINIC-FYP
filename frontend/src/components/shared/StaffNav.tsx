'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Calendar,
  Users,
  FileText,
  Settings,
} from 'lucide-react';
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
    <nav className="bg-white rounded-xl border border-[#E2E8F0] p-2 mb-8">
      <div className="flex gap-2 flex-wrap">
        {items
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#334155] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className="w-4 h-4" /> {item.name}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
