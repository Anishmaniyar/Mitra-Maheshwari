import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import {
  generateAccessToken,
  verifyAccessToken,
} from '../../shared/auth/jwt.js';
import { authorize } from '../../middleware/authorize.js';
import {
  assertDevLoginAllowed,
  devAdminLogin,
} from './devAdmin.service.js';
import { devAdminLoginController } from './auth.controller.js';

const withNodeEnv = async (value: string, fn: () => Promise<void>): Promise<void> => {
  const previous = env.NODE_ENV;
  (env as { NODE_ENV: string }).NODE_ENV = value as typeof env.NODE_ENV;
  try {
    await fn();
  } finally {
    (env as { NODE_ENV: string }).NODE_ENV = previous;
  }
};

describe('dev admin login guard', () => {
  it('allows the shortcut outside production', () => {
    assert.doesNotThrow(() => assertDevLoginAllowed());
  });

  it('rejects the shortcut when NODE_ENV=production', async () => {
    await withNodeEnv('production', async () => {
      assert.throws(() => assertDevLoginAllowed(), (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 403);
        return true;
      });
    });
  });

  it('devAdminLogin() fails closed in production before touching the database', async () => {
    await withNodeEnv('production', async () => {
      await assert.rejects(() => devAdminLogin(), (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal((error as AppError).statusCode, 403);
        return true;
      });
    });
  });

  it('the endpoint forwards a 403 in production without a database call', async () => {
    await withNodeEnv('production', async () => {
      let captured: unknown;
      const next: NextFunction = (error?: unknown) => {
        captured = error;
      };
      devAdminLoginController({} as Request, {} as Response, next);
      await new Promise((resolve) => setImmediate(resolve));
      assert.ok(captured instanceof AppError);
      assert.equal((captured as AppError).statusCode, 403);
    });
  });
});

describe('dev admin session shape', () => {
  it('issues a short-lived ADMIN JWT that passes the production middleware', () => {
    const accessToken = generateAccessToken({
      memberId: '00000000-0000-4000-8000-000000000000',
      role: 'ADMIN',
      familyId: '00000000-0000-4000-8000-000000000001',
      isFamilyHead: true,
    });
    const decoded = verifyAccessToken(accessToken);

    // Every claim authenticate.ts requires.
    assert.ok(decoded.sub);
    assert.equal(decoded.role, 'ADMIN');
    assert.ok(decoded.familyId);
    assert.ok(decoded.jti);

    // Short-lived: the default access-token TTL is 15 minutes.
    const timed = decoded as typeof decoded & { iat?: number; exp?: number };
    assert.ok(typeof timed.iat === 'number' && typeof timed.exp === 'number');
    assert.ok((timed.exp as number) - (timed.iat as number) <= 15 * 60);

    // Passes authorize('ADMIN') exactly like a production admin session.
    let nextCalled = false;
    authorize('ADMIN')(
      { user: { memberId: decoded.sub, role: decoded.role, familyId: decoded.familyId, isFamilyHead: true, jti: decoded.jti } } as Request,
      {} as Response,
      () => {
        nextCalled = true;
      },
    );
    assert.equal(nextCalled, true);

    // A MEMBER token is still rejected by the same middleware.
    assert.throws(
      () =>
        authorize('ADMIN')(
          { user: { memberId: 'x', role: 'MEMBER', familyId: 'y', isFamilyHead: false, jti: 'z' } } as Request,
          {} as Response,
          () => {},
        ),
      (error: unknown) => error instanceof AppError,
    );
  });
});
