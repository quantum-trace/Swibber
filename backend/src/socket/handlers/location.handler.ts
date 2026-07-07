import { DriverLocationService } from '../../services/location/driver-location.service';
import { UserRoleEnum } from '../../types/enums';
import type { VehicleType } from '../../types/enums';
import type { NearbyDriverPayload } from '../types';
import type { TypedServer, TypedSocket, SocketData } from '../socket.manager';

type SocketUser = SocketData['user'];

const DRIVER_LOCATION_THROTTLE_MS = 1500;
const lastEmitTime = new Map<string, number>();

export const registerLocationHandlers = (
  io: TypedServer,
  socket: TypedSocket,
  user: SocketUser,
): void => {

  socket.on('driver:location:update', async (data) => {
    if (user.role !== UserRoleEnum.DRIVER) return;

    const now = Date.now();
    const lastTime = lastEmitTime.get(user.id) ?? 0;
    if (now - lastTime < DRIVER_LOCATION_THROTTLE_MS) return;
    lastEmitTime.set(user.id, now);

    try {
      await DriverLocationService.updateLocation(
        user.id, data.lat, data.lng, data.heading, data.speed,
      );

      io.to(`driver_location:${user.id}`).emit('driver:location:changed', {
        driverId: user.id,
        lat:      data.lat,
        lng:      data.lng,
        heading:  data.heading ?? 0,
        speed:    data.speed   ?? 0,
        ts:       now,
      });

      if (data.rideId) {
        io.to(`ride:${data.rideId}`).emit('driver_moved', {
          lat:     data.lat,
          lng:     data.lng,
          heading: data.heading ?? 0,
          ts:      now,
        });
      }
    } catch (err) { console.error('[Socket] driver:location:update error:', err); }
  });

  socket.on('passenger:subscribe:driver', (data) => {
    if (user.role !== UserRoleEnum.USER) return;
    socket.join(`driver_location:${data.driverId}`);
  });

  socket.on('passenger:unsubscribe:driver', (data) => {
    socket.leave(`driver_location:${data.driverId}`);
  });

  socket.on('nearby:drivers:request', async (data) => {
    try {
      const drivers = await DriverLocationService.getNearbyDrivers({
        lat:         data.lat,
        lng:         data.lng,
        radiusKm:    data.radiusKm ?? 5,
        vehicleType: data.vehicleType,
        maxResults:  20,
      });

      const payload: NearbyDriverPayload[] = drivers.map((d) => ({
        id:              d.driverId,
        name:            d.name,
        vehicleType:     d.vehicleType as VehicleType,
        vehicleNumber:   d.vehicleNumber,
        rating:          d.rating,
        currentLocation: { lat: d.lat, lng: d.lng },
      }));
      socket.emit('nearby:drivers:response', { drivers: payload, ts: Date.now() });
    } catch (err) { console.error('[Socket] nearby:drivers:request error:', err); }
  });

  socket.on('disconnect', () => {
    lastEmitTime.delete(user.id);
  });
};
