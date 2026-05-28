import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';
import PricingModel from '../models/PricingModel';
import Usage from '../models/Usage';
import { getOrCreateUsage } from '../middleware/usageTracker';
import { IApiResponse } from '../types/index';

// 1. GET /api/admin/users - Get all users with plans and usage
export const getAdminUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const defaultPlan = await PricingModel.findOne({ isDefault: true });
    const users = await User.find({}).populate('pricingModel').sort({ createdAt: -1 });
    
    // Map each user and fetch/attach their current month usage
    const usersWithUsage = await Promise.all(
      users.map(async (user) => {
        const leaseExpired = !!(user.leaseUntil && new Date() > user.leaseUntil);
        const effectivePricingModel = (leaseExpired || !user.pricingModel)
          ? defaultPlan
          : user.pricingModel;

        const usage = await getOrCreateUsage(user._id.toString());
        return {
          id: user._id,
          userName: user.userName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          phoneNumber: user.phoneNumber,
          companyName: user.companyName,
          companySize: user.companySize,
          jobTitle: user.jobTitle,
          website: user.website,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          pricingModel: effectivePricingModel,
          leaseUntil: leaseExpired ? undefined : user.leaseUntil,
          usage: {
            seoWebpageAnalysisCount: usage.seoWebpageAnalysisCount,
            seoPageSpeedCount: usage.seoPageSpeedCount,
            leadGenTemplatesCreated: usage.leadGenTemplatesCreated,
            leadGenPagesScraped: usage.leadGenPagesScraped,
            leadGenLeadsScraped: usage.leadGenLeadsScraped,
            billingPeriodStart: usage.billingPeriodStart,
            billingPeriodEnd: usage.billingPeriodEnd,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithUsage,
    });
  }
);

// 2. PUT /api/admin/users/:id - Edit any user
export const updateAdminUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { userName, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (userName !== undefined) user.userName = userName;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  }
);

// 3. PUT /api/admin/users/:id/assign-plan - Manually assign pricing model
export const assignUserPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { pricingModelId, isLease, leaseUntil } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (pricingModelId) {
      const plan = await PricingModel.findById(pricingModelId);
      if (!plan) {
        res.status(404).json({ success: false, error: 'Pricing plan not found' });
        return;
      }
      user.pricingModel = plan._id;
    } else {
      user.pricingModel = undefined;
    }

    if (isLease) {
      user.leaseUntil = leaseUntil ? new Date(leaseUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      user.leaseUntil = undefined;
    }

    await user.save();

    const populatedUser = await User.findById(id).populate('pricingModel');

    res.status(200).json({
      success: true,
      message: 'Subscription plan assigned successfully',
      data: populatedUser,
    });
  }
);

// 4. GET /api/admin/plans - List all plans
export const getAdminPlans = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const plans = await PricingModel.find({}).sort({ price: 1 });
    res.status(200).json({
      success: true,
      data: plans,
    });
  }
);

// 5. POST /api/admin/plans - Create a plan
export const createAdminPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, price, interval, isDefault, isLease, metrics } = req.body;

    const existingPlan = await PricingModel.findOne({ name });
    if (existingPlan) {
      res.status(409).json({ success: false, error: 'Plan name already exists' });
      return;
    }

    const plan = new PricingModel({
      name,
      price,
      interval: interval || 'month',
      isDefault: isDefault || false,
      isLease: isLease || false,
      metrics: {
        webpageAnalysisLimit: metrics?.webpageAnalysisLimit || 0,
        downloadReport: metrics?.downloadReport || false,
        trackHistory: metrics?.trackHistory || false,
        maxHistoryCount: metrics?.maxHistoryCount || 0,
        pageSpeedAndLoadtime: metrics?.pageSpeedAndLoadtime || false,
        aiFixSuggestion: metrics?.aiFixSuggestion || false,
        whatsappIntegration: metrics?.whatsappIntegration || false,
        
        messageTemplateCreationLimit: metrics?.messageTemplateCreationLimit || 0,
        systemMessageTemplateUpdateLimit: metrics?.systemMessageTemplateUpdateLimit || false,
        messageTemplateAccessLimit: metrics?.messageTemplateAccessLimit || false,
        messagePortalAccess: metrics?.messagePortalAccess || false,
        pageScrapeLimit: metrics?.pageScrapeLimit || 0,
        totalLeadInOneExecutionLimit: metrics?.totalLeadInOneExecutionLimit || 0,
        reportExportFeature: metrics?.reportExportFeature || false,
      },
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan,
    });
  }
);

