import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About Us - UG Clinic Portal',
  description: 'Learn about the University of Ghana Student Clinic and our commitment to student healthcare.',
  keywords: ['UG Clinic', 'About', 'University of Ghana', 'healthcare', 'student services'],
};

export default function AboutPage() {
  return <AboutPageClient />;
}
