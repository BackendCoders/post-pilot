import { Router } from 'express';
import {
  createSocial,
  listSocials,
  getSocial,
  updateSocial,
  deleteSocial,
} from '../controllers/socialController';
import { authenticate, authorize, validateRequest } from '../middleware';
import { z } from 'zod';
import { UserRole } from '../types/index';

const router = Router();

const createSchema = z.object({
  body: z.object({
    insta_auth_token: z.string().optional(),
    meta_auth_token: z.string().optional(),
    linkedin_auth_token: z.string().optional(),
    titkok_auth_token: z.string().optional(),
    user: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
  }),
});

const listSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    user: z.string().optional(),
  }),
});

// All routes require authentication
router.use(authenticate);

// Create (any authenticated user — user id defaults to current user)
router.post('/', validateRequest(createSchema), createSocial);

// List (admins see all; others only their own)
router.get('/', validateRequest(listSchema), listSocials);

// Single resource
router.get('/:id', getSocial);
router.patch('/:id', updateSocial);
router.delete('/:id', authorize(UserRole.ADMIN), deleteSocial);

export default router;
