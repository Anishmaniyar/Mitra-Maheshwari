import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { FormField } from "../../components/forms/FormField";

export interface VerifyMemberInput {
  firstName: string;
  lastName: string;
  mobile: string;
}

interface VerifyMemberFormProps {
  onSubmit: (input: VerifyMemberInput) => void;
  busy: boolean;
}

export function VerifyMemberForm({ onSubmit, busy }: VerifyMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "Please enter your first name.";
    if (!lastName.trim()) next.lastName = "Please enter your last name.";
    const digits = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) next.mobile = "Enter a valid 10-digit mobile number.";

    setErrors(next);
    if (Object.keys(next).length === 0) {
      onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), mobile: digits });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="stack">
      <FormField label="First name" htmlFor="vm-firstName" error={errors.firstName} required>
        <Input
          id="vm-firstName"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          invalid={Boolean(errors.firstName)}
          autoFocus
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="e.g. Rajesh"
        />
      </FormField>

      <FormField label="Last name" htmlFor="vm-lastName" error={errors.lastName} required>
        <Input
          id="vm-lastName"
          name="lastName"
          autoComplete="family-name"
          value={lastName}
          invalid={Boolean(errors.lastName)}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="e.g. Mehta"
        />
      </FormField>

      <FormField label="Mobile number" htmlFor="vm-mobile" error={errors.mobile} required>
        <Input
          id="vm-mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          value={mobile}
          invalid={Boolean(errors.mobile)}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
        />
      </FormField>

      <Button type="submit" block loading={busy}>
        Continue
      </Button>

      <p className="muted" style={{ fontSize: "var(--font-size-sm)" }}>
        Your details will be used only to identify your community record and continue registration.
      </p>
    </form>
  );
}