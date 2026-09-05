import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { SectionHeading } from "../components/common/SectionHeading";
import { AppLayout } from "../components/layout/AppLayout";
import { CandidatePicker } from "../features/registration/CandidatePicker";
import { NewMemberForm } from "../features/registration/NewMemberForm";
import { VerifyMemberForm } from "../features/registration/VerifyMemberForm";
import type { VerifyMemberInput } from "../features/registration/VerifyMemberForm";
import { profileFromMember, saveDraft } from "../features/registration/draft";
import { createMember, matchMember } from "../features/registration/registration.service";
import type { Member, NewMemberInput } from "../types/api";

type Step = "form" | "loading" | "candidates" | "notfound" | "newMember";

export default function VerifyMemberPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [candidates, setCandidates] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<VerifyMemberInput | null>(null);
  const [creating, setCreating] = useState(false);

  function startWithMember(member: Member) {
    saveDraft({ memberId: member.id, mobile: member.mobile, profile: profileFromMember(member) });
    navigate("/register/details");
  }

  async function handleMatch(input: VerifyMemberInput) {
    setAttempt(input);
    setStep("loading");
    setError(null);
    try {
      const result = await matchMember(input);
      if (result.status === "EXISTING_MEMBER_FOUND" && result.member) {
        startWithMember(result.member);
      } else if (result.status === "MULTIPLE_MATCHES") {
        setCandidates(result.candidates);
        setStep("candidates");
      } else {
        setStep("notfound");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("form");
    }
  }

  async function handleCreateNew(input: NewMemberInput) {
    setCreating(true);
    setError(null);
    try {
      const res = await createMember(input);
      startWithMember(res.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your record. Please try again.");
      setStep("newMember");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppLayout variant="public">
      <PageContainer narrow>
        <div style={{ paddingBlock: "var(--space-7)" }}>
          <SectionHeading
            as="h1"
            className="page-heading"
            title="Let's Find Your Community Record"
            description="Enter your details to check whether your community record already exists."
          />

          {step === "form" && (
            <div className="form-card">
              {error && (
                <div className="notice notice--error" style={{ marginBottom: "var(--space-4)" }}>
                  {error}
                </div>
              )}
              <VerifyMemberForm onSubmit={(input) => void handleMatch(input)} busy={false} />
            </div>
          )}

          {step === "loading" && <LoadingState message="Checking your details…" />}

          {step === "candidates" && (
            <div className="form-card">
              <CandidatePicker
                candidates={candidates}
                onSelect={startWithMember}
                onBack={() => {
                  setCandidates([]);
                  setStep("form");
                }}
              />
            </div>
          )}

          {step === "notfound" && (
            <div className="form-card stack">
              <div className="state" style={{ padding: 0 }}>
                <h3>We couldn't find a matching community record.</h3>
                <p>
                  Please double-check your name and mobile number — or register your family as new
                  if you're not in our records yet.
                </p>
              </div>
              <div className="grid-2">
                <Button variant="secondary" onClick={() => setStep("form")}>
                  Try again
                </Button>
                <Button onClick={() => setStep("newMember")}>
                  Register as a new family
                </Button>
              </div>
            </div>
          )}

          {step === "newMember" && attempt && (
            <div className="form-card">
              <NewMemberForm
                initial={attempt}
                busy={creating}
                error={error}
                onSubmit={(input) => void handleCreateNew(input)}
                onCancel={() => setStep("form")}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}