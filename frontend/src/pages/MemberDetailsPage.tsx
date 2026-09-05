import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";
import { PageContainer } from "../components/common/PageContainer";
import { SectionHeading } from "../components/common/SectionHeading";
import { FormField } from "../components/forms/FormField";
import { FormSection } from "../components/forms/FormSection";
import { AppLayout } from "../components/layout/AppLayout";
import { getDraft, saveDraft } from "../features/registration/draft";
import type { ProfileFields } from "../types/api";
import { BLOOD_GROUPS } from "../types/api";
import { maskMobile } from "../utils/format";

export default function MemberDetailsPage() {
  const navigate = useNavigate();
  const draft = getDraft();
  const [form, setForm] = useState<ProfileFields>(() =>
    draft ? { ...draft.profile } : emptyProfile(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!draft) return <Navigate to="/register" replace />;
  const registration = draft; // non-null alias (TS keeps closure narrowing for const)

  function set<K extends keyof ProfileFields>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (form.age && (Number(form.age) < 1 || Number(form.age) > 120)) {
      next.age = "Enter an age between 1 and 120.";
    }
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.panNumber.trim())) {
      next.panNumber = "PAN must look like ABCDE1234F.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    saveDraft({ memberId: registration.memberId, mobile: registration.mobile, profile: form });
    navigate("/register/verify");
  }

  return (
    <AppLayout variant="public">
      <PageContainer narrow>
        <div style={{ paddingBlock: "var(--space-7)" }}>
          <SectionHeading
            as="h1"
            className="page-heading"
            title="Review Your Details"
            description="We found a community record matching your information. Please review the details below and correct anything that needs to be updated."
          />

          <form onSubmit={handleSubmit} noValidate className="form-card">
            <FormSection title="Basic information">
              <div className="grid-2">
                <FormField label="First name" htmlFor="md-firstName" error={errors.firstName} required>
                  <Input
                    id="md-firstName"
                    value={form.firstName}
                    invalid={Boolean(errors.firstName)}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </FormField>
                <FormField label="Middle name" htmlFor="md-middleName">
                  <Input id="md-middleName" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
                </FormField>
              </div>
              <FormField label="Last name" htmlFor="md-lastName" error={errors.lastName} required>
                <Input
                  id="md-lastName"
                  value={form.lastName}
                  invalid={Boolean(errors.lastName)}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </FormField>
              <FormField
                label="Mobile number"
                htmlFor="md-mobile"
                hint={`Your mobile number (${maskMobile(registration.mobile)}) is verified during registration and cannot be changed here.`}
              >
                <Input id="md-mobile" value={maskMobile(draft.mobile)} disabled />
              </FormField>
            </FormSection>

            <FormSection title="Personal details">
              <div className="grid-2">
                <FormField label="Age" htmlFor="md-age" error={errors.age}>
                  <Input
                    id="md-age"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={120}
                    value={form.age}
                    invalid={Boolean(errors.age)}
                    onChange={(e) => set("age", e.target.value)}
                    placeholder={form.age ? undefined : "Add if available"}
                  />
                </FormField>
                <FormField label="Blood group" htmlFor="md-bloodGroup">
                  <Select id="md-bloodGroup" value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                    <option value="">Not sure</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField label="Occupation" htmlFor="md-occupation">
                <Input
                  id="md-occupation"
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder={form.occupation ? undefined : "Add if available"}
                />
              </FormField>
            </FormSection>

            <FormSection title="Location">
              <FormField label="Area" htmlFor="md-area">
                <Input
                  id="md-area"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder={form.area ? undefined : "Add if available"}
                />
              </FormField>
            </FormSection>

            <FormSection title="PAN details">
              <div className="grid-2">
                <FormField label="PAN name" htmlFor="md-panName">
                  <Input
                    id="md-panName"
                    value={form.panName}
                    onChange={(e) => set("panName", e.target.value)}
                    placeholder={form.panName ? undefined : "Name on PAN card"}
                  />
                </FormField>
                <FormField label="PAN number" htmlFor="md-panNumber" error={errors.panNumber}>
                  <Input
                    id="md-panNumber"
                    value={form.panNumber}
                    invalid={Boolean(errors.panNumber)}
                    onChange={(e) => set("panNumber", e.target.value.toUpperCase())}
                    placeholder={form.panNumber ? undefined : "ABCDE1234F"}
                  />
                </FormField>
              </div>
            </FormSection>

            <div style={{ marginTop: "var(--space-6)" }}>
              <Button type="submit" block>
                Continue to Verification
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

function emptyProfile(): ProfileFields {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    bloodGroup: "",
    occupation: "",
    area: "",
    panName: "",
    panNumber: "",
  };
}