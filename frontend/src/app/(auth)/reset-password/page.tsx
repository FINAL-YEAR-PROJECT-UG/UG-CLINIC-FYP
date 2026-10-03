'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from '@/components/icons';
import UGLogo from '@/components/shared/UGLogo';
import Toast from '@/components/shared/Toast';

// ─── Password strength helper ──────────────────────────────────────────────
const passwordRequirements = [
  { label: 'At least 8 characters',    test: (pwd: string) => pwd.length >= 8 },
  { label: 'One uppercase letter',      test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter',      test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: 'One number',               test: (pwd: string) => /[0-9]/.test(pwd) },
  { label: 'One special character',    test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg]   = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [success, setSuccess]     = useState(false);
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  // null = checking, true = valid session, false = no session/expired
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Supabase delivers the recovery token as a hash fragment. We need to
  // wait for the client-side auth state to pick it up.
  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires immediately with the current session, including
    // when the user follows a recovery link (event = 'PASSWORD_RECOVERY').
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      } else {
        // Give it a short moment in case the hash is still being processed
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          setHasSession(!!data.session);
        }, 800);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setToastType('error');
      setToastMsg('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastType('error');
      setToastMsg('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setToastMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('[ResetPassword] updateUser error:', error.message);
        setToastType('error');
        setToastMsg('Could not update password. The link may have expired — please request a new one.');
      } else {
        setSuccess(true);
        setToastType('success');
        setToastMsg('Password updated successfully!');
        setTimeout(() => router.replace('/login'), 2000);
      }
    } catch (err) {
      console.error('[ResetPassword]', err);
      setToastType('error');
      setToastMsg('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared page shell ──────────────────────────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <Toast message={toastMsg} type={toastType} onDismiss={() => setToastMsg(null)} />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.08)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-[#4B5A6E] hover:text-[#0369A1] px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
          >
            ← Back to Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative bg-[#0F172A] text-white py-12 px-4 text-center overflow-hidden">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/ug-video.mp4" type="video/mp4" />
          <source src="/UG video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/85 via-[#0F172A]/70 to-[#1e3a8a]/65 backdrop-blur-[1px]" />
        <div className="relative max-w-md mx-auto animate-[slideDown_280ms_cubic-bezier(0.4,0,0.2,1)_both]">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Set New Password</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-2">
            Choose a strong password for your student account.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-6 relative z-10 pb-14">
        <div className="bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(15,23,42,0.15)] border border-white/70 p-8 animate-[scaleIn_240ms_cubic-bezier(0.4,0,0.2,1)_60ms_both]">
          {children}
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

  // ── Loading: checking for session ──────────────────────────────────────────
  if (hasSession === null) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#0369A1]" />
          <p className="text-sm text-[#6B7A8D]">Verifying your reset link…</p>
        </div>
      </Shell>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Shell>
        <div className="text-center space-y-4 py-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#0B1221]">Password Updated!</h2>
          <p className="text-sm text-[#4B5A6E]">
            Your password has been changed. Redirecting you to sign in…
          </p>
          <Link href="/login" className="block">
            <button className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 transition-all duration-200">
              Go to Sign In
            </button>
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Expired / no session state ─────────────────────────────────────────────
  if (hasSession === false) {
    return (
      <Shell>
        <div className="text-center space-y-4 py-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-9 w-9 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#0B1221]">Link Expired</h2>
          <p className="text-sm text-[#4B5A6E]">
            This reset link has expired or already been used. Please request a new one.
          </p>
          <Link href="/forgot-password" className="block">
            <button className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 transition-all duration-200">
              Request New Reset Link
            </button>
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <Shell>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-xs font-bold text-[#0B1221] mb-1.5">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-11 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm font-medium hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed placeholder:text-[#9CA8BA]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#0B1221] transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password requirements */}
          {newPassword && (
            <ul className="mt-2 space-y-1">
              {passwordRequirements.map((req) => (
                <li key={req.label} className={`flex items-center gap-1.5 text-[10px] font-medium ${req.test(newPassword) ? 'text-emerald-600' : 'text-[#9CA8BA]'}`}>
                  <CheckCircle2 className={`w-3 h-3 shrink-0 ${req.test(newPassword) ? 'text-emerald-500' : 'text-gray-300'}`} />
                  {req.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#0B1221] mb-1.5">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-11 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm font-medium hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed placeholder:text-[#9CA8BA]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#0B1221] transition-colors p-1"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1.5 text-[10px] font-semibold text-red-500">Passwords do not match</p>
          )}
          {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
            <p className="mt-1.5 text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving Password…</>
          ) : (
            <><ShieldCheck className="w-4 h-4" /> Set New Password</>
          )}
        </button>
      </form>
    </Shell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
