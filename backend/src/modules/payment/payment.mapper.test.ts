import assert from 'node:assert/strict';
import test from 'node:test';
import { mapPaymentRow } from './payment.mapper.js';
import type { PaymentDbRow } from './payment.mapper.js';

const baseRow: PaymentDbRow = {
  id: 'payment-1',
  family_id: 'family-1',
  initiated_by_member_id: 'member-1',
  year: 2026,
  amount: '1100.00',
  currency: 'INR',
  status: 'AUTHORIZED',
  provider: 'razorpay',
  provider_order_id: 'order_ABC123',
  provider_payment_id: 'pay_XYZ789',
  receipt: 'MM-2026-ABC123',
  created_at: new Date('2026-04-01T10:00:00.000Z'),
  updated_at: new Date('2026-04-01T10:05:00.000Z'),
};

test('mapPaymentRow maps snake_case columns to the domain shape', () => {
  const payment = mapPaymentRow(baseRow);

  assert.equal(payment.id, 'payment-1');
  assert.equal(payment.familyId, 'family-1');
  assert.equal(payment.initiatedByMemberId, 'member-1');
  assert.equal(payment.providerOrderId, 'order_ABC123');
  assert.equal(payment.providerPaymentId, 'pay_XYZ789');
  assert.equal(payment.receipt, 'MM-2026-ABC123');
  assert.equal(payment.createdAt.getTime(), baseRow.created_at.getTime());
});

test('mapPaymentRow coerces the NUMERIC amount to a number', () => {
  const payment = mapPaymentRow({ ...baseRow, amount: '1100.50' });

  assert.equal(typeof payment.amount, 'number');
  assert.equal(payment.amount, 1100.5);
});

test('mapPaymentRow keeps nullable columns null instead of undefined', () => {
  const payment = mapPaymentRow({
    ...baseRow,
    initiated_by_member_id: null,
    provider_order_id: null,
    provider_payment_id: null,
  });

  assert.equal(payment.initiatedByMemberId, null);
  assert.equal(payment.providerOrderId, null);
  assert.equal(payment.providerPaymentId, null);
});
