import { useAuthStore } from '../stores/authStore';
import { loginWithStore, registerWithStore, logoutWithStore } from '../lib/authApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getErrorMessage } from '../lib/utils';

export const useAuth = () => {
  const { user, tokens, isAuthenticated, isLoading, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string, rememberMe?: boolean) => {
    setError(null);
    setLoading(true);
    try {
      const response = await loginWithStore({ username, password, rememberMe });
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
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
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutWithStore();
      router.push('/login');
    } catch (err) {
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
