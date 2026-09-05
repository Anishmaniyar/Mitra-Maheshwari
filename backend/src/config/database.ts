import { Pool } from "pg";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Single shared connection pool for the whole application. Controllers and
 * services never create their own connections — they use this pool via the
 * repository layer.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", err.message);
});

/** Closes the pool during graceful shutdown. */
export function closeDatabase(): Promise<void> {
  return pool.end();
}