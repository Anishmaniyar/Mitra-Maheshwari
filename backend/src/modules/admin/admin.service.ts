import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AdminRepository from './admin.repository.js';

export const listRegistrations = async (limit: number, offset: number) =>
  AdminRepository.findPendingRegistrations(limit, offset);

export const getRegistration = async (familyId: string) => {
  const registration = await AdminRepository.findRegistrationById(familyId);
  if (!registration || registration.family.status !== 'PENDING') {
    throw new AppError('Registration not found', 404);
  }
  return registration;
};

export const approveRegistration = async (familyId: string) => {
  const registration = await AdminRepository.findRegistrationById(familyId);
  if (!registration || registration.family.status !== 'PENDING') {
    throw new AppError('Only pending registrations can be approved', 409);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await AdminRepository.approveRegistration(familyId, client);
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
