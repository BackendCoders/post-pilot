import { Router } from 'express';
import {
  getAdminUsers,
  updateAdminUser,
  assignUserPlan,
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
} from '../controllers/adminController';

const router = Router();

// User management endpoints
router.get('/users', getAdminUsers);
router.put('/users/:id', updateAdminUser);
router.put('/users/:id/assign-plan', assignUserPlan);

// Pricing plans CRUD endpoints
router.get('/plans', getAdminPlans);
router.post('/plans', createAdminPlan);
router.put('/plans/:id', updateAdminPlan);
router.delete('/plans/:id', deleteAdminPlan);

export default router;
