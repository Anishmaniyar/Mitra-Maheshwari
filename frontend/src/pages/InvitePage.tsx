import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { ErrorState } from "../components/common/ErrorState";
import { Input } from "../components/common/Input";
import { LoadingState } from "../components/common/LoadingState";
import { AppLayout } from "../components/layout/AppLayout";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
import { OtpVerifyForm } from "../features/authentication/OtpVerifyForm";
import { sendOtp, verifyOtp } from "../features/authentication/auth.service";
import {
  acceptInvitation,
  validateInvitation,
  type InvitationValidation,
} from "../features/family/family.service";
import { NewMemberForm } from "../features/registration/NewMemberForm";
import { useCountdown } from "../hooks/useCountdown";
import { maskMobile } from "../utils/format";
import type { NewMemberInput } from "../types/api";
import { FormField } from "../components/forms/FormField";

type Step = "loading" | "mobile" | "code" | "profile" | "done" | "invalid";

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("loading");
  const [invitation, setInvitation] = useState<InvitationValidation | null>(null);
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { seconds, restart } = useCountdown(60);

  useEffect(() => {
    if (!token) {
      setStep("invalid");
      return;
    }
    validateInvitation(token)
      .then((res) => {
        setInvitation(res);
        setStep("mobile");
      })
      .catch(() => setStep("invalid"));
  }, [token]);

  const requestCode = useCallback(async () => {
    const digits = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setMobileError("Enter a valid 10-digit mobile number.");
      return;
    }
    setMobileError(null);
    setSending(true);
    setError(null);
    try {
      await sendOtp({ memberId: "", mobile: digits });
      setMobile(digits);
      restart();
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    } finally {
      setSending(false);
    }
  }, [mobile, restart]);

  function handleMobileSubmit(e: FormEvent) {
    e.preventDefault();
    void requestCode();
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code sent to your mobile number.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      // A 404 here is the expected path: the number is verified (proof for
      // acceptance) but has no account yet. A 200 means already registered.
      await verifyOtp({ memberId: "", mobile, otp });
      setError("This mobile number is already registered. Please log in instead.");
    } catch (err) {
      const status =
        err instanceof Error && "status" in err ? (err as { status?: number }).status : undefined;
      if (status === 404) {
        setStep("profile");
      } else {
        setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleAccept(input: NewMemberInput) {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      await acceptInvitation(token, {
        mobile,
        firstName: input.firstName,
        middleName: input.middleName ?? undefined,
        lastName: input.lastName,
        bloodGroup: input.bloodGroup ?? undefined,
        age: input.age ?? undefined,
        occupation: input.occupation ?? undefined,
        area: input.area ?? undefined,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete your acceptance. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  const names = splitName(invitation?.inviteeName ?? "");

  return (
    <AppLayout variant="plain">
      <div className="lp home">
        <OnboardingLayout
          step={1}
          eyebrow="Family Invitation"
          title={<>You&rsquo;re invited to join a family</>}
          lead={
            <>
              {invitation
                ? `${invitation.inviteeName} — verify your mobile number to accept this invitation.`
                : "Validate your invitation link to continue."}
            </>
          }
        >
          {step === "loading" && <LoadingState message="Validating your invitation…" />}

          {step === "invalid" && (
            <ErrorState
              title="This invitation link is not valid."
              message="It may have expired, been cancelled, or already been used. Please ask the Family Head for a new invitation."
              actionLabel="Go to login"
              onAction={() => navigate("/login")}
            />
          )}

          {step === "mobile" && (
            <form onSubmit={handleMobileSubmit} noValidate className="onb-form onb-form--narrow">
              <FormField label="Mobile number" htmlFor="inv-mobile" error={mobileError ?? undefined} required>
                <Input
                  id="inv-mobile"
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  invalid={Boolean(mobileError)}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                />
              </FormField>
              {error && <div className="notice notice--error">{error}</div>}
              <div className="onb-actions__buttons">
                <Button type="submit" loading={sending}>
                  Send verification code
                </Button>
              </div>
            </form>
          )}

          {step === "code" && (
            <OtpVerifyForm
              maskedMobile={maskMobile(mobile)}
              sending={sending}
              verifying={verifying}
              error={error}
              resendInSeconds={seconds}
              otp={otp}
              onOtpChange={setOtp}
              onSubmit={() => void handleVerify()}
              onResend={() => void requestCode()}
              onChangeMobile={() => setStep("mobile")}
            />
          )}

          {step === "profile" && (
            <NewMemberForm
              initial={{ firstName: names.firstName, lastName: names.lastName, mobile }}
              busy={accepting}
              error={error}
              onSubmit={(input) => void handleAccept(input)}
              onCancel={() => setStep("mobile")}
            />
          )}

          {step === "done" && (
            <div className="onb-note">
              <h2>Welcome to the family!</h2>
              <p>
                Your membership has been added. You can now log in with your verified mobile
                number.
              </p>
              <div className="onb-actions__buttons">
                <Link to="/login" className="btn btn--primary">
                  Go to login
                </Link>
              </div>
            </div>
          )}
        </OnboardingLayout>
      </div>
    </AppLayout>
  );
}
