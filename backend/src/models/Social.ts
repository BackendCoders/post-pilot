import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISocial {
  insta_auth_token?: string | null;
  meta_auth_token?: string | null;
  linedin_auth_token?: string | null;
  titkok_auth_token?: string | null;
  user: Types.ObjectId | string;
}

export interface ISocialDocument extends ISocial, Document {}

const socialSchema = new Schema<ISocialDocument>(
  {
    insta_auth_token: { type: String, trim: true, default: null },
    meta_auth_token: { type: String, trim: true, default: null },
    linedin_auth_token: { type: String, trim: true, default: null },
    titkok_auth_token: { type: String, trim: true, default: null },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

socialSchema.index({ user: 1 });

const Social = mongoose.model<ISocialDocument>('Social', socialSchema);

export default Social;
