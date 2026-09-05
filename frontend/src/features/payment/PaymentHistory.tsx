import { StatusBadge } from "../../components/common/StatusBadge";
import type { BadgeStatus } from "../../components/common/StatusBadge";
import type { Payment, PaymentStatus } from "../../types/api";
import { formatCurrency, formatDate } from "../../utils/format";

const STATUS_BADGE: Record<PaymentStatus, BadgeStatus> = {
  paid: "paid",
  pending: "pending",
  failed: "failed",
};

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Year</th>
          <th scope="col">Amount</th>
          <th scope="col">Payment Method</th>
          <th scope="col">Transaction ID</th>
          <th scope="col">Date</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p.id}>
            <td data-label="Year">{p.year}</td>
            <td data-label="Amount">{formatCurrency(p.amount, p.currency)}</td>
            <td data-label="Payment Method">{p.transactionMode || "—"}</td>
            <td data-label="Transaction ID">{p.transactionId ?? "—"}</td>
            <td data-label="Date">{formatDate(p.createdAt)}</td>
            <td data-label="Status">
              <StatusBadge status={STATUS_BADGE[p.status]} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}