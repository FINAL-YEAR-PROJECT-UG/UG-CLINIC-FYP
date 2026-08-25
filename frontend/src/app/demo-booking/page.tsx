'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ugEntranceBg from '@/Assets/Legon UG/UG entrance1.jpg';
import { useAuthStore } from '@/stores/authStore';
import { appointmentApi } from '@/lib/appointmentApi';
import { getDoctors, type StaffDoctor } from '@/lib/staffApi';
import {
  getErrorMessage,
  normalizeRole,
  isStaffRole,
  getHomeRouteForRole,
  getLoginRouteForRole,
} from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import UGLogo from '@/components/shared/UGLogo';
import {
  Stethoscope,
  Brain,
  Ribbon,
  Leaf,
  Zap,
  Syringe,
  Pill,
  Check,
  ChevronLeft,
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Clock,
  AlertCircle,
  MapPin,
  Navigation,
} from '@/components/icons';

interface ServiceOption {
  id: string;
  title: string;
  desc: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  isExternal?: boolean;
  locationUrl?: string;
  locationName?: string;
}

const SERVICES: ServiceOption[] = [
  { id: 'general', category: 'consultation', title: 'General Consultation', desc: 'Routine medical checkups, physical symptoms, and general health advice.', icon: Stethoscope, duration: '20 mins' },
  { id: 'mental', category: 'specialist', title: 'Mental Health & Counseling', desc: 'Confidential mental health support, stress management, and therapy.', icon: Brain, duration: '45 mins' },
  { id: 'eye-care', category: 'specialist', title: 'Eye Care & Vision Services', desc: 'Comprehensive vision tests, eye strain assessment, and prescription guidance.', icon: Eye, duration: '30 mins' },
  {
    id: 'dental',
    category: 'specialist',
    title: 'Dental Checkup & Oral Health',
    desc: 'Dental checkup services are only available at the Main UG Hospital. Students should visit the Main Hospital directly.',
    icon: Stethoscope,
    duration: 'Main Hospital Only',
    isExternal: true,
    locationUrl: 'https://www.google.com/maps?q=5.65145873649435,-0.17833193194224153',
    locationName: 'Main UG Hospital',
  },
  { id: 'hiv', category: 'screening', title: 'HIV/AIDS Testing & Support', desc: 'Voluntary testing, pre/post-test counseling, and ongoing support services.', icon: Ribbon, duration: '20 mins' },
  { id: 'nutrition', category: 'specialist', title: 'Nutrition & Dietetics', desc: 'Personalized meal planning, BMI consultations, and healthy lifestyle guidance.', icon: Leaf, duration: '30 mins' },
  { id: 'screening', category: 'screening', title: 'Comprehensive Health Screening', desc: 'Blood pressure, glucose tests, lab work, and physical evaluation.', icon: Zap, duration: '40 mins' },
  { id: 'vaccination', category: 'preventative', title: 'Vaccinations & Immunizations', desc: 'Travel vaccines, seasonal flu shots, and booster immunizations.', icon: Syringe, duration: '15 mins' },
  { id: 'family-planning', category: 'preventative', title: 'Family Planning & Reproductive Health', desc: 'Confidential family planning advice, contraception services, and reproductive health.', icon: Ribbon, duration: '30 mins' },
  { id: 'prescription', category: 'pharmacy', title: 'Prescription & Pharmacy Refill', desc: 'Medication refills and pharmacist consultation for students.', icon: Pill, duration: '15 mins' },
];

const MORNING_SLOTS = [
  '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM',
  '10:30 AM', '11:00 AM', '11:30 AM',
];

const AFTERNOON_SLOTS = [
  '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
  '03:30 PM',
];

const TIME_SLOT_LABELS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Services' },
  { key: 'consultation', label: 'Consultation' },
  { key: 'specialist', label: 'Specialist Care' },
  { key: 'screening', label: 'Screening & Lab' },
  { key: 'preventative', label: 'Preventative' },
  { key: 'pharmacy', label: 'Pharmacy' },
];

