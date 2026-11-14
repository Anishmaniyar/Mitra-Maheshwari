import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// These overrides must precede the dynamic app import (env.ts parses once).
process.env.ADMIN_ACCESS_SECRET = 'HTTP-test-admin-link-secret-0123456789abcdef';
process.env.ADMIN_SESSION_EXPIRES_IN = '12h';

const { app } = await import('../../app.js');
const { generateAccessToken } = await import('../../shared/auth/jwt.js');
const { ensureTestRedis, closeTestRedis } = await import('../../test-utils/redis-test.js');

// The admin link exchange is IP rate-limited through Redis; use the isolated
// test server rather than whatever REDIS_URL happens to point at.
before(async () => {
  await ensureTestRedis();
});

after(async () => {
  const { pool } = await import('../../config/database.js');
  await pool.end();
  await closeTestRedis();
});

const ADMIN_SECRET = process.env.ADMIN_ACCESS_SECRET;

const memberToken = (): string =>
  generateAccessToken({
    memberId: '00000000-0000-4000-8000-000000000000',
    role: 'MEMBER',
    familyId: '00000000-0000-4000-8000-000000000001',
    isFamilyHead: false,
  });

async function createSessionCookie(): Promise<string> {
  const res = await request(app)
    .post('/api/admin/session')
    .send({ secret: ADMIN_SECRET })
    .expect(200);
  const setCookie = res.headers['set-cookie'];
  assert.ok(Array.isArray(setCookie) && setCookie.length > 0);
  return (setCookie[0] as string).split(';')[0];
}

describe('admin link exchange', () => {
  it('rejects an invalid secret', async () => {
    const res = await request(app)
      .post('/api/admin/session')
      .send({ secret: 'wrong-secret' })
      .expect(401);
    assert.equal(res.body.status, 'error');
    assert.match(res.body.message, /invalid admin access link/i);
  });

  it('rejects a missing secret', async () => {
    await request(app).post('/api/admin/session').send({}).expect(400);
  });

  it('establishes an HttpOnly, SameSite=Strict session cookie for a valid link', async () => {
    const res = await request(app)
      .post('/api/admin/session')
      .send({ secret: ADMIN_SECRET })
      .expect(200);

    const setCookie = res.headers['set-cookie'];
    assert.ok(Array.isArray(setCookie) && setCookie.length > 0);
    const cookie = setCookie[0] as string;
    assert.match(cookie, /mm_admin_session=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.match(cookie, /Path=\/api\/admin/i);
    assert.ok(!cookie.includes(ADMIN_SECRET as string), 'secret must not reach the browser');
    assert.deepEqual(res.body.data, { authenticated: true });
  });
});

describe('admin authorization boundary', () => {
  it('rejects unauthenticated admin API requests', async () => {
    await request(app).get('/api/admin/registrations').expect(401);
    await request(app).get('/api/admin/session').expect(401);
    await request(app)
      .post('/api/admin/registrations/00000000-0000-4000-8000-000000000000/approve')
      .expect(401);
  });

  it('rejects a normal member JWT on every admin endpoint', async () => {
    const token = memberToken();
    await request(app)
      .get('/api/admin/session')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    await request(app)
      .get('/api/admin/registrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('validates the admin session cookie on protected endpoints', async () => {
    const cookie = await createSessionCookie();
    const res = await request(app)
      .get('/api/admin/session')
      .set('Cookie', cookie)
      .expect(200);
    assert.deepEqual(res.body.data, { authenticated: true });
  });

  it('rejects state-changing admin requests without the CSRF header', async () => {
    const cookie = await createSessionCookie();
    await request(app)
      .post('/api/admin/registrations/00000000-0000-4000-8000-000000000000/approve')
      .set('Cookie', cookie)
      .expect(403);
  });

  it('does not treat an admin session as a member session', async () => {
    const cookie = await createSessionCookie();
    await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
  });
});
