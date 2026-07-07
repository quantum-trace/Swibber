import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ActivityStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '../../utils/formatters';
import { apiClient } from '../../api/client';
import { Endpoints } from '../../api/endpoints';
import Header from '../../components/common/Header';

type DetailRoute = RouteProp<ActivityStackParamList, 'ActivityDetail'>;
type DetailNav   = StackNavigationProp<ActivityStackParamList, 'ActivityDetail'>;

interface DetailData {
  id: string;
  type: 'ride' | 'food' | 'parcel';
  status: string;
  vehicleType?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  dropAddress?: string;
  restaurant?: { name: string; imageEmoji?: string; cuisine?: string[] };
  items?: Array<{ name: string; quantity: number; price: number }>;
  packageType?: string;
  weightKg?: number;
  receiverName?: string;
  receiverPhone?: string;
  distanceKm?: number;
  durationMin?: number;
  fare?: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  driver?: { name: string; phone?: string; vehicleNumber?: string; vehicleModel?: string; vehicleType?: string; rating?: number } | null;
  rider?: { name: string; phone?: string; vehicleNumber?: string; vehicleModel?: string; vehicleType?: string; rating?: number } | null;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationFee?: number;
  startedAt?: string;
  completedAt?: string;
  deliveryAddress?: string;
  deliveredAt?: string;
  createdAt?: string;
  tip?: number;
  rating?: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed:   Colors.success,
  delivered:   Colors.success,
  cancelled:   Colors.error,
  in_progress: Colors.primary,
  on_the_way:  Colors.primary,
};

function statusColor(s: string): string {
  return STATUS_COLORS[s] ?? Colors.warning;
}

function formatPaymentMethod(m?: string): string {
  const map: Record<string, string> = {
    upi: 'UPI', credit_card: 'Credit Card', debit_card: 'Debit Card',
    net_banking: 'Net Banking', wallet: 'SwibberPay', cash: 'Cash',
  };
  return m ? (map[m] ?? m) : '—';
}

function formatCancelReason(r?: string): string {
  const map: Record<string, string> = {
    user_cancelled: 'You cancelled', driver_cancelled: 'Driver cancelled',
    driver_not_found: 'No driver found', timeout: 'Request timed out',
    payment_failed: 'Payment failed', system_cancelled: 'System cancelled',
    other: 'Other',
  };
  return r ? (map[r] ?? r.replace(/_/g, ' ')) : '—';
}

function getReceiptEndpoint(id: string, type: 'ride' | 'food' | 'parcel'): string {
  if (type === 'ride') return Endpoints.RIDE.RECEIPT(id);
  if (type === 'food') return Endpoints.FOOD.ORDER_RECEIPT(id);
  return Endpoints.PARCEL.RECEIPT(id);
}

function buildTimeline(data: DetailData): Array<{ label: string; time?: string; active: boolean; isCancelled?: boolean }> {
  return (data.statusHistory ?? []).map((h) => ({
    label:       h.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    time:        h.timestamp,
    active:      true,
    isCancelled: h.status === 'cancelled',
  }));
}

