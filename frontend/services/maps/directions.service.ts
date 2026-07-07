import { apiClient } from '../../api/client';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteBounds {
  northeast: RouteCoordinate;
  southwest: RouteCoordinate;
}

export interface DirectionsResult {
  coordinates: RouteCoordinate[];
  distanceKm: number;
  durationMin: number;
  bounds: RouteBounds;
  steps: Array<{ instruction: string; distance: string }>;
}

interface CacheEntry {
  result: DirectionsResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 20;
const cache = new Map<string, CacheEntry>();

function cacheKey(oLat: number, oLng: number, dLat: number, dLng: number): string {
  return `${oLat.toFixed(4)},${oLng.toFixed(4)}→${dLat.toFixed(4)},${dLng.toFixed(4)}`;
}

function evictStale(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(key);
  }
  while (cache.size > MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value!);
  }
}

export function computeBounds(coordinates: RouteCoordinate[]): RouteBounds {
  if (!coordinates.length) {
    return {
      northeast: { latitude: 0, longitude: 0 },
      southwest: { latitude: 0, longitude: 0 },
    };
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  for (const { latitude, longitude } of coordinates) {
    if (latitude < minLat) minLat = latitude;
    if (latitude > maxLat) maxLat = latitude;
    if (longitude < minLng) minLng = longitude;
    if (longitude > maxLng) maxLng = longitude;
  }

  return {
    northeast: { latitude: maxLat, longitude: maxLng },
    southwest: { latitude: minLat, longitude: minLng },
  };
}

export function boundsToRegion(bounds: RouteBounds, paddingFactor = 1.3) {
  const latDelta = (bounds.northeast.latitude - bounds.southwest.latitude) * paddingFactor;
  const lngDelta = (bounds.northeast.longitude - bounds.southwest.longitude) * paddingFactor;
  return {
    latitude:       (bounds.northeast.latitude + bounds.southwest.latitude) / 2,
    longitude:      (bounds.northeast.longitude + bounds.southwest.longitude) / 2,
    latitudeDelta:  Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
}

// Backend (OSRM-based) returns {lat, lng} objects; normalise to react-native-maps {latitude, longitude}
function normaliseCoordinates(
  raw: Array<{ lat: number; lng: number } | { latitude: number; longitude: number }>,
): RouteCoordinate[] {
  return raw.map((c) => {
    if ('latitude' in c) return c as RouteCoordinate;
    return { latitude: (c as { lat: number; lng: number }).lat, longitude: (c as { lat: number; lng: number }).lng };
  });
}

export const DirectionsService = {
  async getRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DirectionsResult> {
    const key = cacheKey(originLat, originLng, destLat, destLng);
    evictStale();

    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const { data } = await apiClient.get('/maps/directions', {
      params: { originLat, originLng, destLat, destLng },
    });

    const raw = data.data as {
      coordinates: Array<{ lat: number; lng: number }>;
      distanceKm: number;
      durationMin: number;
      steps?: Array<{ instruction: string; distance: string }>;
    };

    const coordinates = normaliseCoordinates(raw.coordinates ?? []);
    const bounds = computeBounds(coordinates);

    const result: DirectionsResult = {
      coordinates,
      distanceKm:  raw.distanceKm,
      durationMin: raw.durationMin,
      bounds,
      steps: raw.steps ?? [],
    };

    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  },

  clearCache(): void {
    cache.clear();
  },

  invalidateRoute(originLat: number, originLng: number, destLat: number, destLng: number): void {
    cache.delete(cacheKey(originLat, originLng, destLat, destLng));
  },
};
