import { asyncHandler } from '../../../middleware';
import { ensureAssignableUser, isOwnerOrAdmin } from './lead.controller';
import { Request, Response } from 'express';
import MessageTemplate from '../model/messageTemplate.model';

export const createMessageTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const user = ensureAssignableUser(req, req.body.user);
    const messageTemplate = await MessageTemplate.create({
      user,
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
    });

    res.status(201).json({
      success: true,
      data: messageTemplate,
      message: 'Message template created successfully',
    });
  }
);

export const listMessageTemplates = asyncHandler(
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
      MessageTemplate.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      MessageTemplate.countDocuments(filter).exec(),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      message: 'Message templates fetched successfully',
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

export const getMessageTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const template = await MessageTemplate.findById(req.params.id).exec();

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: 'Message template not found' });
    }

    if (!isOwnerOrAdmin(req.user, template.user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    res.status(200).json({ success: true, data: template });
  }
);

export const updateMessageTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const template = await MessageTemplate.findById(req.params.id).exec();

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: 'Message template not found' });
    }

    if (!isOwnerOrAdmin(req.user, template.user)) {
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
    if (Object.prototype.hasOwnProperty.call(req.body, 'content')) {
      payload.content = req.body.content;
    }

    const updatedTemplate = await MessageTemplate.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).exec();

    res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: 'Message template updated successfully',
    });
  }
);

export const deleteMessageTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const template = await MessageTemplate.findById(req.params.id).exec();

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: 'Message template not found' });
    }

    if (!isOwnerOrAdmin(req.user, template.user)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    await MessageTemplate.findByIdAndDelete(req.params.id).exec();

    res.status(200).json({
      success: true,
      message: 'Message template deleted successfully',
    });
  }
);
