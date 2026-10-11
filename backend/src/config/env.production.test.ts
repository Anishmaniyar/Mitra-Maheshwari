import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadEnv } from './env.js';

// Startup gate: production boots only with explicit, strong configuration.
// These tests call loadEnv directly with fixture mappings, so no process
// environment mutation or app import is needed.

const STRONG = 'k7$Qm2!xVz9@pLrT4#wNsJ6&yHdF8*aKcE5';

const baseProd = (): Record<string, string | undefined> => ({
  NODE_ENV: 'production',
  PORT: '5000',
  DATABASE_URL: 'postgres://app:secret@db.internal:5432/mitra',
  JWT_SECRET: STRONG,
  CORS_ALLOWED_ORIGINS: 'https://app.example.com',
  RAZORPAY_KEY_ID: 'rzp_live_abc',
  RAZORPAY_KEY_SECRET: 'rzp-secret-value-ok',
  RAZORPAY_WEBHOOK_SECRET: 'wh-secret-value-ok',
  REDIS_URL: 'rediss://prod-redis.internal:6380',
});

describe('production startup gate', () => {
  it('accepts a complete, strong production configuration', () => {
    const parsed = loadEnv(baseProd());
    assert.equal(parsed.NODE_ENV, 'production');
  });

  it('rejects a missing NODE_ENV instead of defaulting', () => {
    const raw = baseProd();
    delete raw.NODE_ENV;
    assert.throws(() => loadEnv(raw));
  });

  it('rejects placeholder JWT secrets without echoing the value', () => {
    for (const secret of ['change-me-in-env', 'secret', 'password', 'x'.repeat(8)]) {
      assert.throws(() => loadEnv({ ...baseProd(), JWT_SECRET: secret }), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /JWT_SECRET/);
        assert.ok(!error.message.includes(secret), 'secret value must not leak');
        return true;
      });
    }
  });

  it('rejects short non-placeholder secrets', () => {
    assert.throws(() => loadEnv({ ...baseProd(), JWT_SECRET: 'short-but-unique-1' }), /JWT_SECRET/);
  });

  it('validates dedicated secrets when they are set, ignores them when absent', () => {
    assert.doesNotThrow(() => loadEnv(baseProd()));
    assert.throws(
      () => loadEnv({ ...baseProd(), OTP_HASH_SECRET: 'test' }),
      /OTP_HASH_SECRET/,
    );
    assert.throws(
      () => loadEnv({ ...baseProd(), REFRESH_TOKEN_SECRET: 'password' }),
      /REFRESH_TOKEN_SECRET/,
    );
    assert.doesNotThrow(() =>
      loadEnv({ ...baseProd(), OTP_HASH_SECRET: STRONG, REFRESH_TOKEN_SECRET: STRONG }),
    );
  });

  it('requires CORS origins and https in production', () => {
    assert.throws(() => loadEnv({ ...baseProd(), CORS_ALLOWED_ORIGINS: '' }), /CORS/);
    assert.throws(
      () => loadEnv({ ...baseProd(), CORS_ALLOWED_ORIGINS: 'http://app.example.com' }),
      /https/,
    );
    assert.doesNotThrow(() =>
      loadEnv({ ...baseProd(), CORS_ALLOWED_ORIGINS: 'https://a.example,https://b.example' }),
    );
  });

  it('requires Razorpay credentials and explicit REDIS_URL in production', () => {
    assert.throws(() => loadEnv({ ...baseProd(), RAZORPAY_KEY_ID: '' }), /RAZORPAY/);
    assert.throws(() => loadEnv({ ...baseProd(), RAZORPAY_WEBHOOK_SECRET: '' }), /RAZORPAY/);
    const raw = baseProd();
    delete raw.REDIS_URL;
    assert.throws(() => loadEnv(raw), /REDIS_URL/);
  });

  it('rejects malformed token lifetimes in production', () => {
    assert.throws(
      () => loadEnv({ ...baseProd(), ACCESS_TOKEN_EXPIRES_IN: 'soon' }),
      /ACCESS_TOKEN_EXPIRES_IN/,
    );
  });

  it('keeps local development usable with weak secrets', () => {
    const parsed = loadEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/mitra_maheshwari',
      JWT_SECRET: 'dev-only',
    });
    assert.equal(parsed.NODE_ENV, 'development');
  });

  it('still rejects an empty JWT secret outside production', () => {
    assert.throws(() =>
      loadEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/x',
        JWT_SECRET: '',
      }),
    );
  });
});
