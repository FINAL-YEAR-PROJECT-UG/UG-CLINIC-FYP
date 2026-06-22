'use client';

import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import styles from './page.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  availability: string;
  icon: React.ReactNode;
}

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FAQ {
  category: string;
  categoryColor: string;
  title: string;
  whatToExpect: string;
  whoCanAccess: string;
  availableTimes: string;
  cost: string;
}

interface ScheduleRow {
  day: string;
  morning: string;
  afternoon: string;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────

const Icon = {
  stethoscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  apple: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /></svg>
  ),
  eye: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>
  ),
  bookOpen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
  ),
  heartFill: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  chevronUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
  ),
  location: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  phone: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  ),
  mail: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
  ),
  list: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
  ),
  calendar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  building: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
  ),
  user: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  smallLocation: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  smallPhone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  ),
  smallMail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
  ),
  facebook: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
  ),
  twitter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
  ),
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
  ),
  clinic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
  ),
};

// ── Data ─────────────────────────────────────────────────────────────────────

const services: Service[] = [
  { id: 'general', category: 'GENERAL', categoryColor: '#1E3A8A', title: 'General Consultation', description: 'Comprehensive medical examinations, diagnosis, and treatment for common illnesses and injuries.', availability: 'Available', icon: Icon.stethoscope },
  { id: 'mental-health', category: 'MENTAL HEALTH', categoryColor: '#7C3AED', title: 'Mental Health & Counseling', description: 'Confidential psychological support, counseling sessions, and mental wellness resources for students.', availability: 'Mon-Fri, 9am-4pm', icon: Icon.heart },
  { id: 'hiv', category: 'HIV/AIDS', categoryColor: '#DC2626', title: 'HIV/AIDS Testing & Support', description: 'Free, confidential HIV testing, counseling, and ongoing support services for the university community.', availability: 'Tue & Thu', icon: Icon.shield },
  { id: 'nutrition', category: 'NUTRITION', categoryColor: '#059669', title: 'Nutrition & Dietetics', description: 'Personalized dietary assessments, nutritional counseling, and healthy eating plans tailored to student lifestyles.', availability: 'Mon, Wed, Fri', icon: Icon.apple },
  { id: 'eye-care', category: 'EYE CARE', categoryColor: '#0891B2', title: 'Eye Care Services', description: 'Vision screening, eye health assessments, and referrals for glasses or specialized eye treatment.', availability: 'Wed only', icon: Icon.eye },
  { id: 'screening', category: 'SCREENING', categoryColor: '#D97706', title: 'Health Screening', description: 'Comprehensive health screening packages including blood pressure, blood sugar, BMI, and general wellness checks.', availability: 'Mon-Fri', icon: Icon.clipboard },
  { id: 'education', category: 'EDUCATION', categoryColor: '#4F46E5', title: 'Health Education', description: 'Workshops, seminars, and educational resources on topics including sexual health, nutrition, and disease prevention.', availability: 'Monthly programs', icon: Icon.bookOpen },
  { id: 'family-planning', category: 'FAMILY PLANNING', categoryColor: '#DB2777', title: 'Family Planning', description: 'Confidential family planning advice, contraception services, and reproductive health consultations.', availability: 'Mon & Thu', icon: Icon.heartFill },
  { id: 'emergency', category: 'FAMILY PLANNING', categoryColor: '#DC2626', title: 'Emergency Services', description: 'Confidential family planning advice, contraception services, and reproductive health consultations.', availability: 'Mon & Thu', icon: Icon.shield },
];

const steps: Step[] = [
  { number: '1', title: 'Choose a Service', description: 'Browse our services and select what you need', icon: Icon.list },
  { number: '2', title: 'Book or Walk In', description: 'Schedule online or visit during clinic hours', icon: Icon.calendar },
  { number: '3', title: 'Visit the Clinic', description: 'Come to the Student Clinic at your scheduled time', icon: Icon.building },
  { number: '4', title: 'Get Your Care', description: 'Receive professional, confidential treatment', icon: Icon.user },
];

