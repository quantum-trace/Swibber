import { apiClient } from '../../api/client';
import { ETASourceEnum, type ETASource } from '../../constants/enums';

export interface ETAResult {
  durationMin: number;
  distanceKm: number;
  trafficDurationMin: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  peakHourAdjusted: boolean;
  source: ETASource;
}

interface CacheEntry {
  result: ETAResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function etaCacheKey(oLat: number, oLng: number, dLat: number, dLng: number): string {
  return `${oLat.toFixed(4)},${oLng.toFixed(4)}→${dLat.toFixed(4)},${dLng.toFixed(4)}`;
}

export const ETAClientService = {
  async computeETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<ETAResult> {
    const key = etaCacheKey(originLat, originLng, destLat, destLng);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    try {
      const { data } = await apiClient.get('/rides/eta', {
        params: { originLat, originLng, destLat, destLng },
      });
      const result = data.data as ETAResult;
      cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch {
      const distKm = haversineKm(originLat, originLng, destLat, destLng);
      const durationMin = Math.ceil((distKm / 30) * 60);
      const result: ETAResult = {
        durationMin,
        distanceKm: distKm,
        trafficDurationMin: durationMin,
        confidenceLevel: 'low',
        peakHourAdjusted: false,
        source: ETASourceEnum.HAVERSINE_FALLBACK,
      };
      cache.set(key, { result, expiresAt: Date.now() + 30_000 });
      return result;
    }
  },

  invalidate(originLat: number, originLng: number, destLat: number, destLng: number): void {
    cache.delete(etaCacheKey(originLat, originLng, destLat, destLng));
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
