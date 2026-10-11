import { Redis } from 'ioredis';
import { RedisMemoryServer } from 'redis-memory-server';
import { clearRedisForTests, setRedisForTests } from '../config/redis.js';

// Ephemeral real Redis for tests (redis-memory-server binary; cached after
// the first download). One instance per test *process*: node --test runs
// files in parallel processes, so each file gets an isolated server and
// there is no cross-file key leakage. Never points at development or
// production Redis.

let server: RedisMemoryServer | null = null;
let client: Redis | null = null;

const waitForReady = async (redis: Redis, timeoutMs = 20000): Promise<void> => {
  const start = Date.now();
  for (;;) {
    try {
      await redis.ping();
      return;
    } catch {
      if (Date.now() - start > timeoutMs) {
        throw new Error('test redis did not become ready in time');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
};

export const ensureTestRedis = async (): Promise<Redis> => {
  if (client) {
    return client;
  }
  server = new RedisMemoryServer({ instance: { ip: '127.0.0.1' } });
  const host = await server.getHost();
  const port = await server.getPort();
  const fresh = new Redis(`redis://${host}:${port}`, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
  });
  fresh.on('error', () => {});
  await waitForReady(fresh);
  client = fresh;
  setRedisForTests(client);
  return client;
};

export const flushTestRedis = async (): Promise<void> => {
  const redis = await ensureTestRedis();
  await redis.flushdb();
};

export const testRedisClient = async (): Promise<Redis> => ensureTestRedis();

export const closeTestRedis = async (): Promise<void> => {
  if (client) {
    const current = client;
    client = null;
    clearRedisForTests();
    try {
      await current.quit();
    } catch {
      try {
        current.disconnect();
      } catch {
        // Best effort during teardown.
      }
    }
  }
  if (server) {
    const current = server;
    server = null;
    try {
      await Promise.race([
        current.stop(),
        new Promise((resolve) => setTimeout(resolve, 10000)),
      ]);
    } catch {
      // Best effort during teardown.
    }
  }
};
