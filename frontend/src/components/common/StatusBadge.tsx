export type BadgeStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "none"
  | "active"
  | "inactive"
  | "info";

const LABELS: Record<BadgeStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  none: "Not paid",
  active: "Active",
  inactive: "Inactive",
  info: "Info",
};

const VARIANTS: Record<BadgeStatus, string> = {
  paid: "badge--success",
  pending: "badge--warning",
  failed: "badge--danger",
  refunded: "badge--neutral",
  none: "badge--neutral",
  active: "badge--success",
  inactive: "badge--neutral",
  info: "badge--info",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return <span className={`badge ${VARIANTS[status]}`}>{LABELS[status]}</span>;
}