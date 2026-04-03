import { asyncHandler } from '../../../middleware';
import { ensureAssignableUser, isOwnerOrAdmin } from './lead.controller';
import { Request, Response } from 'express';
import LeadCategory from '../model/leadCategory.model';
import Lead from '../model/lead.model';

export const createLeadCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const user = ensureAssignableUser(req, req.body.user);
    const leadCategory = await LeadCategory.create({
      user,
      title: req.body.title,
      description: req.body.description,
    });

    res.status(201).json({
      success: true,
      data: leadCategory,
      message: 'Lead category created successfully',
    });
  }
);

export const listLeadCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    const filter: Record<string, any> = {};

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    if (req.user?.role === 'admin' && req.query.user) {
      filter.user = req.query.user;
    } else if (req.user?.userId) {
      filter.user = req.user.userId;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LeadCategory.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      LeadCategory.countDocuments(filter).exec(),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      message: 'Lead categories fetched successfully',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  }
);

export const getLeadCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await LeadCategory.findById(req.params.id).exec();

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: 'Lead category not found' });
    }

    if (!isOwnerOrAdmin(req.user, category.user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    res.status(200).json({ success: true, data: category });
  }
);

export const updateLeadCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await LeadCategory.findById(req.params.id).exec();

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: 'Lead category not found' });
    }

    if (!isOwnerOrAdmin(req.user, category.user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    const payload: Record<string, any> = {};
    if (req.body.user) {
      payload.user = ensureAssignableUser(req, req.body.user);
    }
    if (typeof req.body.title !== 'undefined') {
      payload.title = req.body.title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      payload.description = req.body.description;
    }

    const updatedCategory = await LeadCategory.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).exec();

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Lead category updated successfully',
    });
  }
);

export const deleteLeadCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await LeadCategory.findById(req.params.id).exec();

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: 'Lead category not found' });
    }

    if (!isOwnerOrAdmin(req.user, category.user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    await Lead.updateMany(
      { leadCategory: category._id },
      { $unset: { leadCategory: 1 } }
    ).exec();
    await LeadCategory.findByIdAndDelete(req.params.id).exec();

    res.status(200).json({
      success: true,
      message: 'Lead category deleted successfully',
    });
  }
);
