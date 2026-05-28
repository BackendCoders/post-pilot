import { Request, Response, NextFunction } from 'express';
import Usage from '../models/Usage';
import User from '../models/User';
import PricingModel from '../models/PricingModel';

// Helper to get or create the current billing cycle usage
export const getOrCreateUsage = async (userId: string) => {
  const now = new Date();
  
  // Find usage document that covers the current date
  let usage = await Usage.findOne({
    userId,
    billingPeriodStart: { $lte: now },
    billingPeriodEnd: { $gte: now },
  });

  if (!usage) {
    // Create new billing cycle usage
    usage = new Usage({
      userId,
      billingPeriodStart: now,
      billingPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      seoWebpageAnalysisCount: 0,
      seoPageSpeedCount: 0,
      leadGenTemplatesCreated: 0,
      leadGenPagesScraped: 0,
      leadGenLeadsScraped: 0,
      leadGenSystemTemplatesUpdated: 0,
    });
    await usage.save();
  }

  return usage;
};

// Helper to get the user's current pricing plan
export const getUserPricingModel = async (userId: string) => {
  const user = await User.findById(userId).populate('pricingModel');
  if (!user || !user.pricingModel) {
    // Fallback to default Free plan if not set
    const defaultPlan = await PricingModel.findOne({ isDefault: true });
    return defaultPlan;
  }
  return user.pricingModel;
};

// 1. Check SEO webpage analysis limits
export const checkSeoLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (!plan) {
      return next(); // If no plan configured, pass through
    }

    const usage = await getOrCreateUsage(userId);
    const limit = plan.metrics.webpageAnalysisLimit || 0;

    // Check if limit is reached
    if (usage.seoWebpageAnalysisCount >= limit) {
      res.status(403).json({
        success: false,
        error: `Limit reached: Your plan allows up to ${limit} SEO webpage analyses. Please upgrade your plan to analyze more.`,
      });
      return;
    }

    // Check features: page speed calculation
    if (req.body.includePageSpeed && !plan.metrics.pageSpeedAndLoadtime) {
      res.status(403).json({
        success: false,
        error: 'Page speed and loadtime calculations are not available on your current plan. Please upgrade.',
      });
      return;
    }

    // Track usage inside request context to increment on successful scan
    (req as any).currentUsageDoc = usage;
    next();
  } catch (error) {
    next(error);
  }
};

// Increment SEO usage counter
export const incrementSeoUsage = async (userId: string, count: number = 1) => {
  try {
    const usage = await getOrCreateUsage(userId);
    usage.seoWebpageAnalysisCount += count;
    await usage.save();
  } catch (error) {
    console.error('Failed to increment SEO usage:', error);
  }
};

// 2. Check Lead Generation Scrape Limits
export const checkLeadGenScrapeLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (!plan) {
      return next();
    }

    const usage = await getOrCreateUsage(userId);
    const limit = plan.metrics.pageScrapeLimit || 0;

    if (usage.leadGenPagesScraped >= limit) {
      res.status(403).json({
        success: false,
        error: `Limit reached: Your plan allows up to ${limit} page scrapes per billing cycle. Please upgrade your plan.`,
      });
      return;
    }

    (req as any).userPlan = plan;
    (req as any).currentUsageDoc = usage;
    next();
  } catch (error) {
    next(error);
  }
};

// Increment Lead Gen usage counter
export const incrementLeadGenScrape = async (userId: string, leadsCount: number = 0) => {
  try {
    const usage = await getOrCreateUsage(userId);
    usage.leadGenPagesScraped += 1;
    usage.leadGenLeadsScraped += leadsCount;
    await usage.save();
  } catch (error) {
    console.error('Failed to increment Lead Gen Scrape usage:', error);
  }
};

