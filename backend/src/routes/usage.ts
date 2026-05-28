import { Router } from 'express';
import { authenticate } from '../middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { getOrCreateUsage, getUserPricingModel } from '../middleware/usageTracker';

const router = Router();

router.use(authenticate);

// GET /api/usage/me - Get current user's plan, limits, and billing cycle usage
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    const usage = await getOrCreateUsage(userId);

    res.status(200).json({
      success: true,
      data: {
        plan: plan
          ? {
              id: plan._id,
              name: plan.name,
              price: plan.price,
              interval: plan.interval,
              isDefault: plan.isDefault,
              isLease: plan.isLease,
              metrics: plan.metrics,
            }
          : null,
        usage: {
          billingPeriodStart: usage.billingPeriodStart,
          billingPeriodEnd: usage.billingPeriodEnd,
          seoWebpageAnalysisCount: usage.seoWebpageAnalysisCount,
          seoPageSpeedCount: usage.seoPageSpeedCount,
          leadGenTemplatesCreated: usage.leadGenTemplatesCreated,
          leadGenPagesScraped: usage.leadGenPagesScraped,
          leadGenLeadsScraped: usage.leadGenLeadsScraped,
          leadGenSystemTemplatesUpdated: usage.leadGenSystemTemplatesUpdated,
        },
        limits: plan
          ? {
              seo: {
                webpageAnalysisLimit: plan.metrics.webpageAnalysisLimit,
                webpageAnalysisUsed: usage.seoWebpageAnalysisCount,
                webpageAnalysisRemaining: Math.max(
                  0,
                  (plan.metrics.webpageAnalysisLimit || 0) - usage.seoWebpageAnalysisCount
                ),
                downloadReport: plan.metrics.downloadReport,
                trackHistory: plan.metrics.trackHistory,
                maxHistoryCount: plan.metrics.maxHistoryCount,
                pageSpeedAndLoadtime: plan.metrics.pageSpeedAndLoadtime,
                aiFixSuggestion: plan.metrics.aiFixSuggestion,
                whatsappIntegration: plan.metrics.whatsappIntegration,
              },
              leadGen: {
                pageScrapeLimit: plan.metrics.pageScrapeLimit,
                pageScrapesUsed: usage.leadGenPagesScraped,
                pageScrapesRemaining: Math.max(
                  0,
                  (plan.metrics.pageScrapeLimit || 0) - usage.leadGenPagesScraped
                ),
                totalLeadInOneExecutionLimit: plan.metrics.totalLeadInOneExecutionLimit,
                messageTemplateCreationLimit: plan.metrics.messageTemplateCreationLimit,
                systemMessageTemplateUpdateLimit: plan.metrics.systemMessageTemplateUpdateLimit,
                messageTemplateAccessLimit: plan.metrics.messageTemplateAccessLimit,
                messagePortalAccess: plan.metrics.messagePortalAccess,
                reportExportFeature: plan.metrics.reportExportFeature,
              },
            }
          : null,
      },
    });
  })
);

export default router;
