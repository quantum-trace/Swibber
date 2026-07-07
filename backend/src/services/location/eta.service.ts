import { getDirections } from '../maps.service';
import { getRedis } from '../../config/redis';
import { ETASourceEnum, type ETASource } from '../../types/enums';

export interface ETAResult {
  durationMin: number;
  distanceKm: number;
  trafficDurationMin: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  peakHourAdjusted: boolean;
  source: ETASource;
}

const ETA_CACHE_TTL_SECONDS = 120;

const etaCacheKey = (
  oLat: number, oLng: number, dLat: number, dLng: number,
) => `eta:${oLat.toFixed(4)}:${oLng.toFixed(4)}:${dLat.toFixed(4)}:${dLng.toFixed(4)}`;

function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
}

function peakMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 8 && hour <= 10) return 1.3;
  if (hour >= 17 && hour <= 20) return 1.4;
  return 1.0;
}

export const ETAService = {
  async computeETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<ETAResult> {
    const redis = getRedis();
    const cacheKey = etaCacheKey(originLat, originLng, destLat, destLng);

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as ETAResult;
    }

    try {
      const directions = await getDirections(originLat, originLng, destLat, destLng);
      const peakAdjusted = isPeakHour();
      const trafficDurationMin = Math.ceil(directions.durationMin * (peakAdjusted ? peakMultiplier() : 1.0));

      const result: ETAResult = {
        durationMin: directions.durationMin,
        distanceKm: directions.distanceKm,
        trafficDurationMin,
        confidenceLevel: 'high',
        peakHourAdjusted: peakAdjusted,
        source: ETASourceEnum.OSRM,
      };

      if (redis) await redis.setex(cacheKey, ETA_CACHE_TTL_SECONDS, JSON.stringify(result));
      return result;
    } catch {
      const distKm = haversineKm(originLat, originLng, destLat, destLng);
      const baseDuration = Math.ceil((distKm / 30) * 60);
      const peakAdjusted = isPeakHour();
      const trafficDurationMin = Math.ceil(baseDuration * (peakAdjusted ? peakMultiplier() : 1.0));

      const result: ETAResult = {
        durationMin: baseDuration,
        distanceKm: distKm,
        trafficDurationMin,
        confidenceLevel: 'low',
        peakHourAdjusted: peakAdjusted,
        source: ETASourceEnum.HAVERSINE_FALLBACK,
      };

      if (redis) await redis.setex(cacheKey, 30, JSON.stringify(result));
      return result;
    }
  },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
