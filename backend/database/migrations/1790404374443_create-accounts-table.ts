import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 4/8 — `accounts` is the login identity (members 1 → 1 accounts).
 * One account per member (UNIQUE member_id), one account per mobile
 * (UNIQUE mobile — OTP login keys off this). System roles: ADMIN, MEMBER.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('accounts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    member_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'members(id)',
      onDelete: 'CASCADE',
    },
    mobile: { type: 'text', notNull: true, unique: true },
    role: { type: 'account_role', notNull: true, default: 'MEMBER' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    last_login_at: { type: 'timestamptz' },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('accounts');
}
