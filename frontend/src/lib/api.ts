import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../stores/authStore";

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

/** Browser requests go through Vercel so backend session cookies stay same-origin. */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/backend';
  }

  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }
  return 'http://localhost:3005/api';
}

const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  config.withCredentials = true;
  // Session-based auth: cookies are sent automatically by the browser.
  // No Authorization header needed.
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/staff-portal-access')
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;





