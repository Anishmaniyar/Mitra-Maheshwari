import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 1/8 — Foundation.
 * Enables pgcrypto (gen_random_uuid), creates shared enum types,
 * and creates `families`. The member FKs (created_by_member_id,
 * approved_by_member_id) are added in a later migration because
 * `members` does not exist yet (circular dependency).
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createType('family_status', ['PENDING', 'ACTIVE', 'REJECTED']);
  pgm.createType('member_status', ['PENDING', 'APPROVED', 'REJECTED']);
  pgm.createType('account_role', ['ADMIN', 'MEMBER']);
  pgm.createType('invitation_status', [
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'CANCELLED',
  ]);

  pgm.createTable('families', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    family_code: { type: 'text', notNull: true, unique: true },
    status: { type: 'family_status', notNull: true, default: 'PENDING' },
    created_by_member_id: { type: 'uuid' },
    approved_by_member_id: { type: 'uuid' },
    approved_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('families');
  pgm.dropType('invitation_status');
  pgm.dropType('account_role');
  pgm.dropType('member_status');
  pgm.dropType('family_status');
  pgm.dropExtension('pgcrypto');
}
