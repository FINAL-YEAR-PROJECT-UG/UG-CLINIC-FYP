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
} from 'lucide-react';

const CLINIC_ADDRESS = 'University of Ghana, Legon — Student Clinic Block, Accra, Ghana';

type IconProps = { className?: string };


const ways = [
  {
    icon: MapPin,
    accent: '#14B8A6',
    title: 'Visit Us',
    lines: ['Student Clinic Block', 'University of Ghana, Legon'],
    cta: 'Get Directions',
    href: 'https://www.google.com/maps/search/?api=1&query=University+of+Ghana+Legon+Hospital',
  },
  {
    icon: Phone,
    accent: '#EF4444',
    title: 'Call Us',
    lines: ['General: +233 30 250 0000', 'Emergency: +233 20 123 4567'],
    cta: 'Call Now',
    href: 'tel:+233302500000',
  },
  {
    icon: Mail,
    accent: '#1E3A8A',
    title: 'Email Us',
    lines: ['clinic@ug.edu.gh', 'Response within 24 hours'],
    cta: 'Send Email',
    href: 'mailto:clinic@ug.edu.gh',
  },
  {
    icon: AlertTriangle,
    accent: '#F59E0B',
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

const statusColor: Record<string, string> = {
  open: 'bg-green-500',
  limited: 'bg-amber-500',
  closed: 'bg-red-500',
};

const departments = [
  {
    icon: Stethoscope,
    accent: '#14B8A6',
    name: 'General Medicine',
    lines: ['Block A, Ground Floor', '+233 30 250 0001', 'general@ug.edu.gh', 'Mon–Fri'],
    cta: 'Email Department',
    href: 'mailto:general@ug.edu.gh',
  },
  {
    icon: Brain,
    accent: '#8B5CF6',
    name: 'Mental Health & Counselling',
    lines: ['Counselling Wing', '+233 30 250 0002', 'wellbeing@ug.edu.gh', 'By appointment'],
    cta: 'Email Department',
    href: 'mailto:wellbeing@ug.edu.gh',
  },
  {
    icon: Ribbon,
    accent: '#EF4444',
    name: 'Sexual Health',
    lines: ['Block B, Room 4', '+233 30 250 0003', 'sexualhealth@ug.edu.gh', 'Mon–Fri'],
    cta: 'Email Department',
    href: 'mailto:sexualhealth@ug.edu.gh',
  },
  {
    icon: HeartPulse,
    accent: '#22C55E',
    name: 'Student Wellness',
    lines: ['Wellness Centre', '+233 30 250 0004', 'wellness@ug.edu.gh', 'Mon–Fri'],
    cta: 'Email Department',
    href: 'mailto:wellness@ug.edu.gh',
  },
  {
    icon: Pill,
    accent: '#1E3A8A',
    name: 'Pharmacy',
    lines: ['Block A, Room 2', '+233 30 250 0005', 'pharmacy@ug.edu.gh', 'Mon–Sat'],
    cta: 'Email Department',
    href: 'mailto:pharmacy@ug.edu.gh',
  },
  {
    icon: Smile,
    accent: '#F59E0B',
    name: 'Dental Services',
    lines: ['Main UG Hospital', '+233 30 250 0006', 'dental@ug.edu.gh', 'Mon–Fri'],
    cta: 'Email Department',
    href: 'mailto:dental@ug.edu.gh',
  },
];

const faqs = [
  {
    q: 'How quickly will I get a response?',
    a: 'We aim to respond to all enquiries within 24 hours on working days. For urgent medical concerns, please call our emergency hotline instead of using the contact form.',
  },
  {
    q: 'Do I need an appointment to visit the clinic?',
    a: 'Walk-ins are welcome for general consultations, but booking an appointment online reduces your waiting time significantly.',
  },
  {
    q: 'Are clinic services free for students?',
    a: 'Yes. Most services are free for registered University of Ghana students. Some specialist services may require a referral to the Main UG Hospital.',
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
    'w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Have a question or need help? Reach out to the UG Student Clinic team — we&apos;re here for you.
          </p>
          <div className="mt-4 text-sm text-blue-200">
            <Link href="/home" className="hover:text-white">Home</Link>
            <span className="font-medium text-white">Contact</span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="tel:+233302500000" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-5 py-2.5 rounded-md text-sm font-semibold transition-colors">
              <Phone className="h-4 w-4" /> Call Now
            </a>
            <a href="mailto:clinic@ug.edu.gh" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-5 py-2.5 rounded-md text-sm font-semibold transition-colors">
              <Mail className="h-4 w-4" /> Email Us
            </a>
            <a href="#contact-form" className="inline-flex items-center gap-2 bg-white text-blue-900 hover:bg-gray-100 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors">
              <Send className="h-4 w-4" /> Send a Message
            </a>
          </div>
        </div>
      </section>

      {/* Emergency banner */}
      <div className="bg-red-50 border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-red-700 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            For medical emergencies, call <strong>+233 20 123 4567</strong> or visit the clinic immediately.
          </p>
          <a href="tel:+233201234567" className="text-sm font-semibold text-red-700 border border-red-300 rounded-full px-4 py-1.5 hover:bg-red-100 transition-colors">
            Call 24/7
          </a>
        </div>
      </div>

      {/* Ways to get in touch */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">Get in Touch</p>
          <h2 className="text-3xl font-bold text-blue-900">Ways to Get in Touch</h2>
          <div className="mt-3 h-1 w-12 bg-blue-700 rounded-full mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ways.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center flex flex-col"
                style={{ borderTop: `4px solid ${w.accent}` }}
              >
                <div
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4 mx-auto"
                  style={{ backgroundColor: `${w.accent}1A`, color: w.accent }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{w.title}</h3>
                <div className="flex-1">
                  {w.lines.map((line) => (
                    <p key={line} className="text-gray-600 text-sm">{line}</p>
                  ))}
                </div>
                <a
                  href={w.href}
                  target={w.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-semibold rounded-full border px-4 py-2 transition-colors"
                  style={{ color: w.accent, borderColor: w.accent }}
                >
                  {w.cta}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Location + hours */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Map / directions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
            <div className="relative h-56 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-blue-700" />
              <span className="absolute bottom-3 left-3 text-xs font-medium text-blue-900 bg-white/80 rounded px-2 py-1">
                University of Ghana, Legon
              </span>
            </div>
            <div className="p-6 flex flex-wrap gap-3">
              <a
                href="https://www.google.com/maps/search/?api=1&query=University+of+Ghana+Legon+Hospital"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
              >
                <Navigation className="h-4 w-4" /> Get Directions
              </a>
              <button
                onClick={copyAddress}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
          </div>

          {/* Clinic info + hours */}
          <div>
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">Our Location</p>
            <h2 className="text-2xl font-bold text-blue-900 mb-1">University of Ghana Student Clinic</h2>
            <div className="h-1 w-12 bg-blue-700 rounded-full mb-5" />
            <ul className="space-y-2 text-gray-700 text-sm mb-6">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-teal-600 mt-0.5" /> Student Clinic Block, Legon Campus</li>
              <li className="flex items-start gap-2"><Phone className="h-4 w-4 text-teal-600 mt-0.5" /> +233 30 250 0000</li>
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 text-teal-600 mt-0.5" /> clinic@ug.edu.gh</li>
            </ul>

            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-700" /> Operating Hours
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-700">{h.day}</span>
                  <span className="flex items-center gap-2 text-gray-900 font-medium">
                    {h.time}
                    <span className={`h-2 w-2 rounded-full ${statusColor[h.status]}`} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact-form" className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">Send a Message</p>
            <h2 className="text-3xl font-bold text-blue-900">We&apos;d Love to Hear From You</h2>
            <p className="text-gray-600 mt-2">Fill out the form and our team will get back to you.</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-xl border border-green-200 p-10 text-center shadow-sm">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent</h3>
              <p className="text-gray-600 mb-6">Thank you for reaching out. Our team will respond within 24 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-gray-200 p-8 space-y-5 shadow-sm"
              style={{ borderTop: '4px solid #14B8A6' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input required value={form.name} onChange={set('name')} placeholder="Your name" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input value={form.studentId} onChange={set('studentId')} placeholder="e.g. 10987654" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="you@st.ug.edu.gh" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="+233 ..." className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                <input required value={form.subject} onChange={set('subject')} placeholder="How can we help?" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Message <span className="text-red-500">*</span></label>
                <textarea required value={form.message} onChange={set('message')} placeholder="Write your message..." rows={5} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send to Department</label>
                <select value={form.department} onChange={set('department')} className={inputClass}>
                  {departments.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <>Send Message <Send className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Departments */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">Departments</p>
            <h2 className="text-3xl font-bold text-blue-900">Contact a Specific Department</h2>
            <p className="text-gray-600 mt-2">Reach the right team directly.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.name}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col"
                  style={{ borderTop: `4px solid ${d.accent}` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="inline-flex items-center justify-center h-10 w-10 rounded-lg"
                      style={{ backgroundColor: `${d.accent}1A`, color: d.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">{d.name}</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 flex-1">
                    <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {d.lines[0]}</li>
                    <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {d.lines[1]}</li>
                    <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {d.lines[2]}</li>
                    <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> {d.lines[3]}</li>
                  </ul>
                  <a
                    href={d.href}
                    className="mt-5 inline-block text-center text-sm font-semibold rounded-full border px-4 py-2 transition-colors"
                    style={{ color: d.accent, borderColor: d.accent }}
                  >
                    {d.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-blue-900">Frequently Asked Questions</h2>
            <p className="text-gray-600 mt-2">Quick answers to common questions.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`h-5 w-5 text-blue-700 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <div className="px-5 pb-5 text-sm text-gray-600">{faq.a}</div>}
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
