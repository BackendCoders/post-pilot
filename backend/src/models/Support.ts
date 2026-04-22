import mongoose, { Schema, Document } from 'mongoose';

export interface ISupport extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'feedback' | 'error';
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  rating?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const supportSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['feedback', 'error'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering
supportSchema.index({ type: 1, status: 1 });
supportSchema.index({ userId: 1 });

const Support = mongoose.model<ISupport>('Support', supportSchema);

export default Support;
