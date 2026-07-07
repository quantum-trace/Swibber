import { Ride } from '../models/Ride';
import { FoodOrder } from '../models/FoodOrder';
import { Parcel } from '../models/Parcel';
import { createNotification } from '../services/notification.service';

const TIMEOUT_MS  = 5 * 60 * 1000; // 5 minutes
const INTERVAL_MS = 30 * 1000;      // poll every 30 seconds

async function cancelStaleRides(): Promise<void> {
  const cutoff = new Date(Date.now() - TIMEOUT_MS);
  const rides  = await Ride.find({ status: 'searching', createdAt: { $lt: cutoff } });
  for (const ride of rides) {
    ride.status             = 'cancelled';
    ride.cancellationReason = 'driver_not_found';
    ride.cancelledBy        = 'system';
    ride.cancelledAt        = new Date();
    ride.cancellationFee    = 0;
    ride.statusHistory      = [
      ...(ride.statusHistory ?? []),
      { status: 'cancelled', actor: 'system', note: 'driver_not_found', timestamp: new Date() },
    ];
    await ride.save();

    global.__io?.to(`ride:${ride._id}`).emit('ride_cancelled', {
      rideId:      String(ride._id),
      cancelledBy: 'system',
      reason:      'driver_not_found',
    });

    await createNotification({
      userId:    ride.userId,
      type:      'ride_update',
      title:     'No Driver Found',
      body:      'We couldn\'t find a driver for your ride. Your request has been cancelled.',
      data:      { rideId: String(ride._id) },
    });
  }
}

async function cancelStaleParcels(): Promise<void> {
  const cutoff  = new Date(Date.now() - TIMEOUT_MS);
  const parcels = await Parcel.find({ status: 'searching_rider', createdAt: { $lt: cutoff } });
  for (const parcel of parcels) {
    parcel.status             = 'cancelled';
    parcel.cancellationReason = 'driver_not_found';
    parcel.cancelledBy        = 'system';
    parcel.cancelledAt        = new Date();
    parcel.cancellationFee    = 0;
    parcel.statusHistory      = [
      ...(parcel.statusHistory ?? []),
      { status: 'cancelled', actor: 'system', note: 'driver_not_found', timestamp: new Date() },
    ];
    await parcel.save();

    global.__io?.to(`parcel:${parcel._id}`).emit('parcel_status_changed', {
      parcelId: String(parcel._id),
      status:   'cancelled',
    });

    await createNotification({
      userId:    parcel.userId,
      type:      'parcel_update',
      title:     'No Rider Found',
      body:      'We couldn\'t find a rider for your parcel delivery. Your request has been cancelled.',
      data:      { parcelId: String(parcel._id) },
    });
  }
}

async function cancelStaleFoodOrders(): Promise<void> {
  const cutoff = new Date(Date.now() - TIMEOUT_MS);
  const orders = await FoodOrder.find({ status: 'pending', createdAt: { $lt: cutoff } });
  for (const order of orders) {
    order.status             = 'cancelled';
    order.cancellationReason = 'driver_not_found';
    order.cancelledBy        = 'system';
    order.cancelledAt        = new Date();
    order.cancellationFee    = 0;
    order.statusHistory      = [
      ...(order.statusHistory ?? []),
      { status: 'cancelled', actor: 'system', note: 'driver_not_found', timestamp: new Date() },
    ];
    await order.save();

    global.__io?.to(`food:${order._id}`).emit('order_status_changed', {
      orderId:   String(order._id),
      status:    'cancelled',
      timestamp: new Date().toISOString(),
    });

    await createNotification({
      userId:    order.userId,
      type:      'food_update',
      title:     'No Rider Found',
      body:      'We couldn\'t find a rider for your food order. Your request has been cancelled.',
      data:      { orderId: String(order._id) },
    });
  }
}

async function runJob(): Promise<void> {
  try {
    await Promise.all([cancelStaleRides(), cancelStaleParcels(), cancelStaleFoodOrders()]);
  } catch (err) {
    console.error('[AutoCancel] Job error:', err);
  }
}

export function startAutoCancelJob(): void {
  setInterval(runJob, INTERVAL_MS);
  console.log('[AutoCancel] Started — auto-cancels unmatched requests after 5 min');
}
