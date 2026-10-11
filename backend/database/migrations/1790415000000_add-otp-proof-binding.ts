import type { MigrationBuilder } from 'node-pg-migrate';

/**
 * Binds consumed OTPs to a single-use, flow-specific registration proof.
 * - `purpose`: which flow requested the OTP (LOGIN | REGISTRATION | INVITATION).
 *   NULL = requested before purposes existed; never claimable as proof.
 * - `used_at` / `used_for`: set atomically when a flow claims the proof, so a
 *   proof works exactly once, for one mobile, in one flow. Registration proof
 *   can never accept an invitation and vice versa.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('otps', {
    purpose: { type: 'text' },
    used_at: { type: 'timestamptz' },
    used_for: { type: 'text' },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('otps', ['purpose', 'used_at', 'used_for']);
}