export default function ActivityDetailScreen() {
  const { params }    = useRoute<DetailRoute>();
  const navigation    = useNavigation<DetailNav>();
  const { colors }    = useTheme();
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(getReceiptEndpoint(params.id, params.type));
        setDetail(data?.data ?? null);
      } catch {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, params.type]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Trip Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Trip Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={[Typography.h4, { color: colors.text, marginTop: 12 }]}>Details not available</Text>
        </View>
      </View>
    );
  }

  const isCancelled  = detail.status === 'cancelled';
  const isCompleted  = ['completed', 'delivered'].includes(detail.status);
  const timeline     = buildTimeline(detail);
  const partner      = detail.driver ?? detail.rider;
  const partnerLabel = detail.type === 'ride' ? 'Driver' : 'Delivery Partner';
  const totalFare    = detail.totalAmount ?? detail.fare ?? 0;

  const typeEmoji = detail.type === 'ride' ? '🚗' : detail.type === 'food' ? '🍽️' : '📦';
  const typeLabel = detail.type === 'ride' ? 'Ride'
    : detail.type === 'food' ? 'Food Order'
    : 'Parcel Delivery';

  const fromAddr = detail.pickupAddress ?? (detail.restaurant?.name ? `${detail.restaurant.name}` : '—');
  const toAddr   = detail.destinationAddress ?? detail.dropAddress ?? detail.deliveryAddress ?? '—';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Trip Details" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top hero card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.heroRow}>
            <View style={[styles.emojiBox, { backgroundColor: `${Colors.primary}18` }]}>
              <Text style={{ fontSize: 28 }}>{typeEmoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.h4, { color: colors.text }]}>{typeLabel}</Text>
              {detail.createdAt && (
                <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>
                  {formatDate(detail.createdAt)}
                </Text>
              )}
            </View>
            <View style={[styles.statusChip, { backgroundColor: `${statusColor(detail.status)}18` }]}>
              <Text style={[Typography.captionBold, { color: statusColor(detail.status), fontSize: 11 }]}>
                {detail.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Route */}
          <View style={[styles.routeCard, { backgroundColor: colors.background }]}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconCol}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.captionBold, { color: colors.text }]} numberOfLines={1}>{fromAddr}</Text>
                <View style={{ height: 14 }} />
                <Text style={[Typography.captionBold, { color: colors.text }]} numberOfLines={1}>{toAddr}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={[styles.statsGrid, { backgroundColor: colors.card, borderRadius: BorderRadius.xl }]}>
          {detail.distanceKm != null && (
            <StatCell icon="route" label="Distance" value={formatDistance(detail.distanceKm)} colors={colors} />
          )}
          {detail.durationMin != null && (
            <StatCell icon="access-time" label="Duration" value={formatDuration(detail.durationMin)} colors={colors} />
          )}
          <StatCell icon="payments" label="Total Fare" value={formatCurrency(totalFare)} colors={colors} />
          <StatCell icon="account-balance-wallet" label="Payment" value={formatPaymentMethod(detail.paymentMethod)} colors={colors} />
        </View>

        {/* Cancellation alert */}
        {isCancelled && (
          <View style={[styles.card, styles.cancelAlert, { backgroundColor: `${Colors.error}10`, borderColor: `${Colors.error}30` }]}>
            <View style={styles.cancelHeader}>
              <MaterialIcons name="cancel" size={20} color={Colors.error} />
              <Text style={[Typography.label, { color: Colors.error, marginLeft: 8 }]}>Cancelled</Text>
            </View>
            <Text style={[Typography.body, { color: colors.textSub, marginTop: 6 }]}>
              {formatCancelReason(detail.cancellationReason)}
            </Text>
            {(detail.cancellationFee ?? 0) > 0 && (
              <View style={[styles.feeBadge, { backgroundColor: `${Colors.error}18` }]}>
                <Text style={[Typography.captionBold, { color: Colors.error }]}>
                  Cancellation fee: {formatCurrency(detail.cancellationFee!)}
                </Text>
              </View>
            )}
            {detail.cancelledAt && (
              <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                {formatDate(detail.cancelledAt)}
              </Text>
            )}
          </View>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[Typography.label, { color: colors.text, marginBottom: 16 }]}>Timeline</Text>
            {timeline.map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    { backgroundColor: step.isCancelled ? Colors.error : i === timeline.length - 1 ? Colors.success : Colors.primary },
                  ]} />
                  {i < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[Typography.captionBold, { color: step.isCancelled ? Colors.error : colors.text }]}>
                    {step.label}
                  </Text>
                  {step.time && (
                    <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 1 }]}>
                      {formatDate(step.time)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Driver / Partner */}
        {partner && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>{partnerLabel}</Text>
            <View style={styles.partnerRow}>
              <View style={[styles.avatarCircle, { backgroundColor: `${Colors.primary}20` }]}>
                <Text style={{ fontSize: 24 }}>
                  {detail.type === 'ride' ? '🚗' : detail.type === 'parcel' ? '🏍️' : '🛵'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.labelLarge, { color: colors.text }]}>{partner.name}</Text>
                {partner.vehicleNumber && (
                  <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>
                    {partner.vehicleNumber}
                    {partner.vehicleModel ? ` · ${partner.vehicleModel}` : ''}
                  </Text>
                )}
                {partner.phone && (
                  <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 1 }]}>{partner.phone}</Text>
                )}
              </View>
              {partner.rating != null && (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color={Colors.warning} />
                  <Text style={[Typography.captionBold, { color: colors.text, marginLeft: 3 }]}>
                    {partner.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Food items summary */}
        {detail.type === 'food' && (detail.items ?? []).length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Items Ordered</Text>
            {(detail.items ?? []).map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={[styles.qtyBadge, { backgroundColor: `${Colors.primary}15` }]}>
                  <Text style={[Typography.captionBold, { color: Colors.primary }]}>{item.quantity}×</Text>
                </View>
                <Text style={[Typography.body, { flex: 1, color: colors.text, marginLeft: 10 }]}>{item.name}</Text>
                <Text style={[Typography.body, { color: colors.textSub }]}>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <ActionButton
            icon="receipt-long"
            label="View Receipt"
            color={Colors.primary}
            onPress={() => navigation.navigate('Receipt', { id: params.id, type: params.type })}
          />
          {isCompleted && !detail.rating && (
            <ActionButton
              icon="star"
              label="Rate"
              color={Colors.warning}
              onPress={() => {
                // Navigate to appropriate rating screen based on type
                // This integrates with the existing rating flows
              }}
            />
          )}
          {detail.type === 'ride' && (
            <ActionButton
              icon="replay"
              label="Rebook"
              color={Colors.success}
              onPress={() => {
                // Navigate to ride flow with prefilled addresses
                navigation.getParent()?.navigate('RideTab' as any, {
                  screen: 'RideHome',
                } as any);
              }}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function StatCell({ icon, label, value, colors }: {
  icon: string; label: string; value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.statCell}>
      <MaterialIcons name={icon as any} size={18} color={Colors.primary} />
      <Text style={[Typography.caption, { color: colors.textSub, marginTop: 4 }]}>{label}</Text>
      <Text style={[Typography.labelLarge, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon as any} size={18} color={color} />
      <Text style={[Typography.captionBold, { color, marginLeft: 6 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:          { padding: Spacing.xl, paddingBottom: 40, gap: 12 },
  card:            { borderRadius: BorderRadius.xl, padding: Spacing.base },
  cancelAlert:     { borderWidth: 1 },
  heroRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emojiBox:        { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statusChip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  routeCard:       { borderRadius: BorderRadius.lg, padding: Spacing.sm, marginTop: 4 },
  routeRow:        { flexDirection: 'row', alignItems: 'center' },
  routeIconCol:    { width: 20, alignItems: 'center', marginRight: 10 },
  routeDot:        { width: 10, height: 10, borderRadius: 5 },
  routeLine:       { width: 2, height: 20, marginVertical: 3 },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' },
  statCell:        { width: '50%', padding: Spacing.base, alignItems: 'flex-start', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: 'rgba(128,128,128,0.15)' },
  cancelHeader:    { flexDirection: 'row', alignItems: 'center' },
  feeBadge:        { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: 8 },
  timelineRow:     { flexDirection: 'row' },
  timelineLeft:    { alignItems: 'center', marginRight: 12, width: 14 },
  timelineDot:     { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLine:    { width: 2, flex: 1, marginTop: 4, minHeight: 24 },
  timelineContent: { flex: 1, paddingBottom: 18 },
  partnerRow:      { flexDirection: 'row', alignItems: 'center' },
  avatarCircle:    { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  ratingBadge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,149,0,0.12)' },
  itemRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  qtyBadge:        { width: 30, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  actionsRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: BorderRadius.full, minWidth: 100 },
});
