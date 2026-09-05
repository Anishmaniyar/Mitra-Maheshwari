import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env";
import { AppError } from "../../utils/http";
import { logger } from "../../utils/logger";
import * as memberRepository from "../members/member.repository";
import * as paymentRepository from "./payment.repository";
import { toPublicPayment, type PublicPayment } from "./payment.types";
import { paymentWebhookSchema } from "./payment.validation";

export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";

/**
 * Creates a pending membership payment for the caller's family (head only).
 * One payment row per family per year (UNIQUE constraint); an existing
 * pending/paid payment is returned instead of duplicated, and a failed payment
 * is re-armed for retry. Payment always belongs to the family — the family is
 * derived server-side, never from the client.
 */
export async function createMembershipPayment(memberId: number): Promise<PublicPayment> {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new AppError(404, "MEMBER_NOT_FOUND", "Member record not found.");
  if (!member.is_head) {
    throw new AppError(403, "HEAD_ONLY", "Only the family head can make the membership payment.");
  }

  const year = new Date().getFullYear();
  const existing = await paymentRepository.findForYear(member.family_id, year);
  if (existing && existing.status !== "failed") {
    return toPublicPayment(existing);
  }

  const transactionId = randomUUID();
  const payment =
    existing && existing.status === "failed"
      ? await paymentRepository.resetPayment(member.family_id, year, transactionId)
      : await paymentRepository.createPayment({
          familyId: member.family_id,
          year,
          amount: env.MEMBERSHIP_FEE,
          currency: env.CURRENCY,
          transactionMode: "manual",
          transactionId,
        });

  logger.info(`Membership payment created: ${transactionId} (family ${member.family_id}, ${year})`);
  return toPublicPayment(payment!);
}

/** Payment history for the authenticated member's own family. */
export async function listPayments(memberId: number): Promise<PublicPayment[]> {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new AppError(404, "MEMBER_NOT_FOUND", "Member record not found.");
  const rows = await paymentRepository.listByFamily(member.family_id);
  return rows.map(toPublicPayment);
}

/**
 * Verifies the HMAC-SHA256 signature over the raw request body, then applies
 * the gateway's outcome. This is the server-side source of truth — payment
 * success is never accepted from the frontend. Provider-specific signature
 * schemes (Razorpay/Cashfree) plug in here.
 */
export async function handlePaymentWebhook(input: {
  rawBody: string;
  signature: string | undefined;
}): Promise<{ received: boolean; transactionId?: string; status?: string }> {
  const expected = createHmac("sha256", env.WEBHOOK_SECRET).update(input.rawBody).digest("hex");
  const provided = (input.signature ?? "").trim().toLowerCase();

  let providedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(provided, "hex");
  } catch {
    throw new AppError(401, "INVALID_SIGNATURE", "Invalid webhook signature.");
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new AppError(401, "INVALID_SIGNATURE", "Invalid webhook signature.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(input.rawBody);
  } catch {
    throw new AppError(400, "INVALID_PAYLOAD", "Webhook body is not valid JSON.");
  }

  const payloadResult = paymentWebhookSchema.safeParse(raw);
  if (!payloadResult.success) {
    throw new AppError(400, "INVALID_PAYLOAD", "Webhook body is invalid.");
  }
  const payload = payloadResult.data;

  const payment = await paymentRepository.findByTransactionId(payload.transactionId);
  if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "Unknown payment transaction.");

  if (payload.event === "payment.failed") {
    await paymentRepository.setStatus(payment.id, "failed");
    return { received: true, transactionId: payload.transactionId, status: "failed" };
  }

  // payment.paid
  if (payload.amount === undefined || payload.currency === undefined) {
    throw new AppError(400, "PAYMENT_MISMATCH", "Paid event must include amount and currency.");
  }
  if (Number(payment.amount) !== payload.amount || payment.currency !== payload.currency) {
    throw new AppError(400, "PAYMENT_MISMATCH", "Webhook amount/currency does not match the order.");
  }

  await paymentRepository.setStatus(payment.id, "paid");
  logger.info(`Payment ${payment.id} marked paid (${payload.transactionId})`);
  return { received: true, transactionId: payload.transactionId, status: "paid" };
}