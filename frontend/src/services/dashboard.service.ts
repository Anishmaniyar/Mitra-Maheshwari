/* Dashboard data service. Pages call this — never fetch or repositories
   directly, so the UI never branches on environment flags. */
import { getFamily } from "../features/family/family.service";
import type { Family } from "../types/api";

export interface DashboardData {
  family: Family;
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await getFamily();
  return { family: res.family };
}
