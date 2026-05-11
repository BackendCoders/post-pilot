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
  uploadLeadImage,
} from '../controller/lead.controller';
import { LEAD_STATUSES } from '../model/lead.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid object id');
const statusEnum = z.enum(LEAD_STATUSES);

const leadFieldsSchema = z.object({
  user: objectId.optional(),
  leadCategory: objectId.optional(),
  position: z.number().nullable().optional(),
  pos: z.number().nullable().optional(),
  title: z.string().trim().nullable().optional(),
  titile: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  latitude: z.number().nullable().optional(),
  lat: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  ratingCount: z.number().nullable().optional(),
  ratingcount: z.number().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  googleMapUrl: z.string().trim().nullable().optional(),
  gmapurl: z.string().trim().nullable().optional(),
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
    pos: z.number().nullable().optional(),
    position: z.number().nullable().optional(),
    title: z.string().trim().nullable().optional(),
    titile: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    phone: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    publicId: z.string().nullable().optional(),
    lat: z.number().nullable().optional(),
    latitude: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    rating: z.number().nullable().optional(),
    ratingcount: z.number().nullable().optional(),
    ratingCount: z.number().nullable().optional(),
    gmapurl: z.string().trim().nullable().optional(),
    googleMapUrl: z.string().trim().nullable().optional(),
    category: z.string().trim().nullable().optional(),
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

router.post('/upload', uploadLeadImage);

export default router;
