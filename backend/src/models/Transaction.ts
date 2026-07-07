import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit' | 'refund' | 'cashback';
  amount: number;
  description: string;
  referenceId?: string;
  referenceType?: 'ride' | 'food_order' | 'parcel' | 'wallet_recharge' | 'withdrawal' | 'cashback';
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    type: { type: String, enum: ['credit', 'debit', 'refund', 'cashback'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: String,
    referenceType: {
      type: String,
      enum: ['ride', 'food_order', 'parcel', 'wallet_recharge', 'withdrawal', 'cashback'],
    },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    razorpayPaymentId: String,
  },
  { timestamps: true },
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
