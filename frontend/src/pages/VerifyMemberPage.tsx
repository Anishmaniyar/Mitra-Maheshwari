import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/common/Button";
import { LoadingState } from "../components/common/LoadingState";
import { AppLayout } from "../components/layout/AppLayout";
import { OtpVerifyForm } from "../features/authentication/OtpVerifyForm";
import { sendOtp, verifyOtp } from "../features/authentication/auth.service";
import { CandidatePicker } from "../features/registration/CandidatePicker";
import { NewMemberForm } from "../features/registration/NewMemberForm";
import { VerifyMemberForm } from "../features/registration/VerifyMemberForm";
import type { VerifyMemberInput } from "../features/registration/VerifyMemberForm";
import { profileFromMember, profileFromNewInput, saveDraft } from "../features/registration/draft";
import { matchMember } from "../features/registration/registration.service";
import { useCountdown } from "../hooks/useCountdown";
import { maskMobile } from "../utils/format";
import type { Member, NewMemberInput } from "../types/api";

type Step = "form" | "otp" | "loading" | "candidates" | "notfound" | "newMember" | "registered";

const STAGE_COPY: Record<Step, { title: string; lead: string }> = {
  form: {
    title: "Let's find your community record",
    lead: "Enter your details to check whether your community record already exists.",
  },
  otp: {
    title: "Verify your mobile number",
    lead: "Enter the 6-digit code we sent to your mobile number.",
  },
  loading: {
    title: "Checking your details",
    lead: "This will only take a moment.",
  },
  candidates: {
    title: "Is this your community record?",
    lead: "Choose the record that belongs to you to continue.",
  },
  notfound: {
    title: "No matching record found",
    lead: "Double-check your details, or register your family as new.",
  },
  newMember: {
    title: "Register as a new family",
    lead: "Confirm your details to create your family head record.",
  },
  registered: {
    title: "This number is already registered",
    lead: "Log in with your verified mobile number to continue.",
  },
};

export default function VerifyMemberPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [candidates, setCandidates] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<VerifyMemberInput | null>(null);
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
      await sendOtp({ mobile: input.mobile, purpose: "REGISTRATION" });
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
      // Explicit outcome: only COMPLETE_REGISTRATION continues to matching.
      // Any existing account (approved or pending) belongs to login.
      const outcome = await verifyOtp({ mobile: attempt.mobile, otp });
      if (outcome.nextAction === "COMPLETE_REGISTRATION") {
        await lookupMember();
      } else if (outcome.nextAction === "AWAITING_APPROVAL") {
        setOtpError(
          "Your registration is awaiting admin approval. You will be able to log in once it is approved.",
        );
      } else if (outcome.nextAction === "CONTACT_SUPPORT") {
        // An approved number that used the join flow is a returning member,
        // not a rejected registration: send them to login instead of implying
        // their registration failed.
        if (outcome.accountStatus === "APPROVED") {
          setStep("registered");
        } else {
          setOtpError("This registration was not approved. Please contact community support.");
        }
      } else {
        setStep("registered");
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed. Please try again.");
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

  function handleCreateNew(input: NewMemberInput) {
    // No member row exists yet: the backend creates the family + head after
    // OTP verification. The draft only carries the entered details forward.
    setError(null);
    saveDraft({
      memberId: "",
      mobile: input.mobile,
      profile: profileFromNewInput(input),
      flow: "join",
    });
    navigate("/register/details");
  }

  return (
    <AppLayout variant="plain">
      <div className="lp">
        <AuthLayout
          eyebrow="Join the Community"
          title={STAGE_COPY[step].title}
          lead={STAGE_COPY[step].lead}
          footer={
            step === "form" ? (
              <>
                Already registered? <Link to="/login">Log in</Link>
              </>
            ) : undefined
          }
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
              <div className="onb-actions__buttons">
                <Link to="/login" className="btn btn--primary">
                  Go to Member Login
                </Link>
              </div>
            </div>
          )}

          {step === "loading" && <LoadingState message="Looking for your community record…" />}

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
              <p>
                Check the spelling of your name and mobile number, or register your family as new
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
              busy={false}
              error={error}
              onSubmit={(input) => void handleCreateNew(input)}
              onCancel={() => setStep("form")}
            />
          )}
        </AuthLayout>
      </div>
    </AppLayout>
  );
}
