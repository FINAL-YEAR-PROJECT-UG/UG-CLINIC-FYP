import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

export interface PolicySection {
  heading: string;
  body: string[];
}

interface PolicyPageProps {
  title: string;
  breadcrumb: string;
  lastUpdated: string;
  intro: string;
  sections: PolicySection[];
}

export default function PolicyPage({ title, breadcrumb, lastUpdated, intro, sections }: PolicyPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          <p className="text-blue-200 text-sm">Last updated: {lastUpdated}</p>
          <div className="mt-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">{breadcrumb}</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-gray-700 leading-relaxed mb-10">{intro}</p>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-blue-900 mb-3">{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-3">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-gray-700">
          Questions? Visit our{' '}
          <Link href="/contact" className="text-blue-700 font-semibold hover:underline">
            Contact page
          </Link>{' '}
          to get in touch with the clinic team.
        </div>
      </article>

      <Footer />
    </div>
  );
}
