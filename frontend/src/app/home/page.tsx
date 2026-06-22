import { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'UG Clinic Portal - University of Ghana Healthcare Services',
  description: 'Access quality healthcare services at the University of Ghana Student Clinic.',
  keywords: ['UG Clinic', 'University of Ghana', 'healthcare', 'medical'],
};

export default function HomePage() {
  return <HomePageClient />;
}
