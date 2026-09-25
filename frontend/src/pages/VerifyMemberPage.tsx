import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { LoadingState } from "../components/common/LoadingState";
import { AppLayout } from "../components/layout/AppLayout";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
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
    <AppLayout variant="plain">
      <div className="lp home">
        <OnboardingLayout
          step={1}
          eyebrow={isLogin ? "Member Login" : "Join the Community"}
          title={<>Let&rsquo;s find your community record</>}
          lead={<>Enter your details to check whether your community record already exists.</>}
        >
          {step === "form" && (
            <>
              {error && <div className="notice notice--error">{error}</div>}
              <VerifyMemberForm onSubmit={(input) => void handleMatch(input)} busy={false} />
            </>
          )}

          {step === "loading" && <LoadingState message="Checking your details…" />}

          {step === "candidates" && (
            <CandidatePicker
              candidates={candidates}
              onSelect={startWithMember}
              onBack={() => {
                setCandidates([]);
                setStep("form");
              }}
            />
          )}

          {step === "notfound" && (
            <div className="onb-note">
              <h2>We couldn't find a matching community record.</h2>
              <p>
                Please double-check your name and mobile number — or register your family as new
                if you're not in our records yet.
              </p>
              <div className="onb-actions">
                <div className="onb-actions__links">
                  <Button variant="secondary" onClick={() => setStep("form")}>
                    Try again
                  </Button>
                </div>
                <div className="onb-actions__buttons">
                  <Button onClick={() => setStep("newMember")}>Register as a new family</Button>
                </div>
              </div>
            </div>
          )}

          {step === "newMember" && attempt && (
            <NewMemberForm
              initial={attempt}
              busy={creating}
              error={error}
              onSubmit={(input) => void handleCreateNew(input)}
              onCancel={() => setStep("form")}
            />
          )}
        </OnboardingLayout>
      </div>
    </AppLayout>
  );
}
