import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Resolve @/ alias before importing the route under test.
const loaderPath = path.resolve('test/setup/alias-loader.mjs');
register(pathToFileURL(loaderPath));

const { GET, POST, OPTIONS } = await import('../src/app/api/backend/appointments/route.ts');

test('GET /api/backend/appointments reaches the handler and returns 200', async () => {
  const response = await GET();
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.endpoint, '/api/backend/appointments');
});

test('OPTIONS /api/backend/appointments returns 204 with Allow headers', async () => {
  const response = await OPTIONS();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Allow'), 'GET, POST, OPTIONS');
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

test('POST /api/backend/appointments successfully creates appointment and returns 201', async () => {
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
  assert.equal(response.status, 201);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.message, 'Appointment booked successfully');
  assert.ok(data.data?.appointment);
  assert.equal(data.data.appointment.serviceId, 'general');
  assert.equal(data.data.appointment.date, '2026-10-15');
  assert.equal(data.data.appointment.timeSlot, '09:00 AM');
  assert.equal(data.data.appointment.status, 'PENDING');
});
