import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Resolve @/ alias before importing the route under test.
// The Node test runner runs each file in its own worker so the top-level
// --import hook does not propagate; we register the loader here instead.
const loaderPath = path.resolve('test/setup/alias-loader.mjs');
register(pathToFileURL(loaderPath));

const { GET } = await import('../src/app/api/auth/callback/route.ts');

test('GET /api/auth/callback without code redirects to /login', async () => {
  const req = {
    nextUrl: {
      origin: 'http://localhost:3000',
      searchParams: new URLSearchParams(),
    },
  };

  const response = await GET(req);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'http://localhost:3000/login');
});

test('GET /api/auth/callback keeps localhost origin in development', async () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origCanonical = process.env.CANONICAL_APP_URL;

  try {
    process.env.NODE_ENV = 'development';
    process.env.CANONICAL_APP_URL = 'https://ugclinic.ug.edu.gh';

    const req = {
      nextUrl: {
        origin: 'http://localhost:3001',
        searchParams: new URLSearchParams(),
      },
    };

    const response = await GET(req);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), 'http://localhost:3001/login');
  } finally {
    if (origNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = origNodeEnv;
    }
    if (origCanonical === undefined) {
      delete process.env.CANONICAL_APP_URL;
    } else {
      process.env.CANONICAL_APP_URL = origCanonical;
    }
  }
});

test('GET /api/auth/callback without Supabase env vars redirects to login with configuration error', async () => {
  const prevSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;

  try {
    const req = {
      nextUrl: {
        origin: 'http://localhost:3000',
        searchParams: new URLSearchParams({ code: 'test-code' }),
      },
    };

    const response = await GET(req);
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get('location'),
      'http://localhost:3000/login?error=configuration'
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = prevSupabaseKey;
  }
});
