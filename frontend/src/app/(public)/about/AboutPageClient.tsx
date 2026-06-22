"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  Users,
  Award,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import './AboutPageClient.css';

// Inline social icons
const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function AboutPageClient() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  const ourStory = [
    {
      year: '2010',
      title: 'Establishment',
      description: 'The Student Clinic was established to provide accessible healthcare to the university community.',
    },
    {
      year: '2015',
      title: 'Expansion',
      description: 'Expanded services to include mental health support and specialized care programs.',
    },
    {
      year: '2020',
      title: 'Modernization',
      description: 'Upgraded facilities with modern medical equipment and digital health records.',
    },
    {
      year: '2024',
      title: 'Comprehensive Care',
      description: 'Now serving over 10,000 students with full-service healthcare and wellness programs.',
    },
  ];

  const coreValues = [
    {
      title: 'Compassion',
      description: 'We treat every patient with empathy, dignity, and understanding.',
      image: '/home/compassion.svg',
    },
    {
      title: 'Excellence',
      description: 'We strive for the highest quality care through continuous improvement.',
      image: '/home/excellence-about.svg',
    },
    {
      title: 'Integrity',
      description: 'We maintain the highest ethical standards in all our practices.',
      image: '/home/integrity-about.svg',
    },
    {
      title: 'Respect',
      description: 'We honor the dignity and worth of every individual.',
      image: '/home/respect-about.svg',
    },
  ];

  const team = [
    {
      name: 'Dr. Emmanuel Osei',
      role: 'Medical Director',
      description: 'Leading the clinic with over 20 years of experience in student healthcare.',
    },
    {
      name: 'Dr. Sarah Mensah',
      role: 'Chief Physician',
      description: 'Specializing in internal medicine and preventive care for students.',
    },
    {
      name: 'Nurse Comfort Agyeman',
      role: 'Head Nurse',
      description: 'Coordinating nursing services and patient care with dedication.',
    },
  ];

  const achievements = [
    {
      icon: Users,
      title: '10,000+ Students Served',
      description: 'Providing healthcare to thousands of students annually.',
    },
    {
      icon: Award,
      title: 'Award-Winning Care',
      description: 'Recognized for excellence in student healthcare services.',
    },
    {
      icon: Clock,
      title: '24/7 Emergency Support',
      description: 'Round-the-clock emergency care for urgent health needs.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            About Our Clinic
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Dedicated to providing exceptional healthcare services to the University of Ghana student community since 2010.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 rounded-md">
                Our Services
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 rounded-md">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden">
              <Image
                src="/home/who-we-are.png"
                alt="Who We Are"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-6">
                Who We Are
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                The University of Ghana Student Clinic is a dedicated healthcare facility serving the university community. We provide comprehensive medical services, preventive care, and health education to support student wellbeing and academic success.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our team of experienced healthcare professionals is committed to delivering high-quality, accessible, and confidential care in a supportive environment.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Serving Since 2010</p>
                  <p className="text-xs text-gray-500">Over 14 years of dedicated service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Our Story</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From humble beginnings to a comprehensive healthcare center serving thousands of students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ourStory.map((milestone, index) => (
              <Card key={index} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-lg">{milestone.year}</span>
                  </div>
                  <CardTitle className="text-lg text-blue-900">{milestone.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{milestone.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img
                    src="/home/mission.svg"
                    alt="Mission"
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-6">Our Mission</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  To provide accessible, comprehensive, and student-centered healthcare services that promote physical, mental, and emotional wellbeing. We are committed to creating a supportive environment where every student can thrive academically and personally.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Through prevention, education, and compassionate care, we empower students to make informed health decisions and maintain optimal wellness throughout their university experience.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img
                    src="/home/vision.svg"
                    alt="Vision"
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-6">Our Vision</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  To be the leading student healthcare provider in Ghana, setting the standard for excellence in university health services. We envision a future where every student has access to quality healthcare that supports their academic success and personal growth.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We strive to continuously improve our services, embrace innovation in healthcare delivery, and foster a culture of wellness within the university community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the dedicated healthcare professionals committed to your wellbeing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
                <CardHeader className="pb-2">
                  <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-blue-900" />
                  </div>
                  <CardTitle className="text-lg text-blue-900">{member.name}</CardTitle>
                  <p className="text-sm text-blue-600 font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
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

      {/* Achievements Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Achievements</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Proud milestones in our journey of serving student healthcare needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card key={index} className="bg-white/10 backdrop-blur border border-white/20">
                  <CardHeader className="pb-2 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-100 text-center leading-relaxed">{achievement.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              What sets our clinic apart in providing exceptional student healthcare.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Free healthcare services for all registered students',
              'Experienced and qualified medical professionals',
              'Confidential and respectful patient care',
              'Modern medical equipment and facilities',
              'Convenient location on campus',
              'Comprehensive range of medical services',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
