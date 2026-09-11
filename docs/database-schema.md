## 1. `families`

**Purpose:** The primary membership unit. Every member belongs to exactly one family.
Family-level membership payments (`payments.family_id`) attach here.

**Source:** `001_create_families.sql`

| Column       | PostgreSQL type | Nullable | Default                    | Key / Constraint |
| ------------ | --------------- | -------- | -------------------------- | ---------------- |
| `id`         | `SERIAL`        | NOT NULL | auto-increment (`nextval`) | `PRIMARY KEY`    |
| `created_by` | `TEXT`          | Nullable | —                          | —                |
| `created_on` | `TIMESTAMPTZ`   | NOT NULL | `now()`                    | —                |

**Primary key:** `id`

**Foreign keys:** none (parent table).

**Unique constraints:** none (besides PK).

**Check constraints:** none.

**Indexes:**

- Implicit B-tree PK index on `id` (created by `PRIMARY KEY`).
- No additional indexes defined in the migration.

---

## 2. `members`

**Purpose:** Holds the imported community person records. Every member belongs to
exactly one family; at most one member per family is flagged as the head.

**Source:** `002_create_members.sql`

| Column             | PostgreSQL type | Nullable | Default                    | Key / Constraint                                                                               |
| ------------------ | --------------- | -------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`               | `SERIAL`        | NOT NULL | auto-increment (`nextval`) | `PRIMARY KEY`                                                                                  |
| `first_name`       | `TEXT`          | NOT NULL | —                          | part of `members_name_idx`                                                                     |
| `middle_name`      | `TEXT`          | Nullable | —                          | —                                                                                              |
| `last_name`        | `TEXT`          | NOT NULL | —                          | part of `members_name_idx`                                                                     |
| `mobile`           | `TEXT`          | NOT NULL | —                          | `UNIQUE` via `members_mobile_unique`; normalized E.164 digits without `+`, e.g. `919876543210` |
| `blood_group`      | `TEXT`          | Nullable | —                          | `CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))`                    |
| `age`              | `INTEGER`       | Nullable | —                          | `CHECK (age > 0 AND age < 130)`                                                                |
| `occupation`       | `TEXT`          | Nullable | —                          | —                                                                                              |
| `area`             | `TEXT`          | Nullable | —                          | —                                                                                              |
| `pan_name`         | `TEXT`          | Nullable | —                          | —                                                                                              |
| `pan_number`       | `TEXT`          | Nullable | —                          | `UNIQUE` where not null (partial index, see below)                                             |
| `created_by`       | `TEXT`          | Nullable | —                          | —                                                                                              |
| `created_on`       | `TIMESTAMPTZ`   | NOT NULL | `now()`                    | —                                                                                              |
| `modified_by`      | `TEXT`          | Nullable | —                          | —                                                                                              |
| `modified_on`      | `TIMESTAMPTZ`   | Nullable | —                          | —                                                                                              |
| `is_active_member` | `BOOLEAN`       | NOT NULL | `true`                     | —                                                                                              |
| `family_id`        | `INTEGER`       | NOT NULL | —                          | `FOREIGN KEY REFERENCES families(id)`                                                          |
| `head_id`          | `INTEGER`       | Nullable | —                          | `FOREIGN KEY REFERENCES members(id)` (self-reference; see concept note below)                  |
| `is_head`          | `BOOLEAN`       | NOT NULL | `false`                    | gated by partial unique index `one_head_per_family`                                            |

No `email`, `address`, `society name`, `society address`, or other columns exist
in the migration — they are intentionally not documented here.

**Primary key:** `id`

**Foreign keys:**

- `members.family_id → families.id` (mandatory, `NOT NULL`; no `ON DELETE` clause).
- `members.head_id → members.id` (nullable self-reference; no `ON DELETE` clause).

**Unique constraints / unique indexes:**

- `members_mobile_unique`: `UNIQUE (mobile)` — one member row per mobile number.
- `members_pan_number_unique`: `UNIQUE (pan_number) WHERE pan_number IS NOT NULL` —
  PAN numbers are unique when present; multiple `NULL`s allowed.
- `one_head_per_family`: `UNIQUE (family_id) WHERE is_head = true` —
  at most one head member per family.

**Check constraints:**

- `blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')` (nulls pass).
- `age > 0 AND age < 130` (nulls pass).

**Important indexes (all from `002`):**

