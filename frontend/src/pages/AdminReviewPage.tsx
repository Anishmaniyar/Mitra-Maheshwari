import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { Logo } from "../components/common/Logo";
import { PageContainer } from "../components/common/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import {
  approveRegistration,
  exchangeAdminLink,
  getAdminSession,
  getRegistration,
  listRegistrations,
  logoutAdminSession,
  rejectRegistration,
  type PendingRegistration,
  type RegistrationDetail,
} from "../features/admin/admin.service";
import { ApiError } from "../services/api";

const PAGE_SIZE = 20;

type AccessState = "checking" | "allowed" | "denied";

/**
 * Reads the admin secret from the URL fragment (never a query parameter), then
 * removes it from history so it is not retained in the address bar. Fragments
 * are not sent to servers, logs, or referrer headers.
 */
function takeSecretFromHash(): string | null {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;

  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Dedicated shared-link admin panel: registration review only. */
export default function AdminReviewPage() {
  const [access, setAccess] = useState<AccessState>("checking");
  const [accessMessage, setAccessMessage] = useState("");
  const [items, setItems] = useState<PendingRegistration[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, RegistrationDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  const offset = page * PAGE_SIZE;

  // Exchange the link secret (or reuse an existing admin cookie) once.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const secret = takeSecretFromHash();

    void (async () => {
      try {
        if (secret) {
          await exchangeAdminLink(secret);
        } else {
          await getAdminSession();
        }
        setAccess("allowed");
      } catch {
        setAccess("denied");
        setAccessMessage(
          secret
            ? "This admin link is invalid or has been revoked."
            : "Open your private admin link to review registration requests.",
        );
      }
    })();
  }, []);

  const handleExpired = useCallback(() => {
    setAccess("denied");
    setItems(null);
    setAccessMessage(
      "Your admin session has expired. Open your private admin link again.",
    );
  }, []);

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
      if (err instanceof ApiError && err.status === 401) {
        handleExpired();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not load pending registrations.",
      );
    } finally {
      setLoading(false);
    }
  }, [offset, page, handleExpired]);

  useEffect(() => {
    if (access === "allowed") void load();
  }, [access, load]);

  const loadDetails = useCallback(
    async (id: string) => {
      setDetailLoading(id);
      setDetailError(null);
      try {
        const detail = await getRegistration(id);
        setDetails((prev) => ({ ...prev, [id]: detail }));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleExpired();
          return;
        }
        setDetailError(
          err instanceof Error ? err.message : "Could not load details.",
        );
      } finally {
        setDetailLoading(null);
      }
    },
    [handleExpired],
  );

  async function toggleDetails(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setDetailError(null);
    if (!details[id]) await loadDetails(id);
  }

  function memberFacts(
    member: RegistrationDetail["members"][number],
  ): Array<[string, string]> {
    const name = [member.firstName, member.middleName, member.lastName]
      .filter(Boolean)
      .join(" ");
    return [
      ["Name", `${name}${member.isHead ? " (Head)" : ""}`],
      ["Mobile", member.mobile ?? "—"],
      ["Blood group", member.bloodGroup ?? "—"],
      [
        "Age",
        member.age !== null && member.age !== undefined ? String(member.age) : "—",
      ],
      ["Occupation", member.occupation ?? "—"],
      ["Area", member.area ?? "—"],
      ["PAN name", member.panName ?? "—"],
      ["PAN number", member.panNumber ?? "—"],
      ["Status", member.status],
    ];
  }

  async function handleDecision(id: string, decision: "approve" | "reject") {
    if (actingId) return;
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
      if (err instanceof ApiError && err.status === 401) {
        handleExpired();
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete the action. Please try again.",
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleExit() {
    await logoutAdminSession().catch(() => undefined);
    setItems(null);
    setAccess("denied");
    setAccessMessage(
      "Admin session ended. Open your private admin link to return.",
    );
  }

  const shownFrom = items && items.length > 0 ? offset + 1 : 0;
  const shownTo = offset + (items?.length ?? 0);
  const hasPrev = page > 0;
  const hasNext = shownTo < total;

  return (
    <div className="admin-shell">
      <header className="admin-shell__bar">
        <Link to="/" className="admin-shell__brand" aria-label="Mitra Maheshwari home">
          <Logo />
        </Link>
        <span className="admin-shell__label">Registration review</span>
        {access === "allowed" && (
          <Button variant="ghost" size="sm" onClick={() => void handleExit()}>
            Exit
          </Button>
        )}
      </header>

      <main className="admin-shell__main">
        <PageContainer>
          {access === "checking" && <LoadingState message="Checking admin access…" />}

          {access === "denied" && (
            <ErrorState title="Admin access required" message={accessMessage} />
          )}

          {access === "allowed" && (
            <div className="app-page__wrap">
              <PageHeader
                eyebrow="Administration"
                title="Pending Registrations"
                description="Review community registration requests."
              />

              {notice && (
                <div
                  className="notice notice--success"
                  style={{ marginBottom: "var(--space-4)" }}
                >
                  {notice}
                </div>
              )}

              {error && items === null && (
                <ErrorState
                  title="We couldn't load registrations."
                  message={error}
                  actionLabel="Try again"
                  onAction={() => void load()}
                />
              )}

              {error && items !== null && (
                <div
                  className="notice notice--error"
                  style={{ marginBottom: "var(--space-4)" }}
                >
                  {error}
                </div>
              )}

              {loading && items === null && (
                <LoadingState message="Loading registrations…" />
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
                    const busy = actingId === item.familyId;
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
                              loading={busy}
                              disabled={actingId !== null && !busy}
                              onClick={() => void handleDecision(item.familyId, "reject")}
                            >
                              Reject
                            </Button>
                            <Button
                              loading={busy}
                              disabled={actingId !== null && !busy}
                              onClick={() => void handleDecision(item.familyId, "approve")}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                        <p className="member-row__meta">
                          {[item.familyCode, item.headMobile]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {isOpen && detailLoading === item.familyId && (
                          <LoadingState message="Loading details…" />
                        )}
                        {isOpen && detailError && !detail && (
                          <ErrorState
                            title="We couldn't load details."
                            message={detailError}
                            actionLabel="Try again"
                            onAction={() => void loadDetails(item.familyId)}
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
          )}
        </PageContainer>
      </main>
    </div>
  );
}
