import * as statsRepository from "./stats.repository";
import type { CommunityStats } from "./stats.types";

/**
 * The landing page is public and unauthenticated, so a short in-process cache
 * keeps a traffic spike from hitting the database for every page view. The
 * numbers are counters, so a minute of staleness is not meaningful.
 */
const CACHE_TTL_MS = 60_000;

let cached: { at: number; value: CommunityStats } | null = null;

export async function getCommunityStats(): Promise<CommunityStats> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const value = await statsRepository.countCommunity();
  cached = { at: Date.now(), value };
  return value;
}
