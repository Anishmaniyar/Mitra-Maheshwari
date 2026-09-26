# Database — Auth, Registration, Family, Admin Approval

TypeScript migrations (`migrations/`, applied in filename order via `npm run db:migrate`).
No business logic here — schema only.

## Enums

| Type | Values |
|---|---|
| `family_status` | `PENDING` → `ACTIVE` / `REJECTED` |
| `member_status` | `PENDING` → `APPROVED` / `REJECTED` |
| `account_role` | `ADMIN`, `MEMBER` (system roles; Family Head is **not** a role) |
| `invitation_status` | `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED` |

## Relationships

```
families 1 ──< members            (members.family_id → families, RESTRICT)
members  1 ──1 accounts           (accounts.member_id UNIQUE → members, CASCADE)
members  1 ──< otps               (otps.member_id NULLABLE → members, CASCADE)
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
- **`otps.member_id` is NULLABLE** — OTP can precede any member row. Only
  `code_hash` is stored, never the plain code.
- **Uniques:** `families.family_code`, `accounts.member_id`, `accounts.mobile`,
  `family_invitations.token`. **Indexes:** `members(mobile)`, `otps(mobile)`,
  `registration_sessions(mobile)`, `refresh_tokens(token_hash)` (non-unique, per spec).
- **Timestamps:** `created_at` / `updated_at` default to `current_timestamp`
  (repositories set `updated_at = now()` on update).
- **No payments tables** in this stage.
