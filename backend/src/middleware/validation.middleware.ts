import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/http";

/** Validates req.body against a zod schema and replaces it with the parsed value. */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue?.path.join(".") || "input";
      throw new AppError(400, "VALIDATION_ERROR", `${field}: ${issue?.message ?? "Invalid value"}`);
    }
    req.body = result.data;
    next();
  };
}