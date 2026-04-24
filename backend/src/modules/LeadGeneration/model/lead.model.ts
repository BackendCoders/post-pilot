import mongoose, { Schema, Types } from 'mongoose';

export const LEAD_STATUSES = [
  'new',
  'saved',
  'processed',
  'converted',
  'rejected',
] as const;

export interface ILead {
  user: Types.ObjectId;
  leadCategory: Types.ObjectId;
  position?: number;
  phone?: string;
  website?: string;
  thumbnailUrl?: string;
  title?: string;
  address?: string;
  publicId?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  email?: string;
  googleMapUrl?: string;
  note?: string;
  status: (typeof LEAD_STATUSES)[number];
  createdAt?: Date;
  updatedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leadCategory: {
      type: Schema.Types.ObjectId,
      ref: 'LeadCategory',
    },
    phone: String,
    website: String,
    thumbnailUrl: String,
    position: {
      type: Number,
      default: null,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    rating: {
      type: Number,
      default: null,
    },
    ratingCount: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
    publicId: String,
    googleMapUrl: {
      type: String,
      trim: true,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'saved',
      index: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ user: 1, status: 1, createdAt: -1 });

const Lead = mongoose.model<ILead>('Lead', leadSchema);

export default Lead;
