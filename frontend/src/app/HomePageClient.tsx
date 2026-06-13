"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Users, 
  Star, 
  Heart, 
  Stethoscope, 
  Brain, 
  HeartPulse, 
  Syringe, 
  Pill, 
  Apple,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  Globe,
  MessageCircle,
  Camera,
} from 'lucide-react';

export default function HomePageClient() {
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
      description: 'Routine check-ups, illness diagnosis, and treatment for common health concerns',
      duration: '30 min',
    },
    {
      icon: Brain,
      title: 'Mental Health Support',
      description: 'Counseling, stress management, and mental wellness resources',
      duration: '45 min',
    },
    {
      icon: HeartPulse,
      title: 'Sexual Health Services',
      description: 'Confidential testing, contraception advice, and reproductive health care',
      duration: '30 min',
    },
    {
      icon: Syringe,
      title: 'Vaccinations',
      description: 'Flu shots, travel vaccines, and immunization programs',
      duration: '15 min',
    },
    {
      icon: Pill,
      title: 'Prescriptions',
      description: 'Medication management and prescription refills',
      duration: '20 min',
    },
    {
      icon: Apple,
      title: 'Nutrition Counseling',
      description: 'Dietary advice and nutrition planning for healthy living',
      duration: '30 min',
    },
  ];

  const coreValues = [
    {
      icon: Shield,
      title: 'Integrity',
      description: 'We maintain the highest ethical standards in all our healthcare practices and patient interactions.',
    },
    {
      icon: Users,
      title: 'Respect',
      description: 'Every patient is treated with dignity, compassion, and understanding in a safe environment.',
    },
    {
      icon: Star,
      title: 'Excellence',
      description: 'We strive for the highest quality care through continuous improvement and professional development.',
    },
    {
      icon: Heart,
      title: 'Commitment',
      description: 'Dedicated to serving our student community with accessible and comprehensive healthcare.',
    },
  ];

  const healthUpdates = [
    {
      id: 1,
      tag: 'Awareness',
      tagColor: 'bg-red-100 text-red-700',
      title: 'HIV/AIDS Awareness Month',
      description: 'Free testing available. Learn about prevention and support resources.',
      action: 'Learn More',
    },
    {
      id: 2,
      tag: 'Vaccination',
      tagColor: 'bg-blue-100 text-blue-700',
      title: 'Flu Vaccination Drive',
      description: 'Protect yourself this season. Book your flu shot appointment today.',
      action: 'Book Now',
    },
    {
      id: 3,
      tag: 'Wellness',
      tagColor: 'bg-green-100 text-green-700',
      title: 'Healthy Lifestyle Tips',
      description: 'Simple strategies to maintain physical and mental wellbeing during exams.',
      action: 'Read More',
    },
  ];

  const nextAnnouncement = () => {
    setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentAnnouncement((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  useEffect(() => {
    const timer = setInterval(nextAnnouncement, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UG</span>
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm">UG Student Clinic</p>
                <p className="text-xs text-gray-500">Quality Healthcare for Students</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-blue-900 border-b-2 border-blue-900 pb-1">Home</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-blue-900">About</Link>
              <Link href="/services" className="text-sm font-medium text-gray-600 hover:text-blue-900">Services</Link>
              <Link href="/resources" className="text-sm font-medium text-gray-600 hover:text-blue-900">Health Resources</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-blue-900">Contact</Link>
            </div>
            <Link href="/login">
              <Button className="bg-blue-900 hover:bg-blue-800 text-white">Book Appointment</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            University of Ghana, Legon<br />Student Clinic
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Accessible, quality healthcare for every student. Your health and wellbeing are our priority.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8">
                Book Appointment
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 lg:h-96 bg-gray-100 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <Users className="h-20 w-20 text-gray-400" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-6">
                Welcome to the Student Clinic
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Our Student Clinic provides comprehensive healthcare services designed specifically for university students. We understand the unique health challenges you face and are committed to providing accessible, confidential, and professional care.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                From routine check-ups to mental health support, our experienced team of healthcare professionals is here to support your wellbeing throughout your academic journey.
              </p>
              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg inline-flex">
                <div className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Free for All Students</p>
                  <p className="text-xs text-gray-500">No appointment fees or hidden costs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at the Student Clinic
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-900" />
                    </div>
                    <CardTitle className="text-lg text-blue-900">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">Our Mission</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-6">
            To provide accessible, comprehensive, and student-centered healthcare services that promote physical, mental, and emotional wellbeing. We are committed to creating a supportive environment where every student can thrive academically and personally.
          </p>
          <p className="text-blue-100 text-lg leading-relaxed">
            Through prevention, education, and compassionate care, we empower students to make informed health decisions and maintain optimal wellness throughout their university experience.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">How Can We Help?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive healthcare services tailored to student needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-blue-900" />
                    </div>
                    <CardTitle className="text-lg text-blue-900">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Health Updates Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Health Updates & Tips</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay informed about important health initiatives and wellness advice
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthUpdates.map((update, index) => (
              <Card key={index} className="bg-white border-0 shadow-sm overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {index === 0 && <Heart className="h-16 w-16 text-red-400" />}
                    {index === 1 && <Syringe className="h-16 w-16 text-blue-400" />}
                    {index === 2 && <Apple className="h-16 w-16 text-green-400" />}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${update.tagColor}`}>
                    {update.tag}
                  </span>
                  <CardTitle className="text-lg text-blue-900">{update.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{update.description}</p>
                  <button className="text-blue-900 text-sm font-medium flex items-center gap-1 hover:underline">
                    {update.action} <ChevronRight className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-900 font-bold text-sm">UG</span>
                </div>
                <span className="font-bold">Student Clinic</span>
              </div>
              <p className="text-blue-200 text-sm leading-relaxed">
                Providing quality healthcare services to support student wellbeing and academic success.
              </p>
              <div className="flex gap-3 mt-4">
                <Globe className="h-5 w-5 text-blue-300 hover:text-white cursor-pointer" />
                <MessageCircle className="h-5 w-5 text-blue-300 hover:text-white cursor-pointer" />
                <Camera className="h-5 w-5 text-blue-300 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/services" className="hover:text-white">Services</Link></li>
                <li><Link href="/resources" className="hover:text-white">Health Resources</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-blue-200">
                <li>General Consultation</li>
                <li>Mental Health</li>
                <li>Sexual Health</li>
                <li>Vaccinations</li>
                <li>Nutrition</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact Info</h3>
              <ul className="space-y-3 text-sm text-blue-200">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Building A, University Campus
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@studentclinic.edu
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-blue-300">
              2024 University Student Clinic. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-blue-300">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-white">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}