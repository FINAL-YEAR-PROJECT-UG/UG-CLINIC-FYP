'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(600);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // sessionStorage is only available client-side, so read it after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(sessionStorage.getItem('otpEmail') || 'your email');
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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.some((d) => d === '')) {
      setError('Please enter all 6 digits.');
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      router.push('/dashboard');
    }, 1200);
  };

  const handleResend = () => {
    setSecondsLeft(600);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputsRef.current[0]?.focus();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-3">Check Your Email</h1>
          <p className="text-blue-100">We&apos;ve sent a 6-digit code to your inbox</p>
        </div>
      </section>

      <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-10 mb-16">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail className="h-7 w-7 text-blue-700" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-blue-900 text-center mb-2">Enter your verification code</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            A 6-digit OTP has been sent to <span className="font-semibold text-gray-800">{email}</span>.{' '}
            {secondsLeft > 0 ? (
              <>
                It expires in <span className="text-red-600 font-medium">{minutes}:{seconds}</span>.
              </>
            ) : (
              <span className="text-red-600 font-medium">The code has expired. Please resend.</span>
            )}
          </p>

          <form onSubmit={handleVerify}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-4">
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
                  onPaste={handlePaste}
                  aria-label={`Digit ${i + 1}`}
                  className="h-12 w-12 sm:h-14 sm:w-14 text-center text-2xl font-bold text-blue-900 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-5">
            Didn&apos;t receive it?{' '}
            <button onClick={handleResend} className="text-blue-700 font-semibold hover:underline">
              Resend OTP
            </button>
          </p>
          <Link
            href="/login"
            className="mt-3 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
