import { Router } from 'express';
import { z } from 'zod';
import { authenticate, validateRequest } from '../../../middleware';
import {
  bulkCreateLeads,
  bulkUpdateLeads,
  createLead,
  deleteLead,
  deleteLeadBulk,
  getGoogleMapScrappedData,
  getLead,
  listLeads,
  updateLead,
} from '../controller/lead.controller';
import { LEAD_STATUSES } from '../model/lead.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid object id');
const statusEnum = z.enum(LEAD_STATUSES);

const leadFieldsSchema = z.object({
  user: objectId.optional(),
  leadCategory: objectId.optional(),
  position: z.number().optional(),
  pos: z.number().optional(),
  title: z.string().trim().min(1).optional(),
  titile: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  latitude: z.number().optional(),
  lat: z.number().optional(),
  longitude: z.number().optional(),
  lng: z.number().optional(),
  rating: z.number().optional(),
  ratingCount: z.number().optional(),
  ratingcount: z.number().optional(),
  category: z.string().trim().min(1).optional(),
  googleMapUrl: z.string().trim().url().optional(),
  gmapurl: z.string().trim().url().optional(),
  status: statusEnum.optional(),
});

const createLeadSchema = z.object({
  body: leadFieldsSchema
    .extend({
      user: objectId.optional(),
    })
    .refine(
      (data) => Boolean(data.title || data.titile),
      'Either title or titile is required'
    ),
});

const updateLeadSchema = z.object({
  body: leadFieldsSchema,
  params: z.object({
    id: objectId,
  }),
});

const listLeadSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    user: objectId.optional(),
    status: statusEnum.optional(),
    leadCategory: objectId.optional(),
  }),
});

const leadIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

const bulkLeadItemSchema = z
  .object({
    pos: z.number().optional(),
    position: z.number().optional(),
    title: z.string().trim().min(1).optional(),
    titile: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    publicId: z.string().optional(),
    lat: z.number().optional(),
    latitude: z.number().optional(),
    lng: z.number().optional(),
    longitude: z.number().optional(),
    rating: z.number().optional(),
    ratingcount: z.number().optional(),
    ratingCount: z.number().optional(),
    gmapurl: z.string().trim().url().optional(),
    googleMapUrl: z.string().trim().url().optional(),
    category: z.string().trim().min(1).optional(),
    leadCategory: objectId.optional(),
  })
  .refine(
    (data) => Boolean(data.title || data.titile),
    'Either title or titile is required'
  );

const bulkCreateLeadSchema = z.object({
  body: z.object({
    user: objectId,
    leads: z.array(bulkLeadItemSchema).min(1, 'At least one lead is required'),
  }),
});

const bulkUpdateLeadSchema = z.object({
  body: z.object({
    ids: z.array(objectId).min(1, 'At least one lead id is required'),
    status: statusEnum,
  }),
});

const mapScrapperPayload = z.object({
  body: z.object({
    business: z.string(),
    location: z.string(),
    page: z.number().default(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

const deleteBulkItemSchema = z.object({
  body: z.object({ ids: z.array(z.string()) }),
});

router.use(authenticate);

router.post(
  '/scrap-map-data',
  validateRequest(mapScrapperPayload),
  getGoogleMapScrappedData
);

router.post('/', validateRequest(createLeadSchema), createLead);
router.post('/bulk', validateRequest(bulkCreateLeadSchema), bulkCreateLeads);
router.patch('/bulk', validateRequest(bulkUpdateLeadSchema), bulkUpdateLeads);
router.patch(
  '/bulk/status',
  validateRequest(bulkUpdateLeadSchema),
  bulkUpdateLeads
);
router.get('/', validateRequest(listLeadSchema), listLeads);
router.get('/:id', validateRequest(leadIdSchema), getLead);
router.patch('/:id', validateRequest(updateLeadSchema), updateLead);
router.delete('/:id', validateRequest(leadIdSchema), deleteLead);
router.post(
  '/bulk/delete',
  validateRequest(deleteBulkItemSchema),
  deleteLeadBulk
);

export default router;
