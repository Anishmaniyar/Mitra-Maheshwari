import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import * as FamilyService from './family.service.js';

const requireUser = (req: Request): string => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }
  return req.user.memberId;
};

export const getFamilyController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await FamilyService.getOwnFamily(requireUser(req));

    return res.status(200).json({
      message: 'Family fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const getFamilyMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await FamilyService.getFamilyMember(
      requireUser(req),
      (req.params as { memberId: string }).memberId,
    );

    return res.status(200).json({
      message: 'Member fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const createInvitationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await FamilyService.createInvitation(requireUser(req), req.body);

    return res.status(201).json({
      message: 'Invitation created successfully',
      status: 'success',
      data: result,
    });
  },
);

export const listInvitationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await FamilyService.listInvitations(requireUser(req));

    return res.status(200).json({
      message: 'Invitations fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const cancelInvitationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await FamilyService.cancelInvitation(
      requireUser(req),
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Invitation cancelled successfully',
      status: 'success',
      data: result,
    });
  },
);

export const removeFamilyMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await FamilyService.removeFamilyMember(
      requireUser(req),
      (req.params as { memberId: string }).memberId,
    );

    return res.status(200).json({
      message: 'Member removed successfully',
      status: 'success',
      data: result,
    });
  },
);
