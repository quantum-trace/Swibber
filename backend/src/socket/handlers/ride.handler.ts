import { Ride } from '../../models/Ride';
import { Driver } from '../../models/Driver';
import { createNotification } from '../../services/notification.service';
import { ETAService } from '../../services/location/eta.service';
import {
  RideStatusEnum,
  CancelledByEnum,
  rideStatusConfigs,
} from '../../types/enums';
import type { RideStatus } from '../../types/enums';
import type { TypedServer, TypedSocket, SocketData } from '../socket.manager';
import { pushHistory } from '../../utils/statusHistory';
import mongoose from 'mongoose';

type SocketUser = SocketData['user'];

const RIDE_STATUS_MESSAGES: Partial<Record<RideStatus, string>> = {
  [RideStatusEnum.DRIVER_ARRIVING]: 'Your driver is on the way to pick you up',
  [RideStatusEnum.DRIVER_ARRIVED]:  'Your driver has arrived at the pickup point',
  [RideStatusEnum.IN_PROGRESS]:     'Your ride has started — enjoy the trip!',
  [RideStatusEnum.COMPLETED]:       'Your ride is complete. Hope you had a great trip!',
  [RideStatusEnum.CANCELLED]:       'Your ride has been cancelled',
};

export const registerRideHandlers = (
  io: TypedServer,
  socket: TypedSocket,
  user: SocketUser,
): void => {

  socket.on('driver_accept_ride', async (data) => {
    try {
      const ride = await Ride.findOneAndUpdate(
        { _id: data.rideId, status: { $ne: RideStatusEnum.DRIVER_ASSIGNED } },
        {
          driverId: data.driverId,
          status:   RideStatusEnum.DRIVER_ASSIGNED,
          ...pushHistory(RideStatusEnum.DRIVER_ASSIGNED, 'driver'),
        },
        { new: true },
      );
      if (!ride) return;

      socket.join(`ride:${data.rideId}`);

      const driver = await Driver.findById(data.driverId).lean();
      const d = driver as unknown as {
        _id: { toString(): string };
        name: string; phone: string; vehicleNumber: string; vehicleModel?: string;
        vehicleType: string; rating: number; currentLocation?: { lat: number; lng: number };
        avatarUrl?: string;
      };

      let etaMin = 5;
      if (d?.currentLocation && ride.pickup) {
        try {
          const eta = await ETAService.computeETA(
            d.currentLocation.lat, d.currentLocation.lng,
            ride.pickup.lat, ride.pickup.lng,
          );
          etaMin = eta.trafficDurationMin;
        } catch { /* use default */ }
      }

      io.to(`user:${ride.userId}`).emit('driver_assigned', {
        rideId:  ride._id,
        status:  RideStatusEnum.DRIVER_ASSIGNED,
        etaMin,
        driver: {
          id:              d?._id?.toString(),
          name:            d?.name,
          phone:           d?.phone,
          vehicleNumber:   d?.vehicleNumber,
          vehicleModel:    d?.vehicleModel,
          vehicleType:     d?.vehicleType,
          rating:          d?.rating,
          currentLocation: d?.currentLocation,
          avatarUrl:       d?.avatarUrl,
        },
      });

      await createNotification({
        userId: ride.userId as unknown as mongoose.Types.ObjectId,
        type:   'ride_update',
        title:  'Driver Found!',
        body:   `${d?.name ?? 'Your driver'} is on the way — ${etaMin} min ETA`,
        data:   { rideId: (ride._id as unknown as string).toString(), driverId: data.driverId },
      });
    } catch (err) { console.error('[Socket] driver_accept_ride error:', err); }
  });

  socket.on('ride_status_update', async (data) => {
    try {
      const updatePayload: Record<string, unknown> = {
        status: data.status,
        ...pushHistory(data.status, 'driver'),
      };
      if (data.status === RideStatusEnum.IN_PROGRESS) updatePayload.startedAt  = new Date();
      if (data.status === RideStatusEnum.COMPLETED)   updatePayload.completedAt = new Date();

      const ride = await Ride.findOneAndUpdate(
        { _id: data.rideId, status: { $ne: data.status } },
        updatePayload,
        { new: true },
      );
      if (!ride) return;

      io.to(`ride:${data.rideId}`).emit('ride_status_changed', {
        rideId: data.rideId,
        status: data.status,
        lat:    data.lat,
        lng:    data.lng,
      });

      if (data.status === RideStatusEnum.DRIVER_ARRIVED) {
        io.to(`user:${ride.userId}`).emit('driver_arrived_otp_prompt', {
          rideId:  data.rideId,
          message: 'Your driver has arrived. Share your OTP to start the ride.',
        });
      }

      const msgBody = RIDE_STATUS_MESSAGES[data.status];
      if (msgBody) {
        await createNotification({
          userId: ride.userId as unknown as mongoose.Types.ObjectId,
          type:   'ride_update',
          title:  'Ride Update',
          body:   msgBody,
          data:   { rideId: data.rideId, status: data.status },
        });
      }
    } catch (err) { console.error('[Socket] ride_status_update error:', err); }
  });

  socket.on('verify_ride_otp', async (data) => {
    try {
      const ride = await Ride.findById(data.rideId).select('otp userId status');
      if (!ride) {
        socket.emit('otp_verified', { success: false, error: 'Ride not found' });
        return;
      }
      if (ride.status !== RideStatusEnum.DRIVER_ARRIVED) {
        socket.emit('otp_verified', { success: false, error: 'Invalid ride state' });
        return;
      }
      if (ride.otp !== data.otp) {
        socket.emit('otp_verified', { success: false, error: 'Incorrect OTP' });
        return;
      }

      await Ride.findOneAndUpdate(
        { _id: data.rideId, status: { $ne: RideStatusEnum.IN_PROGRESS } },
        {
          status:    RideStatusEnum.IN_PROGRESS,
          startedAt: new Date(),
          ...pushHistory(RideStatusEnum.IN_PROGRESS, 'driver'),
        },
      );
      socket.emit('otp_verified', { success: true });

      const inProgressPayload = { rideId: data.rideId, status: RideStatusEnum.IN_PROGRESS } as const;
      io.to(`ride:${data.rideId}`).emit('ride_status_changed', inProgressPayload);
      io.to(`user:${ride.userId}`).emit('ride_status_changed', inProgressPayload);
    } catch (err) { console.error('[Socket] verify_ride_otp error:', err); }
  });

  socket.on('driver_location', (data) => {
    io.to(`ride:${data.rideId}`).emit('driver_moved', {
      lat:     data.lat,
      lng:     data.lng,
      heading: data.heading ?? 0,
      ts:      Date.now(),
    });
  });

  socket.on('request_eta_update', async (data) => {
    try {
      const ride = await Ride.findById(data.rideId).select('pickup destination status').lean();
      if (!ride) return;

      const r = ride as unknown as {
        pickup: { lat: number; lng: number };
        destination: { lat: number; lng: number };
        status: RideStatus;
      };

      const target = r.status === RideStatusEnum.IN_PROGRESS ? r.destination : r.pickup;
      const eta    = await ETAService.computeETA(data.driverLat, data.driverLng, target.lat, target.lng);

      io.to(`ride:${data.rideId}`).emit('eta_updated', {
        rideId:     data.rideId,
        etaMin:     eta.trafficDurationMin,
        distanceKm: eta.distanceKm,
        confidence: eta.confidenceLevel,
      });
    } catch (err) { console.error('[Socket] request_eta_update error:', err); }
  });

  socket.on('ride_message', (data) => {
    io.to(`ride:${data.rideId}`).emit('ride_message', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('cancel_ride_socket', async (data) => {
    try {
      if (user.role !== 'user') return;

      const ride = await Ride.findById(data.rideId).select('status userId driverId');
      if (!ride) return;

      if (rideStatusConfigs[ride.status].isTerminal) return;

      await Ride.findOneAndUpdate(
        { _id: data.rideId, status: { $ne: RideStatusEnum.CANCELLED } },
        {
          status:             RideStatusEnum.CANCELLED,
          cancellationReason: 'user_cancelled',
          cancellationNote:   data.reason,
          cancelledBy:        CancelledByEnum.USER,
          ...pushHistory(RideStatusEnum.CANCELLED, 'user', data.reason ?? undefined),
        },
      );

      const cancelPayload = {
        rideId:      data.rideId,
        cancelledBy: CancelledByEnum.USER,
      } as const;

      io.to(`ride:${data.rideId}`).emit('ride_cancelled', cancelPayload);

      if (ride.driverId) {
        io.to(`user:${ride.driverId.toString()}`).emit('ride_cancelled', cancelPayload);
      }

      await createNotification({
        userId: ride.userId as unknown as mongoose.Types.ObjectId,
        type:   'ride_update',
        title:  'Ride Cancelled',
        body:   'Your ride has been cancelled',
        data:   { rideId: data.rideId },
      });
    } catch (err) { console.error('[Socket] cancel_ride_socket error:', err); }
  });
};
