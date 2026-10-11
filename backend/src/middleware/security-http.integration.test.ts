import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// Real application instance with test-controlled security env. These
// assignments must precede the dynamic app import below: env.ts parses
// process.env once at first import, and static backend imports would freeze
// development values before the overrides apply (hence no static imports of
// backend modules in this file).
process.env.CORS_ALLOWED_ORIGINS =
  'https://app.example.com, https://admin.example.com';
process.env.JSON_BODY_LIMIT = '1kb';

const { app } = await import('../app.js');

after(async () => {
  // The /health probe below opens a pooled PG client; release it so the
  // test process exits promptly.
  const { pool } = await import('../config/database.js');
  await pool.end();
});

const ALLOWED = 'https://app.example.com';
const DENIED = 'https://evil.example.com';

describe('HTTP security headers', () => {
  it('sets baseline headers and hides the framework fingerprint', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['strict-transport-security'], 'HSTS is set');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.body.status, 'success');
  });
});

describe('CORS allowlist', () => {
  it('echoes an allowed origin with credentials for the cookie flow', async () => {
    const res = await request(app).get('/health').set('Origin', ALLOWED).expect(200);
    assert.equal(res.headers['access-control-allow-origin'], ALLOWED);
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
    assert.match(res.headers.vary ?? '', /origin/i);
  });

  it('sends no ACAO headers for an unapproved origin', async () => {
    const res = await request(app).get('/health').set('Origin', DENIED).expect(200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
    assert.equal(res.headers['access-control-allow-credentials'], undefined);
  });

  it('answers credentialed preflight for allowed origins', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);
    assert.equal(res.headers['access-control-allow-origin'], ALLOWED);
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
    assert.match(res.headers['access-control-allow-methods'] ?? '', /POST/);
  });

  it('denies preflight for unapproved origins', async () => {
    // Disallowed origins get no ACAO headers, so the browser blocks the
    // read. The request itself falls through to Express default handling;
    // the absence of the headers (not the status) is the security property.
    const res = await request(app)
      .options('/health')
      .set('Origin', DENIED)
      .set('Access-Control-Request-Method', 'POST')
      .expect(200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  it('does not block non-browser requests without an Origin header', async () => {
    await request(app).get('/health').expect(200);
  });
});

describe('request body limits', () => {
  it('rejects malformed JSON with a safe 400', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400);
    assert.equal(res.body.status, 'error');
    assert.equal(res.body.message, 'Invalid request body');
  });

  it('rejects oversized JSON with 413', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .set('Content-Type', 'application/json')
      .send({ mobile: '9000000001', purpose: 'LOGIN', pad: 'x'.repeat(2048) })
      .expect(413);
    assert.equal(res.body.status, 'error');
    assert.equal(res.body.message, 'Request body too large');
  });
});
