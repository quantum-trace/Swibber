import { useState, useEffect, useRef, useCallback } from 'react';
import { RideService } from '../services/rideService';
import { SocketLocationService, NearbyDriversResponse } from '../services/maps/socket-location.service';
import { DriverSimModeEnum, type DriverSimMode, driverSimModeConfigs } from '../constants/enums';

export interface NearbyDriver {
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  vehicleType: string;
  name: string;
  vehicleNumber: string;
  rating: number;
}

interface UseNearbyDriversOptions {
  radiusKm?: number;
  vehicleType?: string;
  simMode?: DriverSimMode;
  enabled?: boolean;
}

const DEFAULT_POLL_INTERVAL_MS = 15_000;
const SIM_UPDATE_INTERVAL_MS = 2_000;

function generateSimDrivers(
  baseLat: number,
  baseLng: number,
  count: number,
  vehicleType?: string,
): NearbyDriver[] {
  const types = vehicleType ? [vehicleType] : ['bike', 'auto', 'mini', 'sedan'];
  return Array.from({ length: count }, (_, i) => ({
    driverId:      `sim-driver-${i}`,
    lat:           baseLat + (Math.random() - 0.5) * 0.02,
    lng:           baseLng + (Math.random() - 0.5) * 0.02,
    heading:       Math.random() * 360,
    vehicleType:   types[i % types.length],
    name:          `Driver ${i + 1}`,
    vehicleNumber: `SIM ${1000 + i}`,
    rating:        4.0 + Math.random(),
  }));
}

function nudgeSimDrivers(drivers: NearbyDriver[]): NearbyDriver[] {
  return drivers.map((d) => ({
    ...d,
    lat:     d.lat + (Math.random() - 0.5) * 0.0003,
    lng:     d.lng + (Math.random() - 0.5) * 0.0003,
    heading: (d.heading + (Math.random() - 0.5) * 20 + 360) % 360,
  }));
}

export function useNearbyDrivers(
  userLat: number | null,
  userLng: number | null,
  options: UseNearbyDriversOptions = {},
): { drivers: NearbyDriver[]; isLoading: boolean } {
  const {
    radiusKm = 5,
    vehicleType,
    simMode = DriverSimModeEnum.OFF,
    enabled = true,
  } = options;

  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (simRef.current)  { clearInterval(simRef.current);  simRef.current  = null; }
  }, []);

  const fetchReal = useCallback(async () => {
    if (!userLat || !userLng) return;
    try {
      const raw = await RideService.getNearbyDrivers(userLat, userLng, vehicleType) as NearbyDriver[];
      setDrivers(raw ?? []);
    } catch { /* ignore */ }
  }, [userLat, userLng, vehicleType]);

  useEffect(() => {
    if (!enabled || !userLat || !userLng) { stopAll(); return; }

    if (simMode !== DriverSimModeEnum.OFF) {
      const initial = generateSimDrivers(userLat, userLng, 6, vehicleType);
      setDrivers(initial);

      const cfg = driverSimModeConfigs[simMode];
      if (cfg.updateIntervalMs > 0) {
        simRef.current = setInterval(() => {
          setDrivers((prev) => nudgeSimDrivers(prev));
        }, cfg.updateIntervalMs);
      }
      return stopAll;
    }

    setIsLoading(true);

    SocketLocationService.requestNearbyDrivers(
      userLat, userLng, radiusKm, vehicleType,
      (res: NearbyDriversResponse) => {
        setDrivers(res.drivers.map((d) => ({
          driverId:     d.id,
          lat:          d.currentLocation?.lat ?? 0,
          lng:          d.currentLocation?.lng ?? 0,
          heading:      0,
          vehicleType:  d.vehicleType,
          name:         d.name ?? '',
          vehicleNumber:d.vehicleNumber,
          rating:       d.rating,
        })));
        setIsLoading(false);
      },
    );

    fetchReal().then(() => setIsLoading(false));

    pollRef.current = setInterval(fetchReal, DEFAULT_POLL_INTERVAL_MS);

    return stopAll;
  }, [enabled, userLat, userLng, radiusKm, vehicleType, simMode, fetchReal, stopAll]);

  return { drivers, isLoading };
}
