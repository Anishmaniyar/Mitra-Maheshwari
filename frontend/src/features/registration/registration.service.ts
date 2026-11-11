import { api } from "../../services/api";
import type { MatchResponse, Member } from "../../types/api";

export interface MatchInput {
  firstName: string;
  lastName: string;
  mobile: string;
}

interface BackendCandidate {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}

function candidateToMember(candidate: BackendCandidate, mobile: string): Member {
  return {
    id: candidate.id,
    firstName: candidate.firstName,
    middleName: candidate.middleName,
    lastName: candidate.lastName ?? "",
    mobile,
    bloodGroup: null,
    age: null,
    occupation: null,
    area: null,
    panName: null,
    panNumber: null,
    isActiveMember: false,
    familyId: "",
    isHead: false,
    role: "",
  };
}

export function matchMember(input: MatchInput): Promise<MatchResponse> {
  const query = new URLSearchParams({
    firstName: input.firstName,
    lastName: input.lastName,
  }).toString();
  return api<BackendCandidate[]>(`/registration/candidates?${query}`, {
    auth: false,
  }).then((candidates) => {
    if (candidates.length === 1) {
      return {
        status: "EXISTING_MEMBER_FOUND",
        member: candidateToMember(candidates[0], input.mobile),
        candidates: [],
      } as MatchResponse;
    }
    if (candidates.length > 1) {
      return {
        status: "MULTIPLE_MATCHES",
        member: null,
        candidates: candidates.map((c) => candidateToMember(c, input.mobile)),
      } as MatchResponse;
    }
    return { status: "NO_MEMBER_FOUND", member: null, candidates: [] };
  });
}

export interface CompleteRegistrationInput {
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

export interface CompleteRegistrationResponse {
  familyId: string;
  familyCode: string;
  memberId: string;
  accountId: string;
  status: string;
}

function omitEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Creates the family + head member on the backend after OTP verification.
    There is no local/simulated member record at any point in the flow. */
export function completeRegistration(
  input: CompleteRegistrationInput,
): Promise<CompleteRegistrationResponse> {
  const body: Record<string, unknown> = {
    mobile: input.mobile,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
  };
  const middleName = omitEmpty(input.middleName);
  const bloodGroup = omitEmpty(input.bloodGroup);
  const occupation = omitEmpty(input.occupation);
  const area = omitEmpty(input.area);
  const panName = omitEmpty(input.panName);
  const panNumber = omitEmpty(input.panNumber)?.toUpperCase();
  if (middleName !== undefined) body.middleName = middleName;
  if (bloodGroup !== undefined) body.bloodGroup = bloodGroup;
  if (input.age !== undefined) body.age = input.age;
  if (occupation !== undefined) body.occupation = occupation;
  if (area !== undefined) body.area = area;
  if (panName !== undefined) body.panName = panName;
  if (panNumber !== undefined) body.panNumber = panNumber;
  return api<CompleteRegistrationResponse>("/registration/complete", {
    method: "POST",
    body,
    auth: false,
  });
}
