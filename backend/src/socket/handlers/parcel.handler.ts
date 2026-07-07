import { Parcel } from '../../models/Parcel';
import { createNotification } from '../../services/notification.service';
import { ETAService } from '../../services/location/eta.service';
import { setCache, getCache } from '../../config/redis';
import {
  ParcelStatusEnum,
  parcelStatusConfigs,
} from '../../types/enums';
import type { ParcelStatus } from '../../types/enums';
import type { TypedServer, TypedSocket, SocketData } from '../socket.manager';
import { pushHistory } from '../../utils/statusHistory';
import mongoose from 'mongoose';

type SocketUser = SocketData['user'];

const PARCEL_LOCATION_TTL_S  = 30;
const PARCEL_ETA_TTL_S       = 60;
const LOCATION_THROTTLE_MS   = 1500;
const NEAR_DESTINATION_KM    = 0.5;

const lastEmitTimes = new Map<string, number>();

const parcelLocationKey = (id: string) => `parcel:location:${id}`;
const parcelEtaKey      = (id: string) => `parcel:eta:${id}`;

const PARCEL_STATUS_MESSAGES: Partial<Record<ParcelStatus, string>> = {
  [ParcelStatusEnum.RIDER_ASSIGNED]:   'A rider is on the way to pick up your parcel',
  [ParcelStatusEnum.PICKUP_ARRIVED]:   'Rider has arrived at the pickup location',
  [ParcelStatusEnum.PICKED_UP]:        'Rider has picked up your parcel',
  [ParcelStatusEnum.IN_TRANSIT]:       'Your parcel is on its way to you',
  [ParcelStatusEnum.NEAR_DESTINATION]: 'Your parcel is almost there!',
  [ParcelStatusEnum.DELIVERED]:        'Your parcel has been delivered!',
};

