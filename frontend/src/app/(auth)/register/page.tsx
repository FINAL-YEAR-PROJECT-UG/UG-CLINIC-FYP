'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerWithStore } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/utils';
import {
  isUgStudentEmail,
  isValidStudentId,
  ugStudentEmailMessage,
  studentIdMessage,
  validatePhoneNumber,
} from '@/lib/validation';
import './page.css';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    studentId: z
      .string()
      .trim()
      .refine(isValidStudentId, studentIdMessage),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .refine(isUgStudentEmail, ugStudentEmailMessage),
    phone: z.string().trim().superRefine((value, ctx) => {
      const result = validatePhoneNumber(value);
      if (!result.valid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
      }
    }),
    program: z.string().min(1, 'Please select a program'),
    otherProgram: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.program === 'other') {
      const customProgram = data.otherProgram?.trim() ?? '';
      if (customProgram.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherProgram'],
          message: 'Please enter your program of study',
        });
      }
    }
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const PROGRAM_LABELS: Record<string, string> = {
  cs: 'Computer Science',
  engineering: 'Engineering',
  medicine: 'Medicine',
  business: 'Business Administration',
  law: 'Law',
  other: 'Other',
};

// OTP login is passwordless, so we generate a strong placeholder password that
// satisfies the backend password policy. Students authenticate via email OTP.
function generatePassword(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `Ug${random}9!A`;
}

const NAV_LINKS = [
  { name: 'Home', href: '/home' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Health Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedProgram = watch('program');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

      const programValue =
        data.program === 'other'
          ? data.otherProgram!.trim()
          : PROGRAM_LABELS[data.program] ?? data.program;

      const response = await registerWithStore({
        email: data.email,
        password: generatePassword(),
        firstName,
        lastName,
        studentId: data.studentId,
        phone: data.phone,
        program: programValue,
      });

      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      setIsLoading(false);
    }
  };

  // Shared Header
  const header = (
    <nav className="register-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="register-nav-logo">UG</div>
        <div>
          <div className="register-nav-title">UG Student Clinic</div>
          <div className="register-nav-subtitle">Quality Healthcare for Students</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {NAV_LINKS.map(({ name, href }) => (
          <Link key={name} href={href} className="register-nav-link">{name}</Link>
        ))}
      </div>
    </nav>
  );

  // Shared Footer
  const footer = (
    <footer className="register-footer">
      <span className="register-footer-text">&copy; 2026 University Student Clinic. All rights reserved.</span>
    </footer>
  );

  return (
    <div className="register-page">
      {header}

      {/* Hero */}
      <div className="register-hero">
        <h1 className="register-hero-title">Join Us</h1>
        <p className="register-hero-description">
          Create your account to start booking appointments and managing your health
        </p>
        <div className="register-hero-breadcrumb">
          <Link href="/home" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>Home</Link>
          {' / '}
          <span>Create Account</span>
        </div>
        <div className="register-hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F3F4F6" />
          </svg>
        </div>
      </div>

      {/* Register Card */}
      <div className="register-card-container">
        <div className="register-card">
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="register-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h2 className="register-card-title">Create your account</h2>
            <p className="register-card-description">Register with your student details to access clinic services</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="register-error-banner">{error}</div>
            )}

            {/* Full Name */}
            <div className="register-input-group">
              <label className="register-label">Full Name</label>
              <div className="register-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input type="text" placeholder="e.g. Kwame Mensah" disabled={isLoading} className={`register-input ${errors.fullName ? 'error' : ''}`} {...register('fullName')} />
              </div>
              {errors.fullName && <p className="register-error-text">{errors.fullName.message}</p>}
            </div>

            {/* Student ID */}
            <div className="register-input-group">
              <label className="register-label">Student ID</label>
              <div className="register-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type="text" inputMode="numeric" maxLength={8} placeholder="e.g. 10987654" disabled={isLoading} className={`register-input ${errors.studentId ? 'error' : ''}`} {...register('studentId')} />
              </div>
              {errors.studentId && <p className="register-error-text">{errors.studentId.message}</p>}
            </div>

            {/* Email */}
            <div className="register-input-group">
              <label className="register-label">UG Email Address</label>
              <div className="register-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input type="email" placeholder="yourname@st.ug.edu.gh" disabled={isLoading} className={`register-input ${errors.email ? 'error' : ''}`} {...register('email')} />
              </div>
              {errors.email && <p className="register-error-text">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="register-input-group">
              <label className="register-label">Phone Number</label>
              <div className="register-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input type="tel" placeholder="" disabled={isLoading} className={`register-input ${errors.phone ? 'error' : ''}`} {...register('phone')} />
              </div>
              {errors.phone && <p className="register-error-text">{errors.phone.message}</p>}
            </div>

            {/* Program */}
            <div className="register-input-group">
              <label className="register-label">Program of Study</label>
              <div className="register-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <select disabled={isLoading} className={`register-input ${errors.program ? 'error' : ''}`} style={{ appearance: 'none' }} {...register('program')}>
                  <option value="" disabled>Select your program</option>
                  <option value="cs">Computer Science</option>
                  <option value="engineering">Engineering</option>
                  <option value="medicine">Medicine</option>
                  <option value="business">Business Administration</option>
                  <option value="law">Law</option>
                  <option value="other">Other</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-select-icon">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {errors.program && <p className="register-error-text">{errors.program.message}</p>}
            </div>

            {selectedProgram === 'other' && (
              <div className="register-input-group">
                <label className="register-label">Specify your program</label>
                <div className="register-input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="e.g. Agricultural Engineering"
                    disabled={isLoading}
                    className={`register-input ${errors.otherProgram ? 'error' : ''}`}
                    {...register('otherProgram')}
                  />
                </div>
                {errors.otherProgram && <p className="register-error-text">{errors.otherProgram.message}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="register-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="register-spinner" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="register-login-text">
            <p>
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </div>

          <p className="register-terms-text">
            By creating an account, you agree to our{' '}
            <Link href="/privacy">privacy policy</Link>
            {' '}and{' '}
            <Link href="/terms">terms of service</Link>.
          </p>
        </div>

        {/* Info box */}
        <div className="register-info-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-info-box-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="register-info-box-text">
            Your information is secure and will only be used for clinic appointments and medical records.
          </p>
        </div>
      </div>

      {footer}
    </div>
  );
}