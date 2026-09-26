import type { Member, ProfileFields, ProfilePatch, RegistrationData } from "../../types/api";

const KEY = "mm_registration_draft";

/** Kept in sessionStorage so a refresh mid-flow does not lose progress. */
export function saveDraft(draft: RegistrationData): void {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function getDraft(): RegistrationData | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistrationData;
    if (
      typeof parsed.memberId !== "string" ||
      typeof parsed.mobile !== "string" ||
      typeof parsed.profile !== "object" ||
      parsed.profile === null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  sessionStorage.removeItem(KEY);
}

/** Maps a matched member record onto form-bound profile fields. */
export function profileFromMember(member: Member): ProfileFields {
  return {
    firstName: member.firstName,
    middleName: member.middleName ?? "",
    lastName: member.lastName,
    age: member.age?.toString() ?? "",
    bloodGroup: member.bloodGroup ?? "",
    occupation: member.occupation ?? "",
    area: member.area ?? "",
    panName: member.panName ?? "",
    panNumber: member.panNumber ?? "",
  };
}

/** Converts form values into the API patch shape (PATCH /api/me). */
export function profileToPatch(profile: ProfileFields): ProfilePatch {
  return {
    firstName: profile.firstName.trim(),
    middleName: profile.middleName.trim() || null,
    lastName: profile.lastName.trim(),
    age: profile.age ? Number(profile.age) : null,
    bloodGroup: (profile.bloodGroup || null) as ProfilePatch["bloodGroup"],
    occupation: profile.occupation.trim() || null,
    area: profile.area.trim() || null,
    panName: profile.panName.trim() || null,
    panNumber: profile.panNumber.trim().toUpperCase() || null,
  };
}