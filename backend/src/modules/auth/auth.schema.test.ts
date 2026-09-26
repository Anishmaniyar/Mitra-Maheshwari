import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requestOtpSchema, verifyOtpSchema } from './auth.schema.js';

describe('requestOtpSchema', () => {
  it('accepts a valid 10-digit mobile number', () => {
    const result = requestOtpSchema.safeParse({ mobile: '9876543210' });
    assert.equal(result.success, true);
  });

  it('rejects an invalid mobile number', () => {
    assert.equal(requestOtpSchema.safeParse({ mobile: '123' }).success, false);
    assert.equal(requestOtpSchema.safeParse({ mobile: '' }).success, false);
    assert.equal(requestOtpSchema.safeParse({}).success, false);
  });
});

describe('verifyOtpSchema', () => {
  it('accepts a valid mobile and 6-digit code', () => {
    const result = verifyOtpSchema.safeParse({
      mobile: '9876543210',
      code: '123456',
    });
    assert.equal(result.success, true);
  });

  it('rejects malformed codes', () => {
    assert.equal(
      verifyOtpSchema.safeParse({ mobile: '9876543210', code: '12345' }).success,
      false,
    );
    assert.equal(
      verifyOtpSchema.safeParse({ mobile: '9876543210', code: 'abcdef' }).success,
      false,
    );
  });
});
