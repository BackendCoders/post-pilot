import { Router } from 'express';
import leadRoutes from './route/lead.routes';
import leadCategoryRoutes from './route/leadCategory.route';
import messageTemplateRoutes from './route/messageTemplate.routes';

const router = Router();

router.use('/category', leadCategoryRoutes);
router.use('/template', messageTemplateRoutes);
router.use('/', leadRoutes);

export default router;
