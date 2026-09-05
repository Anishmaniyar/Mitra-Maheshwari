import { Input } from "../common/Input";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({ value, onChange, invalid = false, autoFocus = false }: OtpInputProps) {
  return (
    <Input
      className="otp-input"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="••••••"
      aria-label="6-digit verification code"
      value={value}
      invalid={invalid}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
    />
  );
}