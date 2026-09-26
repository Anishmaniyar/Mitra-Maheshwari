import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import {
  approveRegistration,
  listRegistrations,
  rejectRegistration,
  type PendingRegistration,
} from "../features/admin/admin.service";

/** Minimal admin review queue: pending registrations with approve/reject. */
export default function AdminDashboardPage() {
  const [items, setItems] = useState<PendingRegistration[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRegistrations();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pending registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDecision(id: string, decision: "approve" | "reject") {
    setActingId(id);
    setNotice(null);
    try {
      if (decision === "approve") {
        await approveRegistration(id);
        setNotice("Registration approved.");
      } else {
        await rejectRegistration(id);
        setNotice("Registration rejected.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the action. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Administration"
            title="Pending Registrations"
            description="Review community registration requests."
          />

          {notice && (
            <div className="notice notice--success" style={{ marginBottom: "var(--space-4)" }}>
              {notice}
            </div>
          )}

          {loading && <LoadingState message="Loading registrations…" />}

          {error && items === null && (
            <ErrorState
              title="We couldn't load registrations."
              message={error}
              actionLabel="Try again"
              onAction={() => void load()}
            />
          )}

          {items !== null && items.length === 0 && (
            <EmptyState
              title="No pending registrations."
              message="New community registrations will appear here for review."
            />
          )}

          {items !== null && items.length > 0 && (
            <div className="member-grid">
              {items.map((item) => (
                <div key={item.familyId} className="member-row">
                  <div className="member-row__top">
                    <span className="member-row__name">
                      {item.headName ?? item.familyCode}
                    </span>
                    <div
                      className="stack"
                      style={{ gap: "var(--space-2)", flexDirection: "row" }}
                    >
                      <Button
                        variant="secondary"
                        loading={actingId === item.familyId}
                        onClick={() => void handleDecision(item.familyId, "reject")}
                      >
                        Reject
                      </Button>
                      <Button
                        loading={actingId === item.familyId}
                        onClick={() => void handleDecision(item.familyId, "approve")}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                  <p className="member-row__meta">
                    {[item.familyCode, item.headMobile].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
