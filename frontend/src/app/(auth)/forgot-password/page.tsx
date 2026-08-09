'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import UGLogo from '@/components/shared/UGLogo';
import { KeyRound, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck } from '@/components/icons';

// ─── Password strength checker ─────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a–z)', pass: /[a-z]/.test(password) },
    { label: 'One number (0–9)', pass: /[0-9]/.test(password) },
    { label: 'One special character (!@#$…)', pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const strengthColor =
    passed <= 1 ? 'bg-red-400' : passed <= 3 ? 'bg-amber-400' : 'bg-emerald-500';
  const strengthLabel =
    passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : passed === 4 ? 'Good' : 'Strong';

  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${strengthColor}`}
            style={{ width: `${(passed / 5) * 100}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold ${passed <= 1 ? 'text-red-500' : passed <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
          {strengthLabel}
        </span>
      </div>
      {/* Checks */}
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-[10px] font-medium ${c.pass ? 'text-emerald-600' : 'text-gray-400'}`}>
            <CheckCircle2 className={`w-3 h-3 shrink-0 ${c.pass ? 'text-emerald-500' : 'text-gray-300'}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(true);
  const [showConfirmPw, setShowConfirmPw] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1
  const handleIdentifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email or Student ID.'); return; }
    try {
      setIsLoading(true); setError(null);
      await api.post('/auth/send-otp', { email: email.trim(), type: 'PASSWORD_RESET' });
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not locate account. Please verify your details.'));
    } finally { setIsLoading(false); }
  };

  // Step 2
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    try {
      setIsLoading(true); setError(null);
      await api.post('/auth/verify-otp', { email: email.trim(), code: otpCode.trim() });
      setSuccessMsg('Verification successful! Set your new password below.');
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally { setIsLoading(false); }
  };

  // Step 3
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    try {
      setIsLoading(true); setError(null);
      await api.post('/auth/reset-password-otp', {
        email: email.trim(),
        code: otpCode.trim(),
        newPassword,
      });
      setSuccessMsg('Password reset successful! Redirecting to sign in…');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally { setIsLoading(false); }
  };

  const STEPS = ['Account', 'Verify Code', 'New Password'];

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      {/* Header with back nav */}
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
      <div className="relative bg-gradient-to-br from-[#0F172A] via-[#0369A1] to-[#0F172A] text-white py-14 px-4 text-center overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative max-w-md mx-auto animate-[slideDown_280ms_cubic-bezier(0.4,0,0.2,1)_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-4 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-blue-200">
            <KeyRound className="w-3.5 h-3.5" /> Account Recovery
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recover Account Access</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-2">
            Follow the 3-step security process to reset your student password.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-7 relative z-20 pb-14">
        <div className="bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(15,23,42,0.15)] border border-white/70 p-8 animate-[scaleIn_240ms_cubic-bezier(0.4,0,0.2,1)_60ms_both]">

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6 pb-5 border-b border-gray-100">
            {STEPS.map((label, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <div key={label} className="flex items-center gap-1.5 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 transition-all duration-300 ${
                    done ? 'bg-emerald-500 text-white' :
                    active ? 'bg-[#0369A1] text-white ring-4 ring-[#0369A1]/20' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx}
                  </div>
                  <span className={`text-[10px] font-bold truncate ${
                    active ? 'text-[#0369A1]' : done ? 'text-emerald-600' : 'text-gray-400'
                  }`}>{label}</span>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 animate-[slideDown_200ms_ease]" role="alert">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-1.5" role="status">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleIdentifyAccount} className="space-y-4">
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
                <p className="mt-1.5 text-[10px] text-[#9CA8BA]">Enter the email address linked to your student account.</p>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Code…</> : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="block text-xs font-bold text-[#0B1221] mb-1.5">
                  6-Digit Verification Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="_ _ _ _ _ _"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-3 border-[1.5px] border-[#DDE3EE] bg-white text-center text-2xl font-mono tracking-[0.5em] text-[#0369A1] rounded-xl hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200"
                />
                <p className="mt-1.5 text-[10px] text-[#9CA8BA]">Check your email inbox — the code is valid for 10 minutes.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); setSuccessMsg(null); }}
                  className="px-4 py-3 rounded-xl font-bold text-xs border-[1.5px] border-[#DDE3EE] text-[#4B5A6E] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] shadow-[0_4px_14px_rgba(15,23,42,0.28)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.36)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-[#0B1221] mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 placeholder:text-[#9CA8BA]"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#4B5A6E] transition-colors" tabIndex={-1}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#0B1221] mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 placeholder:text-[#9CA8BA]"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#4B5A6E] transition-colors" tabIndex={-1}>
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <p className="mt-1.5 text-[10px] text-[#9CA8BA]">Re-enter your new password to confirm it.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-700 to-emerald-500 shadow-[0_4px_14px_rgba(5,150,105,0.30)] hover:shadow-[0_8px_24px_rgba(5,150,105,0.40)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving Password…</> : <><ShieldCheck className="w-4 h-4" /> Save New Password &amp; Sign In</>}
              </button>
            </form>
          )}
        </div>

        {/* Back to login link */}
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
