import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUsage {
  userId: mongoose.Types.ObjectId;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  
  // SEO Usage
  seoWebpageAnalysisCount: number;
  seoPageSpeedCount: number;

  // Lead Gen Usage
  leadGenTemplatesCreated: number;
  leadGenPagesScraped: number;
  leadGenLeadsScraped: number;
  leadGenSystemTemplatesUpdated: number;
}

export interface IUsageDocument extends IUsage, Document {}

const usageSchema = new Schema<IUsageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    seoWebpageAnalysisCount: { type: Number, default: 0 },
    seoPageSpeedCount: { type: Number, default: 0 },
    
    leadGenTemplatesCreated: { type: Number, default: 0 },
    leadGenPagesScraped: { type: Number, default: 0 },
    leadGenLeadsScraped: { type: Number, default: 0 },
    leadGenSystemTemplatesUpdated: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

usageSchema.index({ userId: 1, billingPeriodStart: -1 });

const Usage: Model<IUsageDocument> = mongoose.model<IUsageDocument>('Usage', usageSchema);

export default Usage;
