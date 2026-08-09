'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Copy,
  AlertTriangle,
  Send,
  Stethoscope,
  Brain,
  HeartPulse,
  Ribbon,
  Pill,
  Smile,
  ArrowRight,
  ShieldCheck,
  Building2,
} from '@/components/icons';

const CLINIC_ADDRESS = 'University of Ghana, Legon — Student Clinic Block, Accra, Ghana';

const ways = [
  {
    icon: MapPin,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-100',
    title: 'Visit Us',
    lines: ['Student Clinic Block', 'University of Ghana, Legon'],
    cta: 'Get Directions',
    href: 'https://www.google.com/maps/search/?api=1&query=University+of+Ghana+Legon+Hospital',
  },
  {
    icon: Phone,
    badgeColor: 'bg-[#1e3a8a]/10 text-[#1e3a8a] border-blue-100',
    title: 'Call Us',
    lines: ['General: +233 30 250 0000', 'Emergency: +233 20 123 4567'],
    cta: 'Call Now',
    href: 'tel:+233302500000',
  },
  {
    icon: Mail,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-100',
    title: 'Email Us',
    lines: ['clinic@ug.edu.gh', 'Response within 24 hours'],
    cta: 'Send Email',
    href: 'mailto:clinic@ug.edu.gh',
  },
  {
    icon: AlertTriangle,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
    title: 'Emergency',
    lines: ['24/7 hotline', 'For urgent medical help'],
    cta: 'Call Emergency',
    href: 'tel:+233201234567',
  },
];

const hours = [
  { day: 'Monday', time: '8:00 AM – 5:00 PM', status: 'open' },
  { day: 'Tuesday', time: '8:00 AM – 5:00 PM', status: 'open' },
  { day: 'Wednesday', time: '8:00 AM – 5:00 PM', status: 'open' },
  { day: 'Thursday', time: '8:00 AM – 5:00 PM', status: 'open' },
  { day: 'Friday', time: '8:00 AM – 5:00 PM', status: 'open' },
  { day: 'Saturday', time: '9:00 AM – 1:00 PM', status: 'limited' },
  { day: 'Sunday', time: 'Closed', status: 'closed' },
];

