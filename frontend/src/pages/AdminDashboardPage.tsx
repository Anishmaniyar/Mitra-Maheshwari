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
  getRegistration,
  listRegistrations,
  rejectRegistration,
  type PendingRegistration,
  type RegistrationDetail,
} from "../features/admin/admin.service";

const PAGE_SIZE = 20;

/** Admin review queue: pending registrations with approve/reject. */
export default function AdminDashboardPage() {
  const [items, setItems] = useState<PendingRegistration[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, RegistrationDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const offset = page * PAGE_SIZE;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRegistrations({ limit: PAGE_SIZE, offset });
      setItems(res.items);
      setTotal(res.total);
      // Handling the last item on a page can leave it empty: step back so the
      // admin always sees the remaining queue instead of a blank page.
      if (res.items.length === 0 && page > 0) {
        setPage((p) => Math.max(0, p - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pending registrations.");
    } finally {
      setLoading(false);
    }
  }, [offset, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleDetails(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setDetailError(null);
    if (details[id]) {
      return;
    }
    setDetailLoading(id);
    try {
      const detail = await getRegistration(id);
      setDetails((prev) => ({ ...prev, [id]: detail }));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Could not load details.");
    } finally {
      setDetailLoading(null);
    }
  }

  function memberFacts(member: RegistrationDetail["members"][number]): Array<[string, string]> {
    const name = [member.firstName, member.middleName, member.lastName]
      .filter(Boolean)
      .join(" ");
    return [
      ["Name", `${name}${member.isHead ? " (Head)" : ""}`],
      ["Mobile", member.mobile ?? "—"],
      ["Blood group", member.bloodGroup ?? "—"],
      ["Age", member.age !== null && member.age !== undefined ? String(member.age) : "—"],
      ["Occupation", member.occupation ?? "—"],
      ["Area", member.area ?? "—"],
      ["PAN name", member.panName ?? "—"],
      ["PAN number", member.panNumber ?? "—"],
      ["Status", member.status],
    ];
  }

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

  const shownFrom = items && items.length > 0 ? offset + 1 : 0;
  const shownTo = offset + (items?.length ?? 0);
  const hasPrev = page > 0;
  const hasNext = shownTo < total;

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
              {items.map((item) => {
                const isOpen = expandedId === item.familyId;
                const detail = details[item.familyId];
                return (
                  <div key={item.familyId} className="member-row">
                    <div className="member-row__top">
                      <span className="member-row__name">
                        {item.headName ?? item.familyCode}
                      </span>
                      <div className="member-row__actions">
                        <Button
                          variant="secondary"
                          onClick={() => void toggleDetails(item.familyId)}
                        >
                          {isOpen ? "Hide details" : "View details"}
                        </Button>
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
                    {isOpen && detailLoading === item.familyId && (
                      <LoadingState message="Loading details…" />
                    )}
                    {isOpen && detailError && !detail && (
                      <ErrorState
                        title="We couldn't load details."
                        message={detailError}
                        actionLabel="Try again"
                        onAction={() => {
                          setDetails((prev) => {
                            const next = { ...prev };
                            delete next[item.familyId];
                            return next;
                          });
                          void toggleDetails(item.familyId);
                        }}
                      />
                    )}
                    {isOpen && detail && (
                      <div className="overview-list">
                        <div className="overview-item">
                          <h3>Family {detail.family.familyCode}</h3>
                          <p>
                            Requested{" "}
                            {new Date(detail.family.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {detail.members.map((member) => (
                          <div key={member.id}>
                            {memberFacts(member).map(([label, value]) => (
                              <div key={label} className="overview-item">
                                <h3>{label}</h3>
                                <p>{value}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {items !== null && total > 0 && (
            <div
              className="onb-actions"
              style={{ marginTop: "var(--space-4)", alignItems: "center" }}
            >
              <p className="onb-hint" style={{ margin: 0 }}>
                Showing {shownFrom}–{shownTo} of {total}
              </p>
              <div className="onb-actions__buttons">
                <Button
                  variant="secondary"
                  disabled={!hasPrev || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={!hasNext || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
