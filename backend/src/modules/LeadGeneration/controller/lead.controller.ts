import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../../middleware';
import Lead from '../model/lead.model';
import LeadCategory from '../model/leadCategory.model';
import axios from 'axios';
import {
  deleteImageFromCloudinary,
  uploadImageFromUrl,
} from '../../../utils/uploadCloudinary';
import { IApiResponse } from '@/types/index';

export const isOwnerOrAdmin = (
  reqUser: Express.Request['user'],
  resourceUserId: Types.ObjectId | string
) => {
  if (!reqUser) return false;
  if (reqUser.role === 'admin') return true;
  return resourceUserId.toString() === reqUser.userId.toString();
};

export const ensureAssignableUser = (
  req: Request,
  userId?: string | Types.ObjectId
): string => {
  const requestedUserId = userId?.toString() || req.user?.userId?.toString();

  if (!requestedUserId) {
    const error = new Error('User is required') as Error & {
      statusCode?: number;
      isOperational?: boolean;
    };
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  if (
    req.user?.role !== 'admin' &&
    requestedUserId !== req.user?.userId?.toString()
  ) {
    const error = new Error('Insufficient permissions') as Error & {
      statusCode?: number;
      isOperational?: boolean;
    };
    error.statusCode = 403;
    error.isOperational = true;
    throw error;
  }

  return requestedUserId;
};

const createHttpError = (statusCode: number, message: string) => {
  const error = new Error(message) as Error & {
    statusCode?: number;
    isOperational?: boolean;
  };
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

const ensureLeadCategoryAccess = async (
  req: Request,
  leadCategoryId?: string | Types.ObjectId,
  userId?: string | Types.ObjectId
) => {
  if (!leadCategoryId) {
    return undefined;
  }

  const category = await LeadCategory.findById(leadCategoryId).exec();

  if (!category) {
    throw createHttpError(404, 'Lead category not found');
  }

  const requestedUserId = userId?.toString();
  if (requestedUserId && category.user.toString() !== requestedUserId) {
    throw createHttpError(
      400,
      'Lead category does not belong to the selected user'
    );
  }

  if (!isOwnerOrAdmin(req.user, category.user)) {
    throw createHttpError(403, 'Insufficient permissions');
  }

  return category._id;
};

const normalizeLeadPayload = (
  payload: Record<string, any>,
  forceNewStatus = false
) => ({
  user: payload.user,
  leadCategory: payload.leadCategory,
  position: payload.position,
  phone: payload.phone,
  thumbnailUrl: payload.thumbnailUrl,
  publicId: payload.publicId,
  website: payload.website,
  title: payload.title,
  address: payload.address,
  latitude: payload.latitude,
  longitude: payload.longitude,
  rating: payload.rating,
  googleMapUrl: payload.googleMapUrl,
  ratingCount: payload.ratingCount,
  note: payload.note,
  status: forceNewStatus ? 'saved' : payload.status,
});

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const payload = normalizeLeadPayload(req.body as Record<string, any>);
  payload.user = ensureAssignableUser(req, payload.user);
  payload.leadCategory = await ensureLeadCategoryAccess(
    req,
    payload.leadCategory,
    payload.user
  );

  const lead = await Lead.create(payload);

  const response: IApiResponse = {
    success: true,
    data: lead,
    message: 'Lead created successfully',
  };

  res.status(201).json(response);
});

