'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { logoutWithStore } from '@/lib/authApi';
import UGLogo from './UGLogo';
import { LogOut } from '@/components/icons';

export default function StaffHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName || 'System';
  const lastName = user?.lastName || 'Administrator';

  const handleLogout = async () => {
    await logoutWithStore();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <UGLogo size="sm" href="/staff/overview" className="sm:[&>div]:gap-2" />
            <Link
              href="/"
              className="whitespace-nowrap text-[0.6875rem] font-semibold text-slate-500 transition-colors hover:text-red-600 sm:text-xs"
            >
              ← Public Site
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-3 border-l border-[#E2E8F0] pl-4 sm:flex">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8ECF1]">
                <span className="text-sm font-bold text-[#1e3a8a]">{firstName[0] || 'A'}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#020617]">{firstName} {lastName}</p>
                <p className="text-xs text-[#334155]">ADMIN</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-[0.6875rem] font-semibold leading-tight text-[#334155] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-3 sm:text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}