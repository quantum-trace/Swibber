import { useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, getSocket, joinRoom, leaveRoom, type AppSocket } from './socketManager';
import { useAuthContext } from '../context/AuthContext';

export const useSocketConnection = () => {
  const { isAuthenticated } = useAuthContext();
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    connectSocket().then((s) => { if (mounted) socketRef.current = s; });
    return () => { mounted = false; };
  }, [isAuthenticated]);

  return socketRef.current ?? getSocket();
};

export const useSocketRoom = (room: string | null) => {
  useEffect(() => {
    if (!room) return;
    joinRoom(room);
    return () => leaveRoom(room);
  }, [room]);
};

export const useSocketEvent = <T>(event: string, handler: (data: T) => void) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const listener = (data: T) => handlerRef.current(data);
    // Use type assertion for generic event subscription — event names are validated at call site
    const s = socket as unknown as Socket;
    s.on(event, listener);
    return () => { s.off(event, listener); };
  }, [event]);
};

export const useRideSocket = (rideId: string | null) => {
  useSocketRoom(rideId ? `ride:${rideId}` : null);

  const onDriverAssigned = useCallback((handler: (data: unknown) => void) => {
    useSocketEvent('driver_assigned', handler);
  }, []);

  return { onDriverAssigned };
};

export const useFoodOrderSocket = (orderId: string | null) => {
  useSocketRoom(orderId ? `food:${orderId}` : null);
};

export const useParcelSocket = (parcelId: string | null) => {
  useSocketRoom(parcelId ? `parcel:${parcelId}` : null);
};