- PK on `id` (implicit).
- `members_mobile_unique ON members (mobile)` — unique B-tree.
- `members_pan_number_unique ON members (pan_number) WHERE pan_number IS NOT NULL` — partial unique B-tree.
- `members_family_id_idx ON members (family_id)` — plain B-tree for family lookups / joins.
- `members_name_idx ON members (lower(first_name), lower(last_name))` — expression B-tree for case-insensitive name search.
- `one_head_per_family ON members (family_id) WHERE is_head = true` — partial unique B-tree.

---

## 3. `accounts`

**Purpose:** Authenticated application account. Distinct from the imported `members`
record: an `accounts` row is created only after OTP verification proves the person
controls the mobile number. JWT sessions are stateless, so no session table exists.

**Source:** `003_create_auth_accounts.sql` (file name says `auth_accounts`, actual table is `accounts`)

| Column          | PostgreSQL type | Nullable | Default                    | Key / Constraint                                                                           |
| --------------- | --------------- | -------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `id`            | `SERIAL`        | NOT NULL | auto-increment (`nextval`) | `PRIMARY KEY`                                                                              |
| `member_id`     | `INTEGER`       | NOT NULL | —                          | `UNIQUE` + `FOREIGN KEY REFERENCES members(id) ON DELETE CASCADE` (one account per member) |
| `mobile`        | `TEXT`          | NOT NULL | —                          | `UNIQUE`                                                                                   |
| `created_at`    | `TIMESTAMPTZ`   | NOT NULL | `now()`                    | —                                                                                          |
| `last_login_at` | `TIMESTAMPTZ`   | Nullable | —                          | —                                                                                          |

**Primary key:** `id`

**Foreign keys:**

- `accounts.member_id → members.id ON DELETE CASCADE` — deleting the member deletes its account.

**Unique constraints:**

- `UNIQUE (member_id)` (inline) — at most one account per member.
- `UNIQUE (mobile)` (inline) — at most one account per mobile number.

**Check constraints:** none.

**Important indexes:**

- PK on `id` (implicit).
- Implicit unique B-tree indexes backing `UNIQUE (member_id)` and `UNIQUE (mobile)`.
- No additional `CREATE INDEX` statements in the migration.

---

## 4. `otps`

**Purpose:** OTP verification attempts. OTP codes are stored SHA-256 hashed
(`code_hash`), never in plaintext. Attempt and resend limits are tracked here and
enforced at the application layer.

**Source:** `004_create_otp_verifications.sql` (file name says `otp_verifications`, actual table is `otps`)

| Column         | PostgreSQL type | Nullable | Default                    | Key / Constraint                                       |
| -------------- | --------------- | -------- | -------------------------- | ------------------------------------------------------ |
| `id`           | `SERIAL`        | NOT NULL | auto-increment (`nextval`) | `PRIMARY KEY`                                          |
| `member_id`    | `INTEGER`       | NOT NULL | —                          | `FOREIGN KEY REFERENCES members(id) ON DELETE CASCADE` |
| `mobile`       | `TEXT`          | NOT NULL | —                          | part of `otps_mobile_created_idx`                      |
| `code_hash`    | `TEXT`          | NOT NULL | —                          | SHA-256 hash of the OTP                                |
| `expires_at`   | `TIMESTAMPTZ`   | NOT NULL | —                          | —                                                      |
| `attempts`     | `INTEGER`       | NOT NULL | `0`                        | —                                                      |
| `max_attempts` | `INTEGER`       | NOT NULL | `5`                        | —                                                      |
| `resend_count` | `INTEGER`       | NOT NULL | `0`                        | —                                                      |
| `consumed_at`  | `TIMESTAMPTZ`   | Nullable | —                          | set when the OTP is successfully used                  |
| `last_sent_at` | `TIMESTAMPTZ`   | NOT NULL | `now()`                    | —                                                      |
| `created_at`   | `TIMESTAMPTZ`   | NOT NULL | `now()`                    | part of `otps_mobile_created_idx`                      |

**Primary key:** `id`

**Foreign keys:**

- `otps.member_id → members.id ON DELETE CASCADE` — deleting the member deletes its OTP rows.

**Unique constraints:** none.

**Check constraints:** none.

**Important indexes:**

- PK on `id` (implicit).
- `otps_mobile_created_idx ON otps (mobile, created_at DESC)` — plain B-tree for
  “latest OTP for this mobile” lookups.

---

## 5. `payments`

**Purpose:** Family-level membership fee. A payment belongs to the FAMILY, not to an
individual member. One payment per family per year; a failed payment is re-armed for
retry rather than duplicated. No Razorpay-specific columns exist in the MVP.

