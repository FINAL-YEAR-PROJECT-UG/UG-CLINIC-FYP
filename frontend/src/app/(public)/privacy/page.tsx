import { Metadata } from 'next';
import PolicyPage from '@/components/shared/PolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy - UG Clinic Portal',
  description: 'How the University of Ghana Student Clinic collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      breadcrumb="Privacy Policy"
      lastUpdated="June 2026"
      intro="The University of Ghana Student Clinic is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have regarding your data."
      sections={[
        {
          heading: 'Information We Collect',
          body: [
            'We collect information you provide when registering for an account or booking an appointment, including your name, student ID, email address, phone number, and the details of your appointment requests.',
            'We may also collect limited technical information such as your device type and pages visited to help us improve the portal.',
          ],
        },
        {
          heading: 'How We Use Your Information',
          body: [
            'Your information is used solely to provide clinic services: scheduling appointments, maintaining medical records, and communicating important health and account information to you.',
            'We do not sell or rent your personal data to third parties.',
          ],
        },
        {
          heading: 'Data Security',
          body: [
            'We apply appropriate technical and organisational measures to protect your data against unauthorised access, alteration, or disclosure.',
            'Access to medical records is restricted to authorised clinic staff only.',
          ],
        },
        {
          heading: 'Your Rights',
          body: [
            'You have the right to access, correct, or request deletion of your personal information. To exercise these rights, please contact the clinic.',
          ],
        },
      ]}
    />
  );
}
