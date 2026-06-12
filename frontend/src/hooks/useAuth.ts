import { useAuthStore } from '../stores/authStore';
import { loginWithStore, registerWithStore, logoutWithStore } from '../lib/authApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const useAuth = () => {
  const { user, tokens, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setError(null);
    setLoading(true);
    try {
      const response = await loginWithStore({ email, password, rememberMe });
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    phone?: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      const response = await registerWithStore(data);
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutWithStore();
      router.push('/auth/login');
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearAuth,
  };
};
