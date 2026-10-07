import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register(pathToFileURL(path.resolve('test/setup/alias-loader.mjs')));

const { resolveLoginEmail } = await import('../src/lib/loginIdentifier.ts');

test('resolveLoginEmail normalizes email identifiers without looking up a student', async () => {
  let lookupCalled = false;
  const email = await resolveLoginEmail('  Student@Example.com  ', async () => {
    lookupCalled = true;
    return null;
  });

  assert.equal(email, 'student@example.com');
  assert.equal(lookupCalled, false);
});

test('resolveLoginEmail resolves an eight-digit student ID to its account email', async () => {
  let lookedUpStudentId = '';
  const email = await resolveLoginEmail(' 10987654 ', async (studentId) => {
    lookedUpStudentId = studentId;
    return ' Student@Example.com ';
  });

  assert.equal(lookedUpStudentId, '10987654');
  assert.equal(email, 'student@example.com');
});

test('resolveLoginEmail rejects invalid or unknown student IDs', async () => {
  let lookupCalled = false;
  const invalidId = await resolveLoginEmail('1098765x', async () => {
    lookupCalled = true;
    return 'student@example.com';
  });
  const unknownId = await resolveLoginEmail('00000000', async () => null);

  assert.equal(invalidId, null);
  assert.equal(unknownId, null);
  assert.equal(lookupCalled, false);
});
