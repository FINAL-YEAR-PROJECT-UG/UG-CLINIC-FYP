import api from './api';
import { useAuthStore } from '../stores/authStore';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  studentId?: string;
  dateOfBirth?: string;
  phone?: string;
  gender?: string;
  isResident?: string;
  program?: string;
}

export interface LoginData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    phone?: string;
    program?: string;
    role: string;
    isActive: boolean;
  };
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      phone?: string;
      program?: string;
      role: string;
      isActive: boolean;
    };
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data, { withCredentials: true });
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data, { withCredentials: true });
    return response.data;
  },

  logout: async (_refreshToken?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/logout', {}, { withCredentials: true });
    return response.data;
  },

  refreshToken: async (
    _refreshToken?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return { success: true, message: 'Sessions do not require refresh tokens' };
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile', { withCredentials: true });
    return response.data;
  },

  sendOTP: async (data: { email: string; studentId: string; method?: string }): Promise<{ success: boolean; message: string; devCode?: string }> => {
    const response = await api.post<{ success: boolean; message: string; devCode?: string }>('/auth/send-otp', data, { withCredentials: true });
    return response.data;
  },

  checkAccount: async (data: { email: string; studentId: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/check-account', data, { withCredentials: true });
    return response.data;
  },

  verifyOTP: async (data: { email: string; otp: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/verify-otp', data, { withCredentials: true });
    return response.data;
  },

  loginWithOTP: async (data: { email: string; studentId: string; otp: string; rememberMe?: boolean }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login-otp', data, { withCredentials: true });
    return response.data;
  },
};

export const loginWithStore = async (data: LoginData) => {
  const response = await authApi.login(data);
  const user = response.data?.user || response.user;
  if (response.success && user) {
    const tokens = response.data?.tokens || { accessToken: '', refreshToken: '' };
    useAuthStore.getState().setAuth(user, tokens);
  }
  return response;
};

export const registerWithStore = async (data: RegisterData) => {
  const response = await authApi.register(data);
  const user = response.data?.user || response.user;
  if (response.success && user) {
    const tokens = response.data?.tokens || { accessToken: '', refreshToken: '' };
    useAuthStore.getState().setAuth(user, tokens);
  }
  return response;
};

export const logoutWithStore = async () => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  useAuthStore.getState().clearAuth();
};
