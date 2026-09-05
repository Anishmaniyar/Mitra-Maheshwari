import type { Request, Response } from "express";
import { asyncHandler, ok, requireMemberId } from "../../utils/http";
import * as familyService from "./family.service";
import type { AddMemberInput } from "./family.validation";

export const getFamily = asyncHandler(async (req: Request, res: Response) => {
  const family = await familyService.getFamilyForMember(requireMemberId(req));
  ok(res, { family });
});

export const addMember = asyncHandler(async (req: Request<unknown, unknown, AddMemberInput>, res: Response) => {
  const family = await familyService.addMemberToFamily(requireMemberId(req), {
    firstName: req.body.firstName,
    middleName: req.body.middleName ?? null,
    lastName: req.body.lastName,
    mobile: req.body.mobile,
    bloodGroup: req.body.bloodGroup ?? null,
    age: req.body.age ?? null,
    occupation: req.body.occupation ?? null,
    area: req.body.area ?? null,
  });
  ok(res, { family }, 201);
});