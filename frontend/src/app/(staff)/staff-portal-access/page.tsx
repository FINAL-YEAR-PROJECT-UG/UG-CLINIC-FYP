'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldAlert, Lock, ArrowLeft, KeyRound, CheckCircle2 } from '@/components/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import UGLogo from '@/components/shared/UGLogo';
import Image from 'next/image';
import viceChancellorBg from '@/Assets/Legon UG/vice chancelor.jpg';

const staffLoginSchema = z.object({
  email: z.string().email('Please enter a valid staff email address'),
  password: z.string().min(6, 'Password is required'),
});

type StaffLoginFormData = z.infer<typeof staffLoginSchema>;

export default function StaffPortalAccessPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { user, isAuthenticated } = useAuthStore.getState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    const currentState = useAuthStore.getState();
    const currentUser = currentState.user;
    const currentIsAuth = currentState.isAuthenticated;
    const currentRole = currentUser?.role?.toUpperCase?.() ?? currentUser?.role ?? '';
    if (currentIsAuth && currentUser && ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(currentRole)) {
      router.replace('/staff/overview');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffLoginFormData>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: {
      email: 'emmanueloteng.k@gmail.com',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: StaffLoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/staff/login', {
        email: data.email.trim(),
        password: data.password,
      });

      if (response.data.success) {
        const { user, tokens, requires2FA: require2FAVal } = response.data.data;
        const require2FA = require2FAVal ?? response.data.requires2FA ?? false;

        if (require2FA) {
          const otpEmail = response.data.data?.email ?? data.email.trim();
          sessionStorage.setItem('otpEmail', otpEmail);
          const devCode = response.data.data?.devCode;
          if (devCode) {
            sessionStorage.setItem('staffOtpDevCode', devCode);
          } else {
            sessionStorage.removeItem('staffOtpDevCode');
          }
          setMfaRequired(true);
          router.push(`/verify-otp?email=${encodeURIComponent(otpEmail)}&role=staff`);
          return;
        }

        const normalizedUserRole = user?.role?.toUpperCase?.() ?? user?.role ?? '';
        if (user && ['RECEPTIONIST', 'ADMIN'].includes(normalizedUserRole)) {
          setAuth(user, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          router.push('/staff/overview');
        } else {
          setError('Access denied: Only Receptionist and Admin credentials are authorized to sign in.');
        }
      } else {
        setError(response.data.message || 'Staff authentication failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid staff credentials or unauthorized access attempt.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* ── High-Security Administrative Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src={viceChancellorBg}
          alt="University of Ghana Vice Chancellor's Building"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/88 via-slate-900/80 to-slate-950/92 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 bg-slate-950/75 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" textColor="text-white" href="/" />

          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Student Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-slate-900/85 border border-slate-700/60 rounded-3xl p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl relative z-10 animate-[scaleIn_260ms_cubic-bezier(0.4,0,0.2,1)_both]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-500/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Restricted Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">Staff & Admin Portal</h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Secured portal for clinic receptionists, doctors, and administrators to manage health operations.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email Address *
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="staff@ug.edu.gh"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Password *
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Clearance...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Sign In to Staff Control Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center text-[11px] text-slate-400 space-y-1">
            <p className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Protected by 2FA & Session Security Logs
            </p>
            <p>Authorized University of Ghana Health Services personnel only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
