import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Ride } from '../models/Ride';
import { Driver } from '../models/Driver';
import { User } from '../models/User';
import { getDirections } from '../services/maps.service';
import { calculateDistance } from '../utils/helpers';
import {
  estimateAllFares,
  estimateSingleFare,
  validateVehicleDistance,
  getSurgeContext,
} from '../services/fare.engine';
import { createNotification } from '../services/notification.service';
import { createRazorpayOrder } from '../services/razorpay.service';
import { AppError } from '../utils/errors';
import { paginate, formatPaginatedResponse } from '../utils/helpers';
import { PaymentMethodEnum, RideStatusEnum, RideStatus, rideStatusConfigs, MembershipTierEnum } from '../types/enums';
import { generateOTP } from '../utils/helpers';
import { ETAService } from '../services/location/eta.service';
import { makeHistoryEntry } from '../utils/statusHistory';
import mongoose from 'mongoose';

// ─── Membership helpers ───────────────────────────────────────────────────────

const getEffectiveTier = (user: { membershipTier: string; membershipExpiresAt?: Date | null } | null): string => {
  if (!user) return MembershipTierEnum.BRONZE;
  if (user.membershipExpiresAt && new Date() > new Date(user.membershipExpiresAt)) return MembershipTierEnum.BRONZE;
  return user.membershipTier;
};

// ─── Estimate ────────────────────────────────────────────────────────────────