// 6. PUT /api/admin/plans/:id - Update a plan
export const updateAdminPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, price, interval, isDefault, isLease, metrics } = req.body;

    const plan = await PricingModel.findById(id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Pricing plan not found' });
      return;
    }

    if (name !== undefined) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (interval !== undefined) plan.interval = interval;
    if (isDefault !== undefined) plan.isDefault = isDefault;
    if (isLease !== undefined) plan.isLease = isLease;
    
    if (metrics !== undefined) {
      plan.metrics = {
        webpageAnalysisLimit: metrics?.webpageAnalysisLimit !== undefined ? metrics.webpageAnalysisLimit : plan.metrics.webpageAnalysisLimit,
        downloadReport: metrics?.downloadReport !== undefined ? metrics.downloadReport : plan.metrics.downloadReport,
        trackHistory: metrics?.trackHistory !== undefined ? metrics.trackHistory : plan.metrics.trackHistory,
        maxHistoryCount: metrics?.maxHistoryCount !== undefined ? metrics.maxHistoryCount : plan.metrics.maxHistoryCount,
        pageSpeedAndLoadtime: metrics?.pageSpeedAndLoadtime !== undefined ? metrics.pageSpeedAndLoadtime : plan.metrics.pageSpeedAndLoadtime,
        aiFixSuggestion: metrics?.aiFixSuggestion !== undefined ? metrics.aiFixSuggestion : plan.metrics.aiFixSuggestion,
        whatsappIntegration: metrics?.whatsappIntegration !== undefined ? metrics.whatsappIntegration : plan.metrics.whatsappIntegration,
        
        messageTemplateCreationLimit: metrics?.messageTemplateCreationLimit !== undefined ? metrics.messageTemplateCreationLimit : plan.metrics.messageTemplateCreationLimit,
        systemMessageTemplateUpdateLimit: metrics?.systemMessageTemplateUpdateLimit !== undefined ? metrics.systemMessageTemplateUpdateLimit : plan.metrics.systemMessageTemplateUpdateLimit,
        messageTemplateAccessLimit: metrics?.messageTemplateAccessLimit !== undefined ? metrics.messageTemplateAccessLimit : plan.metrics.messageTemplateAccessLimit,
        messagePortalAccess: metrics?.messagePortalAccess !== undefined ? metrics.messagePortalAccess : plan.metrics.messagePortalAccess,
        pageScrapeLimit: metrics?.pageScrapeLimit !== undefined ? metrics.pageScrapeLimit : plan.metrics.pageScrapeLimit,
        totalLeadInOneExecutionLimit: metrics?.totalLeadInOneExecutionLimit !== undefined ? metrics.totalLeadInOneExecutionLimit : plan.metrics.totalLeadInOneExecutionLimit,
        reportExportFeature: metrics?.reportExportFeature !== undefined ? metrics.reportExportFeature : plan.metrics.reportExportFeature,
      };
    }

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Pricing plan updated successfully',
      data: plan,
    });
  }
);

// 7. DELETE /api/admin/plans/:id - Delete a plan
export const deleteAdminPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const plan = await PricingModel.findById(id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Pricing plan not found' });
      return;
    }

    if (plan.isDefault || plan.isLease) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete the default or lease plan. Please designate another plan first.',
      });
      return;
    }

    await PricingModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Pricing plan deleted successfully',
    });
  }
);
