import api from './api';
import { useAuthStore } from '../stores/authStore';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      phone?: string;
      role: string;
      isActive: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/logout', {
      refreshToken,
    });
    return response.data;
  },

  refreshToken: async (
    refreshToken: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    };
  }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export const loginWithStore = async (data: LoginData) => {
  const response = await authApi.login(data);
  if (response.success && response.data) {
    useAuthStore.getState().setAuth(response.data.user, response.data.tokens);
  }
  return response;
};

export const registerWithStore = async (data: RegisterData) => {
  const response = await authApi.register(data);
  if (response.success && response.data) {
    useAuthStore.getState().setAuth(response.data.user, response.data.tokens);
  }
  return response;
};

export const logoutWithStore = async () => {
  const { tokens, clearAuth } = useAuthStore.getState();
  if (tokens?.refreshToken) {
    try {
      await authApi.logout(tokens.refreshToken);
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }
  clearAuth();
};
