'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/authApi';
import './page.css';

const loginSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Please enter a valid UG email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<LoginFormData | null>(null);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerOTP,
    handleSubmit: handleSubmitOTP,
    formState: { errors: otpErrors },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSendingOTP(true);
    setOtpError(null);
    try {
      const response = await authApi.sendOTP({ email: data.email, studentId: data.studentId });
      if (response.success) {
        setLoginData(data);
        setOtpSent(true);
      } else {
        setOtpError(response.message);
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const onVerifyOTP = async (data: OTPFormData) => {
    if (!loginData) return;
    
    setIsVerifyingOTP(true);
    setOtpError(null);
    try {
      const response = await authApi.loginWithOTP({
        email: loginData.email,
        studentId: loginData.studentId,
        otp: data.otp,
      });
      if (response.success && response.data) {
        useAuthStore.getState().setAuth(response.data.user, response.data.tokens);
        window.location.href = '/dashboard';
      } else {
        setOtpError(response.message);
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <div className="login-page">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  HEADER — kept exactly as you have it now                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <nav className="login-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="login-nav-logo">
            UG
          </div>
          <div>
            <div className="login-nav-title">
              UG Student Clinic
            </div>
            <div className="login-nav-subtitle">
              Quality Healthcare for Students
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['Home', 'About', 'Services', 'Health Resources', 'Contact'].map(
            (n) => (
              <a
                key={n}
                href="#"
                className="login-nav-link"
              >
                {n}
              </a>
            )
          )}
          <button className="login-nav-button">
            Book Appointment
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  HERO SECTION (blue gradient)                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="login-hero">
        <h1 className="login-hero-title">
          Welcome Back
        </h1>
        <p className="login-hero-description">
          Log in to manage your Book appointments, view medical records, and
          connect with healthcare professionals.
        </p>
        <div className="login-hero-breadcrumb">
          <Link href="/" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            Home
          </Link>
          {' / '}
          <span>Book Appointment</span>
        </div>

        {/* ── Wave SVG transition ────────────────────────────────────────── */}
        <div className="login-hero-wave">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F3F4F6"
            />
          </svg>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  LOGIN CARD                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="login-card-container">
        <div className="login-card">
          {/* ── Stethoscope icon ───────────────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="login-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B4FD8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
            <h2 className="login-card-title">
              Sign in to your account
            </h2>
            <p className="login-card-description">
              Enter your student ID and UG email address to continue
            </p>
          </div>

          {/* ── Form ───────────────────────────────────────────────────────── */}
          {!otpSent ? (
            <form onSubmit={handleSubmitLogin(onSubmit)}>
              {/* Error banner */}
              {otpError && (
                <div className="login-error-banner">
                  {otpError}
                </div>
              )}

              {/* Student ID */}
              <div className="login-input-group">
                <label className="login-label">Student ID</label>
                <div className="login-input-wrapper">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="login-input-icon"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    placeholder="e.g. 10987654"
                    disabled={isSendingOTP}
                    className={`login-input ${loginErrors.studentId ? 'error' : ''}`}
                    {...registerLogin('studentId')}
                  />
                </div>
                {loginErrors.studentId && (
                  <p className="login-error-text">
                    {loginErrors.studentId.message}
                  </p>
                )}
              </div>

              {/* UG Email Address */}
              <div className="login-input-group">
                <label className="login-label">UG Email Address</label>
                <div className="login-input-wrapper">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="login-input-icon"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="email"
                    placeholder="yourname@st.ug.edu.gh"
                    disabled={isSendingOTP}
                    className={`login-input ${loginErrors.email ? 'error' : ''}`}
                    {...registerLogin('email')}
                  />
                </div>
                {loginErrors.email && (
                  <p className="login-error-text">
                    {loginErrors.email.message}
                  </p>
                )}
              </div>

              {/* Send OTP button */}
              <button
                type="submit"
                disabled={isSendingOTP}
                className="login-submit-button"
              >
                {isSendingOTP ? (
                  <>
                    <Loader2 size={16} className="login-spinner" />
                    Sending...
                  </>
                ) : (
                  'Send OTP to my email'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitOTP(onVerifyOTP)}>
              {/* Success message */}
              <div className="login-success-banner">
                OTP sent! Check your UG student email inbox.
              </div>

              {/* Error banner */}
              {otpError && (
                <div className="login-error-banner">
                  {otpError}
                </div>
              )}

              {/* OTP Input */}
              <div className="login-input-group">
                <label className="login-label">Enter OTP</label>
                <div className="login-input-wrapper">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="login-input-icon"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    disabled={isVerifyingOTP}
                    className={`login-input otp ${otpErrors.otp ? 'error' : ''}`}
                    {...registerOTP('otp')}
                  />
                </div>
                {otpErrors.otp && (
                  <p className="login-error-text">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              {/* Verify OTP button */}
              <button
                type="submit"
                disabled={isVerifyingOTP}
                className="login-submit-button"
              >
                {isVerifyingOTP ? (
                  <>
                    <Loader2 size={16} className="login-spinner" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP & Login'
                )}
              </button>

              {/* Resend OTP link */}
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpError(null);
                }}
                disabled={isVerifyingOTP}
                className="login-back-button"
              >
                ← Back to enter credentials
              </button>
            </form>
          )}

          {/* ── Divider ────────────────────────────────────────────────────── */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">
              New to the clinic?
            </span>
            <div className="login-divider-line" />
          </div>

          {/* ── Create account button ──────────────────────────────────────── */}
          <Link href="/auth/register" style={{ textDecoration: 'none' }}>
            <button className="login-secondary-button">
              Create an account
            </button>
          </Link>

          {/* ── Terms text ─────────────────────────────────────────────────── */}
          <p className="login-terms-text">
            By continuing you agree to our{' '}
            <a href="#" style={{ color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>
              privacy policy
            </a>{' '}
            and{' '}
            <a href="#" style={{ color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>
              terms of service
            </a>
            .
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  INFO BOX                                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="login-info-box">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B4FD8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="login-info-box-icon"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p className="login-info-box-text">
            An OTP will be sent to your UG student email. Check your inbox after
            clicking the button to securely complete your login.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  FOOTER — kept exactly as you have it now                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="login-footer">
        <span className="login-footer-text">
          &copy; 2026 University Student Clinic. All rights reserved.
        </span>
      </footer>
    </div>
  );
}