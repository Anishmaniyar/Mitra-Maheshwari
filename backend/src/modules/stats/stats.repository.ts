import { pool } from "../../config/database";
import type { CommunityStats } from "./stats.types";

/**
 * Real community counters, read straight from the database.
 * Counts are cast to int so the driver returns numbers, not bigint strings.
 * `bloodGroupsRecorded` counts members who have a blood group on record — the
 * data the community can act on when a blood request is raised.
 */
export async function countCommunity(): Promise<CommunityStats> {
  const { rows } = await pool.query<CommunityStats>(
    `SELECT
       (SELECT count(*) FROM families)::int AS "families",
       (SELECT count(*) FROM members)::int AS "members",
       (SELECT count(*) FROM members WHERE blood_group IS NOT NULL)::int AS "bloodGroupsRecorded"`,
  );
  return rows[0]!;
}
