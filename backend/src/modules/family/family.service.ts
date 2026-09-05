import { AppError } from "../../utils/http";
import { maskMobile, normalizeMobile } from "../../utils/mobile";
import * as memberRepository from "../members/member.repository";
import { toPublicMember } from "../members/member.types";
import * as familyRepository from "./family.repository";
import type { FamilyResponse, MembershipStatus } from "./family.types";

function toMembershipStatus(status: string | null): MembershipStatus {
  if (!status) return "none";
  if (status === "paid" || status === "pending" || status === "failed") return status;
  return "none";
}

export async function getFamilyForMember(memberId: number): Promise<FamilyResponse> {
  const familyId = await familyRepository.getFamilyIdForMember(memberId);
  if (!familyId) throw new AppError(404, "FAMILY_NOT_FOUND", "Family not found for this member.");

  const [rows, payment] = await Promise.all([
    familyRepository.getFamilyMembers(familyId),
    familyRepository.getLatestPayment(familyId),
  ]);

  return {
    familyId,
    head: rows.find((m) => m.is_head) ? toPublicMember(rows.find((m) => m.is_head)!) : null,
    members: rows.map((m) => ({
      id: m.id,
      firstName: m.first_name,
      middleName: m.middle_name,
      lastName: m.last_name,
      isHead: m.is_head,
      age: m.age,
      occupation: m.occupation,
      area: m.area,
      bloodGroup: m.blood_group,
      isActiveMember: m.is_active_member,
      mobileMasked: maskMobile(m.mobile),
    })),
    membership: payment
      ? {
          status: toMembershipStatus(payment.status),
          year: payment.year,
          amount: Number(payment.amount),
          currency: payment.currency,
        }
      : { status: "none", year: null, amount: null, currency: "INR" },
  };
}

/**
 * Adds a member to the caller's own family. Only the family head may do this,
 * and the family is derived from the authenticated member — a family_id sent
 * by the client is never trusted.
 */
export async function addMemberToFamily(
  memberId: number,
  input: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    mobile: string;
    bloodGroup: string | null;
    age: number | null;
    occupation: string | null;
    area: string | null;
  },
): Promise<FamilyResponse> {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new AppError(404, "MEMBER_NOT_FOUND", "Member record not found.");
  if (!member.is_head) {
    throw new AppError(403, "HEAD_ONLY", "Only the family head can add family members.");
  }

  const normalized = normalizeMobile(input.mobile);
  const existing = await memberRepository.findByMobile(normalized);
  if (existing) {
    throw new AppError(409, "MOBILE_EXISTS", "A member with this mobile number already exists.");
  }

  const headId = await familyRepository.getFamilyHeadId(member.family_id);
  if (!headId) throw new AppError(409, "NO_FAMILY_HEAD", "This family has no head member.");

  await memberRepository.addMemberToFamily({
    familyId: member.family_id,
    headId,
    ...input,
    mobile: normalized,
  });

  return getFamilyForMember(memberId);
}