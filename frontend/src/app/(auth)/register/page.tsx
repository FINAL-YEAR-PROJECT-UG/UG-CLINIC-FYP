'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerWithStore } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AuthBrand from '@/components/shared/AuthBrand';
import {
  isValidStudentId,
  studentIdMessage,
  validatePhoneNumber,
} from '@/lib/validation';
import { CheckCircle2, Eye, EyeOff } from '@/components/icons';
import './page.css';
import logoIcon from '@/Assets/logo.svg';

const getImageSrc = (image: any) => {
  if (typeof image === 'string') return image;
  if (image.src) return image.src;
  return image;
};

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'First name is required'),
    lastName: z.string().trim().min(2, 'Last name is required'),
    otherNames: z.string().trim().optional(),
    studentId: z.string().trim().min(1, 'Student ID is required').refine((val) => isValidStudentId(val), studentIdMessage),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    phone: z.string().trim().superRefine((value, ctx) => {
      const result = validatePhoneNumber(value);
      if (!result.valid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
      }
    }),
    gender: z.enum(['male', 'female', 'other']),
    isResident: z.enum(['resident', 'non-resident']),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    program: z.string().min(1, 'Program is required'),
    otherProgram: z.string().trim().optional(),
    acceptPrivacyPolicy: z.literal(true),
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

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Password confirmation does not match',
      });
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

