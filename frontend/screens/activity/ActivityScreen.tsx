import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ActivityStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatAddress } from '../../utils/addressFormatter';
import { useActivity } from '../../hooks/useActivityQuery';
import Header from '../../components/common/Header';
import type { ActivityItem } from '../../services/activityService';
import { ActivityService } from '../../services/activityService';

type ActivityNav = StackNavigationProp<ActivityStackParamList, 'ActivityHome'>;
type Tab = 'all' | 'ride' | 'food' | 'parcel';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'all',    label: 'All',     emoji: '📋' },
  { key: 'ride',   label: 'Rides',   emoji: '🚗' },
  { key: 'food',   label: 'Food',    emoji: '🍽️' },
  { key: 'parcel', label: 'Parcels', emoji: '📦' },
];

const CANCEL_REASONS = [
  'Changed my mind',
  'Wait time too long',
  'Ordered by mistake',
  'Found a better option',
  'Emergency',
  'Other',
];

const RIDE_NO_CANCEL   = new Set(['in_progress', 'completed', 'cancelled']);
const FOOD_NO_CANCEL   = new Set(['picked_up', 'on_the_way', 'delivered', 'cancelled', 'refunded']);
const PARCEL_NO_CANCEL = new Set(['picked_up', 'in_transit', 'near_destination', 'delivered', 'cancelled']);

const RIDE_TRACKABLE   = new Set(['searching', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'in_progress']);
const PARCEL_TRACKABLE = new Set(['searching_rider', 'rider_assigned', 'pickup_arrived', 'picked_up', 'in_transit', 'near_destination']);

function isCancellable(item: ActivityItem): boolean {
  if (item.type === 'ride')   return !RIDE_NO_CANCEL.has(item.status);
  if (item.type === 'food')   return !FOOD_NO_CANCEL.has(item.status);
  if (item.type === 'parcel') return !PARCEL_NO_CANCEL.has(item.status);
  return false;
}

function isTrackable(item: ActivityItem): boolean {
  if (item.type === 'ride')   return RIDE_TRACKABLE.has(item.status);
  if (item.type === 'parcel') return PARCEL_TRACKABLE.has(item.status);
  return false;
}

function formatCancelReason(reason?: string): string {
  const map: Record<string, string> = {
    driver_not_found: 'Rider Not Found',
    driver_cancelled: 'Driver Cancelled',
    user_cancelled:   'You Cancelled',
    timeout:          'Request Timed Out',
    payment_failed:   'Payment Failed',
    system_cancelled: 'System Cancelled',
    other:            'Cancelled',
  };
  return reason ? (map[reason] ?? reason.replace(/_/g, ' ')) : 'Cancelled';
}

function formatActivityDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date} • ${time}`;
}

function getVehicleEmoji(meta?: Record<string, unknown>): string {
  const vt = (meta?.vehicleType as string | undefined)?.toLowerCase();
  if (vt === 'bike') return '🏍️';
  if (vt === 'auto') return '🛺';
  if (vt === 'xl')   return '🚙';
  if (vt === 'premium') return '🚕';
  return '🚗';
}

function getRideStatusLine(item: ActivityItem): string {
  const price = item.amount > 0 ? formatCurrency(item.amount) : '₹0.00';
  if (item.status === 'cancelled') {
    return `${price} • ${formatCancelReason(item.cancellationReason)}`;
  }
  if (item.status === 'searching') return `${price} • Unfulfilled`;
  return price;
}

function getFoodStatusConfig(status: string): { label: string; color: string; icon: string } {
  if (status === 'delivered')  return { label: 'Delivered',  color: Colors.success,  icon: 'check-circle'    };
  if (status === 'cancelled')  return { label: 'Cancelled',  color: Colors.error,    icon: 'cancel'          };
  if (status === 'refunded')   return { label: 'Refunded',   color: Colors.warning,  icon: 'replay'          };
  if (status === 'preparing')  return { label: 'Preparing',  color: Colors.warning,  icon: 'restaurant'      };
  if (status === 'on_the_way') return { label: 'On the Way', color: Colors.primary,  icon: 'delivery-dining' };
  if (status === 'confirmed')  return { label: 'Confirmed',  color: Colors.primary,  icon: 'check'           };
  return { label: status.replace(/_/g, ' '), color: '#A0A0B8', icon: 'info' };
}

// ─── Cancel Reason Modal ──────────────────────────────────────────────────────

interface CancelModalProps {
  visible: boolean;
  type: 'ride' | 'food' | 'parcel';
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

function CancelReasonModal({ visible, type, loading, onClose, onConfirm }: CancelModalProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const typeLabel = type === 'ride' ? 'Ride' : type === 'food' ? 'Order' : 'Parcel';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={[Typography.h4, { color: colors.text, marginBottom: 4 }]}>Cancel {typeLabel}</Text>
          <Text style={[Typography.body, { color: colors.textSub, marginBottom: 20 }]}>
            Please tell us why you're cancelling
          </Text>
          {CANCEL_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonRow, {
                borderColor:     selected === reason ? Colors.primary : colors.border,
                backgroundColor: selected === reason ? `${Colors.primary}12` : colors.background,
              }]}
              onPress={() => setSelected(reason)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioOuter, { borderColor: selected === reason ? Colors.primary : colors.border }]}>
                {selected === reason && <View style={styles.radioInner} />}
              </View>
              <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>{reason}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1.5 }]}
              onPress={onClose} disabled={loading}
            >
              <Text style={[Typography.label, { color: colors.textSub }]}>Keep it</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: selected && !loading ? Colors.error : `${Colors.error}50` }]}
              onPress={() => selected && onConfirm(selected)}
              disabled={!selected || loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={[Typography.label, { color: '#fff' }]}>Cancel {typeLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Ride / Parcel Row ────────────────────────────────────────────────────────

interface RideRowProps {
  item: ActivityItem;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onRebook: () => void;
  onTrack: () => void;
  trackable: boolean;
}

function RideParcelRow({ item, colors, onPress, onRebook, onTrack, trackable }: RideRowProps) {
  const meta        = item.meta as Record<string, unknown> | undefined;
  const isParcel    = item.type === 'parcel';
  const emoji       = isParcel ? '📦' : getVehicleEmoji(meta);
  const isCancelled = item.status === 'cancelled';

  const destination = isParcel
    ? formatAddress((meta?.dropAddress as string) ?? 'Drop location')
    : formatAddress((meta?.destinationAddress as string) ?? (meta?.dropAddress as string) ?? 'Destination');

  const statusLine = getRideStatusLine(item);

  return (
    <TouchableOpacity
      onPress={trackable ? onTrack : onPress}
      activeOpacity={0.7}
      style={[styles.rideRow, { borderBottomColor: colors.border, backgroundColor: trackable ? `${Colors.primary}06` : undefined }]}
    >
      <View style={[styles.vehicleBox, { backgroundColor: trackable ? `${Colors.primary}15` : colors.card }]}>
        <Text style={styles.vehicleEmoji}>{emoji}</Text>
      </View>

      <View style={styles.rideMiddle}>
        <View style={styles.rideTopRow}>
          <Text style={[Typography.label, { color: colors.text, fontSize: 15, flex: 1 }]} numberOfLines={1}>
            {destination}
          </Text>
          {trackable && (
            <View style={[styles.liveBadge, { backgroundColor: `${Colors.success}18`, borderColor: `${Colors.success}40` }]}>
              <View style={[styles.liveDot, { backgroundColor: Colors.success }]} />
              <Text style={[Typography.captionBold, { color: Colors.success, fontSize: 10 }]}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={[Typography.caption, { color: colors.textSub, marginTop: 3 }]}>
          {formatActivityDate(item.createdAt)}
        </Text>
        <Text style={[Typography.caption, { color: isCancelled ? Colors.error : trackable ? Colors.primary : colors.textMuted, marginTop: 1 }]}>
          {trackable
            ? (isParcel ? 'Tap to track parcel →' : 'Tap to track ride →')
            : statusLine}
        </Text>
      </View>

      {trackable ? (
        <TouchableOpacity onPress={onTrack} style={[styles.trackBtn, { backgroundColor: Colors.primary }]} activeOpacity={0.8}>
          <MaterialIcons name="navigation" size={13} color="#fff" />
          <Text style={[Typography.captionBold, { color: '#fff', marginLeft: 3 }]}>Track</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onRebook} style={[styles.rebookBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
          <MaterialIcons name="replay" size={13} color={colors.textSub} />
          <Text style={[Typography.captionBold, { color: colors.textSub, marginLeft: 3 }]}>Rebook</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Food Card ────────────────────────────────────────────────────────────────

interface FoodCardProps {
  item: ActivityItem;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onReorder: () => void;
}

function FoodCard({ item, colors, onPress, onReorder }: FoodCardProps) {
  const meta           = item.meta as Record<string, unknown> | undefined;
  const restaurantName = (meta?.restaurantName as string) ?? item.title;
  const restaurantArea = (meta?.restaurantArea as string) ?? (meta?.restaurantLocation as string) ?? '';
  const foodItems      = Array.isArray(meta?.items)
    ? (meta!.items as Array<{ name: string; quantity: number }>)
    : [];
  const statusCfg      = getFoodStatusConfig(item.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.foodCard, { backgroundColor: colors.card }]}
    >
      {/* Header: image + name + status badge */}
      <View style={styles.foodHeader}>
        <View style={[styles.foodImageBox, { backgroundColor: `${Colors.primary}15` }]}>
          <Text style={styles.foodImageEmoji}>🍽️</Text>
        </View>
        <View style={styles.foodInfo}>
          <Text style={[Typography.labelLarge, { color: colors.text }]} numberOfLines={1}>
            {restaurantName}
          </Text>
          {!!restaurantArea && (
            <Text style={[Typography.caption, { color: colors.textSub, marginTop: 1 }]} numberOfLines={1}>
              {restaurantArea}
            </Text>
          )}
        </View>
        <View style={[styles.foodStatusBadge, { backgroundColor: `${statusCfg.color}18`, borderColor: `${statusCfg.color}35`, borderWidth: 1 }]}>
          <MaterialIcons name={statusCfg.icon as any} size={11} color={statusCfg.color} />
          <Text style={[styles.foodStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={[styles.foodDivider, { backgroundColor: colors.border }]} />

      {/* Items */}
      <View style={styles.foodItemsSection}>
        {foodItems.length > 0 ? (
          <>
            {foodItems.slice(0, 3).map((fi, i) => (
              <View key={i} style={styles.foodItemRow}>
                <View style={[styles.foodQtyBadge, { backgroundColor: `${Colors.primary}15` }]}>
                  <Text style={[Typography.captionBold, { color: Colors.primary, fontSize: 10 }]}>
                    {fi.quantity} X
                  </Text>
                </View>
                <Text style={[Typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {fi.name}
                </Text>
              </View>
            ))}
            {foodItems.length > 3 && (
              <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>
                +{foodItems.length - 3} more items
              </Text>
            )}
          </>
        ) : (
          <Text style={[Typography.caption, { color: colors.textSub }]}>{item.subtitle}</Text>
        )}
      </View>

      <View style={[styles.foodDivider, { backgroundColor: colors.border }]} />

      {/* Rating row */}
      <View style={styles.foodRatingRow}>
        <View style={styles.foodRatingCol}>
          <Text style={[Typography.caption, { color: colors.textSub, marginBottom: 5 }]}>Your Food Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <MaterialIcons key={s} name="star-outline" size={20} color={colors.border} style={{ marginRight: 1 }} />
            ))}
          </View>
        </View>
        <View style={[styles.foodRatingDivider, { backgroundColor: colors.border }]} />
        <View style={styles.foodRatingCol}>
          <Text style={[Typography.caption, { color: colors.textSub, marginBottom: 5 }]}>Delivery Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <MaterialIcons key={s} name="star-outline" size={20} color={colors.border} style={{ marginRight: 1 }} />
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.foodDivider, { backgroundColor: colors.border }]} />

      {/* REORDER button */}
      <TouchableOpacity
        onPress={onReorder}
        style={[styles.reorderBtn, { borderColor: Colors.primary }]}
        activeOpacity={0.75}
      >
        <Text style={[Typography.label, { color: Colors.primary, letterSpacing: 0.8 }]}>REORDER  ›</Text>
      </TouchableOpacity>

      <View style={[styles.foodDivider, { backgroundColor: colors.border }]} />

      {/* Footer */}
      <Text style={[Typography.caption, { color: colors.textSub, padding: Spacing.base, paddingVertical: Spacing.sm }]}>
        {`Ordered: ${formatActivityDate(item.createdAt)} • Bill Total: ${formatCurrency(item.amount)}`}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const { colors }     = useTheme();
  const { showDialog } = useDialog();
  const navigation     = useNavigation<ActivityNav>();
  const [tab, setTab]  = useState<Tab>('all');
  const [refreshing, setRefreshing]       = useState(false);
  const [cancelTarget, setCancelTarget]   = useState<{ id: string; type: 'ride' | 'food' | 'parcel' } | null>(null);
  const [cancelling, setCancelling]       = useState(false);

  const { data, isLoading, refetch } = useActivity(1, tab === 'all' ? undefined : tab);
  const items: ActivityItem[] = data?.data ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  async function handleCancel(reason: string) {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      let result: { cancellationFee: number };
      if (cancelTarget.type === 'ride')        result = await ActivityService.cancelRide(cancelTarget.id, reason);
      else if (cancelTarget.type === 'food')   result = await ActivityService.cancelFood(cancelTarget.id, reason);
      else                                     result = await ActivityService.cancelParcel(cancelTarget.id, reason);
      setCancelTarget(null);
      await refetch();
      if (result.cancellationFee > 0) {
        showDialog({
          title:   'Cancellation Fee',
          message: `A cancellation fee of ${formatCurrency(result.cancellationFee)} has been charged.`,
          type:    'warning',
        });
      }
    } catch (err: any) {
      showDialog({
        title:   'Could Not Cancel',
        message: err?.response?.data?.message ?? 'Please try again.',
        type:    'error',
      });
    } finally {
      setCancelling(false);
    }
  }

  function handleRebook(item: ActivityItem) {
    const meta = item.meta as Record<string, unknown> | undefined;

    if (item.type === 'ride') {
      const pickup      = (meta?.pickupAddress as string) ?? '';
      const destination = (meta?.destinationAddress as string) ?? (meta?.dropAddress as string) ?? '';
      const pickupLat   = meta?.pickupLat as number | undefined;
      const pickupLng   = meta?.pickupLng as number | undefined;
      const destLat     = meta?.destLat   as number | undefined;
      const destLng     = meta?.destLng   as number | undefined;

      if (!pickup || !destination) {
        navigation.getParent()?.navigate('RideTab' as any, { screen: 'RideHome' } as any);
        return;
      }

      showDialog({
        title:   'Rebook this ride?',
        message: `${formatAddress(pickup)} → ${formatAddress(destination)}`,
        type:    'confirm',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Rebook',
            onPress: () => navigation.getParent()?.navigate('RideTab' as any, {
              screen: 'VehicleSelect',
              params: { pickup, destination, pickupLat, pickupLng, destLat, destLng, fromRebook: true },
            } as any),
          },
        ],
      });
      return;
    }

    if (item.type === 'parcel') {
      const pickupFull   = (meta?.pickupAddress as string) ?? '';
      const dropoffFull  = (meta?.dropAddress   as string) ?? '';
      const selectedType = meta?.packageType as string | undefined;
      const pickupLat    = meta?.pickupLat as number | undefined;
      const pickupLng    = meta?.pickupLng as number | undefined;
      const dropLat      = meta?.dropLat   as number | undefined;
      const dropLng      = meta?.dropLng   as number | undefined;

      if (!pickupFull || !dropoffFull) {
        navigation.getParent()?.navigate('ParcelTab' as any, { screen: 'ParcelHome' } as any);
        return;
      }

      showDialog({
        title:   'Rebook this parcel?',
        message: `${formatAddress(pickupFull)} → ${formatAddress(dropoffFull)}`,
        type:    'confirm',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Rebook',
            onPress: () => navigation.getParent()?.navigate('ParcelTab' as any, {
              screen: 'ParcelDetails',
              params: {
                pickup:      formatAddress(pickupFull),
                pickupFull,
                dropoff:     formatAddress(dropoffFull),
                dropoffFull,
                selectedType,
                pickupLat,
                pickupLng,
                dropLat,
                dropLng,
              },
            } as any),
          },
        ],
      });
    }
  }

  function handleTrack(item: ActivityItem) {
    const meta = item.meta as Record<string, unknown> | undefined;

    if (item.type === 'ride') {
      const inProgress = ['driver_arriving', 'driver_arrived', 'in_progress'].includes(item.status);
      if (inProgress) {
        navigation.getParent()?.navigate('RideTab' as any, {
          screen: 'LiveTracking', params: { rideId: item.id },
        } as any);
      } else {
        navigation.getParent()?.navigate('RideTab' as any, {
          screen: 'DriverMatching', params: { rideId: item.id },
        } as any);
      }
    }

    if (item.type === 'parcel') {
      const pickup    = formatAddress((meta?.pickupAddress as string) ?? '');
      const dropoff   = formatAddress((meta?.dropAddress   as string) ?? '');
      const pickupLat = meta?.pickupLat as number | undefined;
      const pickupLng = meta?.pickupLng as number | undefined;
      const dropLat   = meta?.dropLat   as number | undefined;
      const dropLng   = meta?.dropLng   as number | undefined;
      const packageType   = (meta?.packageType   as string) ?? '';
      const fare          = (meta?.fare          as number) ?? 0;
      const receiverName  = (meta?.receiverName  as string) ?? '';
      const receiverPhone = (meta?.receiverPhone as string) ?? '';

      // ParcelMatching handles searching + rider_assigned (shows rider card immediately for the latter).
      // Once pickup has started, go straight to ParcelTracking.
      if (item.status === 'searching_rider' || item.status === 'rider_assigned') {
        navigation.getParent()?.navigate('ParcelTab' as any, {
          screen: 'ParcelMatching',
          params: { parcelId: item.id, pickup, dropoff, fare, packageType, receiverName, receiverPhone, pickupLat, pickupLng, dropLat, dropLng },
        } as any);
      } else {
        navigation.getParent()?.navigate('ParcelTab' as any, {
          screen: 'ParcelTracking',
          params: { parcelId: item.id, pickup, dropoff, pickupLat, pickupLng, dropLat, dropLng, packageType },
        } as any);
      }
    }
  }

  const renderItem = ({ item }: { item: ActivityItem }) => {
    function handlePress() {
      if (item.type === 'ride' || item.type === 'food' || item.type === 'parcel') {
        navigation.navigate('ActivityDetail', { id: item.id, type: item.type });
      }
    }

    if (item.type === 'food') {
      return (
        <FoodCard
          item={item}
          colors={colors}
          onPress={handlePress}
          onReorder={() => navigation.getParent()?.navigate('FoodTab' as any, { screen: 'FoodHome' } as any)}
        />
      );
    }

    if (item.type === 'ride' || item.type === 'parcel') {
      return (
        <RideParcelRow
          item={item}
          colors={colors}
          onPress={handlePress}
          onRebook={() => handleRebook(item)}
          onTrack={() => handleTrack(item)}
          trackable={isTrackable(item)}
        />
      );
    }

    // Payment or other
    return (
      <View style={[styles.rideRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.vehicleBox, { backgroundColor: colors.card }]}>
          <Text style={styles.vehicleEmoji}>💳</Text>
        </View>
        <View style={styles.rideMiddle}>
          <Text style={[Typography.label, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[Typography.caption, { color: colors.textSub, marginTop: 3 }]}>{formatActivityDate(item.createdAt)}</Text>
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 1 }]}>{formatCurrency(item.amount)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Activity" />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(({ key, label, emoji }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, {
              borderColor:     tab === key ? Colors.primary : colors.border,
              backgroundColor: tab === key ? `${Colors.primary}15` : colors.card,
            }]}
          >
            <Text style={{ fontSize: 13 }}>{emoji}</Text>
            <Text style={[Typography.captionBold, { color: tab === key ? Colors.primary : colors.textSub, marginLeft: 4 }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => `${a.type}-${a.id}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>📋</Text>
              <Text style={[Typography.h4, { color: colors.text, marginTop: 16 }]}>No activity yet</Text>
              <Text style={[Typography.body, { color: colors.textSub, marginTop: 8, textAlign: 'center' }]}>
                Your rides, parcels, and orders will appear here.
              </Text>
            </View>
          }
        />
      )}

      {cancelTarget && (
        <CancelReasonModal
          visible
          type={cancelTarget.type}
          loading={cancelling}
          onClose={() => { if (!cancelling) setCancelTarget(null); }}
          onConfirm={handleCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  tabRow:           { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: 10, gap: 8 },
  tab:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:             { paddingBottom: 40 },
  empty:            { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },

  // Ride / Parcel row
  rideRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  vehicleBox:  { width: 58, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vehicleEmoji:{ fontSize: 28 },
  rideMiddle:  { flex: 1, marginLeft: 14 },
  rideTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  liveDot:     { width: 6, height: 6, borderRadius: 3 },
  rebookBtn:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  trackBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, borderRadius: BorderRadius.full },

  // Food card
  foodCard:          { marginHorizontal: Spacing.xl, marginBottom: 14, borderRadius: BorderRadius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  foodHeader:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  foodImageBox:      { width: 56, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  foodImageEmoji:    { fontSize: 28 },
  foodInfo:          { flex: 1, marginLeft: 12 },
  foodStatusBadge:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  foodStatusText:    { fontSize: 11, fontWeight: '700', marginLeft: 3 },
  foodDivider:       { height: StyleSheet.hairlineWidth },
  foodItemsSection:  { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2 },
  foodItemRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  foodQtyBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
  foodRatingRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2 },
  foodRatingCol:     { flex: 1, alignItems: 'center' },
  foodRatingDivider: { width: StyleSheet.hairlineWidth, height: 38, marginHorizontal: 8 },
  starsRow:          { flexDirection: 'row', alignItems: 'center' },
  reorderBtn:        { alignItems: 'center', paddingVertical: 13, marginHorizontal: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 1.5 },

  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 36 },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 20 },
  reasonRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: BorderRadius.lg, borderWidth: 1.5, marginBottom: 10 },
  radioOuter:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioInner:    { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  modalActions:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn:      { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
});
