'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Please enter a valid UG email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  program: z.string().min(1, 'Please select a program'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

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
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    console.log('Registering:', data);
    setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('otpEmail', data.email);
      router.push('/verify-otp');
    }, 1500);
  };

  const header = (
    <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: '#3B4FD8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>UG</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937' }}>UG Student Clinic</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Quality Healthcare for Students</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {['Home', 'About', 'Services', 'Health Resources', 'Contact'].map((n) => (
          <a key={n} href="#" style={{ fontSize: 14, color: '#4B5563', textDecoration: 'none', fontWeight: 500 }}>{n}</a>
        ))}
        <button style={{ padding: '8px 20px', background: '#3B4FD8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Book Appointment</button>
      </div>
    </nav>
  );

  const footer = (
    <footer style={{ background: '#111827', padding: '20px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>&copy; 2026 University Student Clinic. All rights reserved.</span>
    </footer>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
      {header}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B4FD8 50%, #4F6BEB 100%)', padding: '48px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Join Us</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Create your account to start booking appointments and managing your health
        </p>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>Home</Link>
          {' / '}
          <span style={{ color: '#fff', fontWeight: 500 }}>Create Account</span>
        </div>
        <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto' }}>
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F3F4F6" />
          </svg>
        </div>
      </div>

      {/* Register Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 40px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '36px 32px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: '0 0 6px' }}>Create your account</h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Register with your student details to access clinic services</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div style={{ padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>{error}</div>
            )}

            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input type="text" placeholder="e.g. Kwame Mensah" disabled={isLoading} style={{ ...inputStyle, borderColor: errors.fullName ? '#EF4444' : '#D1D5DB' }} {...register('fullName')} />
              </div>
              {errors.fullName && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.fullName.message}</p>}
            </div>

            {/* Student ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Student ID</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type="text" placeholder="e.g. 10987654" disabled={isLoading} style={{ ...inputStyle, borderColor: errors.studentId ? '#EF4444' : '#D1D5DB' }} {...register('studentId')} />
              </div>
              {errors.studentId && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.studentId.message}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>UG Email Address</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input type="email" placeholder="yourname@st.ug.edu.gh" disabled={isLoading} style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : '#D1D5DB' }} {...register('email')} />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input type="tel" placeholder="e.g. +233 20 123 4567" disabled={isLoading} style={{ ...inputStyle, borderColor: errors.phone ? '#EF4444' : '#D1D5DB' }} {...register('phone')} />
              </div>
              {errors.phone && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.phone.message}</p>}
            </div>

            {/* Program */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Program of Study</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <select disabled={isLoading} style={{ ...inputStyle, borderColor: errors.program ? '#EF4444' : '#D1D5DB', appearance: 'none' }} {...register('program')}>
                  <option value="" disabled>Select your program</option>
                  <option value="cs">Computer Science</option>
                  <option value="engineering">Engineering</option>
                  <option value="medicine">Medicine</option>
                  <option value="business">Business Administration</option>
                  <option value="law">Law</option>
                  <option value="other">Other</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {errors.program && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.program.message}</p>}
            </div>

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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#6B7280' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#3B4FD8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
            By creating an account, you agree to our{' '}
            <a href="#" style={{ color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>privacy policy</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>terms of service</a>.
          </p>
        </div>

        {/* Info box */}
        <div style={{ width: '100%', maxWidth: 420, marginTop: 20, padding: '16px 20px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p style={{ fontSize: 13, color: '#3B4FD8', lineHeight: 1.6, margin: 0 }}>
            Your information is secure and will only be used for clinic appointments and medical records.
          </p>
        </div>
      </div>

      {footer}
    </div>
  );
}