// ─── Password strength helper ──────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a–z)', pass: /[a-z]/.test(password) },
    { label: 'One number (0–9)', pass: /[0-9]/.test(password) },
    { label: 'One special character (!@#$…)', pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const strengthColor = passed <= 1 ? 'bg-red-400' : passed <= 3 ? 'bg-amber-400' : 'bg-emerald-500';
  const strengthLabel = passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : passed === 4 ? 'Good' : 'Strong';
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${strengthColor}`} style={{ width: `${(passed / 5) * 100}%` }} />
        </div>
        <span className={`text-[10px] font-bold ${passed <= 1 ? 'text-red-500' : passed <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>{strengthLabel}</span>
      </div>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-[10px] font-medium ${c.pass ? 'text-emerald-600' : 'text-gray-400'}`}>
            <CheckCircle2 className={`w-3 h-3 shrink-0 ${c.pass ? 'text-emerald-500' : 'text-gray-300'}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);

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
      let programValue = undefined;
      if (data.program) {
        programValue =
          data.program === 'other'
            ? data.otherProgram!.trim()
            : PROGRAM_LABELS[data.program] ?? data.program;
      }

      const response = await registerWithStore({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        otherNames: data.otherNames,
        studentId: data.studentId,
        phone: data.phone,
        gender: data.gender,
        isResident: data.isResident,
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
      <Link href="/login" className="register-exit-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Exit
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AuthBrand />
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
        <h1 className="register-hero-title">Student Registration</h1>
        <p className="register-hero-description">
          Create your UG student clinic account with your student details to book appointments and manage your health
        </p>
        <div className="register-hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F3F4F6" />
          </svg>
        </div>
      </div>

      {/* Register Card */}
      <div className="register-card-container">
        <div className="register-card">
          {isLoading ? (
            <div className="py-16">
              <LoadingSpinner size={80} />
            </div>
          ) : (
            <>
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
                <h2 className="register-card-title">Create Student Account</h2>
                <p className="register-card-description">University of Ghana students only - register with your student ID and details</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                {error && (
                  <div className="register-error-banner">{error}</div>
                )}

                <div className="register-form-grid">
                  {/* First Name */}
                  <div className="register-input-group">
                    <label htmlFor="firstName" className="register-label">First Name</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input id="firstName" type="text" placeholder="e.g. Kwame" disabled={isLoading} className={`register-input ${errors.firstName ? 'error' : ''}`} {...register('firstName')} />
                    </div>
                    {errors.firstName && <p className="register-error-text" role="alert">{errors.firstName.message}</p>}
                  </div>

                  {/* Last Name */}
                  <div className="register-input-group">
                    <label htmlFor="lastName" className="register-label">Last Name</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input id="lastName" type="text" placeholder="e.g. Mensah" disabled={isLoading} className={`register-input ${errors.lastName ? 'error' : ''}`} {...register('lastName')} />
                    </div>
                    {errors.lastName && <p className="register-error-text" role="alert">{errors.lastName.message}</p>}
                  </div>

                  {/* Other Names */}
                  <div className="register-input-group register-full-width">
                    <label htmlFor="otherNames" className="register-label">Other Names (Optional)</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input id="otherNames" type="text" placeholder="e.g. Kofi" disabled={isLoading} className={`register-input ${errors.otherNames ? 'error' : ''}`} {...register('otherNames')} />
                    </div>
                    {errors.otherNames && <p className="register-error-text" role="alert">{errors.otherNames.message}</p>}
                  </div>

                  {/* Student ID */}
                  <div className="register-input-group">
                    <label htmlFor="studentId" className="register-label">Student ID</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input id="studentId" type="text" inputMode="numeric" maxLength={8} placeholder="e.g. 10987654" disabled={isLoading} className={`register-input ${errors.studentId ? 'error' : ''}`} {...register('studentId')} />
                    </div>
                    {errors.studentId && <p className="register-error-text" role="alert">{errors.studentId.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="register-input-group">
                    <label htmlFor="email" className="register-label">Email Address</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input id="email" type="email" placeholder="yourname@email.com" disabled={isLoading} className={`register-input ${errors.email ? 'error' : ''}`} {...register('email')} />
                    </div>
                    {errors.email && <p className="register-error-text" role="alert">{errors.email.message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="register-input-group">
                    <label htmlFor="phone" className="register-label">Phone Number</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <input id="phone" type="tel" placeholder="e.g. 0241234567" disabled={isLoading} className={`register-input ${errors.phone ? 'error' : ''}`} {...register('phone')} />
                    </div>
                    <p className="register-hint-text">Enter a valid Ghanaian mobile number (e.g. 024 or 050 prefix).</p>
                    {errors.phone && <p className="register-error-text" role="alert">{errors.phone.message}</p>}
                  </div>

                  {/* Gender */}
                  <div className="register-input-group">
                    <label htmlFor="gender" className="register-label">Gender</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        <path d="M2 12h20" />
                      </svg>
                      <select id="gender" disabled={isLoading} className={`register-input ${errors.gender ? 'error' : ''}`} style={{ appearance: 'none' }} {...register('gender')}>
                        <option value="" disabled>Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-select-icon">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    {errors.gender && <p className="register-error-text" role="alert">{errors.gender.message}</p>}
                  </div>

                  {/* Resident Status */}
                  <div className="register-input-group">
                    <label htmlFor="isResident" className="register-label">Residency Status</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <select id="isResident" disabled={isLoading} className={`register-input ${errors.isResident ? 'error' : ''}`} style={{ appearance: 'none' }} {...register('isResident')}>
                        <option value="" disabled>Select residency status</option>
                        <option value="resident">Resident</option>
                        <option value="non-resident">Non-Resident</option>
                      </select>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-select-icon">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    {errors.isResident && <p className="register-error-text" role="alert">{errors.isResident.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="register-input-group">
                    <label htmlFor="password" className="register-label">Password</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" disabled={isLoading} className={`register-input ${errors.password ? 'error' : ''}`} style={{ paddingRight: '2.5rem' }} {...register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="register-reveal-btn" tabIndex={-1}>
                        {showPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
                      </button>
                    </div>
                    <PasswordStrength password={watch('password') ?? ''} />
                    {errors.password && <p className="register-error-text" role="alert">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="register-input-group">
                    <label htmlFor="confirmPassword" className="register-label">Confirm Password</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" disabled={isLoading} className={`register-input ${errors.confirmPassword ? 'error' : ''}`} style={{ paddingRight: '2.5rem' }} {...register('confirmPassword')} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="register-reveal-btn" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
                      </button>
                    </div>
                    <p className="register-hint-text">Re-enter the same password to confirm it.</p>
                    {errors.confirmPassword && <p className="register-error-text" role="alert">{errors.confirmPassword.message}</p>}
                  </div>

                  {/* Program of Study */}
                  <div className="register-input-group register-full-width">
                    <label htmlFor="program" className="register-label">Program of Study</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      <select id="program" disabled={isLoading} className={`register-input ${errors.program ? 'error' : ''}`} style={{ appearance: 'none' }} {...register('program')}>
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
                    {errors.program && <p className="register-error-text" role="alert">{errors.program.message}</p>}
                  </div>

                  {/* Other Program - when "other" is selected */}
                  {selectedProgram === 'other' && (
                  <div className="register-input-group">
                    <label htmlFor="otherProgram" className="register-label">Specify your program</label>
                    <div className="register-input-wrapper">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-input-icon">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      <input
                        id="otherProgram"
                        type="text"
                        placeholder="e.g. Agricultural Engineering"
                        disabled={isLoading}
                        className={`register-input ${errors.otherProgram ? 'error' : ''}`}
                        {...register('otherProgram')}
                      />
                    </div>
                    {errors.otherProgram && <p className="register-error-text" role="alert">{errors.otherProgram.message}</p>}
                  </div>
                  )}
                </div>

                {/* Privacy Policy Acceptance */}
                <div className="register-input-group">
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: '#334155', cursor: 'pointer', lineHeight: 1.5 }}>
                    <input id="acceptPrivacyPolicy" type="checkbox" style={{ width: 16, height: 16, marginTop: 2 }} {...register('acceptPrivacyPolicy')} />
                    <span>
                      I have read and agree to the{' '}
                      <Link href="/privacy" style={{ color: '#0369A1', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
                      {' '}and{' '}
                      <Link href="/terms" style={{ color: '#0369A1', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</Link>
                    </span>
                  </label>
                  {errors.acceptPrivacyPolicy && <p className="register-error-text" role="alert">{errors.acceptPrivacyPolicy.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="register-submit-button"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="register-terms-text">
                By creating an account, you agree to our{' '}
                <Link href="/privacy" style={{ color: '#0369A1', textDecoration: 'none', fontWeight: 500 }}>privacy policy</Link>
                {' '}and{' '}
                <Link href="/terms" style={{ color: '#0369A1', textDecoration: 'none', fontWeight: 500 }}>terms of service</Link>.
              </p>
            </>
          )}
        </div>

        {/* Info box */}
        <div className="register-info-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="register-info-box-icon">
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