import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';

// Razorpay provider isolation: all Razorpay-specific mechanics live here.
// The service decides when to call these; nothing here knows about
// families, members, or application payment states.

let client: Razorpay | null = null;

const getClient = (): Razorpay => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Payment provider is not configured', 500);
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

export const getKeyId = (): string => {
  if (!env.RAZORPAY_KEY_ID) {
    throw new AppError('Payment provider is not configured', 500);
  }
  return env.RAZORPAY_KEY_ID;
};

export const createProviderOrder = async (input: {
  amountPaise: number;
  currency: string;
  receipt: string;
}): Promise<{ id: string }> => {
  try {
    const order = await getClient().orders.create({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
    });
    return { id: order.id };
  } catch {
    throw new AppError('Payment provider unavailable', 502);
  }
};

const safeEqualHex = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
};

export const verifyPaymentSignature = (input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  if (!env.RAZORPAY_KEY_SECRET) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');
  return safeEqualHex(expected, input.signature);
};

export const verifyWebhookSignature = (
  rawBody: Buffer | string,
  signature: string,
): boolean => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return safeEqualHex(expected, signature);
};
