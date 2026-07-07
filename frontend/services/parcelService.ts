import { apiClient } from '../api/client';
import { Endpoints } from '../api/endpoints';
import type { PackageType, PaymentMethod } from '../constants/enums';

// ─── Estimate types ───────────────────────────────────────────────────────────

export interface ParcelFareBreakdown {
  baseFare: number;
  distanceFare: number;
  weightSurcharge: number;
  fragileSurcharge: number;
  expressUpcharge: number;
  peakUpcharge: number;
  multiStopUpcharge: number;
  subtotal: number;
  platformFee: number;
  gst: number;
  totalFare: number;
  minimumFareApplied: boolean;
  distanceKm: number;
  weightKg: number;
  etaMin: number;
  isExpressPossible: boolean;
}

export interface ParcelVehicleOption {
  vehicleType: string;
  alias: string;
  fare: ParcelFareBreakdown;
  isCompatible: boolean;
  incompatibleReason?: string;
}

export interface ParcelEstimateRequest {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  weightKg: number;
  isFragile?: boolean;
  isExpress?: boolean;
  extraStops?: number;
  dimensionCm?: number;
}

export interface ParcelEstimateResponse {
  fareBreakdown: ParcelFareBreakdown;
  vehicleOptions: ParcelVehicleOption[];
  distanceKm: number;
  durationMin: number;
}

// ─── Create types ─────────────────────────────────────────────────────────────

export interface CreateParcelRequest {
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  packageType: PackageType;
  weightKg: number;
  isFragile: boolean;
  isExpress?: boolean;
  receiverName: string;
  receiverPhone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  scheduledAt?: string;
  vehicleType?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

interface Envelope<T> { success: boolean; data: T }

export const ParcelService = {
  async getEstimate(payload: ParcelEstimateRequest): Promise<ParcelEstimateResponse> {
    const { data } = await apiClient.post<Envelope<ParcelEstimateResponse>>(
      Endpoints.PARCEL.ESTIMATE,
      payload,
    );
    return data.data;
  },

  async createParcel(payload: CreateParcelRequest): Promise<{ parcelId: string }> {
    const { data } = await apiClient.post<Envelope<{ parcelId: string }>>(
      Endpoints.PARCEL.CREATE,
      payload,
    );
    return data.data;
  },

  async getStatus(parcelId: string): Promise<{
    status: string;
    riderLat?: number;
    riderLng?: number;
    heading?: number;
    speed?: number;
    eta?: number;
    pickupLat?: number;
    pickupLng?: number;
    dropLat?: number;
    dropLng?: number;
    rider?: {
      name?: string; phone?: string; vehicleType?: string;
      vehicleNumber?: string; vehicleModel?: string; rating?: number; avatarUrl?: string;
    };
  }> {
    const { data } = await apiClient.get(Endpoints.PARCEL.STATUS(parcelId));
    return data?.data ?? data;
  },

  async verifyOTP(parcelId: string, otp: string): Promise<{ verified: boolean }> {
    const { data } = await apiClient.post(Endpoints.PARCEL.VERIFY_OTP(parcelId), { otp });
    return data;
  },

  async cancelParcel(parcelId: string): Promise<void> {
    await apiClient.post(Endpoints.PARCEL.CANCEL(parcelId));
  },

  async rateParcel(parcelId: string, rating: number, feedback?: string): Promise<void> {
    await apiClient.post(Endpoints.PARCEL.RATE(parcelId), { rating, feedback });
  },

  async getHistory(page = 1): Promise<any[]> {
    const { data } = await apiClient.get(Endpoints.PARCEL.HISTORY, { params: { page } });
    return data?.data ?? data ?? [];
  },
};
