import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 3/8 — Closes the families ↔ members circular dependency.
 * Both columns stay NULLABLE (a PENDING family has no approver yet)
 * and use ON DELETE SET NULL so member removal never orphans a family row.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(
    'families',
    'families_created_by_member_id_fkey',
    {
      foreignKeys: {
        columns: 'created_by_member_id',
        references: 'members(id)',
        onDelete: 'SET NULL',
      },
    },
  );

  pgm.addConstraint(
    'families',
    'families_approved_by_member_id_fkey',
    {
      foreignKeys: {
        columns: 'approved_by_member_id',
        references: 'members(id)',
        onDelete: 'SET NULL',
      },
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    'families',
    'families_approved_by_member_id_fkey',
  );
  pgm.dropConstraint(
    'families',
    'families_created_by_member_id_fkey',
  );
}
