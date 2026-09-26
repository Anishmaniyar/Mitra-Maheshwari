import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { LoadingState } from "../components/common/LoadingState";
import { AppLayout } from "../components/layout/AppLayout";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
import { OtpVerifyForm } from "../features/authentication/OtpVerifyForm";
import { sendOtp, verifyOtp } from "../features/authentication/auth.service";
import { CandidatePicker } from "../features/registration/CandidatePicker";
import { NewMemberForm } from "../features/registration/NewMemberForm";
import { VerifyMemberForm } from "../features/registration/VerifyMemberForm";
import type { VerifyMemberInput } from "../features/registration/VerifyMemberForm";
import { profileFromMember, profileFromNewInput, saveDraft } from "../features/registration/draft";
import { createMember, matchMember } from "../features/registration/registration.service";
import { useCountdown } from "../hooks/useCountdown";
import { maskMobile } from "../utils/format";
import type { Member, NewMemberInput } from "../types/api";

type Step = "form" | "otp" | "loading" | "candidates" | "notfound" | "newMember" | "registered";

export default function VerifyMemberPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const [step, setStep] = useState<Step>("form");
  const [candidates, setCandidates] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<VerifyMemberInput | null>(null);
  const [creating, setCreating] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const { seconds, restart } = useCountdown(60);

  function startWithMember(member: Member, mobile: string) {
    saveDraft({
      memberId: member.id,
      mobile,
      profile: profileFromMember(member),
      flow: "join",
    });
    navigate("/register/details");
  }

  async function handleDetails(input: VerifyMemberInput) {
    setAttempt(input);
    setSending(true);
    setOtpError(null);
    try {
      await sendOtp({ memberId: "", mobile: input.mobile });
      restart();
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (!attempt || otp.length !== 6) {
      setOtpError("Enter the 6-digit code sent to your mobile number.");
      return;
    }
    setVerifying(true);
    setOtpError(null);
    try {
      // 200 means this mobile already has an account — it belongs to login.
      await verifyOtp({ memberId: "", mobile: attempt.mobile, otp });
      setStep("registered");
    } catch (err) {
      const status =
        err instanceof Error && "status" in err ? (err as { status?: number }).status : undefined;
      if (status === 404) {
        await lookupMember();
      } else {
        setOtpError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function lookupMember() {
    if (!attempt) return;
    setStep("loading");
    setError(null);
    try {
      const result = await matchMember(attempt);
      if (result.status === "EXISTING_MEMBER_FOUND" && result.member) {
        startWithMember(result.member, attempt.mobile);
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
      saveDraft({
        memberId: res.member.id,
        mobile: input.mobile,
        profile: profileFromNewInput(input),
        flow: "join",
      });
      navigate("/register/details");
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
              <VerifyMemberForm onSubmit={(input) => void handleDetails(input)} busy={sending} />
            </>
          )}

          {step === "otp" && attempt && (
            <OtpVerifyForm
              maskedMobile={maskMobile(attempt.mobile)}
              sending={sending}
              verifying={verifying}
              error={otpError}
              resendInSeconds={seconds}
              otp={otp}
              onOtpChange={setOtp}
              onSubmit={() => void handleVerifyOtp()}
              onResend={() => void handleDetails(attempt)}
              onChangeMobile={() => setStep("form")}
            />
          )}

          {step === "registered" && (
            <div className="onb-note">
              <h2>This mobile number is already registered.</h2>
              <p>Please log in with your verified mobile number instead.</p>
              <div className="onb-actions__buttons">
                <Link to="/login" className="btn btn--primary">
                  Go to Member Login
                </Link>
              </div>
            </div>
          )}

          {step === "loading" && <LoadingState message="Checking your details…" />}

          {step === "candidates" && attempt && (
            <CandidatePicker
              candidates={candidates}
              onSelect={(member) => startWithMember(member, attempt.mobile)}
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
