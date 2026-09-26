import crypto from 'node:crypto';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthRepository from '../auth/auth.repository.js';
import * as FamilyRepository from './family.repository.js';
import type { CreateInvitationInput } from './family.schema.js';

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
