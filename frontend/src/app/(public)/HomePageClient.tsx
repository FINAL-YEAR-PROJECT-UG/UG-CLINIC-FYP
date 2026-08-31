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

} from '@/components/icons';
import integrityIcon from '@/Assets/integrity.svg';
import respectIcon from '@/Assets/respect.svg';
import excellenceIcon from '@/Assets/excellence.svg';
import commitmentIcon from '@/Assets/commitment.svg';
import healthHivIcon from '@/Assets/health-hiv.png';
import healthFluIcon from '@/Assets/health-flu.png';
import healthWellnessIcon from '@/Assets/health-wellness.svg';
import welcomeIcon from '@/Assets/welcome.png';
import universityOfGhanaBg from '@/Assets/Legon UG/university-of-ghana.jpg';
import { getImageSrc } from '@/lib/assets';

export default function HomePageClient() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const services = [
    { icon: Stethoscope, title: 'General Consultation', description: 'Routine check-ups, illness diagnosis, and treatment for common health concerns', color: 'from-[#0F172A] to-[#1e3a8a]' },
    { icon: Brain, title: 'Mental Health Support', description: 'Counseling, stress management, and mental wellness resources', color: 'from-[#4F46E5] to-[#7C3AED]' },
    { icon: HeartPulse, title: 'Sexual Health Services', description: 'Confidential testing, contraception advice, and reproductive health care', color: 'from-[#DB2777] to-[#9D174D]' },
    { icon: Syringe, title: 'Vaccinations', description: 'Flu shots, travel vaccines, and immunization programs', color: 'from-[#059669] to-[#047857]' },
    { icon: Pill, title: 'Prescriptions', description: 'Medication management and prescription refills', color: 'from-[#0369A1] to-[#0EA5E9]' },
    { icon: Apple, title: 'Nutrition Counseling', description: 'Dietary advice and nutrition planning for healthy living', color: 'from-[#D97706] to-[#B45309]' },
  ];

  const coreValues = [
    { title: 'Integrity', description: 'We maintain the highest ethical standards in all our healthcare practices and patient interactions.', image: integrityIcon },
    { title: 'Respect', description: 'Every patient is treated with dignity, compassion, and understanding in a safe environment.', image: respectIcon },
    { title: 'Excellence', description: 'We strive for the highest quality care through continuous improvement and professional development.', image: excellenceIcon },
    { title: 'Commitment', description: 'Dedicated to serving our student community with accessible and comprehensive healthcare.', image: commitmentIcon },
  ];

  const healthUpdates = [
    { id: 1, tag: 'Awareness', tagColor: 'bg-red-50 text-red-600 border-red-100', title: 'HIV/AIDS Awareness Month', description: 'Free testing available. Learn about prevention and support resources.', action: 'Learn More', href: '/services', image: healthHivIcon, bgColor: 'bg-teal-600', fallbackIcon: HeartPulse },
    { id: 2, tag: 'Vaccination', tagColor: 'bg-blue-50 text-blue-700 border-blue-100', title: 'Flu Vaccination Drive', description: 'Protect yourself this season. Book your flu shot appointment today.', action: 'Book Now', href: '/login', image: healthFluIcon, bgColor: 'bg-orange-100', fallbackIcon: Syringe },
    { id: 3, tag: 'Wellness', tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', title: 'Healthy Lifestyle Tips', description: 'Simple strategies to maintain physical and mental wellbeing during exams.', action: 'Read More', href: '/resources', image: healthWellnessIcon, bgColor: 'bg-yellow-50', fallbackIcon: Apple },
  ];

  const handleImageError = (key: string) => setImageErrors((prev) => ({ ...prev, [key]: true }));

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── Hero ── */}
      <section className="relative bg-[#0F172A] py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/ug-video.mp4" type="video/mp4" />
          <source src="/UG video.mp4" type="video/mp4" />
        </video>

        {/* Video Overlay / Gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/85 via-[#0F172A]/70 to-[#1e3a8a]/65 backdrop-blur-[1px]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-6 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md animate-[fadeIn_400ms_ease_both]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            University of Ghana Student Clinic
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight animate-[slideDown_360ms_cubic-bezier(0.4,0,0.2,1)_both]">
            Your Health.<br className="hidden sm:block" />{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Our Priority.</span>
          </h1>
          <p className="text-lg text-blue-100/90 mb-10 max-w-2xl mx-auto leading-relaxed animate-[slideUp_380ms_cubic-bezier(0.4,0,0.2,1)_100ms_both]">
            Accessible, quality healthcare for every student at Legon. Your wellbeing; physical, mental, and emotional matters to us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[slideUp_380ms_cubic-bezier(0.4,0,0.2,1)_180ms_both]">
            <Link
              href="/login"
              className="
                inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[#0F172A] bg-white
                shadow-[0_4px_20px_rgba(255,255,255,0.25)]
                hover:bg-blue-50 hover:shadow-[0_8px_32px_rgba(255,255,255,0.30)]
                hover:-translate-y-0.5
                active:translate-y-0 active:scale-[0.98]
                transition-all duration-200
              "
            >
              Student Sign In
            </Link>
            <Link
              href="/services"
              className="
                inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white
                bg-white/10 border border-white/20 backdrop-blur-sm
                hover:bg-white/20 hover:border-white/30
                hover:-translate-y-0.5
                active:translate-y-0 active:scale-[0.98]
                transition-all duration-200
              "
            >
              Our Services
            </Link>
          </div>
        </div>
      </section>
      {/* ── Lower Content Sections ── */}
      <div className="relative">
          {/* ── Welcome ── */}
          <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/80 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.08)]">
                {/* Image */}
                <div className="relative h-80 lg:h-[420px] rounded-2xl overflow-hidden shadow-[0_20px_60px_-12px_rgba(15,23,42,0.18)] group">
                  <Image
                    src={welcomeIcon}
                    alt="Welcome to Student Clinic"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/30 to-transparent" />
                </div>
                {/* Text */}
                <div className="space-y-5">
                  <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-xs">
                    Welcome
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                    Welcome to the<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-[#0369A1]">Student Clinic</span>
                  </h2>
                  <p className="text-[#4B5A6E] leading-relaxed">
                    Our Student Clinic provides comprehensive healthcare services designed specifically for university students. We understand the unique health challenges you face and are committed to providing accessible, confidential, and professional care.
                  </p>
                  <p className="text-[#4B5A6E] leading-relaxed">
                    From routine check-ups to mental health support, our experienced team of healthcare professionals is here to support your wellbeing throughout your academic journey.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Mission ── */}
          <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-lg">
            {/* Aerial Campus Imagery Backdrop */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Image
                src={universityOfGhanaBg}
                alt="University of Ghana Aerial Campus"
                fill
                sizes="100vw"
                className="object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/94 via-[#1e3a8a]/90 to-[#0369A1]/92 backdrop-blur-[1px]" />
            </div>
            <div className="absolute inset-0 opacity-[0.04] z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <span className="inline-block bg-white/10 border border-white/15 text-blue-200 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-sm shadow-xs">
                Our Purpose
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8">Our Mission</h2>
              <p className="text-blue-100/90 text-lg leading-relaxed mb-5">
                To provide accessible, comprehensive, and student-centered healthcare services that promote physical, mental, and emotional wellbeing. We are committed to creating a supportive environment where every student can thrive academically and personally.
              </p>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Through prevention, education, and compassionate care, we empower students to make informed health decisions and maintain optimal wellness throughout their university experience.
              </p>
            </div>
          </section>

          {/* ── Services ── */}
          <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block bg-white/90 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-4 shadow-xs backdrop-blur-sm">
                  What We Offer
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">How Can We Help?</h2>
                <p className="text-[#6B7A8D] max-w-xl mx-auto">Comprehensive healthcare services tailored to student needs</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={index}
                      className="
                        group bg-white/92 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm text-center
                        hover:shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)]
                        hover:-translate-y-1.5 hover:border-blue-200
                        transition-all duration-300 cursor-default
                      "
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-extrabold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-sm text-[#6B7A8D] leading-relaxed">{service.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Health Updates ── */}
          <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block bg-white/95 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-xs mb-4 backdrop-blur-sm">
                  Latest News
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Health Updates & Tips</h2>
                <p className="text-[#6B7A8D] max-w-xl mx-auto">Stay informed about important health initiatives and wellness advice</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {healthUpdates.map((update, index) => {
                  const FallbackIcon = update.fallbackIcon;
                  const errorKey = `health-${index}`;
                  return (
                    <div
                      key={index}
                      className="
                        group bg-white/92 backdrop-blur-md border border-white/80 rounded-2xl overflow-hidden shadow-sm
                        hover:shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)]
                        hover:-translate-y-2 hover:border-blue-200
                        transition-all duration-300
                      "
                    >
                      {/* Image */}
                      <div className={`h-48 ${update.bgColor} relative overflow-hidden`}>
                        {!imageErrors[errorKey] ? (
                          <Image
                            src={update.image}
                            alt={update.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => handleImageError(errorKey)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FallbackIcon className="h-16 w-16 text-white/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>

                      <div className="p-5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border mb-3 ${update.tagColor}`}>
                          {update.tag}
                        </span>
                        <h3 className="font-extrabold text-gray-900 mb-2">{update.title}</h3>
                        <p className="text-sm text-[#6B7A8D] mb-4 leading-relaxed">{update.description}</p>
                        <Link
                          href={update.href}
                          className="inline-flex items-center gap-1 text-sm font-bold text-[#1e3a8a] hover:text-[#0369A1] hover:gap-2 transition-all duration-200"
                        >
                          {update.action} <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
      </div>

      <Footer />
    </div>
  );
}
