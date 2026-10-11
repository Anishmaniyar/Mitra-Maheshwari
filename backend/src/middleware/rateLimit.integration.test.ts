import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { Redis } from 'ioredis';
import { setRedisForTests } from '../config/redis.js';
import {
  candidatesIpLimiter,
  otpRequestMobileLimiter,
  refreshIpLimiter,
} from './rateLimit.js';
import { errorHandler } from './error.middleware.js';
import {
  closeTestRedis,
  ensureTestRedis,
  flushTestRedis,
} from '../test-utils/redis-test.js';
// testMobile is randomness only here; these HTTP-level tests touch Redis,
// never the database.
import { testMobile } from '../test-utils/integration-db.js';

after(async () => {
  await closeTestRedis();
});

beforeEach(async () => {
  await ensureTestRedis();
  await flushTestRedis();
});

const okHandler: RequestHandler = (_req, res) => {
  res.status(200).json({ ok: true });
};

const buildApp = (...middlewares: RequestHandler[]) => {
  const app = express();
  app.use(express.json());
  for (const middleware of middlewares) {
    app.use('/t', middleware);
  }
  app.post('/t', okHandler);
  // Same contract as the production app: store failures surface as safe
  // JSON (503) rather than the Express default HTML page.
  app.use(errorHandler);
  return app;
};

describe('distributed rate limiting', () => {
  it('lets legitimate traffic through under the limit', async () => {
    const app = buildApp(refreshIpLimiter);
    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/t').expect(200);
    }
  });

  it('per-IP limiter returns 429 with a safe body and Retry-After', async () => {
    const app = buildApp(candidatesIpLimiter);
    for (let i = 0; i < 60; i += 1) {
      await request(app).post('/t').expect(200);
    }
    const limited = await request(app).post('/t').expect(429);
    assert.equal(limited.body.status, 'error');
    assert.ok(typeof limited.body.message === 'string');
    assert.ok(limited.headers['retry-after'], 'Retry-After header is set');
    assert.ok(
      Number(limited.headers['retry-after']) >= 1,
      'Retry-After is a positive number of seconds',
    );
  });

  it('per-mobile limiter isolates mobiles and normalizes input', async () => {
    const app = buildApp(otpRequestMobileLimiter);
    const mobile = testMobile();
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/t').send({ mobile }).expect(200);
    }
    // Same budget exhausted: padded/whitespace variants count together.
    await request(app).post('/t').send({ mobile: `  ${mobile} ` }).expect(429);
    // A different mobile is unaffected.
    await request(app).post('/t').send({ mobile: testMobile() }).expect(200);
    // An invalid mobile skips the mobile limiter (no 429 from it).
    await request(app).post('/t').send({ mobile: 'not-a-number' }).expect(200);
  });

  it('counters are shared across application instances via Redis', async () => {
    const appA = buildApp(candidatesIpLimiter);
    const appB = buildApp(candidatesIpLimiter);
    for (let i = 0; i < 40; i += 1) {
      await request(appA).post('/t').expect(200);
    }
    for (let i = 0; i < 20; i += 1) {
      await request(appB).post('/t').expect(200);
    }
    // 61st hit overall: the shared counter trips on the second instance.
    await request(appB).post('/t').expect(429);
  });

  it('fails closed with 503 when Redis is unreachable (no silent fallback)', async () => {
    const app = buildApp(refreshIpLimiter);
    await request(app).post('/t').expect(200);

    const dead = new Redis({
      host: '127.0.0.1',
      port: 1,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 500,
      retryStrategy: () => null,
    });
    dead.on('error', () => {});
    setRedisForTests(dead);
    try {
      const res = await request(app).post('/t').expect(503);
      assert.equal(res.body.status, 'error');
      assert.equal(res.body.message, 'Service temporarily unavailable');
    } finally {
      setRedisForTests(await ensureTestRedis());
      dead.disconnect();
    }
  });
});
