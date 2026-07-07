import { useQuery } from '@tanstack/react-query';
import { RideService } from '../services/rideService';
import { ParcelService } from '../services/parcelService';
import {
  rideStatusConfigs, parcelStatusConfigs,
  type RideStatus, type ParcelStatus,
} from '../constants/enums';

export interface ActiveRide {
  rideId: string;
  status: RideStatus;
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

export interface ActiveParcel {
  parcelId?: string;
  _id?: string;
  status: ParcelStatus;
  pickupAddress?: string;
  dropAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  packageType?: string;
  fare?: number;
  receiverName?: string;
  receiverPhone?: string;
}

function isActiveRide(status: string): boolean {
  const cfg = rideStatusConfigs[status as RideStatus];
  return !!cfg && !cfg.isTerminal;
}

function isActiveParcel(status: string): boolean {
  const cfg = parcelStatusConfigs[status as ParcelStatus];
  return !!cfg && !cfg.isTerminal;
}

export function useActiveBookings() {
  const { data: rideHistory = [], isLoading: rideLoading } = useQuery({
    queryKey: ['active-ride-check'],
    queryFn: () => RideService.getRideHistory(1),
    staleTime: 0,
    gcTime: 30_000,
  });

  const { data: parcelHistory = [], isLoading: parcelLoading } = useQuery({
    queryKey: ['active-parcel-check'],
    queryFn: () => ParcelService.getHistory(1),
    staleTime: 0,
    gcTime: 30_000,
  });

  const rawRide = (rideHistory as any[]).find(r => isActiveRide(r.status)) ?? null;
  const activeRide: ActiveRide | null = rawRide
    ? { ...rawRide, rideId: rawRide.rideId ?? rawRide._id ?? '' }
    : null;

  const rawParcel = (parcelHistory as any[]).find(p => isActiveParcel(p.status)) ?? null;
  const activeParcel: ActiveParcel | null = rawParcel
    ? { ...rawParcel, parcelId: rawParcel.parcelId ?? rawParcel._id ?? '' }
    : null;

  return {
    activeRide,
    activeParcel,
    isLoading: rideLoading || parcelLoading,
  };
}
