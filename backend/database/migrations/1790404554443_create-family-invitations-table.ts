import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 7/8 — Invites to join a family (families 1 → many invitations;
 * members 1 → many invitations as inviter). Contact fields are NULLABLE:
 * an invite may target a name + token link before a mobile/email is known.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('family_invitations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    family_id: {
      type: 'uuid',
      notNull: true,
      references: 'families(id)',
      onDelete: 'CASCADE',
    },
    invited_by_member_id: {
      type: 'uuid',
      notNull: true,
      references: 'members(id)',
    },
    invitee_name: { type: 'text', notNull: true },
    invitee_mobile: { type: 'text' },
    invitee_email: { type: 'text' },
    token: { type: 'text', notNull: true, unique: true },
    status: {
      type: 'invitation_status',
      notNull: true,
      default: 'PENDING',
    },
    expires_at: { type: 'timestamptz', notNull: true },
    accepted_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('family_invitations', 'family_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('family_invitations', 'family_id');
  pgm.dropTable('family_invitations');
}
