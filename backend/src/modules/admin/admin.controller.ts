import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AdminService from './admin.service.js';

const requireAdmin = (req: Request): string => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }
  return req.user.memberId;
};

export const listRegistrationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as { limit: number; offset: number };
    const result = await AdminService.listRegistrations(query.limit, query.offset);

    return res.status(200).json({
      message: 'Registrations fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const getRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.getRegistration(
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Registration fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const approveRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.approveRegistration(
      (req.params as { id: string }).id,
      requireAdmin(req),
    );

    return res.status(200).json({
      message: 'Registration approved successfully',
      status: 'success',
      data: result,
    });
  },
);

export const rejectRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.rejectRegistration(
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Registration rejected successfully',
      status: 'success',
      data: result,
    });
  },
);

export const listMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as {
      status?: string;
      limit: number;
      offset: number;
    };
    const result = await AdminService.listMembers(
      query.status,
      query.limit,
      query.offset,
    );

    return res.status(200).json({
      message: 'Members fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const getMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.getMember(
      (req.params as { memberId: string }).memberId,
    );

    return res.status(200).json({
      message: 'Member fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const updateMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.updateMember(
      (req.params as { memberId: string }).memberId,
      req.body,
    );

    return res.status(200).json({
      message: 'Member updated successfully',
      status: 'success',
      data: result,
    });
  },
);

export const updateMemberStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.updateMemberStatus(
      (req.params as { memberId: string }).memberId,
      (req.body as { status: string }).status,
    );

    return res.status(200).json({
      message: 'Member status updated successfully',
      status: 'success',
      data: result,
    });
  },
);

export const listFamiliesController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as {
      status?: string;
      limit: number;
      offset: number;
    };
    const result = await AdminService.listFamilies(
      query.status,
      query.limit,
      query.offset,
    );

    return res.status(200).json({
      message: 'Families fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const getFamilyController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.getFamily(
      (req.params as { familyId: string }).familyId,
    );

    return res.status(200).json({
      message: 'Family fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const updateFamilyController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.updateFamily(
      (req.params as { familyId: string }).familyId,
      (req.body as { status: string }).status,
    );

    return res.status(200).json({
      message: 'Family updated successfully',
      status: 'success',
      data: result,
    });
  },
);
