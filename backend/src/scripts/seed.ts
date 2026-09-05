/**
 * Loads clearly fake development data from database/seed/development.sql.
 * Run with: npm run seed
 * Never put real community member data into the repository.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

async function seed(): Promise<void> {
  const file = path.join(__dirname, "..", "..", "database", "seed", "development.sql");
  const sql = await fs.readFile(file, "utf8");
  await pool.query(sql);
  logger.info("Development seed data loaded.");
  logger.info("Demo family head: Rajesh Kumar Mehta — mobile 9876543210");
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    logger.error("Seed failed", err);
    process.exit(1);
  });