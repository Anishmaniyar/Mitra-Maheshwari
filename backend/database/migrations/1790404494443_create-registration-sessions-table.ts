import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 6/8 — Standalone registration progress (no FKs by design: the member
 * and family rows do not exist yet while registration is in flight).
 * Names are NULLABLE: a session starts with just a mobile number.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('registration_sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    mobile: { type: 'text', notNull: true },
    first_name: { type: 'text' },
    middle_name: { type: 'text' },
    last_name: { type: 'text' },
    otp_verified_at: { type: 'timestamptz' },
    expires_at: { type: 'timestamptz', notNull: true },
    completed_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Active-session-by-mobile lookup.
  pgm.createIndex('registration_sessions', 'mobile');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('registration_sessions', 'mobile');
  pgm.dropTable('registration_sessions');
}
