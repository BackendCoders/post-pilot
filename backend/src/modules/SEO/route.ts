import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware';
import {
  countSeoPages,
  scrapeSeoBulkUrls,
  scrapeSeoTarget,
} from './controller';
import seoAnalysisRoutes from './routes/seoAnalysis.route';

const router = Router();

const scrapeSeoSchema = z.object({
  body: z.object({
    url: z.string().min(1, 'URL is required'),
    mode: z.enum(['auto', 'page', 'site']).optional(),
    fullSite: z.boolean().optional(),
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

router.post('/scrape', validateRequest(scrapeSeoSchema), scrapeSeoTarget);
router.post(
  '/count-pages',
  validateRequest(countSeoPagesSchema),
  countSeoPages
);
router.post('/bulk-scrape', validateRequest(scrapeSeoBulkSchema), scrapeSeoBulkUrls);

router.use('/analysis', seoAnalysisRoutes);

export default router;
