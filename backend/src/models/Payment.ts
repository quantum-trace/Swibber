import mongoose, { Document, Schema } from 'mongoose';
import { PaymentStatusEnum, type PaymentStatus } from '../types/enums';

export type PaymentEntityType = 'ride' | 'food' | 'parcel' | 'wallet' | 'membership';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  entityType: PaymentEntityType;
  entityId: string;
  receipt: string;
  notes?: Record<string, string>;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId:              { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpayOrderId:     { type: String, required: true, unique: true, index: true },
    razorpayPaymentId:   { type: String, sparse: true },
    razorpaySignature:   { type: String },
    amount:              { type: Number, required: true },
    currency:            { type: String, default: 'INR' },
    status:              { type: String, enum: Object.values(PaymentStatusEnum), default: PaymentStatusEnum.PENDING },
    entityType:          { type: String, enum: (['ride', 'food', 'parcel', 'wallet', 'membership'] as PaymentEntityType[]), required: true },
    entityId:            { type: String, required: true },
    receipt:             { type: String, required: true },
    notes:               { type: Map, of: String },
    failureReason:       { type: String },
    refundId:            { type: String },
    refundAmount:        { type: Number },
  },
  { timestamps: true },
);

PaymentSchema.index({ entityType: 1, entityId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
