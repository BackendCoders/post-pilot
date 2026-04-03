import mongoose, { Schema, Types } from 'mongoose';

interface IMessageTemplate {
  user: Types.ObjectId;
  title: string;
  description?: string;
  content: string;
}

const TemplateSchema = new Schema<IMessageTemplate>(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const MessageTemplate = mongoose.model<IMessageTemplate>(
  'MessageTemplate',
  TemplateSchema
);

export default MessageTemplate;
