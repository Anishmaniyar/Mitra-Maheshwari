import { useEffect, useState } from "react";
import { getCommunityStats } from "../services/stats.service";
import type { CommunityStats } from "../types/api";

export type CommunityStatsState =
  | { status: "loading" }
  | { status: "ready"; stats: CommunityStats }
  | { status: "error" };

/**
 * Loads the real community counters for the public pages. The stats band is
 * decorative, so a failure is reported as an error state (and simply hidden)
 * rather than interrupting the page.
 */
export function useCommunityStats(): CommunityStatsState {
  const [state, setState] = useState<CommunityStatsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getCommunityStats()
      .then((stats) => {
        if (!cancelled) setState({ status: "ready", stats });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
