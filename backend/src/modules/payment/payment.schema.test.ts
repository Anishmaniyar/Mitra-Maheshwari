import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrderSchema,
  paymentIdParamsSchema,
  verifyPaymentSchema,
} from './payment.schema.js';

describe('createOrderSchema', () => {
  it('accepts an empty body and rejects frontend-supplied fields', () => {
    assert.equal(createOrderSchema.safeParse({}).success, true);
    assert.equal(
      createOrderSchema.safeParse({ amount: 1, family_id: 'x' }).success,
      false,
    );
  });
});

describe('verifyPaymentSchema', () => {
  it('accepts Razorpay checkout fields and rejects blanks', () => {
    assert.equal(
      verifyPaymentSchema.safeParse({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig',
      }).success,
      true,
    );
    assert.equal(
      verifyPaymentSchema.safeParse({
        razorpay_order_id: '',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig',
      }).success,
      false,
    );
  });
});
describe('paymentIdParamsSchema', () => {
  it('accepts UUIDs and rejects malformed ids', () => {
    const id = 'c743aea8-cb4d-490b-aac2-b68d9dae17ad';
    assert.equal(paymentIdParamsSchema.safeParse({ id }).success, true);
    assert.equal(paymentIdParamsSchema.safeParse({ id: 'nope' }).success, false);
  });
});
