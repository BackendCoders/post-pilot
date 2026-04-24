import { Router } from 'express';
import z from 'zod';
import { authenticate, validateRequest } from '../../../middleware';
import {
  createLeadCategory,
  deleteLeadCategory,
  getLeadCategory,
  listLeadCategories,
  updateLeadCategory,
} from '../controller/leadCategory.controller';
const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid object id');

const leadCategoryFieldsSchema = z.object({
  user: objectId.optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
});

const createLeadCategorySchema = z.object({
  body: leadCategoryFieldsSchema,
});

const updateLeadCategorySchema = z.object({
  body: leadCategoryFieldsSchema.partial(),
  params: z.object({
    id: objectId,
  }),
});

const listLeadCategorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    user: objectId.optional(),
    search: z.string().trim().min(1).optional(),
  }),
});

const leadIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

router.use(authenticate);

// route as /api/leads/category
router.post('/', validateRequest(createLeadCategorySchema), createLeadCategory);
router.get('/', validateRequest(listLeadCategorySchema), listLeadCategories);
router.get('/:id', validateRequest(leadIdSchema), getLeadCategory);
router.patch(
  '/:id',
  validateRequest(updateLeadCategorySchema),
  updateLeadCategory
);
router.delete('/:id', validateRequest(leadIdSchema), deleteLeadCategory);

export default router;
