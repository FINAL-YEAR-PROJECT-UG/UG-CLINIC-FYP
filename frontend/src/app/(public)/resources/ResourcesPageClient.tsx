'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { useAuthStore } from '@/stores/authStore';
import {
  Search,
  FileText,
  PlayCircle,
  Download,
  Bookmark,
  ChevronDown,
  HandHeart,
  Brain,
  Apple,
  Syringe,
  ShieldCheck,
  HeartPulse,
  Activity,
  UploadCloud,
  Mail,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react';

type ResKind = 'article' | 'guide' | 'video';

const TABS: { id: 'all' | ResKind; label: string }[] = [
  { id: 'all', label: 'All Resources' },
  { id: 'article', label: 'Articles' },
  { id: 'guide', label: 'Guides' },
  { id: 'video', label: 'Videos' },
];

const CATEGORIES = ['All', 'Physical Health', 'Mental Health', 'Nutrition', 'Sexual Health', 'First Aid', 'Sleep'];

const kindMeta: Record<ResKind, { label: string; color: string; Icon: typeof FileText; cta: string }> = {
  article: { label: 'Article', color: '#3B4FD8', Icon: FileText, cta: 'Read Article' },
  guide: { label: 'Guide (PDF)', color: '#EF4444', Icon: Download, cta: 'Download' },
  video: { label: 'Video', color: '#8B5CF6', Icon: PlayCircle, cta: 'Watch Video' },
};

interface Resource {
  title: string;
  description: string;
  category: string;
  kind: ResKind;
  meta: string;
  isNew?: boolean;
}

const resources: Resource[] = [
  {
    title: 'Mental Health & You',
    description: 'Recognise the signs of stress and anxiety and learn where to find support on campus.',
    category: 'Mental Health',
    kind: 'article',
    meta: '6 min read',
    isNew: true,
  },
  {
    title: 'Eating Well on a Student Budget',
    description: 'Practical, affordable meal ideas to keep you energised through lectures and exams.',
    category: 'Nutrition',
    kind: 'article',
    meta: '5 min read',
  },
  {
    title: 'How to Perform Basic First Aid',
    description: 'Step-by-step video covering the essentials every student should know.',
    category: 'First Aid',
    kind: 'video',
    meta: '8 min watch',
    isNew: true,
  },
  {
    title: 'Sexual & Reproductive Health Guide',
    description: 'Everything you need to know about confidential testing, contraception, and care.',
    category: 'Sexual Health',
    kind: 'guide',
    meta: 'PDF • 2.1 MB',
  },
  {
    title: 'Understanding Your UG Health Cover',
    description: 'A clear breakdown of what the student clinic covers and how to access services.',
    category: 'Physical Health',
    kind: 'guide',
    meta: 'PDF • 1.4 MB',
  },
  {
    title: 'Vaccination Schedule for Students',
    description: 'Stay protected — see which vaccines you need and when to get them.',
    category: 'Physical Health',
    kind: 'guide',
    meta: 'PDF • 900 KB',
  },
  {
    title: '5 Ways to Improve Your Sleep',
    description: 'Simple habits that help you fall asleep faster and wake up refreshed.',
    category: 'Sleep',
    kind: 'article',
    meta: '4 min read',
  },
  {
    title: 'Guided Meditation for Exam Stress',
    description: 'A calming guided session to help you reset before a big exam.',
    category: 'Mental Health',
    kind: 'video',
    meta: '12 min watch',
  },
  {
    title: 'Malaria Prevention on Campus',
    description: 'Reduce your risk with these practical prevention tips for living in Accra.',
    category: 'Physical Health',
    kind: 'guide',
    meta: 'PDF • 1.1 MB',
  },
];

const browseCategories = [
  { icon: Brain, label: 'Mental Health', count: 12 },
  { icon: Apple, label: 'Nutrition', count: 8 },
  { icon: HeartPulse, label: 'Physical Health', count: 15 },
  { icon: ShieldCheck, label: 'Sexual Health', count: 6 },
  { icon: Syringe, label: 'Vaccinations', count: 5 },
  { icon: Activity, label: 'First Aid', count: 7 },
];

const faqs = [
  { q: 'Are these resources free to access?', a: 'Yes — every resource here is free for University of Ghana students.' },
  { q: 'Who reviews the content?', a: 'All content is reviewed by qualified clinic staff before it is published.' },
  { q: 'Can I request a topic?', a: 'Absolutely. Use the "Submit Your Article" form below or contact the clinic with your suggestion.' },
  { q: 'How often is content updated?', a: 'We add and refresh resources regularly, especially around exam periods and seasonal health campaigns.' },
  { q: 'Can I download guides for offline use?', a: 'Yes, all guides marked as PDF can be downloaded and saved for offline reading.' },
];

const INITIAL_VISIBLE = 6;

export default function ResourcesPageClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [tab, setTab] = useState<'all' | ResKind>('all');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const tabOk = tab === 'all' || r.kind === tab;
      const catOk = category === 'All' || r.category === category;
      const q = query.trim().toLowerCase();
      const queryOk = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return tabOk && catOk && queryOk;
    });
  }, [tab, category, query]);

  const shown = filtered.slice(0, visible);

  const handleSubmitArticle = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleBookingClick = () => {
    if (isAuthenticated) {
      router.push('/demo-booking');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF1FB]">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Health Resources</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Trusted health guides, wellness tips, and educational materials to help you stay healthy
            throughout your time at the University of Ghana.
          </p>
          <div className="mt-4 text-sm text-blue-200">
            <Link href="/home" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">Health Resources</span>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" style={{ height: 80 }}>
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z" fill="#EEF1FB" />
        </svg>
      </section>

      {/* Tabs + search + filters */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setVisible(INITIAL_VISIBLE); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                tab === t.id ? 'bg-white text-blue-900 shadow-lg scale-105' : 'bg-white/90 text-blue-900 hover:bg-white hover:scale-105'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(INITIAL_VISIBLE); }}
              placeholder="Search resources, guides, topics..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setVisible(INITIAL_VISIBLE); }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                  category === c
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:shadow-sm hover:scale-105'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">FEATURED</span>
            <h2 className="text-2xl font-extrabold text-blue-950 mb-2">Student Mental Health Guide 2026</h2>
            <p className="text-gray-600 mb-4 max-w-xl">
              A comprehensive guide to managing stress, anxiety, and burnout — with practical tools and where to get help on campus.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> 18 min read</span>
              <span className="flex items-center gap-1"><Brain className="h-4 w-4 text-purple-500" /> Mental Health</span>
              <span>English</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105">Read Now</button>
              <button className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-40 w-40 rounded-2xl bg-blue-50 flex items-center justify-center">
              <HandHeart className="h-20 w-20 text-blue-200" />
            </div>
          </div>
        </div>
      </section>

      {/* All resources grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-xl font-bold text-blue-950 mb-6">All Resources</h2>
        {shown.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500">No resources match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((r) => {
              const meta = kindMeta[r.kind];
              const Icon = meta.Icon;
              return (
                <article key={r.title} className="bg-white rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="inline-flex items-center justify-center h-10 w-10 rounded-lg"
                      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {r.isNew && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">NEW</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{r.category}</p>
                  <h3 className="font-bold text-gray-900 mb-2">{r.title}</h3>
                  <p className="text-sm text-gray-600 flex-1">{r.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 my-4">
                    <span className="flex items-center gap-1">{meta.Icon === Download ? <Download className="h-3.5 w-3.5" /> : meta.Icon === PlayCircle ? <PlayCircle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}{r.meta}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105">
                      {meta.cta}
                    </button>
                    <button aria-label="Bookmark" className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {visible < filtered.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisible((v) => v + 3)}
              className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              Load more resources <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* Browse by category */}
      <section className="bg-blue-600 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl font-bold text-center mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {browseCategories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  onClick={() => {
                    setCategory(CATEGORIES.includes(c.label) ? c.label : 'All');
                    setTab('all');
                    setVisible(INITIAL_VISIBLE);
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-xl p-5 flex flex-col items-center gap-2 text-blue-900 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="h-11 w-11 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-700" />
                  </div>
                  <span className="font-semibold text-sm text-center">{c.label}</span>
                  <span className="text-xs text-gray-400">{c.count} resources</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Submit article */}
      <section className="bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4">For Students</span>
            <h2 className="text-3xl font-extrabold text-blue-950 mb-4">Got a Health Article to Share?</h2>
            <p className="text-gray-600 mb-6">
              We welcome health-related articles from students, medical professionals, and wellbeing volunteers.
              Share your knowledge and help fellow students stay healthy.
            </p>
            <ul className="space-y-3 text-gray-700">
              {['Reviewed by qualified clinic staff', 'Credited to you when published', 'Reach thousands of students across campus'].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Submitted for Review</h3>
                <p className="text-gray-600">Thank you! Our team will review your article and get back to you.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitArticle} className="space-y-4">
                <h3 className="font-bold text-blue-950 mb-2">Submit Your Article</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="Full name" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  <input required type="email" placeholder="Email address" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <input required placeholder="Article title" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                <select className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-8 text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <UploadCloud className="h-7 w-7" />
                  Drag and drop your article file, or click to browse
                  <input type="file" className="hidden" />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:shadow-none disabled:hover:scale-100"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <>Submit for Review <Plus className="h-4 w-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#E7EAF7]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <Mail className="h-9 w-9 text-blue-900 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-blue-950 mb-2">Stay Updated on Health Tips</h2>
          <p className="text-gray-600 mb-6">Get the latest health resources and wellness tips delivered to your inbox.</p>
          {subscribed ? (
            <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> You&apos;re subscribed!
            </p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input required type="email" placeholder="your.email@ug.edu.gh" className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              <button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105">Subscribe</button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#EEF1FB]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-950">Frequently Asked Questions</h2>
            <p className="text-gray-600 mt-2">Got questions about our resources?</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-gray-900 hover:bg-blue-50 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`h-5 w-5 text-blue-700 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <div className="px-5 pb-5 text-sm text-gray-600">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#EEF1FB] pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl text-white text-center px-6 py-12">
            <h2 className="text-3xl font-bold mb-3">Have a Health Concern?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Don&apos;t wait — book an appointment with the UG Student Clinic or reach out to our team.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={handleBookingClick} className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-105">
                Book Appointment
              </button>
              <Link href="/contact" className="border border-white/70 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
                Contact the Clinic
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
