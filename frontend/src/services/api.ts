/* Central HTTP client. UI components never call fetch directly — they use the
   feature services in src/features/* .service.ts files.

   Backend contract (Express):
   - Success envelope: { message, status: "success", data }
   - Error envelope:   { status: "error", message }
   - Auth: Bearer access token header + HttpOnly refresh-token cookie,
     so every request sends credentials (cookies) same-origin.

   Token storage: the short-lived access token is held in memory only. It is
   never written to localStorage/sessionStorage, so a script injected into the
   page cannot read a durable credential. The only long-lived credential is
   the HttpOnly, SameSite=Lax refresh cookie, which JavaScript cannot read;
   AuthProvider re-mints an access token from it on load (restoreSession). */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api";

const REFRESH_PATH = "/auth/refresh";

let accessToken: string | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function getToken(): string | null {
  return accessToken;
}

export function setToken(token: string): void {
  accessToken = token;
}

export function clearToken(): void {
  accessToken = null;
}

/** Registers the app-level reaction to an unrecoverable 401 (refresh failed).
    AuthProvider uses it to drop the in-memory user so protected routes bounce
    to login instead of rendering against a dead session. */
export function onSessionExpired(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

function notifySessionExpired(): void {
  accessToken = null;
  sessionExpiredHandler?.();
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
  if (status === 401) {
    // A dead session is not an expired OTP: keep the two distinguishable so
    // the UI can prompt "log in again" instead of "request a new code".
    if (/refresh token|access token|session/i.test(message)) return "SESSION_EXPIRED";
    if (/otp|code/i.test(message) && /expir/i.test(message)) return "OTP_EXPIRED";
    return "UNAUTHORIZED";
  }
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

  if (options.auth !== false && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

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

/** Re-mints an access token from the HttpOnly refresh cookie (used on app
    load, since the in-memory token does not survive a page reload). */
export async function restoreSession(): Promise<boolean> {
  return tryRefresh();
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    // Authenticated request rejected: rotate via the refresh cookie once, then
    // retry the original call. Public calls (auth: false) never refresh, so a
    // wrong OTP cannot silently consume the refresh chain.
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      options.auth !== false &&
      options.retryWithRefresh !== false &&
      path !== REFRESH_PATH
    ) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        try {
          return await rawRequest<T>(path, options);
        } catch (retryErr) {
          if (retryErr instanceof ApiError && retryErr.status === 401) {
            notifySessionExpired();
          }
          throw retryErr;
        }
      }
      notifySessionExpired();
    }
    throw err;
  }
}
