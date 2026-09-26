import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 5/8 — OTP attempts (members 1 → many otps).
 * `member_id` is NULLABLE: an OTP can be requested by a mobile with no
 * member row yet (e.g. first step of registration). Only the hash is
 * stored (`code_hash`), never the plain code.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('otps', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    member_id: {
      type: 'uuid',
      references: 'members(id)',
      onDelete: 'CASCADE',
    },
    mobile: { type: 'text', notNull: true },
    code_hash: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    attempts: { type: 'integer', notNull: true, default: 0 },
    max_attempts: { type: 'integer', notNull: true, default: 5 },
    resend_count: { type: 'integer', notNull: true, default: 0 },
    last_sent_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    consumed_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Latest-OTP-by-mobile lookup.
  pgm.createIndex('otps', 'mobile');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('otps', 'mobile');
  pgm.dropTable('otps');
}
