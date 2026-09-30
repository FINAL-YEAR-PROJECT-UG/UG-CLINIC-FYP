import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/staff/admin/users/route.ts';

test('POST /api/staff/admin/users returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;

  try {
    const req = new Request('http://localhost:3000/api/staff/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', email: 'staff@ug.edu.gh' }),
    });

    const response = await POST(req);
    assert.equal(response.status, 500);

    const data = await response.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('SUPABASE_SERVICE_ROLE_KEY'));
  } finally {
    if (prevKey) process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  }
});

test('POST /api/staff/admin/users rejects unauthorized requests without admin role or secret', async () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-ref.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

  try {
    const req = new Request('http://localhost:3000/api/staff/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', email: 'staff@ug.edu.gh', role: 'DOCTOR' }),
    });

    const response = await POST(req);
    assert.equal(response.status, 403);

    const data = await response.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Forbidden'));
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
    const req = new Request('http://localhost:3000/api/staff/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-setup-secret': 'mock-setup-secret',
      },
      body: JSON.stringify({ action: 'create', email: 'staff@ug.edu.gh', role: 'INVALID_ROLE' }),
    });

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
