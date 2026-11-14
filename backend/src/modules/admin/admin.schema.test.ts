import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adminSessionSchema,
  paginationQuerySchema,
  registrationIdParamsSchema,
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
      paginationQuerySchema.safeParse({ limit: '10', offset: '5' }).success,
      true,
    );
    assert.equal(paginationQuerySchema.safeParse({ limit: '0' }).success, false);
  });
});

describe('admin link schemas', () => {
  it('requires a non-empty secret and rejects oversized input', () => {
    assert.equal(adminSessionSchema.safeParse({ secret: 'abc' }).success, true);
    assert.equal(adminSessionSchema.safeParse({ secret: '   ' }).success, false);
    assert.equal(adminSessionSchema.safeParse({}).success, false);
    assert.equal(
      adminSessionSchema.safeParse({ secret: 'x'.repeat(513) }).success,
      false,
    );
  });

  it('validates registration ids as UUIDs', () => {
    assert.equal(
      registrationIdParamsSchema.safeParse({
        id: '00000000-0000-4000-8000-000000000000',
      }).success,
      true,
    );
    assert.equal(registrationIdParamsSchema.safeParse({ id: 'nope' }).success, false);
  });
});
