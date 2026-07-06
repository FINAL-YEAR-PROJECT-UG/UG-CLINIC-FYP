'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import './page.css';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/auth/forgot-password', { ...data, method: 'sms' });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send reset link. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-card">
          <div className="forgot-password-success">
            <h1 className="forgot-password-title">Check Your Phone</h1>
            <p className="forgot-password-description">
              If an account exists with this email, an SMS with a password reset link has been sent.
            </p>
            <div className="forgot-password-success-icon">✓</div>
          </div>
          <Link href="/login" className="forgot-password-back-link">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h1 className="forgot-password-title">Forgot Password?</h1>
        <p className="forgot-password-description">
          Enter your email to receive a password reset link
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="forgot-password-form">
          {error && (
            <div className="forgot-password-error">{error}</div>
          )}

          <div className="forgot-password-input-group">
            <input
              type="email"
              placeholder="john.doe@ug.edu.gh"
              {...register('email')}
              disabled={isLoading}
              className="forgot-password-input"
            />
            {errors.email && <p className="forgot-password-error-text">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="forgot-password-submit-button"
          >
            {isLoading ? 'Sending...' : 'SMS'}
          </button>
        </form>

        <Link href="/login" className="forgot-password-back-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
