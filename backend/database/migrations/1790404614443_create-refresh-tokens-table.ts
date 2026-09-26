import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 8/8 — Refresh-token rotation chain (members 1 → many refresh_tokens).
 * `replaced_by_token_id` is a self-FK so rotation forms an auditable chain;
 * SET NULL keeps history valid if the successor row is ever removed.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    member_id: {
      type: 'uuid',
      notNull: true,
      references: 'members(id)',
      onDelete: 'CASCADE',
    },
    token_hash: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    revoked_at: { type: 'timestamptz' },
    replaced_by_token_id: {
      type: 'uuid',
      references: 'refresh_tokens(id)',
      onDelete: 'SET NULL',
    },
  });

  // Token lookup on every refresh request.
  pgm.createIndex('refresh_tokens', 'token_hash');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('refresh_tokens', 'token_hash');
  pgm.dropTable('refresh_tokens');
}
