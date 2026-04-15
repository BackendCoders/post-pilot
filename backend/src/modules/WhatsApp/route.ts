import { Router } from 'express';
import { authenticate } from '../../middleware';
import { getQRCode, getStatus, logout, deleteSession } from './controller';

const router = Router();

router.use(authenticate);

router.get('/qr', getQRCode);
router.get('/status', getStatus);
router.post('/logout', logout);
router.delete('/session', deleteSession);

export default router;
