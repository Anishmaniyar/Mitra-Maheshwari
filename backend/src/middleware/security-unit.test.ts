import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../config/env.js';
import { assertOriginsForEnv, parseAllowedOrigins } from './cors.js';
import { parseTrustProxy } from '../app.js';
import {
  buildClearedRefreshCookieOptions,
  buildRefreshCookieOptions,
} from '../modules/auth/auth.controller.js';

// Pure security configuration units: no database, Redis, or HTTP involved.
// The env object is mutated and restored per test (same pattern as the
// dev-admin guard tests); tests within this file run sequentially.
const withNodeEnv = async (value: string, fn: () => Promise<void> | void): Promise<void> => {
  const previous = env.NODE_ENV;
  (env as { NODE_ENV: string }).NODE_ENV = value;
  try {
    await fn();
  } finally {
    (env as { NODE_ENV: string }).NODE_ENV = previous;
  }
};

describe('CORS origin parsing', () => {
  it('splits comma-separated origins and trims slashes/whitespace', () => {
    assert.deepEqual(
      parseAllowedOrigins('https://a.example , https://b.example/ ,,'),
      ['https://a.example', 'https://b.example'],
    );
    assert.deepEqual(parseAllowedOrigins(undefined), []);
    assert.deepEqual(parseAllowedOrigins(''), []);
  });

  it('accepts https origins in production, rejects http and malformed ones', () => {
    assert.doesNotThrow(() =>
      assertOriginsForEnv(['https://app.example.com'], 'production'),
    );
    assert.throws(() =>
      assertOriginsForEnv(['http://app.example.com'], 'production'),
    );
    assert.throws(() =>
      assertOriginsForEnv(['https://app.example.com/path'], 'production'),
    );
    assert.throws(() => assertOriginsForEnv(['*'], 'production'));
    assert.throws(() => assertOriginsForEnv(['app.example.com'], 'production'));
  });

  it('allows http loopback only outside production', () => {
    assert.doesNotThrow(() =>
      assertOriginsForEnv(['http://localhost:5173'], 'development'),
    );
    assert.doesNotThrow(() =>
      assertOriginsForEnv(['http://127.0.0.1:3000'], 'test'),
    );
    assert.throws(() =>
      assertOriginsForEnv(['http://192.168.1.10:3000'], 'development'),
    );
  });
});

describe('trust proxy parsing', () => {
  it('defaults to direct connections and accepts explicit values', () => {
    assert.equal(parseTrustProxy('false'), false);
    assert.equal(parseTrustProxy(''), false);
    assert.equal(parseTrustProxy('nope'), false);
    assert.equal(parseTrustProxy('true'), true);
    assert.equal(parseTrustProxy('1'), 1);
    assert.equal(parseTrustProxy('2'), 2);
  });
});

describe('refresh cookie policy', () => {
  it('is always HTTP-only, Lax, and root-pathed', async () => {
    await withNodeEnv('development', () => {
      const options = buildRefreshCookieOptions(1000);
      assert.equal(options.httpOnly, true);
      assert.equal(options.sameSite, 'lax');
      assert.equal(options.path, '/');
      const cleared = buildClearedRefreshCookieOptions();
      assert.equal(cleared.httpOnly, true);
      assert.equal(cleared.sameSite, 'lax');
      assert.equal(cleared.path, '/');
    });
  });

  it('sets Secure in production so the cookie never travels over http', async () => {
    await withNodeEnv('production', () => {
      assert.equal(buildRefreshCookieOptions(1000).secure, true);
      assert.equal(buildClearedRefreshCookieOptions().secure, true);
    });
    await withNodeEnv('development', () => {
      assert.equal(buildRefreshCookieOptions(1000).secure, false);
    });
  });
});
