import { asyncHandler } from '../../../middleware';
import { ensureAssignableUser, isOwnerOrAdmin } from './lead.controller';
import { Request, Response } from 'express';
import MessageTemplate from '../model/messageTemplate.model';

const PROFESSIONAL_MESSAGE_TEMPLATES = [
  {
    slug: 'professional-introduction',
    title: 'Professional Introduction',
    description: 'A formal first touchpoint with a new lead.',
    content:
      "Hi {{title}},\n\nMy name is {{userName}}. I came across your business at {{address}} and was impressed by what I found.\n\nI'd love to connect briefly this week to share how we help businesses like yours.\n\nBest,\n{{userName}}\nSent on {{date}}",
  },
  {
    slug: 'professional-follow-up',
    title: 'Professional Follow-up',
    description: 'A polite follow-up after no response.',
    content:
      "Hi {{title}},\n\nI wanted to follow up on my previous message sent on {{date}}. I noticed your business at {{address}} and believe our services could help boost your visibility.\n\nYour current rating of {{rating}} stars ({{ratingCount}} reviews) shows strong customer trust — imagine what we could do together!\n\nWould you have 10 minutes this {{day}}?\n\nBest regards,\n{{userName}}",
  },
  {
    slug: 'professional-value-proposition',
    title: 'Value Proposition Outreach',
    description: 'Lead outreach focused on value and credibility.',
    content:
      "Hi {{title}},\n\nI noticed your business ranked #{{position}} in our analysis of local leaders.\n\nAs {{userName}}, I've helped similar businesses:\n• Increase visibility by 40%\n• Generate 3x more qualified leads\n• Save 10+ hours per week\n\nWould a brief call on {{date}} work for you?\n\n{{website}} | {{googleMapUrl}}\n\nCheers,\n{{userName}}",
  },
  {
    slug: 'outreach-sequence-starter',
    title: 'Outreach Sequence - Day 1',
    description: 'First touchpoint in a multi-step outreach sequence.',
    content:
      "Subject: Quick question about {{title}}\n\nHi there,\n\nI noticed {{title}} at {{address}} — your {{rating}}-star rating ({{ratingCount}} reviews) is impressive!\n\nI'm {{userName}}. Would you be open to a quick chat about how we help businesses in your industry?\n\nNo pressure, just curious.\n\n{{userEmail}}\n{{date}}",
  },
] as const;

const ensureProfessionalTemplates = async () => {
  await MessageTemplate.bulkWrite(
    PROFESSIONAL_MESSAGE_TEMPLATES.map((template) => ({
      updateOne: {
        filter: { slug: template.slug },
        update: {
          $setOnInsert: {
            ...template,
            isGlobal: true,
            user: null,
            baseTemplate: null,
          },
        },
        upsert: true,
      },
    }))
  );
};

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
    await ensureProfessionalTemplates();

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    const filter: Record<string, any> = {
      $or: [{ isGlobal: true }],
    };
    const requestedUserId =
      req.user?.role === 'admin' && req.query.user
        ? req.query.user.toString()
        : req.user?.userId?.toString();

    if (requestedUserId) {
      filter.$or.push({ user: requestedUserId });
    }

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const allItems = await MessageTemplate.find(filter)
      .sort({ [sortBy]: sortOrder })
      .exec();

    const personalizedBaseTemplateIds = new Set(
      allItems
        .filter(
          (item) =>
            !!item.baseTemplate &&
            !!item.user &&
            item.user.toString() === requestedUserId
        )
        .map((item) => item.baseTemplate!.toString())
    );

    const visibleItems = allItems.filter((item) => {
      if (!item.isGlobal) {
        return true;
      }
      return !personalizedBaseTemplateIds.has(item._id.toString());
    });

    const total = visibleItems.length;
    const skip = (page - 1) * limit;
    const items = visibleItems.slice(skip, skip + limit);

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
    await ensureProfessionalTemplates();

    const template = await MessageTemplate.findById(req.params.id).exec();

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: 'Message template not found' });
    }

    if (!template.isGlobal && !template.user) {
      return res
        .status(500)
        .json({ success: false, error: 'Template configuration is invalid' });
    }

    if (!template.isGlobal && !isOwnerOrAdmin(req.user, template.user!)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    res.status(200).json({ success: true, data: template });
  }
);

export const updateMessageTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    await ensureProfessionalTemplates();

    const template = await MessageTemplate.findById(req.params.id).exec();

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: 'Message template not found' });
    }

    const currentUserId = req.user?.userId?.toString();
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    if (!template.isGlobal && !template.user) {
      return res
        .status(500)
        .json({ success: false, error: 'Template configuration is invalid' });
    }

    if (!template.isGlobal && !isOwnerOrAdmin(req.user, template.user!)) {
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

    if (template.isGlobal) {
      const baseTemplateId = template._id;
      const existingPersonalizedTemplate = await MessageTemplate.findOne({
        user: currentUserId,
        baseTemplate: baseTemplateId,
      }).exec();

      if (existingPersonalizedTemplate) {
        const updatedPersonalizedTemplate = await MessageTemplate.findByIdAndUpdate(
          existingPersonalizedTemplate._id,
          payload,
          { new: true, runValidators: true }
        ).exec();

        return res.status(200).json({
          success: true,
          data: updatedPersonalizedTemplate,
          message: 'Message template updated successfully',
        });
      }

      const personalizedTemplate = await MessageTemplate.create({
        user: currentUserId,
        title:
          typeof payload.title !== 'undefined' ? payload.title : template.title,
        description:
          Object.prototype.hasOwnProperty.call(payload, 'description')
            ? payload.description
            : template.description,
        content:
          Object.prototype.hasOwnProperty.call(payload, 'content')
            ? payload.content
            : template.content,
        isGlobal: false,
        baseTemplate: baseTemplateId,
      });

      return res.status(200).json({
        success: true,
        data: personalizedTemplate,
        message: 'Message template updated successfully',
      });
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
    await ensureProfessionalTemplates();

    const template = await MessageTemplate.findById(req.params.id).exec();

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: 'Message template not found' });
    }

    if (template.isGlobal) {
      return res.status(403).json({
        success: false,
        error: 'Professional templates cannot be deleted',
      });
    }

    if (!template.user || !isOwnerOrAdmin(req.user, template.user)) {
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
