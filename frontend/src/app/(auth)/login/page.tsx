'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import UGLogo from '@/components/shared/UGLogo';
import { useAuthStore } from '@/stores/authStore';
import viceChancellorBg from '@/Assets/Legon UG/vice chancelor.jpg';

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden">
      {/* ── High-Visibility Vice Chancellor Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src={viceChancellorBg}
          alt="University of Ghana Vice Chancellor's Building"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Crisp, transparent overlay: allows background image to be clearly seen while keeping UI pristine */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1221]/60 via-[#0F172A]/45 to-[#0B1221]/65 backdrop-blur-[0.5px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 bg-[#0B1221]/75 backdrop-blur-md border-b border-white/10 px-6 py-3.5 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" textColor="text-white" href="/" />
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
                className="px-3 py-1.5 rounded-lg text-slate-200 font-medium hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="
              px-4 py-2 rounded-xl text-xs font-bold
              bg-gradient-to-r from-blue-600 to-indigo-600 text-white
              shadow-sm hover:shadow-md hover:from-blue-500 hover:to-indigo-500
              hover:-translate-y-px
              transition-all duration-200
            "
          >
            Public Site
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 relative z-10">
        {/* Hero Title Header */}
        <div className="max-w-md w-full mx-auto text-center mb-6 animate-[fadeIn_300ms_ease_both]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 mb-3 border border-white/20 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            UG Student Portal Access
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Student Sign In
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            Enter your student credentials to manage appointments, view clinic health guides, and access medical services.
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="
            bg-white/95 backdrop-blur-xl rounded-3xl
            shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.6)]
            p-8 sm:p-9
            animate-[scaleIn_260ms_cubic-bezier(0.4,0,0.2,1)_both]
          ">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div
                  className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 space-y-1.5 animate-[slideDown_200ms_ease_both]"
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
                    w-full px-4 py-3 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221]
                    rounded-xl text-sm font-medium
                    hover:border-[#94A3B8]
                    focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15
                    transition-all duration-200
                    disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-[#F5F7FB]
                    placeholder:text-[#9CA8BA]
                  "
                  {...register('username')}
                />
                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium animate-[slideDown_150ms_ease]" role="alert">
                    {errors.username.message}
                  </p>
                )}
                <p className="mt-1.5 text-[10px] text-[#6B7A8D]">Use your UG student ID number or registered email address.</p>
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
                      w-full px-4 py-3 pr-11 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221]
                      rounded-xl text-sm font-medium
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA8BA] hover:text-[#0B1221] transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium animate-[slideDown_150ms_ease]" role="alert">
                    {errors.password.message}
                  </p>
                )}
                <p className="mt-1.5 text-[10px] text-[#6B7A8D]">Must be at least 6 characters.</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3.5 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-[#0F172A] via-[#1e3a8a] to-[#2563EB]
                  shadow-[0_4px_16px_rgba(15,23,42,0.30)]
                  hover:shadow-[0_8px_24px_rgba(30,58,138,0.40)]
                  hover:-translate-y-0.5
                  active:translate-y-0 active:scale-[0.99]
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none
                  mt-2
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

              <div className="text-center pt-3 border-t border-[#EEF1F8] text-xs text-[#6B7A8D]">
                Don&apos;t have a student clinic account yet?{' '}
                <Link href="/register" className="font-bold text-[#0369A1] hover:underline hover:text-[#0284C7] transition-colors">
                  Create Account
                </Link>
              </div>
            </form>
          </div>

          {/* Staff portal link */}
          <div className="mt-6 text-center">
            <Link
              href="/staff-portal-access"
              className="
                inline-flex items-center gap-2 text-xs font-semibold text-white
                bg-[#0B1221]/75 hover:bg-[#0B1221]/90
                border border-white/25 hover:border-white/45
                backdrop-blur-md rounded-full px-5 py-2.5
                shadow-md hover:shadow-xl
                hover:-translate-y-px
                transition-all duration-200
              "
            >
              <Lock className="w-3.5 h-3.5 text-blue-300" />
              Are you a Clinic Staff Member?&nbsp;
              <span className="text-blue-300 font-bold underline">Staff Portal Sign In</span>
            </Link>
          </div>
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