import mongoose, { Schema, Types } from 'mongoose';

export interface ILeadCategory {
  user: Types.ObjectId;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const leadCategorySchema = new Schema<ILeadCategory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

leadCategorySchema.index({ user: 1, title: 1 }, { unique: true });

const LeadCategoryModel = mongoose.model<ILeadCategory>(
  'LeadCategory',
  leadCategorySchema
);

export default LeadCategoryModel;
