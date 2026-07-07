import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Parcel } from '../models/Parcel';
import { User } from '../models/User';
import { getDirections } from '../services/maps.service';
import { calculateDistance, generateOTP, paginate, formatPaginatedResponse } from '../utils/helpers';
import {
  estimateParcelFare,
  estimateAllParcelFares,
  validateParcelVehicle,
} from '../services/parcel.engine';
import { createNotification } from '../services/notification.service';
import { createRazorpayOrder } from '../services/razorpay.service';
import { AppError } from '../utils/errors';
import { PaymentMethodEnum, ParcelStatusEnum, ParcelStatus, parcelStatusConfigs, MembershipTierEnum } from '../types/enums';
import { makeHistoryEntry } from '../utils/statusHistory';
import mongoose from 'mongoose';

// ─── Membership helpers ───────────────────────────────────────────────────────

const getEffectiveTier = (user: { membershipTier: string; membershipExpiresAt?: Date | null } | null): string => {
  if (!user) return MembershipTierEnum.BRONZE;
  if (user.membershipExpiresAt && new Date() > new Date(user.membershipExpiresAt)) return MembershipTierEnum.BRONZE;
  return user.membershipTier;
};

// ─── Estimate ─────────────────────────────────────────────────────────────────

export const estimateParcel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      pickupLat, pickupLng, dropLat, dropLng,
      weightKg, isFragile, isExpress, extraStops, dimensionCm,
    } = req.body;

    let distanceKm: number;
    let durationMin: number;

    try {
      const dir   = await getDirections(pickupLat, pickupLng, dropLat, dropLng);
      distanceKm  = dir.distanceKm;
      durationMin = dir.durationMin;
    } catch {
      distanceKm  = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
      durationMin = Math.ceil((distanceKm / 20) * 60);
    }

    const parcelEstUser = await User.findById(req.user!.id, 'membershipTier membershipExpiresAt').lean();
    const membershipTier = getEffectiveTier(parcelEstUser);

    const fareBreakdown = await estimateParcelFare({
      distanceKm, durationMin, weightKg,
      isFragile, isExpress, extraStops, dimensionCm, membershipTier,
    });

    const vehicleOptions = await estimateAllParcelFares({
      distanceKm, durationMin, weightKg,
      isFragile, isExpress, extraStops, dimensionCm, membershipTier,
    });

    res.json({
      success: true,
      data: {
        fareBreakdown,
        vehicleOptions,
        distanceKm,
        durationMin,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createParcel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      pickupAddress, dropAddress,
      pickupLat, pickupLng, dropLat, dropLng,
      packageType, weightKg, isFragile, isExpress,
      extraStops, dimensionCm,
      receiverName, receiverPhone, notes,
      paymentMethod, scheduledAt, vehicleType,
    } = req.body;

    let distanceKm: number;
    let durationMin: number;

    try {
      const dir   = await getDirections(pickupLat, pickupLng, dropLat, dropLng);
      distanceKm  = dir.distanceKm;
      durationMin = dir.durationMin;
    } catch {
      distanceKm  = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
      durationMin = Math.ceil((distanceKm / 20) * 60);
    }

    // Validate vehicle compatibility (weight / dimensions)
    if (vehicleType) {
      await validateParcelVehicle(vehicleType, weightKg, dimensionCm);
    }

    const createParcelUser = await User.findById(req.user!.id, 'membershipTier membershipExpiresAt').lean();
    const fareBreakdown = await estimateParcelFare({
      distanceKm, durationMin, weightKg,
      isFragile: isFragile ?? false,
      isExpress: isExpress ?? false,
      extraStops: extraStops ?? 0,
      dimensionCm,
      membershipTier: getEffectiveTier(createParcelUser),
    });

    let razorpayOrderId: string | undefined;
    if (paymentMethod !== PaymentMethodEnum.CASH && paymentMethod !== PaymentMethodEnum.WALLET) {
      const order = await createRazorpayOrder(
        fareBreakdown.totalFare,
        'INR',
        `parcel_${Date.now()}`,
      );
      razorpayOrderId = order.id;
    }

    const parcel = await Parcel.create({
      userId:        req.user!.id,
      pickupAddress, dropAddress,
      pickup:        { lat: pickupLat, lng: pickupLng },
      drop:          { lat: dropLat,   lng: dropLng   },
      packageType,   weightKg,
      isFragile:     isFragile ?? false,
      isExpress:     isExpress ?? false,
      receiverName,  receiverPhone, notes,
      fare:          fareBreakdown.totalFare,
      distanceKm,    durationMin,
      paymentMethod, razorpayOrderId,
      deliveryOtp:   generateOTP(),
      scheduledAt:   scheduledAt ? new Date(scheduledAt) : undefined,
      vehicleType,
      statusHistory: [makeHistoryEntry(ParcelStatusEnum.SEARCHING_RIDER, 'user')],
    });

    global.__io?.to('drivers:available').emit('new_parcel_request', {
      parcelId:    parcel._id,
      pickup:      pickupAddress,
      drop:        dropAddress,
      fare:        fareBreakdown.totalFare,
      packageType, weightKg, vehicleType,
    });

    await createNotification({
      userId:      new mongoose.Types.ObjectId(req.user!.id),
      type:        'parcel_update',
      title:       'Parcel Request Created',
      body:        'Looking for a rider to pick up your parcel',
      data:        { parcelId: (parcel._id as unknown as string).toString() },
    });

    res.status(201).json({
      success: true,
      data: {
        parcelId:    parcel._id,
        fare:        fareBreakdown.totalFare,
        fareBreakdown,
        razorpayOrderId,
        status:      parcel.status,
        deliveryOtp: parcel.deliveryOtp,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const getParcelStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('riderId', 'name phone currentLocation rating vehicleNumber')
      .lean();
    if (!parcel) { next(new AppError('Parcel not found', 404)); return; }
    res.json({ success: true, data: parcel });
  } catch (err) {
    next(err);
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export const verifyOTP = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { otp } = req.body;
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) { next(new AppError('Parcel not found', 404)); return; }
    if (parcel.deliveryOtp !== otp) { next(new AppError('Invalid delivery OTP', 400)); return; }

    parcel.status        = ParcelStatusEnum.DELIVERED;
    parcel.deliveredAt   = new Date();
    parcel.statusHistory = [
      ...(parcel.statusHistory ?? []),
      makeHistoryEntry(ParcelStatusEnum.DELIVERED, 'user'),
    ];
    await parcel.save();

    global.__io?.to(`parcel:${parcel._id}`).emit('parcel_delivered', { parcelId: parcel._id });
    res.json({ success: true, data: { verified: true, status: ParcelStatusEnum.DELIVERED } });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel ───────────────────────────────────────────────────────────────────

const PARCEL_CANCELLATION_FEE = 40; // ₹40 after rider assigned

// Statuses after which cancellation is not allowed
const PARCEL_BLOCK_CANCEL: Set<ParcelStatus> = new Set([
  ParcelStatusEnum.PICKED_UP,
  ParcelStatusEnum.IN_TRANSIT,
  ParcelStatusEnum.NEAR_DESTINATION,
  ParcelStatusEnum.DELIVERED,
  ParcelStatusEnum.CANCELLED,
]);

// Statuses that incur a fee
const PARCEL_FEE_STATUSES: Set<ParcelStatus> = new Set([
  ParcelStatusEnum.RIDER_ASSIGNED,
  ParcelStatusEnum.PICKUP_ARRIVED,
]);

export const cancelParcel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parcel = await Parcel.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!parcel) { next(new AppError('Parcel not found', 404)); return; }

    if (PARCEL_BLOCK_CANCEL.has(parcel.status)) {
      next(new AppError('Cannot cancel a parcel that has already been picked up or delivered', 400));
      return;
    }

    const cancellationFee = PARCEL_FEE_STATUSES.has(parcel.status) ? PARCEL_CANCELLATION_FEE : 0;
    const now = new Date();

    parcel.status             = ParcelStatusEnum.CANCELLED;
    parcel.cancellationReason = req.body.reason ?? 'user_cancelled';
    parcel.cancelledBy        = 'user';
    parcel.cancelledAt        = now;
    parcel.cancellationFee    = cancellationFee;
    parcel.statusHistory      = [
      ...(parcel.statusHistory ?? []),
      makeHistoryEntry(ParcelStatusEnum.CANCELLED, 'user', req.body.reason),
    ];
    await parcel.save();

    global.__io?.to(`parcel:${parcel._id}`).emit('parcel_status_changed', {
      parcelId: (parcel._id as unknown as string).toString(),
      status:   ParcelStatusEnum.CANCELLED,
    });

    await createNotification({
      userId: new mongoose.Types.ObjectId(req.user!.id),
      type:   'parcel_update',
      title:  'Parcel Cancelled',
      body:   cancellationFee > 0
        ? `A cancellation fee of ₹${cancellationFee} has been charged`
        : 'Your parcel request has been cancelled',
      data:   { parcelId: (parcel._id as unknown as string).toString() },
    });

    res.json({ success: true, message: 'Parcel cancelled', data: { cancellationFee } });
  } catch (err) {
    next(err);
  }
};

// ─── Receipt ─────────────────────────────────────────────────────────────────

export const getParcelReceipt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parcel = await Parcel.findOne({ _id: req.params.id, userId: req.user!.id })
      .populate('riderId', 'name phone vehicleNumber vehicleModel vehicleType rating avatarUrl')
      .lean();
    if (!parcel) { next(new AppError('Parcel not found', 404)); return; }

    const p = parcel as any;
    res.json({
      success: true,
      data: {
        id:                   String(p._id),
        type:                 'parcel',
        status:               p.status,
        pickupAddress:        p.pickupAddress,
        dropAddress:          p.dropAddress,
        pickup:               p.pickup,
        drop:                 p.drop,
        packageType:          p.packageType,
        weightKg:             p.weightKg,
        isFragile:            p.isFragile,
        receiverName:         p.receiverName,
        receiverPhone:        p.receiverPhone,
        notes:                p.notes,
        distanceKm:           p.distanceKm,
        durationMin:          p.durationMin,
        fare:                 p.fare,
        paymentMethod:        p.paymentMethod,
        paymentStatus:        p.paymentStatus,
        rider:                p.riderId ?? null,
        statusHistory:        p.statusHistory ?? [],
        cancellationReason:   p.cancellationReason,
        cancelledBy:          p.cancelledBy,
        cancelledAt:          p.cancelledAt,
        cancellationFee:      p.cancellationFee,
        pickedUpAt:           p.pickedUpAt,
        deliveredAt:          p.deliveredAt,
        createdAt:            p.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Rate ─────────────────────────────────────────────────────────────────────

export const rateParcel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rating, feedback } = req.body;
    const parcel = await Parcel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id, status: ParcelStatusEnum.DELIVERED },
      { rating, ratingFeedback: feedback },
      { new: true },
    );
    if (!parcel) { next(new AppError('Parcel not found or not yet delivered', 404)); return; }
    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) {
    next(err);
  }
};

// ─── History ──────────────────────────────────────────────────────────────────

export const getParcelHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page  = parseInt(String(req.query.page  ?? 1));
    const limit = parseInt(String(req.query.limit ?? 10));
    const { skip } = paginate(page, limit);

    const [parcels, total] = await Promise.all([
      Parcel.find({ userId: req.user!.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Parcel.countDocuments({ userId: req.user!.id }),
    ]);

    res.json({ success: true, ...formatPaginatedResponse(parcels, total, page, limit) });
  } catch (err) {
    next(err);
  }
};
