import { Metadata } from 'next';
import ResourcesPageClient from './ResourcesPageClient';

export const metadata: Metadata = {
  title: 'Health Resources - UG Clinic Portal',
  description:
    'Health guides, wellness tips, and educational resources from the University of Ghana Student Clinic.',
  keywords: ['UG Clinic', 'Health Resources', 'wellness', 'student health', 'University of Ghana'],
};

export default function HealthResourcesPage() {
  return <ResourcesPageClient />;
}
