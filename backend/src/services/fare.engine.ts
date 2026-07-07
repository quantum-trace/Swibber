/**
 * Fare Engine — single source of truth for ride pricing.
 *
 * Design principles:
 *  - All fare tables are loaded from MongoDB (FareConfig).
 *  - In-memory Redis cache avoids DB round-trips on every estimate.
 *  - No fare constants live outside this file or the DB.
 *  - Callers receive a full breakdown so the frontend can show per-component costs.
 *  - Dynamic pricing hooks (weather, traffic) accept external multipliers so
 *    future integrations can plug in without changing this module.
 */

import { FareConfig, IFareConfig, IVehicleFareConfig } from '../models/FareConfig';
import { getCache, setCache, deleteCache } from '../config/redis';
import { AppError } from '../utils/errors';
import { SurgeLevel, SurgeLevelEnum } from '../types/enums';
import { getDirections } from './maps.service';

// ─── Cache ─────────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = 'fare_config:';
const CACHE_TTL_SECS = 300;

const cacheKey = (area: string) => `${CACHE_KEY_PREFIX}${area}`;

export const invalidateFareCache = async (area = 'default'): Promise<void> => {
  await deleteCache(cacheKey(area));
};

// ─── Default config (fallback when DB has no record yet) ───────────────────

const DEFAULT_VEHICLES: IVehicleFareConfig[] = [
  {
    vehicleType: 'bike',    alias: 'SwibberBike',  baseFare: 25,  perKmRate: 8,
    perMinuteRate: 0.5,  minimumFare: 30,  cancellationFee: 0,   waitingChargePerMin: 0,
    nightMultiplier: 1.25, maxDistanceKm: 10,  capacity: 1, avgSpeedKmh: 25, isActive: true,
  },
  {
    vehicleType: 'auto',   alias: 'SwibberAuto',  baseFare: 35,  perKmRate: 12,
    perMinuteRate: 0.75, minimumFare: 40,  cancellationFee: 20,  waitingChargePerMin: 0.5,
    nightMultiplier: 1.25, maxDistanceKm: 25,  capacity: 3, avgSpeedKmh: 20, isActive: true,
  },
  {
    vehicleType: 'mini',   alias: 'SwibberMini',  baseFare: 50,  perKmRate: 14,
    perMinuteRate: 1.0,  minimumFare: 60,  cancellationFee: 30,  waitingChargePerMin: 1.0,
    nightMultiplier: 1.25, maxDistanceKm: 60,  capacity: 4, avgSpeedKmh: 22, isActive: true,
  },
  {
    vehicleType: 'sedan',  alias: 'SwibberPrime', baseFare: 75,  perKmRate: 18,
    perMinuteRate: 1.5,  minimumFare: 90,  cancellationFee: 50,  waitingChargePerMin: 1.5,
    nightMultiplier: 1.3,  maxDistanceKm: 0,   capacity: 4, avgSpeedKmh: 22, isActive: true,
  },
  {
    vehicleType: 'xl',     alias: 'SwibberXL',   baseFare: 100, perKmRate: 22,
    perMinuteRate: 2.0,  minimumFare: 120, cancellationFee: 75,  waitingChargePerMin: 2.0,
    nightMultiplier: 1.3,  maxDistanceKm: 0,   capacity: 6, avgSpeedKmh: 20, isActive: true,
  },
  {
    vehicleType: 'premium',alias: 'SwibberLux',  baseFare: 150, perKmRate: 28,
    perMinuteRate: 2.5,  minimumFare: 180, cancellationFee: 100, waitingChargePerMin: 2.5,
    nightMultiplier: 1.35, maxDistanceKm: 0,   capacity: 4, avgSpeedKmh: 25, isActive: true,
  },
];

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SurgeContext {
  multiplier: number;
  label: string;
  surgeLevel: SurgeLevel;
  isNight: boolean;
  activePeakLabel: string | null;
}