export const estimateRide = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log('FARE_ESTIMATE_REQUEST', req.body);

    const {
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
      weatherMultiplier,
      trafficMultiplier,
    } = req.body;

    // ── Coordinate validation ─────────────────────────────────────────────────
    const missing: string[] = [];
    if (pickupLat      == null) missing.push('pickupLat');
    if (pickupLng      == null) missing.push('pickupLng');
    if (destinationLat == null) missing.push('destinationLat');
    if (destinationLng == null) missing.push('destinationLng');

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required coordinate fields',
        details: `The following fields are required and were not provided: ${missing.join(', ')}`,
      });
      return;
    }

    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(destinationLat);
    const dLng = parseFloat(destinationLng);

    const invalid: string[] = [];
    if (!Number.isFinite(pLat) || pLat < -90  || pLat > 90)   invalid.push(`pickupLat (${pickupLat})`);
    if (!Number.isFinite(pLng) || pLng < -180 || pLng > 180)  invalid.push(`pickupLng (${pickupLng})`);
    if (!Number.isFinite(dLat) || dLat < -90  || dLat > 90)   invalid.push(`destinationLat (${destinationLat})`);
    if (!Number.isFinite(dLng) || dLng < -180 || dLng > 180)  invalid.push(`destinationLng (${destinationLng})`);

    if (invalid.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinate values',
        details: `The following coordinate fields have invalid values: ${invalid.join(', ')}. Latitude must be -90..90, longitude -180..180.`,
      });
      return;
    }

    // ── Route resolution (getDirections never throws — has internal haversine fallback) ──
    const directions = await getDirections(pLat, pLng, dLat, dLng);
    const distanceKm  = directions.distanceKm;
    const durationMin = directions.durationMin;

    // ── Membership tier (for surge protection + cashback) ─────────────────────
    const rideUser = await User.findById(req.user!.id, 'membershipTier membershipExpiresAt').lean();
    const membershipTier = getEffectiveTier(rideUser);

    // ── Fare estimation ───────────────────────────────────────────────────────
    let estimates;
    try {
      estimates = await estimateAllFares({
        distanceKm,
        durationMin,
        weatherMultiplier,
        trafficMultiplier,
        membershipTier,
        pickupLat: pLat,
        pickupLng: pLng,
        destinationLat: dLat,
        destinationLng: dLng,
      });
    } catch (fareErr: any) {
      console.error('[CONTROLLER] estimateAllFares failed', { error: fareErr?.message });
      res.status(500).json({
        success: false,
        message: 'Fare estimation failed',
        details: fareErr?.message ?? 'An internal error occurred while calculating fares',
      });
      return;
    }

    const responseData = { estimates, distanceKm, durationMin, routeSource: directions.source };
    console.log('FARE_ESTIMATE_RESPONSE', {
      estimateCount: estimates?.length ?? 0,
      distanceKm,
      durationMin,
      routeSource: directions.source,
    });
    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createRide = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      vehicleType,
      pickupAddress,
      destinationAddress,
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
      paymentMethod,
      scheduledAt,
    } = req.body;

    let distanceKm: number;
    let durationMin: number;

    try {
      const directions = await getDirections(pickupLat, pickupLng, destinationLat, destinationLng);
      distanceKm  = directions.distanceKm;
      durationMin = directions.durationMin;
    } catch {
      distanceKm  = calculateDistance(pickupLat, pickupLng, destinationLat, destinationLng);
      durationMin = Math.ceil((distanceKm / 22) * 60);
    }

    // Enforce vehicle-specific distance limits
    await validateVehicleDistance(vehicleType, distanceKm);

    const createUser = await User.findById(req.user!.id, 'membershipTier membershipExpiresAt').lean();
    const fareBreakdown = await estimateSingleFare(vehicleType, { distanceKm, durationMin, membershipTier: getEffectiveTier(createUser) });

    let razorpayOrderId: string | undefined;
    if (paymentMethod !== PaymentMethodEnum.CASH && paymentMethod !== PaymentMethodEnum.WALLET) {
      const order = await createRazorpayOrder(
        fareBreakdown.totalFare,
        'INR',
        `ride_${Date.now()}`,
      );
      razorpayOrderId = order.id;
    }

    const ride = await Ride.create({
      userId:             req.user!.id,
      vehicleType,
      pickupAddress,
      destinationAddress,
      pickup:             { lat: pickupLat,      lng: pickupLng      },
      destination:        { lat: destinationLat, lng: destinationLng },
      fare:               fareBreakdown.totalFare,
      surgeMultiplier:    fareBreakdown.surgeMultiplier,
      distanceKm,
      durationMin,
      paymentMethod,
      otp:                generateOTP(),
      razorpayOrderId,
      scheduledAt:        scheduledAt ? new Date(scheduledAt) : undefined,
      statusHistory:      [makeHistoryEntry(RideStatusEnum.SEARCHING, 'user')],
    });

    global.__io?.to(`drivers:${vehicleType}`).emit('new_ride_request', {
      rideId:      ride._id,
      pickup:      { address: pickupAddress,      lat: pickupLat,      lng: pickupLng      },
      destination: { address: destinationAddress, lat: destinationLat, lng: destinationLng },
      fare:        fareBreakdown.totalFare,
      vehicleType,
      surgeMultiplier: fareBreakdown.surgeMultiplier,
    });

    await createNotification({
      userId:        new mongoose.Types.ObjectId(req.user!.id),
      type:          'ride_update',
      title:         'Looking for drivers…',
      body:          `Searching for a ${vehicleType} near you`,
      data:          { rideId: (ride._id as unknown as string).toString() },
      referenceId:   (ride._id as unknown as string).toString(),
      referenceType: 'ride',
    });

    res.status(201).json({
      success: true,
      data: {
        rideId:         ride._id,
        fare:           fareBreakdown.totalFare,
        fareBreakdown,
        razorpayOrderId,
        status:         ride.status,
        otp:            ride.otp,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const getRideStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name phone vehicleNumber rating currentLocation avatarUrl')
      .lean();
    if (!ride) { next(new AppError('Ride not found', 404)); return; }
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel ───────────────────────────────────────────────────────────────────

const RIDE_CANCELLATION_FEE = 50; // ₹50 after driver assigned
const FREE_CANCEL_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const POST_ASSIGNMENT_STATUSES: Set<RideStatus> = new Set([
  RideStatusEnum.DRIVER_ASSIGNED,
  RideStatusEnum.DRIVER_ARRIVING,
  RideStatusEnum.DRIVER_ARRIVED,
]);

export const cancelRide = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!ride) { next(new AppError('Ride not found', 404)); return; }

    if (rideStatusConfigs[ride.status].isTerminal) {
      next(new AppError('Cannot cancel a ride that is already completed or cancelled', 400));
      return;
    }

    if (ride.status === RideStatusEnum.IN_PROGRESS) {
      next(new AppError('Cannot cancel a ride that has already started', 400));
      return;
    }

    // Fee logic: free within 2-min window without driver; fee after assignment
    const ageMs = Date.now() - new Date(ride.createdAt as unknown as string).getTime();
    const withinFreeWindow = ageMs <= FREE_CANCEL_WINDOW_MS && !POST_ASSIGNMENT_STATUSES.has(ride.status);
    const cancellationFee  = withinFreeWindow ? 0 : POST_ASSIGNMENT_STATUSES.has(ride.status) ? RIDE_CANCELLATION_FEE : 0;

    const now = new Date();
    ride.status             = RideStatusEnum.CANCELLED;
    ride.cancellationReason = 'user_cancelled';
    ride.cancellationNote   = req.body.reason;
    ride.cancelledBy        = 'user';
    ride.cancelledAt        = now;
    ride.cancellationFee    = cancellationFee;
    ride.statusHistory      = [
      ...(ride.statusHistory ?? []),
      makeHistoryEntry(RideStatusEnum.CANCELLED, 'user', req.body.reason),
    ];
    await ride.save();

    global.__io?.to(`ride:${ride._id}`).emit('ride_cancelled', {
      rideId:      (ride._id as unknown as string).toString(),
      cancelledBy: 'user' as const,
      reason:      req.body.reason,
    });

    res.json({ success: true, message: 'Ride cancelled', data: { cancellationFee } });
  } catch (err) {
    next(err);
  }
};

