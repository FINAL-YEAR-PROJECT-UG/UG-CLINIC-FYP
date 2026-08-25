'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ugEntranceBg from '@/Assets/Legon UG/UG entrance1.jpg';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { InactivityWarning } from '@/components/shared/InactivityWarning';
import {
  appointmentApi,
  type ApiAppointment,
} from '@/lib/appointmentApi';
import { getErrorMessage, getBookingRouteForRole, normalizeRole, isStaffRole, formatTimeLabel } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  MessageCircle,
  LogOut,
  Loader2,
} from '@/components/icons';

const CLINIC_LOCATION = 'Student Clinic, UG Legon';

const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLongDate(iso: string): string {
  const date = new Date(iso);
  // Use UTC to avoid timezone conversion issues
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  // Use UTC to avoid timezone conversion issues
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
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
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();

  // Inactivity timeout hook
  const { showWarning, timeRemaining, handleStayLoggedIn, handleLogout: handleInactivityLogout } = useInactivityTimeout({
    warningMinutes: 10,
    logoutMinutes: 2,
    enabled: isAuthenticated,
  });

  const [guardRedirecting, setGuardRedirecting] = useState(false);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModalId, setShowCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('MISTAKE');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  //     Early synchronous redirect: STAFF → /staff/overview, unauth → /login    
  // Run once on mount. Use sync store snapshot + deps-aware effect.
  useEffect(() => {
    let active = true;
    const runGuard = async () => {
      // Allow zustand persist rehydration microtask
      await Promise.resolve();
      if (!active) return;

      const snap = useAuthStore.getState();
      const role = normalizeRole(snap.user?.role ?? user?.role);
      const auth = snap.isAuthenticated || isAuthenticated;

      if (!auth) {
        if (!authLoading) {
          setGuardRedirecting(true);
          router.replace('/login');
        }
        return;
      }

      if (isStaffRole(role)) {
        setGuardRedirecting(true);
        router.replace('/staff/overview');
        return;
      }
    };
    runGuard();
    return () => { active = false; };
  }, [isAuthenticated, user?.role, authLoading, router]);

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
    if (authLoading) return;
    if (!isAuthenticated) return;

    const role = normalizeRole(user?.role);
    if (isStaffRole(role)) return;

    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      if (!active) return;
      await loadAppointments();
    })();
    return () => { active = false; };
  }, [isAuthenticated, user?.role, loadAppointments, authLoading]);

  const openCancelModal = (id: string) => {
    setShowCancelModalId(id);
    setCancelReason('MISTAKE');
    setCancelNote('');
    setCancelError(null);
  };

  const handleCancel = async (id: string) => {
    openCancelModal(id);
  };

  const confirmCancel = async () => {
    if (!showCancelModalId) return;
    setCancellingId(showCancelModalId);
    setCancelError(null);
    try {
      if (!cancelReason || !cancelReason.trim()) {
        setCancelError('Please select a reason for cancelling.');
        return;
      }
      await appointmentApi.cancel(showCancelModalId, {
        cancellationReason: cancelReason,
        cancellationNote: cancelNote,
      });
      setShowCancelModalId(null);
      await loadAppointments();
    } catch (err) {
      setCancelError(getErrorMessage(err, 'Could not cancel the appointment.'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleBookingNavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const snap = useAuthStore.getState();
    const role = normalizeRole(snap.user?.role);
    const auth = snap.isAuthenticated;
    router.push(getBookingRouteForRole(role, auth));
  };

  const firstName = user?.firstName || 'Student';
  const lastName = user?.lastName || '';
  const fullName = (firstName && lastName && firstName.toLowerCase() !== lastName.toLowerCase())
    ? `${firstName} ${lastName}`
    : firstName;
  const studentId = user?.studentId || ' ';
  const email = user?.email || ' ';
  const mobile = user?.phone || ' ';
  const programme = user?.program || ' ';

  const now = new Date();
  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.includes(a.status) && new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextAppointment = upcoming[0];
  const upcomingIds = new Set(upcoming.map((a) => a.id));
  const past = appointments.filter((a) => !upcomingIds.has(a.id));

  if (authLoading || guardRedirecting) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={60} />
          <p className="text-sm text-gray-500 font-medium">
            {guardRedirecting ? 'Redirecting…' : 'Loading dashboard…'}
          </p>
        </div>
      </div>
    );
  }

  const bookingTarget = getBookingRouteForRole(user?.role, isAuthenticated);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden">
      {/* Background Campus Entrance Image & Soft Dimming Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src={ugEntranceBg}
          alt="University of Ghana Campus Entrance"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/15" />
      </div>

      {/* Welcome banner */}
      <header className="relative z-10 bg-gradient-to-r from-[#1e3a8a]/95 to-[#3b82f6]/95 backdrop-blur-md text-white sticky top-0 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
            <p className="text-blue-100 mt-1">
              Here are your clinic appointments and health information.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 text-white font-medium px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0F172A]"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      {showCancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg border border-[#E2E8F0] text-[#020617]">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 id="cancel-modal-title" className="text-lg font-semibold text-[#020617]">Cancel appointment</h3>
              <button
                onClick={() => setShowCancelModalId(null)}
                className="text-[#334155] hover:text-[#020617] bg-white rounded-full px-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                aria-label="Close cancel modal"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-[#020617]">
              <p className="text-sm text-[#334155]">Please select a reason for cancelling and optionally add more details.</p>

              <div>
                <label htmlFor="cancel-reason" className="block text-xs text-[#020617] mb-1">Reason</label>
                <select
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-[#E2E8F0] bg-white text-[#020617] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all"
                >
                  <option value="MISTAKE">Mistake / Wrong booking</option>
                  <option value="NO_LONGER_NEEDED">No longer needed</option>
                  <option value="SICK">Feeling better / Sick</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="cancel-note" className="block text-xs text-[#020617] mb-1">Details (optional)</label>
                <textarea
                  id="cancel-note"
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  rows={4}
                  className="w-full border border-[#E2E8F0] bg-white text-[#020617] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all"
                  placeholder="Add any additional details about why you're cancelling"
                />
              </div>

              {cancelError && (
                <div className="text-sm text-red-600" role="alert">{cancelError}</div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCancelModalId(null)}
                  className="px-4 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#020617] text-sm hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all"
                >
                  Close
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancellingId === showCancelModalId}
                  className="px-4 py-2 rounded-md bg-[#DC2626] text-white text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2 transition-all"
                >
                  {cancellingId === showCancelModalId ? 'Cancelling...' : 'Confirm cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3" role="alert">
              {error}
            </div>
          )}

          {/* Upcoming appointment */}
          <section>
            <h2 className="text-lg font-bold text-[#020617] mb-3">Upcoming Appointment</h2>
            {loading ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 shadow-sm">
                <LoadingSpinner size={60} />
              </div>
            ) : nextAppointment ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-1 ${STATUS_PILL[nextAppointment.status]?.className ?? 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {STATUS_PILL[nextAppointment.status]?.label ?? nextAppointment.status}
                  </span>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-[#334155]">Booking Reference</p>
                    <p className="text-sm font-semibold text-[#0369A1]">{bookingReference(nextAppointment)}</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#020617] mt-4">
                  {nextAppointment.reason || nextAppointment.service?.name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-[#334155] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#334155]">Date</p>
                      <p className="text-sm font-medium text-[#020617]">{formatLongDate(nextAppointment.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-[#334155] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#334155]">Time</p>
                      <p className="text-sm font-medium text-[#020617]">{formatTimeLabel(nextAppointment.timeSlot)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#334155] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#334155]">Location</p>
                      <p className="text-sm font-medium text-[#020617]">{CLINIC_LOCATION}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] mt-6 pt-4 flex items-center gap-4">
                  <button
                    onClick={() => handleCancel(nextAppointment.id)}
                    disabled={cancellingId === nextAppointment.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 text-red-600 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {cancellingId === nextAppointment.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel appointment
                  </button>
                  <Link
                    href={`/demo-booking?rescheduleId=${encodeURIComponent(nextAppointment.id)}&serviceId=${encodeURIComponent(nextAppointment.serviceId || nextAppointment.service?.id || '')}&date=${encodeURIComponent(nextAppointment.date.split('T')[0])}&time=${encodeURIComponent(nextAppointment.timeSlot)}&reason=${encodeURIComponent(nextAppointment.reason || '')}`}
                    className="text-sm font-medium text-[#1e3a8a] hover:text-blue-900 font-semibold transition-all duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2 rounded"
                  >
                    Reschedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm text-center">
                <p className="text-[#334155]">You have no upcoming appointments.</p>
                <Link
                  href={bookingTarget}
                  onClick={handleBookingNavClick}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-[#0369A1] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#0F172A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2"
                >
                  Book an appointment
                </Link>
              </div>
            )}
          </section>

          {/* Past appointments */}
          <section>
            <h2 className="text-lg font-bold text-[#020617] mb-3">Past Appointments</h2>
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[#334155] border-b border-[#E2E8F0]">
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
                      <td colSpan={3} className="px-5 py-6 text-center text-[#334155]">
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
                        <tr key={appt.id} className="border-b border-[#E2E8F0] last:border-0">
                          <td className="px-5 py-4 text-[#020617]">{formatShortDate(appt.date)}</td>
                          <td className="px-5 py-4 text-[#020617]">{appt.reason || appt.service?.name}</td>
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex flex-col items-center text-center pb-5 border-b border-[#E2E8F0]">
              <div className="h-16 w-16 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-lg font-bold">
                {getInitials(fullName)}
              </div>
              <h3 className="text-base font-bold text-[#020617] mt-3">{fullName}</h3>
              <p className="text-xs text-[#334155]">ID: {studentId}</p>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-[#334155]">Programme</dt>
                <dd className="text-[#020617] mt-0.5">{programme}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-[#334155]">Email</dt>
                <dd className="text-[#020617] mt-0.5 break-all">{email}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-[#334155]">Mobile</dt>
                <dd className="text-[#020617] mt-0.5">{mobile}</dd>
              </div>
            </dl>
          </div>

          {/* Clinic information card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#020617] mb-4">Clinic Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-[#334155]">Opening Hours</span>
                <span className="text-right text-[#020617]">
                  Mon – Fri
                  <br />
                  8:00 AM – 5:00 PM
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[#334155]">Emergency</span>
                <span className="text-[#020617]">+233 20 123 4567</span>
              </div>
            </div>
            <a
              href="https://wa.me/233201234567"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Message us on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Inactivity Warning Modal */}
      <InactivityWarning
        show={showWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleInactivityLogout}
      />
    </div>
  );
}