export const registerParcelHandlers = (
  io: TypedServer,
  socket: TypedSocket,
  user: SocketUser,
): void => {

  // ── Subscription management ─────────────────────────────────────────────────

  socket.on('parcel:subscribe', (data) => {
    socket.join(`parcel:${data.parcelId}`);
  });

  socket.on('parcel:unsubscribe', (data) => {
    socket.leave(`parcel:${data.parcelId}`);
  });

  // ── Rider assigns themselves to a parcel ────────────────────────────────────

  socket.on('rider_accept_parcel', async (data) => {
    try {
      const parcel = await Parcel.findOneAndUpdate(
        { _id: data.parcelId, status: { $ne: ParcelStatusEnum.RIDER_ASSIGNED } },
        {
          riderId: data.riderId,
          status:  ParcelStatusEnum.RIDER_ASSIGNED,
          ...pushHistory(ParcelStatusEnum.RIDER_ASSIGNED, 'rider'),
        },
        { new: true },
      );
      if (!parcel) return;

      socket.join(`parcel:${data.parcelId}`);

      io.to(`user:${parcel.userId}`).emit('parcel_rider_assigned', {
        parcelId: parcel._id,
        riderId:  data.riderId,
        status:   ParcelStatusEnum.RIDER_ASSIGNED,
      });

      await createNotification({
        userId: parcel.userId as unknown as mongoose.Types.ObjectId,
        type:   'parcel_update',
        title:  'Rider Assigned',
        body:   PARCEL_STATUS_MESSAGES[ParcelStatusEnum.RIDER_ASSIGNED]!,
        data:   { parcelId: (parcel._id as unknown as string).toString() },
      });
    } catch (err) { console.error('[Socket] rider_accept_parcel error:', err); }
  });

  // ── Status updates ──────────────────────────────────────────────────────────

  socket.on('parcel_status_update', async (data) => {
    try {
      const update: Record<string, unknown> = {
        status: data.status,
        ...pushHistory(data.status, 'rider'),
      };
      if (data.status === ParcelStatusEnum.PICKED_UP)  update.pickedUpAt  = new Date();
      if (data.status === ParcelStatusEnum.DELIVERED)  update.deliveredAt = new Date();

      const parcel = await Parcel.findOneAndUpdate(
        { _id: data.parcelId, status: { $ne: data.status } },
        update,
        { new: true },
      );
      if (!parcel) return;

      io.to(`parcel:${data.parcelId}`).emit('parcel_status_changed', {
        parcelId: data.parcelId,
        status:   data.status,
      });

      if (parcelStatusConfigs[data.status]?.isTerminal) {
        if (data.status === ParcelStatusEnum.DELIVERED) {
          io.to(`parcel:${data.parcelId}`).emit('parcel_delivered', { parcelId: parcel._id });
        }
        // Clear cached location + ETA on terminal status
        await Promise.all([
          setCache(parcelLocationKey(data.parcelId), null, 1),
          setCache(parcelEtaKey(data.parcelId), null, 1),
        ]);
      }

      const msgBody = PARCEL_STATUS_MESSAGES[data.status];
      if (msgBody) {
        await createNotification({
          userId: parcel.userId as unknown as mongoose.Types.ObjectId,
          type:   'parcel_update',
          title:  'Parcel Update',
          body:   msgBody,
          data:   { parcelId: data.parcelId, status: data.status },
        });
      }
    } catch (err) { console.error('[Socket] parcel_status_update error:', err); }
  });

  // ── Location + ETA updates ──────────────────────────────────────────────────

  socket.on('parcel_location_update', async (data) => {
    const now = Date.now();
    const lastTime = lastEmitTimes.get(`parcel:${data.parcelId}`) ?? 0;
    if (now - lastTime < LOCATION_THROTTLE_MS) return;
    lastEmitTimes.set(`parcel:${data.parcelId}`, now);

    try {
      const locationPayload = {
        lat:     data.lat,
        lng:     data.lng,
        heading: data.heading ?? 0,
        speed:   data.speed   ?? 0,
        ts:      now,
      };

      // Cache rider location in Redis
      await setCache(parcelLocationKey(data.parcelId), locationPayload, PARCEL_LOCATION_TTL_S);

      // Emit location to all parcel subscribers
      io.to(`parcel:${data.parcelId}`).emit('parcel_rider_location', {
        ...locationPayload,
        parcelId: data.parcelId,
      });

      // Compute ETA to parcel destination (cached at 60s)
      const cachedEta = await getCache<{
        etaMin: number; distanceKm: number; confidence: 'high' | 'medium' | 'low'; source: string;
      }>(parcelEtaKey(data.parcelId));

      if (!cachedEta) {
        const parcel = await Parcel.findById(data.parcelId).select('drop status').lean();
        if (!parcel || parcelStatusConfigs[(parcel as any).status as ParcelStatus]?.isTerminal) return;

        const dropLat: number = (parcel as any).drop?.lat;
        const dropLng: number = (parcel as any).drop?.lng;
        if (!dropLat || !dropLng) return;

        const eta = await ETAService.computeETA(data.lat, data.lng, dropLat, dropLng);

        const etaPayload = {
          etaMin:      eta.trafficDurationMin,
          distanceKm:  eta.distanceKm,
          confidence:  eta.confidenceLevel,
          source:      eta.source,
        };

        await setCache(parcelEtaKey(data.parcelId), etaPayload, PARCEL_ETA_TTL_S);

        io.to(`parcel:${data.parcelId}`).emit('parcel_eta_updated', {
          parcelId: data.parcelId,
          ...etaPayload,
        });

        // Auto-transition to near_destination when within 500 m of drop
        if (eta.distanceKm <= NEAR_DESTINATION_KM) {
          const updated = await Parcel.findOneAndUpdate(
            { _id: data.parcelId, status: ParcelStatusEnum.IN_TRANSIT },
            {
              status: ParcelStatusEnum.NEAR_DESTINATION,
              ...pushHistory(ParcelStatusEnum.NEAR_DESTINATION, 'system'),
            },
          );
          if (updated) {
            io.to(`parcel:${data.parcelId}`).emit('parcel_status_changed', {
              parcelId: data.parcelId,
              status:   ParcelStatusEnum.NEAR_DESTINATION,
            });
          }
        }
      } else {
        // Re-emit cached ETA so new subscribers get an immediate value
        io.to(`parcel:${data.parcelId}`).emit('parcel_eta_updated', {
          parcelId: data.parcelId,
          ...cachedEta,
        } as any);
      }
    } catch (err) { console.error('[Socket] parcel_location_update error:', err); }
  });

  socket.on('disconnect', () => {
    lastEmitTimes.forEach((_, key) => {
      if (key.startsWith('parcel:')) lastEmitTimes.delete(key);
    });
  });
};
