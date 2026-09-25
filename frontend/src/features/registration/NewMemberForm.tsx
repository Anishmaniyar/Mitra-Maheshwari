import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { FormField } from "../../components/forms/FormField";
import type { NewMemberInput } from "../../types/api";

interface NewMemberFormProps {
  /** Prefilled from the details the user just entered on the match step. */
  initial: { firstName: string; lastName: string; mobile: string };
  busy: boolean;
  error: string | null;
  onSubmit: (input: NewMemberInput) => void;
  onCancel: () => void;
}

export function NewMemberForm({ initial, busy, error, onSubmit, onCancel }: NewMemberFormProps) {
  const [form, setForm] = useState({
    firstName: initial.firstName,
    middleName: "",
    lastName: initial.lastName,
    mobile: initial.mobile,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    const digits = form.mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) next.mobile = "Enter a valid 10-digit mobile number.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim(),
      mobile: digits,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="onb-form">
      <div className="notice notice--info">
        Your details did not match any existing community record. You can register as a new family —
        your family head record will be created after mobile verification.
      </div>

      <div className="onb-grid">
        <FormField label="First name" htmlFor="nm-firstName" error={errors.firstName} required>
          <Input
            id="nm-firstName"
            value={form.firstName}
            invalid={Boolean(errors.firstName)}
            autoFocus
            onChange={(e) => set("firstName", e.target.value)}
          />
        </FormField>
        <FormField label="Middle name" htmlFor="nm-middleName">
          <Input id="nm-middleName" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
        </FormField>
        <FormField label="Last name" htmlFor="nm-lastName" error={errors.lastName} required>
          <Input
            id="nm-lastName"
            value={form.lastName}
            invalid={Boolean(errors.lastName)}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="nm-mobile" error={errors.mobile} required>
          <Input
            id="nm-mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile}
            invalid={Boolean(errors.mobile)}
            onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
        </FormField>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="onb-actions">
        <div className="onb-actions__links">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Back
          </Button>
        </div>
        <div className="onb-actions__buttons">
          <Button type="submit" loading={busy}>
            Create my record
          </Button>
        </div>
      </div>
    </form>
  );
}
