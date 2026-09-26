import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AdminRepository from './admin.repository.js';
import type { UpdateMemberInput } from './admin.schema.js';

const toMemberUpdateFields = (
  input: UpdateMemberInput,
): Record<string, string | number | null | undefined> => ({
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

export const listRegistrations = async (limit: number, offset: number) =>
  AdminRepository.findPendingRegistrations(limit, offset);

export const getRegistration = async (familyId: string) => {
  const registration = await AdminRepository.findRegistrationById(familyId);
  if (!registration || registration.family.status !== 'PENDING') {
    throw new AppError('Registration not found', 404);
  }
  return registration;
};

export const approveRegistration = async (
  familyId: string,
  adminMemberId: string,
) => {
  const registration = await AdminRepository.findRegistrationById(familyId);
  if (!registration || registration.family.status !== 'PENDING') {
    throw new AppError('Only pending registrations can be approved', 409);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await AdminRepository.approveRegistration(familyId, adminMemberId, client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const updated = await AdminRepository.findRegistrationById(familyId);
  if (!updated) {
    throw new AppError('Registration not found', 404);
  }
  return updated;
};

export const rejectRegistration = async (familyId: string) => {
  const registration = await AdminRepository.findRegistrationById(familyId);
  if (!registration || registration.family.status !== 'PENDING') {
    throw new AppError('Only pending registrations can be rejected', 409);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await AdminRepository.rejectRegistration(familyId, client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const updated = await AdminRepository.findRegistrationById(familyId);
  if (!updated) {
    throw new AppError('Registration not found', 404);
  }
  return updated;
};

export const listMembers = async (
  status: string | undefined,
  limit: number,
  offset: number,
) => AdminRepository.findMembers(status, limit, offset);

export const getMember = async (memberId: string) => {
  const member = await AdminRepository.findMemberDetailById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  return member;
};

export const updateMember = async (
  memberId: string,
  input: UpdateMemberInput,
) => {
  const existing = await AdminRepository.findMemberDetailById(memberId);
  if (!existing) {
    throw new AppError('Member not found', 404);
  }
  return AdminRepository.updateMember(memberId, toMemberUpdateFields(input));
};

export const updateMemberStatus = async (memberId: string, status: string) => {
  const existing = await AdminRepository.findMemberDetailById(memberId);
  if (!existing) {
    throw new AppError('Member not found', 404);
  }
  return AdminRepository.updateMemberStatus(memberId, status);
};

export const listFamilies = async (
  status: string | undefined,
  limit: number,
  offset: number,
) => AdminRepository.findFamilies(status, limit, offset);

export const getFamily = async (familyId: string) => {
  const registration = await AdminRepository.findRegistrationById(familyId);
  if (!registration) {
    throw new AppError('Family not found', 404);
  }
  return registration;
};

export const updateFamily = async (familyId: string, status: string) => {
  const existing = await AdminRepository.findRegistrationById(familyId);
  if (!existing) {
    throw new AppError('Family not found', 404);
  }
  await AdminRepository.updateFamilyStatus(familyId, status);

  const updated = await AdminRepository.findRegistrationById(familyId);
  if (!updated) {
    throw new AppError('Family not found', 404);
  }
  return updated;
};
