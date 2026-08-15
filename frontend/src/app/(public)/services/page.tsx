'use client';

import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  Stethoscope,
  Heart,
  ShieldAlert,
  Apple,
  Eye,
  ClipboardList,
  BookOpen,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from '@/components/icons';

interface Service {
  id: string;
  category: string;
  categoryBadge: string;
  title: string;
  description: string;
  availability: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FAQ {
  category: string;
  title: string;
  whatToExpect: string;
  whoCanAccess: string;
  availableTimes: string;
  cost: string;
}

interface ScheduleRow {
  day: string;
  morning: string;
  afternoon: string;
}

const services: Service[] = [
  { id: 'general', category: 'General', categoryBadge: 'bg-blue-50 text-[#1e3a8a] border-blue-200', title: 'General Consultation', description: 'Comprehensive medical examinations, diagnosis, and treatment for common illnesses and injuries.', availability: 'Mon–Fri, 8am–5pm', icon: Stethoscope },
  { id: 'mental-health', category: 'Mental Health', categoryBadge: 'bg-purple-50 text-purple-700 border-purple-200', title: 'Mental Health & Counseling', description: 'Confidential psychological support, counseling sessions, and mental wellness resources for students.', availability: 'Mon–Fri, 9am–4pm', icon: Heart },
  { id: 'hiv', category: 'HIV / AIDS', categoryBadge: 'bg-[#0369A1]/10 text-[#0369A1] border-cyan-200', title: 'HIV/AIDS Testing & Support', description: 'Free, confidential HIV testing, counseling, and ongoing support services for the university community.', availability: 'Tue & Thu', icon: ShieldAlert },
  { id: 'nutrition', category: 'Nutrition', categoryBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200', title: 'Nutrition & Dietetics', description: 'Personalized dietary assessments, nutritional counseling, and healthy eating plans tailored to student lifestyles.', availability: 'Mon, Wed, Fri', icon: Apple },
  { id: 'eye-care', category: 'Eye Care', categoryBadge: 'bg-sky-50 text-sky-700 border-sky-200', title: 'Eye Care Services', description: 'Vision screening, eye health assessments, and referrals for glasses or specialized eye treatment.', availability: 'Wed only', icon: Eye },
  { id: 'screening', category: 'Screening', categoryBadge: 'bg-amber-50 text-amber-700 border-amber-200', title: 'Health Screening', description: 'Comprehensive health screening packages including blood pressure, blood sugar, BMI, and general wellness checks.', availability: 'Mon–Fri', icon: ClipboardList },
  { id: 'education', category: 'Education', categoryBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200', title: 'Health Education', description: 'Workshops, seminars, and educational resources on topics including sexual health, nutrition, and disease prevention.', availability: 'Monthly programs', icon: BookOpen },
  { id: 'family-planning', category: 'Family Planning', categoryBadge: 'bg-pink-50 text-pink-700 border-pink-200', title: 'Family Planning', description: 'Confidential family planning advice, contraception services, and reproductive health consultations.', availability: 'Mon & Thu', icon: HeartPulse },
  { id: 'emergency', category: 'Emergency', categoryBadge: 'bg-rose-50 text-rose-700 border-rose-200', title: '24/7 Emergency Care', description: 'Urgent medical response and emergency triage for campus residents and registered students.', availability: '24/7 Hotline', icon: ShieldAlert },
];

const steps: Step[] = [
  { number: '1', title: 'Choose a Service', description: 'Browse our specialized services and select what you need today.', icon: ClipboardList },
  { number: '2', title: 'Book or Walk In', description: 'Schedule your appointment online or visit during operating hours.', icon: Calendar },
  { number: '3', title: 'Visit the Clinic', description: 'Arrive at the Student Clinic Block at your scheduled time slot.', icon: Building2 },
  { number: '4', title: 'Get Your Care', description: 'Receive professional, confidential medical treatment and prescription.', icon: UserCheck },
];

const faqs: FAQ[] = [
  {
    category: 'GENERAL',
    title: 'General Consultation',
    whatToExpect: 'Comprehensive medical examination including vital signs check, symptom assessment, diagnosis, and treatment plan.',
    whoCanAccess: 'All UG students, staff, and faculty members with valid university ID.',
    availableTimes: 'Monday–Friday, 8:00 AM – 5:00 PM',
    cost: 'Free for all registered students',
  },
  {
    category: 'MENTAL HEALTH',
    title: 'Mental Health & Counseling',
    whatToExpect: 'One-on-one confidential therapy sessions, stress management techniques, and academic wellness guidance.',
    whoCanAccess: 'All registered University of Ghana students.',
    availableTimes: 'Monday–Friday, 9:00 AM – 4:00 PM',
    cost: 'Free for students',
  },
  {
    category: 'TESTING',
    title: 'HIV/AIDS Testing & Counseling',
    whatToExpect: 'Rapid confidential testing, pre and post-test counseling, and ongoing management resources.',
    whoCanAccess: 'Entire university community (students & staff).',
    availableTimes: 'Tuesdays & Thursdays, 9:00 AM – 3:00 PM',
    cost: 'Free & completely confidential',
  },
];

const schedule: ScheduleRow[] = [
  { day: 'Monday', morning: 'Available (8:00 – 12:00)', afternoon: 'Available (1:30 – 5:00)' },
  { day: 'Tuesday', morning: 'Available (8:00 – 12:00)', afternoon: 'Available (1:30 – 5:00)' },
  { day: 'Wednesday', morning: 'Available (8:00 – 12:00)', afternoon: 'Available (1:30 – 5:00)' },
  { day: 'Thursday', morning: 'Available (8:00 – 12:00)', afternoon: 'Available (1:30 – 5:00)' },
  { day: 'Friday', morning: 'Available (8:00 – 12:00)', afternoon: 'Available (1:30 – 5:00)' },
  { day: 'Saturday', morning: 'Available (9:00 – 1:00)', afternoon: 'Closed' },
  { day: 'Sunday', morning: 'Closed', afternoon: 'Closed' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Header />

      {/* Hero — Matching Dark Navy Theme */}
      <section className="relative bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#0369A1] text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-[fadeIn_300ms_ease_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md mb-4">
            UG Health Center Services
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Clinical & Healthcare Services
          </h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Professional, confidential, and comprehensive health care services tailored specifically for University of Ghana students.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Free for All Students', 'Confidential Care', 'Licensed Medical Staff'].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-blue-200">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <div className="bg-rose-500/10 border-b border-rose-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-rose-900 text-xs sm:text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>For urgent medical emergencies, call our 24/7 hotline <strong>+233 20 123 4567</strong> or visit the clinic immediately.</span>
          </p>
          <a
            href="tel:+233201234567"
            className="shrink-0 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-lg px-4 py-2 shadow-xs transition-colors"
          >
            Call Emergency 24/7
          </a>
        </div>
      </div>

      {/* Services Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
            Available Services
          </span>
          <h2 className="text-3xl font-extrabold text-[#0B1221]">Everything You Need, All in One Place</h2>
          <p className="text-sm text-[#6B7A8D] mt-2 max-w-xl mx-auto">
            From general checkups to specialized care, the UG Student Clinic offers a full range of medical services.
          </p>
          <p className="text-xs font-medium text-[#0369A1] mt-1">
            Note: For advanced optical and complex dental procedures, please visit the Main UG Hospital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => {
            const IconComp = svc.icon;
            return (
              <div
                key={svc.id}
                className="bg-white border border-[#DDE3EE] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#94A3B8] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-[#F5F7FB] border border-[#DDE3EE] rounded-xl flex items-center justify-center text-[#1e3a8a] shadow-xs">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${svc.categoryBadge}`}>
                      {svc.category}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-[#0B1221] text-base mb-2">{svc.title}</h3>
                  <p className="text-xs text-[#6B7A8D] leading-relaxed mb-4">{svc.description}</p>
                </div>

                <div className="pt-4 border-t border-[#EEF1F8] flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#4B5A6E] font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0369A1]" />
                    {svc.availability}
                  </span>
                  <Link
                    href="/demo-booking"
                    className="font-bold text-[#0369A1] hover:text-[#0F172A] inline-flex items-center gap-1 transition-colors"
                  >
                    Book
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#0369A1] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-white/10 border border-white/15 text-blue-200 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 backdrop-blur-sm">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl font-extrabold text-white mb-2">Getting Care is Simple</h2>
          <p className="text-xs text-blue-100/80 mb-12">Four easy steps to access health care at Legon campus</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-center shadow-md"
                >
                  <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <StepIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">Step {step.number}</span>
                  <h3 className="font-extrabold text-white text-base mt-1 mb-2">{step.title}</h3>
                  <p className="text-xs text-blue-100/90 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ & Service Details */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
            DETAILS & FAQS
          </span>
          <h2 className="text-3xl font-extrabold text-[#0B1221]">What to Expect During Your Visit</h2>
          <p className="text-sm text-[#6B7A8D] mt-2">Key details for student consultations.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.title} className="bg-white rounded-2xl border border-[#DDE3EE] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-[#0B1221] text-base">{faq.title}</h3>
                <span className="px-2.5 py-1 bg-blue-50 text-[#1e3a8a] text-[10px] font-extrabold rounded-lg border border-blue-100 uppercase">
                  {faq.category}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5 bg-[#F5F7FB] p-4 rounded-xl border border-[#DDE3EE]">
                <div><strong className="text-[#0B1221]">What to expect:</strong> <span className="text-[#4B5A6E]">{faq.whatToExpect}</span></div>
                <div><strong className="text-[#0B1221]">Who can access:</strong> <span className="text-[#4B5A6E]">{faq.whoCanAccess}</span></div>
                <div><strong className="text-[#0B1221]">Available times:</strong> <span className="text-[#4B5A6E]">{faq.availableTimes}</span></div>
                <div><strong className="text-[#0B1221]">Cost:</strong> <span className="text-emerald-700 font-bold">{faq.cost}</span></div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/demo-booking"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-xs hover:shadow-md transition-all"
                >
                  Book This Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clinic Hours Table Section */}
      <section className="bg-white py-16 border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
              SCHEDULE
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B1221]">Weekly Consultation Timetable</h2>
            <p className="text-sm text-[#6B7A8D] mt-2">Standard operating hours for general and specialist clinics.</p>
          </div>

          <div className="bg-[#F5F7FB] rounded-2xl border border-[#DDE3EE] overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-[#0F172A] text-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider">
              <span>Day</span>
              <span className="text-center">Morning Session</span>
              <span className="text-right">Afternoon Session</span>
            </div>
            <div className="divide-y divide-[#DDE3EE]">
              {schedule.map((row) => (
                <div key={row.day} className="grid grid-cols-3 px-5 py-3 text-xs items-center bg-white">
                  <span className="font-bold text-[#0B1221]">{row.day}</span>
                  <span className={`text-center font-medium ${row.morning.includes('Available') ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                    {row.morning}
                  </span>
                  <span className={`text-right font-medium ${row.afternoon.includes('Available') ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                    {row.afternoon}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/demo-booking"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Book Clinic Appointment Online
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
