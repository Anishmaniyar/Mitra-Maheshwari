import type { Member, NewMemberInput, ProfileFields, ProfilePatch, RegistrationData } from "../../types/api";

const KEY = "mm_registration_draft";

/** Kept in sessionStorage so a refresh mid-flow does not lose progress. */
export function saveDraft(draft: RegistrationData): void {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function emptyProfile(): ProfileFields {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    bloodGroup: "",
    occupation: "",
    area: "",
    panName: "",
    panNumber: "",
  };
}

/** Draft profile for a brand-new family registration (details filled later). */
export function profileFromNewInput(input: NewMemberInput): ProfileFields {
  return {
    ...emptyProfile(),
    firstName: input.firstName,
    middleName: input.middleName ?? "",
    lastName: input.lastName,
  };
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
      parsed.profile === null ||
      (parsed.flow !== "join" && parsed.flow !== "login")
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

/**
 * Converts form values into a *sparse* API patch (PATCH /api/family/members/:id).
 * Only fields the person actually filled in are sent: an untouched field stays
 * exactly as stored instead of being cleared with null. Empty strings are
 * omitted for the same reason (and because the API validates formats, so a
 * blank optional field must not be sent as "").
 */
export function profileToPatch(profile: ProfileFields): ProfilePatch {
  const patch: ProfilePatch = {};
  const setText = <K extends keyof ProfilePatch>(key: K, value: string): void => {
    const trimmed = value.trim();
    if (trimmed) patch[key] = trimmed as ProfilePatch[K];
  };

  setText("firstName", profile.firstName);
  setText("middleName", profile.middleName);
  setText("lastName", profile.lastName);
  setText("occupation", profile.occupation);
  setText("area", profile.area);
  setText("panName", profile.panName);

  const panNumber = profile.panNumber.trim().toUpperCase();
  if (panNumber) patch.panNumber = panNumber;
  if (profile.bloodGroup) patch.bloodGroup = profile.bloodGroup as ProfilePatch["bloodGroup"];
  if (profile.age.trim()) {
    const age = Number(profile.age);
    if (Number.isFinite(age)) patch.age = age;
  }

  return patch;
}