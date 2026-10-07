'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldAlert, Lock, ArrowLeft, KeyRound, CheckCircle2, AlertTriangle } from '@/components/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { evictSessionTokenCache } from '@/lib/api';
import UGLogo from '@/components/shared/UGLogo';
import Image from 'next/image';
import viceChancellorBg from '@/Assets/Legon UG/vice chancelor.jpg';
import { createClient } from '@/utils/supabase/client';

const staffLoginSchema = z.object({
  email: z.string().email('Please enter a valid staff email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type StaffLoginFormData = z.infer<typeof staffLoginSchema>;

const ALLOWED_STAFF_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] as const;

// ─── Inner component ─────────────────────────────────────────────────────────
// useSearchParams() MUST be in a component wrapped by <Suspense>.
// Next.js will throw a prerender error if it is called in the default export directly.

function StaffPortalAccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Read query params
  // Note: useSearchParams() is typed as possibly null by Next.js; optional-chain to satisfy TS.
  const unauthorizedError = searchParams?.get('error') === 'unauthorized';
  const redirectParam = searchParams?.get('redirect') ?? null;

  // Redirect if already authenticated as staff
  useEffect(() => {
    const { user, isAuthenticated } = useAuthStore.getState();
    const role = user?.role?.toUpperCase?.() ?? '';
    if (isAuthenticated && user && ALLOWED_STAFF_ROLES.includes(role as typeof ALLOWED_STAFF_ROLES[number])) {
      router.replace('/staff/overview');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StaffLoginFormData>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Defeat browser credential manager autofill ──────────────────────────────
  // Chrome ignores autoComplete="off" / "new-password" and fills saved passwords.
  // We force-clear both fields twice: at 50 ms (fast autofill) and 300 ms (slow).
  useEffect(() => {
    const clear = () => {
      setValue('email', '', { shouldValidate: false, shouldDirty: false });
      setValue('password', '', { shouldValidate: false, shouldDirty: false });
    };
    const t1 = setTimeout(clear, 50);
    const t2 = setTimeout(clear, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [setValue]);

  const onSubmit = async (data: StaffLoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const email = data.email.trim().toLowerCase();
      const password = data.password;

      // ONLY signin method: Supabase Auth email/password
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message || 'Invalid email or password.');
        return;
      }
      evictSessionTokenCache();

      const user = authData.user;
      const session = authData.session;

      // POST to /api/auth/staff-role to get server-verified role from app_metadata.
      // Pass the access token in the Authorization header — do NOT rely on cookies
      // being flushed to the browser in time (race condition after signInWithPassword).
      let verifiedRole: string | null = null;
      let verifiedFirstName: string | null = null;
      let verifiedLastName: string | null = null;
      let verifiedEmail: string | null = null;

      try {
        const roleRes = await fetch('/api/auth/staff-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          credentials: 'include',
        });
        const roleData = await roleRes.json();
        if (roleRes.ok && roleData.success) {
          verifiedRole = String(roleData.role || '').toUpperCase();
          verifiedFirstName = roleData.firstName ?? null;
          verifiedLastName = roleData.lastName ?? null;
          verifiedEmail = roleData.email ?? null;
        } else if (roleRes.status === 403 || roleRes.status === 401) {
          // Server confirmed: not a staff account — sign out and deny
          await supabase.auth.signOut();
          setError('Access denied: This account is not authorized as clinic staff (Admin, Doctor, Receptionist).');
          return;
        }
        // Any other non-OK status: fall through to app_metadata fallback below
      } catch {
        // Network/server error — fall back to app_metadata from the signin token
      }

      // Use server-verified role; fall back to app_metadata from signin token
      const appRole = (user.app_metadata?.role as string | undefined)?.toUpperCase();
      const finalRole = verifiedRole ?? appRole ?? null;

      if (!finalRole || !ALLOWED_STAFF_ROLES.includes(finalRole as typeof ALLOWED_STAFF_ROLES[number])) {
        await supabase.auth.signOut();
        setError('Access denied: This account is not authorized as clinic staff (Admin, Doctor, Receptionist).');
        return;
      }

      const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) {
        setError(`Could not check your two-factor settings: ${factorError.message}`);
        return;
      }
      const verifiedFactor = factorData.totp.find((factor) => factor.status === 'verified');
      if (verifiedFactor) {
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: verifiedFactor.id,
        });
        if (challengeError) {
          setError(`Could not send a verification challenge: ${challengeError.message}`);
          return;
        }
        const params = new URLSearchParams({
          role: 'staff',
          email: verifiedEmail ?? user.email ?? email,
          mfa: 'supabase',
          factorId: verifiedFactor.id,
          challengeId: challenge.id,
        });
        router.replace(`/verify-otp?${params.toString()}`);
        return;
      }

      // Set auth store with canonical identity shape
      evictSessionTokenCache();
      setAuth({
        id: user.id,
        email: verifiedEmail ?? user.email ?? email,
        firstName: verifiedFirstName ?? (user.user_metadata?.firstName as string | undefined) ?? 'Staff',
        lastName: verifiedLastName ?? (user.user_metadata?.lastName as string | undefined) ?? '',
        phone: user.user_metadata?.phone as string | undefined,
        role: finalRole,
        isActive: true,
      });

      // Navigate: honor redirect param if it's a safe internal path
      if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
        router.replace(redirectParam);
      } else {
        router.push('/staff/overview');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Staff authentication failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src={viceChancellorBg}
          alt="University of Ghana Vice Chancellor's Building"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 opacity-25"
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
        <div className="w-full max-w-md bg-slate-900/85 border border-slate-700/60 rounded-3xl p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-500/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Restricted Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">Staff &amp; Admin Portal</h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Secured portal for clinic receptionists, doctors, and administrators.
            </p>
          </div>

          {/* Unauthorized banner */}
          {unauthorizedError && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Access denied: only clinic staff (Admin, Doctor, Receptionist) can access the staff portal.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
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
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                placeholder="Enter your staff email"
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
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
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
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Session bound to secure Supabase Auth session (no Railway backend on Vercel).
            </p>
            <p>Authorized University of Ghana Health Services personnel only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton shown while Suspense resolves ───────────────────────────────────

function StaffPortalSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
    </div>
  );
}

// ─── Default export: Suspense shell ──────────────────────────────────────────
// Next.js requires any component calling useSearchParams() to be wrapped
// in <Suspense> — without this the static prerender will fail at build time.

export default function StaffPortalAccessPage() {
  return (
    <Suspense fallback={<StaffPortalSkeleton />}>
      <StaffPortalAccessInner />
    </Suspense>
  );
}
