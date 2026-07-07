import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../services/notificationService';
import { useAppStore } from '../store/appStore';

export const useNotifications = (page = 1) =>
  useQuery({
    queryKey: ['notifications', page],
    queryFn: () => NotificationService.getNotifications(page),
    staleTime: 1000 * 30,
  });

export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: NotificationService.getUnreadCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  const { showToast } = useAppStore();
  return useMutation({
    mutationFn: NotificationService.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      showToast({ type: 'success', message: 'All notifications marked as read' });
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotificationService.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};
