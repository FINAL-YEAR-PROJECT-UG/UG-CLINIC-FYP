import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUpstreamHeaders } from '../src/app/api/backend/headers.ts';

test('buildUpstreamHeaders strips restricted hop-by-hop headers', () => {
  const incoming = new Headers({
    connection: 'keep-alive',
    'content-length': '123',
    cookie: 'foo=bar',
    host: 'example.com',
    'content-type': 'application/json',
  });

  const headers = buildUpstreamHeaders(incoming);
  assert.equal(headers.has('connection'), false);
  assert.equal(headers.has('content-length'), false);
  assert.equal(headers.has('cookie'), false);
  assert.equal(headers.has('host'), false);
  assert.equal(headers.get('content-type'), 'application/json');
});

test('buildUpstreamHeaders injects session cookie with connect.sid prefix', () => {
  const incoming = new Headers();
  const headers = buildUpstreamHeaders(incoming, {
    cookie: 'session-token-123',
    backendUrl: 'http://localhost:3005/api/auth/register',
  });

  assert.equal(headers.get('cookie'), 'connect.sid=session-token-123');

  const headersWithPrefix = buildUpstreamHeaders(incoming, {
    cookie: 'connect.sid=already-prefixed',
    backendUrl: 'http://localhost:3005/api/auth/register',
  });
  assert.equal(headersWithPrefix.get('cookie'), 'connect.sid=already-prefixed');
});

test('buildUpstreamHeaders injects apikey header for Supabase request when missing', () => {
  const incoming = new Headers();
  const testKey = 'test-supabase-anon-key';

  const headers = buildUpstreamHeaders(incoming, {
    backendUrl: 'https://xoyljehlfwodywoqfade.supabase.co/auth/register',
    supabaseKey: testKey,
  });

  assert.equal(headers.get('apikey'), testKey);
  assert.equal(headers.get('authorization'), `Bearer ${testKey}`);
});

test('buildUpstreamHeaders respects existing apikey if already supplied', () => {
  const incoming = new Headers({ apikey: 'existing-client-key' });
  const headers = buildUpstreamHeaders(incoming, {
    backendUrl: 'https://xoyljehlfwodywoqfade.supabase.co/auth/register',
    supabaseKey: 'fallback-key',
  });

  assert.equal(headers.get('apikey'), 'existing-client-key');
});

test('buildUpstreamHeaders respects existing authorization header', () => {
  const incoming = new Headers({ authorization: 'Bearer user-access-token' });
  const testKey = 'test-supabase-anon-key';

  const headers = buildUpstreamHeaders(incoming, {
    backendUrl: 'https://xoyljehlfwodywoqfade.supabase.co/auth/register',
    supabaseKey: testKey,
  });

  assert.equal(headers.get('apikey'), testKey);
  assert.equal(headers.get('authorization'), 'Bearer user-access-token');
});

test('buildUpstreamHeaders does not attach Bearer token to non-Supabase backend', () => {
  const incoming = new Headers();
  const testKey = 'test-supabase-anon-key';

  const headers = buildUpstreamHeaders(incoming, {
    backendUrl: 'http://localhost:3005/api/auth/register',
    supabaseKey: testKey,
    supabaseUrl: 'https://project.supabase.co',
  });

  assert.equal(headers.get('apikey'), testKey);
  assert.equal(headers.has('authorization'), false);
});

test('buildUpstreamHeaders reads from NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable', () => {
  const prevKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'env-anon-key-456';
    const incoming = new Headers();
    const headers = buildUpstreamHeaders(incoming, {
      backendUrl: 'https://xyz.supabase.co/auth/register',
    });

    assert.equal(headers.get('apikey'), 'env-anon-key-456');
    assert.equal(headers.get('authorization'), 'Bearer env-anon-key-456');
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = prevKey;
  }
});
