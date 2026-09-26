import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * 9/8 — Family-level membership payment record.
 * The application owns this row; Razorpay (provider) is only referenced,
 * never the source of truth. No provider integration in this migration.
 *
 * Duplicate-success protection is a PARTIAL unique index, not a blanket
 * (family_id, year) unique: PENDING/FAILED attempts may retry freely,
 * but only one AUTHORIZED/CAPTURED payment can exist per family per year.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('payment_status', [
    'PENDING',
    'ORDER_CREATED',
    'AUTHORIZED',
    'CAPTURED',
    'FAILED',
    'REFUNDED',
  ]);

  pgm.createTable('payments', {
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
    initiated_by_member_id: {
      type: 'uuid',
      references: 'members(id)',
      onDelete: 'SET NULL',
    },
    year: {
      type: 'integer',
      notNull: true,
      check: 'year >= 2000 AND year <= 2100',
    },
    amount: {
      type: 'numeric(10,2)',
      notNull: true,
      check: 'amount > 0',
    },
    currency: { type: 'text', notNull: true, default: 'INR' },
    status: { type: 'payment_status', notNull: true, default: 'PENDING' },
    provider: { type: 'text', notNull: true, default: 'razorpay' },
    provider_order_id: { type: 'text', unique: true },
    provider_payment_id: { type: 'text', unique: true },
    receipt: { type: 'text', notNull: true, unique: true },
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

  pgm.createIndex('payments', 'family_id');

  pgm.createIndex('payments', ['family_id', 'year'], {
    name: 'payments_one_success_per_family_year',
    unique: true,
    where: "status IN ('AUTHORIZED', 'CAPTURED')",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('payments', ['family_id', 'year'], {
    name: 'payments_one_success_per_family_year',
  });
  pgm.dropIndex('payments', 'family_id');
  pgm.dropTable('payments');
  pgm.dropType('payment_status');
}
