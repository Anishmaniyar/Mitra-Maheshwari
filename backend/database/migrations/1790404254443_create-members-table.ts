import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 2/8 — `members` belongs to a family (families 1 → many members).
 * `mobile` is NULLABLE: imported community data may have missing or
 * imperfect mobile numbers. Login identity lives in `accounts.mobile`.
 * Family Head is NOT a role: `is_head + family_id` identifies the head,
 * enforced to a single head per family by a partial unique index.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    family_id: {
      type: 'uuid',
      notNull: true,
      references: 'families(id)',
      onDelete: 'RESTRICT',
    },
    first_name: { type: 'text', notNull: true },
    middle_name: { type: 'text' },
    last_name: { type: 'text' },
    mobile: { type: 'text' },
    blood_group: { type: 'text' },
    age: { type: 'integer', check: 'age >= 0' },
    occupation: { type: 'text' },
    area: { type: 'text' },
    pan_name: { type: 'text' },
    pan_number: { type: 'text' },
    is_head: { type: 'boolean', notNull: true, default: false },
    status: { type: 'member_status', notNull: true, default: 'PENDING' },
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

  // Member lookup by mobile during OTP request.
  pgm.createIndex('members', 'mobile');
  pgm.createIndex('members', 'family_id');

  // At most one head per family.
  pgm.createIndex('members', 'family_id', {
    name: 'members_one_head_per_family',
    unique: true,
    where: 'is_head = TRUE',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('members', 'family_id', {
    name: 'members_one_head_per_family',
  });
  pgm.dropIndex('members', 'family_id');
  pgm.dropIndex('members', 'mobile');
  pgm.dropTable('members');
}
