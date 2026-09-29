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

      <section className="relative bg-[#0F172A] text-white py-16 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/ug-video.mp4" type="video/mp4" />
          <source src="/UG video.mp4" type="video/mp4" />
        </video>

        {/* Video Overlay / Gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/85 via-[#0F172A]/70 to-[#1e3a8a]/65 backdrop-blur-[1px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
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
