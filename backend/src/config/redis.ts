import { Redis } from 'ioredis';
import { env } from './env.js';
import { AppError } from '../shared/errors/appError.js';

// Shared Redis deployment for OTP challenges and rate-limit counters.
// Required infrastructure: callers fail closed (503) when Redis is
// unreachable. There is intentionally no in-memory or PostgreSQL fallback.

// Test seam: integration tests inject an ephemeral client (see
// test-utils/redis-test.ts) instead of relying on import-time REDIS_URL.
let singleton: Redis | null = null;
let testOverride: Redis | null = null;

export const setRedisForTests = (client: Redis): void => {
  testOverride = client;
};

export const clearRedisForTests = (): void => {
  testOverride = null;
};

const createClient = (): Redis => {
  const useTls = env.REDIS_TLS === 'true' || env.REDIS_URL.startsWith('rediss://');
  const client = new Redis(env.REDIS_URL, {
    connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
    // Fail fast while disconnected so OTP/rate-limit paths return 503
    // instead of hanging until a timeout. Reconnection is still retried in
    // the background for the next request.
    enableOfflineQueue: false,
    enableReadyCheck: true,
    maxRetriesPerRequest: 1,
    ...(useTls ? { tls: {} } : {}),
  });

  // ioredis emits 'error' on connection failures; without a listener the
  // process throws. Log a redacted one-liner (never the URL/credentials).
  client.on('error', () => {
    if (env.NODE_ENV !== 'production') {
      console.error('[redis] connection error (see REDIS_URL host, credentials redacted)');
    }
  });

  return client;
};

export const getRedis = (): Redis => {
  if (testOverride) {
    return testOverride;
  }
  if (!singleton) {
    singleton = createClient();
  }
  return singleton;
};

// Startup gate: wait until Redis answers (the client connects
// asynchronously, so the first request would otherwise race it and fail).
// Throws within a bounded time so boot fails loudly instead of serving 503s.
export const testRedisConnection = async (timeoutMs = 15000): Promise<void> => {
  const client = getRedis();
  const start = Date.now();
  for (;;) {
    try {
      await client.ping();
      console.log('Redis connected successfully');
      return;
    } catch {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Redis did not become ready in time (see REDIS_URL)');
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
};

export const closeRedis = async (): Promise<void> => {  if (singleton) {
    const client = singleton;
    singleton = null;
    try {
      await client.quit();
    } catch {
      // Best effort during shutdown.
    }
  }
};

// Maps any Redis failure to a safe 503. The message is intentionally
// constant: 5xx responses are returned verbatim outside production, and 503
// messages are returned verbatim everywhere, so raw driver errors (which
// may contain host details) must never propagate to callers.
export const toRedisUnavailableError = (error: unknown): AppError => {
  if (env.NODE_ENV !== 'production') {
    console.error('[redis] command failed:', (error as Error)?.message ?? error);
  }
  return new AppError('Service temporarily unavailable', 503);
};
