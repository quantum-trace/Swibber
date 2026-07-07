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
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { apiClient } from '../../api/client';
import { Endpoints } from '../../api/endpoints';
import Header from '../../components/common/Header';

type ReceiptRoute = RouteProp<ActivityStackParamList, 'Receipt'>;
type ReceiptNav   = StackNavigationProp<ActivityStackParamList, 'Receipt'>;

interface ReceiptData {
  id: string;
  type: 'ride' | 'food' | 'parcel';
  status: string;
  // ride
  vehicleType?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  // food
  restaurant?: { name: string; imageEmoji?: string };
  items?: Array<{ name: string; quantity: number; price: number }>;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount?: number;
  // parcel
  dropAddress?: string;
  packageType?: string;
  weightKg?: number;
  receiverName?: string;
  receiverPhone?: string;
  // shared
  distanceKm?: number;
  durationMin?: number;
  fare?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  driver?: { name: string; phone?: string; vehicleNumber?: string; rating?: number } | null;
  rider?: { name: string; phone?: string; vehicleNumber?: string; rating?: number } | null;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationFee?: number;
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  createdAt?: string;
  tip?: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed:  Colors.success,
  delivered:  Colors.success,
  cancelled:  Colors.error,
  in_progress: Colors.primary,
  on_the_way: Colors.primary,
};

function statusColor(s: string): string {
  return STATUS_COLORS[s] ?? Colors.warning;
}

function formatPaymentMethod(m?: string): string {
  if (!m) return '—';
  const map: Record<string, string> = {
    upi: 'UPI', credit_card: 'Credit Card', debit_card: 'Debit Card',
    net_banking: 'Net Banking', wallet: 'SwibberPay Wallet', cash: 'Cash',
  };
  return map[m] ?? m;
}

function formatCancelReason(r?: string): string {
  if (!r) return '—';
  const map: Record<string, string> = {
    user_cancelled: 'You cancelled', driver_cancelled: 'Driver cancelled',
    driver_not_found: 'No driver found', timeout: 'Request timed out',
    payment_failed: 'Payment failed', system_cancelled: 'System cancelled',
    other: 'Other',
  };
  return map[r] ?? r.replace(/_/g, ' ');
}

function getReceiptEndpoint(id: string, type: 'ride' | 'food' | 'parcel'): string {
  if (type === 'ride')   return Endpoints.RIDE.RECEIPT(id);
  if (type === 'food')   return Endpoints.FOOD.ORDER_RECEIPT(id);
  return Endpoints.PARCEL.RECEIPT(id);
}

function buildTimeline(data: ReceiptData): Array<{ label: string; time?: string; done: boolean }> {
  return (data.statusHistory ?? []).map((h) => ({
    label: h.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    time:  h.timestamp,
    done:  true,
  }));
}

