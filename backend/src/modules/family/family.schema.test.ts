import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInvitationSchema,
  invitationIdParamsSchema,
  memberIdParamsSchema,
} from './family.schema.js';

describe('createInvitationSchema', () => {
  it('accepts a name-only invitation with default expiry', () => {
    const result = createInvitationSchema.safeParse({ inviteeName: 'Suresh' });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.expiresInDays, 7);
    }
  });

  it('accepts full invitation details', () => {
    const result = createInvitationSchema.safeParse({
      inviteeName: 'Suresh',
      inviteeMobile: '9876543210',
      inviteeEmail: 'suresh@example.com',
      expiresInDays: 3,
    });
    assert.equal(result.success, true);
  });

  it('rejects missing names and invalid contact details', () => {
    assert.equal(createInvitationSchema.safeParse({}).success, false);
    assert.equal(
      createInvitationSchema.safeParse({ inviteeName: 'S', inviteeMobile: '12' })
        .success,
      false,
    );
    assert.equal(
      createInvitationSchema.safeParse({
        inviteeName: 'S',
        inviteeEmail: 'not-an-email',
      }).success,
      false,
    );
  });
});

describe('family param schemas', () => {
  it('accepts UUID params and rejects malformed ids', () => {
    const id = 'c743aea8-cb4d-490b-aac2-b68d9dae17ad';
    assert.equal(memberIdParamsSchema.safeParse({ memberId: id }).success, true);
    assert.equal(memberIdParamsSchema.safeParse({ memberId: 'nope' }).success, false);
    assert.equal(invitationIdParamsSchema.safeParse({ id }).success, true);
    assert.equal(invitationIdParamsSchema.safeParse({ id: 'nope' }).success, false);
  });
});
