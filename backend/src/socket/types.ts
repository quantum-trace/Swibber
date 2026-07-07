/**
 * Typed Socket.IO event maps for Swibber.
 *
 * Usage:
 *   const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer);
 *
 * Rules:
 *  - Every event payload is a plain interface (no class instances).
 *  - All status fields use the derived union type (RideStatus, ParcelStatus, etc.)
 *    not raw strings — violations will fail at compile time.
 *  - SocketData carries the authenticated user so handlers never need unsafe casts.
 */

import type {
  RideStatus,
  ParcelStatus,
  OrderStatus,
  CancelledBy,
  UserRole,
  VehicleType,
  ETASource,
} from '../types/enums';

// ─── Shared payload shapes ────────────────────────────────────────────────────

export interface NearbyDriverPayload {
  id: string;
  name: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  rating: number;
  currentLocation: { lat: number; lng: number } | null;
  avatarUrl?: string;
  etaMin?: number;
}

export interface DriverInfoPayload {
  id?: string;
  name?: string;
  phone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleType?: string;
  rating?: number;
  currentLocation?: { lat: number; lng: number };
  avatarUrl?: string;
}

// ─── Server → Client ─────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  // Ride
  driver_assigned: (payload: {
    rideId: unknown;
    status: RideStatus;
    etaMin: number;
    driver: DriverInfoPayload;
  }) => void;

  ride_status_changed: (payload: {
    rideId: string;
    status: RideStatus;
    lat?: number;
    lng?: number;
  }) => void;

  driver_arrived_otp_prompt: (payload: {
    rideId: string;
    message: string;
  }) => void;

  otp_verified: (payload: {
    success: boolean;
    error?: string;
  }) => void;

  driver_moved: (payload: {
    lat: number;
    lng: number;
    heading: number;
    ts: number;
  }) => void;

  eta_updated: (payload: {
    rideId: string;
    etaMin: number;
    distanceKm: number;
    confidence: 'high' | 'medium' | 'low';
  }) => void;

  ride_message: (payload: {
    rideId: string;
    message: string;
    senderId: string;
    senderType: string;
    timestamp: string;
  }) => void;

  ride_cancelled: (payload: {
    rideId: string;
    cancelledBy: CancelledBy;
    reason?: string;
  }) => void;

  new_ride_request: (payload: {
    rideId: unknown;
    pickup: { address: string; lat: number; lng: number };
    destination: { address: string; lat: number; lng: number };
    fare: number;
    vehicleType: string;
    surgeMultiplier: number;
  }) => void;

  // Parcel
  parcel_rider_assigned: (payload: {
    parcelId: unknown;
    riderId: string;
    status: ParcelStatus;
  }) => void;

  parcel_status_changed: (payload: {
    parcelId: string;
    status: ParcelStatus;
  }) => void;

  parcel_rider_location: (payload: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    parcelId: string;
    ts: number;
  }) => void;

  parcel_eta_updated: (payload: {
    parcelId: string;
    etaMin: number;
    distanceKm: number;
    confidence: 'high' | 'medium' | 'low';
    source: ETASource;
  }) => void;

  parcel_delivered: (payload: {
    parcelId: unknown;
  }) => void;

  // Food
  order_status_changed: (payload: {
    orderId: string;
    status: OrderStatus;
    timestamp: Date;
  }) => void;

  rider_location: (payload: {
    lat: number;
    lng: number;
    orderId: string;
  }) => void;

  // Driver location
  'driver:location:changed': (payload: {
    driverId: string;
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    ts: number;
  }) => void;

  'nearby:drivers:response': (payload: {
    drivers: NearbyDriverPayload[];
    ts: number;
  }) => void;
}

// ─── Client → Server ─────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  // General
  update_location: (data: { lat: number; lng: number }) => void;
  join_room:       (room: string) => void;
  leave_room:      (room: string) => void;

  // Ride
  driver_accept_ride: (data: {
    rideId: string;
    driverId: string;
  }) => void;

  ride_status_update: (data: {
    rideId: string;
    status: RideStatus;
    lat?: number;
    lng?: number;
    otp?: string;
  }) => void;

  verify_ride_otp: (data: {
    rideId: string;
    otp: string;
  }) => void;

  driver_location: (data: {
    rideId: string;
    lat: number;
    lng: number;
    heading?: number;
  }) => void;

  request_eta_update: (data: {
    rideId: string;
    driverLat: number;
    driverLng: number;
  }) => void;

  ride_message: (data: {
    rideId: string;
    message: string;
    senderId: string;
    senderType: string;
  }) => void;

  cancel_ride_socket: (data: {
    rideId: string;
    reason?: string;
  }) => void;

  // Parcel
  rider_accept_parcel: (data: {
    parcelId: string;
    riderId: string;
  }) => void;

  parcel_status_update: (data: {
    parcelId: string;
    status: ParcelStatus;
  }) => void;

  parcel_location_update: (data: {
    parcelId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }) => void;

  'parcel:subscribe':   (data: { parcelId: string }) => void;
  'parcel:unsubscribe': (data: { parcelId: string }) => void;

  // Food
  update_order_status: (data: {
    orderId: string;
    status: OrderStatus;
    riderId?: string;
  }) => void;

  rider_location_update: (data: {
    orderId: string;
    lat: number;
    lng: number;
  }) => void;

  // Driver location
  'driver:location:update': (data: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    rideId?: string;
  }) => void;

  'passenger:subscribe:driver':   (data: { driverId: string }) => void;
  'passenger:unsubscribe:driver': (data: { driverId: string }) => void;

  'nearby:drivers:request': (data: {
    lat: number;
    lng: number;
    radiusKm?: number;
    vehicleType?: string;
  }) => void;
}

// ─── Inter-Server ─────────────────────────────────────────────────────────────

export interface InterServerEvents {}

// ─── Socket Data (authenticated user attached at middleware) ──────────────────

export interface SocketData {
  user: {
    id: string;
    role: UserRole;
    phone?: string;
    email?: string;
    firebaseUid?: string;
  };
}
