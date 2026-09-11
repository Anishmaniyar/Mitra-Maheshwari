import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { FlowSteps } from "../components/common/FlowSteps";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
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
  const location = useLocation();
  const isLogin = location.pathname === "/login";
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
      <div className="lp">
        <section className="lp-hero lp-hero--page flow-hero">
          <PageContainer narrow>
            <span className="eyebrow">{isLogin ? "Member Login" : "Join the Community"}</span>
            <h1 className="lp-display lp-display--page">Let&rsquo;s find your community record</h1>
            <p className="lp-lead">
              Enter your details to check whether your community record already exists.
            </p>
            <FlowSteps current={1} />
          </PageContainer>
        </section>

        <section className="flow-body">
          <PageContainer narrow>
            {step === "form" && (
              <div className="form-card flow-card">
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
              <div className="form-card flow-card">
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
              <div className="form-card flow-card stack">
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
              <div className="form-card flow-card">
                <NewMemberForm
                  initial={attempt}
                  busy={creating}
                  error={error}
                  onSubmit={(input) => void handleCreateNew(input)}
                  onCancel={() => setStep("form")}
                />
              </div>
            )}
          </PageContainer>
        </section>
      </div>
    </AppLayout>
  );
}
