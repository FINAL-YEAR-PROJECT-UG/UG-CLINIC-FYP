'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StaffSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    router.push('/login?role=staff');
    return null;
  }

  if (user && !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/staff/overview" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
              <p className="text-sm text-gray-500">Manage your account preferences and security</p>
            </div>
          </div>
          <p className="text-gray-600">This page will be implemented with full account settings functionality.</p>
        </div>
      </div>
    </div>
  );
}