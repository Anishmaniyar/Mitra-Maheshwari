import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { DEMO_MODE } from "../config/demo";
import { useAuth } from "../hooks/useAuth";
import { getHealth, type HealthStatus } from "../services/health.service";
import { maskMobile } from "../utils/format";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      setHealth(await getHealth());
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : "Could not reach the server.");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Settings"
            title="Account Settings"
            description="Manage your account and application preferences."
          />

          <section className="app-section" aria-labelledby="account" style={{ marginTop: 0 }}>
            <div className="app-section__head">
              <h2 id="account">Account</h2>
            </div>
            <div className="app-card">
              <dl className="app-kv" style={{ marginBottom: "var(--space-4)" }}>
                <div>
                  <dt>Member</dt>
                  <dd>{user ? `#${user.id}` : "—"}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{user ? maskMobile(user.mobile) : "—"}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>{DEMO_MODE ? "Demo (simulated data)" : "Real (backend data)"}</dd>
                </div>
              </dl>
              <Button variant="secondary" onClick={logout}>
                Log out
              </Button>
            </div>
          </section>

          <section className="app-section" aria-labelledby="system-status">
            <div className="app-section__head">
              <h2 id="system-status">System status</h2>
            </div>
            <div className="app-card">
              {healthLoading && <LoadingState message="Checking server status…" />}
              {!healthLoading && healthError && (
                <p className="app-card__sub" role="alert">
                  Server unreachable: {healthError}
                </p>
              )}
              {!healthLoading && health && (
                <dl className="app-kv" style={{ marginBottom: 0 }}>
                  <div>
                    <dt>Server</dt>
                    <dd>{health.status === "ok" ? "Online" : "Degraded"}</dd>
                  </div>
                  <div>
                    <dt>Database</dt>
                    <dd>{health.db === "up" ? "Connected" : "Unavailable"}</dd>
                  </div>
                </dl>
              )}
            </div>
          </section>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
