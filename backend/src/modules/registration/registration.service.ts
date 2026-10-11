import crypto from 'node:crypto';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthRepository from '../auth/auth.repository.js';
import { claimVerificationProof } from '../auth/otpChallenge.store.js';
import * as RegistrationRepository from './registration.repository.js';
import type { CandidateQuery, CompleteRegistrationInput } from './registration.schema.js';

const FAMILY_CODE_RETRIES = 3;

export interface CompletedRegistration {
  familyId: string;
  familyCode: string;
  memberId: string;
  accountId: string;
  status: 'PENDING';
}

const generateFamilyCode = (): string => {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MM-${new Date().getFullYear()}-${suffix}`;
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === '23505';

export const findCandidates = async (query: CandidateQuery) => {
  const candidates =
    await RegistrationRepository.findCandidateMembersByName(
      query.firstName,
      query.lastName,
    );

  return candidates.map((candidate) => ({
    id: candidate.id,
    firstName: candidate.firstName,
    middleName: candidate.middleName,
    lastName: candidate.lastName,
  }));
};

export const completeRegistration = async (
  input: CompleteRegistrationInput,
): Promise<CompletedRegistration> => {
  // Single-use, flow-bound proof: the mobile must have completed OTP
  // verification for REGISTRATION within the proof window. The Redis proof
  // is issued atomically at verify time and claimed here exactly once, so
  // it cannot complete another registration or an invitation. A LOGIN proof
  // (or any already-claimed proof) is rejected.
  const proofClaimed = await claimVerificationProof(input.mobile, 'REGISTRATION');
  if (!proofClaimed) {
    throw new AppError('Please verify your mobile number with an OTP first', 401);
  }

  const existing = await AuthRepository.findAuthIdentityByMobile(input.mobile);
  if (existing) {
    throw new AppError(
      'This mobile number is already registered. Please log in',
      409,
    );
  }

  // Candidate lookup by name is informational only: a name match is never
  // identity proof, so it cannot approve or link anything. Possible duplicates
  // are reconciled by an admin at approval time.
  await RegistrationRepository.findCandidateMembersByName(
    input.firstName,
    input.lastName,
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let family: RegistrationRepository.CreatedFamily | null = null;
    for (let attempt = 0; attempt < FAMILY_CODE_RETRIES; attempt += 1) {
      try {
        family = await RegistrationRepository.createFamily(
          { familyCode: generateFamilyCode(), status: 'PENDING' },
          client,
        );
        break;
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === FAMILY_CODE_RETRIES - 1) {
          throw error;
        }
      }
    }
    if (!family) {
      throw new AppError('Could not create family. Please try again', 500);
    }

    let member: RegistrationRepository.CreatedMember;
    let account: RegistrationRepository.CreatedAccount;
    try {
      member = await RegistrationRepository.createMember(
        {
          familyId: family.id,
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
          isHead: true,
          status: 'PENDING',
        },
        client,
      );

      account = await RegistrationRepository.createAccount(
        { memberId: member.id, mobile: input.mobile },
        client,
      );
    } catch (error) {
      // Lost a concurrent double-submit (duplicate mobile): fail safe, roll back.
      if (isUniqueViolation(error)) {
        throw new AppError(
          'This mobile number is already registered. Please log in',
          409,
        );
      }
      throw error;
    }

    await client.query('COMMIT');

    return {
      familyId: family.id,
      familyCode: family.familyCode,
      memberId: member.id,
      accountId: account.id,
      status: 'PENDING',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
