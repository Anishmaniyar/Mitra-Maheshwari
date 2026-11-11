import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { AppLayout } from "../components/layout/AppLayout";
import { FormField } from "../components/forms/FormField";
import { emptyProfile, saveDraft } from "../features/registration/draft";

/** Member Login: mobile number only — no names. The code is requested once,
 *  explicitly, on the verification step (never on this page's mount). */
export default function MemberLoginPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError(null);
    saveDraft({ memberId: "", mobile: digits, profile: emptyProfile(), flow: "login" });
    navigate("/register/verify");
  }

  return (
    <AppLayout variant="plain">
      <div className="lp">
        <AuthLayout
          eyebrow="Member Login"
          title={<>Log in with your mobile number</>}
          lead={<>Enter your registered mobile number to receive a verification code.</>}
          footer={
            <>
              New to the community? <Link to="/join">Join the Community</Link>
            </>
          }
        >
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="onb-form onb-form--narrow">
            <FormField label="Mobile number" htmlFor="login-mobile" error={error ?? undefined} required>
              <Input
                id="login-mobile"
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
                <Button type="submit">
                  Continue
                </Button>
              </div>
            </div>
          </form>
        </AuthLayout>
      </div>
    </AppLayout>
  );
}
