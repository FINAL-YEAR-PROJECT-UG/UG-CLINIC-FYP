import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Resolve @/ alias before importing
const loaderPath = path.resolve('test/setup/alias-loader.mjs');
register(pathToFileURL(loaderPath));

const { default: handler } = await import('../src/pages/api/auth/[...nextauth].ts');

function createMockRes() {
  const res = {
    statusCode: null,
    redirectUrl: null,
    redirect(status, url) {
      if (typeof status === 'string') {
        this.redirectUrl = status;
        this.statusCode = 302;
      } else {
        this.statusCode = status;
        this.redirectUrl = url;
      }
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    },
    setHeader() {},
    getHeader() {},
  };
  return res;
}

test('GET /api/auth/callback with code intercepts and redirects to client /auth/callback', async () => {
  const req = {
    method: 'GET',
    url: '/api/auth/callback?code=test-pkce-token&next=%2Fdashboard',
    query: {
      nextauth: ['callback'],
      code: 'test-pkce-token',
      next: '/dashboard',
    },
    headers: { host: 'localhost:3000' },
  };
  const res = createMockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 307);
  assert.equal(res.redirectUrl, '/auth/callback?code=test-pkce-token&next=%2Fdashboard');
});

test('GET /api/auth/callback/credentials intercepts and avoids "Callback for provider type credentials not supported"', async () => {
  const req = {
    method: 'GET',
    url: '/api/auth/callback/credentials',
    query: {
      nextauth: ['callback', 'credentials'],
    },
    headers: { host: 'localhost:3000' },
  };
  const res = createMockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 307);
  assert.equal(res.redirectUrl, '/auth/callback');
});

test('GET /api/auth/callback with error parameters intercepts and forwards to /auth/callback', async () => {
  const req = {
    method: 'GET',
    url: '/api/auth/callback?error=access_denied&error_description=User+cancelled',
    query: {
      nextauth: ['callback'],
      error: 'access_denied',
      error_description: 'User cancelled',
    },
    headers: { host: 'localhost:3000' },
  };
  const res = createMockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 307);
  assert.equal(res.redirectUrl, '/auth/callback?error=access_denied&error_description=User+cancelled');
});
