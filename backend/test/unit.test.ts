import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../src/utils/http";
import { generateOtp, hashOtp } from "../src/utils/crypto";
import { signAuthToken, verifyAuthToken } from "../src/utils/jwt";
import { maskMobile, normalizeMobile } from "../src/utils/mobile";
import { toPublicMember } from "../src/modules/members/member.types";
import { toPublicPayment } from "../src/modules/payment/payment.types";
import {
  createMemberSchema,
  matchMemberSchema,
  updateProfileSchema,
} from "../src/modules/members/member.validation";
import { verifyOtpSchema, sendOtpSchema } from "../src/modules/auth/auth.validation";
import { addMemberSchema } from "../src/modules/family/family.validation";

// ---------------------------------------------------------------------------
// Mobile helpers
// ---------------------------------------------------------------------------

describe("normalizeMobile", () => {
  it("normalizes a 10-digit number to E.164 digits", () => {
    assert.equal(normalizeMobile("98765 43210"), "919876543210");
  });

  it("accepts a leading 0", () => {
    assert.equal(normalizeMobile("09876543210"), "919876543210");
  });

  it("accepts an explicit +91 prefix", () => {
    assert.equal(normalizeMobile("+919876543210"), "919876543210");
  });

  it("accepts an already-normalized number", () => {
    assert.equal(normalizeMobile("919876543210"), "919876543210");
  });

  it("rejects numbers that do not start with 6-9", () => {
    assert.throws(() => normalizeMobile("1234567890"), (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, "INVALID_MOBILE");
      return true;
    });
  });

  it("rejects numbers that are too short", () => {
    assert.throws(() => normalizeMobile("98765"), (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, "INVALID_MOBILE");
      return true;
    });
  });
});

describe("maskMobile", () => {
  it("masks all but the last four digits", () => {
    assert.equal(maskMobile("919876543210"), "•••• ••3210");
  });
});

// ---------------------------------------------------------------------------
// OTP crypto
// ---------------------------------------------------------------------------

describe("generateOtp", () => {
  it("produces a 6-digit code", () => {
    const code = generateOtp();
    assert.match(code, /^\d{6}$/);
  });
});

