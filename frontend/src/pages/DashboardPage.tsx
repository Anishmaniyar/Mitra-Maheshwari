import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { SectionHeading } from "../components/common/SectionHeading";
import { StatusBadge } from "../components/common/StatusBadge";
import type { BadgeStatus } from "../components/common/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { getFamily } from "../features/family/family.service";
import { useAuth } from "../hooks/useAuth";
import type { Family, MembershipStatus } from "../types/api";
import { formatCurrency, fullName } from "../utils/format";

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFamily();
      setFamily(res.family);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your family details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  const membership = family?.membership;

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div style={{ paddingBlock: "var(--space-6)" }}>
          <SectionHeading
            as="h1"
            className="page-heading"
            title={user ? `Welcome, ${user.firstName}` : "Welcome"}
            description="Manage your family membership and community information."
          />

          {loading && <LoadingState message="Loading your dashboard…" />}

          {error && !family && (
            <ErrorState
              title="We couldn't load your dashboard."
              message={error}
              actionLabel="Try again"
              onAction={() => void loadFamily()}
            />
          )}

          {family && (
            <div className="surface overview-list">
              <div className="overview-item">
                <div>
                  <h3>Family</h3>
                  <p>
                    Family #{family.familyId} · {family.members.length}{" "}
                    {family.members.length === 1 ? "member" : "members"}
                    {family.head
                      ? ` · Head: ${fullName(family.head.firstName, family.head.middleName, family.head.lastName)}`
                      : ""}
                  </p>
                </div>
                <Link to="/family" className="btn btn--secondary btn--sm">
                  Manage Family
                </Link>
              </div>

              <div className="overview-item">
                <div>
                  <h3>Membership</h3>
                  <p>
                    {membership?.year ?? new Date().getFullYear()} ·{" "}
                    {membership ? MEMBERSHIP_TEXT[membership.status] : "—"}
                  </p>
                </div>
                <Link to="/payments" className="btn btn--secondary btn--sm">
                  View Membership
                </Link>
              </div>

              <div className="overview-item">
                <div>
                  <h3>Payments</h3>
                  {membership && membership.status !== "none" && membership.amount != null ? (
                    <p>
                      {formatCurrency(membership.amount, membership.currency)} ·{" "}
                      {membership.year ?? "—"} · <StatusBadge status={MEMBERSHIP_BADGE[membership.status]} />
                    </p>
                  ) : (
                    <p>No payments yet</p>
                  )}
                </div>
                <Link to="/payments" className="btn btn--secondary btn--sm">
                  View Payments
                </Link>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}