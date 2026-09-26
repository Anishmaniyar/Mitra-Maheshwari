/* Central HTTP client. UI components never call fetch directly — they use the
   feature services in src/features/* .service.ts files.

   Backend contract (Express):
   - Success envelope: { message, status: "success", data }
   - Error envelope:   { status: "error", message }
   - Auth: Bearer access token header + HttpOnly refresh-token cookie,
     so every request sends credentials (cookies) same-origin. */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api";

const TOKEN_KEY = "mm_token";
const REFRESH_PATH = "/auth/refresh";

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

interface BackendSuccess<T> {
  status: "success";
  message: string;
  data: T;
}

interface BackendError {
  status: "error";
  message: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Set false for public endpoints so a stale token is not attached. */
  auth?: boolean;
  /** Set false to skip the access-token refresh retry (used by the refresh call itself). */
  retryWithRefresh?: boolean;
}

function errorCode(status: number, message: string): string {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 401) return /expir/i.test(message) ? "OTP_EXPIRED" : "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 410) return "GONE";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return `HTTP_${status}`;
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (options.auth !== false && token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Please check your connection and try again.");
  }

  let payload: BackendSuccess<T> | BackendError | null = null;
  try {
    payload = (await res.json()) as BackendSuccess<T> | BackendError;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload || payload.status !== "success") {
    const message =
      (payload as BackendError | null)?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, errorCode(res.status, message), message);
  }
  return (payload as BackendSuccess<T>).data as T;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const data = await rawRequest<{ accessToken: string }>(REFRESH_PATH, {
      method: "POST",
      auth: false,
      retryWithRefresh: false,
    });
    if (data?.accessToken) {
      setToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const sentToken = options.auth !== false && getToken() !== null;
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    // Expired access token: rotate via the HttpOnly refresh cookie once, then
    // retry the original request. Only when we actually sent a token, so a
    // wrong OTP (public call) never triggers a refresh.
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      sentToken &&
      options.retryWithRefresh !== false &&
      path !== REFRESH_PATH
    ) {
      const refreshed = await tryRefresh();
      if (refreshed) return rawRequest<T>(path, options);
      clearToken();
    }
    throw err;
  }
}
