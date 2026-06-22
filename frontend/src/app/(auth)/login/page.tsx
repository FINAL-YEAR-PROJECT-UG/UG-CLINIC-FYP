'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Please enter a valid UG email address'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Reusable styles ───────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px 10px 40px',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  fontSize: 14,
  color: '#374151',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Call your OTP send API here
    console.log('Sending OTP to:', data.email, 'Student ID:', data.studentId);
    setOtpSent(true);
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: '100vh',
        background: '#F3F4F6',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  HEADER — kept exactly as you have it now                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: '#3B4FD8',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            UG
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937' }}>
              UG Student Clinic
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>
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
                style={{
                  fontSize: 14,
                  color: '#4B5563',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {n}
              </a>
            )
          )}
          <button
            style={{
              padding: '8px 20px',
              background: '#3B4FD8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Book Appointment
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  HERO SECTION (blue gradient)                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B4FD8 50%, #4F6BEB 100%)',
          padding: '48px 24px 80px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <h1
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 12px',
          }}
        >
          Welcome Back
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 520,
            margin: '0 auto 16px',
            lineHeight: 1.6,
          }}
        >
          Log in to manage your Book appointments, view medical records, and
          connect with healthcare professionals.
        </p>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            Home
          </Link>
          {' / '}
          <span style={{ color: '#fff', fontWeight: 500 }}>Book Appointment</span>
        </div>

        {/* ── Wave SVG transition ────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            width: '100%',
            lineHeight: 0,
          }}
        >
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', width: '100%', height: 'auto' }}
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
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 16px 40px',
          marginTop: -40,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '36px 32px 28px',
          }}
        >
          {/* ── Stethoscope icon ───────────────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
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
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#1F2937',
                margin: '0 0 6px',
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Enter your student ID and UG email address to continue
            </p>
          </div>

          {/* ── Form ───────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Error banner */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            )}

            {/* Success message */}
            {otpSent && (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#059669',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 8,
                }}
              >
                OTP sent! Check your UG student email inbox.
              </div>
            )}

            {/* Student ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Student ID</label>
              <div style={{ position: 'relative' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  placeholder="e.g. 10987654"
                  disabled={isLoading}
                  style={{
                    ...inputStyle,
                    borderColor: errors.studentId ? '#EF4444' : '#D1D5DB',
                  }}
                  {...register('studentId')}
                />
              </div>
              {errors.studentId && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#EF4444',
                    marginTop: 4,
                    marginBottom: 0,
                  }}
                >
                  {errors.studentId.message}
                </p>
              )}
            </div>

            {/* UG Email Address */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>UG Email Address</label>
              <div style={{ position: 'relative' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="email"
                  placeholder="yourname@st.ug.edu.gh"
                  disabled={isLoading}
                  style={{
                    ...inputStyle,
                    borderColor: errors.email ? '#EF4444' : '#D1D5DB',
                  }}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#EF4444',
                    marginTop: 4,
                    marginBottom: 0,
                  }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Send OTP button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B4FD8 50%, #4F6BEB 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Sending...
                </>
              ) : (
                'Send OTP to my email'
              )}
            </button>
          </form>

          {/* ── Divider ────────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{ flex: 1, height: 1, background: '#E5E7EB' }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#9CA3AF',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              New to the clinic?
            </span>
            <div
              style={{ flex: 1, height: 1, background: '#E5E7EB' }}
            />
          </div>

          {/* ── Create account button ──────────────────────────────────────── */}
          <Link href="/auth/register" style={{ textDecoration: 'none' }}>
            <button
              style={{
                width: '100%',
                padding: '12px 28px',
                background: '#fff',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 20,
              }}
            >
              Create an account
            </button>
          </Link>

          {/* ── Terms text ─────────────────────────────────────────────────── */}
          <p
            style={{
              fontSize: 11,
              color: '#9CA3AF',
              textAlign: 'center',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
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
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            marginTop: 20,
            padding: '16px 20px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 10,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B4FD8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p
            style={{
              fontSize: 13,
              color: '#3B4FD8',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            An OTP will be sent to your UG student email. Check your inbox after
            clicking the button to securely complete your login.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  FOOTER — kept exactly as you have it now                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: '#111827',
          padding: '20px 24px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          &copy; 2026 University Student Clinic. All rights reserved.
        </span>
      </footer>
    </div>
  );
}