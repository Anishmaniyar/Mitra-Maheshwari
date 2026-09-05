import { AppError } from "./http";

/**
 * Normalizes an Indian mobile number to E.164 digits without the leading "+",
 * e.g. "98765 43210" -> "919876543210". Matching and storage use this form.
 */
export function normalizeMobile(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;

  if (!/^91[6-9]\d{9}$/.test(digits)) {
    throw new AppError(400, "INVALID_MOBILE", "Enter a valid 10-digit Indian mobile number.");
  }
  return digits;
}

/** Masks all but the last four digits, e.g. "•••• ••3210". */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return `•••• ••${digits.slice(-4)}`;
}