import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthRepository from '../auth/auth.repository.js';
import * as PaymentRepository from './payment.repository.js';
import * as RazorpayProvider from './razorpay.provider.js';

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
      const created = await PaymentRepository.createPayment({
        familyId: requester.familyId,
        initiatedByMemberId: requester.id,
        year,
        amount,
        currency,
        receipt: generateReceipt(year),
      });

      // Application record first, provider order second. If the provider
      // call fails, the PENDING row stays and a retry creates a new attempt.
      const providerOrder = await RazorpayProvider.createProviderOrder({
        amountPaise: Math.round(created.amount * 100),
        currency: created.currency,
        receipt: created.receipt,
      });
      const payment = await PaymentRepository.updatePaymentProviderOrder(
        created.id,
        providerOrder.id,
      );

      return {
        payment,
        checkout: {
          keyId: RazorpayProvider.getKeyId(),
          orderId: providerOrder.id,
          amountPaise: Math.round(payment.amount * 100),
          currency: payment.currency,
        },
      };
    } catch (error) {
      if (getConstraint(error) === SUCCESS_CONSTRAINT) {
        throw new AppError(
          'Membership fee is already paid for this year',
          409,
        );
      }
      if (error instanceof AppError) {
        throw error;
      }
      if (attempt === RECEIPT_RETRIES - 1) {
        throw error;
      }
      // Otherwise assume a receipt collision and retry with a fresh receipt.
    }
  }

  throw new AppError('Could not create payment order. Please try again', 500);
};

export const verifyPayment = async (
  memberId: string,
  input: { orderId: string; paymentId: string; signature: string },
) => {
  const requester = await AuthRepository.findMemberProfileById(memberId);
  if (!requester) {
    throw new AppError('Member not found', 404);
  }

  // Look up OUR record by the supplied order id, then scope to the family.
  // The order id is only a lookup key — trust comes from the signature.
  const payment = await PaymentRepository.findPaymentByProviderOrderId(
    input.orderId,
  );
  if (!payment || payment.familyId !== requester.familyId) {
    throw new AppError('Payment not found', 404);
  }
  if (payment.providerOrderId !== input.orderId) {
    throw new AppError('Payment not found', 404);
  }

  const valid = RazorpayProvider.verifyPaymentSignature({
    orderId: payment.providerOrderId,
    paymentId: input.paymentId,
    signature: input.signature,
  });
  if (!valid) {
    throw new AppError('Invalid payment signature', 400);
  }

  const updated = await PaymentRepository.transitionPaymentStatus(
    payment.id,
    'AUTHORIZED',
    input.paymentId,
  );
  if (!updated) {
    throw new AppError('Payment not found', 404);
  }
  return updated;
};

interface RazorpayWebhookPaymentEntity {
  id: string;
  order_id: string;
  captured?: boolean;
  status?: string;
}

const resolveWebhookTarget = (
  event: string,
  entity: RazorpayWebhookPaymentEntity,
): 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | null => {
  if (event === 'payment.authorized') return 'AUTHORIZED';
  if (event === 'payment.captured' || event === 'order.paid') return 'CAPTURED';
  if (event === 'payment.failed') return 'FAILED';
  return null;
};

export const handleRazorpayWebhook = async (
  rawBody: Buffer,
  signature: string,
): Promise<{ received: boolean }> => {
  if (!RazorpayProvider.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Invalid webhook signature', 400);
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: RazorpayWebhookPaymentEntity };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new AppError('Invalid webhook payload', 400);
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const target = payload.event
    ? resolveWebhookTarget(payload.event, paymentEntity as RazorpayWebhookPaymentEntity)
    : null;
  if (!target) {
    return { received: true };
  }

  const orderId =
    paymentEntity?.order_id ?? payload.payload?.order?.entity?.id;
  if (!orderId) {
    return { received: true };
  }

  const payment =
    await PaymentRepository.findPaymentByProviderOrderId(orderId);
  if (!payment) {
    return { received: true };
  }

  await PaymentRepository.transitionPaymentStatus(
    payment.id,
    target,
    paymentEntity?.id,
  );
  return { received: true };
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
