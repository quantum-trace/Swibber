import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket, joinRoom, leaveRoom } from '../socket/socketManager';
import { RideService, RideStatusResponse } from '../services/rideService';
import { RideStatusEnum, type RideStatus, rideStatusConfigs } from '../constants/enums';

export interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  ts: number;
}

export interface ETAUpdate {
  etaMin: number;
  distanceKm: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface UseRideTrackingResult {
  rideStatus: RideStatus | null;
  rideData: RideStatusResponse | null;
  driverLocation: DriverLocation | null;
  etaUpdate: ETAUpdate | null;
  isLoading: boolean;
  isTerminal: boolean;
}

const POLLING_INTERVAL_MS = 8000;

export function useRideTracking(rideId: string | null): UseRideTrackingResult {
  const [rideData, setRideData] = useState<RideStatusResponse | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [etaUpdate, setEtaUpdate] = useState<ETAUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rideRoomRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!rideId) return;
    try {
      const data = await RideService.getRideStatus(rideId);
      setRideData(data);
      if (data.status) {
        const status = data.status as RideStatus;
        setRideStatus(status);
        if (rideStatusConfigs[status]?.isTerminal) stopPolling();
      }
    } catch { /* silent — socket is primary */ }
  }, [rideId, stopPolling]);

  useEffect(() => {
    if (!rideId) return;

    setIsLoading(true);

    const setup = async () => {
      await connectSocket();
      const socket = getSocket();
      if (!socket) return;

      const room = `ride:${rideId}`;
      rideRoomRef.current = room;
      joinRoom(room);

      socket.on('ride_status_changed', (data: { rideId: string; status: string }) => {
        if (data.rideId !== rideId) return;
        const status = data.status as RideStatus;
        setRideStatus(status);
        if (rideStatusConfigs[status]?.isTerminal) stopPolling();
      });

      socket.on('driver_moved', (data: { lat: number; lng: number; heading: number; ts: number }) => {
        setDriverLocation({ lat: data.lat, lng: data.lng, heading: data.heading, ts: data.ts });
      });

      socket.on('eta_updated', (data) => {
        if (data.rideId !== rideId) return;
        setEtaUpdate({ etaMin: data.etaMin, distanceKm: data.distanceKm, confidence: data.confidence });
      });

      socket.on('driver_assigned', (data) => {
        const assignedId = typeof data.rideId === 'object' ? String(data.rideId) : (data.rideId as string);
        if (assignedId !== rideId) return;
        setRideStatus(RideStatusEnum.DRIVER_ASSIGNED);
        if (data.etaMin) setEtaUpdate({ etaMin: data.etaMin, distanceKm: 0, confidence: 'medium' });
        // Trigger a poll to get the full driver object; only set status from socket
        setRideData((prev) => prev ? { ...prev, status: data.status } : null);
      });

      socket.on('ride_cancelled', (data) => {
        if (data.rideId !== rideId) return;
        setRideStatus(RideStatusEnum.CANCELLED);
        stopPolling();
      });

      await pollStatus();
      setIsLoading(false);

      pollingRef.current = setInterval(pollStatus, POLLING_INTERVAL_MS);
    };

    setup();

    return () => {
      stopPolling();
      const socket = getSocket();
      if (socket) {
        socket.off('ride_status_changed');
        socket.off('driver_moved');
        socket.off('eta_updated');
        socket.off('driver_assigned');
        socket.off('ride_cancelled');
      }
      if (rideRoomRef.current) leaveRoom(rideRoomRef.current);
    };
  }, [rideId, pollStatus, stopPolling]);

  const isTerminal = rideStatus ? (rideStatusConfigs[rideStatus]?.isTerminal ?? false) : false;

  return { rideStatus, rideData, driverLocation, etaUpdate, isLoading, isTerminal };
}
