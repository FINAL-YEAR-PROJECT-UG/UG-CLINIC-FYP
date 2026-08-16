"use client";

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Target,
  Eye,
  Calendar,
} from '@/components/icons';
import compassionIcon from '@/Assets/compassion.svg';
import excellenceAboutIcon from '@/Assets/excellence-about.svg';
import integrityAboutIcon from '@/Assets/integrity-about.svg';
import respectAboutIcon from '@/Assets/respect-about.svg';
import whoWeAreIcon from '@/Assets/who-we-are.png';
import missionIcon from '@/Assets/mission.svg';
import visionIcon from '@/Assets/vision.svg';
import { getImageSrc } from '@/lib/assets';

export default function AboutPageClient() {
  const ourStory = [
    {
      year: '2010',
      title: 'Establishment',
      description: 'The Student Clinic was established to provide accessible, free healthcare to the university community.',
    },
    {
      year: '2015',
      title: 'Expansion',
      description: 'Expanded services to include dedicated mental health counseling and specialized care programs.',
    },
    {
      year: '2020',
      title: 'Modernization',
      description: 'Upgraded facilities with modern diagnostic equipment and integrated electronic health records.',
    },
    {
      year: '2024+',
      title: 'Comprehensive Care',
      description: 'Now serving over 10,000 students annually with full-service medical, preventative, and emergency care.',
    },
  ];

  const coreValues = [
    {
      title: 'Compassion',
      description: 'We treat every patient with empathy, dignity, and personal understanding.',
      image: compassionIcon,
    },
    {
      title: 'Excellence',
      description: 'We strive for the highest quality care through continuous medical development.',
      image: excellenceAboutIcon,
    },
    {
      title: 'Integrity',
      description: 'We maintain absolute ethical standards and patient data confidentiality.',
      image: integrityAboutIcon,
    },
    {
      title: 'Respect',
      description: 'We honor the inherent dignity and worth of every student on campus.',
      image: respectAboutIcon,
    },
  ];

  const team = [
    {
      name: 'Dr. Emmanuel Osei',
      role: 'Medical Director',
      description: 'Leading the clinic with over 20 years of experience in student healthcare management.',
    },
    {
      name: 'Dr. Sarah Mensah',
      role: 'Chief Physician',
      description: 'Specializing in primary internal medicine and preventive student care.',
    },
    {
      name: 'Nurse Comfort Agyeman',
      role: 'Head Nurse',
      description: 'Coordinating daily nursing operations and urgent clinical triage.',
    },
  ];

  const achievements = [
    {
      icon: Users,
      title: '10,000+ Students Served',
      description: 'Providing comprehensive healthcare to thousands of undergraduate and postgraduate students every year.',
    },
    {
      icon: Award,
      title: 'Recognized Quality Care',
      description: 'Awarded for outstanding standard of care among tertiary health institutions in Ghana.',
    },
    {
      icon: Clock,
      title: '24/7 Emergency Hotline',
      description: 'Round-the-clock emergency medical response and triage for campus residents.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#0369A1] text-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-[fadeIn_300ms_ease_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md mb-4">
            University of Ghana Student Clinic
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            About Our Clinic
          </h1>
          <p className="text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            Dedicated to providing accessible, high-quality healthcare and wellbeing services to the University of Ghana student community since 2010.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-white text-[#0F172A] shadow-md hover:bg-blue-50 transition-all duration-200"
            >
              Explore Our Services
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-white/15 border border-white/20 backdrop-blur-md text-white hover:bg-white/25 transition-all duration-200"
            >
              Contact Clinic Team
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden shadow-[0_16px_40px_-8px_rgba(15,23,42,0.15)] border border-[#DDE3EE]">
              <Image
                src={whoWeAreIcon}
                alt="Who We Are"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/40 to-transparent" />
            </div>
            <div className="space-y-4">
              <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100">
                Our Overview
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1221]">
                Who We Are
              </h2>
              <p className="text-[#4B5A6E] leading-relaxed text-sm">
                The University of Ghana Student Clinic is a dedicated healthcare facility serving students across all colleges and faculties. We provide comprehensive medical consultations, preventive health checkups, and health education to support physical and mental wellbeing.
              </p>
              <p className="text-[#4B5A6E] leading-relaxed text-sm">
                Our qualified staff of physicians, nurses, counselors, and administrative team members work together to deliver confidential, compassionate care in a student-friendly environment.
              </p>

              <div className="pt-2">
                <div className="inline-flex items-center gap-3 p-3.5 bg-[#F5F7FB] border border-[#DDE3EE] rounded-xl">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
                  </div>
                  <div>
                    <p className="font-bold text-[#0B1221] text-xs">Established 2010</p>
                    <p className="text-[11px] text-[#6B7A8D]">14+ years of dedicated service to Legon students</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FB]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-white text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-sm mb-3">
              History & Milestones
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1221]">Our Growth Story</h2>
            <p className="text-sm text-[#6B7A8D] max-w-lg mx-auto mt-2">
              From an initial consult post to a full-service health institution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ourStory.map((milestone, index) => (
              <div
                key={index}
                className="bg-white border border-[#DDE3EE] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white rounded-lg text-xs font-extrabold mb-4 shadow-xs">
                    <Calendar className="w-3 h-3" />
                    {milestone.year}
                  </div>
                  <h3 className="font-extrabold text-[#0B1221] text-base mb-2">{milestone.title}</h3>
                  <p className="text-xs text-[#6B7A8D] leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-[#F5F7FB] rounded-2xl border border-[#DDE3EE] p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
                <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3 py-1 rounded-full border border-blue-100 mb-3">
                  Our Mission
                </span>
                <h3 className="text-2xl font-extrabold text-[#0B1221] mb-4">Student-Centered Healthcare</h3>
                <p className="text-xs text-[#4B5A6E] leading-relaxed mb-3">
                  To provide accessible, comprehensive, and student-centered healthcare services that promote physical, mental, and emotional wellbeing. We are committed to creating a supportive environment where every student can thrive academically and personally.
                </p>
                <p className="text-xs text-[#4B5A6E] leading-relaxed">
                  Through prevention, health education, and compassionate clinical care, we empower students to make informed health choices throughout their university experience.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-[#F5F7FB] rounded-2xl border border-[#DDE3EE] p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm">
                </div>
                <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3 py-1 rounded-full border border-blue-100 mb-3">
                  Our Vision
                </span>
                <h3 className="text-2xl font-extrabold text-[#0B1221] mb-4">Leading Student Healthcare</h3>
                <p className="text-xs text-[#4B5A6E] leading-relaxed mb-3">
                  To be the benchmark student healthcare provider in Ghana, setting the standard for excellence in university medical services and wellness programs.
                </p>
                <p className="text-xs text-[#4B5A6E] leading-relaxed">
                  We strive to continuously improve our clinical workflows, embrace digital healthcare innovations, and foster a culture of holistic wellbeing across campus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FB]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-white text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 shadow-sm mb-3">
              Guided Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1221]">Our Core Values</h2>
            <p className="text-sm text-[#6B7A8D] max-w-lg mx-auto mt-2">
              The fundamental standards that drive our daily medical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {coreValues.map((value, index) => (
              <div
                key={index}
                className="bg-white border border-[#DDE3EE] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-xs">
                  <img
                    src={getImageSrc(value.image)}
                    alt={value.title}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <h3 className="font-extrabold text-[#0B1221] text-base mb-2">{value.title}</h3>
                <p className="text-xs text-[#6B7A8D] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
              Leadership
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1221]">Our Medical Leadership</h2>
            <p className="text-sm text-[#6B7A8D] max-w-lg mx-auto mt-2">
              Dedicated healthcare professionals committed to student wellness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-[#F5F7FB] border border-[#DDE3EE] rounded-2xl p-6 shadow-sm text-center flex flex-col items-center hover:shadow-md transition-all duration-300"
              >
                <div className="w-16 h-16 bg-white border border-[#DDE3EE] rounded-full flex items-center justify-center mb-4 text-[#1e3a8a] shadow-xs">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="font-extrabold text-[#0B1221] text-base">{member.name}</h3>
                <span className="inline-block px-3 py-1 bg-blue-50 text-[#1e3a8a] text-[11px] font-bold rounded-full border border-blue-100 my-2">
                  {member.role}
                </span>
                <p className="text-xs text-[#6B7A8D] leading-relaxed mt-1">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#0369A1] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-white/10 border border-white/15 text-blue-200 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 backdrop-blur-sm">
              Milestones
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Our Achievements</h2>
            <p className="text-sm text-blue-100/80 max-w-lg mx-auto mt-2">
              Demonstrated commitments to student health excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-center shadow-md hover:bg-white/15 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-extrabold text-white text-base mb-2">{achievement.title}</h3>
                  <p className="text-xs text-blue-100/90 leading-relaxed">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 mb-3">
              Why Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1221]">Why Students Choose Us</h2>
            <p className="text-sm text-[#6B7A8D] max-w-lg mx-auto mt-2">
              Key highlights of our campus health service model.
            </p>
          </div>

          <div className="bg-[#F5F7FB] border border-[#DDE3EE] rounded-2xl p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Free consultation and basic triage for all registered students',
                'Qualified physicians, head nurses, and licensed mental health counselors',
                'Complete patient confidentiality adhering to strict privacy standards',
                'Modern medical equipment and digital record management',
                'Centralized campus location close to main student hostels',
                'Comprehensive care from primary consults to prescription refills',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-white border border-[#DDE3EE] rounded-xl">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  </div>
                  <p className="text-xs font-semibold text-[#0B1221] leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