export const listLeads = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10)
  );
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

  const filter: Record<string, any> = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.leadCategory) {
    filter.leadCategory = req.query.leadCategory;
  }

  if (req.user?.role === 'admin' && req.query.user) {
    filter.user = req.query.user;
  } else if (req.user?.userId) {
    filter.user = req.user.userId;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .populate('leadCategory')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Lead.countDocuments(filter).exec(),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    message: 'Leads fetched successfully',
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

export const getLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const lead = await Lead.findById(id).populate('leadCategory').exec();

  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  if (!isOwnerOrAdmin(req.user, lead.user)) {
    return res
      .status(403)
      .json({ success: false, error: 'Insufficient permissions' });
  }

  res.status(200).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existingLead = await Lead.findById(id).exec();

  if (!existingLead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  if (!isOwnerOrAdmin(req.user, existingLead.user)) {
    return res
      .status(403)
      .json({ success: false, error: 'Insufficient permissions' });
  }

  const payload = normalizeLeadPayload(req.body as Record<string, any>);
  if (payload.user) {
    payload.user = ensureAssignableUser(req, payload.user);
  }
  const effectiveUserId = payload.user || existingLead.user;
  if (Object.prototype.hasOwnProperty.call(req.body, 'leadCategory')) {
    payload.leadCategory = await ensureLeadCategoryAccess(
      req,
      payload.leadCategory,
      effectiveUserId
    );
  }

  const updatedLead = await Lead.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate('leadCategory')
    .exec();

  res.status(200).json({
    success: true,
    data: updatedLead,
    message: 'Lead updated successfully',
  });
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existingLead = await Lead.findById(id).exec();

  if (!existingLead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  if (!isOwnerOrAdmin(req.user, existingLead.user)) {
    return res
      .status(403)
      .json({ success: false, error: 'Insufficient permissions' });
  }

  await Lead.findByIdAndDelete(id).exec();

  if (existingLead.publicId) {
    const cloudinaryDeleteResult = await deleteImageFromCloudinary(
      existingLead.publicId
    );
    if (!cloudinaryDeleteResult.success) {
      console.warn(
        `Cloudinary delete failed for lead ${id}, publicId=${existingLead.publicId}: ${cloudinaryDeleteResult.error}`
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Lead deleted successfully',
  });
});

export const deleteLeadBulk = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids }: { ids: string[] } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or empty ids array',
      });
    }

    const uniqueIds = [...new Set(ids)];
    const leadFilter: Record<string, any> = { _id: { $in: uniqueIds } };

    if (req.user?.role !== 'admin') {
      leadFilter.user = req.user?.userId;
    }

    const existingLead = await Lead.find(leadFilter).exec();

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Leads not found',
      });
    }

    if (existingLead.length !== uniqueIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for one or more leads',
      });
    }

    const publicIds = existingLead
      .map((lead) => lead.publicId)
      .filter((publicId): publicId is string => Boolean(publicId));

    if (publicIds.length > 0) {
      const cloudinaryDeleteResults = await Promise.allSettled(
        publicIds.map((publicId) => deleteImageFromCloudinary(publicId))
      );

      cloudinaryDeleteResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(
            `Cloudinary delete promise rejected for publicId=${publicIds[index]}: ${String(result.reason)}`
          );
          return;
        }

        if (!result.value.success) {
          console.warn(
            `Cloudinary delete failed for publicId=${publicIds[index]}: ${result.value.error}`
          );
        }
      });
    }

    await Lead.deleteMany({ _id: { $in: uniqueIds } }).exec();

    res.status(200).json({
      success: true,
      message: 'Bulk Lead deleted successfully',
    });
  }
);

const upload = async (imageUrl: string) => {
  const result = await uploadImageFromUrl(imageUrl, {
    folder: 'scraped-leads/uploads', // optional
  });

  if (!result.success) {
    console.log(result);
    throw new Error('image upload failed');
  }

  return { url: result.url, publicId: result.publicId };
};

export const bulkCreateLeads = asyncHandler(
  async (req: Request, res: Response) => {
    const { user, leads } = req.body as {
      user: string;
      leads: Array<Record<string, any>>;
    };

    const allowedUserId = ensureAssignableUser(req, user);
    const documents = await Promise.all(
      leads.map(async (lead) => {
        if (lead.thumbnailUrl) {
          const { url, publicId } = await upload(lead.thumbnailUrl);
          lead.thumbnailUrl = url;
          lead.publicId = publicId;
        }
        const payload = normalizeLeadPayload({ ...lead, user }, true);
        const leadCategory = await ensureLeadCategoryAccess(
          req,
          payload.leadCategory,
          allowedUserId
        );
        return {
          ...payload,
          leadCategory,
          user: allowedUserId,
          status: 'saved',
        };
      })
    );

    const createdLeads = await Lead.insertMany(documents, { ordered: false });

    res.status(201).json({
      success: true,
      data: createdLeads,
      count: createdLeads.length,
      message: 'Leads created successfully in bulk',
    });
  }
);

export const bulkUpdateLeads = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids, status }: { ids: string[]; status: string } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or empty ids array',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const uniqueIds = [...new Set(ids)];
    const leadFilter: Record<string, any> = { _id: { $in: uniqueIds } };

    if (req.user?.role !== 'admin') {
      leadFilter.user = req.user?.userId;
    }

    const existingLead = await Lead.find(leadFilter).select('_id').exec();

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Leads not found',
      });
    }

    if (existingLead.length !== uniqueIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for one or more leads',
      });
    }

    const updateResult = await Lead.updateMany(
      { _id: { $in: uniqueIds } },
      { $set: { status } },
      { runValidators: true }
    ).exec();

    return res.status(200).json({
      success: true,
      data: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      },
      message: 'Lead statuses updated successfully',
    });
  }
);

export const getGoogleMapScrappedData = asyncHandler(
  async (req: Request, res: Response) => {
    const { business, location, page, latitude, longitude } = req.body;

    const queryString = `${business} in ${location}`;
    const query: any = { q: queryString, location, page };

    if (latitude && longitude) {
      query['ll'] = `@${latitude},${longitude},12z`;
    }

    const response = await axios.post('https://google.serper.dev/maps', query, {
      headers: { ['X-API-KEY']: process.env.SERPER_API_KEY },
    });

    if (response.status === 200) {
      res.status(200).json(response.data.places);
    }
  }
);

export default {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  deleteLeadBulk,
  bulkCreateLeads,
  bulkUpdateLeads,
};
