/* Public community counters (real backend values only — never simulated).
   The endpoint is unauthenticated, so no token is attached. */
import { api } from "./api";
import type { CommunityStats } from "../types/api";

export function getCommunityStats(): Promise<CommunityStats> {
  return api<CommunityStats>("/stats", { auth: false });
}
