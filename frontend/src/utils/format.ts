/** e.g. 919876543210 -> +91 ••••• ••3210 */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return `+91 ••••• ••${digits.slice(-4)}`;
}

export function fullName(firstName: string, middleName: string | null, lastName: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(" ");
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") return currencyFormatter.format(amount);
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}