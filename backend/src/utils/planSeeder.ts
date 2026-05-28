import PricingModel from '../models/PricingModel';
import { logger } from './logger';

export const seedPricingModels = async (): Promise<void> => {
  try {
    const count = await PricingModel.countDocuments();
    if (count > 0) {
      logger.info('Pricing models already exist in database. Skipping seeding.');
      return;
    }

    logger.info('Seeding default pricing models...');

    const models = [
      {
        name: 'Free',
        price: 0,
        interval: 'month',
        isDefault: true,
        isLease: false,
        metrics: {
          webpageAnalysisLimit: 5,
          downloadReport: false,
          trackHistory: true,
          maxHistoryCount: 5,
          pageSpeedAndLoadtime: false,
          aiFixSuggestion: false,
          whatsappIntegration: false,

          messageTemplateCreationLimit: 3,
          systemMessageTemplateUpdateLimit: false,
          messageTemplateAccessLimit: false,
          messagePortalAccess: false,
          pageScrapeLimit: 1,
          totalLeadInOneExecutionLimit: 5,
          reportExportFeature: false,
        },
      },
      {
        name: 'Basic',
        price: 19,
        interval: 'month',
        isDefault: false,
        isLease: true, // New registered users fall to Basic lease for 1 month
        metrics: {
          webpageAnalysisLimit: 20,
          downloadReport: true,
          trackHistory: true,
          maxHistoryCount: 20,
          pageSpeedAndLoadtime: true,
          aiFixSuggestion: false,
          whatsappIntegration: true,

          messageTemplateCreationLimit: 10,
          systemMessageTemplateUpdateLimit: true,
          messageTemplateAccessLimit: true,
          messagePortalAccess: true,
          pageScrapeLimit: 10,
          totalLeadInOneExecutionLimit: 20,
          reportExportFeature: true,
        },
      },
      {
        name: 'Pro',
        price: 49,
        interval: 'month',
        isDefault: false,
        isLease: false,
        metrics: {
          webpageAnalysisLimit: 100,
          downloadReport: true,
          trackHistory: true,
          maxHistoryCount: 100,
          pageSpeedAndLoadtime: true,
          aiFixSuggestion: true,
          whatsappIntegration: true,

          messageTemplateCreationLimit: 50,
          systemMessageTemplateUpdateLimit: true,
          messageTemplateAccessLimit: true,
          messagePortalAccess: true,
          pageScrapeLimit: 50,
          totalLeadInOneExecutionLimit: 100,
          reportExportFeature: true,
        },
      },
    ];

    await PricingModel.insertMany(models);
    logger.info('Pricing models seeded successfully!');
  } catch (error) {
    logger.error('Failed to seed pricing models:', error);
  }
};
