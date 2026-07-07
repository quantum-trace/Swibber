import { create } from 'zustand';
import type { VehicleType } from '../constants/enums';

interface RideLocation {
  address: string;
  lat?: number;
  lng?: number;
}

interface ActiveRide {
  rideId: string;
  vehicleType: VehicleType;
  pickup: RideLocation;
  destination: RideLocation;
  fare: number;
  status: string;
}

interface RideState {
  pickup: RideLocation | null;
  destination: RideLocation | null;
  selectedVehicle: VehicleType | null;
  activeRide: ActiveRide | null;
  setPickup: (location: RideLocation | null) => void;
  setDestination: (location: RideLocation | null) => void;
  setSelectedVehicle: (type: VehicleType | null) => void;
  setActiveRide: (ride: ActiveRide | null) => void;
  reset: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  pickup: null,
  destination: null,
  selectedVehicle: null,
  activeRide: null,
  setPickup: (pickup) => set({ pickup }),
  setDestination: (destination) => set({ destination }),
  setSelectedVehicle: (selectedVehicle) => set({ selectedVehicle }),
  setActiveRide: (activeRide) => set({ activeRide }),
  reset: () => set({ pickup: null, destination: null, selectedVehicle: null, activeRide: null }),
}));
