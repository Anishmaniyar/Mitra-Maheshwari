export interface AuthContext {
  accountId: number;
  memberId: number;
}

export interface AccountRow {
  id: number;
  member_id: number;
  mobile: string;
  created_at: Date;
  last_login_at: Date | null;
}

export interface OtpRow {
  id: number;
  member_id: number;
  mobile: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  max_attempts: number;
  resend_count: number;
  consumed_at: Date | null;
  last_sent_at: Date;
  created_at: Date;
}