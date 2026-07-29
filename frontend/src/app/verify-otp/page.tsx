'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UGLogo from '@/components/shared/UGLogo';
import { Mail, Loader2, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [roleParam, setRoleParam] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [deliveryHint, setDeliveryHint] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(600);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const emailFromQuery = params.get('email');
    const roleFromQuery = params.get('role');
    const storedEmail = sessionStorage.getItem('otpEmail');
    const resolvedEmail = emailFromQuery || storedEmail || '';

    setEmail(resolvedEmail || 'your registered account');
    setRoleParam(roleFromQuery || '');

    const storedDevCode = sessionStorage.getItem('staffOtpDevCode');
    if (storedDevCode && roleFromQuery === 'staff') {
      setDevCodeHint(storedDevCode);
    }
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');
    if (char && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => (next[i] = c));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (roleParam !== 'staff' || !email || email === 'your registered account') {
      setError('Cannot resend code without a staff email. Return to sign in.');
      return;
    }
    try {
      setResending(true);
      setError('');
      const response = await api.post('/staff/resend-2fa', { email });
      if (response.data.success) {
        setSecondsLeft(600);
        setSuccessMsg('A new verification code has been sent.');
        const devCode = response.data.data?.devCode;
        if (devCode) {
          sessionStorage.setItem('staffOtpDevCode', devCode);
          setDevCodeHint(devCode);
        }
        const masked = response.data.data?.maskedDestination;
        if (masked) {
          setDeliveryHint(`Sent to ${masked}`);
        }
      }
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Could not resend verification code.';
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = digits.join('');
    if (codeStr.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    try {
      setVerifying(true);
      setError('');

      let response;
      if (roleParam === 'staff') {
        response = await api.post('/staff/verify-2fa', {
          email,
          otp: codeStr,
        });
      } else {
        response = await api.post('/auth/verify-otp', {
          email,
          otp: codeStr,
        });
      }

      if (response.data.success) {
        setSuccessMsg('2FA verification successful!');
        const data = response.data.data;
        if (data?.tokens?.accessToken && data?.user) {
          setAuth(data.user, {
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken ?? '',
          });
        }
        sessionStorage.removeItem('staffOtpDevCode');

        setTimeout(() => {
          if (roleParam === 'staff' || ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(data?.user?.role)) {
            router.push('/staff/overview');
          } else {
            router.push('/dashboard');
          }
        }, 1000);
      } else {
        setError(response.data.message || 'Verification failed. Please check the code.');
      }
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Invalid or expired OTP verification code.';
      setError(message);
    } finally {
      setVerifying(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <UGLogo size="md" href="/" />
          <Link
            href={roleParam === 'staff' ? '/staff-portal-access' : '/login'}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-[#1e3a8a] via-blue-900 to-indigo-900 text-white py-12 px-4 text-center">
        <div className="max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Two-Factor Authentication (2FA) Security Check
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Verify Security Code</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Enter the 6-digit MFA security code sent to{' '}
            <strong className="text-white">{email}</strong>.
          </p>
          {deliveryHint && (
            <p className="text-xs text-blue-200 mt-2">{deliveryHint}</p>
          )}
        </div>
      </section>

      <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-6 relative z-20 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e3a8a]">
              <Mail className="h-6 w-6" />
            </div>
          </div>

          {devCodeHint && roleParam === 'staff' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <strong>Development:</strong> Your verification code is{' '}
              <span className="font-mono font-bold tracking-widest">{devCodeHint}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-13 text-center text-xl font-bold text-[#1e3a8a] bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={verifying || digits.some((d) => d === '')}
              className="w-full py-3 bg-[#1e3a8a] text-white font-bold text-sm rounded-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Security Code...
                </>
              ) : (
                'Confirm & Authenticate Session'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
            <p>
              Code expires in{' '}
              <span className="font-mono font-bold text-[#1e3a8a]">
                {minutes}:{seconds}
              </span>
            </p>
            {roleParam === 'staff' && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || secondsLeft <= 0}
                className="text-[#1e3a8a] font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending new code…' : 'Resend verification code'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
