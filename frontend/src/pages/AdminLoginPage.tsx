import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { AppLayout } from "../components/layout/AppLayout";
import { OnboardingLayout } from "../components/onboarding/OnboardingLayout";
import { FormField } from "../components/forms/FormField";
import { OtpVerifyForm } from "../features/authentication/OtpVerifyForm";
import { devAdminLogin, sendOtp, verifyOtp } from "../features/authentication/auth.service";
import { clearToken } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useCountdown } from "../hooks/useCountdown";
import { maskMobile } from "../utils/format";

type Step = "mobile" | "code";

/** Admin Login: mobile + OTP, then the account role must be ADMIN. */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devLoggingIn, setDevLoggingIn] = useState(false);
  const { seconds, restart } = useCountdown(60);
  // Rendered only by the Vite dev server; never in production builds.
  const showDevShortcut = import.meta.env.DEV;

  async function requestCode() {
    const digits = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await sendOtp({ memberId: "", mobile: digits, purpose: "LOGIN" });
      setMobile(digits);
      restart();
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    } finally {
      setSending(false);
    }
  }

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
      const result = await verifyOtp({ memberId: "", mobile, otp });
      if (result.nextAction !== "LOGGED_IN" || !result.token || !result.member) {
        if (result.nextAction === "AWAITING_APPROVAL") {
          setError("This admin account is awaiting approval.");
        } else {
          setError("This mobile number is not registered as an admin.");
        }
        return;
      }
      if (result.member.role !== "ADMIN") {
        clearToken();
        setError("This mobile number is not registered as an admin.");
        return;
      }
      login(result.token, result.member);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDevLogin() {
    setDevLoggingIn(true);
    setError(null);
    try {
      const result = await devAdminLogin();
      if (!result.token || !result.member || result.member.role !== "ADMIN") {
        clearToken();
        setError("Development login did not return an admin session.");
        return;
      }
      login(result.token, result.member);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Development login failed. Is the backend running?");
    } finally {
      setDevLoggingIn(false);
    }
  }

  return (
    <AppLayout variant="plain">
      <div className="lp home">
        <OnboardingLayout
          step={1}
          eyebrow="Admin Login"
          title={<>Administrator access</>}
          lead={<>Enter your admin mobile number to receive a verification code.</>}
        >
          {showDevShortcut && (
            <div className="onb-form onb-form--narrow" style={{ marginBottom: "var(--space-5)" }}>
              <div className="notice notice--info">
                Local development only — skip OTP and sign in directly.
              </div>
              <Button
                type="button"
                variant="secondary"
                loading={devLoggingIn}
                onClick={() => void handleDevLogin()}
              >
                Login as Admin
              </Button>
            </div>
          )}
          {step === "mobile" && (
            <form onSubmit={handleMobileSubmit} noValidate className="onb-form onb-form--narrow">
              <FormField label="Mobile number" htmlFor="admin-mobile" error={error ?? undefined} required>
                <Input
                  id="admin-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={mobile}
                  invalid={Boolean(error)}
                  autoFocus
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                />
              </FormField>
              <div className="onb-actions">
                <div className="onb-actions__buttons">
                  <Button type="submit" loading={sending}>
                    Get OTP
                  </Button>
                </div>
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
        </OnboardingLayout>
      </div>
    </AppLayout>
  );
}
