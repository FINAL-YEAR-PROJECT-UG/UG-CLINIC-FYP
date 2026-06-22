'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { MapPin, Phone, Mail, Clock, Loader2, CheckCircle2 } from 'lucide-react';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    lines: ['University of Ghana, Legon', 'Student Clinic Block'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    lines: ['General: +233 XXX XXX', 'Emergency: +233 XXX XXX'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    lines: ['clinic@ug.edu.gh', 'Response within 24 hours'],
  },
  {
    icon: Clock,
    title: 'Opening Hours',
    lines: ['Mon–Fri: 8:00am – 5:00pm', 'Sat: 9:00am – 1:00pm'],
  },
];

export default function ContactPageClient() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Have a question or need help? Reach out to the UG Student Clinic team — we&apos;re here for you.
          </p>
          <div className="mt-6 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">Contact</span>
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info) => {
            const Icon = info.icon;
            return (
              <div key={info.title} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 text-blue-700 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{info.title}</h3>
                {info.lines.map((line) => (
                  <p key={line} className="text-gray-600 text-sm">
                    {line}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Form */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-900">Send Us a Message</h2>
            <p className="text-gray-600 mt-2">We&apos;ll get back to you as soon as possible.</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-xl border border-green-200 p-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent</h3>
              <p className="text-gray-600 mb-6">
                Thank you for reaching out. Our team will respond to your enquiry within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Your name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@st.ug.edu.gh"
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={set('subject')}
                  placeholder="How can we help?"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Write your message..."
                  rows={5}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
