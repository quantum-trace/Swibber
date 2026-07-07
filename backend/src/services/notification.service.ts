import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { sendPushNotification, sendMulticastPush } from '../config/firebase';
import mongoose from 'mongoose';

export const createNotification = async (params: {
  userId: mongoose.Types.ObjectId | string;
  type: 'ride_update' | 'food_update' | 'parcel_update' | 'promo' | 'system' | 'payment' | 'reward';
  title: string;
  body: string;
  data?: Record<string, string>;
  referenceId?: string;
  referenceType?: string;
}): Promise<void> => {
  const notification = await Notification.create(params);

  const user = await User.findById(params.userId).lean();
  if (user?.fcmToken && user.settings.notifications) {
    await sendPushNotification(user.fcmToken, { title: params.title, body: params.body }, params.data);
  }

  const io = global.__io;
  if (io) {
    io.to(`user:${params.userId}`).emit('notification', {
      id: notification._id,
      ...params,
      isRead: false,
      createdAt: notification.createdAt,
    });
  }
};

export const sendBulkNotification = async (params: {
  userIds: mongoose.Types.ObjectId[];
  type: 'promo' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> => {
  const notifications = params.userIds.map((userId) => ({
    userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data,
  }));
  await Notification.insertMany(notifications);

  const users = await User.find({ _id: { $in: params.userIds }, 'settings.notifications': true }).lean();
  const tokens = users.map((u) => u.fcmToken).filter(Boolean) as string[];
  if (tokens.length > 0) {
    await sendMulticastPush(tokens, { title: params.title, body: params.body }, params.data);
  }
};
