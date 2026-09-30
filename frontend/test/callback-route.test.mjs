import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/auth/callback/route.ts';

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
