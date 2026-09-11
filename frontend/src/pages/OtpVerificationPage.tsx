import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { FlowSteps } from "../components/common/FlowSteps";
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
      <div className="lp">
        <section className="lp-hero lp-hero--page flow-hero">
          <PageContainer narrow>
            <span className="eyebrow">Almost Done · Step 3 of 3</span>
            <h1 className="lp-display lp-display--page">Verify your mobile number</h1>
            <p className="lp-lead">
              We&rsquo;ve sent a 6-digit verification code to your mobile number. Enter it below
              to complete your login.
            </p>
            <FlowSteps current={3} />
          </PageContainer>
        </section>

        <section className="flow-body">
          <PageContainer narrow>
            <div className="form-card flow-card">
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
          </PageContainer>
        </section>
      </div>
    </AppLayout>
  );
}