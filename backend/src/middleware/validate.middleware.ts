import type { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { AppError } from '../shared/errors/appError.js';

// Express 5 exposes req.query/req.params as getter-only prototype properties,
// so validated values are installed as own properties (shadowing the getter)
// instead of plain assignment, which would throw in strict mode.
interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

const assignValidated = (
  req: Request,
  key: 'query' | 'params',
  value: unknown,
): void => {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

// validateRequest(schema) validates req.body.
// validateRequest({ body, query, params }) validates each part with Zod.
// Invalid input becomes AppError(400); asyncHandler forwards it to error.middleware.
export const validateRequest =
  (schema: ZodType | RequestSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const schemas: RequestSchemas =
        schema instanceof ZodType ? { body: schema } : schema;

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        assignValidated(req, 'params', schemas.params.parse(req.params));
      }
      if (schemas.query) {
        assignValidated(req, 'query', schemas.query.parse(req.query));
      }
      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Validation failed', 400);
    }
  };
