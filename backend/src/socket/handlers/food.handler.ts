import { FoodOrder } from '../../models/FoodOrder';
import { createNotification } from '../../services/notification.service';
import {
  OrderStatusEnum,
  orderStatusConfigs,
} from '../../types/enums';
import type { OrderStatus } from '../../types/enums';
import type { TypedServer, TypedSocket, SocketData } from '../socket.manager';
import { pushHistory } from '../../utils/statusHistory';
import type { HistoryActor } from '../../utils/statusHistory';
import mongoose from 'mongoose';

type SocketUser = SocketData['user'];

const ORDER_STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  [OrderStatusEnum.CONFIRMED]:  'Restaurant confirmed your order',
  [OrderStatusEnum.PREPARING]:  'Your food is being prepared',
  [OrderStatusEnum.PICKED_UP]:  'Rider picked up your order',
  [OrderStatusEnum.ON_THE_WAY]: 'Your order is on the way',
  [OrderStatusEnum.DELIVERED]:  'Your order has been delivered!',
};

function foodActor(status: string): HistoryActor {
  if (status === OrderStatusEnum.CONFIRMED || status === OrderStatusEnum.PREPARING) return 'restaurant';
  return 'rider';
}

export const registerFoodHandlers = (
  io: TypedServer,
  socket: TypedSocket,
  user: SocketUser,
): void => {

  socket.on('update_order_status', async (data) => {
    try {
      const actor = foodActor(data.status);
      const update: Record<string, unknown> = {
        status: data.status,
        ...pushHistory(data.status, actor),
      };
      if (data.riderId) update.riderId = data.riderId;

      if (data.status === OrderStatusEnum.CONFIRMED)  update.confirmedAt = new Date();
      if (data.status === OrderStatusEnum.PREPARING)  update.preparedAt  = new Date();
      if (data.status === OrderStatusEnum.PICKED_UP)  update.pickedUpAt  = new Date();
      if (data.status === OrderStatusEnum.DELIVERED)  update.deliveredAt = new Date();

      const order = await FoodOrder.findOneAndUpdate(
        { _id: data.orderId, status: { $ne: data.status } },
        update,
        { new: true },
      );
      if (!order) return;

      socket.join(`food:${data.orderId}`);
      io.to(`food:${data.orderId}`).emit('order_status_changed', {
        orderId:   data.orderId,
        status:    data.status,
        timestamp: new Date(),
      });

      const msgBody = ORDER_STATUS_MESSAGES[data.status];
      if (msgBody) {
        await createNotification({
          userId: order.userId as unknown as mongoose.Types.ObjectId,
          type:   'food_update',
          title:  'Order Update',
          body:   msgBody,
          data:   { orderId: data.orderId, status: data.status },
        });
      }
    } catch (err) { console.error('[Socket] update_order_status error:', err); }
  });

  socket.on('rider_location_update', (data) => {
    io.to(`food:${data.orderId}`).emit('rider_location', {
      lat:     data.lat,
      lng:     data.lng,
      orderId: data.orderId,
    });
  });
};
