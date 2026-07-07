import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { Driver } from '../models/Driver';
import { UserRoleEnum } from '../types/enums';
import { registerRideHandlers }     from './handlers/ride.handler';
import { registerFoodHandlers }     from './handlers/food.handler';
import { registerParcelHandlers }   from './handlers/parcel.handler';
import { registerLocationHandlers } from './handlers/location.handler';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types';

export type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type { SocketData };

export const registerSocketHandlers = (io: TypedServer): void => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) { next(new Error('Authentication required')); return; }

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: TypedSocket) => {
    const { user } = socket.data;
    console.log(`[Socket] Connected: ${user.id} (${user.role})`);

    socket.join(`user:${user.id}`);

    registerRideHandlers(io, socket, user);
    registerFoodHandlers(io, socket, user);
    registerParcelHandlers(io, socket, user);
    registerLocationHandlers(io, socket, user);

    socket.on('update_location', async (data) => {
      if (user.role === UserRoleEnum.DRIVER) {
        await Driver.findByIdAndUpdate(user.id, {
          currentLocation: { lat: data.lat, lng: data.lng },
        });
        io.to(`driver_location:${user.id}`).emit('driver:location:changed', {
          driverId: user.id,
          lat:      data.lat,
          lng:      data.lng,
          heading:  0,
          speed:    0,
          ts:       Date.now(),
        });
      }
    });

    socket.on('join_room', (room) => {
      const allowed =
        room.startsWith('ride:') ||
        room.startsWith('food:') ||
        room.startsWith('parcel:') ||
        room.startsWith('driver_location:');
      if (allowed) socket.join(room);
    });

    socket.on('leave_room', (room) => socket.leave(room));

    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${user.id}`);
      if (user.role === UserRoleEnum.DRIVER) {
        await Driver.findByIdAndUpdate(user.id, { isOnline: false, isAvailable: false });
      }
    });
  });
};
