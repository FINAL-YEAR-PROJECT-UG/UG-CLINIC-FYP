import test from 'node:test';
import assert from 'node:assert/strict';

const { GET, POST, OPTIONS } = await import('../src/app/api/backend/appointments/route.ts');

test('OPTIONS /api/backend/appointments returns 204 with Allow headers', async () => {
  const response = await OPTIONS();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Allow'), 'GET, POST, OPTIONS');
});

test('GET /api/backend/appointments requires authentication', async () => {
  const req = new Request('http://localhost:3001/api/backend/appointments', {
    method: 'GET',
  });
  const response = await GET(req);
  assert.equal(response.status, 401);
  const data = await response.json();
  assert.equal(data.success, false);
});

test('POST /api/backend/appointments validates required fields (date, timeSlot/time, reason)', async () => {
  const req = new Request('http://localhost:3001/api/backend/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const response = await POST(req);
  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Date, time slot, and reason are required');
});

test('POST /api/backend/appointments does not fake success without a patient session', async () => {
  const req = new Request('http://localhost:3001/api/backend/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceId: 'general',
      date: '2026-10-15',
      timeSlot: '09:00 AM',
      reason: 'General checkup',
    }),
  });

  const response = await POST(req);
  assert.equal(response.status, 401);
  const data = await response.json();
  assert.equal(data.success, false);
});
