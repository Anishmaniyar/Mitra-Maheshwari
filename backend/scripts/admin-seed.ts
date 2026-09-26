/* Development admin provisioning (local/demo only).
 * Usage: npm run admin:seed -- <10-digit-mobile>
 * - If an account exists for the mobile, its role is upgraded to ADMIN.
 * - Otherwise an ACTIVE family + APPROVED head member + ADMIN account is created.
 * There is no public admin signup; this script is the only provisioning path. */
import crypto from 'node:crypto';
import { pool } from '../src/config/database.js';

const mobile = process.argv[2] ?? '';

if (!/^[6-9]\d{9}$/.test(mobile)) {
  console.error('Usage: npm run admin:seed -- <10-digit-mobile>');
  process.exit(1);
}

const run = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT a.id FROM accounts a WHERE a.mobile = $1`,
      [mobile],
    );
    if (existing.rows[0]) {
      await client.query(`UPDATE accounts SET role = 'ADMIN' WHERE mobile = $1`, [
        mobile,
      ]);
      await client.query('COMMIT');
      console.log(`Account ${mobile} is now ADMIN.`);
      return;
    }

    const familyCode = `ADMIN-${new Date().getFullYear()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
    const family = await client.query(
      `INSERT INTO families (family_code, status)
       VALUES ($1, 'ACTIVE') RETURNING id`,
      [familyCode],
    );
    const member = await client.query(
      `INSERT INTO members
         (family_id, first_name, last_name, mobile, is_head, status)
       VALUES ($1, 'Admin', 'User', $2, TRUE, 'APPROVED') RETURNING id`,
      [family.rows[0].id, mobile],
    );
    await client.query(
      `INSERT INTO accounts (member_id, mobile, role) VALUES ($1, $2, 'ADMIN')`,
      [member.rows[0].id, mobile],
    );

    await client.query('COMMIT');
    console.log(`ADMIN account created for ${mobile} (family ${familyCode}).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error: unknown) => {
  console.error('Admin seeding failed:', error);
  process.exit(1);
});
