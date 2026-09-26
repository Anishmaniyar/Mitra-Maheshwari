import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingState } from "./LoadingState";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <LoadingState message="Loading your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/register" replace />;

  return <>{children}</>;
}

/** UX-only guard: backend authorize('ADMIN') remains the security boundary. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <LoadingState message="Loading your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}