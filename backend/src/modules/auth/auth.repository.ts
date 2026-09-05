import { pool } from "../../config/database";
import type { AccountRow, OtpRow } from "./auth.types";

// --- accounts -------------------------------------------------------------

export async function findAccountByMemberId(memberId: number): Promise<AccountRow | null> {
  const { rows } = await pool.query<AccountRow>("SELECT * FROM accounts WHERE member_id = $1", [memberId]);
  return rows[0] ?? null;
}

export async function createAccount(memberId: number, mobile: string): Promise<AccountRow> {
  const { rows } = await pool.query<AccountRow>(
    "INSERT INTO accounts (member_id, mobile) VALUES ($1, $2) RETURNING *",
    [memberId, mobile],
  );
  return rows[0]!;
}

export async function touchLogin(accountId: number): Promise<void> {
  await pool.query("UPDATE accounts SET last_login_at = now() WHERE id = $1", [accountId]);
}

// --- otps ------------------------------------------------------------------

export async function findLatestActiveOtp(mobile: string): Promise<OtpRow | null> {
  const { rows } = await pool.query<OtpRow>(
    `SELECT * FROM otps
     WHERE mobile = $1 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [mobile],
  );
  return rows[0] ?? null;
}

export async function createOtp(input: {
  memberId: number;
  mobile: string;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
  resendCount: number;
}): Promise<OtpRow> {
  const { rows } = await pool.query<OtpRow>(
    `INSERT INTO otps (member_id, mobile, code_hash, expires_at, max_attempts, resend_count)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.memberId, input.mobile, input.codeHash, input.expiresAt, input.maxAttempts, input.resendCount],
  );
  return rows[0]!;
}

export async function deleteActiveOtpsForMobile(mobile: string): Promise<void> {
  await pool.query("DELETE FROM otps WHERE mobile = $1 AND consumed_at IS NULL", [mobile]);
}

export async function incrementOtpAttempts(id: number): Promise<void> {
  await pool.query("UPDATE otps SET attempts = attempts + 1 WHERE id = $1", [id]);
}

export async function consumeOtp(id: number): Promise<void> {
  await pool.query("UPDATE otps SET consumed_at = now() WHERE id = $1", [id]);
}