// ─── Receipt ─────────────────────────────────────────────────────────────────

export const getRideReceipt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, userId: req.user!.id })
      .populate('driverId', 'name phone vehicleNumber vehicleModel vehicleType rating avatarUrl')
      .lean();
    if (!ride) { next(new AppError('Ride not found', 404)); return; }

    const r = ride as any;
    res.json({
      success: true,
      data: {
        id:                   String(r._id),
        type:                 'ride',
        status:               r.status,
        vehicleType:          r.vehicleType,
        pickupAddress:        r.pickupAddress,
        destinationAddress:   r.destinationAddress,
        pickup:               r.pickup,
        destination:          r.destination,
        distanceKm:           r.distanceKm,
        durationMin:          r.durationMin,
        fare:                 r.fare,
        surgeMultiplier:      r.surgeMultiplier,
        paymentMethod:        r.paymentMethod,
        paymentStatus:        r.paymentStatus,
        driver:               r.driverId ?? null,
        statusHistory:        r.statusHistory ?? [],
        cancellationReason:   r.cancellationReason,
        cancelledBy:          r.cancelledBy,
        cancelledAt:          r.cancelledAt,
        cancellationFee:      r.cancellationFee,
        startedAt:            r.startedAt,
        completedAt:          r.completedAt,
        createdAt:            r.createdAt,
        tip:                  r.tip ?? 0,
        rating:               r.rating,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Rate ─────────────────────────────────────────────────────────────────────

export const rateRide = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rating, feedback, tip } = req.body;
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id, status: RideStatusEnum.COMPLETED },
      { rating, ratingFeedback: feedback, tip },
      { new: true },
    );
    if (!ride) { next(new AppError('Ride not found or not yet completed', 404)); return; }

    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        driver.rating =
          parseFloat(((driver.rating * driver.totalRatings + rating) / (driver.totalRatings + 1)).toFixed(1));
        driver.totalRatings += 1;
        await driver.save();
      }
    }

    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) {
    next(err);
  }
};

// ─── History ──────────────────────────────────────────────────────────────────

export const getRideHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page  = parseInt(String(req.query.page  ?? 1));
    const limit = parseInt(String(req.query.limit ?? 10));
    const { skip } = paginate(page, limit);

    const [rides, total] = await Promise.all([
      Ride.find({ userId: req.user!.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ride.countDocuments({ userId: req.user!.id }),
    ]);

    res.json({ success: true, ...formatPaginatedResponse(rides, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

// ─── Nearby drivers ───────────────────────────────────────────────────────────

export const getNearbyDrivers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { vehicleType } = req.query;
    const query: Record<string, unknown> = { isOnline: true, isAvailable: true };
    if (vehicleType) query.vehicleType = vehicleType;

    const drivers = await Driver.find(
      query,
      'name vehicleType vehicleNumber rating currentLocation',
    ).lean();

    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
};

// ─── ETA ─────────────────────────────────────────────────────────────────────

export const getRideETA = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      next(new AppError('originLat, originLng, destLat, destLng are required', 400)); return;
    }
    const eta = await ETAService.computeETA(
      parseFloat(String(originLat)),
      parseFloat(String(originLng)),
      parseFloat(String(destLat)),
      parseFloat(String(destLng)),
    );
    res.json({ success: true, data: eta });
  } catch (err) {
    next(err);
  }
};

// ─── Surge info ───────────────────────────────────────────────────────────────

export const getCurrentSurge = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const surge = await getSurgeContext();
    res.json({ success: true, data: surge });
  } catch (err) {
    next(err);
  }
};
