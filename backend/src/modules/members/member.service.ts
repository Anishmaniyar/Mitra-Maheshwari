import { AppError } from "../../utils/http";
import { normalizeMobile } from "../../utils/mobile";
import * as memberRepository from "./member.repository";
import { toPublicMember, type MemberMatchResult, type PublicMember } from "./member.types";

/**
 * Matches a visitor against the imported member data.
 * Priority: exact normalized mobile. Fallback: first + last name.
 * A single name match counts as found; multiple name matches surface a picker.
 * Never creates a record on a failed lookup — new registration is explicit.
 */
export async function matchMember(input: {
  firstName: string;
  lastName: string;
  mobile: string;
}): Promise<MemberMatchResult> {
  const normalized = normalizeMobile(input.mobile);

  const exact = await memberRepository.findByMobile(normalized);
  if (exact) {
    return { status: "EXISTING_MEMBER_FOUND", member: toPublicMember(exact), candidates: [] };
  }

  const candidates = await memberRepository.findByNameCandidates(
    input.firstName.trim(),
    input.lastName.trim(),
  );

  if (candidates.length === 1) {
    return { status: "EXISTING_MEMBER_FOUND", member: toPublicMember(candidates[0]!), candidates: [] };
  }
  if (candidates.length > 1) {
    return { status: "MULTIPLE_MATCHES", member: null, candidates: candidates.map(toPublicMember) };
  }
  return { status: "NO_MEMBER_FOUND", member: null, candidates: [] };
}

/**
 * Creates a new member (as a family head) for the new-registration flow.
 * Re-checks mobile uniqueness server-side before inserting — the database
 * unique constraint backs this up — so duplicates cannot be created even if
 * the frontend is bypassed.
 */
export async function createNewMember(input: {
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobile: string;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  panName: string | null;
  panNumber: string | null;
}): Promise<PublicMember> {
  const normalized = normalizeMobile(input.mobile);

  const existing = await memberRepository.findByMobile(normalized);
  if (existing) {
    throw new AppError(409, "MOBILE_EXISTS", "A member with this mobile number already exists.");
  }

  const member = await memberRepository.createFamilyHead({ ...input, mobile: normalized });
  return toPublicMember(member);
}

export async function getMemberProfile(memberId: number): Promise<PublicMember> {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new AppError(404, "MEMBER_NOT_FOUND", "Member record not found.");
  return toPublicMember(member);
}

export async function updateMemberProfile(
  memberId: number,
  data: Record<string, unknown>,
): Promise<PublicMember> {
  const member = await memberRepository.updateProfile(memberId, data);
  if (!member) throw new AppError(404, "MEMBER_NOT_FOUND", "Member record not found.");
  return toPublicMember(member);
}