import assert from 'node:assert/strict';
import test from 'node:test';
import { mapFamilyMemberRow, mapInvitationRow } from './family.mapper.js';
import type { FamilyMemberDbRow, InvitationDbRow } from './family.mapper.js';

const memberRow: FamilyMemberDbRow = {
  id: 'member-1',
  family_id: 'family-1',
  first_name: 'Asha',
  middle_name: null,
  last_name: 'Sharma',
  mobile: null,
  blood_group: 'B+',
  age: 42,
  occupation: null,
  area: 'Pune',
  is_head: true,
  status: 'APPROVED',
};

test('mapFamilyMemberRow maps all member columns', () => {
  const member = mapFamilyMemberRow(memberRow);

  assert.equal(member.id, 'member-1');
  assert.equal(member.familyId, 'family-1');
  assert.equal(member.firstName, 'Asha');
  assert.equal(member.lastName, 'Sharma');
  assert.equal(member.bloodGroup, 'B+');
  assert.equal(member.age, 42);
  assert.equal(member.area, 'Pune');
  assert.equal(member.isHead, true);
  assert.equal(member.status, 'APPROVED');
});

test('mapFamilyMemberRow normalises missing nullable values to null', () => {
  const member = mapFamilyMemberRow(memberRow);

  assert.equal(member.middleName, null);
  assert.equal(member.mobile, null);
  assert.equal(member.occupation, null);
});

const invitationRow: InvitationDbRow = {
  id: 'invite-1',
  family_id: 'family-1',
  invited_by_member_id: 'member-1',
  invitee_name: 'Ravi Sharma',
  invitee_mobile: '9876543210',
  invitee_email: null,
  token: 'token-abc',
  status: 'PENDING',
  expires_at: new Date('2026-05-01T00:00:00.000Z'),
  accepted_at: null,
};

test('mapInvitationRow maps the invitation used to build the invite link', () => {
  const invitation = mapInvitationRow(invitationRow);

  assert.equal(invitation.familyId, 'family-1');
  assert.equal(invitation.inviteeMobile, '9876543210');
  assert.equal(invitation.token, 'token-abc');
  assert.equal(invitation.status, 'PENDING');
  assert.equal(invitation.acceptedAt, null);
  assert.equal(invitation.expiresAt.getTime(), invitationRow.expires_at.getTime());
});
