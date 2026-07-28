'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import UGLogo from '@/components/shared/UGLogo';
import { KeyRound, ShieldCheck, ArrowLeft, CheckCircle2, Lock, Loader2, Sparkles } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: Send OTP for password recovery
  const handleIdentifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email or Student ID.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/send-otp', {
        email: email.trim(),
        type: 'PASSWORD_RESET',
      });
      setSuccessMsg('A 6-digit verification code has been generated for your account.');
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not locate account. Please verify your details.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/verify-otp', {
        email: email.trim(),
        code: otpCode.trim(),
      });
      setSuccessMsg('Verification successful! You can now set a new password.');
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/reset-password-otp', {
        email: email.trim(),
        code: otpCode.trim(),
        newPassword,
      });
      setSuccessMsg('Password reset successful! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-[#0369A1] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded"
            aria-label="Back to Sign In"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#0369A1] to-[#0F172A] text-white py-12 px-4 text-center">
        <div className="max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 mb-2">
            <KeyRound className="w-3.5 h-3.5" /> UG Clinic Account Recovery Wizard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recover Account Access</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Follow the 3-step security verification process to reset your student password.
          </p>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-6 relative z-20 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-6 text-xs font-bold text-[#334155]">
            <span className={step === 1 ? 'text-[#0369A1]' : 'text-emerald-600'}>1. Account</span>
            <span>→</span>
            <span className={step === 2 ? 'text-[#0369A1]' : step > 2 ? 'text-emerald-600' : ''}>2. Verification</span>
            <span>→</span>
            <span className={step === 3 ? 'text-[#0369A1]' : ''}>3. Reset</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700" role="alert">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-1.5" role="status">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* STEP 1: IDENTIFY ACCOUNT */}
          {step === 1 && (
            <form onSubmit={handleIdentifyAccount} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase text-[#020617] mb-1.5">
                  Student Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="student@st.ug.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] bg-white text-[#020617] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0F172A] text-white font-bold text-sm rounded-xl hover:bg-[#0369A1] transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="block text-xs font-bold uppercase text-[#020617] mb-1.5">
                  Enter 6-Digit OTP Verification Code *
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3.5 py-3 border border-[#E2E8F0] bg-white text-center text-xl font-mono tracking-widest text-[#0369A1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0F172A] text-white font-bold text-sm rounded-xl hover:bg-[#0369A1] transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify OTP Code'}
              </button>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold uppercase text-[#020617] mb-1.5">
                  New Password *
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] bg-white text-[#020617] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase text-[#020617] mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] bg-white text-[#020617] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save New Password & Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
