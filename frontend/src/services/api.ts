/* Central HTTP client. UI components never call fetch directly — they use the
   feature services in src/features/* .service.ts files. */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api";

const TOKEN_KEY = "mm_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Set false for public endpoints so a stale token is not attached. */
  auth?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (options.auth !== false && token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Please check your connection and try again.");
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!res.ok || !envelope?.success) {
    const err = envelope?.error ?? { code: "HTTP_ERROR", message: `Request failed (${res.status})` };
    throw new ApiError(res.status, err.code, err.message);
  }
  return envelope.data as T;
}