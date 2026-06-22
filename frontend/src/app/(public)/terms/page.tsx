import { Metadata } from 'next';
import PolicyPage from '@/components/shared/PolicyPage';

export const metadata: Metadata = {
  title: 'Terms of Service - UG Clinic Portal',
  description: 'The terms and conditions governing use of the University of Ghana Student Clinic portal.',
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      breadcrumb="Terms of Service"
      lastUpdated="June 2026"
      intro="By using the University of Ghana Student Clinic portal, you agree to these terms. Please read them carefully before booking appointments or creating an account."
      sections={[
        {
          heading: 'Eligibility',
          body: [
            'The portal is intended for registered students and staff of the University of Ghana. You must provide accurate registration details to use the service.',
          ],
        },
        {
          heading: 'Appointments',
          body: [
            'Appointments are subject to availability. Please arrive on time and cancel in advance if you are unable to attend so the slot can be offered to another student.',
            'Repeated no-shows may affect your ability to book future appointments.',
          ],
        },
        {
          heading: 'Acceptable Use',
          body: [
            'You agree not to misuse the portal, attempt to gain unauthorised access, or submit false information. Accounts found in breach may be suspended.',
          ],
        },
        {
          heading: 'Limitation of Liability',
          body: [
            'The portal is provided to support clinic services and is not a substitute for emergency care. In an emergency, contact emergency services or visit the clinic immediately.',
          ],
        },
      ]}
    />
  );
}
