import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import {
  HeartPulse,
  Brain,
  Syringe,
  Apple,
  ShieldCheck,
  Phone,
  FileText,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Health Resources - UG Clinic Portal',
  description:
    'Health guides, wellness tips, and educational resources from the University of Ghana Student Clinic.',
  keywords: ['UG Clinic', 'Health Resources', 'wellness', 'student health', 'University of Ghana'],
};

const featured = [
  {
    tag: 'Awareness',
    tagColor: 'bg-red-50 text-red-600',
    title: 'HIV/AIDS Awareness & Prevention',
    description:
      'Understand prevention, free confidential testing, and the support resources available to every student.',
    image: '/home/health-hiv.png',
    href: '/services',
    cta: 'Learn More',
  },
  {
    tag: 'Vaccination',
    tagColor: 'bg-blue-50 text-blue-600',
    title: 'Flu Vaccination Drive',
    description:
      'Protect yourself this season. Find out who should get vaccinated and how to book your flu shot.',
    image: '/home/health-flu.png',
    href: '/demo-booking',
    cta: 'Book Now',
  },
  {
    tag: 'Wellness',
    tagColor: 'bg-green-50 text-green-600',
    title: 'Healthy Lifestyle During Exams',
    description:
      'Simple, practical strategies to maintain your physical and mental wellbeing through exam season.',
    image: '/home/health-wellness.svg',
    href: '/resources',
    cta: 'Read More',
  },
];

const categories = [
  {
    icon: HeartPulse,
    color: 'text-rose-600 bg-rose-50',
    title: 'General Health',
    description: 'Everyday health advice, common illnesses, and when to visit the clinic.',
  },
  {
    icon: Brain,
    color: 'text-purple-600 bg-purple-50',
    title: 'Mental Wellbeing',
    description: 'Stress management, counselling resources, and looking after your mind.',
  },
  {
    icon: Syringe,
    color: 'text-blue-600 bg-blue-50',
    title: 'Vaccinations',
    description: 'Immunization schedules, travel vaccines, and seasonal flu shots.',
  },
  {
    icon: Apple,
    color: 'text-green-600 bg-green-50',
    title: 'Nutrition',
    description: 'Balanced eating on a student budget and healthy meal planning.',
  },
  {
    icon: ShieldCheck,
    color: 'text-teal-600 bg-teal-50',
    title: 'Sexual Health',
    description: 'Confidential advice, screening, and reproductive health guidance.',
  },
  {
    icon: HeartPulse,
    color: 'text-amber-600 bg-amber-50',
    title: 'First Aid',
    description: 'Basic first aid steps and what to do in common emergencies.',
  },
];

const tips = [
  'Stay hydrated — aim for at least 6–8 glasses of water a day.',
  'Get 7–9 hours of sleep, especially during exam periods.',
  'Wash your hands regularly to prevent the spread of infections.',
  'Take short movement breaks during long study sessions.',
  'Reach out early — book a counselling session if you feel overwhelmed.',
];

const guides = [
  'Student Health Handbook (PDF)',
  'Mental Health Self-Care Guide',
  'Vaccination Schedule 2026',
  'Healthy Eating on Campus',
];

export default function HealthResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Health Resources</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Trusted health guides, wellness tips, and educational materials to help you stay healthy
            throughout your time at the University of Ghana.
          </p>
          <div className="mt-6 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">Health Resources</span>
          </div>
        </div>
      </section>

      {/* Featured resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue-900">Featured Resources</h2>
          <p className="text-gray-600 mt-2">Stay informed with our latest health initiatives and advice.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="relative h-44 bg-gray-100">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span
                  className={`self-start text-xs font-semibold px-3 py-1 rounded-full mb-3 ${item.tagColor}`}
                >
                  {item.tag}
                </span>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm flex-1">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-1 text-blue-700 font-semibold text-sm hover:gap-2 transition-all"
                >
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900">Browse by Topic</h2>
            <p className="text-gray-600 mt-2">Explore resources across the areas that matter to your health.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-lg mb-4 ${cat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{cat.title}</h3>
                  <p className="text-gray-600 text-sm">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips + Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Quick Health Tips</h2>
          <ul className="space-y-4">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-700 flex-shrink-0" />
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Downloadable Guides</h2>
          <ul className="space-y-3">
            {guides.map((guide) => (
              <li key={guide}>
                <Link
                  href="/resources"
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span className="flex items-center gap-3 text-gray-800">
                    <FileText className="h-5 w-5 text-blue-700" />
                    {guide}
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-700" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Emergency banner */}
      <section className="bg-red-50 border-y border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-red-700">
            <Phone className="h-6 w-6 flex-shrink-0" />
            <p className="font-medium">
              In a medical emergency, call <strong>+233 XXX XXX XXX</strong> or visit the clinic immediately.
            </p>
          </div>
          <Link
            href="/contact"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
          >
            Contact the Clinic
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-3">Need to see a healthcare professional?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Book an appointment with the UG Student Clinic in under three minutes. Free for all students.
          </p>
          <Link
            href="/demo-booking"
            className="inline-block bg-white text-blue-900 font-semibold px-8 py-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
