import mongoose, { Schema, Types } from 'mongoose';

interface IMessageTemplate {
  user?: Types.ObjectId | null;
  title: string;
  description?: string;
  content: string;
  isGlobal?: boolean;
  baseTemplate?: Types.ObjectId | null;
  slug?: string | null;
}

const TemplateSchema = new Schema<IMessageTemplate>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function (this: IMessageTemplate) {
        return !this.isGlobal;
      },
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    baseTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'MessageTemplate',
      default: null,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      default: null,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

const MessageTemplate = mongoose.model<IMessageTemplate>(
  'MessageTemplate',
  TemplateSchema
);

export default MessageTemplate;
