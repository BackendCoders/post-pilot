import { Router } from 'express';
import { createSubmission, getMySubmissions } from '../controllers/supportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createSubmission);
router.get('/my', getMySubmissions);

export default router;
