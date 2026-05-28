import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  pricingModelId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  paymentMethod: string;
  createdAt: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pricingModelId: {
      type: Schema.Types.ObjectId,
      ref: 'PricingModel',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      required: true,
      default: 'success',
    },
    paymentMethod: {
      type: String,
      default: 'Credit Card',
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransactionDocument> = mongoose.model<ITransactionDocument>(
  'Transaction',
  transactionSchema
);

export default Transaction;
