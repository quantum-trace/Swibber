import mongoose, { Document, Schema } from 'mongoose';

export interface IWeightTier {
  upToKg: number;
  surchargeFlat: number;
}

export interface IParcelVehicleConstraint {
  vehicleType: string;
  alias: string;
  maxWeightKg: number;
  maxDimensionCm: number; // max combined L+W+H, 0 = unlimited
  isActive: boolean;
}

export interface IParcelFareConfig extends Document {
  serviceArea: string;
  currency: string;
  baseFare: number;
  perKmRate: number;
  weightTiers: IWeightTier[];
  fragileSurcharge: number;
  expressMultiplier: number;
  peakMultiplier: number;
  peakStartHour: number;
  peakEndHour: number;
  multiStopSurchargePerStop: number;
  vehicles: IParcelVehicleConstraint[];
  minimumFare: number;
  platformFeePercent: number;
  gstPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WeightTierSchema = new Schema<IWeightTier>(
  {
    upToKg:        { type: Number, required: true },
    surchargeFlat: { type: Number, required: true },
  },
  { _id: false },
);

const ParcelVehicleConstraintSchema = new Schema<IParcelVehicleConstraint>(
  {
    vehicleType:    { type: String, required: true },
    alias:          { type: String, required: true },
    maxWeightKg:    { type: Number, required: true },
    maxDimensionCm: { type: Number, default: 0 },
    isActive:       { type: Boolean, default: true },
  },
  { _id: false },
);

const ParcelFareConfigSchema = new Schema<IParcelFareConfig>(
  {
    serviceArea:               { type: String, default: 'default', unique: true, index: true },
    currency:                  { type: String, default: 'INR' },
    baseFare:                  { type: Number, default: 40 },
    perKmRate:                 { type: Number, default: 10 },
    weightTiers:               { type: [WeightTierSchema], default: [] },
    fragileSurcharge:          { type: Number, default: 30 },
    expressMultiplier:         { type: Number, default: 1.5 },
    peakMultiplier:            { type: Number, default: 1.3 },
    peakStartHour:             { type: Number, default: 9 },
    peakEndHour:               { type: Number, default: 12 },
    multiStopSurchargePerStop: { type: Number, default: 20 },
    vehicles:                  { type: [ParcelVehicleConstraintSchema], required: true },
    minimumFare:               { type: Number, default: 40 },
    platformFeePercent:        { type: Number, default: 0 },
    gstPercent:                { type: Number, default: 0 },
    isActive:                  { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ParcelFareConfig = mongoose.model<IParcelFareConfig>('ParcelFareConfig', ParcelFareConfigSchema);
