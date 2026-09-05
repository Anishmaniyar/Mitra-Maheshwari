import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  /** accounts.id */
  accountId: number;
  /** members.id — the community member the account belongs to */
  memberId: number;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

/** Returns the payload for a valid token, or null if invalid/expired. */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as Record<string, unknown>).accountId === "number" &&
      typeof (decoded as Record<string, unknown>).memberId === "number"
    ) {
      return {
        accountId: (decoded as Record<string, unknown>).accountId as number,
        memberId: (decoded as Record<string, unknown>).memberId as number,
      };
    }
    return null;
  } catch {
    return null;
  }
}