export interface FareBreakdown {
  vehicleType: string;
  alias: string;
  capacity: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingFare: number;
  nightChargeAmount: number;
  surgeAmount: number;
  surgeMultiplier: number;
  surgeLabel: string;
  surgeLevel: SurgeLevel;
  subtotal: number;
  platformFee: number;
  gst: number;
  totalFare: number;
  memberDiscountAmount: number;
  minimumFareApplied: boolean;
  cancellationFee: number;
  distanceKm: number;
  durationMin: number;
  etaMin: number;
  maxDistanceKm: number;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface FareEstimateInput {
  distanceKm: number;
  durationMin: number;
  waitingMin?: number;
  weatherMultiplier?: number;
  trafficMultiplier?: number;
  membershipTier?: string;
  // Optional coordinate hints used as fallback route source if distanceKm is invalid
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

// ─── Config loader ──────────────────────────────────────────────────────────

export const loadFareConfig = async (serviceArea = 'default'): Promise<IFareConfig> => {
  const cached = await getCache<IFareConfig>(cacheKey(serviceArea));
  if (cached) return cached;

  const config = await FareConfig.findOne({ serviceArea, isActive: true }).lean();
  const result = config ?? buildFallbackConfig();

  await setCache(cacheKey(serviceArea), result, CACHE_TTL_SECS);
  return result as IFareConfig;
};

const buildFallbackConfig = (): Partial<IFareConfig> => ({
  serviceArea: 'default',
  currency: 'INR',
  vehicles: DEFAULT_VEHICLES,
  peakHours: [
    { label: 'Morning Rush', startHour: 8,  endHour: 10, multiplier: 1.4, daysOfWeek: [1, 2, 3, 4, 5] },
    { label: 'Evening Rush', startHour: 18, endHour: 21, multiplier: 1.5, daysOfWeek: [1, 2, 3, 4, 5] },
    { label: 'Weekend Night', startHour: 22, endHour: 2, multiplier: 1.3, daysOfWeek: [5, 6] },
  ],
  nightChargeStartHour: 22,
  nightChargeEndHour: 6,
  baseWeatherMultiplier: 1.0,
  baseTrafficMultiplier: 1.0,
  maxSurgeMultiplier: 3.0,
  platformFeePercent: 0,
  gstPercent: 0,
  isActive: true,
});

// ─── Surge calculator ───────────────────────────────────────────────────────

export const computeSurgeContext = (
  config: Partial<IFareConfig>,
  weatherMult = 1.0,
  trafficMult = 1.0,
): SurgeContext => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const nightStart = config.nightChargeStartHour ?? 22;
  const nightEnd   = config.nightChargeEndHour   ?? 6;
  const isNight    = hour >= nightStart || hour < nightEnd;

  let peakMult = 1.0;
  let activePeakLabel: string | null = null;

  for (const peak of config.peakHours ?? []) {
    const appliesToDay =
      peak.daysOfWeek.length === 0 || peak.daysOfWeek.includes(dayOfWeek);
    if (!appliesToDay) continue;

    const inRange =
      peak.startHour <= peak.endHour
        ? hour >= peak.startHour && hour < peak.endHour
        : hour >= peak.startHour || hour < peak.endHour;

    if (inRange && peak.multiplier > peakMult) {
      peakMult = peak.multiplier;
      activePeakLabel = peak.label;
    }
  }

  const baseMult = (config.baseWeatherMultiplier ?? 1.0) * (config.baseTrafficMultiplier ?? 1.0);
  const combined = Math.min(
    peakMult * weatherMult * trafficMult * baseMult,
    config.maxSurgeMultiplier ?? 3.0,
  );
  const rounded = Math.round(combined * 10) / 10;

  const surgeLevel: SurgeLevel =
    rounded >= 2.0 ? SurgeLevelEnum.HIGH   :
    rounded >= 1.5 ? SurgeLevelEnum.MEDIUM :
    rounded > 1.0  ? SurgeLevelEnum.LOW    :
                     SurgeLevelEnum.NONE;

  const surgeLabel =
    rounded > 1.0
      ? `${rounded.toFixed(1)}x — ${activePeakLabel ?? 'High Demand'}`
      : 'Normal Fare';

  return { multiplier: rounded, label: surgeLabel, surgeLevel, isNight, activePeakLabel };
};

// ─── Single vehicle fare breakdown ─────────────────────────────────────────

const computeVehicleFare = (
  v: IVehicleFareConfig,
  distanceKm: number,
  durationMin: number,
  waitingMin: number,
  surge: SurgeContext,
  config: Partial<IFareConfig>,
  membershipTier?: string,
): FareBreakdown => {
  const withinRange = v.maxDistanceKm === 0 || distanceKm <= v.maxDistanceKm;

  // Gold/Platinum members are immune to surge pricing
  const surgeProtected = membershipTier === 'gold' || membershipTier === 'platinum';
  const effectiveSurge: SurgeContext = surgeProtected
    ? { ...surge, multiplier: 1.0, label: 'Surge Protected', surgeLevel: SurgeLevelEnum.NONE }
    : surge;

  const rBaseFare         = Math.round(v.baseFare);
  const rDistanceFare     = Math.round(distanceKm * v.perKmRate);
  const rTimeFare         = Math.round(durationMin * v.perMinuteRate);
  const rWaitingFare      = Math.round(waitingMin * v.waitingChargePerMin);

  // Night charge applies to base + distance + time (not waiting or surge)
  const rNightChargeAmount = effectiveSurge.isNight
    ? Math.round((rBaseFare + rDistanceFare + rTimeFare) * (v.nightMultiplier - 1))
    : 0;

  const preSurgeSum = rBaseFare + rDistanceFare + rTimeFare + rWaitingFare + rNightChargeAmount;

  // Round subtotal to an integer immediately so all downstream arithmetic is exact
  let subtotal = Math.round(preSurgeSum * effectiveSurge.multiplier);

  const minimumFareApplied = subtotal < v.minimumFare;
  if (minimumFareApplied) subtotal = v.minimumFare;

  // surgeAmount is the extra charge from surge; 0 when minimum fare overrides
  const surgeAmount = minimumFareApplied ? 0 : subtotal - preSurgeSum;

  // All three are integers → preTierFare is exact (no Math.ceil rounding gap)
  const platformFee = Math.round(subtotal * ((config.platformFeePercent ?? 0) / 100));
  const gst         = Math.round((subtotal + platformFee) * ((config.gstPercent ?? 0) / 100));
  const preTierFare = subtotal + platformFee + gst;

  const cashbackRate =
    membershipTier === 'platinum' ? 0.20 :
    membershipTier === 'gold'     ? 0.15 :
    membershipTier === 'bronze'   ? 0.05 : 0;
  const memberDiscountAmount = membershipTier ? Math.floor(preTierFare * cashbackRate) : 0;
  const totalFare = Math.max(0, preTierFare - memberDiscountAmount);

  // ETA = travel time at avg speed * short-distance correction + pickup buffer
  const etaMin = Math.ceil((distanceKm / (v.avgSpeedKmh || 22)) * 60 * 0.3 + 3);

  return {
    vehicleType:         v.vehicleType,
    alias:               v.alias,
    capacity:            v.capacity,
    baseFare:            rBaseFare,
    distanceFare:        rDistanceFare,
    timeFare:            rTimeFare,
    waitingFare:         rWaitingFare,
    nightChargeAmount:   rNightChargeAmount,
    surgeAmount,
    surgeMultiplier:     effectiveSurge.multiplier,
    surgeLabel:          effectiveSurge.label,
    surgeLevel:          effectiveSurge.surgeLevel,
    subtotal,
    platformFee,
    gst,
    totalFare,
    memberDiscountAmount,
    minimumFareApplied,
    cancellationFee:     v.cancellationFee,
    distanceKm,
    durationMin,
    etaMin,
    maxDistanceKm:       v.maxDistanceKm,
    isAvailable:         withinRange,
    unavailableReason:   !withinRange
      ? `${v.alias} is only available for trips up to ${v.maxDistanceKm} km`
      : undefined,
  };
};

// ─── Public API ─────────────────────────────────────────────────────────────

/** Estimate fare for every active vehicle type. */
export const estimateAllFares = async (
  input: FareEstimateInput,
  serviceArea = 'default',
): Promise<FareBreakdown[]> => {
  console.log('[FARE] FARE_REQUEST', {
    distanceKm: input.distanceKm,
    durationMin: input.durationMin,
    waitingMin: input.waitingMin ?? 0,
    weatherMultiplier: input.weatherMultiplier,
    trafficMultiplier: input.trafficMultiplier,
    serviceArea,
  });

  // Validate that distance and duration are finite positive numbers.
  // If not, attempt to recover via maps service when coordinates are provided.
  let distanceKm = input.distanceKm;
  let durationMin = input.durationMin;

  const distanceInvalid = !Number.isFinite(distanceKm) || distanceKm <= 0;
  const durationInvalid = !Number.isFinite(durationMin) || durationMin <= 0;

  if (distanceInvalid || durationInvalid) {
    const { pickupLat, pickupLng, destinationLat, destinationLng } = input;
    const hasCoords =
      Number.isFinite(pickupLat) && Number.isFinite(pickupLng) &&
      Number.isFinite(destinationLat) && Number.isFinite(destinationLng);

    if (hasCoords) {
      console.warn('[FARE] Invalid distance/duration — fetching route from maps service', {
        distanceKm, durationMin, pickupLat, pickupLng, destinationLat, destinationLng,
      });
      try {
        const route = await getDirections(
          pickupLat as number, pickupLng as number,
          destinationLat as number, destinationLng as number,
        );
        distanceKm  = route.distanceKm;
        durationMin = route.durationMin;
        console.log('[FARE] FARE_ROUTE_FOUND (fallback)', { distanceKm, durationMin, source: route.source });
      } catch (routeErr: any) {
        console.error('[FARE] Maps service fallback also failed', { error: routeErr?.message });
        throw new AppError('Could not compute route distance — provide valid coordinates', 400);
      }
    } else {
      throw new AppError(
        'distanceKm and durationMin must be positive finite numbers, or pickup/destination coordinates must be supplied',
        400,
      );
    }
  } else {
    console.log('[FARE] FARE_ROUTE_FOUND', { distanceKm, durationMin, source: 'caller-provided' });
  }

  const config = await loadFareConfig(serviceArea);
  const surge  = computeSurgeContext(config, input.weatherMultiplier, input.trafficMultiplier);

  const results = (config.vehicles ?? DEFAULT_VEHICLES)
    .filter((v) => v.isActive)
    .map((v) =>
      computeVehicleFare(v, distanceKm, durationMin, input.waitingMin ?? 0, surge, config, input.membershipTier),
    );

  console.log('[FARE] FARE_CALCULATED', {
    vehicleCount: results.length,
    surgeMultiplier: surge.multiplier,
    surgeLabel: surge.label,
  });

  results.forEach((r) => {
    console.log('[FARE] FARE_RESPONSE', {
      vehicleType: r.vehicleType,
      alias: r.alias,
      totalFare: r.totalFare,
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
      isAvailable: r.isAvailable,
    });
  });

  return results;
};

/** Estimate fare for a single vehicle type. */
export const estimateSingleFare = async (
  vehicleType: string,
  input: FareEstimateInput,
  serviceArea = 'default',
): Promise<FareBreakdown> => {
  const config = await loadFareConfig(serviceArea);
  const surge  = computeSurgeContext(config, input.weatherMultiplier, input.trafficMultiplier);

  const vehicleConfig = (config.vehicles ?? DEFAULT_VEHICLES).find(
    (v) => v.vehicleType === vehicleType && v.isActive,
  );
  if (!vehicleConfig) throw new AppError(`Vehicle type '${vehicleType}' is not available`, 400);

  return computeVehicleFare(vehicleConfig, input.distanceKm, input.durationMin, input.waitingMin ?? 0, surge, config, input.membershipTier);
};

/** Validate that a vehicle type can service the given distance.
 *  Throws AppError(400) if not allowed — call before creating a ride. */
export const validateVehicleDistance = async (
  vehicleType: string,
  distanceKm: number,
  serviceArea = 'default',
): Promise<void> => {
  const config = await loadFareConfig(serviceArea);
  const vehicleConfig = (config.vehicles ?? DEFAULT_VEHICLES).find(
    (v) => v.vehicleType === vehicleType,
  );
  if (!vehicleConfig) throw new AppError(`Vehicle type '${vehicleType}' is not recognised`, 400);
  if (vehicleConfig.maxDistanceKm > 0 && distanceKm > vehicleConfig.maxDistanceKm) {
    throw new AppError(
      `${vehicleConfig.alias} only serves trips up to ${vehicleConfig.maxDistanceKm} km. ` +
      `Please select a different vehicle for this ${distanceKm.toFixed(1)} km trip.`,
      400,
    );
  }
};

/** Return the current surge context without a full fare estimate. */
export const getSurgeContext = async (
  serviceArea = 'default',
  weatherMult?: number,
  trafficMult?: number,
): Promise<SurgeContext> => {
  const config = await loadFareConfig(serviceArea);
  return computeSurgeContext(config, weatherMult, trafficMult);
};
