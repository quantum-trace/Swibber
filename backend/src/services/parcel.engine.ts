/**
 * Parcel Fare Engine — all parcel delivery pricing lives here.
 *
 * Pricing factors:
 *  - Base fare + per-km rate
 *  - Weight tiers (stepped surcharge based on configured breakpoints)
 *  - Fragile item surcharge (flat)
 *  - Express delivery multiplier
 *  - Peak-time multiplier (configurable hour window)
 *  - Multi-stop surcharge per additional stop
 *  - Vehicle compatibility checks (max weight / dimensions per vehicle type)
 *  - Minimum fare enforcement
 *  - Platform fee % + GST %
 */

import { ParcelFareConfig, IParcelFareConfig, IParcelVehicleConstraint } from '../models/ParcelFareConfig';
import { getCache, setCache, deleteCache } from '../config/redis';
import { AppError } from '../utils/errors';

// ─── Cache ──────────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = 'parcel_fare_config:';
const CACHE_TTL_SECS   = 300;

const cacheKey = (area: string) => `${CACHE_KEY_PREFIX}${area}`;

export const invalidateParcelFareCache = async (area = 'default'): Promise<void> => {
  await deleteCache(cacheKey(area));
};

// ─── Default config ──────────────────────────────────────────────────────────

const DEFAULT_PARCEL_VEHICLES: IParcelVehicleConstraint[] = [
  { vehicleType: 'bike',  alias: 'SwibberBike',   maxWeightKg: 5,  maxDimensionCm: 100, isActive: true },
  { vehicleType: 'auto',  alias: 'SwibberAuto',   maxWeightKg: 20, maxDimensionCm: 200, isActive: true },
  { vehicleType: 'mini',  alias: 'SwibberMini',   maxWeightKg: 50, maxDimensionCm: 300, isActive: true },
  { vehicleType: 'sedan', alias: 'SwibberPrime',  maxWeightKg: 20, maxDimensionCm: 200, isActive: true },
  { vehicleType: 'xl',    alias: 'SwibberXL',     maxWeightKg: 80, maxDimensionCm: 400, isActive: true },
];

const buildFallbackParcelConfig = (): Partial<IParcelFareConfig> => ({
  serviceArea: 'default',
  currency: 'INR',
  baseFare: 40,
  perKmRate: 10,
  weightTiers: [
    { upToKg: 1,  surchargeFlat: 0  },
    { upToKg: 3,  surchargeFlat: 15 },
    { upToKg: 5,  surchargeFlat: 30 },
    { upToKg: 10, surchargeFlat: 60 },
    { upToKg: 20, surchargeFlat: 100},
    { upToKg: 50, surchargeFlat: 200},
  ],
  fragileSurcharge: 30,
  expressMultiplier: 1.5,
  peakMultiplier: 1.3,
  peakStartHour: 9,
  peakEndHour: 12,
  multiStopSurchargePerStop: 20,
  vehicles: DEFAULT_PARCEL_VEHICLES,
  minimumFare: 40,
  platformFeePercent: 0,
  gstPercent: 0,
  isActive: true,
});

// ─── Config loader ───────────────────────────────────────────────────────────

