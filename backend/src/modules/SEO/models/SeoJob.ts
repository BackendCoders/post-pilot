import mongoose, { Schema, Document } from 'mongoose';
import { ScrapedPageData } from '../../../types';

export interface ISeoJob extends Document {
  user: mongoose.Types.ObjectId;
  requestedUrl: string;
  urls: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalUrls: number;
  processedUrls: number;
  results: ScrapedPageData[];
  error?: string;
  analysisId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const seoJobSchema = new Schema<ISeoJob>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedUrl: {
      type: String,
      required: true,
    },
    urls: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    progress: {
      type: Number,
      default: 0,
    },
    totalUrls: {
      type: Number,
      default: 0,
    },
    processedUrls: {
      type: Number,
      default: 0,
    },
    results: {
      type: [Schema.Types.Mixed],
      default: [],
    } as any,
    error: {
      type: String,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'SeoAnalysis',
    },
  },
  {
    timestamps: true,
  }
);

seoJobSchema.index({ user: 1, createdAt: -1 });

export const SeoJob = mongoose.model<ISeoJob>('SeoJob', seoJobSchema);

export default SeoJob;
