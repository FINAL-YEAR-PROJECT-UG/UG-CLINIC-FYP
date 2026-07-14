'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Loader2,
  FileText,
  Settings,
  Bell,
} from 'lucide-react';

interface StaffOverviewData {
  summary: {
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalStudents: number;
  };
  recentAppointments: Array<{
    id: string;
    date: string;
    timeSlot: string;
    status: string;
    reason: string;
    user: {
      firstName: string;
      lastName: string;
      studentId?: string;
      email: string;
    };
    service?: {
      name: string;
    };
  }>;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
  NO_SHOW: { label: 'No show', className: 'bg-red-100 text-red-600' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  RESCHEDULED: { label: 'Rescheduled', className: 'bg-blue-100 text-blue-700' },
};

function getStaffRoleLabel(role: string) {
  const normalizedRole = role?.toUpperCase?.() ?? '';
  switch (normalizedRole) {
    case 'DOCTOR':
      return 'Doctor';
    case 'RECEPTIONIST':
      return 'Receptionist';
    case 'ADMIN':
      return 'Administrator';
    default:
      return 'Staff';
  }
}

export default function StaffOverviewPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [staffData, setStaffData] = useState<StaffOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?role=staff');
      return;
    }

    if (user && !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchStaffOverview();
  }, [isAuthenticated, user, router]);

  const fetchStaffOverview = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call your API
      // For now, we'll use mock data since the API structure isn't clear yet
      const mockData: StaffOverviewData = {
        summary: {
          totalAppointments: 0,
          todayAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          totalStudents: 0,
        },
        recentAppointments: [],
      };
      setStaffData(mockData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load staff overview'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login?role=staff');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const summary = staffData?.summary ?? {
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalStudents: 0,
  };
  const recentAppointments = staffData?.recentAppointments ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                {getStaffRoleLabel(user?.role || '')} Portal
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {user?.firstName?.[0] || 'S'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{getStaffRoleLabel(user?.role || '')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <nav className="bg-white rounded-xl border border-gray-200 p-2 mb-8">
          <div className="flex gap-2">
            <Link
              href="/staff/overview"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              Overview
            </Link>
            <Link
              href="/staff/appointments"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </Link>
            <Link
              href="/staff/students"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
            >
              <Users className="w-4 h-4" />
              Students
            </Link>
            <Link
              href="/staff/settings"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </nav>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Staff Dashboard</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Monitor clinic activity, manage appointment flow, and support students from one place.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Today's Appointments</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.todayAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Confirmed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.confirmedAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.pendingAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Cancelled</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.cancelledAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Students</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Appointments</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Appointments</h3>
              <p className="text-sm text-gray-500">Latest scheduled visits for your clinic.</p>
            </div>
            <Link
              href="/staff/appointments"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
              No recent appointments available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-4 text-gray-700">{formatShortDate(appointment.date)}</td>
                      <td className="px-4 py-4 text-gray-700">{appointment.timeSlot}</td>
                      <td className="px-4 py-4 text-gray-700">
                        {appointment.user.firstName} {appointment.user.lastName}
                        <div className="text-xs text-gray-500">
                          {appointment.user.studentId || appointment.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {appointment.service?.name || appointment.reason}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full text-[11px] font-medium px-2.5 py-1 ${
                            STATUS_STYLES[appointment.status]?.className ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_STYLES[appointment.status]?.label ?? appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}