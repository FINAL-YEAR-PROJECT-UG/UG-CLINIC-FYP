'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  SquarePen,
  MessageCircle,
} from 'lucide-react';

interface PastAppointment {
  date: string;
  service: string;
  status: 'Completed' | 'Cancelled';
}

const PAST_APPOINTMENTS: PastAppointment[] = [
  { date: '03 Mar 2026', service: 'Vaccination', status: 'Completed' },
  { date: '10 Jan 2026', service: 'Mental Health', status: 'Completed' },
  { date: '15 Nov 2025', service: 'General Consultation', status: 'Completed' },
  { date: '02 Sep 2025', service: 'Health Screening', status: 'Cancelled' },
];

const UPCOMING = {
  service: 'General Consultation',
  reference: 'UGC-2026-00342',
  date: 'Wednesday 21 May 2026',
  time: '9:30 AM – 10:00 AM',
  location: 'Student Clinic, UG Legon',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardPage() {
  const { user } = useAuth();

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      : 'Kofi Asante Mensah';
  const firstName = fullName.split(/\s+/)[0];
  const studentId = user?.studentId || 'UG/2021/0342';
  const email = user?.email || 'k.mensah@st.ug.edu.gh';
  const mobile = user?.phone || '+233 24 123 4567';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome banner */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
            <p className="text-blue-100 mt-1">Here are your clinic appointments.</p>
          </div>
          <Link
            href="/demo-booking"
            className="inline-flex items-center justify-center rounded-full bg-white text-blue-800 font-semibold px-5 py-2.5 text-sm shadow-sm hover:bg-blue-50 transition-colors"
          >
            Book new appointment
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming appointment */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Appointment</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirmed
                </span>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Booking Reference</p>
                  <p className="text-sm font-semibold text-blue-700">{UPCOMING.reference}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-4">{UPCOMING.service}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium text-gray-800">{UPCOMING.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-medium text-gray-800">{UPCOMING.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-800">{UPCOMING.location}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-6 pt-4 flex items-center gap-4">
                <button className="rounded-lg border border-red-300 text-red-600 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-colors">
                  Cancel appointment
                </button>
                <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Reschedule
                </button>
              </div>
            </div>
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
                    <th className="font-medium px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {PAST_APPOINTMENTS.map((appt) => (
                    <tr key={`${appt.date}-${appt.service}`} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-4 text-gray-700">{appt.date}</td>
                      <td className="px-5 py-4 text-gray-700">{appt.service}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full text-xs font-medium px-2.5 py-1 ${
                            appt.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button className="text-blue-600 font-medium hover:underline">View details</button>
                      </td>
                    </tr>
                  ))}
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
                <dd className="text-gray-800 mt-0.5">Computer Science</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Level</dt>
                <dd className="text-gray-800 mt-0.5">300</dd>
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

            <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
              <SquarePen className="h-4 w-4" />
              Edit profile
            </button>
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