const getTimeSlotDate = (timeStr: string, baseDate: Date) => {
  const date = new Date(baseDate);
  const [timePart, ampm] = timeStr.split(' ');
  const [hoursStr, minutesStr] = timePart.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (ampm === 'PM' && hours !== 12) hours += 12;
  else if (ampm === 'AM' && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isTimeSlotPast = (timeStr: string, selectedDate: Date) => {
  const today = new Date();
  const isSameDay = today.getFullYear() === selectedDate.getFullYear()
    && today.getMonth() === selectedDate.getMonth()
    && today.getDate() === selectedDate.getDate();
  if (!isSameDay) return false;
  return getTimeSlotDate(timeStr, selectedDate) < new Date();
};

const findNextAvailableSlot = (selectedDate: Date, booked: string[]) => {
  if (isWeekend(selectedDate)) return '';
  return TIME_SLOT_LABELS.find(
    (slot) => !isTimeSlotPast(slot, selectedDate) && !booked.includes(slot)
  );
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rescheduleId = searchParams.get('rescheduleId');
  const queryServiceId = searchParams.get('serviceId');
  const queryDate = searchParams.get('date');
  const queryTime = searchParams.get('time');
  const queryReason = searchParams.get('reason');

  const isReschedule = Boolean(rescheduleId);

  // Read auth synchronously from store
  const storeAuth = useAuthStore((s) => s.isAuthenticated);
  const storeUser = useAuthStore((s) => s.user);
  const storeTokens = useAuthStore((s) => s.tokens);

  const initialSnap = useAuthStore.getState();
  const initialRole = normalizeRole(initialSnap.user?.role);
  const initialIsAuth = initialSnap.isAuthenticated && !!initialSnap.user;
  const initialIsStudent = initialRole === 'STUDENT';

  const [guardResolved, setGuardResolved] = useState<boolean>(() => initialIsAuth && initialIsStudent);
  const [guardRedirecting, setGuardRedirecting] = useState<boolean>(false);
  const [servicesFetched] = useState<ServiceOption[]>(SERVICES);
  const [confirmedId, setConfirmedId] = useState<string>('');
  const [confirmedReference, setConfirmedReference] = useState<string>('');
  const [confirmedStatus, setConfirmedStatus] = useState<'PENDING' | 'CONFIRMED' | 'RESCHEDULED'>('CONFIRMED');

  // Form State
  // If rescheduling, skip Step 1 and take student straight to Step 2 (Date & Time)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => (isReschedule ? 2 : 1));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceOption>(() => {
    if (queryServiceId) {
      const match = SERVICES.find(
        (s) => s.id === queryServiceId || s.title.toLowerCase().includes(queryServiceId.toLowerCase())
      );
      if (match) return match;
    }
    return SERVICES[0];
  });

  const [bookingDate, setBookingDate] = useState<Date>(() => {
    if (queryDate) {
      const parsed = new Date(queryDate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [bookingTime, setBookingTime] = useState<string>(() => queryTime || '09:00 AM');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [reason, setReason] = useState<string>(() => queryReason || '');
  const [notes, setNotes] = useState<string>('');

  // Data Loading
  const [doctors, setDoctors] = useState<StaffDoctor[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [hasExistingBookingOnDate, setHasExistingBookingOnDate] = useState<boolean>(false);
  const [existingTimeSlotOnDate, setExistingTimeSlotOnDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 6 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [error]);

  // Route Guard: validate synchronously on mount
  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const runGuard = () => {
      const state = useAuthStore.getState();
      const currentUser = state.user ?? storeUser;
      const currentAuth = state.isAuthenticated || storeAuth;
      const currentTokens = state.tokens ?? storeTokens;
      const role = normalizeRole(currentUser?.role);

      if (!currentAuth || !currentUser) {
        setGuardRedirecting(true);
        const target = getLoginRouteForRole(role);
        redirectTimer = setTimeout(() => {
          if (active) router.replace(target);
        }, 0);
        return;
      }

      if (role !== 'STUDENT') {
        setGuardRedirecting(true);
        const target = isStaffRole(role)
          ? '/staff/appointments'
          : getHomeRouteForRole(role, true);
        redirectTimer = setTimeout(() => {
          if (active) router.replace(target);
        }, 0);
        return;
      }

      setGuardResolved(true);
    };

    runGuard();
    return () => {
      active = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router, storeAuth, storeUser, storeTokens]);

  // Data Fetching
  const fetchDoctors = useCallback(async () => {
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data?.doctors) ? data.doctors : []);
    } catch {
      setDoctors([]);
    }
  }, []);

  const fetchAvailability = useCallback(async (date: Date, serviceId: string) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const availabilityData = await appointmentApi.getAvailability(
        dateStr,
        serviceId,
        rescheduleId || undefined
      );

      const slots = Array.isArray(availabilityData)
        ? availabilityData
        : availabilityData?.bookedSlots ?? [];

      setBookedSlots(slots);
      setHasExistingBookingOnDate(Boolean(availabilityData?.hasExistingBooking));
      setExistingTimeSlotOnDate(availabilityData?.existingTimeSlot || null);

      if (isTimeSlotPast(bookingTime, date) || slots.includes(bookingTime)) {
        const next = findNextAvailableSlot(date, slots);
        if (next) setBookingTime(next);
      }
    } catch {
      setBookedSlots([]);
      setHasExistingBookingOnDate(false);
      setExistingTimeSlotOnDate(null);
    }
  }, [bookingTime, rescheduleId]);

  useEffect(() => {
    if (!guardResolved) return;
    fetchDoctors();
  }, [guardResolved, fetchDoctors]);

  useEffect(() => {
    if (!guardResolved) return;
    fetchAvailability(bookingDate, selectedService.id);
  }, [guardResolved, bookingDate, selectedService.id, fetchAvailability]);

  useEffect(() => {
    if (!guardResolved) return;
    if (isTimeSlotPast(bookingTime, bookingDate) || bookedSlots.includes(bookingTime)) {
      const next = findNextAvailableSlot(bookingDate, bookedSlots);
      if (next) setBookingTime(next);
    }
  }, [guardResolved, bookedSlots, bookingTime, bookingDate]);

  // Booking Submit (Standard)
  const handleConfirmBooking = async () => {
    if (!reason.trim()) {
      setError('Please briefly state the reason for your visit.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        serviceId: selectedService.id,
        date: bookingDate.toISOString().split('T')[0],
        timeSlot: bookingTime,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        doctorId: selectedDoctorId || undefined,
      };

      const envelope = await appointmentApi.create(payload);
      const appointment = envelope?.data?.appointment;

      const id: string = appointment?.id || String(Date.now());
      const year = new Date(bookingDate).getFullYear();
      const shortId = id.replace(/-/g, '').slice(0, 6).toUpperCase().padStart(6, '0');
      const reference = `UGC-${year}-${shortId}`;
      const status =
        appointment?.status === 'PENDING' || appointment?.status === 'CONFIRMED'
          ? appointment.status
          : selectedDoctorId
            ? 'CONFIRMED'
            : 'PENDING';

      setConfirmedId(id);
      setConfirmedReference(reference);
      setConfirmedStatus(status);
      setStep(4);
    } catch (err) {
      setError(getErrorMessage(err, 'You already have an appointment booked on this date. Please choose another date.'));
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Reschedule Submit
  const handleRescheduleSubmit = async () => {
    if (!rescheduleId) return;

    if (isWeekend(bookingDate)) {
      setError('Appointments cannot be scheduled on weekends. Please select a weekday (Monday to Friday).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const dateStr = bookingDate.toISOString().split('T')[0];
      const res = await appointmentApi.reschedule(rescheduleId, {
        date: dateStr,
        timeSlot: bookingTime,
      });

      const appt = res?.data?.appointment;
      const id: string = appt?.id || rescheduleId;
      const year = new Date(bookingDate).getFullYear();
      const shortId = id.replace(/-/g, '').slice(0, 6).toUpperCase().padStart(6, '0');
      const reference = `UGC-${year}-${shortId}`;

      setConfirmedId(id);
      setConfirmedReference(reference);
      setConfirmedStatus('CONFIRMED');
      setStep(4);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reschedule appointment. The selected time slot may be booked.'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = servicesFetched.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory
  );

  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId);
  const selectedDoctorName = selectedDoctorObj
    ? `Dr. ${selectedDoctorObj.firstName} ${selectedDoctorObj.lastName}`
    : 'To be assigned upon arrival';

  // Paint loading shell until guard is resolved
  if (!guardResolved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <UGLogo size="md" />
          <LoadingSpinner size={48} />
          <p className="text-sm text-gray-500 font-medium">
            {guardRedirecting ? 'Redirecting…' : 'Verifying access…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      {/* Background Campus Video & Soft Dimming Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none print:hidden overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/ug-video.mp4" type="video/mp4" />
          <source src="/UG video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0B1221]/20" />
      </div>

      {/* ── Web Navbar (Hidden on print) ── */}
      <header className="relative z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-3.5 sticky top-0 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/dashboard" />
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#1e3a8a] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </header>

      {/* ── Page Hero Title (Single seamless background video) ── */}
      <div className="relative py-8 px-4 print:hidden text-center z-10">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/70 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-2 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> UG Health Services Online Appointment System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            {isReschedule ? 'Reschedule Clinic Visit' : 'Book a Clinic Visit'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 drop-shadow-sm">
            {isReschedule
              ? 'Select your new date and time slot below to update your appointment in one click.'
              : 'Follow the steps below to schedule an appointment with UG Health Center doctors.'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 relative z-10">
        {/* ── Wizard Progress Bar (Hidden on print or in reschedule mode) ── */}
        {!isReschedule && (
          <div className="bg-white rounded-2xl border border-[#DDE3EE] p-4 mb-8 shadow-sm print:hidden">
            <div className="flex items-center justify-between gap-2">
              {[
                { s: 1, label: 'Service' },
                { s: 2, label: 'Date & Time' },
                { s: 3, label: 'Doctor & Reason' },
                { s: 4, label: 'Confirmation' },
              ].map((tile, i) => {
                const active = step === tile.s;
                const done = step > tile.s;
                return (
                  <div key={tile.s} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl w-full transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white shadow-md font-bold'
                          : done
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                          : 'bg-[#F5F7FB] text-[#6B7A8D] font-medium border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-extrabold ${
                          active
                            ? 'bg-white text-[#1e3a8a]'
                            : done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[#DDE3EE] text-[#6B7A8D]'
                        }`}
                      >
                        {done ? '✓' : tile.s}
                      </div>
                      <span className="text-xs truncate hidden sm:inline">{tile.label}</span>
                    </div>
                    {i < 3 && <div className="hidden md:block w-4 h-0.5 bg-[#E2E8F0] shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Auto-dismissing Error Banner (Hidden on print) ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-between shadow-xs animate-[fadeIn_200ms_ease_both] print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 p-1 rounded font-bold"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── STEP 1: SERVICE SELECTION (Hidden on print) ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm print:hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Choose Clinical Service</h2>
            <p className="text-xs text-gray-500 mb-6">Select the type of health care service you need today.</p>

            <div className="flex gap-2 mb-6 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSelectedCategory(cat.key);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-[#1e3a8a] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {filteredServices.map((svc) => {
                const IconComp = svc.icon;
                const isSelected = selectedService.id === svc.id;
                const isDental = svc.id === 'dental' || svc.isExternal;
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => {
                      setError(null);
                      setSelectedService(svc);
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? isDental
                          ? 'border-amber-400 bg-amber-50/40 shadow-md ring-2 ring-amber-100'
                          : 'border-[#1e3a8a] bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                        : isDental
                        ? 'border-amber-200/80 hover:border-amber-300 bg-white hover:bg-amber-50/20'
                        : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isSelected
                              ? isDental
                                ? 'bg-amber-600 text-white'
                                : 'bg-[#1e3a8a] text-white'
                              : isDental
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-[#1e3a8a]'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isDental
                              ? 'text-amber-800 bg-amber-100/90 border border-amber-200'
                              : 'text-gray-500 bg-gray-100'
                          }`}
                        >
                          {isDental ? '📍 Main Hospital Only' : `⏱ ${svc.duration}`}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">{svc.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{svc.desc}</p>

                      {isDental && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200">
                          <p className="text-[11px] text-amber-900 font-bold mb-1.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            Location: Main UG Hospital (Legon)
                          </p>
                          <a
                            href="https://www.google.com/maps?q=5.65145873649435,-0.17833193194224153"
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-[#1e3a8a] px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            <Navigation className="w-3.5 h-3.5 text-blue-200" />
                            Get Directions on Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isDental ? 'text-amber-800' : 'text-[#1e3a8a]'
                        }`}
                      >
                        {isSelected
                          ? isDental
                            ? '📍 Main Hospital Service Selected'
                            : '✓ Selected'
                          : isDental
                          ? 'Click to view hospital details'
                          : 'Click to select'}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          className={`w-5 h-5 ${
                            isDental ? 'text-amber-600' : 'text-[#1e3a8a]'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedService.id === 'dental' ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl w-full sm:w-auto flex-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Dental checkups are only available at the Main UG Hospital. Please go to the hospital directly for oral health care.
                  </span>
                </div>
                <a
                  href="https://www.google.com/maps?q=5.65145873649435,-0.17833193194224153"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a8a] transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <Navigation className="w-4 h-4 text-blue-300" />
                  Open Hospital in Google Maps
                </a>
              </div>
            ) : (
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(2);
                  }}
                  className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2"
                >
                  Continue to Date & Time <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: DATE & TIME (Hidden on print) ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm print:hidden">
            {isReschedule && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-[#1e3a8a]">
                  <Clock className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm text-[#0F172A]">Rescheduling Appointment</p>
                    <p className="text-[#334155]">
                      Service: <strong className="text-[#1e3a8a]">{selectedService.title}</strong>
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs font-bold text-gray-500 hover:text-red-600 px-3 py-1.5 border border-gray-200 bg-white rounded-lg transition-colors shrink-0"
                >
                  Cancel Reschedule
                </Link>
              </div>
            )}

            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {isReschedule ? 'Select New Date & Time Slot' : 'Select Date & Time Slot'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              {isReschedule
                ? 'Pick your preferred date and time, then click the button below to reschedule instantly.'
                : 'Choose a date for your visit to view available clinic time slots.'}
            </p>

            {/* Same-day Booking Warning if student already booked on this date */}
            {hasExistingBookingOnDate && !isReschedule && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950 text-sm">You already have an appointment on this date</p>
                  <p className="mt-0.5 leading-relaxed text-amber-900">
                    You have an active appointment scheduled at <strong>{existingTimeSlotOnDate || 'this date'}</strong>.
                    Students may only book one appointment per day. Please select a different date, or manage/reschedule your existing appointment from the dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* General Schedule Banner */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-[#1e3a8a] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">General Appointments Schedule</p>
                <p><span className="font-semibold text-slate-800">Operating Days:</span> Monday to Friday</p>
                <div className="flex flex-wrap gap-4 text-slate-700 pt-0.5">
                  <span><strong className="text-[#1e3a8a]">Morning Session:</strong> 8:30 AM – 12:00 PM</span>
                  <span><strong className="text-[#1e3a8a]">Afternoon Session:</strong> 1:30 PM – 4:00 PM</span>
                </div>
                <p className="text-[11px] text-amber-800 font-semibold pt-1">
                  NB: Weekend & Public Holidays: Emergency Services Only.
                </p>
              </div>
            </div>

            {isWeekend(bookingDate) && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>General appointments are available Monday to Friday only. Weekends & Public Holidays are reserved for Emergency Services. Please choose a weekday.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    setError(null);
                    setBookingDate(new Date(e.target.value));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#1e3a8a]"
                />
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-[#1e3a8a]">Selected Visit Date:</p>
                  <p className="text-sm font-extrabold text-gray-900">
                    {bookingDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                  Available Time Slots *
                </label>

                {isWeekend(bookingDate) ? (
                  <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500 space-y-1">
                    <p className="font-bold text-gray-700">No general appointment slots on weekends.</p>
                    <p>General clinic consultations run Monday to Friday.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[11px] font-bold uppercase text-[#1e3a8a] mb-2 tracking-wide">
                        Morning Session (8:30 AM – 12:00 PM)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {MORNING_SLOTS.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = bookingTime === slot;
                          const isPast = isTimeSlotPast(slot, bookingDate);
                          const isBlockedBySameDay = hasExistingBookingOnDate && !isReschedule;
                          const isDisabled = isBooked || isPast || isBlockedBySameDay;
                          return (
                            <button
                              type="button"
                              key={slot}
                              disabled={isDisabled}
                              onClick={() => {
                                setError(null);
                                setBookingTime(slot);
                              }}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                                isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm ring-2 ring-blue-200'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                              }`}
                              title={
                                isBooked
                                  ? 'Time slot is fully booked'
                                  : isPast
                                  ? 'Time slot has passed'
                                  : isBlockedBySameDay
                                  ? 'You already have an appointment on this date'
                                  : 'Available slot'
                              }
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold uppercase text-[#1e3a8a] mb-2 tracking-wide">
                        Afternoon Session (1:30 PM – 4:00 PM)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AFTERNOON_SLOTS.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = bookingTime === slot;
                          const isPast = isTimeSlotPast(slot, bookingDate);
                          const isBlockedBySameDay = hasExistingBookingOnDate && !isReschedule;
                          const isDisabled = isBooked || isPast || isBlockedBySameDay;
                          return (
                            <button
                              type="button"
                              key={slot}
                              disabled={isDisabled}
                              onClick={() => {
                                setError(null);
                                setBookingTime(slot);
                              }}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                                isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm ring-2 ring-blue-200'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                              }`}
                              title={
                                isBooked
                                  ? 'Time slot is fully booked'
                                  : isPast
                                  ? 'Time slot has passed'
                                  : isBlockedBySameDay
                                  ? 'You already have an appointment on this date'
                                  : 'Available slot'
                              }
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              {isReschedule ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
                >
                  Cancel
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
                >
                  ← Back
                </button>
              )}

              {isReschedule ? (
                <button
                  type="button"
                  disabled={submitting || isWeekend(bookingDate) || bookedSlots.includes(bookingTime)}
                  onClick={handleRescheduleSubmit}
                  className={`px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                    submitting || isWeekend(bookingDate) || bookedSlots.includes(bookingTime)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size={16} /> Rescheduling…
                    </>
                  ) : (
                    <>Confirm Reschedule ✓</>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isWeekend(bookingDate) || (hasExistingBookingOnDate && !isReschedule)}
                  onClick={() => {
                    if (isWeekend(bookingDate)) {
                      setError('General appointments cannot be booked on weekends. Please select a weekday (Monday to Friday).');
                      return;
                    }
                    if (hasExistingBookingOnDate) {
                      setError('You already have an appointment booked on this date. Please select another date.');
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 ${
                    isWeekend(bookingDate) || (hasExistingBookingOnDate && !isReschedule)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1e3a8a] text-white hover:bg-blue-900'
                  }`}
                >
                  Continue to Doctor & Details <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: DOCTOR & REASON (Hidden on print) ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm print:hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Doctor Preference & Visit Reason</h2>
            <p className="text-xs text-gray-500 mb-6">Select a specific doctor or leave empty for auto-assignment by clinic staff.</p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Doctor Selection (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorId('')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-left ${
                      selectedDoctorId === ''
                        ? 'border-[#1e3a8a] bg-blue-50/50 font-bold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#1e3a8a]">⚡ Auto-Assign Available Doctor</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Recommended: Staff will assign the best free doctor.</p>
                  </button>
                  {doctors.map((doc) => (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between text-left ${
                        selectedDoctorId === doc.id
                          ? 'border-[#1e3a8a] bg-blue-50/50 font-bold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">Dr. {doc.firstName} {doc.lastName}</p>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${
                          doc.doctorStatus === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {doc.doctorStatus === 'AVAILABLE' ? '🟢 Free' : '🔴 Busy'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Headache and fever for 2 days / Routine medical check"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Additional Medical Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Any allergies, previous medications, or specific details for the doctor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <LoadingSpinner size={16} /> : 'Complete & Confirm Booking ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIRMATION (Screen card + Official Printable Slip) ── */}
        {step === 4 && (
          <div>
            {/* Screen Confirmation Card (Hidden on print) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center print:hidden">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <Check className="w-8 h-8" />
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800">
                {confirmedStatus === 'CONFIRMED' || confirmedStatus === 'RESCHEDULED'
                  ? 'Booking Confirmed'
                  : 'Awaiting Doctor Assignment'}
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-3">
                {isReschedule
                  ? 'Appointment Rescheduled Successfully!'
                  : confirmedStatus === 'CONFIRMED'
                  ? 'Appointment Scheduled Successfully!'
                  : 'Appointment Submitted Successfully!'}
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
                Your appointment has been registered in the UG Health Services system. Please arrive 10 minutes before your scheduled slot.
              </p>

              <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 max-w-sm mx-auto">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Booking Reference Number</p>
                <p className="text-2xl font-extrabold text-[#1e3a8a] tracking-wider mt-1">{confirmedReference}</p>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 max-w-md mx-auto text-left text-xs space-y-2.5 mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Service:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[200px]">{selectedService.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Date:</span>
                  <span className="font-bold text-gray-900">{bookingDate.toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Time Slot:</span>
                  <span className="font-bold text-gray-900">{bookingTime}</span>
                </div>
                {reason && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Reason:</span>
                    <span className="font-bold text-gray-900 truncate max-w-[200px]">{reason}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Assigned Doctor:</span>
                  <span className="font-bold text-gray-900">{selectedDoctorName}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a8a] transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-blue-200" /> Print Official Slip
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 shadow-sm"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>

            {/* ── Official Printable Slip (Displayed ONLY when printing) ── */}
            <div className="hidden print:block bg-white p-8 text-black font-sans max-w-2xl mx-auto border border-gray-300 rounded-lg">
              {/* Header Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 relative flex items-center justify-center border border-gray-300 rounded p-1">
                    <Image
                      src="/logo.svg"
                      alt="University of Ghana Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight uppercase leading-tight">
                      University of Ghana Health Services
                    </h1>
                    <p className="text-xs font-bold text-gray-700">STUDENT CLINIC DIRECTORATE - LEGON CAMPUS</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Accra, Ghana | Emergency Helpline: +233 20 123 4567</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase border border-black rounded">
                    Official Slip
                  </span>
                  <p className="text-[9px] text-gray-500 mt-1">
                    Issued: {new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              {/* Title & Reference Box */}
              <div className="text-center mb-6">
                <h2 className="text-base font-extrabold uppercase tracking-wider underline underline-offset-4 mb-3">
                  Appointment Confirmation Slip
                </h2>
                <div className="bg-gray-100 border border-gray-300 rounded p-3 inline-block min-w-[280px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Booking Reference</p>
                  <p className="text-xl font-black tracking-widest text-black mt-0.5">{confirmedReference}</p>
                  <p className="text-[9px] font-semibold text-gray-700 mt-0.5">Status: CONFIRMED</p>
                </div>
              </div>

              {/* Structured Appointment Details Table */}
              <div className="border border-gray-300 rounded overflow-hidden mb-6 text-xs">
                <table className="w-full divide-y divide-gray-300">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="py-2 px-3 font-bold text-gray-700 w-1/3">Patient Name:</td>
                      <td className="py-2 px-3 font-bold text-black">
                        {storeUser?.firstName} {storeUser?.lastName}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-gray-700">Student ID / Email:</td>
                      <td className="py-2 px-3 text-black">
                        {storeUser?.studentId ? `${storeUser.studentId} (${storeUser.email})` : storeUser?.email || 'Registered Student'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-2 px-3 font-bold text-gray-700">Clinical Service:</td>
                      <td className="py-2 px-3 font-bold text-black">{selectedService.title}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-gray-700">Appointment Date:</td>
                      <td className="py-2 px-3 font-bold text-black">
                        {bookingDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-2 px-3 font-bold text-gray-700">Scheduled Time Slot:</td>
                      <td className="py-2 px-3 font-bold text-black">{bookingTime}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-gray-700">Clinic Location:</td>
                      <td className="py-2 px-3 text-black">Student Clinic Block, Main University Road, Legon Campus</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-2 px-3 font-bold text-gray-700">Assigned Doctor:</td>
                      <td className="py-2 px-3 text-black">{selectedDoctorName}</td>
                    </tr>
                    {reason && (
                      <tr>
                        <td className="py-2 px-3 font-bold text-gray-700">Reason for Visit:</td>
                        <td className="py-2 px-3 text-black">{reason}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Instructions for Students */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 text-[11px] space-y-1.5">
                <p className="font-bold text-black uppercase tracking-wide text-xs mb-1">Important Instructions</p>
                <p className="text-gray-700">• Please arrive at least 10 minutes prior to your scheduled time slot.</p>
                <p className="text-gray-700">• Present your valid University of Ghana Student ID card at the reception desk.</p>
                <p className="text-gray-700">• If you need to reschedule or cancel, please do so via the student portal at least 2 hours in advance.</p>
                <p className="text-gray-700">• For urgent medical inquiries or emergencies, call the 24/7 hotline at +233 20 123 4567.</p>
              </div>

              {/* Official Seal / Signature Line */}
              <div className="pt-4 border-t border-gray-300 flex justify-between items-end text-[10px] text-gray-600">
                <div>
                  <p className="font-bold text-gray-800">University of Ghana Health Services</p>
                  <p>Verified Electronic Clinic Appointment Record</p>
                </div>
                <div className="text-right">
                  <div className="w-48 border-b border-gray-400 mb-1" />
                  <p className="font-semibold text-gray-700">Authorized Signature / Clinic Stamp</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
          <LoadingSpinner size={48} />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
