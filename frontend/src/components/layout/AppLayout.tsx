import type { ReactNode } from "react";
import { DEMO_MODE } from "../../config/demo";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface AppLayoutProps {
  variant: "public" | "app";
  children: ReactNode;
}

export function AppLayout({ variant, children }: AppLayoutProps) {
  return (
    <>
      <Header variant={variant} />
      {DEMO_MODE && variant === "app" && (
        <div className="container">
          <div className="notice notice--info" role="status" style={{ marginTop: "var(--space-4)" }}>
            <strong>Demo mode:</strong> Showing simulated data for UI preview only — no real community
            records, members, or payments.
          </div>
        </div>
      )}
      <main>{children}</main>
      {variant === "public" && <Footer />}
    </>
  );
}