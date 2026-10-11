import type { Server } from 'node:http';
import { app } from './app.js';
import { pool, testDatabaseConnection } from './config/database.js';
import { closeRedis, testRedisConnection } from './config/redis.js';
import { env } from './config/env.js';

let server: Server | null = null;
let shuttingDown = false;

const startServer = async (): Promise<void> => {
  await testDatabaseConnection();
  await testRedisConnection();

  const port = Number(env.PORT);
  server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

// Bounded graceful shutdown: stop accepting new connections, let in-flight
// requests finish within SHUTDOWN_TIMEOUT_MS, then release Redis + Postgres
// and exit. A repeated signal forces an immediate exit. The guard keeps
// cleanup from running twice (double pool.end() / quit() races).
const shutdown = (signal: string, exitCode: number): void => {
  if (shuttingDown) {
    console.error(`Received ${signal} during shutdown; exiting immediately`);
    process.exit(1);
  }
  shuttingDown = true;
  console.log(`Received ${signal}; draining connections…`);

  const force = setTimeout(() => {
    console.error('Graceful shutdown timed out; exiting');
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  // Don't let the force timer itself hold the process open.
  force.unref();

  const finish = async (): Promise<void> => {
    clearTimeout(force);
    try {
      await closeRedis();
      await pool.end();
    } catch (error) {
      console.error('Error during shutdown cleanup:', error);
    }
    process.exit(exitCode);
  };

  if (!server) {
    void finish();
    return;
  }
  server.close(() => {
    void finish();
  });
  // Idle keep-alive connections must not stall the drain; in-flight
  // requests still run to completion.
  server.closeIdleConnections();
};

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => shutdown(signal, 0));
}

// An unknown corrupted state must never keep serving traffic: log and exit
// instead of limping on. Orchestrators restart the process.
process.on('uncaughtException', (error: unknown) => {
  console.error('Uncaught exception; exiting:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled rejection; exiting:', reason);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
