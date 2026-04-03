import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
} from '../controllers/userController';
import {
  authenticate,
  authorize,
  validateRequest,
  validateBody,
} from '../middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  paginationQuerySchema,
} from '../utils/validationSchemas';
import { UserRole } from '../types/index';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes (accessible by authenticated users)
router.get('/profile', (req, res) => res.redirect('/api/users/me')); // Alias for /me
router.put('/profile', validateRequest(updateProfileSchema), updateProfile);
router.put(
  '/change-password',
  validateRequest(changePasswordSchema),
  changePassword
);

// Admin only routes
router.get(
  '/',
  authorize(UserRole.ADMIN),
  validateRequest(paginationQuerySchema),
  getUsers
);
router.get(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(userIdParamSchema),
  getUserById
);
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(userIdParamSchema),
  updateUser
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(userIdParamSchema),
  deleteUser
);

export default router;
