"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import './AboutPageClient.css';

export default function AboutPageClient() {
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
