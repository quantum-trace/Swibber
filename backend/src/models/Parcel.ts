import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';
import {
  ParcelStatus,  ParcelStatusEnum,
  PackageType,   PackageTypeEnum,
  PaymentMethod, PaymentMethodEnum,
  PaymentStatus, PaymentStatusEnum,
  CancelledBy,   CancelledByEnum,
} from '../types/enums';

export interface IParcel extends Document {
  trackingCode: string;
  userId: mongoose.Types.ObjectId;
  riderId?: mongoose.Types.ObjectId;
  pickupAddress: string;
  dropAddress: string;
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  packageType: PackageType;
  weightKg: number;
  isFragile: boolean;
  receiverName: string;
  receiverPhone: string;
  notes?: string;
  fare: number;
  distanceKm: number;
  durationMin: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: ParcelStatus;
  deliveryOtp: string;
  rating?: number;
  ratingFeedback?: string;
  scheduledAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  cancelledAt?: Date;
  cancellationFee: number;
  statusHistory: Array<{ status: string; timestamp: Date; note?: string; actor: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const ParcelSchema = new Schema<IParcel>(
  {
    trackingCode: {
      type:    String,
      unique:  true,
      default: () => 'PCL-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    },
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    riderId:       { type: Schema.Types.ObjectId, ref: 'Driver' },
    pickupAddress: { type: String, required: true },
    dropAddress:   { type: String, required: true },
    pickup: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    drop:   { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    packageType:   { type: String, enum: Object.values(PackageTypeEnum), required: true },
    weightKg:      { type: Number, required: true },
    isFragile:     { type: Boolean, default: false },
    receiverName:  { type: String, required: true },
    receiverPhone: { type: String, required: true },
    notes:         String,
    fare:          { type: Number, required: true },
    distanceKm:    { type: Number, required: true },
    durationMin:   { type: Number, required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethodEnum), required: true },
    paymentStatus: {
      type:    String,
      enum:    Object.values(PaymentStatusEnum),
      default: PaymentStatusEnum.PENDING,
    },
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    status: {
      type:    String,
      enum:    Object.values(ParcelStatusEnum),
      default: ParcelStatusEnum.SEARCHING_RIDER,
    },
    deliveryOtp:        { type: String, required: true },
    rating:             { type: Number, min: 1, max: 5 },
    ratingFeedback:     String,
    scheduledAt:        Date,
    pickedUpAt:         Date,
    deliveredAt:        Date,
    cancellationReason: {
      type: String,
      enum: ['user_cancelled', 'driver_cancelled', 'driver_not_found', 'timeout', 'payment_failed', 'system_cancelled', 'other'],
    },
    cancelledBy:    { type: String, enum: Object.values(CancelledByEnum) },
    cancelledAt:    Date,
    cancellationFee: { type: Number, default: 0 },
    statusHistory: [
      {
        status:    { type: String, required: true },
        timestamp: { type: Date, default: () => new Date() },
        note:      String,
        actor:     { type: String, enum: ['system', 'user', 'driver', 'restaurant', 'rider'], default: 'system' },
      },
    ],
  },
  { timestamps: true },
);

export const Parcel = mongoose.model<IParcel>('Parcel', ParcelSchema);
