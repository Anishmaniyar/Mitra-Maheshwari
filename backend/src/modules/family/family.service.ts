import crypto from 'node:crypto';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthRepository from '../auth/auth.repository.js';
import * as RegistrationRepository from '../registration/registration.repository.js';
import * as FamilyRepository from './family.repository.js';
import type { CreateInvitationInput } from './family.schema.js';
import type {
  AcceptInvitationInput,
  UpdateFamilyMemberInput,
} from './family.schema.js';

const OTP_PROOF_WINDOW_MINUTES = 15;

const loadRequester = async (
  memberId: string,
): Promise<AuthRepository.MemberProfile> => {
  const profile = await AuthRepository.findMemberProfileById(memberId);
  if (!profile) {
    throw new AppError('Member not found', 404);
  }
  return profile;
};

const requireHead = (profile: AuthRepository.MemberProfile): void => {
  if (!profile.isHead) {
    throw new AppError('Only the Family Head can perform this action', 403);
  }
};

export const getOwnFamily = async (memberId: string) => {
  const requester = await loadRequester(memberId);

  const family = await FamilyRepository.findFamilyById(requester.familyId);
  if (!family) {
    throw new AppError('Family not found', 404);
  }
  const members = await FamilyRepository.findFamilyMembers(requester.familyId);

  return { family, members };
};

export const getFamilyMember = async (memberId: string, targetMemberId: string) => {
  const requester = await loadRequester(memberId);

  const target = await FamilyRepository.findFamilyMemberById(targetMemberId);
  if (!target || target.familyId !== requester.familyId) {
    throw new AppError('Member not found', 404);
  }

  return target;
};

export const createInvitation = async (
  memberId: string,
  input: CreateInvitationInput,
) => {
  const requester = await loadRequester(memberId);
  requireHead(requester);

  const invitation = await FamilyRepository.createInvitation({
    familyId: requester.familyId,
    invitedByMemberId: requester.id,
    inviteeName: input.inviteeName,
    inviteeMobile: input.inviteeMobile,
    inviteeEmail: input.inviteeEmail,
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
  });

  return invitation;
};

export const listInvitations = async (memberId: string) => {
  const requester = await loadRequester(memberId);
  requireHead(requester);

  return FamilyRepository.findInvitationsByFamilyId(requester.familyId);
};

export const cancelInvitation = async (
  memberId: string,
  invitationId: string,
) => {
  const requester = await loadRequester(memberId);
  requireHead(requester);

  const invitation = await FamilyRepository.findInvitationById(invitationId);
  if (!invitation || invitation.familyId !== requester.familyId) {
    throw new AppError('Invitation not found', 404);
  }
  if (invitation.status !== 'PENDING') {
    throw new AppError('Only pending invitations can be cancelled', 409);
  }

  await FamilyRepository.cancelInvitation(invitation.id);

  return { ...invitation, status: 'CANCELLED' };
};

export const removeFamilyMember = async (
  memberId: string,
  targetMemberId: string,
) => {
  const requester = await loadRequester(memberId);
  requireHead(requester);

  const target = await FamilyRepository.findFamilyMemberById(targetMemberId);
  if (!target || target.familyId !== requester.familyId) {
    throw new AppError('Member not found', 404);
  }
  if (target.id === requester.id) {
    throw new AppError('Family Head cannot remove themselves', 403);
  }
  if (target.isHead) {
    throw new AppError('The Family Head cannot be removed', 403);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await FamilyRepository.cancelSentInvitationsByInviter(target.id, client);
    await FamilyRepository.deleteMemberById(target.id, client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { removedMemberId: target.id };
};

const loadUsableInvitation = async (
  token: string,
): Promise<FamilyRepository.InvitationRow> => {
  const invitation = await FamilyRepository.findInvitationByToken(token);
  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }
  if (invitation.status === 'ACCEPTED') {
    throw new AppError('Invitation has already been accepted', 409);
  }
  if (invitation.status === 'CANCELLED') {
    throw new AppError('Invitation has been cancelled', 410);
  }
  if (invitation.status !== 'PENDING') {
    throw new AppError('Invitation is no longer valid', 410);
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    await FamilyRepository.markInvitationExpired(invitation.id);
    throw new AppError('Invitation has expired', 410);
  }
  return invitation;
};

export const validateInvitation = async (token: string) => {
  const invitation = await loadUsableInvitation(token);
  const family = await FamilyRepository.findFamilyById(invitation.familyId);

  return {
    inviteeName: invitation.inviteeName,
    familyCode: family?.familyCode ?? null,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
  };
};

export const acceptInvitation = async (
  token: string,
  input: AcceptInvitationInput,
) => {
  const invitation = await loadUsableInvitation(token);

  if (
    invitation.inviteeMobile &&
    invitation.inviteeMobile !== input.mobile
  ) {
    throw new AppError(
      'This invitation was sent to a different mobile number',
      403,
    );
  }

  const proofSince = new Date(Date.now() - OTP_PROOF_WINDOW_MINUTES * 60 * 1000);
  const proof = await RegistrationRepository.findRecentConsumedOtpByMobile(
    input.mobile,
    proofSince,
  );
  if (!proof) {
    throw new AppError('Please verify your mobile number with an OTP first', 401);
  }

  const existing = await AuthRepository.findAuthIdentityByMobile(input.mobile);
  if (existing) {
    throw new AppError(
      'This mobile number is already registered. Please log in',
      409,
    );
  }

  // The invitation fixes the target family: the invitee can never choose,
  // change, or create a family here, and never becomes head (is_head FALSE).
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const member = await FamilyRepository.createFamilyMember(
      {
        familyId: invitation.familyId,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        mobile: input.mobile,
        bloodGroup: input.bloodGroup,
        age: input.age,
        occupation: input.occupation,
        area: input.area,
        panName: input.panName,
        panNumber: input.panNumber,
      },
      client,
    );
    await FamilyRepository.createMemberAccount(
      { memberId: member.id, mobile: input.mobile },
      client,
    );
    await FamilyRepository.acceptInvitation(invitation.id, client);
    await client.query('COMMIT');

    return {
      memberId: member.id,
      familyId: member.familyId,
      status: 'APPROVED',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateFamilyMember = async (
  memberId: string,
  targetMemberId: string,
  input: UpdateFamilyMemberInput,
) => {
  const requester = await loadRequester(memberId);

  const target = await FamilyRepository.findFamilyMemberById(targetMemberId);
  if (!target || target.familyId !== requester.familyId) {
    throw new AppError('Member not found', 404);
  }
  if (!requester.isHead && target.id !== requester.id) {
    throw new AppError('Members can only update their own profile', 403);
  }

  return FamilyRepository.updateFamilyMember(target.id, {
    first_name: input.firstName,
    middle_name: input.middleName,
    last_name: input.lastName,
    blood_group: input.bloodGroup,
    age: input.age,
    occupation: input.occupation,
    area: input.area,
    pan_name: input.panName,
    pan_number: input.panNumber,
  });
};
