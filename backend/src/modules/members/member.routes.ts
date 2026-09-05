import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { rateLimiter } from "../../middleware/rate-limit.middleware";
import { validate } from "../../middleware/validation.middleware";
import * as memberController from "./member.controller";
import { createMemberSchema, matchMemberSchema, updateProfileSchema } from "./member.validation";

export const memberRouter = Router();

// Public: check whether the visitor exists in the imported community data.
memberRouter.post(
  "/members/match",
  rateLimiter({ windowMs: 60_000, limit: 10, message: "Too many match attempts. Please slow down." }),
  validate(matchMemberSchema),
  memberController.match,
);

// Public: new registration (creates a family + head member atomically).
memberRouter.post(
  "/members",
  rateLimiter({ windowMs: 60_000, limit: 5, message: "Too many registration attempts. Please slow down." }),
  validate(createMemberSchema),
  memberController.create,
);

// Authenticated: current member profile.
memberRouter.get("/me", requireAuth, memberController.getMe);
memberRouter.patch("/me", requireAuth, validate(updateProfileSchema), memberController.updateMe);