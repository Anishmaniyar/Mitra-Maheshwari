import { DEMO_MODE, demoAddFamilyMember, demoGetFamily } from "../../config/demo";
import { api } from "../../services/api";
import { maskMobile } from "../../utils/format";
import type {
  Family,
  FamilyInvitation,
  FamilyMember,
  Member,
  Membership,
  NewMemberInput,
} from "../../types/api";

interface BackendFamilyMember {
  id: string;
  familyId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  mobile: string | null;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  isHead: boolean;
  status: string;
}

interface BackendMembership {
  year: number;
  status: string | null;
  paymentId: string | null;
  amount: number | null;
  feeAmount: number;
  currency: string;
}

interface BackendFamily {
  family: { id: string; familyCode: string; status: string };
  members: BackendFamilyMember[];
  invitations: FamilyInvitation[];
  membership: BackendMembership;
}

function toFamilyMember(row: BackendFamilyMember): FamilyMember {
  return {
    id: row.id,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName ?? "",
    isHead: row.isHead,
    age: row.age,
    occupation: row.occupation,
    area: row.area,
    bloodGroup: row.bloodGroup,
    isActiveMember: row.status === "APPROVED",
    mobileMasked: row.mobile ? maskMobile(row.mobile) : "—",
  };
}

function toMember(row: BackendFamilyMember, familyId: string): Member {
  return {
    id: row.id,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName ?? "",
    mobile: row.mobile ?? "",
    bloodGroup: row.bloodGroup,
    age: row.age,
    occupation: row.occupation,
    area: row.area,
    panName: null,
    panNumber: null,
    isActiveMember: row.status === "APPROVED",
    familyId,
    isHead: row.isHead,
    role: "",
  };
}

function toMembership(block: BackendMembership): Membership {
  const status =
    block.status === "CAPTURED"
      ? "paid"
      : block.status === "FAILED"
        ? "failed"
        : block.status === null
          ? "none"
          : "pending";
  return {
    status,
    year: block.year,
    amount: block.amount ?? block.feeAmount,
    currency: block.currency,
  };
}

export function toFamily(data: BackendFamily): Family {
  const members = data.members.map(toFamilyMember);
  const headRow = data.members.find((m) => m.isHead) ?? null;
  return {
    familyId: data.family.id,
    head: headRow ? toMember(headRow, data.family.id) : null,
    members,
    membership: toMembership(data.membership),
  };
}

export function getFamily(): Promise<{ family: Family }> {
  if (DEMO_MODE) return demoGetFamily();
  return api<BackendFamily>("/family").then((data) => ({
    family: toFamily(data),
  }));
}

export interface InvitationResult {
  family: Family;
  inviteLink: string;
}

/**
 * The backend has no direct member-creation endpoint: adding a family member
 * means creating an invitation the person accepts via their own OTP flow.
 */
export function addFamilyMember(input: NewMemberInput): Promise<InvitationResult> {
  if (DEMO_MODE) {
    return demoAddFamilyMember(input).then((res) => ({
      family: res.family,
      inviteLink: "",
    }));
  }
  const inviteeName = [input.firstName, input.middleName, input.lastName]
    .filter(Boolean)
    .join(" ");
  interface CreatedInvitation extends FamilyInvitation {
    token: string;
  }
  return api<CreatedInvitation>("/family/invitations", {
    method: "POST",
    body: { inviteeName, inviteeMobile: input.mobile },
  }).then((invitation) =>
    getFamily().then((res) => ({
      family: res.family,
      inviteLink: `${window.location.origin}/invite/${invitation.token}`,
    })),
  );
}

export function listInvitations(): Promise<{ invitations: FamilyInvitation[] }> {
  return api<FamilyInvitation[]>("/family/invitations").then((invitations) => ({
    invitations,
  }));
}

export function cancelInvitation(invitationId: string): Promise<void> {
  return api<unknown>(`/family/invitations/${invitationId}`, {
    method: "DELETE",
  }).then(() => undefined);
}

export interface InvitationValidation {
  inviteeName: string;
  familyCode: string | null;
  status: string;
  expiresAt: string;
}

export function validateInvitation(token: string): Promise<InvitationValidation> {
  return api<InvitationValidation>(`/family/invitations/${token}`, {
    auth: false,
  });
}

export interface AcceptInvitationInput {
  mobile: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  bloodGroup?: string;
  age?: number;
  occupation?: string;
  area?: string;
  panName?: string;
  panNumber?: string;
}

export function acceptInvitation(
  token: string,
  input: AcceptInvitationInput,
): Promise<{ memberId: string; familyId: string; status: string }> {
  return api<{ memberId: string; familyId: string; status: string }>(
    `/family/invitations/${token}/accept`,
    { method: "POST", body: input, auth: false },
  );
}
