import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { maskMobile } from "../../utils/mobile";

export interface SmsProvider {
  send(mobile: string, code: string): Promise<void>;
}

/**
 * Development provider: prints the code to the server console so the flow is
 * testable without an SMS account. Deliberately inactive in production —
 * implement a real gateway (Twilio, MSG91, AWS SNS, ...) here and set
 * OTP_PROVIDER=sms. Callers only depend on the SmsProvider interface.
 */
const consoleProvider: SmsProvider = {
  async send(mobile, code) {
    if (env.NODE_ENV !== "production") {
      logger.info(`[DEV OTP] Verification code for ${maskMobile(mobile)}: ${code}`);
    }
  },
};

const providers: Record<string, SmsProvider> = {
  console: consoleProvider,
};

export const smsProvider: SmsProvider = providers[env.OTP_PROVIDER] ?? consoleProvider;