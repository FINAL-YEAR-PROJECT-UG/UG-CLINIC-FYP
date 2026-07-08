'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { appointmentApi, type ApiAppointment } from '@/lib/appointmentApi';
import { getErrorMessage } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  MessageCircle,
  LogOut,
  Loader2,
} from 'lucide-react';

const CLINIC_LOCATION = 'Student Clinic, UG Legon';

const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function bookingReference(appt: ApiAppointment): string {
  const year = new Date(appt.date).getFullYear();
  return `UGC-${year}-${appt.id.slice(0, 5).toUpperCase()}`;
}

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
  NO_SHOW: { label: 'No show', className: 'bg-red-100 text-red-600' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  RESCHEDULED: { label: 'Rescheduled', className: 'bg-blue-100 text-blue-700' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const loadAppointments = useCallback(async () => {
    try {
      const data = await appointmentApi.getMyAppointments();
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your appointments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    appointmentApi
      .getMyAppointments()
      .then((data) => {
        if (active) {
          setAppointments(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load your appointments.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await appointmentApi.cancel(id);
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not cancel the appointment.'));
    } finally {
      setCancellingId(null);
    }
  };

  const firstName = user?.firstName || 'Student';
  const lastName = user?.lastName || '';
  const fullName = (firstName && lastName && firstName.toLowerCase() !== lastName.toLowerCase())
    ? `${firstName} ${lastName}`
    : firstName;
  const studentId = user?.studentId || '—';
  const email = user?.email || '—';
  const mobile = user?.phone || '—';
  const programme = user?.program || '—';

  const now = new Date();
  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.includes(a.status) && new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextAppointment = upcoming[0];
  const upcomingIds = new Set(upcoming.map((a) => a.id));
  const past = appointments.filter((a) => !upcomingIds.has(a.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome banner */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
            <p className="text-blue-100 mt-1">Here are your clinic appointments.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demo-booking"
              className="inline-flex items-center justify-center rounded-full bg-white text-blue-800 font-semibold px-5 py-2.5 text-sm shadow-sm hover:bg-blue-50 transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              Book new appointment
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 text-white font-medium px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 hover:shadow-md"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Upcoming appointment */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Appointment</h2>
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm">
                <LoadingSpinner size={60} />
              </div>
            ) : nextAppointment ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-1 ${
                      STATUS_PILL[nextAppointment.status]?.className ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {STATUS_PILL[nextAppointment.status]?.label ?? nextAppointment.status}
                  </span>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">Booking Reference</p>
                    <p className="text-sm font-semibold text-blue-700">{bookingReference(nextAppointment)}</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  {nextAppointment.reason || nextAppointment.service?.name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium text-gray-800">{formatLongDate(nextAppointment.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="text-sm font-medium text-gray-800">{nextAppointment.timeSlot}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-800">{CLINIC_LOCATION}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 mt-6 pt-4 flex items-center gap-4">
                  <button
                    onClick={() => handleCancel(nextAppointment.id)}
                    disabled={cancellingId === nextAppointment.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 text-red-600 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none"
                  >
                    {cancellingId === nextAppointment.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel appointment
                  </button>
                  <Link
                    href="/demo-booking"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-200 hover:underline"
                  >
                    Reschedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
                <p className="text-gray-600">You have no upcoming appointments.</p>
                <Link
                  href="/demo-booking"
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-blue-700 text-white font-semibold px-5 py-2.5 text-sm hover:bg-blue-800 transition-colors"
                >
                  Book an appointment
                </Link>
              </div>
            )}
          </section>

          {/* Past appointments */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Past Appointments</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    <th className="font-medium px-5 py-3">Date</th>
                    <th className="font-medium px-5 py-3">Service</th>
                    <th className="font-medium px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8">
                        <LoadingSpinner size={40} />
                      </td>
                    </tr>
                  ) : past.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-gray-500">
                        No past appointments yet.
                      </td>
                    </tr>
                  ) : (
                    past.map((appt) => {
                      const pill = STATUS_PILL[appt.status] ?? {
                        label: appt.status,
                        className: 'bg-gray-100 text-gray-600',
                      };
                      return (
                        <tr key={appt.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-5 py-4 text-gray-700">{formatShortDate(appt.date)}</td>
                          <td className="px-5 py-4 text-gray-700">{appt.reason || appt.service?.name}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full text-xs font-medium px-2.5 py-1 ${pill.className}`}>
                              {pill.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100">
              <div className="h-16 w-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-lg font-bold">
                {getInitials(fullName)}
              </div>
              <h3 className="text-base font-bold text-gray-900 mt-3">{fullName}</h3>
              <p className="text-xs text-gray-500">ID: {studentId}</p>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Programme</dt>
                <dd className="text-gray-800 mt-0.5">{programme}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Email</dt>
                <dd className="text-gray-800 mt-0.5 break-all">{email}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Mobile</dt>
                <dd className="text-gray-800 mt-0.5">{mobile}</dd>
              </div>
            </dl>
          </div>

          {/* Clinic information card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Clinic Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500">Opening Hours</span>
                <span className="text-right text-gray-800">
                  Mon – Fri
                  <br />
                  8:00 AM – 5:00 PM
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500">Emergency</span>
                <span className="text-gray-800">+233 20 123 4567</span>
              </div>
            </div>
            <a
              href="https://wa.me/233201234567"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
