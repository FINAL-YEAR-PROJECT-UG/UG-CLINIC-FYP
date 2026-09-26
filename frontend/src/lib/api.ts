import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../stores/authStore";

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

/** Resolve API URL: same hostname as the browser, backend on port 3005. */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3005/api`;
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





