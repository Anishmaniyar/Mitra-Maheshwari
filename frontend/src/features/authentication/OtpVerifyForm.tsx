import { Button } from "../../components/common/Button";
import { OtpInput } from "../../components/forms/OtpInput";
import { DEMO_MODE, DEMO_TEST_OTP } from "../../config/demo";

interface OtpVerifyFormProps {
  maskedMobile: string;
  sending: boolean;
  verifying: boolean;
  error: string | null;
  resendInSeconds: number;
  otp: string;
  onOtpChange: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onChangeMobile: () => void;
}

export function OtpVerifyForm({
  maskedMobile,
  sending,
  verifying,
  error,
  resendInSeconds,
  otp,
  onOtpChange,
  onSubmit,
  onResend,
  onChangeMobile,
}: OtpVerifyFormProps) {
  const canResend = !sending && resendInSeconds <= 0;

  return (
    <form
      className="onb-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <p className="onb-hint">
        A 6-digit verification code was sent to <strong>{maskedMobile}</strong>.
      </p>

      {DEMO_MODE && (
        <div className="notice notice--info">
          <strong>Development mode:</strong> OTP verification is simulated. Enter the demo code{" "}
          <strong>{DEMO_TEST_OTP}</strong> to continue.
        </div>
      )}

      {error && <div className="notice notice--error">{error}</div>}

      <div className="onb-otp">
        <OtpInput
          value={otp}
          onChange={onOtpChange}
          invalid={Boolean(error)}
          autoFocus
        />
      </div>

      <div className="onb-actions">
        <div className="onb-actions__links">
          {canResend ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onResend} disabled={sending}>
              Resend OTP
            </button>
          ) : (
            <span className="onb-hint">
              {sending ? "Sending code…" : `Resend code in ${resendInSeconds}s`}
            </span>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={onChangeMobile}>
            Change mobile number
          </button>
        </div>
        <div className="onb-actions__buttons">
          <Button type="submit" loading={verifying} disabled={otp.length !== 6}>
            Verify &amp; Continue
          </Button>
        </div>
      </div>
    </form>
  );
}
