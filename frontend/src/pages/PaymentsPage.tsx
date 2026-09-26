import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { StatusBadge } from "../components/common/StatusBadge";
import type { BadgeStatus } from "../components/common/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { PaymentHistory } from "../features/payment/PaymentHistory";
import { createPayment, getPayments, payWithRazorpay, verifyPayment } from "../features/payment/payment.service";
import type { MembershipStatus, Payment } from "../types/api";
import { formatCurrency } from "../utils/format";

const MEMBERSHIP_BADGE: Record<MembershipStatus, BadgeStatus> = {
  none: "none",
  pending: "pending",
  paid: "paid",
  failed: "failed",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payNotice, setPayNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayments();
      setPayments(res.payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePay() {
    setPaying(true);
    setPayNotice(null);
    try {
      const res = await createPayment();
      if (!res.checkout.orderId) {
        setPayNotice({
          type: "success",
          text: "Your payment has been initiated. It will be confirmed once the gateway verifies it.",
        });
        if (res.payment) await load();
        return;
      }
      // Real Razorpay order: open Checkout, then verify server-side.
      // Nothing is treated as paid until backend verification succeeds.
      const gateway = await payWithRazorpay(res.checkout);
      await verifyPayment(gateway);
      setPayNotice({
        type: "success",
        text: "Payment verified successfully. Your membership is now active.",
      });
      await load();
    } catch (err) {
      setPayNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Could not start the payment. Please try again.",
      });
    } finally {
      setPaying(false);
    }
  }

  const latest = payments && payments.length > 0 ? payments[0] : null;
  const currentYear = new Date().getFullYear();
  const status: MembershipStatus = latest ? latest.status : "none";

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Payments"
            title="Payment History"
            description="View your membership payments and receipts."
          />

          {/* Current membership */}
          <div className="surface overview-list" style={{ marginBottom: "var(--space-6)" }}>
            <div className="overview-item">
              <div>
                <h3>Membership {latest?.year ?? currentYear}</h3>
                <p>{latest ? formatCurrency(latest.amount, latest.currency) : "Fee not yet recorded"}</p>
              </div>
              <StatusBadge status={MEMBERSHIP_BADGE[status]} />
            </div>
          </div>

          {payNotice && (
            <div className={`notice notice--${payNotice.type}`} style={{ marginBottom: "var(--space-4)" }}>
              {payNotice.text}
            </div>
          )}

          <div style={{ marginBottom: "var(--space-6)" }}>
            <Button onClick={() => void handlePay()} loading={paying} disabled={status === "paid"}>
              {status === "paid" ? "Membership Paid" : "Pay Membership"}
            </Button>
          </div>

          <section className="app-section" aria-labelledby="payment-history">
            <div className="app-section__head">
              <h2 id="payment-history">Payment history</h2>
            </div>

            {loading && <LoadingState message="Loading payments…" />}

            {error && payments === null && (
              <ErrorState
                title="We couldn't load your payment history."
                message={error}
                actionLabel="Try again"
                onAction={() => void load()}
              />
            )}

            {payments !== null && payments.length === 0 && (
              <EmptyState
                title="No payment history available."
                message="Once your family membership is paid, the payment will appear here."
              />
            )}

            {payments !== null && payments.length > 0 && (
              <div className="surface" style={{ overflowX: "auto" }}>
                <PaymentHistory payments={payments} />
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </AppLayout>
  );
}