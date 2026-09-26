import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  membersQuerySchema,
  paginationQuerySchema,
  updateFamilySchema,
  updateMemberSchema,
  updateMemberStatusSchema,
} from './admin.schema.js';

describe('admin pagination schemas', () => {
  it('applies defaults and coerces query strings', () => {
    const result = paginationQuerySchema.safeParse({});
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 20);
      assert.equal(result.data.offset, 0);
    }
    assert.equal(
      membersQuerySchema.safeParse({ limit: '10', status: 'PENDING' }).success,
      true,
    );
    assert.equal(
      membersQuerySchema.safeParse({ status: 'BOGUS' }).success,
      false,
    );
  });
});

describe('admin update schemas', () => {
  it('accepts partial member updates and status changes', () => {
    assert.equal(
      updateMemberSchema.safeParse({ occupation: 'Trader', age: null }).success,
      true,
    );
    assert.equal(updateMemberSchema.safeParse({}).success, true);
    assert.equal(
      updateMemberStatusSchema.safeParse({ status: 'APPROVED' }).success,
      true,
    );
    assert.equal(
      updateMemberStatusSchema.safeParse({ status: 'BOGUS' }).success,
      false,
    );
    assert.equal(updateFamilySchema.safeParse({ status: 'ACTIVE' }).success, true);
    assert.equal(updateFamilySchema.safeParse({}).success, false);
  });
});
