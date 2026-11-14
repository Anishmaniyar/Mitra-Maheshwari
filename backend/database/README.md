# Database — Auth, Registration, Family, Admin Approval

TypeScript migrations (`migrations/`, applied in filename order via `npm run db:migrate`).
No business logic here — schema only.

## Enums

| Type | Values |
|---|---|
| `family_status` | `PENDING` → `ACTIVE` / `REJECTED` |
| `member_status` | `PENDING` → `APPROVED` / `REJECTED` |
| `account_role` | `ADMIN`, `MEMBER` (system roles; Family Head is **not** a role). Admin-panel access no longer uses this role — it uses the shared-link session instead. |
| `invitation_status` | `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED` |

## Relationships

```
families 1 ──< members            (members.family_id → families, RESTRICT)
members  1 ──1 accounts           (accounts.member_id UNIQUE → members, CASCADE)
families 1 ──< family_invitations (family_invitations.family_id → families, CASCADE)
members  1 ──< family_invitations (invited_by_member_id → members, NO ACTION)
members  1 ──< refresh_tokens     (refresh_tokens.member_id → members, CASCADE)
refresh_tokens 1 ──< refresh_tokens (replaced_by_token_id self-FK, SET NULL)
registration_sessions ── standalone, no FKs (member/family don't exist yet mid-flow)
```

Circular dependency `families ↔ members` is broken by ordering: families is created
first with plain UUID columns, members next, then the `created_by_member_id` /
`approved_by_member_id` FKs are added (`SET NULL`, both NULLABLE — a PENDING
family has no approver yet).

## Key decisions

- **Family Head = `members.is_head`**, not a role. One head per family is enforced
  by partial unique index `members_one_head_per_family ON (family_id) WHERE is_head`.
- **`members.mobile` is NULLABLE** — imported data may lack valid numbers.
  Login identity is `accounts.mobile` (`NOT NULL UNIQUE`).
- **OTP challenges are not stored in PostgreSQL** — they live in Redis
  (`src/modules/auth/otpChallenge.store.ts`); the legacy `otps` table was dropped.
- **Uniques:** `families.family_code`, `accounts.member_id`, `accounts.mobile`,
  `family_invitations.token`, `payments_one_success_per_family_year` and
  `payments_one_open_per_family_year` (partial), and
  `family_invitations_one_pending_per_mobile` (partial). **Indexes:**
  `members(mobile)`, `registration_sessions(mobile)`, `refresh_tokens(token_hash)`.
- **Timestamps:** `created_at` / `updated_at` default to `current_timestamp`
  (repositories set `updated_at = now()` on update).
- **No payments tables** in this stage.
