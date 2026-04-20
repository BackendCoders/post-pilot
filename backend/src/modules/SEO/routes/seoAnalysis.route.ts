import { Router } from 'express';
import { authenticate } from '../../../middleware';
import {
  saveAnalysis,
  updatePageAnalysis,
  getAnalysisHistory,
  getPageAnalysisHistory,
  getPageAnalysisCount,
  getUserSeoStats,
  getAnalysisById,
  softDeleteAnalysis,
  restoreAnalysis,
  hardDeleteAnalysis,
  getDeletedAnalyses,
} from '../controller/seoAnalysis.controller';

const router = Router();

router.use(authenticate);

router.post('/', saveAnalysis);
router.post('/page', updatePageAnalysis);
router.get('/history', getAnalysisHistory);
router.get('/history/deleted', getDeletedAnalyses);
router.get('/history/page/:url', getPageAnalysisHistory);
router.get('/count', getPageAnalysisCount);
router.get('/stats', getUserSeoStats);
router.get('/:id', getAnalysisById);
router.delete('/:id', softDeleteAnalysis);
router.post('/:id/restore', restoreAnalysis);
router.delete('/:id/permanent', hardDeleteAnalysis);

export default router;
