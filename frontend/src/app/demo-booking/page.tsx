'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

interface ServiceOption {
  id: string;
  title: string;
  desc: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
}

const SERVICES: ServiceOption[] = [
  { id: 'general', category: 'consultation', title: 'General Consultation', desc: 'Routine medical checkups, physical symptoms, and general health advice.', icon: Stethoscope, duration: '20 mins' },
  { id: 'mental', category: 'specialist', title: 'Mental Health & Counseling', desc: 'Confidential psychological support, stress management, and guidance.', icon: Brain, duration: '45 mins' },
  { id: 'hiv', category: 'screening', title: 'HIV/AIDS Testing & Wellness', desc: 'Voluntary testing, pre/post counselling, and confidential care.', icon: Ribbon, duration: '30 mins' },
  { id: 'nutrition', category: 'specialist', title: 'Nutrition & Dietetics', desc: 'Personalized meal planning, BMI consultations, and healthy lifestyle guidance.', icon: Leaf, duration: '30 mins' },
  { id: 'screening', category: 'screening', title: 'Comprehensive Health Screening', desc: 'Blood pressure, glucose tests, lab work, and physical evaluation.', icon: Zap, duration: '40 mins' },
  { id: 'vaccination', category: 'preventative', title: 'Vaccinations & Immunizations', desc: 'Travel vaccines, seasonal flu shots, and booster immunizations.', icon: Syringe, duration: '15 mins' },
  { id: 'prescription', category: 'pharmacy', title: 'Prescription & Pharmacy Refill', desc: 'Medication refills and pharmacist consultation for students.', icon: Pill, duration: '15 mins' },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'General Medicine': Stethoscope,
  'Dental': Syringe,
  'Ophthalmology': Eye,
  'consultation': Stethoscope,
  'specialist': Brain,
  'screening': Ribbon,
  'preventative': Syringe,
  'pharmacy': Pill,
};

const TIME_SLOT_LABELS = [
  '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM',
  '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
  '03:30 PM', '04:00 PM',
];

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Services' },
  { key: 'consultation', label: 'Consultation' },
  { key: 'specialist', label: 'Specialist' },
  { key: 'screening', label: 'Screening' },
  { key: 'preventative', label: 'Preventative' },
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

const isTimeSlotPast = (timeStr: string, selectedDate: Date) => {
  const today = new Date();
  const isSameDay = today.getFullYear() === selectedDate.getFullYear()
    && today.getMonth() === selectedDate.getMonth()
    && today.getDate() === selectedDate.getDate();
  if (!isSameDay) return false;
  return getTimeSlotDate(timeStr, selectedDate) < new Date();
};

const findNextAvailableSlot = (selectedDate: Date, booked: string[]) => TIME_SLOT_LABELS.find(
  (slot) => !isTimeSlotPast(slot, selectedDate) && !booked.includes(slot)
);