describe("hashOtp", () => {
  it("produces a deterministic sha256 hex digest", () => {
    const a = hashOtp("123456");
    const b = hashOtp("123456");
    const c = hashOtp("654321");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.match(a, /^[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

describe("auth token", () => {
  it("round-trips the payload", () => {
    const token = signAuthToken({ accountId: 42, memberId: 7 });
    assert.deepEqual(verifyAuthToken(token), { accountId: 42, memberId: 7 });
  });

  it("returns null for a tampered token", () => {
    const token = signAuthToken({ accountId: 42, memberId: 7 });
    assert.equal(verifyAuthToken(`${token.slice(0, -2)}xx`), null);
  });

  it("returns null for garbage", () => {
    assert.equal(verifyAuthToken("not-a-token"), null);
  });
});

// ---------------------------------------------------------------------------
// Response mappers
// ---------------------------------------------------------------------------

describe("toPublicMember", () => {
  it("maps snake_case row to camelCase public shape", () => {
    const mapped = toPublicMember({
      id: 1,
      first_name: "Rajesh",
      middle_name: "Kumar",
      last_name: "Mehta",
      mobile: "919876543210",
      blood_group: "O+",
      age: 48,
      occupation: "Business",
      area: "Sector 14",
      pan_name: "Rajesh Kumar Mehta",
      pan_number: "ABCDE1234F",
      created_by: "seed",
      created_on: new Date(),
      modified_by: null,
      modified_on: null,
      is_active_member: true,
      family_id: 1,
      head_id: 1,
      is_head: true,
    });
    assert.deepEqual(mapped, {
      id: 1,
      firstName: "Rajesh",
      middleName: "Kumar",
      lastName: "Mehta",
      mobile: "919876543210",
      bloodGroup: "O+",
      age: 48,
      occupation: "Business",
      area: "Sector 14",
      panName: "Rajesh Kumar Mehta",
      panNumber: "ABCDE1234F",
      isActiveMember: true,
      familyId: 1,
      isHead: true,
    });
  });
});

describe("toPublicPayment", () => {
  it("converts NUMERIC amount string to a number", () => {
    const mapped = toPublicPayment({
      id: 1,
      family_id: 1,
      year: 2026,
      amount: "1000.00",
      currency: "INR",
      transaction_mode: "manual",
      transaction_id: "txn-1",
      status: "pending",
      created_at: new Date("2026-01-01T00:00:00Z"),
      updated_at: new Date("2026-01-01T00:00:00Z"),
    });
    assert.equal(mapped.amount, 1000);
    assert.equal(mapped.familyId, 1);
    assert.equal(mapped.transactionMode, "manual");
  });
});

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

describe("matchMemberSchema", () => {
  it("accepts a valid lookup", () => {
    const ok = matchMemberSchema.safeParse({ firstName: "Rajesh", lastName: "Mehta", mobile: "9876543210" });
    assert.equal(ok.success, true);
  });

  it("rejects a missing first name", () => {
    const bad = matchMemberSchema.safeParse({ lastName: "Mehta", mobile: "9876543210" });
    assert.equal(bad.success, false);
  });
});

describe("createMemberSchema", () => {
  it("accepts a valid new member", () => {
    const ok = createMemberSchema.safeParse({
      firstName: "Demo",
      lastName: "Member",
      mobile: "9999999999",
      bloodGroup: "B+",
      age: 30,
      occupation: "Software Engineer",
      area: "Pune",
      panName: "DEMO COMMUNITY MEMBER",
      panNumber: "ABCDE1234F",
    });
    assert.equal(ok.success, true);
  });

  it("rejects an invalid PAN format", () => {
    const bad = createMemberSchema.safeParse({
      firstName: "Demo",
      lastName: "Member",
      mobile: "9999999999",
      panNumber: "NOT-A-PAN",
    });
    assert.equal(bad.success, false);
  });

  it("rejects an unknown blood group", () => {
    const bad = createMemberSchema.safeParse({
      firstName: "Demo",
      lastName: "Member",
      mobile: "9999999999",
      bloodGroup: "Z+",
    });
    assert.equal(bad.success, false);
  });

  it("rejects an out-of-range age", () => {
    const bad = createMemberSchema.safeParse({
      firstName: "Demo",
      lastName: "Member",
      mobile: "9999999999",
      age: 200,
    });
    assert.equal(bad.success, false);
  });
});

describe("updateProfileSchema", () => {
  it("requires at least one field", () => {
    const bad = updateProfileSchema.safeParse({});
    assert.equal(bad.success, false);
  });

  it("accepts a partial update", () => {
    const ok = updateProfileSchema.safeParse({ occupation: "Teacher" });
    assert.equal(ok.success, true);
  });
});

describe("sendOtpSchema", () => {
  it("requires a positive memberId", () => {
    assert.equal(sendOtpSchema.safeParse({ memberId: 0, mobile: "9876543210" }).success, false);
    assert.equal(sendOtpSchema.safeParse({ memberId: 1, mobile: "9876543210" }).success, true);
  });
});

describe("verifyOtpSchema", () => {
  it("requires a 6-digit OTP", () => {
    assert.equal(verifyOtpSchema.safeParse({ memberId: 1, mobile: "9876543210", otp: "12" }).success, false);
    assert.equal(verifyOtpSchema.safeParse({ memberId: 1, mobile: "9876543210", otp: "12345a" }).success, false);
    assert.equal(verifyOtpSchema.safeParse({ memberId: 1, mobile: "9876543210", otp: "123456" }).success, true);
  });
});

describe("addMemberSchema", () => {
  it("accepts a valid family member", () => {
    const ok = addMemberSchema.safeParse({
      firstName: "Sunita",
      lastName: "Mehta",
      mobile: "9876543211",
      bloodGroup: "B+",
      age: 44,
    });
    assert.equal(ok.success, true);
  });

  it("rejects a missing last name", () => {
    const bad = addMemberSchema.safeParse({ firstName: "Sunita", mobile: "9876543211" });
    assert.equal(bad.success, false);
  });
});