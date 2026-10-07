import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSafeRedirectUrl,
  getCanonicalAppUrl,
  getEmailRedirectTo,
  getRecoveryCallbackRedirect,
} from '../src/lib/authUrl.ts';

test('getSafeRedirectUrl accepts valid internal paths', () => {
  assert.equal(getSafeRedirectUrl('/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectUrl('/appointments?status=active'), '/appointments?status=active');
  assert.equal(getSafeRedirectUrl('/profile'), '/profile');
});

test('getSafeRedirectUrl rejects external or malformed URLs and falls back', () => {
  assert.equal(getSafeRedirectUrl('https://evil.com'), '/dashboard');
  assert.equal(getSafeRedirectUrl('http://attacker.com/steal'), '/dashboard');
  assert.equal(getSafeRedirectUrl('//evil.com'), '/dashboard');
  assert.equal(getSafeRedirectUrl('/\\evil.com'), '/dashboard');
  assert.equal(getSafeRedirectUrl('javascript:alert(1)'), '/dashboard');
  assert.equal(getSafeRedirectUrl(null), '/dashboard');
  assert.equal(getSafeRedirectUrl(undefined, '/home'), '/home');
});

test('getCanonicalAppUrl prioritizes CANONICAL_APP_URL', () => {
  const origCanonical = process.env.CANONICAL_APP_URL;
  const origVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origApp = process.env.NEXT_PUBLIC_APP_URL;

  try {
    process.env.CANONICAL_APP_URL = 'https://ugclinic.ug.edu.gh';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'project.vercel.app';
    process.env.NEXT_PUBLIC_APP_URL = 'https://fallback.vercel.app';

    assert.equal(getCanonicalAppUrl(), 'https://ugclinic.ug.edu.gh');
  } finally {
    process.env.CANONICAL_APP_URL = origCanonical;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = origVercel;
    process.env.NEXT_PUBLIC_APP_URL = origApp;
  }
});

test('getCanonicalAppUrl uses VERCEL_PROJECT_PRODUCTION_URL when no CANONICAL_APP_URL set', () => {
  const origCanonical = process.env.CANONICAL_APP_URL;
  const origVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  try {
    delete process.env.CANONICAL_APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'ug-clinic-production.vercel.app';

    assert.equal(getCanonicalAppUrl(), 'https://ug-clinic-production.vercel.app');
  } finally {
    process.env.CANONICAL_APP_URL = origCanonical;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = origVercel;
  }
});

test('getEmailRedirectTo constructs callback URL with canonical domain', () => {
  const origCanonical = process.env.CANONICAL_APP_URL;
  try {
    process.env.CANONICAL_APP_URL = 'https://ugclinic.ug.edu.gh';
    assert.equal(
      getEmailRedirectTo(undefined, '/auth/callback'),
      'https://ugclinic.ug.edu.gh/auth/callback'
    );
    assert.equal(
      getEmailRedirectTo(undefined, '/api/auth/callback'),
      'https://ugclinic.ug.edu.gh/api/auth/callback'
    );
  } finally {
    process.env.CANONICAL_APP_URL = origCanonical;
  }
});

test('recovery callback keeps localhost origin and routes to the reset form in development', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origCanonical = process.env.CANONICAL_APP_URL;

  try {
    process.env.NODE_ENV = 'development';
    process.env.CANONICAL_APP_URL = 'https://ugclinic.ug.edu.gh';

    const redirect = new URL(getRecoveryCallbackRedirect('http://localhost:3001'));

    assert.equal(redirect.origin, 'http://localhost:3001');
    assert.equal(redirect.pathname, '/api/auth/callback');
    assert.equal(redirect.searchParams.get('next'), '/reset-password?from=recovery');
    assert.equal(redirect.searchParams.get('flow'), 'recovery');
  } finally {
    if (origNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = origNodeEnv;
    }
    process.env.CANONICAL_APP_URL = origCanonical;
  }
});
