'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function StaffLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [email, setEmail] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [userAgent, setUserAgent] = useState('');

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
    setValue: setOTPValue,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  useState(() => {
    setIpAddress(window.location.hostname);
    setUserAgent(navigator.userAgent);
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/staff/login', {
        ...data,
        ipAddress,
        userAgent,
      });

      if (response.data.requires2FA) {
        setEmail(data.email);
        setRequires2FA(true);
      } else {
        localStorage.setItem('staffTokens', JSON.stringify(response.data.data.tokens));
        localStorage.setItem('staffSessionToken', response.data.data.tokens.sessionToken);
        localStorage.setItem('staffUser', JSON.stringify(response.data.data.user));
        router.push('/staff/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPSubmit = async (data: OTPFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/staff/verify-2fa', {
        email,
        otp: data.otp,
        ipAddress,
        userAgent,
      });

      localStorage.setItem('staffTokens', JSON.stringify(response.data.data.tokens));
      localStorage.setItem('staffSessionToken', response.data.data.tokens.sessionToken);
      localStorage.setItem('staffUser', JSON.stringify(response.data.data.user));
      router.push('/staff/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Smartphone className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-center">
              Enter the 6-digit code sent to your phone
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitOTP(onOTPSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  {...registerOTP('otp')}
                  disabled={isLoading}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOTPValue('otp', value);
                  }}
                />
                {otpErrors.otp && <p className="text-sm text-red-500">{otpErrors.otp.message}</p>}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This code will expire in 10 minutes. If you didn't receive it, please contact your administrator.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setRequires2FA(false)}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Staff Portal Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the staff portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitLogin(onLoginSubmit)}>
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
                placeholder="staff@ug.edu.gh"
                {...registerLogin('email')}
                disabled={isLoading}
              />
              {loginErrors.email && <p className="text-sm text-red-500">{loginErrors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...registerLogin('password')}
                disabled={isLoading}
              />
              {loginErrors.password && <p className="text-sm text-red-500">{loginErrors.password.message}</p>}
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Two-factor authentication enabled for staff accounts</span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <Link href="/" className="text-sm text-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="inline mr-1 h-4 w-4" />
              Back to Main Portal
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
