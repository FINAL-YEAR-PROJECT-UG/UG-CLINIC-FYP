'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from '@/components/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import UGLogo from '@/components/shared/UGLogo';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Please enter your student ID or email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    const roleParam = searchParams?.get('role')?.toLowerCase?.();
    if (roleParam === 'staff' || roleParam === 'admin' || roleParam === 'doctor' || roleParam === 'receptionist') {
      router.replace('/staff-portal-access');
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'student@st.ug.edu.gh',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', {
        username: data.username.trim(),
        password: data.password,
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;
        const normalizedUserRole = user?.role?.toUpperCase?.() ?? user?.role ?? '';

        if (user && normalizedUserRole === 'STUDENT') {
          setAuth(user, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          router.replace('/dashboard');
        } else {
          setError('Access denied. This login is for students only.');
        }
      } else {
        setError(response.data.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.08)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/" />
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Services', href: '/services' },
              { label: 'Resources', href: '/resources' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-lg text-[#4B5A6E] font-medium hover:text-[#0369A1] hover:bg-blue-50/60 transition-all duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="
              px-4 py-2 rounded-xl text-xs font-bold
              bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white
              shadow-[0_2px_8px_rgba(15,23,42,0.22)]
              hover:shadow-[0_5px_18px_rgba(30,58,138,0.35)]
              hover:-translate-y-px
              transition-all duration-200
            "
          >
            Book Appointment
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-[#0F172A] via-[#0369A1] to-[#0F172A] text-white py-16 px-4 text-center overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto animate-[slideDown_280ms_cubic-bezier(0.4,0,0.2,1)_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 mb-4 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            UG Student Portal Access
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Student Sign In</h1>
          <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
            Enter your student credentials to manage appointments, view clinic health guides, and access medical services.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-8 relative z-20 pb-14">
        <div className="
          bg-white rounded-2xl
          shadow-[0_16px_48px_-8px_rgba(15,23,42,0.15),0_4px_12px_-4px_rgba(15,23,42,0.06)]
          border border-white/70
          p-8
          animate-[scaleIn_260ms_cubic-bezier(0.4,0,0.2,1)_80ms_both]
        ">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 space-y-1.5 animate-[slideDown_200ms_ease_both]"
                role="alert"
              >
                <p>{error}</p>
                {error.includes('Staff members') && (
                  <Link
                    href="/staff-portal-access"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0369A1] hover:underline"
                  >
                    Go to Secured Staff Access Portal <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-[#0B1221] mb-1.5">
                Student ID or Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. 10928374 or student@st.ug.edu.gh"
                disabled={isLoading}
                className="
                  w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221]
                  rounded-xl text-sm
                  hover:border-[#94A3B8]
                  focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15
                  transition-all duration-200
                  disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-[#F5F7FB]
                  placeholder:text-[#9CA8BA]
                "
                {...register('username')}
              />
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-600 animate-[slideDown_150ms_ease]" role="alert">
                  {errors.username.message}
                </p>
              )}
              <p className="mt-1.5 text-[10px] text-[#9CA8BA]">Use your UG student ID number or registered email address.</p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-bold text-[#0B1221]">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#0369A1] hover:text-[#0284C7] transition-colors hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="
                    w-full px-3.5 py-2.5 pr-10 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221]
                    rounded-xl text-sm
                    hover:border-[#94A3B8]
                    focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15
                    transition-all duration-200
                    disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-[#F5F7FB]
                    placeholder:text-[#9CA8BA]
                  "
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#4B5A6E] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 animate-[slideDown_150ms_ease]" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1.5 text-[10px] text-[#9CA8BA]">Must be at least 6 characters.</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-[#0F172A] to-[#1e3a8a]
                shadow-[0_4px_14px_rgba(15,23,42,0.30)]
                hover:shadow-[0_8px_24px_rgba(30,58,138,0.38)]
                hover:from-[#1e3a8a] hover:to-[#2563EB]
                hover:-translate-y-0.5
                active:translate-y-0 active:scale-[0.98]
                transition-all duration-200
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Sign In to Student Portal'
              )}
            </button>

            <div className="text-center pt-2 border-t border-[#EEF1F8] text-xs text-[#6B7A8D]">
              Don't have a student clinic account yet?{' '}
              <Link href="/register" className="font-bold text-[#0369A1] hover:underline hover:text-[#0284C7] transition-colors">
                Create Account
              </Link>
            </div>
          </form>
        </div>

        {/* Staff portal link */}
        <div className="mt-5 text-center">
          <Link
            href="/staff-portal-access"
            className="
              inline-flex items-center gap-2 text-xs font-semibold text-[#4B5A6E]
              bg-white/90 hover:bg-white
              border border-[#DDE3EE] hover:border-[#94A3B8]
              rounded-full px-5 py-2.5
              shadow-sm hover:shadow-md
              hover:-translate-y-px
              transition-all duration-200
            "
          >
            <Lock className="w-3.5 h-3.5 text-[#0F172A]" />
            Are you a Clinic Staff Member?&nbsp;
            <span className="text-[#0369A1] font-bold">Staff Portal Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0369A1]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}