const statusBadge: Record<string, { dot: string; text: string; label: string }> = {
  open: { dot: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Open' },
  limited: { dot: 'bg-amber-500', text: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Limited' },
  closed: { dot: 'bg-rose-500', text: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Closed' },
};

const departments = [
  {
    icon: Stethoscope,
    name: 'General Medicine',
    location: 'Block A, Ground Floor',
    phone: '+233 30 250 0001',
    email: 'general@ug.edu.gh',
    hours: 'Mon–Fri',
  },
  {
    icon: Brain,
    name: 'Mental Health & Counselling',
    location: 'Counselling Wing',
    phone: '+233 30 250 0002',
    email: 'wellbeing@ug.edu.gh',
    hours: 'By appointment',
  },
  {
    icon: Ribbon,
    name: 'Sexual Health',
    location: 'Block B, Room 4',
    phone: '+233 30 250 0003',
    email: 'sexualhealth@ug.edu.gh',
    hours: 'Mon–Fri',
  },
  {
    icon: HeartPulse,
    name: 'Student Wellness',
    location: 'Wellness Centre',
    phone: '+233 30 250 0004',
    email: 'wellness@ug.edu.gh',
    hours: 'Mon–Fri',
  },
  {
    icon: Pill,
    name: 'Pharmacy',
    location: 'Block A, Room 2',
    phone: '+233 30 250 0005',
    email: 'pharmacy@ug.edu.gh',
    hours: 'Mon–Sat',
  },
  {
    icon: Smile,
    name: 'Dental Services',
    location: 'Main UG Hospital',
    phone: '+233 30 250 0006',
    email: 'dental@ug.edu.gh',
    hours: 'Mon–Fri',
  },
];

const faqs = [
  {
    q: 'How quickly will I get a response?',
    a: 'We aim to respond to all enquiries within 24 hours on working days. For urgent medical concerns, please call our emergency hotline instead of using the contact form.',
  },
  {
    q: 'Is my information kept confidential?',
    a: 'Absolutely. All consultations and records are handled in strict confidence in line with our privacy policy.',
  },
  {
    q: 'Can I contact a specific department directly?',
    a: 'Yes — use the "Contact a Specific Department" section below to reach the right team by email or phone.',
  },
  {
    q: 'What should I do in an emergency?',
    a: 'Call our 24/7 emergency hotline on +233 20 123 4567 or go directly to the Student Clinic. Do not wait for an email response.',
  },
];

export default function ContactPageClient() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    department: 'General Medicine',
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm({ name: '', studentId: '', email: '', phone: '', subject: '', message: '', department: 'General Medicine' });
    }, 1200);
  };

  const copyAddress = () => {
    navigator.clipboard?.writeText(CLINIC_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 placeholder:text-[#9CA8BA]';

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#0369A1] text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-[fadeIn_300ms_ease_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md mb-4">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            UG Student Health Center
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Contact & Support
          </h1>
          <p className="text-blue-100/90 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            Have a question or need assistance? Reach out to the UG Student Clinic team — we&apos;re here to help you stay healthy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="tel:+233302500000"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white transition-all duration-200"
            >
              <Phone className="h-4 w-4" /> Call General
            </a>
            <a
              href="mailto:clinic@ug.edu.gh"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white transition-all duration-200"
            >
              <Mail className="h-4 w-4" /> Email Us
            </a>
            <a
              href="#contact-form"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-[#0F172A] shadow-md hover:bg-blue-50 transition-all duration-200"
            >
              <Send className="h-4 w-4" /> Send Message
            </a>
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
            Call Emergency Hotline
          </a>
        </div>
      </div>

      {/* Main Grid: Ways to Get in Touch */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
            Reach Out
          </span>
          <h2 className="text-3xl font-extrabold text-[#0B1221]">Ways to Get in Touch</h2>
          <p className="text-sm text-[#6B7A8D] mt-2 max-w-lg mx-auto">Choose the method that works best for your health query.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ways.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.title}
                className="bg-white rounded-2xl border border-[#DDE3EE] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${w.badgeColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-[#0B1221] text-base mb-2">{w.title}</h3>
                  <div className="space-y-1 mb-5">
                    {w.lines.map((line) => (
                      <p key={line} className="text-xs text-[#6B7A8D] font-medium leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>

                <a
                  href={w.href}
                  target={w.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border border-[#DDE3EE] text-[#4B5A6E] hover:text-[#0F172A] hover:bg-[#F5F7FB] transition-all duration-200"
                >
                  {w.cta} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Location & Hours Grid */}
      <section className="bg-white py-16 border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Directions / Map Card */}
          <div className="bg-[#F5F7FB] rounded-2xl border border-[#DDE3EE] overflow-hidden flex flex-col justify-between p-6">
            <div>
              <div className="h-44 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-xl flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 backdrop-blur-md">
                  <MapPin className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-extrabold text-lg">University of Ghana Student Clinic</h3>
                <p className="text-xs text-blue-200 mt-1">Legon Campus, Accra, Ghana</p>
              </div>

              <div className="space-y-3 mb-6 text-xs text-[#4B5A6E]">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#0369A1] shrink-0 mt-0.5" />
                  <span>Student Clinic Block, Main University Road, Legon Campus</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#0369A1] shrink-0 mt-0.5" />
                  <span>+233 30 250 0000 / +233 20 123 4567</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#0369A1] shrink-0 mt-0.5" />
                  <span>clinic@ug.edu.gh</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E2E8F0]">
              <a
                href="https://www.google.com/maps/search/?api=1&query=University+of+Ghana+Legon+Hospital"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <Navigation className="h-4 w-4" /> Get Google Directions
              </a>
              <button
                onClick={copyAddress}
                className="inline-flex items-center gap-2 border border-[#DDE3EE] text-[#4B5A6E] hover:bg-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Copy className="h-4 w-4" /> {copied ? 'Address Copied!' : 'Copy Address'}
              </button>
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="bg-[#F5F7FB] rounded-2xl border border-[#DDE3EE] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-xl flex items-center justify-center text-white shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0B1221] text-base">Operating Hours</h3>
                  <p className="text-xs text-[#6B7A8D]">Standard clinic schedule for walk-ins and appointments</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#DDE3EE] overflow-hidden divide-y divide-[#EEF1F8]">
                {hours.map((h) => {
                  const badge = statusBadge[h.status];
                  return (
                    <div key={h.day} className="flex items-center justify-between px-4 py-3 text-xs">
                      <span className="font-bold text-[#0B1221]">{h.day}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-[#4B5A6E]">{h.time}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-[#9CA8BA] mt-4 text-center">
              Emergency medical hotline operates 24 hours a day, 7 days a week.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
              Message Us
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B1221]">Send a Message to the Clinic</h2>
            <p className="text-sm text-[#6B7A8D] mt-2">Complete the form below and our administrative team will respond within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center shadow-md animate-[scaleIn_200ms_ease]">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold text-[#0B1221] mb-2">Message Delivered</h3>
              <p className="text-sm text-[#6B7A8D] mb-6 max-w-md mx-auto">
                Thank you for reaching out. A representative from the UG Student Clinic will reply to your email within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F172A] hover:bg-[#1e3a8a] transition-all shadow-sm"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-[#DDE3EE] p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#0B1221] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input required value={form.name} onChange={set('name')} placeholder="e.g. Kwame Mensah" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1221] mb-1.5">Student ID (optional)</label>
                  <input value={form.studentId} onChange={set('studentId')} placeholder="e.g. 10987654" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#0B1221] mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="student@st.ug.edu.gh" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1221] mb-1.5">Phone Number (optional)</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="e.g. 0241234567" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1221] mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input required value={form.subject} onChange={set('subject')} placeholder="How can we assist you?" className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1221] mb-1.5">Department Target</label>
                <select value={form.department} onChange={set('department')} className={inputClass}>
                  {departments.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1221] mb-1.5">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <textarea required value={form.message} onChange={set('message')} placeholder="Type your detailed message here..." rows={5} className={`${inputClass} resize-y`} />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting Message…</>
                ) : (
                  <>Send Message <Send className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Departments Grid Section */}
      <section className="bg-white py-16 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
              Departments
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B1221]">Contact a Specific Department</h2>
            <p className="text-sm text-[#6B7A8D] mt-2 max-w-lg mx-auto">Direct contacts for specialized clinic units.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.name}
                  className="bg-[#F5F7FB] border border-[#DDE3EE] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#94A3B8] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 bg-white border border-[#DDE3EE] rounded-xl flex items-center justify-center mb-4 text-[#1e3a8a] shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-[#0B1221] text-base mb-1">{d.name}</h3>
                    <p className="text-xs text-[#6B7A8D] font-medium mb-4">{d.location}</p>

                    <div className="space-y-1.5 text-xs text-[#4B5A6E] mb-5">
                      <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#0369A1]" /> {d.phone}</p>
                      <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#0369A1]" /> {d.email}</p>
                      <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#0369A1]" /> {d.hours}</p>
                    </div>
                  </div>

                  <a
                    href={`mailto:${d.email}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#DDE3EE] text-[#0F172A] hover:bg-blue-50 hover:border-blue-200 transition-all"
                  >
                    Email Unit <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-[#F5F7FB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-white text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-sm mb-3">
              FAQ
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B1221]">Frequently Asked Questions</h2>
            <p className="text-sm text-[#6B7A8D] mt-2">Quick answers to common questions about clinic contacts.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const open = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-white border border-[#DDE3EE] rounded-2xl overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-[#0B1221] hover:text-[#0369A1] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#6B7A8D] transition-transform duration-200 ${open ? 'rotate-180 text-[#0369A1]' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-xs text-[#4B5A6E] leading-relaxed border-t border-gray-100 pt-3 animate-[slideDown_150ms_ease]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
