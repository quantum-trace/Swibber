import mongoose, { Document, Schema } from 'mongoose';
import { VehicleType, VehicleTypeEnum } from '../types/enums';

export interface IDriver extends Document {
  firebaseUid: string;
  phone: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  fcmToken?: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleModel: string;
  licenseNumber: string;
  rating: number;
  totalRatings: number;
  totalRides: number;
  isOnline: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  currentLocation: { lat: number; lng: number } | null;
  earnings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    firebaseUid:   { type: String, required: true, unique: true, index: true },
    phone:         { type: String, required: true, unique: true },
    name:          { type: String, required: true },
    email:         String,
    avatarUrl:     String,
    fcmToken:      String,
    vehicleType:   { type: String, enum: Object.values(VehicleTypeEnum), required: true },
    vehicleNumber: { type: String, required: true },
    vehicleModel:  { type: String, required: true },
    licenseNumber: { type: String, required: true },
    rating:        { type: Number, default: 5.0, min: 1, max: 5 },
    totalRatings:  { type: Number, default: 0 },
    totalRides:    { type: Number, default: 0 },
    isOnline:      { type: Boolean, default: false },
    isAvailable:   { type: Boolean, default: false },
    isVerified:    { type: Boolean, default: false },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    earnings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

DriverSchema.index({ currentLocation: '2dsphere' });

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
