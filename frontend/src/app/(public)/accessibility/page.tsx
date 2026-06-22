import { Metadata } from 'next';
import PolicyPage from '@/components/shared/PolicyPage';

export const metadata: Metadata = {
  title: 'Accessibility - UG Clinic Portal',
  description: 'Our commitment to making the University of Ghana Student Clinic portal accessible to everyone.',
};

export default function AccessibilityPage() {
  return (
    <PolicyPage
      title="Accessibility"
      breadcrumb="Accessibility"
      lastUpdated="June 2026"
      intro="We want every student to be able to use the UG Student Clinic portal with ease. We are continually working to improve the accessibility and usability of our services."
      sections={[
        {
          heading: 'Our Commitment',
          body: [
            'We aim to meet recognised accessibility standards (WCAG 2.1 AA) across the portal, including readable typography, sufficient colour contrast, and keyboard navigability.',
          ],
        },
        {
          heading: 'Assistive Technology',
          body: [
            'The portal is designed to work with common assistive technologies such as screen readers and browser zoom. Form fields include descriptive labels to support these tools.',
          ],
        },
        {
          heading: 'Ongoing Improvements',
          body: [
            'Accessibility is an ongoing effort. We regularly review the portal and welcome feedback that helps us identify and remove barriers.',
          ],
        },
        {
          heading: 'Feedback',
          body: [
            'If you encounter an accessibility barrier, please let us know through the Contact page so we can address it promptly.',
          ],
        },
      ]}
    />
  );
}
