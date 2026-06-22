import { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us - UG Clinic Portal',
  description: 'Get in touch with the University of Ghana Student Clinic.',
  keywords: ['UG Clinic', 'Contact', 'University of Ghana', 'student clinic'],
};

export default function ContactPage() {
  return <ContactPageClient />;
}
