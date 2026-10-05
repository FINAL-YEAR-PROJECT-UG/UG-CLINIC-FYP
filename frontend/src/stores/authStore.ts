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
  _hasHydrated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
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
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'ug-clinic-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Called after persist has finished loading from localStorage
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Returns true only after Zustand has finished rehydrating from localStorage. */
export function useHasHydrated() {
  return useAuthStore((s) => s._hasHydrated);
}
