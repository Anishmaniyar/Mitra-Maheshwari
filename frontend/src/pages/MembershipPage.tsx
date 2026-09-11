import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { StatusBadge } from "../components/common/StatusBadge";
import type { BadgeStatus } from "../components/common/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { getPayments } from "../features/payment/payment.service";
import type { MembershipStatus, Payment } from "../types/api";
import { formatCurrency } from "../utils/format";

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

export default function MembershipPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayments();
      setPayments(res.payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your membership.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = payments && payments.length > 0 ? payments[0] : null;
  const status: MembershipStatus = latest ? latest.status : "none";
  const year = latest?.year ?? new Date().getFullYear();

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Membership"
            title="Current Membership Status"
            description="Your family's annual community membership at a glance."
          />

          {loading && <LoadingState message="Loading membership…" />}

          {error && payments === null && (
            <ErrorState
              title="We couldn't load your membership."
              message={error}
              actionLabel="Try again"
              onAction={() => void load()}
            />
          )}

          {payments !== null && (
            <div className="app-card">
              <dl className="app-kv">
                <div>
                  <dt>Plan</dt>
                  <dd>{year} Membership</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {latest ? formatCurrency(latest.amount, latest.currency) : "Fee not yet recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{MEMBERSHIP_TEXT[status]}</dd>
                </div>
              </dl>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <StatusBadge status={MEMBERSHIP_BADGE[status]} />
                <Link to="/payments" className="btn btn--primary btn--sm">
                  {status === "paid" ? "View Payments" : "Pay Membership"}{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
