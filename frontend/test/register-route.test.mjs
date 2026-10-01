import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Resolve @/ alias before importing the route under test.
const loaderPath = path.resolve('test/setup/alias-loader.mjs');
register(pathToFileURL(loaderPath));

const { GET, POST, OPTIONS } = await import('../src/app/api/backend/auth/register/route.ts');

test('GET /api/backend/auth/register reaches the handler and returns 200', async () => {
  const response = await GET();
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.endpoint, '/api/backend/auth/register');
});

test('OPTIONS /api/backend/auth/register returns 204 with Allow headers', async () => {
  const response = await OPTIONS();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Allow'), 'POST, GET, OPTIONS');
});

test('POST /api/backend/auth/register reaches the handler and validates required fields', async () => {
  const req = new Request('http://localhost:3001/api/backend/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const response = await POST(req);
  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Email and password are required');
});

test('POST /api/backend/auth/register reaches handler with email/password and forwards downstream', async () => {
  // Test fallback/forwarding when Supabase is not configured
  const prevSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;

  try {
    let capturedUrl = '';
    let capturedBody = '';

    global.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedBody = options.body;
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Registration successful',
          user: { id: 'mock-id', email: 'test@example.com' },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const req = new Request('http://localhost:3001/api/backend/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    });

    const response = await POST(req);
    assert.equal(response.status, 201);

    const data = await response.json();
    assert.equal(data.success, true);
    assert.ok(capturedUrl.endsWith('/auth/register'));
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = prevSupabaseKey;
  }
});
