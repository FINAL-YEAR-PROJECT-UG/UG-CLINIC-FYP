'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Universal Header with Logo */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/" />

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#334155]">
              <Link href="/" className="hover:text-[#0369A1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded">Home</Link>
              <Link href="/about" className="hover:text-[#0369A1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded">About</Link>
              <Link href="/services" className="hover:text-[#0369A1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded">Services</Link>
              <Link href="/resources" className="hover:text-[#0369A1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded">Resources</Link>
              <Link href="/contact" className="hover:text-[#0369A1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded">Contact</Link>
            </nav>

            <Link
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-[#0369A1] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#0369A1] to-[#0F172A] text-white py-14 px-4 text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            UG Student Portal Access
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Student Sign In</h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Enter your student credentials to manage appointments, view clinic health guides, and access medical services.
          </p>
        </div>
      </div>

      {/* Main Login Form Container */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -mt-8 relative z-20 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 space-y-2" role="alert">
                <p>{error}</p>
                {error.includes('Staff members') && (
                  <Link
                    href="/staff-portal-access"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0369A1] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded"
                  >
                    Go to Secured Staff Access Portal <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-[#020617] mb-1.5">
                Student ID or Email Address *
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. 10928374 or student@st.ug.edu.gh"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] bg-white text-[#020617] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:border-transparent transition-all"
                {...register('username')}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600" role="alert">{errors.username.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-[#020617]">Password *</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#0369A1] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] bg-white text-[#020617] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:border-transparent transition-all"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600" role="alert">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0F172A] text-white rounded-xl font-bold text-sm hover:bg-[#0369A1] focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Student Portal'
              )}
            </button>

            <div className="text-center pt-2 border-t border-[#E2E8F0] text-xs text-[#334155]">
              Don't have a student clinic account yet?{' '}
              <Link href="/register" className="font-bold text-[#0369A1] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 rounded">
                Create Account
              </Link>
            </div>
          </form>
        </div>

        {/* Secured Staff Portal Link Badge */}
        <div className="mt-6 text-center">
          <Link
            href="/staff-portal-access"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] bg-white/80 hover:bg-white border border-[#E2E8F0] rounded-full px-4 py-2 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2"
          >
            <Lock className="w-3.5 h-3.5 text-[#0F172A]" />
            Are you a Clinic Staff Member or Admin? <span className="text-[#0369A1] font-bold underline">Staff Portal Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#0369A1]" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}