import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPricingMetrics {
  // SEO Metrics
  webpageAnalysisLimit: number;
  downloadReport: boolean;
  trackHistory: boolean;
  maxHistoryCount: number;
  pageSpeedAndLoadtime: boolean;
  aiFixSuggestion: boolean;
  whatsappIntegration: boolean;

  // Lead Generation Metrics
  messageTemplateCreationLimit: number;
  systemMessageTemplateUpdateLimit: boolean;
  messageTemplateAccessLimit: boolean;
  messagePortalAccess: boolean;
  pageScrapeLimit: number;
  totalLeadInOneExecutionLimit: number;
  reportExportFeature: boolean;
}

export interface IPricingModel {
  name: string;
  price: number;
  interval: 'month' | 'year';
  isDefault: boolean;
  isLease: boolean;
  metrics: IPricingMetrics;
}

export interface IPricingModelDocument extends IPricingModel, Document {}

const pricingModelSchema = new Schema<IPricingModelDocument>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      default: 0,
    },
    interval: {
      type: String,
      enum: ['month', 'year'],
      default: 'month',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isLease: {
      type: Boolean,
      default: false,
    },
    metrics: {
      webpageAnalysisLimit: { type: Number, default: 0 },
      downloadReport: { type: Boolean, default: false },
      trackHistory: { type: Boolean, default: false },
      maxHistoryCount: { type: Number, default: 0 },
      pageSpeedAndLoadtime: { type: Boolean, default: false },
      aiFixSuggestion: { type: Boolean, default: false },
      whatsappIntegration: { type: Boolean, default: false },

      messageTemplateCreationLimit: { type: Number, default: 0 },
      systemMessageTemplateUpdateLimit: { type: Boolean, default: false },
      messageTemplateAccessLimit: { type: Boolean, default: false },
      messagePortalAccess: { type: Boolean, default: false },
      pageScrapeLimit: { type: Number, default: 0 },
      totalLeadInOneExecutionLimit: { type: Number, default: 0 },
      reportExportFeature: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure there is only one default and one lease plan at any time
pricingModelSchema.pre('save', async function (next) {
  const self = this as any;
  if (self.isDefault) {
    await mongoose.model('PricingModel').updateMany({ _id: { $ne: self._id } }, { isDefault: false });
  }
  if (self.isLease) {
    await mongoose.model('PricingModel').updateMany({ _id: { $ne: self._id } }, { isLease: false });
  }
  next();
});

const PricingModel: Model<IPricingModelDocument> = mongoose.model<IPricingModelDocument>(
  'PricingModel',
  pricingModelSchema
);

export default PricingModel;
