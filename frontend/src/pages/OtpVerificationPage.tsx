import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { SectionHeading } from "../components/common/SectionHeading";
import { AppLayout } from "../components/layout/AppLayout";
import { OtpVerifyForm } from "../features/authentication/OtpVerifyForm";
import { resendOtp, sendOtp, updateMe, verifyOtp } from "../features/authentication/auth.service";
import { clearDraft, getDraft, profileToPatch } from "../features/registration/draft";
import { useAuth } from "../hooks/useAuth";
import { useCountdown } from "../hooks/useCountdown";
import { maskMobile } from "../utils/format";

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const { login, setUser } = useAuth();
  const draft = getDraft();

  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { seconds, restart } = useCountdown(60);
  const sentOnce = useRef(false);

  const requestOtp = useCallback(
    async (resend: boolean) => {
      if (!draft) return;
      setSending(true);
      setError(null);
      try {
        const call = resend ? resendOtp : sendOtp;
        await call({ memberId: draft.memberId, mobile: draft.mobile });
        restart();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [draft, restart],
  );

  // Send the OTP on first load (guarded so StrictMode's double effect doesn't resend).
  useEffect(() => {
    if (!draft || sentOnce.current) return;
    sentOnce.current = true;
    void requestOtp(false);
  }, [draft, requestOtp]);

  if (!draft) return <Navigate to="/register" replace />;
  const registration = draft; // non-null alias for closures

  async function handleVerify() {
    if (!registration) return;
    if (otp.length !== 6) {
      setError("Enter the 6-digit code sent to your mobile number.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const result = await verifyOtp({
        memberId: registration.memberId,
        mobile: registration.mobile,
        otp,
      });
      login(result.token, result.member);
      // Persist any corrections made on the review form now that the number is verified.
      const me = await updateMe(profileToPatch(registration.profile));
      setUser(me.member);
      clearDraft();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(message);
      if (err instanceof Error && "code" in err && (err as { code?: string }).code === "OTP_EXPIRED") {
        setOtp("");
        restart();
      }
    } finally {
      setVerifying(false);
    }
  }

  function handleChangeMobile() {
    clearDraft();
    navigate("/register");
  }

  return (
    <AppLayout variant="public">
      <PageContainer narrow>
        <div style={{ paddingBlock: "var(--space-7)" }}>
          <SectionHeading
            as="h1"
            className="page-heading"
            title="Verify Your Mobile Number"
            description="We've sent a verification code to your mobile number."
          />
          <div className="form-card">
            <OtpVerifyForm
              maskedMobile={maskMobile(registration.mobile)}
              sending={sending}
              verifying={verifying}
              error={error}
              resendInSeconds={seconds}
              otp={otp}
              onOtpChange={setOtp}
              onSubmit={() => void handleVerify()}
              onResend={() => void requestOtp(true)}
              onChangeMobile={handleChangeMobile}
            />
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}