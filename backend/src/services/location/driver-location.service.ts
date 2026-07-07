import { Driver } from '../../models/Driver';
import { getRedis } from '../../config/redis';

export interface DriverLocationData {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  vehicleType: string;
  name: string;
  vehicleNumber: string;
  rating: number;
  updatedAt: number;
}

export interface NearbyDriversQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  vehicleType?: string;
  maxResults?: number;
}

const LOCATION_TTL_SECONDS = 60;
const NEARBY_CACHE_TTL_SECONDS = 10;
const DEFAULT_RADIUS_KM = 5;
const DEFAULT_MAX_RESULTS = 20;

const locationKey = (driverId: string) => `driver:loc:${driverId}`;
const nearbyKey = (lat: number, lng: number, vehicleType?: string) =>
  `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${vehicleType ?? 'all'}`;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const DriverLocationService = {
  async updateLocation(
    driverId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number,
  ): Promise<void> {
    await Driver.findByIdAndUpdate(driverId, {
      currentLocation: { lat, lng },
      heading: heading ?? 0,
    });

    const redis = getRedis();
    if (redis) {
      const driver = await Driver.findById(driverId).select('vehicleType name vehicleNumber rating').lean();
      if (!driver) return;

      const payload: DriverLocationData = {
        driverId,
        lat,
        lng,
        heading,
        speed,
        vehicleType: driver.vehicleType,
        name: (driver as unknown as { name: string }).name,
        vehicleNumber: (driver as unknown as { vehicleNumber: string }).vehicleNumber,
        rating: (driver as unknown as { rating: number }).rating ?? 5.0,
        updatedAt: Date.now(),
      };
      await redis.setex(locationKey(driverId), LOCATION_TTL_SECONDS, JSON.stringify(payload));
    }
  },

  async getLocation(driverId: string): Promise<DriverLocationData | null> {
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get(locationKey(driverId));
      if (cached) return JSON.parse(cached) as DriverLocationData;
    }

    const driver = await Driver.findById(driverId)
      .select('currentLocation vehicleType name vehicleNumber rating heading')
      .lean();
    if (!driver || !(driver as unknown as { currentLocation?: { lat: number; lng: number } }).currentLocation) return null;

    const d = driver as unknown as {
      currentLocation: { lat: number; lng: number };
      vehicleType: string;
      name: string;
      vehicleNumber: string;
      rating: number;
      heading?: number;
    };

    return {
      driverId,
      lat: d.currentLocation.lat,
      lng: d.currentLocation.lng,
      heading: d.heading,
      vehicleType: d.vehicleType,
      name: d.name,
      vehicleNumber: d.vehicleNumber,
      rating: d.rating ?? 5.0,
      updatedAt: Date.now(),
    };
  },

  async getNearbyDrivers(query: NearbyDriversQuery): Promise<DriverLocationData[]> {
    const { lat, lng, radiusKm = DEFAULT_RADIUS_KM, vehicleType, maxResults = DEFAULT_MAX_RESULTS } = query;

    const redis = getRedis();
    if (redis) {
      const cacheKey = nearbyKey(lat, lng, vehicleType);
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as DriverLocationData[];
    }

    const filter: Record<string, unknown> = {
      isOnline: true,
      isAvailable: true,
      'currentLocation.lat': { $exists: true },
    };
    if (vehicleType) filter.vehicleType = vehicleType;

    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    Object.assign(filter, {
      'currentLocation.lat': { $gte: lat - latDelta, $lte: lat + latDelta },
      'currentLocation.lng': { $gte: lng - lngDelta, $lte: lng + lngDelta },
    });

    const drivers = await Driver.find(filter)
      .select('currentLocation vehicleType name vehicleNumber rating heading')
      .limit(maxResults * 2)
      .lean();

    const result: DriverLocationData[] = drivers
      .map((d) => {
        const dr = d as unknown as {
          _id: { toString(): string };
          currentLocation: { lat: number; lng: number };
          vehicleType: string;
          name: string;
          vehicleNumber: string;
          rating: number;
          heading?: number;
        };
        const distKm = haversineKm(lat, lng, dr.currentLocation.lat, dr.currentLocation.lng);
        return {
          driverId: dr._id.toString(),
          lat: dr.currentLocation.lat,
          lng: dr.currentLocation.lng,
          heading: dr.heading,
          vehicleType: dr.vehicleType,
          name: dr.name,
          vehicleNumber: dr.vehicleNumber,
          rating: dr.rating ?? 5.0,
          updatedAt: Date.now(),
          _distKm: distKm,
        };
      })
      .filter((d) => (d as unknown as { _distKm: number })._distKm <= radiusKm)
      .sort((a, b) => (a as unknown as { _distKm: number })._distKm - (b as unknown as { _distKm: number })._distKm)
      .slice(0, maxResults)
      .map(({ driverId, lat: dLat, lng: dLng, heading, vehicleType: vt, name, vehicleNumber, rating, updatedAt }) => ({
        driverId, lat: dLat, lng: dLng, heading, vehicleType: vt, name, vehicleNumber, rating, updatedAt,
      }));

    if (redis && result.length > 0) {
      const cacheKey = nearbyKey(lat, lng, vehicleType);
      await redis.setex(cacheKey, NEARBY_CACHE_TTL_SECONDS, JSON.stringify(result));
    }

    return result;
  },
};
