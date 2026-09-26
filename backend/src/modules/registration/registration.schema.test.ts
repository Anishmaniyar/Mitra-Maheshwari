import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { completeRegistrationSchema } from './registration.schema.js';

const validBody = {
  mobile: '9876543210',
  firstName: 'Ramesh',
  lastName: 'Maheshwari',
};

describe('completeRegistrationSchema', () => {
  it('accepts a minimal valid registration', () => {
    const result = completeRegistrationSchema.safeParse(validBody);
    assert.equal(result.success, true);
  });

  it('accepts full details including PAN and blood group', () => {
    const result = completeRegistrationSchema.safeParse({
      ...validBody,
      middleName: 'Kumar',
      bloodGroup: 'B+',
      age: 42,
      occupation: 'Trader',
      area: 'Indore',
      panName: 'Ramesh Maheshwari',
      panNumber: 'abcde1234f',
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.panNumber, 'ABCDE1234F');
    }
  });

  it('rejects missing names, bad mobile, and bad PAN', () => {
    assert.equal(
      completeRegistrationSchema.safeParse({ ...validBody, firstName: '' })
        .success,
      false,
    );
    assert.equal(
      completeRegistrationSchema.safeParse({ ...validBody, mobile: '123' })
        .success,
      false,
    );
    assert.equal(
      completeRegistrationSchema.safeParse({ ...validBody, panNumber: 'XYZ' })
        .success,
      false,
    );
    assert.equal(
      completeRegistrationSchema.safeParse({ ...validBody, age: 200 }).success,
      false,
    );
  });
});
