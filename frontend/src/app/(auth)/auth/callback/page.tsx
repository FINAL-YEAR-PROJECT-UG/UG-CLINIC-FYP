'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getSafeRedirectUrl } from '@/lib/authUrl';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AuthBrand from '@/components/shared/AuthBrand';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Verifying your email confirmation...');

  useEffect(() => {
    let isCancelled = false;

    async function processAuth() {
      try {
        const nextParam = searchParams?.get('next');
        const targetPath = getSafeRedirectUrl(nextParam, '/dashboard');

        // 1. Check for query parameter errors
        const queryError = searchParams?.get('error');
        const queryErrorDesc = searchParams?.get('error_description');
        if (queryError || queryErrorDesc) {
          const message = queryErrorDesc || queryError || 'Confirmation failed.';
          if (!isCancelled) {
            setErrorMessage(message);
          }
          return;
        }

        // 2. Check for hash fragment errors (from Supabase verify redirects)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (hash) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const hashError = hashParams.get('error_description') || hashParams.get('error');
          if (hashError) {
            // Clean sensitive fragment from URL and history immediately
            window.history.replaceState(null, '', window.location.pathname);
            if (!isCancelled) {
              setErrorMessage(hashError);
            }
            return;
          }
        }

        const supabase = createClient();

        // 3. Client-side Implicit Flow (Tokens delivered in URL hash fragment)
        if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          // Strip tokens from browser address bar and history immediately — never leave tokens visible
          window.history.replaceState(null, '', window.location.pathname);

          if (accessToken && refreshToken) {
            setStatusMessage('Email confirmed! Establishing your secure session...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              if (!isCancelled) {
                setErrorMessage(sessionError.message);
              }
              return;
            }

            const { data: userData } = await supabase.auth.getUser();
            const verifiedUser = userData?.user;
            if (verifiedUser) {
              useAuthStore.getState().setAuth({
                id: verifiedUser.id,
                email: verifiedUser.email || '',
                firstName: verifiedUser.user_metadata?.firstName || 'Student',
                lastName: verifiedUser.user_metadata?.lastName || '',
                studentId: verifiedUser.user_metadata?.studentId,
                phone: verifiedUser.user_metadata?.phone,
                program: verifiedUser.user_metadata?.program,
                role: verifiedUser.user_metadata?.role || 'STUDENT',
                isActive: true,
              });
            }

            if (!isCancelled) {
              setStatusMessage('Email verified successfully! Preparing your account...');
              const destination = targetPath !== '/dashboard' ? targetPath : '/login?confirmed=true';
              setTimeout(() => {
                if (!isCancelled) router.replace(destination);
              }, 1200);
            }
            return;
          }
        }

        // 4. SSR / PKCE Flow (Authorization code delivered in query parameter)
        const code = searchParams?.get('code');
        if (code) {
          setStatusMessage('Exchanging confirmation code...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          // Clean query code from URL immediately
          window.history.replaceState(null, '', window.location.pathname);

          if (exchangeError) {
            if (!isCancelled) {
              setErrorMessage(exchangeError.message);
            }
            return;
          }

          const { data: userData } = await supabase.auth.getUser();
          const verifiedUser = userData?.user;
          if (verifiedUser) {
            useAuthStore.getState().setAuth({
              id: verifiedUser.id,
              email: verifiedUser.email || '',
              firstName: verifiedUser.user_metadata?.firstName || 'Student',
              lastName: verifiedUser.user_metadata?.lastName || '',
              studentId: verifiedUser.user_metadata?.studentId,
              phone: verifiedUser.user_metadata?.phone,
              program: verifiedUser.user_metadata?.program,
              role: verifiedUser.user_metadata?.role || 'STUDENT',
              isActive: true,
            });
          }

          if (!isCancelled) {
            setStatusMessage('Email verified successfully! Preparing your account...');
            const destination = targetPath !== '/dashboard' ? targetPath : '/login?confirmed=true';
            setTimeout(() => {
              if (!isCancelled) router.replace(destination);
            }, 1200);
          }
          return;
        }

        // 5. Check if user already has an active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!isCancelled) {
            router.replace(targetPath);
          }
          return;
        }

        // 6. No credentials found in URL or storage — send to login
        if (!isCancelled) {
          router.replace('/login');
        }
      } catch (err) {
        if (!isCancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'An unexpected error occurred during confirmation.'
          );
        }
      }
    }

    void processAuth();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#0B1221] flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md text-center text-white shadow-2xl">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xl">
            ✕
          </div>
          <h2 className="text-xl font-bold mb-2">Confirmation Issue</h2>
          <p className="text-sm text-gray-300 mb-6">{errorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Go to Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors"
            >
              Register Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1221] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md text-center text-white shadow-2xl">
        <div className="mb-6 flex justify-center">
          <AuthBrand />
        </div>
        <LoadingSpinner size={48} className="mx-auto mb-4 text-emerald-400" />
        <h2 className="text-lg font-semibold mb-2">Account Verification</h2>
        <p className="text-sm text-gray-300">{statusMessage}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1221] flex justify-center items-center">
          <LoadingSpinner size={48} className="text-emerald-400" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
