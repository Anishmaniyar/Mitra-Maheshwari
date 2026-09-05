import type { Request, Response } from "express";
import { asyncHandler, ok, requireMemberId } from "../../utils/http";
import * as memberService from "./member.service";
import type { CreateMemberInput, MatchMemberInput, UpdateProfileInput } from "./member.validation";

export const match = asyncHandler(async (req: Request<unknown, unknown, MatchMemberInput>, res: Response) => {
  const result = await memberService.matchMember(req.body);
  ok(res, result);
});

export const create = asyncHandler(async (req: Request<unknown, unknown, CreateMemberInput>, res: Response) => {
  const member = await memberService.createNewMember({
    firstName: req.body.firstName,
    middleName: req.body.middleName ?? null,
    lastName: req.body.lastName,
    mobile: req.body.mobile,
    bloodGroup: req.body.bloodGroup ?? null,
    age: req.body.age ?? null,
    occupation: req.body.occupation ?? null,
    area: req.body.area ?? null,
    panName: req.body.panName ?? null,
    panNumber: req.body.panNumber ?? null,
  });
  ok(res, { member }, 201);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const member = await memberService.getMemberProfile(requireMemberId(req));
  ok(res, { member });
});

export const updateMe = asyncHandler(async (req: Request<unknown, unknown, UpdateProfileInput>, res: Response) => {
  const member = await memberService.updateMemberProfile(requireMemberId(req), req.body);
  ok(res, { member });
});