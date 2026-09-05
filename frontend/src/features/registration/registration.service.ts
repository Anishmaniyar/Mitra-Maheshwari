import { DEMO_MODE, demoCreateMember, demoMatchMember } from "../../config/demo";
import { api } from "../../services/api";
import type { CreateMemberResponse, MatchResponse, NewMemberInput } from "../../types/api";

export interface MatchInput {
  firstName: string;
  lastName: string;
  mobile: string;
}

export function matchMember(input: MatchInput): Promise<MatchResponse> {
  if (DEMO_MODE) return demoMatchMember(input);
  return api<MatchResponse>("/members/match", { method: "POST", body: input, auth: false });
}

/** New registration — the backend creates the family + head member atomically. */
export function createMember(input: NewMemberInput): Promise<CreateMemberResponse> {
  if (DEMO_MODE) return demoCreateMember(input);
  return api<CreateMemberResponse>("/members", { method: "POST", body: input, auth: false });
}