'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { submitPublicResource } from '@/lib/staffApi';
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
  AlertTriangle,
  Loader2,
  Plus,
  ShieldAlert,
  BookOpen,
} from '@/components/icons';

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
    description: 'Stay protected   see which vaccines you need and when to get them.',
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
  { q: 'Are these resources free to access?', a: 'Yes   every resource here is free for University of Ghana students.' },
  { q: 'Who reviews the content?', a: 'All content is reviewed by qualified clinic staff before it is published.' },
  { q: 'Can I request a topic?', a: 'Absolutely. Use the "Submit Your Article" form below or contact the clinic with your suggestion.' },
  { q: 'How often is content updated?', a: 'We add and refresh resources regularly, especially around exam periods and seasonal health campaigns.' },
  { q: 'Can I download guides for offline use?', a: 'Yes, all guides marked as PDF can be downloaded and saved for offline reading.' },
];

const INITIAL_VISIBLE = 6;

export default function ResourcesPageClient() {
  const [tab, setTab] = useState<'all' | ResKind>('all');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitScanStatus, setSubmitScanStatus] = useState<'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Submission form fields
  const [subForm, setSubForm] = useState({
    authorName: '',
    authorEmail: '',
    title: '',
    category: 'Physical Health',
    description: '',
  });

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

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.title.trim() || !subForm.authorName.trim() || !subForm.authorEmail.trim() || !subForm.description.trim()) return;
    try {
      setSubmitting(true);
      setSubmitScanStatus(null);
      setSubmitMessage(null);
      const result = await submitPublicResource({
        title: subForm.title.trim(),
        description: subForm.description.trim(),
        category: subForm.category,
        authorName: subForm.authorName.trim(),
        authorEmail: subForm.authorEmail.trim(),
      });
      setSubmitScanStatus(result.scanResult?.status ?? 'CLEAN');
      setSubmitMessage(result.message);
      if (result.scanResult?.status !== 'MALICIOUS') {
        setSubmitted(true);
      }
    } catch {
      setSubmitMessage('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Header />

      {/* Hero */}
      <section className="relative bg-[#0F172A] text-white pb-24 overflow-hidden">
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 text-center z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200 backdrop-blur-md mb-4">
            UG Health Knowledge Base
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">Health Resources</h1>
          <p className="text-blue-100/90 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Trusted health guides, wellness tips, and educational materials to help you stay healthy
            throughout your time at the University of Ghana.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" style={{ height: 80 }}>
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z" fill="#F5F7FB" />
        </svg>
      </section>

      {/* ── Resources Content ── */}
      <div className="relative">
          {/* Tabs + search + filters */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
            <div className="flex justify-center gap-2.5 mb-5 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setVisible(INITIAL_VISIBLE); }}
                  className={`px-5 py-2.5 rounded-xl text-xs transition-all duration-200 ${tab === t.id
                      ? 'bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white shadow-md font-extrabold scale-105 ring-2 ring-[#1e3a8a]/20'
                      : 'bg-white/90 text-[#4B5A6E] border border-white/80 shadow-sm font-bold hover:text-[#0F172A] hover:border-[#0369A1] hover:bg-blue-50/60 backdrop-blur-sm'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="bg-white/92 backdrop-blur-md rounded-2xl shadow-sm border border-white/80 p-5">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA8BA]" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setVisible(INITIAL_VISIBLE); }}
                  placeholder="Search resources, guides, topics..."
                  className="w-full rounded-xl border border-[#DDE3EE] bg-[#F5F7FB]/90 pl-11 pr-4 py-2.5 text-sm text-[#0B1221] placeholder-[#9CA8BA] focus:border-[#0369A1] focus:ring-2 focus:ring-[#0369A1]/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setVisible(INITIAL_VISIBLE); }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${category === c
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm scale-105'
                        : 'bg-white/80 text-[#4B5A6E] border-[#DDE3EE] hover:border-[#0369A1] hover:shadow-2xs'
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
            <div className="bg-white/92 backdrop-blur-md rounded-2xl shadow-sm border border-white/80 p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">FEATURED</span>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Student Mental Health Guide 2026</h2>
                <p className="text-gray-600 mb-4 max-w-xl">
                  A comprehensive guide to managing stress, anxiety, and burnout   with practical tools and where to get help on campus.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-5">
                  <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> 18 min read</span>
                  <span className="flex items-center gap-1"><Brain className="h-4 w-4 text-purple-500" /> Mental Health</span>
                  <span>English</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105">Read Now</button>
                  <button className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 hover:border-[#3b82f6] hover:shadow-md transition-all duration-200">
                    <Download className="h-4 w-4" /> Download PDF
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="h-40 w-40 rounded-2xl bg-blue-50/80 flex items-center justify-center">
                  <HandHeart className="h-20 w-20 text-[#1e3a8a]/30" />
                </div>
              </div>
            </div>
          </section>

          {/* All resources grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-[#0B1221]">All Resources</h2>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm border border-[#DDE3EE] rounded-full text-xs font-bold text-[#1e3a8a]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {shown.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-10 text-center text-[#6B7A8D] text-sm">No resources match your filters.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {shown.map((r) => {
                  const meta = kindMeta[r.kind];
                  const Icon = meta.Icon;
                  return (
                    <article key={r.title} className="bg-white/92 backdrop-blur-md border border-white/80 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[#DDE3EE]"
                          style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {r.isNew && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">NEW</span>
                        )}
                      </div>
                      <span className="text-[10px] font-extrabold text-[#0369A1] uppercase tracking-wider mb-1">{r.category}</span>
                      <h3 className="font-extrabold text-[#0B1221] text-base mb-2">{r.title}</h3>
                      <p className="text-xs text-[#6B7A8D] leading-relaxed flex-1">{r.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B7A8D] font-medium my-4 pt-3 border-t border-[#EEF1F8]">
                        <span className="flex items-center gap-1">{meta.Icon === Download ? <Download className="h-3 w-3" /> : meta.Icon === PlayCircle ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}{r.meta}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex-1 bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white text-xs font-extrabold py-2.5 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          {meta.cta}
                        </button>
                        <button aria-label="Bookmark" className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#DDE3EE] text-[#6B7A8D] hover:bg-blue-50 hover:border-[#0369A1] hover:text-[#0369A1] transition-all duration-200">
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
                  className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-white/80 text-[#4B5A6E] font-bold text-xs px-6 py-3 rounded-xl shadow-sm hover:bg-white hover:border-[#0369A1] hover:text-[#0369A1] transition-all duration-200"
                >
                  Load more resources <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* Browse by category */}
          <section className="bg-gradient-to-br from-[#0F172A]/95 via-[#1e3a8a]/95 to-[#0369A1]/95 backdrop-blur-md text-white mt-16 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="text-center mb-8">
                <span className="inline-block bg-white/10 border border-white/15 text-blue-200 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 backdrop-blur-sm">Categories</span>
                <h2 className="text-2xl font-extrabold text-white">Browse by Health Topic</h2>
              </div>
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
                      className="bg-white/95 rounded-xl p-5 flex flex-col items-center gap-2 text-[#1e3a8a] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer"
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
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/80 shadow-sm">
              <div>
                <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4">For Students</span>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Got a Health Article to Share?</h2>
                <p className="text-gray-600 mb-6">
                  We welcome health-related articles from students, medical professionals, and wellbeing volunteers.
                  Share your knowledge and help fellow students stay healthy.
                </p>
                <ul className="space-y-3 text-gray-700">
                  {['Reviewed by qualified clinic staff', 'Credited to you when published', 'Reach thousands of students across campus'].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <span className="text-xs font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/95 rounded-2xl shadow-sm border border-[#DDE3EE] p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Submitted for Review!</h3>
                    <p className="text-gray-600 mb-2">{submitMessage ?? 'Thank you! Our team will review your article and get back to you shortly.'}</p>
                    {submitScanStatus && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${submitScanStatus === 'CLEAN' ? 'bg-emerald-100 text-emerald-700' :
                          submitScanStatus === 'SUSPICIOUS' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {submitScanStatus === 'CLEAN' ? <> Security scan passed</> :
                          submitScanStatus === 'SUSPICIOUS' ? <>Flagged for manual review</> :
                            <> Security threat detected</>}
                      </span>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitArticle} className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">Submit Your Article</h3>
                    </div>
                    <p className="text-xs text-gray-500">Your submission is automatically scanned for security before reaching clinic staff.</p>
                    {submitMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {submitMessage}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        required
                        placeholder="Full name"
                        value={subForm.authorName}
                        onChange={(e) => setSubForm((f) => ({ ...f, authorName: e.target.value }))}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all"
                      />
                      <input
                        required
                        type="email"
                        placeholder="Email address"
                        value={subForm.authorEmail}
                        onChange={(e) => setSubForm((f) => ({ ...f, authorEmail: e.target.value }))}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all"
                      />
                    </div>
                    <input
                      required
                      placeholder="Article title"
                      value={subForm.title}
                      onChange={(e) => setSubForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all"
                    />
                    <select
                      value={subForm.category}
                      onChange={(e) => setSubForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <textarea
                      required
                      rows={4}
                      placeholder="Paste or write your article content here..."
                      value={subForm.description}
                      onChange={(e) => setSubForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning & Submitting...</> : <>Submit for Review <Plus className="h-4 w-4" /></>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* Newsletter */}
          <section className="py-14 text-center">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/92 backdrop-blur-md rounded-3xl p-8 border border-white/80 shadow-sm">
              <Mail className="h-9 w-9 text-[#1e3a8a] mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-blue-950 mb-2">Stay Updated on Health Tips</h2>
              <p className="text-gray-600 mb-6">Get the latest health resources and wellness tips delivered to your inbox.</p>
              {subscribed ? (
                <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Subscribed successfully!
                </p>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input required type="email" placeholder="your.email@ug.edu.gh" className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  <button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105">Subscribe</button>
                </form>
              )}
            </div>
          </section>

          {/* FAQ */}
          <section className="py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
                <p className="text-gray-600 mt-2">Got questions about our resources?</p>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={faq.q} className="bg-white/92 backdrop-blur-md border border-white/80 rounded-xl overflow-hidden shadow-2xs">
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
          <section className="pb-16 pt-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-[#0F172A]/95 via-[#1e3a8a]/95 to-[#0369A1]/95 backdrop-blur-md rounded-2xl text-white text-center px-6 py-14 shadow-[0_8px_30px_rgba(15,23,42,0.25)] overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold mb-3">Have a Health Concern?</h2>
                  <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                    Don&apos;t wait   book an appointment with the UG Student Clinic or reach out to our team.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/login" className="bg-white text-[#1e3a8a] font-bold px-6 py-3 rounded-xl hover:bg-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-105">
                      Book Appointment
                    </Link>
                    <Link href="/contact" className="border border-white/70 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
                      Contact the Clinic
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
      </div>

      <Footer />
    </div>
  );
}
