import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicleFareConfig {
  vehicleType: string;
  alias: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  cancellationFee: number;
  waitingChargePerMin: number;
  nightMultiplier: number;
  maxDistanceKm: number; // 0 = unlimited
  capacity: number;
  avgSpeedKmh: number;
  isActive: boolean;
}

export interface IPeakHourConfig {
  label: string;
  startHour: number;
  endHour: number;
  multiplier: number;
  daysOfWeek: number[]; // 0=Sun … 6=Sat; empty = every day
}

export interface IFareConfig extends Document {
  serviceArea: string;
  currency: string;
  vehicles: IVehicleFareConfig[];
  peakHours: IPeakHourConfig[];
  nightChargeStartHour: number;
  nightChargeEndHour: number;
  baseWeatherMultiplier: number;
  baseTrafficMultiplier: number;
  maxSurgeMultiplier: number;
  platformFeePercent: number;
  gstPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleFareConfigSchema = new Schema<IVehicleFareConfig>(
  {
    vehicleType:        { type: String, required: true },
    alias:              { type: String, required: true },
    baseFare:           { type: Number, required: true },
    perKmRate:          { type: Number, required: true },
    perMinuteRate:      { type: Number, default: 0 },
    minimumFare:        { type: Number, required: true },
    cancellationFee:    { type: Number, default: 0 },
    waitingChargePerMin:{ type: Number, default: 0 },
    nightMultiplier:    { type: Number, default: 1.25 },
    maxDistanceKm:      { type: Number, default: 0 },
    capacity:           { type: Number, default: 4 },
    avgSpeedKmh:        { type: Number, default: 22 },
    isActive:           { type: Boolean, default: true },
  },
  { _id: false },
);

const PeakHourConfigSchema = new Schema<IPeakHourConfig>(
  {
    label:       { type: String, required: true },
    startHour:   { type: Number, required: true, min: 0, max: 23 },
    endHour:     { type: Number, required: true, min: 0, max: 23 },
    multiplier:  { type: Number, required: true, min: 1 },
    daysOfWeek:  { type: [Number], default: [] },
  },
  { _id: false },
);

const FareConfigSchema = new Schema<IFareConfig>(
  {
    serviceArea:          { type: String, default: 'default', unique: true, index: true },
    currency:             { type: String, default: 'INR' },
    vehicles:             { type: [VehicleFareConfigSchema], required: true },
    peakHours:            { type: [PeakHourConfigSchema], default: [] },
    nightChargeStartHour: { type: Number, default: 22 },
    nightChargeEndHour:   { type: Number, default: 6 },
    baseWeatherMultiplier:{ type: Number, default: 1.0 },
    baseTrafficMultiplier:{ type: Number, default: 1.0 },
    maxSurgeMultiplier:   { type: Number, default: 3.0 },
    platformFeePercent:   { type: Number, default: 0 },
    gstPercent:           { type: Number, default: 0 },
    isActive:             { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const FareConfig = mongoose.model<IFareConfig>('FareConfig', FareConfigSchema);
