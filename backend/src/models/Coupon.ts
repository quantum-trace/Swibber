import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'flat';
  discount: number;
  maxDiscount?: number;
  minOrderAmount: number;
  applicableFor: 'food' | 'ride' | 'parcel' | 'all';
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    discount: { type: Number, required: true },
    maxDiscount: Number,
    minOrderAmount: { type: Number, default: 0 },
    applicableFor: { type: String, enum: ['food', 'ride', 'parcel', 'all'], default: 'all' },
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
