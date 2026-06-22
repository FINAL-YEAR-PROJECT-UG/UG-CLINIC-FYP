"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  Stethoscope,
  Brain,
  HeartPulse,
  Syringe,
  Pill,
  Apple,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import './HomePageClient.css';

export default function HomePageClient() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const services = [
    {
      icon: Stethoscope,
      title: 'General Consultation',
      description: 'Routine check-ups, illness diagnosis, and treatment for common health concerns',
    },
    {
      icon: Brain,
      title: 'Mental Health Support',
      description: 'Counseling, stress management, and mental wellness resources',
    },
    {
      icon: HeartPulse,
      title: 'Sexual Health Services',
      description: 'Confidential testing, contraception advice, and reproductive health care',
    },
    {
      icon: Syringe,
      title: 'Vaccinations',
      description: 'Flu shots, travel vaccines, and immunization programs',
    },
    {
      icon: Pill,
      title: 'Prescriptions',
      description: 'Medication management and prescription refills',
    },
    {
      icon: Apple,
      title: 'Nutrition Counseling',
      description: 'Dietary advice and nutrition planning for healthy living',
    },
  ];

  const coreValues = [
    {
      title: 'Integrity',
      description: 'We maintain the highest ethical standards in all our healthcare practices and patient interactions.',
      image: '/home/integrity.svg',
    },
    {
      title: 'Respect',
      description: 'Every patient is treated with dignity, compassion, and understanding in a safe environment.',
      image: '/home/respect.svg',
    },
    {
      title: 'Excellence',
      description: 'We strive for the highest quality care through continuous improvement and professional development.',
      image: '/home/excellence.svg',
    },
    {
      title: 'Commitment',
      description: 'Dedicated to serving our student community with accessible and comprehensive healthcare.',
      image: '/home/commitment.svg',
    },
  ];

  const healthUpdates = [
    {
      id: 1,
      tag: 'Awareness',
      tagColor: 'bg-red-50 text-red-600',
      title: 'HIV/AIDS Awareness Month',
      description: 'Free testing available. Learn about prevention and support resources.',
      action: 'Learn More',
      href: '/services',
      image: '/home/health-hiv.png',
      bgColor: 'bg-teal-600',
      fallbackIcon: HeartPulse,
    },
    {
      id: 2,
      tag: 'Vaccination',
      tagColor: 'bg-blue-50 text-blue-600',
      title: 'Flu Vaccination Drive',
      description: 'Protect yourself this season. Book your flu shot appointment today.',
      action: 'Book Now',
      href: '/demo-booking',
      image: '/home/health-flu.png',
      bgColor: 'bg-orange-100',
      fallbackIcon: Syringe,
    },
    {
      id: 3,
      tag: 'Wellness',
      tagColor: 'bg-green-50 text-green-600',
      title: 'Healthy Lifestyle Tips',
      description: 'Simple strategies to maintain physical and mental wellbeing during exams.',
      action: 'Read More',
      href: '/resources',
      image: '/home/health-wellness.svg',
      bgColor: 'bg-yellow-50',
      fallbackIcon: Apple,
    },
  ];

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Centered, No Image */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            University of Ghana, Legon<br />Student Clinic
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Accessible, quality healthcare for every student. Your health and wellbeing are our priority.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo-booking">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 rounded-md">
                Book Appointment
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 rounded-md">
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
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden">
              <Image
                src="/home/welcome.png"
                alt="Welcome to Student Clinic"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
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
              The principles that guide everything we do at the Student Clinic.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => (
              <Card key={index} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                    <img
                      src={value.image}
                      alt={value.title}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <CardTitle className="text-lg text-blue-900">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-blue-700">
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
                <Card key={index} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
                  <CardHeader className="pb-2 items-center">
                    <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-white" />
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
            {healthUpdates.map((update, index) => {
              const FallbackIcon = update.fallbackIcon;
              const errorKey = `health-${index}`;
              return (
                <Card key={index} className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`h-48 ${update.bgColor} relative overflow-hidden`}>
                    {!imageErrors[errorKey] ? (
                      <Image
                        src={update.image}
                        alt={update.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover"
                        onError={() => handleImageError(errorKey)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FallbackIcon className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium mb-3 ${update.tagColor}`}>
                      {update.tag}
                    </span>
                    <CardTitle className="text-lg text-blue-900">{update.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{update.description}</p>
                    <Link href={update.href} className="text-blue-900 text-sm font-medium flex items-center gap-1 hover:underline">
                      {update.action} <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
