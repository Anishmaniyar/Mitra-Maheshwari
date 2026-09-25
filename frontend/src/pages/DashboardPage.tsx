import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { PageContainer } from "../components/common/PageContainer";
import { StatusBadge } from "../components/common/StatusBadge";
import type { BadgeStatus } from "../components/common/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { getDashboard } from "../services/dashboard.service";
import type { Family, MembershipStatus } from "../types/api";
import { formatCurrency, fullName, maskMobile } from "../utils/format";

const MEMBERSHIP_BADGE: Record<MembershipStatus, BadgeStatus> = {
  none: "none",
  pending: "pending",
  paid: "paid",
  failed: "failed",
};

const MEMBERSHIP_TEXT: Record<MembershipStatus, string> = {
  none: "Not paid",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
};

const QUICK_ACTIONS = [
  { icon: "drop", title: "Blood Support", description: "Find a blood donor", to: "/blood" },
  { icon: "briefcase", title: "Community Services", description: "Find businesses and professionals", to: "/services" },
  { icon: "heart", title: "Matrimony", description: "Explore matrimonial profiles", to: "/matrimony" },
  { icon: "search", title: "Discover", description: "Explore upcoming community features", to: "/discover" },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setFamily(res.family);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your family details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const membership = family?.membership;
  const memberCount = family?.members.length ?? 0;
  const year = membership?.year ?? new Date().getFullYear();
  const isPaid = membership?.status === "paid";
  const hasPayment = membership != null && membership.status !== "none" && membership.amount != null;
  const preview = family?.members.slice(0, 3) ?? [];
  const remaining = memberCount - preview.length;
  const profileComplete =
    user != null &&
    Boolean(user.firstName) &&
    Boolean(user.lastName) &&
    Boolean(user.mobile) &&
    user.bloodGroup != null &&
    user.age != null;

  return (
    <AppLayout variant="app">
      <PageContainer>
        <PageHeader
          eyebrow="Member Dashboard"
          title={user ? `Namaste, ${user.firstName}!` : "Namaste!"}
          description="Manage your family, membership and community activity from one place."
        />

        {loading && <LoadingState message="Loading your dashboard…" />}

        {error && !family && (
          <ErrorState
            title="We couldn't load your dashboard."
            message={error}
            actionLabel="Try again"
            onAction={() => void loadDashboard()}
          />
        )}

        {family && (
          <>
            {/* Summary strip — the four headline numbers, one row. */}
            <div className="app-summary">
              <article className="app-card app-summary__card">
                <span className="app-card__icon">
                  <LpIcon d={LP_PATHS.users} />
                </span>
                <h2>My Family</h2>
                <p className="app-card__value">
                  {memberCount} {memberCount === 1 ? "Member" : "Members"}
                </p>
                <p className="app-card__sub">Family #{family.familyId}</p>
                <Link to="/family" className="app-card__link">
                  View Family <span aria-hidden="true">→</span>
                </Link>
              </article>

              <article className="app-card app-summary__card">
                <span className="app-card__icon">
                  <LpIcon d={LP_PATHS.card} />
                </span>
                <h2>Membership</h2>
                <p className="app-card__value">{year}</p>
                <p className="app-card__sub">
                  {membership ? MEMBERSHIP_TEXT[membership.status] : "—"}
                </p>
                <Link to="/membership" className="app-card__link">
                  View Membership <span aria-hidden="true">→</span>
                </Link>
              </article>

              <article className="app-card app-summary__card">
                <span className="app-card__icon">
                  <LpIcon d={LP_PATHS.receipt} />
                </span>
                <h2>Payments</h2>
                <p className="app-card__value">
                  {membership?.amount != null
                    ? formatCurrency(membership.amount, membership.currency)
                    : "—"}
                </p>
                <p className="app-card__sub">
                  {membership ? MEMBERSHIP_TEXT[membership.status] : "No payments yet"}
                </p>
                <Link to="/payments" className="app-card__link">
                  View Payments <span aria-hidden="true">→</span>
                </Link>
              </article>

              <article className="app-card app-summary__card">
                <span className="app-card__icon">
                  <LpIcon d={LP_PATHS.user} />
                </span>
                <h2>Profile</h2>
                <p className="app-card__value">{profileComplete ? "Complete" : "Incomplete"}</p>
                <p className="app-card__sub">{user ? maskMobile(user.mobile) : "Member profile"}</p>
                <Link to="/profile" className="app-card__link">
                  View Profile <span aria-hidden="true">→</span>
                </Link>
              </article>
            </div>

            {/* Primary grid — records first, shortcuts and account state beside it. */}
            <div className="dash-grid">
              <section className="dash-panel" aria-labelledby="my-family">
                <div className="dash-panel__head">
                  <h2 id="my-family">My Family</h2>
                  <Link to="/family" className="app-card__link">
                    View Family <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <p className="app-card__sub app-card__meta">
                  Family #{family.familyId} · {memberCount}{" "}
                  {memberCount === 1 ? "member" : "members"}
                  {family.head
                    ? ` · Head: ${fullName(family.head.firstName, family.head.middleName, family.head.lastName)}`
                    : ""}
                </p>
                <ul className="app-members">
                  {preview.map((m) => (
                    <li key={m.id} className="app-members__row">
                      <span className="app-avatar" aria-hidden="true">
                        {m.firstName.charAt(0).toUpperCase()}
                      </span>
                      <span className="app-members__info">
                        <strong>{fullName(m.firstName, m.middleName, m.lastName)}</strong>
                        <span>
                          {m.isHead
                            ? "Family Head"
                            : [m.age ? `${m.age} yrs` : null, m.occupation, m.area]
                                .filter(Boolean)
                                .join(" · ") || "Member"}
                        </span>
                      </span>
                      {m.isHead && <span className="badge badge--neutral">Head</span>}
                    </li>
                  ))}
                </ul>
                {remaining > 0 && (
                  <p className="app-card__sub">
                    +{remaining} more {remaining === 1 ? "member" : "members"}{" "}
                    <Link to="/family" className="app-card__link">
                      View all <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                )}
              </section>

              <section className="dash-panel" aria-labelledby="quick-actions">
                <div className="dash-panel__head">
                  <h2 id="quick-actions">Quick Actions</h2>
                </div>
                <p className="app-card__sub">Access the things you use most.</p>
                <ul className="dash-actions">
                  {QUICK_ACTIONS.map((a) => (
                    <li key={a.title}>
                      <Link to={a.to} className="dash-action">
                        <span className="dash-action__icon">
                          <LpIcon d={LP_PATHS[a.icon]} />
                        </span>
                        <span className="dash-action__text">
                          <strong>{a.title}</strong>
                          <span>{a.description}</span>
                        </span>
                        <span className="dash-action__arrow" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="dash-panel" aria-labelledby="recent-payments">
                <div className="dash-panel__head">
                  <h2 id="recent-payments">Recent Payments</h2>
                  <Link to="/payments" className="app-card__link">
                    View Payment History <span aria-hidden="true">→</span>
                  </Link>
                </div>
                {hasPayment && membership ? (
                  <ul className="app-rows">
                    <li>
                      <span>
                        <strong>{membership.year ?? year} Membership</strong>
                        <span>
                          {formatCurrency(membership.amount ?? 0, membership.currency)}
                          {membership.status === "pending" ? " · Not paid yet" : ""}
                        </span>
                      </span>
                      <StatusBadge status={MEMBERSHIP_BADGE[membership.status]} />
                    </li>
                  </ul>
                ) : (
                  <p className="app-card__sub">No payments recorded yet.</p>
                )}
              </section>

              <section className="dash-panel" aria-labelledby="membership">
                <div className="dash-panel__head">
                  <h2 id="membership">Membership</h2>
                  {membership && <StatusBadge status={MEMBERSHIP_BADGE[membership.status]} />}
                </div>
                <dl className="app-kv">
                  <div>
                    <dt>Plan</dt>
                    <dd>{year} Membership</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>
                      {membership?.amount != null
                        ? formatCurrency(membership.amount, membership.currency)
                        : "Fee not yet recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{membership ? MEMBERSHIP_TEXT[membership.status] : "—"}</dd>
                  </div>
                </dl>
                {isPaid ? (
                  <p className="app-card__sub">Membership active for {year}.</p>
                ) : (
                  <p className="app-card__sub">Complete your annual membership payment.</p>
                )}
                {isPaid ? (
                  <Link to="/payments" className="btn btn--secondary btn--sm">
                    View Payments
                  </Link>
                ) : (
                  <Link to="/payments" className="btn btn--primary btn--sm">
                    Pay Membership <span aria-hidden="true">→</span>
                  </Link>
                )}
              </section>
            </div>

            {/* Secondary row — community activity and events. */}
            <div className="dash-grid dash-grid--split">
              <section className="dash-panel" aria-labelledby="updates-heading" id="updates">
                <div className="dash-panel__head">
                  <h2 id="updates-heading">Community Updates</h2>
                </div>
                <div className="app-empty app-empty--compact">
                  <span className="app-empty__icon" aria-hidden="true">
                    <LpIcon d={LP_PATHS.bell} />
                  </span>
                  <h3>No new community updates.</h3>
                  <p>Important announcements will appear here.</p>
                </div>
              </section>

              <section className="dash-panel" aria-labelledby="upcoming-events">
                <div className="dash-panel__head">
                  <h2 id="upcoming-events">Upcoming Events</h2>
                </div>
                <div className="app-empty app-empty--compact">
                  <span className="app-empty__icon" aria-hidden="true">
                    <LpIcon d={LP_PATHS.calendar} />
                  </span>
                  <h3>No upcoming events.</h3>
                  <p>New community events and activities will appear here.</p>
                  <Link to="/programs" className="btn btn--secondary btn--sm">
                    Explore Programs <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </section>
            </div>
          </>
        )}
      </PageContainer>
    </AppLayout>
  );
}