**Source:** `005_create_member_fees.sql` (file name says `member_fees`, actual table is `payments`)

| Column             | PostgreSQL type  | Nullable | Default                    | Key / Constraint                                                            |
| ------------------ | ---------------- | -------- | -------------------------- | --------------------------------------------------------------------------- |
| `id`               | `SERIAL`         | NOT NULL | auto-increment (`nextval`) | `PRIMARY KEY`                                                               |
| `family_id`        | `INTEGER`        | NOT NULL | —                          | `FOREIGN KEY REFERENCES families(id)`; part of `UNIQUE (family_id, year)`   |
| `year`             | `INTEGER`        | NOT NULL | —                          | `CHECK (year >= 2000 AND year <= 2100)`; part of `UNIQUE (family_id, year)` |
| `amount`           | `NUMERIC(12, 2)` | NOT NULL | —                          | `CHECK (amount > 0)`                                                        |
| `currency`         | `TEXT`           | NOT NULL | `'INR'`                    | —                                                                           |
| `transaction_mode` | `TEXT`           | NOT NULL | `'manual'`                 | —                                                                           |
| `transaction_id`   | `TEXT`           | Nullable | —                          | `UNIQUE` where not null (partial index, see below)                          |
| `status`           | `TEXT`           | NOT NULL | `'pending'`                | `CHECK (status IN ('pending', 'paid', 'failed'))`                           |
| `created_at`       | `TIMESTAMPTZ`    | NOT NULL | `now()`                    | —                                                                           |
| `updated_at`       | `TIMESTAMPTZ`    | NOT NULL | `now()`                    | maintained by application on update (no DB trigger in migration)            |

**Primary key:** `id`

**Foreign keys:**

- `payments.family_id → families.id` (no `ON DELETE` clause).

**Unique constraints:**

- `UNIQUE (family_id, year)` (table constraint) — one payment row per family per year.

**Check constraints:**

- `year >= 2000 AND year <= 2100`.
- `amount > 0`.
- `status IN ('pending', 'paid', 'failed')`.

**Important indexes:**

- PK on `id` (implicit).
- Implicit unique B-tree backing `UNIQUE (family_id, year)`.
- `payments_family_year_idx ON payments (family_id, year DESC)` — plain B-tree for family payment history.
- `payments_transaction_unique ON payments (transaction_id) WHERE transaction_id IS NOT NULL` —
  partial unique B-tree; external transaction ids are unique when present, multiple `NULL`s allowed.

---

## 6. `schema_migrations`

**Purpose:** Migration bookkeeping. Created by the migration runner
(`backend/src/scripts/migrate.ts`, run via `npm run migrate`), not by a `.sql` file.
Each applied `.sql` filename is recorded once; files run in filename order, each in
its own transaction.

**Source:** `backend/src/scripts/migrate.ts`

| Column       | PostgreSQL type | Nullable | Default | Key / Constraint                               |
| ------------ | --------------- | -------- | ------- | ---------------------------------------------- |
| `name`       | `TEXT`          | NOT NULL | —       | `PRIMARY KEY` (e.g. `001_create_families.sql`) |
| `applied_at` | `TIMESTAMPTZ`   | NOT NULL | `now()` | —                                              |

**Primary key:** `name`

**Foreign keys:** none.

**Unique constraints:** none beyond PK.

**Check constraints:** none.

**Indexes:** implicit PK B-tree on `name`.

---

## Relationships

| #   | From                 | To            | Cardinality                                     | Notes                                                                                                                                                                  |
| --- | -------------------- | ------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `members.family_id`  | `families.id` | many members → one family                       | `NOT NULL`; every member belongs to exactly one family.                                                                                                                |
| 2   | `accounts.member_id` | `members.id`  | one account → one member                        | `UNIQUE` + `ON DELETE CASCADE`; at most one account per member.                                                                                                        |
| 3   | `otps.member_id`     | `members.id`  | many OTPs → one member                          | `ON DELETE CASCADE`; history of verification attempts.                                                                                                                 |
| 4   | `members.head_id`    | `members.id`  | many members → one head member (self-reference) | Nullable; points at the head member row within the `members` table. `UPDATE members SET head_id = id WHERE ...` is used for heads themselves in seed data (see below). |
| 5   | `payments.family_id` | `families.id` | many payments (one per year) → one family       | Family-level fee; `UNIQUE (family_id, year)`.                                                                                                                          |

Text diagram (as specified):

