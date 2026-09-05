/**
 * Applies pending SQL migrations from database/migrations in filename order.
 * Applied migrations are recorded in a schema_migrations table; each migration
 * runs inside its own transaction. Run with: npm run migrate
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

async function migrate(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );

  const dir = path.join(__dirname, "..", "..", "database", "migrations");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
    if ((applied.rowCount ?? 0) > 0) {
      logger.info(`Skipping ${file} (already applied)`);
      continue;
    }

    const sql = await fs.readFile(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      logger.info(`Applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    logger.error("Migration failed", err);
    process.exit(1);
  });