import { AppError } from "../../utils/http";
import { signAuthToken } from "../../utils/jwt";
import { logger } from "../../utils/logger";
import { maskMobile, normalizeMobile } from "../../utils/mobile";
import * as memberRepository from "../members/member.repository";
import { toPublicMember, type PublicMember } from "../members/member.types";
import * as authRepository from "./auth.repository";
import * as otpService from "./otp.service";

function assertMemberMatches(member: { mobile: string }, normalized: string): void {
  if (member.mobile !== normalized) {
    throw new AppError(400, "MOBILE_MISMATCH", "This mobile number does not match the member record.");
  }
}

async function loadMemberForOtp(memberId: number, normalized: string) {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new AppError(404, "MEMBER_NOT_FOUND", "Member record not found.");
  if (!member.is_active_member) {
    throw new AppError(403, "MEMBER_INACTIVE", "This member record is inactive. Please contact the community administrator.");
  }
  assertMemberMatches(member, normalized);
  return member;
}

export async function sendOtp(input: { memberId: number; mobile: string }): Promise<{ expiresInSeconds: number }> {
  const normalized = normalizeMobile(input.mobile);
  await loadMemberForOtp(input.memberId, normalized);
  const result = await otpService.sendOtp({ memberId: input.memberId, mobile: normalized });
  logger.info(`OTP requested for member ${input.memberId} (${maskMobile(normalized)})`);
  return result;
}

/**
 * Verifies the OTP, creates the application account for the member on first
 * login, and issues a JWT. Member identity comes from the server-side record,
 * never from the frontend.
 */
export async function verifyOtp(input: {
  memberId: number;
  mobile: string;
  otp: string;
}): Promise<{ token: string; member: PublicMember }> {
  const normalized = normalizeMobile(input.mobile);
  const member = await loadMemberForOtp(input.memberId, normalized);

  await otpService.verifyOtp({ memberId: member.id, mobile: normalized, otp: input.otp });

  let account = await authRepository.findAccountByMemberId(member.id);
  if (!account) {
    account = await authRepository.createAccount(member.id, normalized);
    logger.info(`Account created for member ${member.id}`);
  }
  await authRepository.touchLogin(account.id);

  const token = signAuthToken({ accountId: account.id, memberId: member.id });
  logger.info(`Member ${member.id} logged in (${maskMobile(normalized)})`);
  return { token, member: toPublicMember(member) };
}