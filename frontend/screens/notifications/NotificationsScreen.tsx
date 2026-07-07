import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { notificationTypeConfigs } from '../../constants/enums';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../hooks/useNotificationsQuery';
import Header from '../../components/common/Header';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotificationsScreen() {
  const { colors } = useTheme();

  const { data, isLoading, refetch } = useNotifications(1);
  const markRead    = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const [refreshing, setRefreshing] = useState(false);

  const notifications = data?.data ?? [];
  const unreadCount   = notifications.filter((n) => !n.isRead).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Notifications" />

      {notifications.length > 0 && (
        <View style={styles.topBar}>
          {unreadCount > 0 ? (
            <Text style={[Typography.caption, { color: colors.textSub }]}>{unreadCount} unread</Text>
          ) : (
            <View />
          )}
          {unreadCount > 0 && (
            <TouchableOpacity onPress={() => markAllRead.mutate()}>
              <Text style={[Typography.captionBold, { color: Colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading && !refreshing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const cfg = notificationTypeConfigs[item.type as keyof typeof notificationTypeConfigs]
              ?? { icon: 'notifications', color: Colors.primary };
            return (
              <TouchableOpacity
                onPress={() => !item.isRead && markRead.mutate(item.id)}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor:  item.isRead ? colors.card : `${Colors.primary}08`,
                    borderLeftColor:  item.isRead ? colors.border : Colors.primary,
                  },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: `${cfg.color}15` }]}>
                  <MaterialIcons name={cfg.icon as any} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.label, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[Typography.body, { color: colors.textSub, marginTop: 2 }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8, justifyContent: 'space-between' }}>
                  {!item.isRead ? (
                    <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />
                  ) : (
                    <View style={{ height: 8 }} />
                  )}
                  <TouchableOpacity
                    onPress={() => deleteNotif.mutate(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="delete-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 64 }}>🔔</Text>
              <Text style={[Typography.h4, { color: colors.text, marginTop: 16 }]}>No notifications</Text>
              <Text style={[Typography.body, { color: colors.textSub, marginTop: 8 }]}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  topBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: 10 },
  loading:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:       { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  notifCard:  { flexDirection: 'row', alignItems: 'flex-start', borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: 10, borderLeftWidth: 3 },
  iconBox:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty:      { alignItems: 'center', paddingTop: 80 },
});
