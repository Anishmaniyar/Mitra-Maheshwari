import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 12 — At most one PENDING invitation per family + mobile.
 *
 * Creating an invitation is idempotent in the service, and this index closes
 * the concurrent-request window: if two requests race, only one row can exist
 * and the loser re-reads the winner instead of issuing a duplicate link.
 *
 * Older duplicate pending invitations are cancelled first (the newest link per
 * family/mobile is kept). Name-only invitations (invitee_mobile IS NULL) are
 * unaffected: NULLs are distinct in a unique index.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE family_invitations
    SET status = 'CANCELLED'
    WHERE status = 'PENDING'
      AND invitee_mobile IS NOT NULL
      AND id NOT IN (
        SELECT DISTINCT ON (family_id, invitee_mobile) id
        FROM family_invitations
        WHERE status = 'PENDING' AND invitee_mobile IS NOT NULL
        ORDER BY family_id, invitee_mobile, created_at DESC
      )
  `);

  pgm.createIndex('family_invitations', ['family_id', 'invitee_mobile'], {
    name: 'family_invitations_one_pending_per_mobile',
    unique: true,
    where: `status = 'PENDING' AND invitee_mobile IS NOT NULL`,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('family_invitations', ['family_id', 'invitee_mobile'], {
    name: 'family_invitations_one_pending_per_mobile',
  });
}
