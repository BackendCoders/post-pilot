import { Request, Response, NextFunction } from 'express';
import Social from '../models/Social';
import createCrudService from '../services/crudService';
import { asyncHandler } from '../middleware/errorHandler';
import { Types } from 'mongoose';
import createBaseController from './baseController';

const service = createCrudService(Social);

const isOwnerOrAdmin = (
  reqUser: any,
  resourceUserId: Types.ObjectId | string
) => {
  if (!reqUser) return false;
  if (reqUser.role === 'admin') return true;
  return resourceUserId.toString() === reqUser.userId.toString();
};

const base = createBaseController(service, {
  resourceName: 'Social',
  getFilter: (req) => {
    const filter: any = {};
    if (req.query.user) {
      filter.user = req.query.user;
    }
    if (req.user && req.user.role !== 'admin') {
      filter.user = req.user.userId;
    }
    return filter;
  },
});

export const createSocial = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    req.body.user = req.body.user || req.user?.userId;
    return base.create(req, res, next);
  }
);

export const listSocials = base.list;

export const getSocial = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const social = await service.getById(id as string);
  if (!social)
    return res.status(404).json({ success: false, error: 'Not found' });

  if (!isOwnerOrAdmin(req.user, (social as any).user)) {
    return res
      .status(403)
      .json({ success: false, error: 'Insufficient permissions' });
  }

  return base.getById(req, res, next);
});

export const updateSocial = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const social = await service.getById(id as string);
    if (!social)
      return res.status(404).json({ success: false, error: 'Not found' });

    if (!isOwnerOrAdmin(req.user, (social as any).user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    return base.update(req, res, next);
  }
);

export const deleteSocial = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const social = await service.getById(id as string);
    if (!social)
      return res.status(404).json({ success: false, error: 'Not found' });

    if (!isOwnerOrAdmin(req.user, (social as any).user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    return base.remove(req, res, next);
  }
);

export default {
  createSocial,
  listSocials,
  getSocial,
  updateSocial,
  deleteSocial,
};