const faqs: FAQ[] = [
  {
    category: 'GENERAL',
    categoryColor: '#1E3A8A',
    title: 'General Consultation',
    whatToExpect: 'Comprehensive medical examination including vital signs check, symptom assessment, diagnosis, and treatment plan.',
    whoCanAccess: 'All UG students, staff, and faculty members with valid ID.',
    availableTimes: 'Monday-Friday, 8:00am-5:00pm',
    cost: 'Free for students',
  },
];

const schedule: ScheduleRow[] = [
  { day: 'Monday', morning: 'Available', afternoon: 'Available' },
  { day: 'Tuesday', morning: 'Available', afternoon: 'Available' },
  { day: 'Wednesday', morning: 'Available', afternoon: 'Available' },
  { day: 'Thursday', morning: 'Available', afternoon: 'Available' },
  { day: 'Friday', morning: 'Available', afternoon: 'Available' },
  { day: 'Saturday', morning: 'Available (9:00 - 1:00)', afternoon: 'Closed' },
  { day: 'Sunday', morning: 'Closed', afternoon: 'Closed' },
];


// ── Main Page ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  return (
    <div className={styles.page}>
      <Header />

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Our Services</h1>
        <p className={styles.heroSubtitle}>Professional, confidential care for every student need</p>
        <div className={styles.heroBreadcrumb}>
          <Link href="/">Home</Link> / <span>Our Services</span>
        </div>
        <div className={styles.heroTags}>
          {['Professional Care', 'Confidential', 'Student Focused'].map((tag) => (
            <span key={tag} className={styles.heroTag}>
              {tag === 'Professional Care' ? '✓' : tag === 'Confidential' ? '🔒' : '🎓'} {tag}
            </span>
          ))}
        </div>
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F3F4F6" />
          </svg>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className={styles.emergencyBanner}>
        <div className={styles.emergencyInner}>
          <div className={styles.emergencyText}>
            {Icon.alert}
            <span>For medical emergencies, call <strong>+233 XXX XXX XXX</strong> or visit the clinic immediately</span>
          </div>
          <button className={styles.emergencyCta}>Call Now →</button>
        </div>
      </section>

      {/* Services Grid */}
      <section className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything You Need, All in One Place</h2>
          <h3 className={styles.sectionSubtitle}>Free Healthcare Services</h3>
          <div className={styles.sectionDivider} />
          <p className={styles.sectionDesc}>
            From general checkups to specialized care, the University of Ghana Student Clinic offers a full range of medical services designed specifically for students, staff, and faculty.
          </p>
          <p className={styles.sectionNote}>For Eye and dental care services, kindly visit the Main UG Hospital</p>
        </div>

        <div className={styles.servicesHeader}>
          <h3 className={styles.servicesTitle}>All Services</h3>
          <span className={styles.servicesCount}>Showing {services.length} services</span>
        </div>

        <div className={styles.servicesGrid}>
          {services.map((service) => (
            <article key={service.id} className={styles.card}>
              {/* IMAGE PLACEHOLDER - Uncomment Image component when ready */}
              <div className={styles.cardImageWrapper}>
                {/*
                <Image
                  src={`/images/services/${service.id}.jpg`}
                  alt={service.title}
                  fill
                  className={styles.cardImage}
                />
                */}
                <div className={styles.cardImagePlaceholder}>
                  {service.title}
                </div>
                <span className={styles.cardBadge} style={{ background: service.categoryColor }}>
                  {service.category}
                </span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>{service.icon}</div>
                <h4 className={styles.cardTitle}>{service.title}</h4>
                <p className={styles.cardDesc}>{service.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardAvailability}>{Icon.check} {service.availability}</span>
                  <Link href="#service-details" className={styles.cardLink}>Learn More →</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorksDecor1} />
        <div className={styles.howItWorksDecor2} />
        <div className={styles.howItWorksInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.labelWhite}>HOW IT WORKS</span>
            <h2 className={styles.heroTitle}>Getting Care is Simple</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Four easy steps to access our services</p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepCircle}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  {step.icon}
                </div>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="service-details" className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.labelBlue}>SERVICE DETAILS</span>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions by Students</h2>
        </div>

        {faqs.map((faq) => (
          <div key={faq.title} className={styles.faqCard}>
            <div className={styles.faqHeader}>
              <div className={styles.faqMeta}>
                <span className={styles.faqBadge} style={{ background: faq.categoryColor }}>{faq.category}</span>
                <h4 className={styles.faqTitle}>{faq.title}</h4>
                <span className={styles.faqChevron}>{Icon.chevronUp}</span>
              </div>
              <div className={styles.faqDetails}>
                <div className={styles.faqRow}><span className={styles.faqLabel}>What to expect:</span><span className={styles.faqValue}>{faq.whatToExpect}</span></div>
                <div className={styles.faqRow}><span className={styles.faqLabel}>Who can access:</span><span className={styles.faqValue}>{faq.whoCanAccess}</span></div>
                <div className={styles.faqRow}><span className={styles.faqLabel}>Available times:</span><span className={styles.faqValue}>{faq.availableTimes}</span></div>
                <div className={styles.faqRow}><span className={styles.faqLabel}>Cost:</span><span className={styles.faqValueFree}>{faq.cost}</span></div>
              </div>
            </div>
            <div className={styles.faqAction}>
              <Link href="/demo-booking" className={styles.faqButton}>Book This Service →</Link>
            </div>
          </div>
        ))}
      </section>

      {/* Contact Cards */}
      <section className={styles.contactSection}>
        <div className={styles.contactGrid}>
          {[
            { icon: Icon.location, title: 'Find Us', lines: ['University of Ghana, Legon', 'Student Clinic Block'], action: 'Get Directions', href: 'https://www.google.com/maps/search/?api=1&query=University+of+Ghana+Legon', external: true },
            { icon: Icon.phone, title: 'Call Us', lines: ['General: +233 XXX XXX', 'Emergency: +233 XXX XXX'], action: 'Call Now', href: 'tel:+233000000000', external: false },
            { icon: Icon.mail, title: 'Email Us', lines: ['clinic@ug.edu.gh', 'Response within 24 hours'], action: 'Send Email', href: 'mailto:clinic@ug.edu.gh', external: false },
          ].map((card) => (
            <div key={card.title} className={styles.contactCard}>
              <div className={styles.contactIcon}>{card.icon}</div>
              <h4 className={styles.contactTitle}>{card.title}</h4>
              {card.lines.map((line) => <p key={line} className={styles.contactLine}>{line}</p>)}
              <a
                href={card.href}
                className={styles.contactButton}
                {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {card.action}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ready to See the Doctor?</h2>
          <h3 className={styles.sectionSubtitle}>Book Appointment Online in Under 3 minutes</h3>
        </div>

        <div className={styles.scheduleTable}>
          <div className={styles.scheduleHeader}>
            <span>Day</span>
            <span className={styles.textCenter}>Morning (8:00 - 12:00)</span>
            <span className={styles.textCenter}>Afternoon (2:00 - 5:00)</span>
          </div>
          {schedule.map((row, i) => (
            <div key={row.day} className={styles.scheduleRow} style={{ borderBottom: i < schedule.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
              <span className={styles.scheduleDay}>{row.day}</span>
              <span className={row.morning.includes('Available') ? styles.scheduleAvailable : styles.scheduleClosed}>{row.morning}</span>
              <span className={row.afternoon.includes('Available') ? styles.scheduleAvailable : styles.scheduleClosed}>{row.afternoon}</span>
            </div>
          ))}
        </div>

        <div className={styles.scheduleCta}>
          <Link href="/demo-booking" className={styles.scheduleButton}>Book Appointment</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}