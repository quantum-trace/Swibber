import { io, Socket } from 'socket.io-client';
import { Config } from '../constants/config';
import { StorageService } from '../services/storageService';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from './types';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket | null => socket;

export const connectSocket = async (): Promise<AppSocket> => {
  if (socket?.connected) return socket;

  // Disconnect any stale socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(Config.SOCKET_URL, {
    // Callback form: Socket.IO calls this on EVERY connection attempt
    // (including automatic reconnects), so it always reads the latest token.
    auth: async (cb: (data: { token: string | null }) => void) => {
      const token = await StorageService.getAuthToken();
      cb({ token });
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  }) as AppSocket;

  socket.on('connect', () =>
    console.log('[Socket] Connected:', socket?.id),
  );
  socket.on('disconnect', (reason) =>
    console.log('[Socket] Disconnected:', reason),
  );

  // Suppress "Invalid token" from leaking to the user — silently reconnect.
  socket.on('connect_error', (err) => {
    const msg = err.message ?? '';
    if (msg === 'Invalid token' || msg === 'Authentication required') {
      console.log('[Socket] Auth error — will retry with refreshed token');
      // Socket.IO will call the auth callback again on the next reconnect attempt,
      // picking up the fresh token that the HTTP interceptor has already stored.
    } else {
      console.error('[Socket] Connection error:', msg);
    }
  });

  socket.io.on('reconnect', (n: number) =>
    console.log('[Socket] Reconnected after', n, 'attempts'),
  );

  return socket;
};

/**
 * Force a full reconnect — called by the HTTP token refresh interceptor so the
 * socket picks up the newly stored access token immediately rather than waiting
 * for its own reconnect cycle.
 */
export const reconnectSocket = async (): Promise<void> => {
  if (!socket) return; // Socket was never connected; nothing to do.
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  await connectSocket();
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (room: string): void => {
  socket?.emit('join_room', room);
};

export const leaveRoom = (room: string): void => {
  socket?.emit('leave_room', room);
};

export const updateDriverLocation = (lat: number, lng: number): void => {
  socket?.emit('update_location', { lat, lng });
};
