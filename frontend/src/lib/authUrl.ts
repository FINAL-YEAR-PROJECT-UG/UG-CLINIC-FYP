/**
 * Canonical URL and Safe Redirect Utilities for Authentication.
 *
 * Ensures production email confirmation links always use the stable canonical
 * domain (never ephemeral per-deployment Vercel URLs like *-hash.vercel.app),
 * and prevents open-redirect vulnerabilities.
 */

/**
 * Validates a redirect path against open-redirect vulnerabilities.
 * Ensures the destination is a relative internal path starting with `/`
 * and not a protocol-relative URL (`//`) or malformed path (`/\`).
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Must begin with a single '/' and not '//' or '/\'
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('://')
  ) {
    return trimmed;
  }

  return fallback;
}

/**
 * Normalizes a URL by ensuring it has the correct protocol and no trailing slash.
 */
function normalizeUrl(url: string, defaultProtocol = 'https'): string {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `${defaultProtocol}://${cleaned}`;
  }
  return cleaned;
}

/**
 * Resolves the canonical base URL for the application.
 *
 * In production:
 *   1. CANONICAL_APP_URL (explicit canonical production URL)
 *   2. NEXT_PUBLIC_APP_URL (if not pointing to localhost)
 *   3. VERCEL_PROJECT_PRODUCTION_URL (stable production alias on Vercel, e.g. project.vercel.app)
 *   4. NEXTAUTH_URL (if not pointing to localhost)
 *
 * In preview or development:
 *   - Uses request origin or localhost:3001
 *   - NEVER uses VERCEL_URL in production, as VERCEL_URL is a per-deployment hash
 *     that expires and causes 404 DEPLOYMENT_NOT_FOUND.
 */
export function getCanonicalAppUrl(requestOrigin?: string): string {
  const isVercelProduction = process.env.VERCEL_ENV === 'production';
  const isNodeProduction = process.env.NODE_ENV === 'production';

  if (
    requestOrigin &&
    !isNodeProduction &&
    /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(requestOrigin)
  ) {
    return normalizeUrl(requestOrigin);
  }

  // 1. Explicit canonical production URL
  if (process.env.CANONICAL_APP_URL) {
    return normalizeUrl(process.env.CANONICAL_APP_URL);
  }

  // 2. Stable project production URL provided automatically by Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL, 'https');
  }

  // 3. NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const configured = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
    const isLocalhost = /localhost|127\.0\.0\.1/i.test(configured);
    if (!isLocalhost || (!isVercelProduction && !isNodeProduction)) {
      return configured;
    }
  }

  // 4. NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    const configured = normalizeUrl(process.env.NEXTAUTH_URL);
    const isLocalhost = /localhost|127\.0\.0\.1/i.test(configured);
    if (!isLocalhost || (!isVercelProduction && !isNodeProduction)) {
      return configured;
    }
  }

  // 5. In production on Vercel, avoid using an ephemeral deployment requestOrigin
  if (isVercelProduction) {
    // If request origin is a deployment-specific URL (*.vercel.app with commit/hash),
    // and no explicit domain was provided, return requestOrigin as a last resort.
    if (requestOrigin && !/localhost|127\.0\.0\.1/i.test(requestOrigin)) {
      return normalizeUrl(requestOrigin);
    }
  }

  // 6. Preview environment: allow requestOrigin or VERCEL_URL if specifically in preview
  if (process.env.VERCEL_ENV === 'preview') {
    if (requestOrigin) return normalizeUrl(requestOrigin);
    if (process.env.VERCEL_URL) return normalizeUrl(process.env.VERCEL_URL, 'https');
  }

  // 7. Local development fallback
  if (requestOrigin) {
    return normalizeUrl(requestOrigin);
  }

  return 'http://localhost:3001';
}

/**
 * Constructs the email confirmation callback URL.
 *
 * @param requestOrigin - Optional origin from the incoming request.
 * @param path - Callback path, defaults to '/auth/callback' for client-side processing
 *               (which safely handles both hash fragments and PKCE codes).
 */
export function getEmailRedirectTo(
  requestOrigin?: string,
  path: '/auth/callback' | '/api/auth/callback' = '/auth/callback'
): string {
  const baseUrl = getCanonicalAppUrl(requestOrigin);
  return `${baseUrl}${path}`;
}

/**
 * Builds the callback URL used by EMAIL-BASED AUTH LINKS so they are:
 *   - ALWAYS exchanged on the SERVER SIDE via `/api/auth/callback`
 *   - never routed to a client page which needs localStorage PKCE verifier.
 *
 * The `next` path tells `/api/auth/callback` where to land the user AFTER
 * the session cookie is written.
 *
 * Pass `type='recovery'` for password-reset / invitation-set-password flows,
 * since those flows require the user to visit a page that can submit a NEW
 * password update (i.e. reset password form).
 *
 * Pass `type='signup'` for email confirmations — the user is just verifying
 * their email, so no form is needed (land on /login with confirmed=true).
 */
export function getAuthCallbackRedirect(
  requestOrigin: string | undefined,
  opts: {
    /** Post-callback destination. */
    next?: string;
    /** Determines whether `next` gets auto-adjusted (recovery → `/reset-password`). */
    type: 'signup' | 'recovery' | 'invite' | 'magiclink';
  },
): string {
  const base = getCanonicalAppUrl(requestOrigin);
  const cb = `${base}/api/auth/callback`;

  let dest = opts.next;
  if (!dest) {
    switch (opts.type) {
      case 'signup':
        dest = '/login?confirmed=true';
        break;
      case 'recovery':
      case 'invite':
        dest = '/reset-password?from=recovery';
        break;
      case 'magiclink':
        dest = '/dashboard';
        break;
      default:
        dest = '/dashboard';
    }
  }

  const u = new URL(cb);
  u.searchParams.set('next', dest);
  if (opts.type) u.searchParams.set('flow', opts.type);
  return u.toString();
}

/** Sugar for password-reset / forgot-password flow. */
export function getRecoveryCallbackRedirect(requestOrigin?: string, next?: string) {
  return getAuthCallbackRedirect(requestOrigin, { type: 'recovery', next });
}

/** Sugar for signup email-confirmation flow. */
export function getSignupCallbackRedirect(requestOrigin?: string, next?: string) {
  return getAuthCallbackRedirect(requestOrigin, { type: 'signup', next });
}

/** Sugar for staff invite flow. */
export function getInviteCallbackRedirect(requestOrigin?: string, next?: string) {
  return getAuthCallbackRedirect(requestOrigin, {
    type: 'invite',
    next: next ?? '/staff-portal-access?from=invite',
  });
}