export default function StudentBookingPage() {
  const router = useRouter();

  // Read auth synchronously from store (zustand persist hydrates from localStorage sync)
  const storeAuth = useAuthStore((s) => s.isAuthenticated);
  const storeUser = useAuthStore((s) => s.user);
  const storeTokens = useAuthStore((s) => s.tokens);

  // Initial guard state: start unresolved until validated. Use sync store snapshot
  // to pre-compute whether we are already likely valid, avoiding unnecessary flash.
  const initialSnap = useAuthStore.getState();
  const initialRole = normalizeRole(initialSnap.user?.role);
  const initialIsAuth = initialSnap.isAuthenticated && !!initialSnap.user;
  const initialIsStudent = initialRole === 'STUDENT';

  const [guardResolved, setGuardResolved] = useState<boolean>(() => initialIsAuth && initialIsStudent);
  const [guardRedirecting, setGuardRedirecting] = useState<boolean>(false);
  const [servicesFetched, setServicesFetched] = useState<ServiceOption[]>(SERVICES);
  const [confirmedId, setConfirmedId] = useState<string>('');
  const [confirmedReference, setConfirmedReference] = useState<string>('');
  const [confirmedStatus, setConfirmedStatus] = useState<'PENDING' | 'CONFIRMED'>('CONFIRMED');

  // Form State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceOption>(SERVICES[0]);
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [bookingTime, setBookingTime] = useState<string>('09:00 AM');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Data Loading
  const [doctors, setDoctors] = useState<StaffDoctor[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // #region debug-point A:booking-page-first-paint
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"booking-auth-flash",runId:"pre-fix",hypothesisId:"A",location:"demo-booking/page.tsx:firstPaint",msg:"[DEBUG] Booking page first paint snapshot",data:{initialIsAuth,initialIsStudent,guardResolvedInitial:initialIsAuth&&initialIsStudent,hasUser:!!initialSnap.user,hasAccessToken:!!initialSnap.tokens?.accessToken,role:initialRole},ts:Date.now()})}).catch(()=>{});
    // #endregion
  }, [initialIsAuth, initialIsStudent, initialRole, initialSnap.user, initialSnap.tokens]);

  // ——— Route Guard: validate synchronously on mount using store snapshot ———
  // Zustand persist hydrates localStorage synchronously before first render,
  // so store.getState() is authoritative immediately.
  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const runGuard = () => {
      const state = useAuthStore.getState();
      const currentUser = state.user ?? storeUser;
      const currentAuth = state.isAuthenticated || storeAuth;
      const currentTokens = state.tokens ?? storeTokens;
      const role = normalizeRole(currentUser?.role);
      // #region debug-point B:booking-guard-state
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"booking-auth-flash",runId:"pre-fix",hypothesisId:"B",location:"demo-booking/page.tsx:runGuard",msg:"[DEBUG] Booking guard evaluated state",data:{currentAuth,hasUser:!!currentUser,hasAccessToken:!!currentTokens?.accessToken,role,guardResolvedBefore:guardResolved},ts:Date.now()})}).catch(()=>{});
      // #endregion
      if (!currentAuth || !currentUser) {
        setGuardRedirecting(true);
        const target = getLoginRouteForRole(role);
        // #region debug-point D:booking-redirect-login
        fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"booking-auth-flash",runId:"pre-fix",hypothesisId:"D",location:"demo-booking/page.tsx:redirectLogin",msg:"[DEBUG] Booking guard redirecting to login",data:{target,currentAuth,hasUser:!!currentUser,hasAccessToken:!!currentTokens?.accessToken,role},ts:Date.now()})}).catch(()=>{});
        // #endregion
        // Delay replace by 0 ticks to let loading screen paint; avoids back-button issues
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
        // #region debug-point D:booking-redirect-nonstudent
        fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"booking-auth-flash",runId:"pre-fix",hypothesisId:"D",location:"demo-booking/page.tsx:redirectNonStudent",msg:"[DEBUG] Booking guard redirecting non-student",data:{target,currentAuth,hasUser:!!currentUser,hasAccessToken:!!currentTokens?.accessToken,role},ts:Date.now()})}).catch(()=>{});
        // #endregion
        redirectTimer = setTimeout(() => {
          if (active) router.replace(target);
        }, 0);
        return;
      }

      // #region debug-point C:booking-guard-resolved
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"booking-auth-flash",runId:"pre-fix",hypothesisId:"C",location:"demo-booking/page.tsx:guardResolved",msg:"[DEBUG] Booking guard resolved student access",data:{currentAuth,hasUser:!!currentUser,hasAccessToken:!!currentTokens?.accessToken,role},ts:Date.now()})}).catch(()=>{});
      // #endregion
      setGuardResolved(true);
    };

    runGuard();
    return () => {
      active = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router, storeAuth, storeUser, storeTokens]);

  // ——— Data Fetching ———
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
      const availability = await appointmentApi.getAvailability(dateStr, serviceId);
      const slots = Array.isArray(availability) ? availability : ((availability as any)?.bookedSlots ?? []);
      setBookedSlots(slots);
      if (isTimeSlotPast(bookingTime, date) || slots.includes(bookingTime)) {
        const next = findNextAvailableSlot(date, slots);
        if (next) setBookingTime(next);
      }
    } catch {
      setBookedSlots([]);
    }
  }, [bookingTime]);

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

  // ——— Booking Submit ———
  const handleConfirmBooking = async () => {
    if (!reason.trim()) {
      setError('Please briefly state the reason for your visit.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        serviceId: selectedService.id,
        date: bookingDate.toISOString().split('T')[0],
        timeSlot: bookingTime,
        reason: reason.trim(),
      };
      if (notes.trim()) payload.notes = notes.trim();
      if (selectedDoctorId) payload.doctorId = selectedDoctorId;

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
      setError(getErrorMessage(err, 'Failed to complete booking. You may already have a booking on this date.'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = servicesFetched.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory
  );

  // ——— Paint loading shell until guard is resolved ———
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 sticky top-0 z-20 shadow-2xs">
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

      <div className="bg-gradient-to-r from-[#1e3a8a] via-blue-900 to-indigo-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-2 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            UG Health Services Online Appointment System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Book a Clinic Visit</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Follow the steps below to schedule an appointment with UG Health Center doctors.
          </p>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 py-8 flex-1">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-8 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { s: 1, label: 'Select Service' },
              { s: 2, label: 'Date & Time' },
              { s: 3, label: 'Doctor & Reason' },
              { s: 4, label: 'Confirmation' },
            ].map((tile) => {
              const active = step === tile.s;
              const done = step > tile.s;
              return (
                <div
                  key={tile.s}
                  className={`p-2.5 rounded-xl transition-all ${
                    active ? 'bg-blue-50 text-[#1e3a8a] font-bold border border-blue-200' :
                    done ? 'text-emerald-700 font-semibold' : 'text-gray-400'
                  }`}
                >
                  <span className="block text-[10px] uppercase">Step {tile.s}</span>
                  {tile.s}. {tile.label}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Choose Clinical Service</h2>
            <p className="text-xs text-gray-500 mb-6">Select the type of health care service you need today.</p>

            <div className="flex gap-2 mb-6 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
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
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1e3a8a] bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-blue-100 text-[#1e3a8a]'}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          ⏱ {svc.duration}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">{svc.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{svc.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1e3a8a]">
                        {isSelected ? '✓ Selected' : 'Click to select'}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1e3a8a]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2"
              >
                Continue to Date & Time <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Select Date & Time Slot</h2>
            <p className="text-xs text-gray-500 mb-6">Choose a date for your visit to view available clinic time slots.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate.toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(new Date(e.target.value))}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TIME_SLOT_LABELS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = bookingTime === slot;
                    const isPast = isTimeSlotPast(slot, bookingDate);
                    const isDisabled = isBooked || isPast;
                    return (
                      <button
                        type="button"
                        key={slot}
                        disabled={isDisabled}
                        onClick={() => setBookingTime(slot)}
                        className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                          isDisabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm ring-2 ring-blue-200'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2"
              >
                Continue to Doctor & Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
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
                onClick={() => setStep(2)}
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

        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center">
            {confirmedStatus === 'CONFIRMED' ? (
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <Check className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}
            <span
              className={
                'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest ' +
                (confirmedStatus === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800')
              }
            >
              {confirmedStatus === 'CONFIRMED' ? 'Booking Confirmed' : 'Awaiting Doctor Assignment'}
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
              {confirmedStatus === 'CONFIRMED'
                ? 'Appointment Scheduled Successfully!'
                : 'Appointment Submitted Successfully!'}
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {confirmedStatus === 'CONFIRMED'
                ? 'Your appointment has been registered in the UG Health Services system. Please arrive 10 minutes before your scheduled slot.'
                : 'Your booking has been received. A clinic receptionist will assign a doctor to your appointment and confirm the schedule shortly.'}
            </p>
            <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 max-w-sm mx-auto">
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Booking Reference Number</p>
              <p className="text-2xl font-extrabold text-[#1e3a8a] tracking-wider mt-1">{confirmedReference}</p>
              {confirmedId && (
                <p className="text-[10px] text-gray-400 mt-1">Internal ID: {confirmedId}</p>
              )}
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 max-w-md mx-auto text-left text-xs space-y-2 mb-8">
              {[
                { label: 'Service', value: selectedService.title },
                { label: 'Date', value: bookingDate.toLocaleDateString('en-GB') },
                { label: 'Time Slot', value: bookingTime },
                { label: 'Reason', value: reason },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500 font-semibold">{row.label}:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[200px]">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 shadow-sm"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
