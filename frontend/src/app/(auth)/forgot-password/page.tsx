'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getRecoveryCallbackRedirect } from '@/lib/authUrl';
import UGLogo from '@/components/shared/UGLogo';
import { KeyRound, ArrowLeft, Loader2, Mail } from '@/components/icons';
import Toast from '@/components/shared/Toast';

import SuccessCheckmark from '@/components/shared/SuccessCheckmark';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg]   = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setToastType('error');
      setToastMsg('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setToastMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getRecoveryCallbackRedirect(window.location.origin),
      });
      if (error) {
        // Don't expose whether the email exists or not for security
        console.error('[ForgotPassword] resetPasswordForEmail:', error.message);
      }
      // Always show success to prevent email enumeration
      setSent(true);
      setToastType('success');
      setToastMsg('Reset link sent! Check your inbox.');
    } catch (err) {
      console.error('[ForgotPassword]', err);
      setToastType('error');
      setToastMsg('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      <Toast message={toastMsg} type={toastType} onDismiss={() => setToastMsg(null)} />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.08)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-[#4B5A6E] hover:text-[#0369A1] px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative bg-[#0F172A] text-white py-14 px-4 text-center overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/85 via-[#0F172A]/70 to-[#1e3a8a]/65 backdrop-blur-[1px]" />
        <div className="relative max-w-md mx-auto animate-[slideDown_280ms_cubic-bezier(0.4,0,0.2,1)_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-4 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200">
            <KeyRound className="w-3.5 h-3.5" /> Account Recovery
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recover Account Access</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-2">
            Enter your email and we&apos;ll send you a secure reset link.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-7 relative z-20 pb-14">
        <div className="bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(15,23,42,0.15)] border border-white/70 p-8 animate-[scaleIn_240ms_cubic-bezier(0.4,0,0.2,1)_60ms_both]">

          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-5 py-2">
              <SuccessCheckmark size="xl" glow={true} animated={true} />
              <div>
                <h2 className="text-lg font-bold text-[#0B1221] mb-1">Check Your Inbox</h2>
                <p className="text-sm text-[#4B5A6E]">
                  If <span className="font-semibold text-[#0369A1]">{email}</span> is linked to a student account,
                  you&apos;ll receive a password reset link shortly.
                </p>
                <p className="text-xs text-[#9CA8BA] mt-3">
                  Don&apos;t see it? Check your spam folder or{' '}
                  <button
                    onClick={() => setSent(false)}
                    className="text-[#0369A1] font-semibold hover:underline"
                  >
                    try again
                  </button>.
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                The link in the email will take you directly to the password reset page. It expires in 1 hour.
              </div>
              <Link href="/login">
                <button className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 transition-all duration-200">
                  Back to Sign In
                </button>
              </Link>
            </div>
          ) : (
            /* ── Email form ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-base font-bold text-[#0B1221]">Reset your password</h2>
                <p className="text-xs text-[#6B7A8D] mt-1">Enter the email linked to your student account.</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#0B1221] mb-1.5">
                  Student Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="student@st.ug.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 placeholder:text-[#9CA8BA]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Link…</> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-xs text-[#6B7A8D]">
          Remembered your password?{' '}
          <Link href="/login" className="font-bold text-[#0369A1] hover:underline transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
