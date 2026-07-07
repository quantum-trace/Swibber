import { useState, useEffect, useRef, useCallback } from 'react';
import MapView from 'react-native-maps';
import { DirectionsService, DirectionsResult, boundsToRegion } from '../services/maps/directions.service';
import { MapRouteStateEnum, type MapRouteState } from '../constants/enums';

interface UseDirectionsOptions {
  mapRef?: React.RefObject<MapView>;
  autoFitBounds?: boolean;
  fitPaddingPercent?: number;
  rerouteThresholdKm?: number;
}

interface UseDirectionsResult {
  route: DirectionsResult | null;
  routeState: MapRouteState;
  error: string | null;
  refresh: () => void;
}

const REROUTE_THRESHOLD_KM = 0.3;

export function useDirections(
  origin: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number } | null,
  options: UseDirectionsOptions = {},
): UseDirectionsResult {
  const {
    mapRef,
    autoFitBounds = true,
    fitPaddingPercent = 30,
    rerouteThresholdKm = REROUTE_THRESHOLD_KM,
  } = options;

  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [routeState, setRouteState] = useState<MapRouteState>(MapRouteStateEnum.IDLE);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastOriginRef = useRef<string | null>(null);

  const hasChanged = useCallback(() => {
    if (!origin || !destination) return false;
    const key = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`;
    return key !== lastOriginRef.current;
  }, [origin, destination]);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) {
      setRoute(null);
      setRouteState(MapRouteStateEnum.IDLE);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setRouteState(MapRouteStateEnum.LOADING);
    setError(null);

    try {
      const result = await DirectionsService.getRoute(
        origin.lat, origin.lng,
        destination.lat, destination.lng,
      );

      setRoute(result);
      setRouteState(MapRouteStateEnum.READY);
      lastOriginRef.current = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`;

      if (autoFitBounds && mapRef?.current && result.coordinates.length > 0) {
        const padding = { top: fitPaddingPercent, right: fitPaddingPercent, bottom: fitPaddingPercent, left: fitPaddingPercent };
        mapRef.current.fitToCoordinates(result.coordinates, { edgePadding: padding, animated: true });
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      const msg = (err as Error)?.message ?? 'Failed to fetch route';
      setError(msg);
      setRouteState(MapRouteStateEnum.ERROR);
    }
  }, [origin, destination, autoFitBounds, mapRef, fitPaddingPercent]);

  useEffect(() => {
    fetchRoute();
    return () => { abortRef.current?.abort(); };
  }, [fetchRoute]);

  return { route, routeState, error, refresh: fetchRoute };
}