```text
families
  ↓
members.family_id → families.id

members
  ↓
accounts.member_id → members.id

members
  ↓
otps.member_id → members.id

members.head_id → members.id   (self-reference)

families
  ↓
payments.family_id → families.id
```

---

## Family / member concept (existing implementation — do not redesign)

- A **family** is the main membership unit.
- A family can contain **multiple members**.
- `members.family_id` identifies which family a member belongs to.
- `members.is_head` identifies the family head (`true` for the head, `false` otherwise).
  The partial unique index `one_head_per_family` guarantees at most one row per
  family has `is_head = true`.
- `members.head_id` currently references the head member **through the `members`
  table** (self-referencing FK `members.head_id → members.id`).
- Existing seed behavior (`backend/database/seed/development.sql`): non-head members
  store the head member’s `id` in `head_id`; for the head row itself, `head_id` is
  first inserted as `NULL` and then updated to its own `id`
  (`UPDATE members SET head_id = id WHERE id = ...`). So a head’s `head_id`
  points to itself, and members’ `head_id` points at their family head.
- `head_id` is documented exactly as implemented. Do **not** redesign or remove it
  at this stage.

---

## ER diagram (Mermaid)

```mermaid
erDiagram
    families ||--o{ members : "family_id"
    families ||--o{ payments : "family_id"
    members ||--o| accounts : "member_id"
    members ||--o{ otps : "member_id"
    members ||--o{ members : "head_id (self-ref)"

    families {
        SERIAL id PK
        TEXT created_by
        TIMESTAMPTZ created_on
    }

    members {
        SERIAL id PK
        TEXT first_name
        TEXT middle_name
        TEXT last_name
        TEXT mobile UK
        TEXT blood_group
        INTEGER age
        TEXT occupation
        TEXT area
        TEXT pan_name
        TEXT pan_number
        TEXT created_by
        TIMESTAMPTZ created_on
        TEXT modified_by
        TIMESTAMPTZ modified_on
        BOOLEAN is_active_member
        INTEGER family_id FK
        INTEGER head_id FK
        BOOLEAN is_head
    }

    accounts {
        SERIAL id PK
        INTEGER member_id FK_UK
        TEXT mobile UK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ last_login_at
    }

    otps {
        SERIAL id PK
        INTEGER member_id FK
        TEXT mobile
        TEXT code_hash
        TIMESTAMPTZ expires_at
        INTEGER attempts
        INTEGER max_attempts
        INTEGER resend_count
        TIMESTAMPTZ consumed_at
        TIMESTAMPTZ last_sent_at
        TIMESTAMPTZ created_at
    }

    payments {
        SERIAL id PK
        INTEGER family_id FK
        INTEGER year
        NUMERIC amount
        TEXT currency
        TEXT transaction_mode
        TEXT transaction_id
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    schema_migrations {
        TEXT name PK
        TIMESTAMPTZ applied_at
    }
```

---

## Source of Truth

1. **PostgreSQL database (`mitra_maheshwari`) = actual runtime database.**
   What the application reads/writes at runtime.
2. **SQL migrations (`backend/database/migrations/*.sql` + runner
   `backend/src/scripts/migrate.ts`) = executable source of truth for schema changes.**
   Any real schema change must go through a new migration file; this document
   never overrides them.
3. **`docs/database-schema.md` (this file) = human-readable documentation/reference only.**
   It is derived from the migrations for the development team’s convenience and
   carries no runtime authority. If it ever disagrees with the migrations, the
   migrations win.
4. **Prisma is NOT used in this project.** There is no `schema.prisma`, no Prisma
   ORM client, and no Prisma migration workflow. Do not add Prisma files or infer
   Prisma types from this document.

---

## Appendix: verification notes

- Documented column-by-column against the five `.sql` migration files plus
  `migrate.ts` for `schema_migrations`; column names, types, nullability,
  defaults, PK/FK/unique/check/index definitions above are verbatim from those files.
- `backend/database/seed/development.sql` was consulted only to illustrate the
  `head_id` convention; it defines no schema and adds no columns.
- Known naming quirk (not a schema mismatch): three migration _file names_ differ
  from the _table_ they create — `003_create_auth_accounts.sql` → `accounts`,
  `004_create_otp_verifications.sql` → `otps`, `005_create_member_fees.sql` →
  `payments`. The table names used in this document (`accounts`, `otps`,
  `payments`) match the `CREATE TABLE` statements and the seed file’s
  `TRUNCATE`/`INSERT` targets, which is what the runtime database will contain.
