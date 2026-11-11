import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 13 — Retire the legacy PostgreSQL OTP table.
 *
 * OTP challenges, attempt counting, resend caps, and the single-use
 * verification proof all live in Redis (see src/modules/auth/otpChallenge.store.ts
 * and docs/redis.md). The `otps` table has not been written to since that
 * migration: keeping it meant dead columns plus hashed codes with no owner.
 * Redis is now the single source of truth.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('otps');
}

/** Restores the final legacy shape (used only by a rollback). */
export async function down(pgm: MigrationBuilder): Promise<void> {
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
    purpose: { type: 'text' },
    used_at: { type: 'timestamptz' },
    used_for: { type: 'text' },
  });
  pgm.createIndex('otps', 'mobile');
}
