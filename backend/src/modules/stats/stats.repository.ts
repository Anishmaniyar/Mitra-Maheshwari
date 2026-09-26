import { pool } from '../../config/database.js';

export interface CommunityStats {
  families: number;
  members: number;
  bloodGroupsRecorded: number;
}

// Public directory counters: approved records only, no personal data.
export const getCommunityStats = async (): Promise<CommunityStats> => {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM families WHERE status = 'ACTIVE') AS families,
       (SELECT COUNT(*)::int FROM members WHERE status = 'APPROVED') AS members,
       (SELECT COUNT(*)::int FROM members
        WHERE status = 'APPROVED' AND blood_group IS NOT NULL) AS "bloodGroupsRecorded"`,
  );

  const row = result.rows[0];
  return {
    families: row.families as number,
    members: row.members as number,
    bloodGroupsRecorded: row.bloodGroupsRecorded as number,
  };
};
