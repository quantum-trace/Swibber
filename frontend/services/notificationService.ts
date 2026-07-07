import { apiClient } from '../api/client';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

export const NotificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    return token;
  },

  async updateFcmToken(fcmToken: string): Promise<void> {
    await apiClient.post('/user/fcm-token', { fcmToken });
  },

  async getNotifications(page = 1): Promise<{ data: AppNotification[]; pagination: unknown }> {
    const { data } = await apiClient.get('/notifications', { params: { page } });
    const raw: any[] = data?.data ?? [];
    return {
      data: raw.map((n: any) => ({
        id:        String(n._id ?? n.id),
        type:      n.type,
        title:     n.title,
        body:      n.body,
        isRead:    n.isRead ?? false,
        data:      n.data,
        createdAt: n.createdAt,
      })),
      pagination: data?.pagination,
    };
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data.data.count;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.put('/notifications/mark-all-read');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