export default function ReceiptScreen() {
  const { params }    = useRoute<ReceiptRoute>();
  const navigation    = useNavigation<ReceiptNav>();
  const { colors }    = useTheme();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(getReceiptEndpoint(params.id, params.type));
        setReceipt(data?.data ?? null);
      } catch {
        setReceipt(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, params.type]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Receipt" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Receipt" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🧾</Text>
          <Text style={[Typography.h4, { color: colors.text, marginTop: 12 }]}>Receipt not found</Text>
        </View>
      </View>
    );
  }

  const isCancelled = receipt.status === 'cancelled';
  const timeline    = buildTimeline(receipt);
  const partner     = receipt.driver ?? receipt.rider;
  const partnerLabel = receipt.type === 'ride' ? 'Driver' : 'Delivery Partner';

  const typeLabel = receipt.type === 'ride' ? '🚗 Ride' :
    receipt.type === 'food' ? '🍽️ Food Order' : '📦 Parcel';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Receipt" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.headerRow}>
            <Text style={[Typography.h4, { color: colors.text }]}>{typeLabel}</Text>
            <View style={[styles.statusChip, { backgroundColor: `${statusColor(receipt.status)}18` }]}>
              <Text style={[Typography.captionBold, { color: statusColor(receipt.status), fontSize: 11 }]}>
                {receipt.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
            ID: {receipt.id}
          </Text>
          {receipt.createdAt && (
            <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {formatDate(receipt.createdAt)}
            </Text>
          )}
        </View>

        {/* Route / order info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Details</Text>

          {receipt.type === 'ride' && (
            <>
              <InfoRow icon="trip-origin" label="Pickup"      value={receipt.pickupAddress ?? '—'}      colors={colors} />
              <InfoRow icon="place"       label="Destination" value={receipt.destinationAddress ?? '—'} colors={colors} />
              {receipt.vehicleType && (
                <InfoRow icon="directions-car" label="Vehicle" value={receipt.vehicleType.toUpperCase()} colors={colors} />
              )}
            </>
          )}

          {receipt.type === 'food' && (
            <>
              <InfoRow icon="restaurant" label="Restaurant" value={receipt.restaurant?.name ?? '—'} colors={colors} />
              <InfoRow icon="place"      label="Delivery"   value={receipt.destinationAddress ?? receipt.dropAddress ?? '—'} colors={colors} />
              {(receipt.items ?? []).map((item, i) => (
                <InfoRow
                  key={i}
                  icon="fastfood"
                  label={item.name}
                  value={`×${item.quantity}  ${formatCurrency(item.price * item.quantity)}`}
                  colors={colors}
                />
              ))}
            </>
          )}

          {receipt.type === 'parcel' && (
            <>
              <InfoRow icon="trip-origin"    label="Pickup"   value={receipt.pickupAddress ?? '—'} colors={colors} />
              <InfoRow icon="place"          label="Drop-off" value={receipt.dropAddress ?? '—'}   colors={colors} />
              <InfoRow icon="inventory-2"    label="Package"  value={receipt.packageType ?? '—'}    colors={colors} />
              {receipt.weightKg != null && (
                <InfoRow icon="scale" label="Weight" value={`${receipt.weightKg} kg`} colors={colors} />
              )}
              {receipt.receiverName && (
                <InfoRow icon="person" label="Receiver" value={`${receipt.receiverName} · ${receipt.receiverPhone ?? ''}`} colors={colors} />
              )}
            </>
          )}

          {receipt.distanceKm != null && (
            <InfoRow icon="route" label="Distance" value={`${receipt.distanceKm.toFixed(1)} km`} colors={colors} />
          )}
          {receipt.durationMin != null && (
            <InfoRow icon="access-time" label="Duration" value={`${receipt.durationMin} min`} colors={colors} />
          )}
        </View>

        {/* Fare breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Payment</Text>

          {receipt.type === 'food' ? (
            <>
              <FareRow label="Subtotal"     value={formatCurrency(receipt.subtotal ?? 0)} colors={colors} />
              <FareRow label="Delivery fee" value={formatCurrency(receipt.deliveryFee ?? 0)} colors={colors} />
              {(receipt.discount ?? 0) > 0 && (
                <FareRow label="Discount" value={`-${formatCurrency(receipt.discount!)}`} colors={colors} valueColor={Colors.success} />
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <FareRow label="Total" value={formatCurrency(receipt.totalAmount ?? 0)} colors={colors} bold />
            </>
          ) : (
            <>
              <FareRow label="Fare" value={formatCurrency(receipt.fare ?? 0)} colors={colors} />
              {(receipt.tip ?? 0) > 0 && (
                <FareRow label="Tip" value={formatCurrency(receipt.tip!)} colors={colors} />
              )}
              {(receipt.cancellationFee ?? 0) > 0 && (
                <FareRow label="Cancellation fee" value={formatCurrency(receipt.cancellationFee!)} colors={colors} valueColor={Colors.error} />
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <FareRow
                label="Total charged"
                value={formatCurrency((receipt.fare ?? 0) + (receipt.tip ?? 0) + (receipt.cancellationFee ?? 0))}
                colors={colors}
                bold
              />
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="account-balance-wallet" label="Payment method" value={formatPaymentMethod(receipt.paymentMethod)} colors={colors} />
          {receipt.paymentStatus && (
            <InfoRow icon="check-circle" label="Payment status" value={receipt.paymentStatus.toUpperCase()} colors={colors} />
          )}
        </View>

        {/* Cancellation info */}
        {isCancelled && (
          <View style={[styles.card, styles.cancelCard, { backgroundColor: `${Colors.error}10`, borderColor: `${Colors.error}30` }]}>
            <Text style={[Typography.label, { color: Colors.error, marginBottom: 12 }]}>Cancellation Details</Text>
            <InfoRow icon="cancel"       label="Reason"     value={formatCancelReason(receipt.cancellationReason)} colors={colors} />
            <InfoRow icon="person"       label="Cancelled by" value={receipt.cancelledBy ?? '—'} colors={colors} />
            {receipt.cancelledAt && (
              <InfoRow icon="access-time" label="Cancelled at" value={formatDate(receipt.cancelledAt)} colors={colors} />
            )}
            {(receipt.cancellationFee ?? 0) > 0 && (
              <InfoRow icon="payments" label="Cancellation fee" value={formatCurrency(receipt.cancellationFee!)} colors={colors} />
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
                  <View style={[styles.timelineDot, { backgroundColor: i === timeline.length - 1 && isCancelled ? Colors.error : Colors.primary }]} />
                  {i < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[Typography.captionBold, { color: colors.text }]}>{step.label}</Text>
                  {step.time && (
                    <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
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
                <Text style={{ fontSize: 22 }}>{receipt.type === 'ride' ? '🚗' : receipt.type === 'parcel' ? '🏍️' : '🛵'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.labelLarge, { color: colors.text }]}>{partner.name}</Text>
                {partner.phone && (
                  <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>{partner.phone}</Text>
                )}
                {partner.vehicleNumber && (
                  <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{partner.vehicleNumber}</Text>
                )}
              </View>
              {partner.rating != null && (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color={Colors.warning} />
                  <Text style={[Typography.captionBold, { color: colors.text, marginLeft: 2 }]}>
                    {partner.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: {
  icon: string; label: string; value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon as any} size={16} color={colors.textMuted} style={{ width: 22 }} />
      <Text style={[Typography.caption, { color: colors.textSub, width: 100 }]}>{label}</Text>
      <Text style={[Typography.caption, { color: colors.text, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function FareRow({ label, value, colors, bold, valueColor }: {
  label: string; value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  bold?: boolean; valueColor?: string;
}) {
  return (
    <View style={styles.fareRow}>
      <Text style={[bold ? Typography.labelLarge : Typography.body, { color: colors.text }]}>{label}</Text>
      <Text style={[bold ? Typography.labelLarge : Typography.body, { color: valueColor ?? colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:          { padding: Spacing.xl, paddingBottom: 40, gap: 12 },
  card:            { borderRadius: BorderRadius.xl, padding: Spacing.base },
  cancelCard:      { borderWidth: 1 },
  headerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  fareRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  divider:         { height: 1, marginVertical: 8 },
  timelineRow:     { flexDirection: 'row', marginBottom: 0 },
  timelineLeft:    { alignItems: 'center', marginRight: 12, width: 16 },
  timelineDot:     { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLine:    { width: 2, flex: 1, marginTop: 4, marginBottom: 0, minHeight: 24 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  partnerRow:      { flexDirection: 'row', alignItems: 'center' },
  avatarCircle:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  ratingBadge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,149,0,0.12)' },
});
