/* Backend health probe (real backend only). Used for the honest system-status
   line in Settings. The backend serves GET /health at the server root (sibling
   of /api) and answers 503 when a dependency is down, so the body is read
   regardless of the HTTP status instead of failing on !res.ok. */
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
    res = await fetch(healthUrl(), { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server.");
  }

  let envelope: { status?: string; message?: string; data?: BackendHealth | null } | null = null;
  try {
    envelope = (await res.json()) as {
      status?: string;
      message?: string;
      data?: BackendHealth | null;
    };
  } catch {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      "The server did not return a health response. Check that the API is running and proxied.",
    );
  }

  if (!envelope?.data) {
    throw new ApiError(
      res.status,
      "HTTP_ERROR",
      envelope?.message ?? `Health check failed (${res.status})`,
    );
  }

  return {
    status: envelope.data.status,
    uptime: envelope.data.uptime,
    db: envelope.data.db,
    timestamp: envelope.data.timestamp,
  };
}
