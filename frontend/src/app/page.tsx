'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Phone, Mail, ChevronLeft, ChevronRight, Stethoscope, Heart, Syringe, Baby, Activity, FileText, Users } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UG Clinic Portal - University of Ghana Healthcare Services',
  description: 'Access quality healthcare services at the University of Ghana Clinic. Book appointments, manage health records, and connect with expert doctors.',
  keywords: ['UG Clinic', 'University of Ghana', 'healthcare', 'medical services', 'appointments', 'student health', 'campus clinic'],
  authors: [{ name: 'UG Clinic' }],
  openGraph: {
    title: 'UG Clinic Portal - University of Ghana Healthcare Services',
    description: 'Access quality healthcare services at the University of Ghana Clinic. Book appointments, manage health records, and connect with expert doctors.',
    type: 'website',
    locale: 'en_US',
    siteName: 'UG Clinic Portal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UG Clinic Portal - University of Ghana Healthcare Services',
    description: 'Access quality healthcare services at the University of Ghana Clinic.',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function Home() {
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  const announcements = [
    {
      id: 1,
      title: 'New COVID-19 Vaccination Available',
      message: 'We now offer the latest COVID-19 booster shots. Book your appointment today!',
      type: 'info',
    },
    {
      id: 2,
      title: 'Extended Operating Hours',
      message: 'We are now open on Saturdays from 9 AM to 2 PM for your convenience.',
      type: 'success',
    },
    {
      id: 3,
      title: 'New Doctor Joining Our Team',
      message: 'Welcome Dr. Sarah Mensah, our new specialist in internal medicine.',
      type: 'info',
    },
  ];

  const services = [
    {
      icon: Stethoscope,
      title: 'General Consultation',
      description: 'Comprehensive health check-ups and medical consultations',
    },
    {
      icon: Heart,
      title: 'Cardiology',
      description: 'Heart health monitoring and cardiac care services',
    },
    {
      icon: Syringe,
      title: 'Vaccination',
      description: 'Immunization services for all age groups',
    },
    {
      icon: Baby,
      title: 'Pediatrics',
      description: 'Specialized care for infants and children',
    },
    {
      icon: Activity,
      title: 'Laboratory Services',
      description: 'Diagnostic testing and blood work services',
    },
    {
      icon: FileText,
      title: 'Medical Records',
      description: 'Easy access to your health history and reports',
    },
  ];

  const operatingHours = [
    { day: 'Monday - Friday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  const nextAnnouncement = () => {
    setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentAnnouncement((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextAnnouncement();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2" aria-label="UG Clinic Home">
              <div className="bg-blue-600 p-2 rounded-lg" aria-hidden="true">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UG Clinic</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" aria-label="Student Login">
                <Button variant="ghost">Student Login</Button>
              </Link>
              <Link href="/staff/login" aria-label="Staff Portal">
                <Button variant="outline">Staff Portal</Button>
              </Link>
              <Link href="/auth/register" aria-label="Register for an account">
                <Button>Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Health, Our{' '}
                <span className="text-blue-600">Priority</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Welcome to the University of Ghana Clinic Portal. Access quality healthcare services, book appointments, and manage your health records all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto" aria-label="Get started with registration">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" aria-label="Book an appointment">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative" aria-hidden="true">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Users className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">10,000+</p>
                      <p className="text-blue-100">Patients Served</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Stethoscope className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">50+</p>
                      <p className="text-blue-100">Expert Doctors</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Clock className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">24/7</p>
                      <p className="text-blue-100">Emergency Care</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="py-12 bg-white" aria-labelledby="quick-actions-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="quick-actions-heading" className="text-3xl font-bold text-center text-gray-900 mb-8">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Quick action buttons">
            <Link href="/auth/login" role="listitem">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-blue-600" aria-hidden="true" />
                  <p className="font-medium">Book Appointment</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/auth/login" role="listitem">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-green-600" aria-hidden="true" />
                  <p className="font-medium">View Records</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/auth/login" role="listitem">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <CardContent className="p-6 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-3 text-purple-600" aria-hidden="true" />
                  <p className="font-medium">Lab Results</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/auth/login" role="listitem">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-3 text-orange-600" aria-hidden="true" />
                  <p className="font-medium">Contact Us</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Service Highlights */}
      <section className="py-16 bg-gray-50" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="services-heading" className="text-3xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive healthcare services designed to meet all your medical needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Healthcare services">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500" role="listitem">
                <CardHeader>
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                    <service.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Operating Hours */}
      <section className="py-16 bg-white" aria-labelledby="hours-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="hours-heading" className="text-3xl font-bold text-gray-900 mb-4">
                Operating Hours
              </h2>
              <p className="text-gray-600 mb-6">
                Visit us during our operating hours for quality healthcare services. Emergency services are available 24/7.
              </p>
              <div className="space-y-4" role="list" aria-label="Operating hours schedule">
                {operatingHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg" role="listitem">
                    <span className="font-medium text-gray-900">{schedule.day}</span>
                    <span className="text-gray-600">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" aria-labelledby="emergency-heading">
              <CardHeader>
                <CardTitle id="emergency-heading" className="text-white">
                  Emergency Contact
                </CardTitle>
                <CardDescription className="text-blue-100">
                  For medical emergencies, please call our emergency line
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  <a href="tel:+233201234567" className="text-lg font-medium hover:underline focus:outline-none focus:underline">
                    +233 20 123 4567
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                  <a href="mailto:emergency@ugclinic.edu.gh" className="hover:underline focus:outline-none focus:underline">
                    emergency@ugclinic.edu.gh
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Announcements Carousel */}
      <section className="py-16 bg-gray-50" aria-labelledby="announcements-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="announcements-heading" className="text-3xl font-bold text-center text-gray-900 mb-8">
            Latest Announcements
          </h2>
          <Card className="overflow-hidden" role="region" aria-live="polite" aria-label="Announcements carousel">
            <CardContent className="p-8">
              <div className="relative">
                <div className="min-h-[200px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {announcements[currentAnnouncement].title}
                    </h3>
                    <p className="text-gray-600">
                      {announcements[currentAnnouncement].message}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevAnnouncement}
                    aria-label="Previous announcement"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex space-x-2" role="tablist" aria-label="Announcement indicators">
                    {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAnnouncement(index)}
                    className={`w-2 h-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      index === currentAnnouncement ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-label={`Announcement ${index + 1}`}
                    aria-selected={index === currentAnnouncement}
                    role="tab"
                  />
                ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextAnnouncement}
                    aria-label="Next announcement"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Appointment Booking CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-heading" className="text-4xl font-bold text-white mb-4">
            Ready to Book Your Appointment?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who trust us with their healthcare needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" aria-label="Register now">
                Register Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100" aria-label="Book appointment">
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg" aria-hidden="true">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">UG Clinic</span>
              </div>
              <p className="text-gray-400">
                Providing quality healthcare services to the University of Ghana community.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <nav aria-label="Footer quick links">
                <ul className="space-y-2">
                  <li>
                    <Link href="/auth/login" className="hover:text-white focus:underline focus:outline-none">
                      Student Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/staff/login" className="hover:text-white focus:underline focus:outline-none">
                      Staff Portal
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/register" className="hover:text-white focus:underline focus:outline-none">
                      Register
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  <a href="tel:+233201234567" className="hover:underline focus:outline-none focus:underline">
                    +233 20 123 4567
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <a href="mailto:info@ugclinic.edu.gh" className="hover:underline focus:outline-none focus:underline">
                    info@ugclinic.edu.gh
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} UG Clinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
