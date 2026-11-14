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