export const loadParcelFareConfig = async (serviceArea = 'default'): Promise<Partial<IParcelFareConfig>> => {
  const cached = await getCache<IParcelFareConfig>(cacheKey(serviceArea));
  if (cached) return cached;

  const config = await ParcelFareConfig.findOne({ serviceArea, isActive: true }).lean();
  const result = config ?? buildFallbackParcelConfig();

  await setCache(cacheKey(serviceArea), result, CACHE_TTL_SECS);
  return result as Partial<IParcelFareConfig>;
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParcelFareInput {
  distanceKm: number;
  durationMin?: number;
  weightKg: number;
  isFragile?: boolean;
  isExpress?: boolean;
  extraStops?: number;  // multi-stop count beyond the first drop
  vehicleType?: string; // if specified, validates compatibility
  dimensionCm?: number; // combined L+W+H for vehicle compatibility
  membershipTier?: string;
}

export interface ParcelFareBreakdown {
  baseFare: number;
  distanceFare: number;
  weightSurcharge: number;
  fragileSurcharge: number;
  expressUpcharge: number;
  peakUpcharge: number;
  multiStopUpcharge: number;
  subtotal: number;
  platformFee: number;
  gst: number;
  totalFare: number;
  memberDiscountAmount: number;
  deliveryFeeWaived: boolean;
  minimumFareApplied: boolean;
  distanceKm: number;
  weightKg: number;
  etaMin: number;
  isExpressPossible: boolean;
}

export interface ParcelVehicleOption {
  vehicleType: string;
  alias: string;
  fare: ParcelFareBreakdown;
  isCompatible: boolean;
  incompatibleReason?: string;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const resolveWeightSurcharge = (
  weightKg: number,
  tiers: IParcelFareConfig['weightTiers'],
): number => {
  const sorted = [...tiers].sort((a, b) => a.upToKg - b.upToKg);
  for (const tier of sorted) {
    if (weightKg <= tier.upToKg) return tier.surchargeFlat;
  }
  // above highest tier: use the highest surcharge
  return sorted[sorted.length - 1]?.surchargeFlat ?? 0;
};

const isPeakHour = (config: Partial<IParcelFareConfig>): boolean => {
  const hour = new Date().getHours();
  const start = config.peakStartHour ?? 9;
  const end   = config.peakEndHour   ?? 12;
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
};

const computeParcelFare = (
  config: Partial<IParcelFareConfig>,
  input: ParcelFareInput,
): ParcelFareBreakdown => {
  const { distanceKm, weightKg, isFragile = false, isExpress = false, extraStops = 0, membershipTier } = input;

  // Gold/Platinum members get free delivery (base fare waived)
  const freeDelivery   = membershipTier === 'gold' || membershipTier === 'platinum';
  const effectiveBase  = freeDelivery ? 0 : (config.baseFare ?? 40);
  const deliveryFeeWaived = freeDelivery;

  const rBaseFare         = Math.round(effectiveBase);
  const rDistanceFare     = Math.round(distanceKm * (config.perKmRate ?? 10));
  const rWeightSurcharge  = Math.round(resolveWeightSurcharge(weightKg, config.weightTiers ?? []));
  const rFragileSurcharge = isFragile ? Math.round(config.fragileSurcharge ?? 30) : 0;
  const rMultiStop        = Math.round(extraStops * (config.multiStopSurchargePerStop ?? 20));

  // Build subtotal step-by-step in integers to avoid float accumulation
  let subtotal = rBaseFare + rDistanceFare + rWeightSurcharge + rFragileSurcharge + rMultiStop;

  const inPeak        = isPeakHour(config);
  const rPeakUpcharge = inPeak ? Math.round(subtotal * ((config.peakMultiplier ?? 1.3) - 1)) : 0;
  subtotal += rPeakUpcharge;

  const rExpressUpcharge = isExpress ? Math.round(subtotal * ((config.expressMultiplier ?? 1.5) - 1)) : 0;
  subtotal += rExpressUpcharge;

  const minimumFare        = freeDelivery ? 0 : (config.minimumFare ?? 40);
  const minimumFareApplied = subtotal < minimumFare;
  if (minimumFareApplied) subtotal = minimumFare;

  // All integers → preTierFare is exact (no Math.ceil rounding gap)
  const platformFee = Math.round(subtotal * ((config.platformFeePercent ?? 0) / 100));
  const gst         = Math.round((subtotal + platformFee) * ((config.gstPercent ?? 0) / 100));
  const preTierFare = subtotal + platformFee + gst;

  const cashbackRate =
    membershipTier === 'platinum' ? 0.20 :
    membershipTier === 'gold'     ? 0.15 :
    membershipTier === 'bronze'   ? 0.05 : 0;
  const memberDiscountAmount = membershipTier ? Math.floor(preTierFare * cashbackRate) : 0;
  const totalFare = Math.max(0, preTierFare - memberDiscountAmount);

  const etaMin = Math.ceil((distanceKm / 20) * 60) + (isExpress ? 0 : 10);

  return {
    baseFare:           rBaseFare,
    distanceFare:       rDistanceFare,
    weightSurcharge:    rWeightSurcharge,
    fragileSurcharge:   rFragileSurcharge,
    expressUpcharge:    rExpressUpcharge,
    peakUpcharge:       rPeakUpcharge,
    multiStopUpcharge:  rMultiStop,
    subtotal,
    platformFee,
    gst,
    totalFare,
    memberDiscountAmount,
    deliveryFeeWaived,
    minimumFareApplied,
    distanceKm,
    weightKg,
    etaMin,
    isExpressPossible:  true,
  };
};

// ─── Public API ──────────────────────────────────────────────────────────────

/** Calculate fare for a specific vehicle type (or the cheapest compatible one). */
export const estimateParcelFare = async (
  input: ParcelFareInput,
  serviceArea = 'default',
): Promise<ParcelFareBreakdown> => {
  const config = await loadParcelFareConfig(serviceArea);
  return computeParcelFare(config, input);
};

/** Return fare estimates for every vehicle type with compatibility info. */
export const estimateAllParcelFares = async (
  input: ParcelFareInput,
  serviceArea = 'default',
): Promise<ParcelVehicleOption[]> => {
  const config = await loadParcelFareConfig(serviceArea);
  const vehicles = config.vehicles ?? DEFAULT_PARCEL_VEHICLES;

  return vehicles.filter((v) => v.isActive).map((v) => {
    const weightOk     = input.weightKg <= v.maxWeightKg;
    const dimensionOk  = !input.dimensionCm || v.maxDimensionCm === 0 || input.dimensionCm <= v.maxDimensionCm;
    const isCompatible = weightOk && dimensionOk;

    const incompatibleReason = !weightOk
      ? `Max weight for ${v.alias} is ${v.maxWeightKg} kg`
      : !dimensionOk
      ? `Package dimensions exceed ${v.alias}'s limit`
      : undefined;

    return {
      vehicleType: v.vehicleType,
      alias:       v.alias,
      fare:        computeParcelFare(config, input),
      isCompatible,
      incompatibleReason,
    };
  });
};

/** Validate that a vehicle type can carry this parcel — throws AppError(400) if not. */
export const validateParcelVehicle = async (
  vehicleType: string,
  weightKg: number,
  dimensionCm?: number,
  serviceArea = 'default',
): Promise<void> => {
  const config = await loadParcelFareConfig(serviceArea);
  const v = (config.vehicles ?? DEFAULT_PARCEL_VEHICLES).find((x) => x.vehicleType === vehicleType);
  if (!v) throw new AppError(`Vehicle type '${vehicleType}' is not available for parcel delivery`, 400);
  if (weightKg > v.maxWeightKg) {
    throw new AppError(`${v.alias} can only carry parcels up to ${v.maxWeightKg} kg. Your parcel weighs ${weightKg} kg.`, 400);
  }
  if (dimensionCm && v.maxDimensionCm > 0 && dimensionCm > v.maxDimensionCm) {
    throw new AppError(`${v.alias} cannot accommodate a parcel with combined dimensions of ${dimensionCm} cm.`, 400);
  }
};
