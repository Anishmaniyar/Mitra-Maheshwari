/* Backend health probe (real backend only — never simulated).
   Used for the honest system-status line in Settings.
   The backend serves GET /health at the server root (sibling of /api). */
import { ApiError } from "./api";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api";

function healthUrl(): string {
  const root = API_BASE_URL.replace(/\/api\/?$/, "") || "/";
  return `${root === "/" ? "" : root}/health`;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  db: string;
  timestamp: string;
}

interface BackendHealth {
  status: string;
  uptime: number;
  db: string;
  timestamp: string;
}

export async function getHealth(): Promise<HealthStatus> {
  let res: Response;
  try {
    res = await fetch(healthUrl());
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server.");
  }
  if (!res.ok) throw new ApiError(res.status, "HTTP_ERROR", `Health check failed (${res.status})`);
  const envelope = (await res.json()) as {
    status?: string;
    data?: BackendHealth | null;
  };
  if (envelope?.status !== "success" || !envelope.data) {
    throw new ApiError(res.status, "HTTP_ERROR", "Health check failed.");
  }
  return {
    status: envelope.data.status,
    uptime: envelope.data.uptime,
    db: envelope.data.db,
    timestamp: envelope.data.timestamp,
  };
}
