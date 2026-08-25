'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import ug2Bg from '@/Assets/Legon UG/ug 2.jpg';
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
} from '@/components/icons';

const CLINIC_ADDRESS = 'Student Clinic Block, University of Ghana, Legon   5.647074, -0.187192 (GPS)';

const ways = [
  {
    icon: MapPin,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-100',
    title: 'Visit Us',
    lines: ['Student Clinic Block', 'University of Ghana, Legon'],
    cta: 'Get Directions',
    href: 'https://www.google.com/maps?q=5.647073840821125,-0.18719175546379127',
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
    location: 'Main UG Hospital (Legon)',
    phone: '+233 30 250 0006',
    email: 'dental@ug.edu.gh',
    hours: 'Mon–Fri',
    mapUrl: 'https://www.google.com/maps?q=5.65145873649435,-0.17833193194224153',
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
    a: 'Yes   use the "Contact a Specific Department" section below to reach the right team by email or phone.',
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
      <section className="relative bg-[#0F172A] text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/ug-video.mp4" type="video/mp4" />
          <source src="/UG video.mp4" type="video/mp4" />
        </video>

        {/* Video Overlay / Gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/85 via-[#0F172A]/70 to-[#1e3a8a]/65 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-[fadeIn_300ms_ease_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md mb-4">
            UG Student Health Center
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Contact & Support
          </h1>
          <p className="text-blue-100/90 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            Have a question or need assistance? Reach out to the UG Student Clinic team we&apos;re here to help you stay healthy.
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

      {/* ── Background Image Section: Ways to Reach Us / Get in Touch all the way to bottom (excluding Footer) ── */}
      <div className="relative overflow-hidden">
        {/* Background Campus Image & Soft Dimming Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src={ug2Bg}
            alt="University of Ghana Legon Campus"
            fill
            sizes="100vw"
            className="object-cover object-center fixed top-0"
          />
          {/* Subtle dimming / frosted glass tint so campus view is visible and content is pristine */}
          <div className="absolute inset-0 bg-[#F8FAFC]/88 backdrop-blur-[1.5px]" />
        </div>

        <div className="relative z-10">
          {/* Main Grid: Ways to Get in Touch */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <span className="inline-block bg-white/95 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-xs mb-3 backdrop-blur-sm">
                Get In Touch
              </span>
              <h2 className="text-3xl font-extrabold text-[#0B1221]">Ways to Reach Us</h2>
              <p className="text-sm text-[#6B7A8D] mt-2">Multiple channels to access support and consultation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {ways.map((w) => {
                const Icon = w.icon;
                return (
                  <div
                    key={w.title}
                    className="bg-white/92 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm hover:shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-[#F5F7FB] border border-[#DDE3EE] flex items-center justify-center mb-4 text-[#1e3a8a] shadow-xs">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${w.badgeColor}`}>
                        {w.title}
                      </span>
                      <h3 className="font-extrabold text-[#0B1221] text-base mb-2">{w.title}</h3>
                      <div className="space-y-1 text-xs text-[#6B7A8D] mb-4">
                        {w.lines.map((l) => (
                          <p key={l}>{l}</p>
                        ))}
                      </div>
                    </div>

                    <a
                      href={w.href}
                      target={w.href.startsWith('http') ? '_blank' : undefined}
                      rel={w.href.startsWith('http') ? 'noreferrer' : undefined}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      {w.cta}
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Form + Map & Hours Section */}
          <section id="contact-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form */}
              <div className="lg:col-span-7 bg-white/92 backdrop-blur-md border border-white/80 rounded-3xl p-8 shadow-sm">
                <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3 shadow-xs">
                  Direct Messaging
                </span>
                <h2 className="text-2xl font-extrabold text-[#0B1221] mb-2">Send Us a Direct Message</h2>
                <p className="text-xs text-[#6B7A8D] mb-6">
                  Fill out the form below. We typically respond within 24 business hours.
                </p>

                {submitted ? (
                  <div className="p-8 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-center space-y-3 animate-[scaleIn_200ms_ease]">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <h3 className="text-lg font-bold text-emerald-900">Message Received!</h3>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      Thank you for contacting the UG Student Clinic. Our team has received your enquiry and will respond via email shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-2 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0B1221] mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Ama Mensah"
                          value={form.name}
                          onChange={set('name')}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0B1221] mb-1">
                          Student ID (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10928374"
                          value={form.studentId}
                          onChange={set('studentId')}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0B1221] mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="your.email@st.ug.edu.gh"
                          value={form.email}
                          onChange={set('email')}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0B1221] mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="+233 24 000 0000"
                          value={form.phone}
                          onChange={set('phone')}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0B1221] mb-1">
                          Department
                        </label>
                        <select
                          value={form.department}
                          onChange={set('department')}
                          className={`${inputClass} cursor-pointer`}
                        >
                          <option>General Medicine</option>
                          <option>Mental Health & Counseling</option>
                          <option>Sexual & Reproductive Health</option>
                          <option>Student Wellness</option>
                          <option>Pharmacy & Prescriptions</option>
                          <option>Administration / Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0B1221] mb-1">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Reason for contacting"
                          value={form.subject}
                          onChange={set('subject')}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0B1221] mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Provide as much detail as possible..."
                        value={form.message}
                        onChange={set('message')}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="
                        w-full py-3 rounded-xl font-bold text-xs text-white
                        bg-gradient-to-r from-[#0F172A] to-[#1e3a8a]
                        shadow-[0_4px_14px_rgba(15,23,42,0.25)]
                        hover:shadow-[0_8px_24px_rgba(30,58,138,0.35)]
                        hover:-translate-y-0.5
                        transition-all duration-200
                        flex items-center justify-center gap-2
                        disabled:opacity-50
                      "
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Send Direct Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Location & Hours */}
              <div className="lg:col-span-5 space-y-6">
                {/* Location & Maps */}
                <div className="bg-white/92 backdrop-blur-md border border-white/80 rounded-3xl p-6 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e3a8a]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0B1221] text-base leading-tight">Clinic Location</h3>
                        <p className="text-[11px] text-[#6B7A8D]">UG Health Services & Student Clinic</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0369A1] hover:underline bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors"
                    >
                      <Copy className="h-3 w-3" /> {copied ? 'Copied!' : 'Copy GPS'}
                    </button>
                  </div>

                  {/* ── Interactive Google Maps Preview Frame ── */}
                  <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-[#DDE3EE] mb-4 group shadow-inner">
                    <iframe
                      src="https://maps.google.com/maps?q=5.647073840821125,-0.18719175546379127&z=17&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="University of Ghana Student Clinic Google Map Preview"
                      className="w-full h-full object-cover filter contrast-[1.02]"
                    />
                    
                    {/* Hover indicator link */}
                    <a
                      href="https://www.google.com/maps?q=5.647073840821125,-0.18719175546379127"
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A]/90 hover:bg-[#1e3a8a] text-white backdrop-blur-md shadow-md transition-all duration-200"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Full Map ↗
                    </a>
                  </div>

                  <p className="text-xs text-[#4B5A6E] leading-relaxed mb-4 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#0369A1] shrink-0 mt-0.5" />
                    <span>{CLINIC_ADDRESS}</span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href="https://www.google.com/maps?q=5.647073840821125,-0.18719175546379127"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
                    >
                      <Navigation className="h-4 w-4" /> Get Directions in Google Maps ↗
                    </a>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F5F7FB] hover:bg-blue-50 text-[#1e3a8a] border border-[#DDE3EE] hover:border-[#0369A1] transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy GPS'}
                    </button>
                  </div>
                </div>

                {/* Operating Hours Table */}
                <div className="bg-white/92 backdrop-blur-md border border-white/80 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-[#1e3a8a]" />
                    <h3 className="font-extrabold text-[#0B1221] text-base">Working Hours</h3>
                  </div>

                  <div className="space-y-2">
                    {hours.map((h) => {
                      const badge = statusBadge[h.status];
                      return (
                        <div
                          key={h.day}
                          className="flex items-center justify-between text-xs py-1.5 border-b border-[#F0F3F9] last:border-0"
                        >
                          <span className="font-semibold text-[#0B1221]">{h.day}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#6B7A8D]">{h.time}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Department Directory */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <span className="inline-block bg-white/95 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-xs mb-3 backdrop-blur-sm">
                Directory
              </span>
              <h2 className="text-3xl font-extrabold text-[#0B1221]">Contact a Specific Department</h2>
              <p className="text-sm text-[#6B7A8D] mt-2">Direct lines to specialized clinic divisions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.name}
                    className="bg-white/92 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm hover:shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 bg-[#F5F7FB] border border-[#DDE3EE] rounded-xl flex items-center justify-center text-[#1e3a8a] mb-3 shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-[#0B1221] text-base mb-1">{d.name}</h3>
                      <p className="text-xs text-[#6B7A8D] mb-4">{d.location}</p>

                      <div className="space-y-1.5 text-xs text-[#4B5A6E] mb-4 pt-3 border-t border-[#EEF1F8]">
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#0369A1]" /> {d.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#0369A1]" /> {d.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#0369A1]" /> {d.hours}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`mailto:${d.email}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-[#F5F7FB] text-[#1e3a8a] border border-[#DDE3EE] hover:bg-blue-50 hover:border-[#0369A1] transition-all"
                      >
                        Email Unit
                      </a>
                      {d.mapUrl && (
                        <a
                          href={d.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1e3a8a] transition-all"
                          title="View Location on Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FAQs */}
          <section className="py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="inline-block bg-white/95 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-xs mb-3 backdrop-blur-sm">
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
                      className="bg-white/92 backdrop-blur-md border border-white/80 rounded-2xl overflow-hidden shadow-xs transition-all"
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
