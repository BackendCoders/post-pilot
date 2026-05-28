import { Router } from 'express';
import { z } from 'zod';
import { validateRequest, authenticate } from '../../middleware';
import { checkSeoLimit, checkBulkSeoLimit } from '../../middleware/usageTracker';
import {
  countSeoPages,
  scrapeSeoBulkUrls,
  scrapeSeoTarget,
  getSeoJobStatus,
} from './controller';
import seoAnalysisRoutes from './routes/seoAnalysis.route';

const router = Router();

const scrapeSeoSchema = z.object({
  body: z.object({
    url: z.string().min(1, 'URL is required'),
    mode: z.enum(['auto', 'page', 'site']).optional(),
    fullSite: z.boolean().optional(),
    includePageSpeed: z.boolean().optional(),
  }),
});

const countSeoPagesSchema = z.object({
  body: z.object({
    url: z.string().min(1, 'URL is required'),
  }),
});

const scrapeSeoBulkSchema = z.object({
  body: z.object({
    urls: z
      .array(z.string().min(1, 'Each URL is required'))
      .min(1, 'At least one URL is required'),
  }),
});

router.post('/scrape', authenticate, checkSeoLimit, validateRequest(scrapeSeoSchema), scrapeSeoTarget);
router.post(
  '/count-pages',
  authenticate,
  validateRequest(countSeoPagesSchema),
  countSeoPages
);
router.post('/bulk-scrape', authenticate, checkBulkSeoLimit, validateRequest(scrapeSeoBulkSchema), scrapeSeoBulkUrls);
router.get('/job/:id', authenticate, getSeoJobStatus);

router.use('/analysis', seoAnalysisRoutes);

export default router;
