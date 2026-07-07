import { apiClient } from '../api/client';
import { Endpoints } from '../api/endpoints';
import type { VehicleType, PaymentMethod, SurgeLevel } from '../constants/enums';

export interface RideEstimateRequest {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  weatherMultiplier?: number;
  trafficMultiplier?: number;
}

/** Matches the FareBreakdown returned by fare.engine.ts */
export interface FareBreakdown {
  vehicleType: VehicleType;
  alias: string;
  capacity: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingFare: number;
  nightChargeAmount: number;
  surgeAmount: number;
  surgeMultiplier: number;
  surgeLabel: string;
  surgeLevel: SurgeLevel;
  subtotal: number;
  platformFee: number;
  gst: number;
  totalFare: number;
  minimumFareApplied: boolean;
  cancellationFee: number;
  distanceKm: number;
  durationMin: number;
  etaMin: number;
  maxDistanceKm: number;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface RideEstimateResponse {
  estimates: FareBreakdown[];
  distanceKm: number;
  durationMin: number;
}

export interface CreateRideRequest {
  vehicleType: VehicleType;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  paymentMethod: PaymentMethod;
  scheduledAt?: string;
}

export interface CreateRideResponse {
  rideId: string;
  fare: number;
  fareBreakdown: FareBreakdown;
  razorpayOrderId?: string;
  status: string;
  otp: string;
}

export interface RideStatusResponse {
  rideId: string;
  status: string;
  otp?: string;
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    vehicleModel?: string;
    vehicleType?: string;
    rating: number;
    currentLocation?: { lat: number; lng: number };
    avatarUrl?: string;
  };
  eta?: number;
  fare?: number;
  fareBreakdown?: FareBreakdown;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const RideService = {
  async getEstimates(payload: RideEstimateRequest): Promise<RideEstimateResponse> {
    // Backend expects flat fields: pickupLat, pickupLng, destinationLat, destinationLng
    console.log('[RideService] getEstimates request', {
      pickupLat: payload.pickupLat,
      pickupLng: payload.pickupLng,
      destinationLat: payload.destinationLat,
      destinationLng: payload.destinationLng,
      weatherMultiplier: payload.weatherMultiplier,
      trafficMultiplier: payload.trafficMultiplier,
    });

    try {
      const { data } = await apiClient.post<ApiEnvelope<RideEstimateResponse>>(
        Endpoints.RIDE.ESTIMATE,
        payload,
      );
      console.log('[RideService] getEstimates response', {
        estimateCount: data.data?.estimates?.length ?? 0,
        distanceKm: data.data?.distanceKm,
        durationMin: data.data?.durationMin,
      });
      return data.data;
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ?? err?.response?.data?.details ?? err?.message ?? 'Fare estimate request failed';
      console.error('[RideService] getEstimates error', {
        status: err?.response?.status,
        message: serverMessage,
        payload,
      });
      throw new Error(serverMessage);
    }
  },

  async createRide(payload: CreateRideRequest): Promise<CreateRideResponse> {
    const { data } = await apiClient.post<ApiEnvelope<CreateRideResponse>>(
      Endpoints.RIDE.CREATE,
      payload,
    );
    return data.data;
  },

  async getRideStatus(rideId: string): Promise<RideStatusResponse> {
    const { data } = await apiClient.get<ApiEnvelope<RideStatusResponse>>(
      Endpoints.RIDE.STATUS(rideId),
    );
    return data.data;
  },

  async cancelRide(rideId: string, reason?: string): Promise<void> {
    await apiClient.post(Endpoints.RIDE.CANCEL(rideId), { reason });
  },

  async rateRide(rideId: string, rating: number, feedback?: string, tip?: number): Promise<void> {
    await apiClient.post(Endpoints.RIDE.RATE(rideId), { rating, feedback, tip });
  },

  async getRideHistory(page = 1): Promise<RideStatusResponse[]> {
    const { data } = await apiClient.get<ApiEnvelope<RideStatusResponse[]>>(
      Endpoints.RIDE.HISTORY,
      { params: { page } },
    );
    return data.data ?? [];
  },

  async getNearbyDrivers(lat: number, lng: number, vehicleType?: string) {
    const { data } = await apiClient.get<ApiEnvelope<unknown[]>>(
      Endpoints.RIDE.NEARBY_DRIVERS,
      { params: { lat, lng, vehicleType } },
    );
    return data.data;
  },
};