// 3. Check Message template limits
export const checkTemplateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (!plan) {
      return next();
    }

    // Count templates for this user in DB
    const templateModel = require('../modules/LeadGeneration/model/messageTemplate.model').default;
    const templateCount = await templateModel.countDocuments({ user: userId });

    const limit = plan.metrics.messageTemplateCreationLimit || 0;
    if (templateCount >= limit) {
      res.status(403).json({
        success: false,
        error: `Limit reached: Your plan allows up to ${limit} custom message templates. Please delete some or upgrade your plan.`,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 4. Check Message Portal Access
export const checkMessagePortalLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (plan && !plan.metrics.messagePortalAccess) {
      res.status(403).json({
        success: false,
        error: 'Message portal and inbox access is not available on your current plan. Please upgrade.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 5. Check SEO History (saved analysis) limit
export const checkSeoHistoryLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (!plan) {
      return next();
    }

    // Check if history tracking is enabled on the plan
    if (!plan.metrics.trackHistory) {
      res.status(403).json({
        success: false,
        error: 'Saving analysis history is not available on your current plan. Please upgrade.',
      });
      return;
    }

    // Check maxHistoryCount limit
    const limit = plan.metrics.maxHistoryCount || 0;
    if (limit > 0) {
      const SeoAnalysis = require('../modules/SEO/models/SeoAnalysis').default;
      const currentCount = await SeoAnalysis.countDocuments({ user: userId, deletedAt: { $exists: false } });
      if (currentCount >= limit) {
        res.status(403).json({
          success: false,
          error: `Limit reached: Your plan allows up to ${limit} saved analysis history items. Please delete some or upgrade your plan.`,
        });
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 6. Check SEO Download Report access
export const checkSeoDownloadReportLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (plan && !plan.metrics.downloadReport) {
      res.status(403).json({
        success: false,
        error: 'Downloading/emailing SEO reports is not available on your current plan. Please upgrade.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 7. Check AI Fix Suggestion access
export const checkAiFixSuggestionAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (plan && !plan.metrics.aiFixSuggestion) {
      res.status(403).json({
        success: false,
        error: 'AI fix suggestions are not available on your current plan. Please upgrade.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 8. Check Bulk SEO limit (pre-validate batch + current <= limit)
export const checkBulkSeoLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (!plan) {
      return next();
    }

    const usage = await getOrCreateUsage(userId);
    const limit = plan.metrics.webpageAnalysisLimit || 0;
    const batchSize = Array.isArray(req.body.urls) ? req.body.urls.length : 0;

    // Check if adding this batch would exceed the limit
    if (usage.seoWebpageAnalysisCount + batchSize > limit) {
      const remaining = Math.max(0, limit - usage.seoWebpageAnalysisCount);
      res.status(403).json({
        success: false,
        error: `Limit exceeded: Your plan allows ${limit} SEO webpage analyses. You have used ${usage.seoWebpageAnalysisCount} and are trying to analyze ${batchSize} more. You have ${remaining} remaining.`,
      });
      return;
    }

    // Check features: page speed calculation
    if (req.body.includePageSpeed && !plan.metrics.pageSpeedAndLoadtime) {
      res.status(403).json({
        success: false,
        error: 'Page speed and loadtime calculations are not available on your current plan. Please upgrade.',
      });
      return;
    }

    (req as any).currentUsageDoc = usage;
    next();
  } catch (error) {
    next(error);
  }
};

// 9. Check Report Export Feature access (Lead Gen)
export const checkReportExportLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (plan && !plan.metrics.reportExportFeature) {
      res.status(403).json({
        success: false,
        error: 'Report export feature is not available on your current plan. Please upgrade.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 10. Check Bulk Lead Create limit (totalLeadInOneExecutionLimit)
export const checkBulkLeadCreateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (!plan) {
      return next();
    }

    const limit = plan.metrics.totalLeadInOneExecutionLimit || 0;
    const leadsCount = Array.isArray(req.body.leads) ? req.body.leads.length : 0;

    if (limit > 0 && leadsCount > limit) {
      res.status(403).json({
        success: false,
        error: `Limit exceeded: Your plan allows up to ${limit} leads per bulk operation. You are trying to save ${leadsCount} leads.`,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 11. Check System Template Update access
export const checkSystemTemplateUpdateAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const plan = await getUserPricingModel(userId);
    if (plan && !plan.metrics.systemMessageTemplateUpdateLimit) {
      res.status(403).json({
        success: false,
        error: 'Updating system message templates is not available on your current plan. Please upgrade.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
