import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadMessage extends Document {
  user: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  phone: string;
  direction: 'outgoing' | 'incoming';
  content: string;
  contentType: 'text' | 'document' | 'image';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  whatsappMessageId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const LeadMessageSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    phone: { type: String, required: true },
    direction: { type: String, enum: ['outgoing', 'incoming'], required: true },
    content: { type: String, required: true },
    contentType: {
      type: String,
      enum: ['text', 'document', 'image'],
      default: 'text',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    whatsappMessageId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes for performance
LeadMessageSchema.index({ user: 1, lead: 1, createdAt: -1 });
LeadMessageSchema.index({ user: 1, phone: 1 });
LeadMessageSchema.index({ whatsappMessageId: 1 });

// Cleanup hook to maintain max 50 messages per lead conversation
LeadMessageSchema.post('save', async function (doc: any) {
  try {
    const LeadMessage = mongoose.model('LeadMessage');
    const count = await LeadMessage.countDocuments({ lead: doc.lead });
    if (count > 50) {
      const messagesToDelete = await LeadMessage.find({ lead: doc.lead })
        .sort({ createdAt: 1 })
        .limit(count - 50)
        .select('_id');
      
      const idsToDelete = messagesToDelete.map(m => m._id);
      await LeadMessage.deleteMany({ _id: { $in: idsToDelete } });
    }
  } catch (error) {
    console.error('Failed to cleanup LeadMessages:', error);
  }
});

export default mongoose.model<ILeadMessage>('LeadMessage', LeadMessageSchema);
