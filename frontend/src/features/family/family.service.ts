import { DEMO_MODE, demoAddFamilyMember, demoGetFamily } from "../../config/demo";
import { api } from "../../services/api";
import type { Family, NewMemberInput } from "../../types/api";

export function getFamily(): Promise<{ family: Family }> {
  if (DEMO_MODE) return demoGetFamily();
  return api<{ family: Family }>("/family");
}

export function addFamilyMember(input: NewMemberInput): Promise<{ family: Family }> {
  if (DEMO_MODE) return demoAddFamilyMember(input);
  return api<{ family: Family }>("/family/members", { method: "POST", body: input });
}