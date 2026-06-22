'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import './page.css';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  method: z.enum(['email', 'sms']).optional(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      method: 'email',
    },
  });

  const method = watch('method');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/auth/forgot-password', data);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send reset link. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              If an account exists with this email, a password reset link has been sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 text-center">
                Please check your email and follow the instructions to reset your password.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@ug.edu.gh"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Send Reset Link Via</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={method === 'email' ? 'default' : 'outline'}
                  onClick={() => setValue('method', 'email')}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Button>
                <Button
                  type="button"
                  variant={method === 'sms' ? 'default' : 'outline'}
                  onClick={() => setValue('method', 'sms')}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>SMS</span>
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Link href="/login" className="text-sm text-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="inline mr-1 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
