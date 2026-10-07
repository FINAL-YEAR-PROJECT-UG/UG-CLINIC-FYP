import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register(pathToFileURL(path.resolve('test/setup/alias-loader.mjs')));
const {
  isValidAppointmentDate,
  normalizeAppointmentTime,
} = await import('../src/lib/appointmentScheduling.ts');

test('normalizes 24-hour and 12-hour appointment times consistently', () => {
  assert.equal(normalizeAppointmentTime('09:30'), 570);
  assert.equal(normalizeAppointmentTime('9:30 AM'), 570);
  assert.equal(normalizeAppointmentTime('12:15 AM'), 15);
  assert.equal(normalizeAppointmentTime('12:15 PM'), 735);
  assert.equal(normalizeAppointmentTime('03:45 PM'), 945);
});

test('rejects invalid appointment times', () => {
  assert.equal(normalizeAppointmentTime('24:00'), null);
  assert.equal(normalizeAppointmentTime('13:00 PM'), null);
  assert.equal(normalizeAppointmentTime('not a time'), null);
});

test('accepts only real ISO calendar dates', () => {
  assert.equal(isValidAppointmentDate('2026-10-15'), true);
  assert.equal(isValidAppointmentDate('2026-02-30'), false);
  assert.equal(isValidAppointmentDate('15-10-2026'), false);
});
