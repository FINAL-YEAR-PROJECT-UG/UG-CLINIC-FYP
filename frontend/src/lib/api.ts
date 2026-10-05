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

// ── Request interceptor: inject Supabase access token ─────────────────────────
// The Next.js route handlers (sessionIdentity.ts) look for a Bearer token in
// the Authorization header. We read it from the live Supabase session so every
// staff API call is authenticated without relying on cookie timing.

// Session token cache — avoids calling getSession() on every request.
// Cache is valid for 55 s (well within the Supabase 1-hour token lifetime).
let _cachedToken: string | null = null;
let _cachedTokenExpiry = 0;
const SESSION_CACHE_TTL_MS = 55_000;

let _sessionFetchPromise: Promise<string | null> | null = null;

async function getCachedAccessToken(): Promise<string | null> {
  if (_cachedToken && Date.now() < _cachedTokenExpiry) {
    return _cachedToken;
  }
  // Deduplicate concurrent calls — only one getSession() in-flight at a time
  if (_sessionFetchPromise) return _sessionFetchPromise;

  _sessionFetchPromise = (async () => {
    try {
      const { createClient } = await import('../utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      _cachedToken = session?.access_token ?? null;
      _cachedTokenExpiry = Date.now() + SESSION_CACHE_TTL_MS;
      return _cachedToken;
    } catch {
      return null;
    } finally {
      _sessionFetchPromise = null;
    }
  })();

  return _sessionFetchPromise;
}

// Call this whenever the user logs in/out so the cache is evicted immediately.
export function evictSessionTokenCache() {
  _cachedToken = null;
  _cachedTokenExpiry = 0;
}

api.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  config.withCredentials = true;

  if (typeof window !== 'undefined') {
    const token = await getCachedAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return config;
});

// ── Response interceptor: handle 401s without nuking staff sessions ────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isStaffPath =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/staff');

      // On staff pages, a 401 from one API call should NOT log the user out —
      // the Supabase session is still valid, only a specific backend call failed.
      if (!isStaffPath) {
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
    }

    return Promise.reject(error);
  }
);

export default api;

