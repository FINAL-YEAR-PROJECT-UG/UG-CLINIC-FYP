import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register(pathToFileURL(path.resolve('test/setup/alias-loader.mjs')));

const { POST } = await import('../src/app/api/staff/admin/users/route.ts');

test('POST /api/staff/admin/users requires an authorized staff session', async () => {
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const prevAliasKey = process.env.SUPABASE_SERVICE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;

  try {
    const req = Object.assign(new Request('http://localhost:3000/api/staff/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', email: 'staff@ug.edu.gh' }),
    }), { nextUrl: new URL('http://localhost:3000/api/staff/admin/users') });

    const response = await POST(req);
    assert.equal(response.status, 401);

    const data = await response.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Unauthorized'));
  } finally {
    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    if (prevAliasKey === undefined) delete process.env.SUPABASE_SERVICE_KEY;
    else process.env.SUPABASE_SERVICE_KEY = prevAliasKey;
  }
});

test('POST /api/staff/admin/users rejects unauthorized requests without admin role or secret', async () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-ref.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

  try {
    const req = Object.assign(new Request('http://localhost:3000/api/staff/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', email: 'staff@ug.edu.gh', role: 'DOCTOR' }),
    }), { nextUrl: new URL('http://localhost:3000/api/staff/admin/users') });

    const response = await POST(req);
    assert.equal(response.status, 401);

    const data = await response.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Unauthorized'));
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  }
});

test('POST /api/staff/admin/users validates role and rejects invalid staff roles', async () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const prevSecret = process.env.STAFF_SETUP_SECRET;

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-ref.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  process.env.STAFF_SETUP_SECRET = 'mock-setup-secret';

  try {
    const req = Object.assign(new Request('http://localhost:3000/api/staff/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-setup-secret': 'mock-setup-secret',
      },
      body: JSON.stringify({ action: 'create', email: 'staff@ug.edu.gh', role: 'INVALID_ROLE' }),
    }), { nextUrl: new URL('http://localhost:3000/api/staff/admin/users') });

    const response = await POST(req);
    assert.equal(response.status, 400);

    const data = await response.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Invalid role'));
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    process.env.STAFF_SETUP_SECRET = prevSecret;
  }
});
