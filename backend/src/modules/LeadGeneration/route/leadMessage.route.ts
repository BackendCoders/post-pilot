import { Router } from 'express';
import * as leadMessageController from '../controller/leadMessage.controller';
import { authenticate } from '../../../middleware/auth';
import { checkMessagePortalLimit } from '../../../middleware/usageTracker';

const router = Router();

router.use(authenticate);
router.use(checkMessagePortalLimit);

router.get('/', leadMessageController.getConversations);
router.get('/unread', leadMessageController.getUnreadCount);
router.get('/:leadId', leadMessageController.getThread);
router.post('/:leadId/reply', leadMessageController.sendReply);
router.patch('/:leadId/read', leadMessageController.markAsRead);

export default router;
