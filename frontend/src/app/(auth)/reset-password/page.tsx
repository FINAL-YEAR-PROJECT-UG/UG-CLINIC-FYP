'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from '@/components/icons';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import UGLogo from '@/components/shared/UGLogo';
import Toast from '@/components/shared/Toast';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Password strength helper ──────────────────────────────────────────────
const passwordRequirements = [
  { label: 'At least 8 characters',    test: (pwd: string) => pwd.length >= 8 },
  { label: 'One uppercase letter',      test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter',      test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: 'One number',               test: (pwd: string) => /[0-9]/.test(pwd) },
  { label: 'One special character',    test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg]   = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken]        = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!token) {
      setToastMsg('Invalid or missing reset link. Please request a new one.');
      setIsValidToken(false);
    } else {
      setIsValidToken(true);
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setToastMsg('Invalid reset link. Please request a new one.');
      return;
    }
    setIsLoading(true);
    setToastMsg(null);
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setSuccess(true);
    } catch (err) {
      setToastMsg(getErrorMessage(err, 'Could not reset password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared page shell ──────────────────────────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col bg-[#0B1221]">
      <Toast message={toastMsg} type="error" onDismiss={() => setToastMsg(null)} />

      {/* Header */}
      <header className="bg-[#0B1221]/80 backdrop-blur-md border-b border-white/10 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" textColor="text-white" href="/" />
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            ← Back to Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative bg-[#0F172A] text-white py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/75 to-[#1e3a8a]/50" />
        <div className="relative max-w-md mx-auto animate-[slideDown_280ms_cubic-bezier(0.4,0,0.2,1)_both]">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reset Your Password</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-2">
            Set a new secure password for your student account.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-6 relative z-10 pb-14">
        <div className="bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(15,23,42,0.4)] border border-white/70 p-8 animate-[scaleIn_240ms_cubic-bezier(0.4,0,0.2,1)_60ms_both]">
          {children}
        </div>
        <p className="text-center mt-5 text-xs text-slate-400">
          Remembered your password?{' '}
          <Link href="/login" className="font-bold text-[#0369A1] hover:underline transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Shell>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#0B1221]">Password Reset Successful</h2>
          <p className="text-sm text-[#4B5A6E]">
            Your password has been updated. You can now sign in with your new password.
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

  // ── Invalid token state ────────────────────────────────────────────────────
  if (isValidToken === false) {
    return (
      <Shell>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-9 w-9 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#0B1221]">Invalid Reset Link</h2>
          <p className="text-sm text-[#4B5A6E]">
            This link is invalid or has expired. Please request a new password reset.
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {...register('newPassword')}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-11 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm font-medium hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed placeholder:text-[#9CA8BA]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#0B1221] transition-colors p-1"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1.5 text-xs text-red-600 font-medium animate-[slideDown_150ms_ease]" role="alert">
              {errors.newPassword.message}
            </p>
          )}

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
              {...register('confirmPassword')}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-11 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm font-medium hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed placeholder:text-[#9CA8BA]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#0B1221] transition-colors p-1"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600 font-medium animate-[slideDown_150ms_ease]" role="alert">
              {errors.confirmPassword.message}
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
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting Password…
            </>
          ) : (
            'Reset Password'
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
