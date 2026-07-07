import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket, joinRoom, leaveRoom } from '../socket/socketManager';
import { ParcelService } from '../services/parcelService';
import { ParcelStatusEnum, type ParcelStatus, parcelStatusConfigs } from '../constants/enums';

export interface ParcelRiderLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  ts: number;
}

export interface ParcelETAUpdate {
  etaMin: number;
  distanceKm: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParcelRiderInfo {
  name?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  rating?: number;
  avatarUrl?: string;
}

export interface UseParcelTrackingResult {
  parcelStatus: ParcelStatus | null;
  riderLocation: ParcelRiderLocation | null;
  etaUpdate: ParcelETAUpdate | null;
  riderInfo: ParcelRiderInfo | null;
  pickupCoords: { lat: number; lng: number } | null;
  dropCoords: { lat: number; lng: number } | null;
  isLoading: boolean;
  isTerminal: boolean;
  isSocketConnected: boolean;
}

const POLLING_INTERVAL_MS  = 10_000;
const SOCKET_TIMEOUT_MS    = 8_000;

export function useParcelTracking(parcelId: string | null): UseParcelTrackingResult {
  const [parcelStatus, setParcelStatus]     = useState<ParcelStatus | null>(null);
  const [riderLocation, setRiderLocation]   = useState<ParcelRiderLocation | null>(null);
  const [etaUpdate, setEtaUpdate]           = useState<ParcelETAUpdate | null>(null);
  const [riderInfo, setRiderInfo]           = useState<ParcelRiderInfo | null>(null);
  const [pickupCoords, setPickupCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [dropCoords, setDropCoords]         = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [isSocketConnected, setSocketConnected] = useState(false);

  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const parcelRoom  = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!parcelId) return;
    try {
      const data = await ParcelService.getStatus(parcelId);
      if (data.status) {
        const status = data.status as ParcelStatus;
        setParcelStatus(status);
        if (parcelStatusConfigs[status]?.isTerminal) stopPolling();
      }
      if (data.riderLat != null && data.riderLng != null) {
        setRiderLocation((prev) => ({
          lat:     data.riderLat!,
          lng:     data.riderLng!,
          heading: (data as any).heading ?? prev?.heading ?? 0,
          speed:   (data as any).speed   ?? prev?.speed   ?? 0,
          ts:      Date.now(),
        }));
      }
      if ((data as any).rider) {
        setRiderInfo((data as any).rider as ParcelRiderInfo);
      }
      if ((data as any).pickupLat != null) {
        setPickupCoords({ lat: (data as any).pickupLat, lng: (data as any).pickupLng });
      }
      if ((data as any).dropLat != null) {
        setDropCoords({ lat: (data as any).dropLat, lng: (data as any).dropLng });
      }
    } catch { /* socket is primary — polling failures are silent */ }
  }, [parcelId, stopPolling]);

  useEffect(() => {
    if (!parcelId) return;

    setIsLoading(true);

    const setup = async () => {
      await connectSocket();
      const socket = getSocket();

      if (socket) {
        setSocketConnected(true);

        const room = `parcel:${parcelId}`;
        parcelRoom.current = room;
        joinRoom(room);
        socket.emit('parcel:subscribe', { parcelId });

        socket.on('parcel_status_changed', (data) => {
          if (data.parcelId !== parcelId) return;
          const status = data.status as ParcelStatus;
          setParcelStatus(status);
          if (parcelStatusConfigs[status]?.isTerminal) stopPolling();
        });

        socket.on('parcel_rider_location', (data) => {
          if (data.parcelId !== parcelId) return;
          setRiderLocation({
            lat:     data.lat,
            lng:     data.lng,
            heading: data.heading,
            speed:   data.speed,
            ts:      data.ts,
          });
        });

        socket.on('parcel_eta_updated', (data) => {
          if (data.parcelId !== parcelId) return;
          setEtaUpdate({
            etaMin:     data.etaMin,
            distanceKm: data.distanceKm,
            confidence: data.confidence,
          });
        });

        socket.on('parcel_rider_assigned', (data) => {
          const id = String(data.parcelId);
          if (id !== parcelId) return;
          setParcelStatus(ParcelStatusEnum.RIDER_ASSIGNED);
        });

        socket.on('parcel_delivered', (data) => {
          const id = String(data.parcelId);
          if (id !== parcelId) return;
          setParcelStatus(ParcelStatusEnum.DELIVERED);
          stopPolling();
        });

        socket.on('disconnect', () => setSocketConnected(false));
        socket.on('reconnect', () => setSocketConnected(true));
      }

      await pollStatus();
      setIsLoading(false);

      // Start polling as fallback; socket updates take priority
      pollingRef.current = setInterval(pollStatus, POLLING_INTERVAL_MS);
    };

    setup();

    return () => {
      stopPolling();
      const socket = getSocket();
      if (socket) {
        socket.emit('parcel:unsubscribe', { parcelId });
        socket.off('parcel_status_changed');
        socket.off('parcel_rider_location');
        socket.off('parcel_eta_updated');
        socket.off('parcel_rider_assigned');
        socket.off('parcel_delivered');
        socket.off('disconnect');
        socket.off('reconnect');
      }
      if (parcelRoom.current) leaveRoom(parcelRoom.current);
    };
  }, [parcelId, pollStatus, stopPolling]);

  const isTerminal = parcelStatus
    ? (parcelStatusConfigs[parcelStatus]?.isTerminal ?? false)
    : false;

  return {
    parcelStatus,
    riderLocation,
    etaUpdate,
    riderInfo,
    pickupCoords,
    dropCoords,
    isLoading,
    isTerminal,
    isSocketConnected,
  };
}
