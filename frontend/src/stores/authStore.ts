import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  phone?: string;
  program?: string;
  role: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),
      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'ug-clinic-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
