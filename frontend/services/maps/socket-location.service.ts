import { getSocket } from '../../socket/socketManager';
import type { NearbyDriverPayload } from '../../socket/types';

export interface DriverLocationEvent {
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  speed?: number;
  ts: number;
}

export interface NearbyDriversResponse {
  drivers: NearbyDriverPayload[];
  ts: number;
}

export interface ETAUpdatedEvent {
  rideId: string;
  etaMin: number;
  distanceKm: number;
  confidence: 'high' | 'medium' | 'low';
}

export const SocketLocationService = {
  subscribeToDriverLocation(
    driverId: string,
    onUpdate: (event: DriverLocationEvent) => void,
  ): () => void {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.emit('passenger:subscribe:driver', { driverId });
    socket.on('driver:location:changed', (event) => {
      if (event.driverId === driverId) onUpdate(event);
    });

    return () => {
      socket.emit('passenger:unsubscribe:driver', { driverId });
      socket.off('driver:location:changed');
    };
  },

  subscribeToRideDriverLocation(
    rideId: string,
    onMove: (event: { lat: number; lng: number; heading: number; ts: number }) => void,
  ): () => void {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.on('driver_moved', onMove);
    return () => { socket.off('driver_moved', onMove); };
  },

  subscribeToETAUpdates(
    onUpdate: (event: ETAUpdatedEvent) => void,
  ): () => void {
    const socket = getSocket();
    if (!socket) return () => {};
    socket.on('eta_updated', onUpdate);
    return () => { socket.off('eta_updated', onUpdate); };
  },

  requestNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm?: number,
    vehicleType?: string,
    onResponse?: (res: NearbyDriversResponse) => void,
  ): void {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('nearby:drivers:request', { lat, lng, radiusKm, vehicleType });
    if (onResponse) {
      const handler = (res: NearbyDriversResponse) => {
        onResponse(res);
        socket.off('nearby:drivers:response', handler);
      };
      socket.on('nearby:drivers:response', handler);
    }
  },

  sendDriverLocation(lat: number, lng: number, heading?: number, speed?: number, rideId?: string): void {
    const socket = getSocket();
    socket?.emit('driver:location:update', { lat, lng, heading, speed, rideId });
  },
};
