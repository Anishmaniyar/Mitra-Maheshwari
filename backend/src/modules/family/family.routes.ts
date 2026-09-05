import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import * as familyController from "./family.controller";
import { addMemberSchema } from "./family.validation";

export const familyRouter = Router();

familyRouter.get("/", requireAuth, familyController.getFamily);
familyRouter.post("/members", requireAuth, validate(addMemberSchema), familyController.addMember);