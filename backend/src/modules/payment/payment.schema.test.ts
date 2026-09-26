import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrderSchema,
  paymentIdParamsSchema,
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

describe('paymentIdParamsSchema', () => {
  it('accepts UUIDs and rejects malformed ids', () => {
    const id = 'c743aea8-cb4d-490b-aac2-b68d9dae17ad';
    assert.equal(paymentIdParamsSchema.safeParse({ id }).success, true);
    assert.equal(paymentIdParamsSchema.safeParse({ id: 'nope' }).success, false);
  });
});
