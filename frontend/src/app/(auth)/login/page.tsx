'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithStore } from '@/lib/authApi';
import AuthBrand from '@/components/shared/AuthBrand';

const loginSchema = z.object({
  username: z.string().min(1, 'Please enter your email or student ID'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

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

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role')?.toUpperCase();
    if (role === 'STAFF' || role === 'STUDENT') {
      setSelectedRole(role as 'STUDENT' | 'STAFF');
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await loginWithStore(data);
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const header = (
    <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      <AuthBrand />
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {[
          { name: 'Home', href: '/home' },
          { name: 'About', href: '/about' },
          { name: 'Services', href: '/services' },
          { name: 'Health Resources', href: '/resources' },
          { name: 'Contact', href: '/contact' }
        ].map((n) => (
          <Link key={n.name} href={n.href} style={{ fontSize: 14, color: '#4B5563', textDecoration: 'none', fontWeight: 500 }}>{n.name}</Link>
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
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Welcome Back</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Sign in to access your clinic account and manage your appointments
        </p>
        <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto' }}>
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F3F4F6" />
          </svg>
        </div>
      </div>

      {/* Login Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 40px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '36px 32px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
              {['STUDENT', 'STAFF'].map((role) => {
                const isActive = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role as 'STUDENT' | 'STAFF')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: isActive ? '#3B4FD8' : '#D1D5DB',
                      background: isActive ? '#EEF2FF' : '#FFFFFF',
                      color: isActive ? '#1D4ED8' : '#475569',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {role === 'STUDENT' ? 'Student' : 'Staff'}
                  </button>
                );
              })}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: '0 0 6px' }}>
              {selectedRole === 'STUDENT' ? 'Student sign in' : 'Staff sign in'}
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              {selectedRole === 'STUDENT'
                ? 'Enter your student login details to access your clinic dashboard.'
                : 'Enter your staff credentials to access the staff dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div style={{ padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>{error}</div>
            )}

            {/* Username (Email or Student ID) */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{selectedRole === 'STUDENT' ? 'Email or Student ID' : 'Staff Email'}</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="text"
                  placeholder={selectedRole === 'STUDENT' ? 'email or student ID' : 'staff email'}
                  disabled={isLoading}
                  style={{ ...inputStyle, borderColor: errors.username ? '#EF4444' : '#D1D5DB' }}
                  {...register('username')}
                />
              </div>
              {errors.username && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type="password" placeholder="••••••••" disabled={isLoading} style={{ ...inputStyle, borderColor: errors.password ? '#EF4444' : '#D1D5DB' }} {...register('password')} />
              </div>
              {errors.password && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 16, height: 16 }} />
                Remember me
              </label>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {selectedRole === 'STUDENT' ? (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>
                Don't have an account?{' '}
                <Link href="/register" style={{ color: '#3B4FD8', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>
                Staff members should use their clinic email and password. If you need access, please contact your administrator.
              </p>
            </div>
          )}

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
            By signing in, you agree to our{' '}
            <Link href="/privacy" style={{ color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>privacy policy</Link>
            {' '}and{' '}
            <Link href="/terms" style={{ color: '#3B4FD8', textDecoration: 'none', fontWeight: 500 }}>terms of service</Link>.
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