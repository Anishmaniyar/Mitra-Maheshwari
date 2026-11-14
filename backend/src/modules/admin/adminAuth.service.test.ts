import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import { generateAccessToken } from '../../shared/auth/jwt.js';
import {
  authenticateAdmin,
  requireAdminCsrf,
} from '../../middleware/authenticateAdmin.js';
import {
  ADMIN_SESSION_COOKIE,
  exchangeAdminLink,
  getAdminSessionMaxAgeMs,
  issueAdminSessionToken,
  isAdminLinkConfigured,
  verifyAdminAccessSecret,
  verifyAdminSessionToken,
} from './adminAuth.service.js';
import {
  buildAdminSessionCookieOptions,
  buildClearedAdminSessionCookieOptions,
} from './admin.controller.js';

const STRONG = 'S3cret-admin-link-value-0123456789abcdef';
const ROTATED = 'R0tated-admin-link-value-fedcba9876543210';

const withAdminEnv = async (
  values: Partial<Pick<typeof env, 'ADMIN_ACCESS_SECRET' | 'ADMIN_SESSION_EXPIRES_IN' | 'NODE_ENV'>>,
  fn: () => Promise<void> | void,
): Promise<void> => {
  const previous = {
    ADMIN_ACCESS_SECRET: env.ADMIN_ACCESS_SECRET,
    ADMIN_SESSION_EXPIRES_IN: env.ADMIN_SESSION_EXPIRES_IN,
    NODE_ENV: env.NODE_ENV,
  };
  Object.assign(env, values);
  try {
    await fn();
  } finally {
    Object.assign(env, previous);
  }
};

const adminRequest = (token?: string): Request => {
  const req = {
    cookies: token ? { [ADMIN_SESSION_COOKIE]: token } : {},
    get: () => undefined,
  };
  return req as unknown as Request;
};

describe('shared-link admin secret', () => {
  it('accepts the configured secret and rejects everything else', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      assert.equal(isAdminLinkConfigured(), true);
      assert.equal(verifyAdminAccessSecret(STRONG), true);
      assert.equal(verifyAdminAccessSecret('wrong'), false);
      assert.equal(verifyAdminAccessSecret(''), false);
    });
  });

  it('stays disabled when no secret is configured', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: '' }, () => {
      assert.equal(isAdminLinkConfigured(), false);
      assert.equal(verifyAdminAccessSecret('anything'), false);
      assert.throws(
        () => exchangeAdminLink('anything'),
        (error: unknown) =>
          error instanceof AppError && error.statusCode === 503,
      );
    });
  });

  it('rejects an invalid link without issuing a session', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      assert.throws(
        () => exchangeAdminLink('not-the-secret'),
        (error: unknown) =>
          error instanceof AppError && error.statusCode === 401,
      );
    });
  });

  it('exchanges a valid link for a verifiable admin session token', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      const token = exchangeAdminLink(STRONG);
      assert.ok(token.length > 0);
      assert.equal(verifyAdminSessionToken(token), true);
    });
  });
});

describe('admin session token', () => {
  it('is revoked when the configured secret is rotated', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      const token = issueAdminSessionToken();
      assert.equal(verifyAdminSessionToken(token), true);

      // Rotation: the same token is no longer signed by the active key.
      (env as { ADMIN_ACCESS_SECRET: string }).ADMIN_ACCESS_SECRET = ROTATED;
      assert.equal(verifyAdminSessionToken(token), false);
    });
  });

  it('rejects an expired session', async () => {
    await withAdminEnv(
      { ADMIN_ACCESS_SECRET: STRONG, ADMIN_SESSION_EXPIRES_IN: '1ms' },
      async () => {
        const token = issueAdminSessionToken();
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.equal(verifyAdminSessionToken(token), false);
      },
    );
  });

  it('rejects a normal member JWT and arbitrary tokens', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      const memberToken = generateAccessToken({
        memberId: '00000000-0000-4000-8000-000000000000',
        role: 'MEMBER',
        familyId: '00000000-0000-4000-8000-000000000001',
        isFamilyHead: false,
      });
      assert.equal(verifyAdminSessionToken(memberToken), false);
      assert.equal(verifyAdminSessionToken('not-a-jwt'), false);
      assert.equal(verifyAdminSessionToken(undefined), false);
    });
  });
});

describe('admin session cookie policy', () => {
  it('is HttpOnly, Strict, admin-API scoped, and Secure in production', async () => {
    await withAdminEnv({ NODE_ENV: 'development' }, () => {
      const options = buildAdminSessionCookieOptions(1000);
      assert.equal(options.httpOnly, true);
      assert.equal(options.sameSite, 'strict');
      assert.equal(options.path, '/api/admin');
      assert.equal(options.secure, false);
      const cleared = buildClearedAdminSessionCookieOptions();
      assert.equal(cleared.httpOnly, true);
      assert.equal(cleared.sameSite, 'strict');
      assert.equal(cleared.path, '/api/admin');
    });

    await withAdminEnv({ NODE_ENV: 'production' }, () => {
      assert.equal(buildAdminSessionCookieOptions(1000).secure, true);
      assert.equal(buildClearedAdminSessionCookieOptions().secure, true);
    });
  });

  it('derives a positive cookie lifetime from the configured duration', async () => {
    await withAdminEnv({ ADMIN_SESSION_EXPIRES_IN: '12h' }, () => {
      assert.equal(getAdminSessionMaxAgeMs(), 12 * 60 * 60 * 1000);
    });
  });
});

describe('admin authentication middleware', () => {
  it('rejects a request without a valid admin cookie', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      assert.throws(
        () => authenticateAdmin(adminRequest(), {} as Response, (() => {}) as NextFunction),
        (error: unknown) =>
          error instanceof AppError && error.statusCode === 401,
      );
      assert.throws(
        () =>
          authenticateAdmin(
            adminRequest('invalid-token'),
            {} as Response,
            (() => {}) as NextFunction,
          ),
        (error: unknown) =>
          error instanceof AppError && error.statusCode === 401,
      );
    });
  });

  it('accepts a valid admin cookie and marks the request as admin', async () => {
    await withAdminEnv({ ADMIN_ACCESS_SECRET: STRONG }, () => {
      const req = adminRequest(issueAdminSessionToken());
      let called = false;
      authenticateAdmin(req, {} as Response, () => {
        called = true;
      });
      assert.equal(called, true);
      assert.deepEqual(req.adminSession, { authenticated: true });
    });
  });

  it('requires the explicit CSRF header on state-changing requests', () => {
    assert.throws(
      () =>
        requireAdminCsrf(
          { get: () => undefined } as unknown as Request,
          {} as Response,
          (() => {}) as NextFunction,
        ),
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 403,
    );

    let called = false;
    requireAdminCsrf(
      { get: (name: string) => (name === 'x-admin-csrf' ? '1' : undefined) } as unknown as Request,
      {} as Response,
      () => {
        called = true;
      },
    );
    assert.equal(called, true);
  });
});
