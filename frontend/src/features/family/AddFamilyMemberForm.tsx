import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { FormField } from "../../components/forms/FormField";
import { FormSection } from "../../components/forms/FormSection";
import type { NewMemberInput } from "../../types/api";
import { BLOOD_GROUPS } from "../../types/api";

interface AddFamilyMemberFormProps {
  busy: boolean;
  error: string | null;
  onAdd: (input: NewMemberInput) => void;
  onCancel: () => void;
}

export function AddFamilyMemberForm({ busy, error, onAdd, onCancel }: AddFamilyMemberFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobile: "",
    bloodGroup: "",
    age: "",
    occupation: "",
    area: "",
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
    if (form.age && (Number(form.age) < 1 || Number(form.age) > 120)) next.age = "Enter an age between 1 and 120.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onAdd({
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim(),
      mobile: digits,
      bloodGroup: form.bloodGroup || null,
      age: form.age ? Number(form.age) : null,
      occupation: form.occupation.trim() || null,
      area: form.area.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form-card">
      <FormSection title="Basic information">
        <div className="grid-2">
          <FormField label="First name" htmlFor="am-firstName" error={errors.firstName} required>
            <Input
              id="am-firstName"
              value={form.firstName}
              invalid={Boolean(errors.firstName)}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="e.g. Sunita"
            />
          </FormField>
          <FormField label="Middle name" htmlFor="am-middleName">
            <Input
              id="am-middleName"
              value={form.middleName}
              onChange={(e) => set("middleName", e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Last name" htmlFor="am-lastName" error={errors.lastName} required>
          <Input
            id="am-lastName"
            value={form.lastName}
            invalid={Boolean(errors.lastName)}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="e.g. Mehta"
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="am-mobile" error={errors.mobile} required>
          <Input
            id="am-mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile}
            invalid={Boolean(errors.mobile)}
            onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
          />
        </FormField>
      </FormSection>

      <FormSection title="Personal details">
        <div className="grid-2">
          <FormField label="Age" htmlFor="am-age" error={errors.age}>
            <Input
              id="am-age"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={form.age}
              invalid={Boolean(errors.age)}
              onChange={(e) => set("age", e.target.value)}
              placeholder="Age"
            />
          </FormField>
          <FormField label="Blood group" htmlFor="am-bloodGroup">
            <Select id="am-bloodGroup" value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
              <option value="">Not sure</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Occupation" htmlFor="am-occupation">
          <Input
            id="am-occupation"
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            placeholder="e.g. Business"
          />
        </FormField>
        <FormField label="Area / Sector" htmlFor="am-area">
          <Input
            id="am-area"
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
            placeholder="e.g. Sector 14"
          />
        </FormField>
      </FormSection>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="grid-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Add member
        </Button>
      </div>
    </form>
  );
}