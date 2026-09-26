import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthRepository from '../auth/auth.repository.js';
import * as PaymentRepository from './payment.repository.js';

const RECEIPT_RETRIES = 3;
const SUCCESS_CONSTRAINT = 'payments_one_success_per_family_year';

const getMembershipFee = (): { amount: number; currency: string } => {
  const amount = Number(env.MEMBERSHIP_ANNUAL_FEE_AMOUNT);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Invalid membership fee configuration', 500);
  }
  return { amount, currency: env.MEMBERSHIP_CURRENCY };
};

const generateReceipt = (year: number): string => {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MM-${year}-${suffix}`;
};

const getConstraint = (error: unknown): string | null =>
  typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint: unknown }).constraint)
    : null;

export const createOrder = async (memberId: string) => {
  const requester = await AuthRepository.findMemberProfileById(memberId);
  if (!requester) {
    throw new AppError('Member not found', 404);
  }
  if (!requester.isHead) {
    throw new AppError('Only the Family Head can initiate payment', 403);
  }

  // Family, year, and amount all come from the backend — never the frontend.
  const year = new Date().getFullYear();
  const { amount, currency } = getMembershipFee();

  const alreadyPaid = await PaymentRepository.findSuccessfulPaymentByFamilyAndYear(
    requester.familyId,
    year,
  );
  if (alreadyPaid) {
    throw new AppError('Membership fee is already paid for this year', 409);
  }

  for (let attempt = 0; attempt < RECEIPT_RETRIES; attempt += 1) {
    try {
      return await PaymentRepository.createPayment({
        familyId: requester.familyId,
        initiatedByMemberId: requester.id,
        year,
        amount,
        currency,
        receipt: generateReceipt(year),
      });
    } catch (error) {
      if (getConstraint(error) === SUCCESS_CONSTRAINT) {
        throw new AppError(
          'Membership fee is already paid for this year',
          409,
        );
      }
      if (attempt === RECEIPT_RETRIES - 1) {
        throw error;
      }
      // Otherwise assume a receipt collision and retry with a fresh receipt.
    }
  }

  throw new AppError('Could not create payment order. Please try again', 500);
};

export const listPayments = async (memberId: string) => {
  const requester = await AuthRepository.findMemberProfileById(memberId);
  if (!requester) {
    throw new AppError('Member not found', 404);
  }

  return PaymentRepository.findPaymentsByFamilyId(requester.familyId);
};

export const getPayment = async (memberId: string, paymentId: string) => {
  const requester = await AuthRepository.findMemberProfileById(memberId);
  if (!requester) {
    throw new AppError('Member not found', 404);
  }

  const payment = await PaymentRepository.findPaymentById(paymentId);
  if (!payment || payment.familyId !== requester.familyId) {
    throw new AppError('Payment not found', 404);
  }

  return payment;
};
