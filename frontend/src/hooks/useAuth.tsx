import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearToken, onSessionExpired, restoreSession, setToken } from "../services/api";
import { getMe, logout as logoutRequest } from "../features/authentication/auth.service";
import type { AuthUser } from "../types/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on load. The access token lives in memory only, so a
  // reload starts with no token: re-mint one from the HttpOnly refresh cookie,
  // then load the profile. No cookie (first visit / logged out) simply ends in
  // the signed-out state.
  useEffect(() => {
    let cancelled = false;

    onSessionExpired(() => {
      if (!cancelled) {
        setUserState(null);
      }
    });

    restoreSession()
      .then((restored) => (restored ? getMe() : null))
      .then((res) => {
        if (!cancelled && res) setUserState(res.member);
      })
      .catch(() => {
        if (!cancelled) clearToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      onSessionExpired(null);
    };
  }, []);

  const login = useCallback((token: string, u: AuthUser) => {
    setToken(token);
    setUserState(u);
  }, []);

  const setUser = useCallback((u: AuthUser) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    // Revoke the server-side refresh token; local state clears regardless.
    void logoutRequest().catch(() => undefined);
    clearToken();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, setUser, logout }),
    [user, loading, login, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
