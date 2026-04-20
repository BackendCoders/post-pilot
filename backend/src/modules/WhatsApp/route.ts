import { Router } from 'express';
import { authenticate } from '../../middleware';
import { startConnection, getStatus, logout, deleteSession, checkAuth, sendSingleMessage, sendBulkMessage, sendDocument } from './controller';

const router = Router();

router.use(authenticate);
router.post('/start', startConnection);
router.get('/status', getStatus);
router.post('/logout', logout);
router.delete('/session', deleteSession);

router.get('/check-auth', checkAuth);
router.post('/message/single', sendSingleMessage);
router.post('/message/bulk', sendBulkMessage);
router.post('/message/document', sendDocument);

export default router;
