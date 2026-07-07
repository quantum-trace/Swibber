import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Ride } from '../models/Ride';
import { FoodOrder } from '../models/FoodOrder';
import { Parcel } from '../models/Parcel';
import { Payment } from '../models/Payment';

interface ActivityItem {
  id: string;
  type: 'ride' | 'food' | 'parcel' | 'payment';
  title: string;
  subtitle: string;
  status: string;
  amount: number;
  createdAt: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancellationFee?: number;
  meta?: Record<string, unknown>;
}

function rideToActivity(r: any): ActivityItem {
  const pickupAddress = r.pickupAddress ?? r.pickup?.address ?? '';
  const dropAddress   = r.destinationAddress ?? r.destination?.address ?? '';
  const item: ActivityItem = {
    id:        String(r._id),
    type:      'ride',
    title:     r.status === 'cancelled' ? 'Ride Cancelled' : 'Ride Completed',
    subtitle:  `${pickupAddress} → ${dropAddress}`,
    status:    r.status ?? 'searching',
    amount:    r.fare ?? r.fareBreakdown?.totalFare ?? 0,
    createdAt: r.createdAt,
    meta: {
      vehicleType:        r.vehicleType ?? r.fareBreakdown?.vehicleType,
      pickupAddress,
      destinationAddress: dropAddress,
      dropAddress,
      distance:           r.distanceKm,
      fare:               r.fare ?? 0,
      statusHistory:      r.statusHistory ?? [],
      pickupLat:          r.pickup?.lat,
      pickupLng:          r.pickup?.lng,
      destLat:            r.destination?.lat,
      destLng:            r.destination?.lng,
    },
  };
  if (r.cancellationReason) item.cancellationReason = r.cancellationReason;
  if (r.cancelledBy)        item.cancelledBy        = r.cancelledBy;
  if (typeof r.cancellationFee === 'number') item.cancellationFee = r.cancellationFee;
  return item;
}

function foodToActivity(o: any): ActivityItem {
  const items          = Array.isArray(o.items) ? o.items : [];
  const restaurantName = o.restaurant?.name ?? o.restaurantName ?? 'Restaurant';
  const item: ActivityItem = {
    id:        String(o._id),
    type:      'food',
    title:     `Food · ${restaurantName}`,
    subtitle:  `${items.length} item${items.length !== 1 ? 's' : ''}`,
    status:    o.status ?? 'placed',
    amount:    o.totalAmount ?? o.total ?? 0,
    createdAt: o.createdAt,
    meta: {
      restaurantId:    o.restaurantId,
      restaurantName,
      total:           o.totalAmount ?? o.total ?? 0,
      statusHistory:   o.statusHistory ?? [],
    },
  };
  if (o.cancellationReason) item.cancellationReason = o.cancellationReason;
  if (o.cancelledBy)        item.cancelledBy        = o.cancelledBy;
  if (typeof o.cancellationFee === 'number') item.cancellationFee = o.cancellationFee;
  return item;
}

function parcelToActivity(p: any): ActivityItem {
  const pickupAddress = p.pickupAddress ?? p.pickup?.address ?? '';
  const dropAddress   = p.dropAddress   ?? p.drop?.address   ?? '';
  const item: ActivityItem = {
    id:        String(p._id),
    type:      'parcel',
    title:     `Parcel · ${p.packageType ?? 'Package'}`,
    subtitle:  `${pickupAddress} → ${dropAddress}`,
    status:    p.status ?? 'searching_rider',
    amount:    p.fare ?? p.fareBreakdown?.totalFare ?? 0,
    createdAt: p.createdAt,
    meta: {
      packageType:   p.packageType,
      weightKg:      p.weightKg,
      pickupAddress,
      dropAddress,
      fare:          p.fare ?? 0,
      statusHistory: p.statusHistory ?? [],
      pickupLat:     p.pickupLat ?? p.pickup?.lat,
      pickupLng:     p.pickupLng ?? p.pickup?.lng,
      dropLat:       p.dropLat   ?? p.drop?.lat,
      dropLng:       p.dropLng   ?? p.drop?.lng,
    },
  };
  if (p.cancellationReason) item.cancellationReason = p.cancellationReason;
  if (p.cancelledBy)        item.cancelledBy        = p.cancelledBy;
  if (typeof p.cancellationFee === 'number') item.cancellationFee = p.cancellationFee;
  return item;
}

function paymentToActivity(pay: any): ActivityItem {
  return {
    id:        String(pay._id),
    type:      'payment',
    title:     `Payment · ${pay.entityType}`,
    subtitle:  `₹${pay.amount}`,
    status:    pay.status,
    amount:    pay.amount,
    createdAt: pay.createdAt,
    meta:      { entityType: pay.entityType, entityId: pay.entityId },
  };
}

export const getActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page   = parseInt(String(req.query.page  ?? 1));
    const limit  = parseInt(String(req.query.limit ?? 20));
    const type   = req.query.type as string | undefined;

    const [rides, foodOrders, parcels, payments] = await Promise.all([
      (!type || type === 'ride')
        ? Ride.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
        : Promise.resolve([]),
      (!type || type === 'food')
        ? FoodOrder.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
        : Promise.resolve([]),
      (!type || type === 'parcel')
        ? Parcel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
        : Promise.resolve([]),
      (!type || type === 'payment')
        ? Payment.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
        : Promise.resolve([]),
    ]);

    // Collect IDs of entities cancelled because no rider/driver was found so their
    // pending payment entries are not shown (no charge occurred)
    const noRiderCancelledIds = new Set<string>([
      ...(rides      ?? []).filter((r: any) => r.status === 'cancelled' && r.cancellationReason === 'driver_not_found').map((r: any) => String(r._id)),
      ...(foodOrders ?? []).filter((o: any) => o.status === 'cancelled' && o.cancellationReason === 'driver_not_found').map((o: any) => String(o._id)),
      ...(parcels    ?? []).filter((p: any) => p.status === 'cancelled' && p.cancellationReason === 'driver_not_found').map((p: any) => String(p._id)),
    ]);

    const filteredPayments = (payments ?? []).filter(
      (pay: any) => !noRiderCancelledIds.has(String(pay.entityId)),
    );

    const allActivity: ActivityItem[] = [
      ...(rides       ?? []).map(rideToActivity),
      ...(foodOrders  ?? []).map(foodToActivity),
      ...(parcels     ?? []).map(parcelToActivity),
      ...filteredPayments.map(paymentToActivity),
    ].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    const skip   = (page - 1) * limit;
    const paged  = allActivity.slice(skip, skip + limit);
    const total  = allActivity.length;

    res.json({
      success:    true,
      data:       paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};
