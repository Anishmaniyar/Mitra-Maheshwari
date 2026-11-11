import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 11 — At most one *open* payment attempt per family and year.
 *
 * Duplicate Razorpay orders used to be possible: two concurrent "pay" clicks
 * could both pass the "already paid?" check and insert their own PENDING row,
 * creating two gateway orders. The invariant is enforced in the database so
 * `createOrder` can safely reuse the single open attempt.
 *
 * Historical duplicates (from retries/partial failures) are released first so
 * the index can be created on an existing database. The newest attempt per
 * family/year is kept open; older ones are marked FAILED (none of them were
 * ever confirmed by the provider — confirmed rows are AUTHORIZED/CAPTURED and
 * are not part of this set).
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE payments
    SET status = 'FAILED', updated_at = now()
    WHERE status IN ('PENDING', 'ORDER_CREATED')
      AND id NOT IN (
        SELECT DISTINCT ON (family_id, "year") id
        FROM payments
        WHERE status IN ('PENDING', 'ORDER_CREATED')
        ORDER BY family_id, "year", created_at DESC
      )
  `);

  pgm.createIndex('payments', ['family_id', 'year'], {
    name: 'payments_one_open_per_family_year',
    unique: true,
    where: `status IN ('PENDING', 'ORDER_CREATED')`,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('payments', ['family_id', 'year'], {
    name: 'payments_one_open_per_family_year',
  });
}
