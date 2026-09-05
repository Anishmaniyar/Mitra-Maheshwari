import { app } from "./app";
import { env } from "./config/env";
import { closeDatabase } from "./config/database";
import { logger } from "./utils/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`Mitra Maheshwari API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/**
 * Graceful shutdown: stop accepting requests, finish in-flight work, close the
 * PostgreSQL pool, then exit. A hard-exit timer guards against hangs.
 */
function shutdown(signal: string): void {
  logger.warn(`${signal} received — shutting down gracefully`);
  server.close(() => {
    closeDatabase()
      .then(() => {
        logger.info("Shutdown complete");
        process.exit(0);
      })
      .catch((err) => {
        logger.error("Error closing database pool", err);
        process.exit(1);
      });
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));