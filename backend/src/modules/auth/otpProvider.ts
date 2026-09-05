import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { maskMobile } from "../../utils/mobile";

export interface OtpProvider {
  send(mobile: string, code: string): Promise<void>;
}

/**
 * Development provider: prints the code to the server console so the flow can
 * be tested without an SMS account. To go live, implement a provider that calls
 * your SMS gateway (e.g. Twilio, MSG91, AWS SNS) and set OTP_PROVIDER=sms.
 * Callers only depend on the OtpProvider interface, so swapping is local.
 */
const consoleProvider: OtpProvider = {
  async send(mobile, code) {
    logger.info(`[OTP] Verification code for ${maskMobile(mobile)}: ${code}`);
  },
};

const providers: Record<string, OtpProvider> = {
  console: consoleProvider,
};

export const otpProvider: OtpProvider = providers[env.OTP_PROVIDER] ?? consoleProvider;