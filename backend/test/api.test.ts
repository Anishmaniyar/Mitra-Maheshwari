/**
 * HTTP integration tests that do NOT require PostgreSQL.
 *
 * They start the real Express app on an ephemeral port and exercise the layers
 * that run before any database access: health envelope, 404 handling,
 * request validation, JWT auth gating, and webhook HMAC + payload validation.
 *
 * Tests that need the database (match/create/OTP/family/payments success paths)
 * live in the live-DB suite once DATABASE_URL is reachable — see the audit
 * notes in the README.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

import { app } from "../src/app";
import { env } from "../src/config/env";

let server: Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("Server did not bind a port");
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

interface Envelope {
  success?: boolean;
  error?: { code?: string; message?: string };
}

async function request(path: string, init?: RequestInit): Promise<{ status: number; body: Envelope }> {
  const res = await fetch(`${baseUrl}${path}`, init);
  let body: Envelope = {};
  try {
    body = (await res.json()) as Envelope;
  } catch {
    // non-JSON response — leave body empty
  }
  return { status: res.status, body };
}

function postJson(path: string, payload: unknown): Promise<{ status: number; body: Envelope }> {
  return request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function signWebhook(body: string): string {
  return createHmac("sha256", env.WEBHOOK_SECRET).update(body).digest("hex");
}

// ---------------------------------------------------------------------------

describe("health", () => {
  it("GET /health returns the success envelope", async () => {
    const { status, body } = await request("/health");
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });
});

describe("404 handling", () => {
  it("unknown routes return a NOT_FOUND envelope", async () => {
    const { status, body } = await request("/api/does-not-exist");
    assert.equal(status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error?.code, "NOT_FOUND");
  });
});

describe("member endpoints", () => {
  it("POST /api/members/match rejects an empty body (validation before DB)", async () => {
    const { status, body } = await postJson("/api/members/match", {});
    assert.equal(status, 400);
    assert.equal(body.error?.code, "VALIDATION_ERROR");
  });

  it("POST /api/members rejects an invalid mobile", async () => {
    const { status, body } = await postJson("/api/members", {
      firstName: "Demo",
      lastName: "Member",
      mobile: "12",
    });
    assert.equal(status, 400);
    assert.equal(body.error?.code, "VALIDATION_ERROR");
  });

  it("GET /api/me without a token returns 401, not 404 (route must exist)", async () => {
    const { status, body } = await request("/api/me");
    assert.equal(status, 401);
    assert.equal(body.error?.code, "UNAUTHENTICATED");
  });

  it("PATCH /api/me without a token returns 401, not 404 (route must exist)", async () => {
    const { status, body } = await request("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ occupation: "Teacher" }),
    });
    assert.equal(status, 401);
    assert.equal(body.error?.code, "UNAUTHENTICATED");
  });
});

describe("auth endpoints", () => {
  it("POST /api/auth/send-otp rejects a missing mobile", async () => {
    const { status, body } = await postJson("/api/auth/send-otp", { memberId: 1 });
    assert.equal(status, 400);
    assert.equal(body.error?.code, "VALIDATION_ERROR");
  });

  it("POST /api/auth/verify-otp rejects a non-6-digit OTP", async () => {
    const { status, body } = await postJson("/api/auth/verify-otp", {
      memberId: 1,
      mobile: "9876543210",
      otp: "12",
    });
    assert.equal(status, 400);
    assert.equal(body.error?.code, "VALIDATION_ERROR");
  });
});

describe("family endpoints", () => {
  it("GET /api/family requires auth", async () => {
    const { status, body } = await request("/api/family");
    assert.equal(status, 401);
    assert.equal(body.error?.code, "UNAUTHENTICATED");
  });

  it("POST /api/family/members requires auth", async () => {
    const { status, body } = await postJson("/api/family/members", {
      firstName: "Sunita",
      lastName: "Mehta",
      mobile: "9876543211",
    });
    assert.equal(status, 401);
    assert.equal(body.error?.code, "UNAUTHENTICATED");
  });
});

describe("payment endpoints", () => {
  it("GET /api/payments requires auth", async () => {
    const { status, body } = await request("/api/payments");
    assert.equal(status, 401);
    assert.equal(body.error?.code, "UNAUTHENTICATED");
  });

  it("POST /api/payments/create requires auth", async () => {
    const { status, body } = await request("/api/payments/create", { method: "POST" });
    assert.equal(status, 401);
    assert.equal(body.error?.code, "UNAUTHENTICATED");
  });
});

describe("payment webhook", () => {
  const raw = JSON.stringify({ event: "payment.paid", transactionId: "txn-1", amount: 1000, currency: "INR" });

  it("rejects a missing signature (HMAC checked before anything else)", async () => {
    const { status, body } = await request("/api/payments/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
    });
    assert.equal(status, 401);
    assert.equal(body.error?.code, "INVALID_SIGNATURE");
  });

  it("rejects a wrong signature", async () => {
    const { status, body } = await request("/api/payments/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-signature": "deadbeef" },
      body: raw,
    });
    assert.equal(status, 401);
    assert.equal(body.error?.code, "INVALID_SIGNATURE");
  });

  it("rejects a validly-signed non-JSON body", async () => {
    const text = "this is not json";
    const { status, body } = await request("/api/payments/webhook", {
      method: "POST",
      headers: { "content-type": "text/plain", "x-webhook-signature": signWebhook(text) },
      body: text,
    });
    assert.equal(status, 400);
    assert.equal(body.error?.code, "INVALID_PAYLOAD");
  });

  it("rejects a validly-signed payload that fails the schema", async () => {
    const bad = JSON.stringify({ foo: "bar" });
    const { status, body } = await request("/api/payments/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-signature": signWebhook(bad) },
      body: bad,
    });
    assert.equal(status, 400);
    assert.equal(body.error?.code, "INVALID_PAYLOAD");
  });
});