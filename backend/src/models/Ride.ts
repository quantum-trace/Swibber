import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';
import {
  VehicleType, VehicleTypeEnum,
  RideStatus,   RideStatusEnum,
  PaymentMethod, PaymentMethodEnum,
  PaymentStatus, PaymentStatusEnum,
  CancelledBy,  CancelledByEnum,
} from '../types/enums';

export type HistoryActor = 'system' | 'user' | 'driver' | 'restaurant' | 'rider';

export interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
  actor: HistoryActor;
}

export interface IRide extends Document {
  trackingId: string;
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  vehicleType: VehicleType;
  pickupAddress: string;
  destinationAddress: string;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  fare: number;
  surgeMultiplier: number;
  distanceKm: number;
  durationMin: number;
  status: RideStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  otp: string;
  rating?: number;
  ratingFeedback?: string;
  tip?: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancellationReason?: string;
  cancellationNote?: string;
  cancelledBy?: CancelledBy;
  cancelledAt?: Date;
  cancellationFee: number;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new Schema<IRide>(
  {
    trackingId: {
      type:    String,
      unique:  true,
      sparse:  true,  // excludes existing null docs from the unique index during migration
      default: () => `RID${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    },
    userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    driverId:           { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
    vehicleType:        { type: String, enum: Object.values(VehicleTypeEnum), required: true },
    pickupAddress:      { type: String, required: true },
    destinationAddress: { type: String, required: true },
    pickup:      { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    destination: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    fare:            { type: Number, required: true },
    surgeMultiplier: { type: Number, default: 1.0 },
    distanceKm:      { type: Number, required: true },
    durationMin:     { type: Number, required: true },
    status: {
      type:    String,
      enum:    Object.values(RideStatusEnum),
      default: RideStatusEnum.SEARCHING,
    },
    paymentMethod: { type: String, enum: Object.values(PaymentMethodEnum), required: true },
    paymentStatus: {
      type:    String,
      enum:    Object.values(PaymentStatusEnum),
      default: PaymentStatusEnum.PENDING,
    },
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    otp:               { type: String, required: true },
    rating:            { type: Number, min: 1, max: 5 },
    ratingFeedback:    String,
    tip:               { type: Number, default: 0 },
    scheduledAt:       Date,
    startedAt:         Date,
    completedAt:       Date,
    cancellationReason: {
      type: String,
      enum: ['user_cancelled', 'driver_cancelled', 'driver_not_found', 'timeout', 'payment_failed', 'system_cancelled', 'other'],
    },
    cancellationNote: { type: String },
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

export const Ride = mongoose.model<IRide>('Ride', RideSchema);
