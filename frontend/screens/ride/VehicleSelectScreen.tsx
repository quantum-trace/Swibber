import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import {
  vehicleConfigs,
  surgeLevelConfigs,
  PaymentMethodEnum,
  paymentMethodConfigs,
  SurgeLevelEnum,
} from '../../constants/enums';
import type { PaymentMethod } from '../../constants/enums';
import { formatCurrency } from '../../utils/formatters';
import { formatAddress } from '../../utils/addressFormatter';
import Header from '../../components/common/Header';
import VehicleCard from '../../components/ride/VehicleCard';
import Button from '../../components/common/Button';
import { ListSkeleton } from '../../components/common/SkeletonLoader';
import { useRideEstimates, useCreateRide, useCancelRide } from '../../hooks/useRideQuery';
import { usePayment } from '../../hooks/usePayment';
import type { FareBreakdown } from '../../services/rideService';

type VehicleNav   = StackNavigationProp<RideStackParamList, 'VehicleSelect'>;
type VehicleRoute = RouteProp<RideStackParamList, 'VehicleSelect'>;

export default function VehicleSelectScreen() {
  const navigation = useNavigation<VehicleNav>();
  const { params } = useRoute<VehicleRoute>();
  const { colors } = useTheme();

  const { showDialog } = useDialog();
  const [selected, setSelected]             = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>(PaymentMethodEnum.CASH);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const SELECTABLE_PAYMENT_METHODS: PaymentMethod[] = [
    PaymentMethodEnum.CASH,
    PaymentMethodEnum.RAZORPAY,
  ];

  const hasCoords = !!(params.pickupLat && params.pickupLng && params.destLat && params.destLng);

  const { data: estimateData, isLoading, isError, refetch } = useRideEstimates(
    hasCoords
      ? {
          pickupLat:      params.pickupLat!,
          pickupLng:      params.pickupLng!,
          destinationLat: params.destLat!,
          destinationLng: params.destLng!,
        }
      : null,
  );

  const createRide = useCreateRide();
  const cancelRide = useCancelRide();
  const { openPayment, isLoading: paymentLoading } = usePayment();

  const requiresOnlinePayment = paymentMethod === PaymentMethodEnum.RAZORPAY;

  /** Map API FareBreakdown → VehicleCard-compatible shape */
  const vehicles = useMemo(() => {
    if (!estimateData?.estimates?.length) return [];

    return estimateData.estimates.map((est: FareBreakdown) => {
      const localConfig = vehicleConfigs[est.vehicleType as keyof typeof vehicleConfigs];
      return {
        type:   est.vehicleType,
        config: localConfig ?? {
          key:         est.vehicleType,
          label:       est.vehicleType,
          alias:       est.alias,
          icon:        'directions-car',
          capacity:    est.capacity,
          description: '',
          basePrice:   est.baseFare,
          pricePerKm:  est.distanceFare / Math.max(est.distanceKm, 1),
          estimatedTime: `${est.etaMin} min`,
          emoji:       '🚗',
        },
        fare:         est.totalFare,
        eta:          est.etaMin,
        surgeLevel:   est.surgeLevel,
        surgeLabel:   est.surgeLabel,
        isAvailable:  est.isAvailable,
        unavailableReason: est.unavailableReason,
        breakdown:    est,
      };
    });
  }, [estimateData]);

  const selectedVehicle = vehicles.find((v) => v.type === selected);
  const selectedBreakdown = selectedVehicle?.breakdown as FareBreakdown | undefined;

  const handleConfirm = useCallback(() => {
    if (!selected || !selectedVehicle) return;
    if (!hasCoords) {
      // No coords — skip to confirm screen with estimated fare
      navigation.navigate('RideConfirm', {
        vehicleType:  selected,
        fare:         selectedVehicle.fare,
        pickup:       params.pickup,
        destination:  params.destination,
      });
      return;
    }

    createRide.mutate(
      {
        vehicleType:        selected as any,
        pickupAddress:      params.pickup,
        destinationAddress: params.destination,
        pickupLat:          params.pickupLat!,
        pickupLng:          params.pickupLng!,
        destinationLat:     params.destLat!,
        destinationLng:     params.destLng!,
        paymentMethod:      paymentMethod as any,
      },
      {
        onSuccess: (data) => {
          if (requiresOnlinePayment && selectedVehicle) {
            openPayment({
              entityType:  'ride',
              entityId:    data.rideId,
              amount:      selectedVehicle.fare,
              description: `${formatAddress(params.pickup)} → ${formatAddress(params.destination)}`,
              onSuccess: () => navigation.navigate('DriverMatching', { rideId: data.rideId }),
              onFailure: () => {
                cancelRide.mutate({ rideId: data.rideId, reason: 'payment_failed' });
                showDialog({
                  title:   'Payment Failed',
                  message: 'Your ride booking was cancelled. Please try again.',
                  type:    'error',
                });
              },
            });
          } else {
            navigation.navigate('DriverMatching', { rideId: data.rideId });
          }
        },
        onError: (err: any) => {
          showDialog({
            title:   'Booking Failed',
            message: err?.response?.data?.message ?? 'Could not book your ride. Please try again.',
            type:    'error',
          });
        },
      },
    );
  }, [selected, selectedVehicle, hasCoords, params, paymentMethod, navigation, createRide, cancelRide, openPayment, requiresOnlinePayment, showDialog]);

  const surgeLevel = selectedBreakdown?.surgeLevel ?? (vehicles[0]?.surgeLevel ?? SurgeLevelEnum.NONE);
  const surgeConfig = surgeLevelConfigs[surgeLevel as keyof typeof surgeLevelConfigs] ?? surgeLevelConfigs[SurgeLevelEnum.NONE];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        title="Choose Ride"
        subtitle={`${formatAddress(params.pickup)} → ${formatAddress(params.destination)}`}
        onBack={params.fromRebook
          ? () => navigation.getParent()?.navigate('ActivityTab' as any)
          : undefined}
      />

      {/* Route summary card */}
      <View style={[styles.routeCard, { backgroundColor: colors.card }]}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.success }]} />
          <Text style={[Typography.label, { color: colors.text, flex: 1 }]} numberOfLines={2} ellipsizeMode="tail">
            {formatAddress(params.pickup)}
          </Text>
        </View>
        <View style={styles.vertLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={[Typography.label, { color: colors.text, flex: 1 }]} numberOfLines={2} ellipsizeMode="tail">
            {formatAddress(params.destination)}
          </Text>
        </View>

        {estimateData && (
          <View style={styles.routeMeta}>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              📍 {estimateData.distanceKm.toFixed(1)} km • ~{estimateData.durationMin} min drive
            </Text>
            {surgeConfig.key !== 'none' && (
              <View style={[styles.surgeBadge, { backgroundColor: `${surgeConfig.color}20` }]}>
                <Text style={[Typography.captionBold, { color: surgeConfig.color }]}>
                  {surgeConfig.alias}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : isError ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={32} color={Colors.error} />
            <Text style={[Typography.body, { color: colors.text, marginTop: 8, textAlign: 'center' }]}>
              Unable to calculate fare right now
            </Text>
            <Text style={[Typography.caption, { color: colors.textSub, textAlign: 'center', marginTop: 4 }]}>
              Check your connection and try again
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { borderColor: Colors.primary }]}
            >
              <MaterialIcons name="refresh" size={16} color={Colors.primary} />
              <Text style={[Typography.label, { color: Colors.primary, marginLeft: 6 }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map(({ type, config, fare, eta, surgeLevel: sl, isAvailable, unavailableReason }) => (
            <TouchableOpacity
              key={type}
              onPress={() => {
                if (!isAvailable) {
                  showDialog({ title: 'Not Available', message: unavailableReason ?? 'This vehicle is not available for this trip.', type: 'info' });
                  return;
                }
                setSelected(type);
              }}
              activeOpacity={0.8}
              style={isAvailable ? undefined : styles.unavailable}
            >
              <VehicleCard
                config={config}
                fare={fare}
                eta={eta}
                surgeConfig={surgeLevelConfigs[sl as keyof typeof surgeLevelConfigs] ?? surgeLevelConfigs.none}
                isSelected={selected === type}
                onPress={() => {
                  if (!isAvailable) return;
                  setSelected(type);
                }}
              />
              {!isAvailable && (
                <View style={[styles.unavailableBanner, { backgroundColor: `${Colors.error}12` }]}>
                  <MaterialIcons name="info-outline" size={14} color={Colors.error} />
                  <Text style={[Typography.caption, { color: Colors.error, marginLeft: 4 }]}>
                    {unavailableReason}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Fare breakdown detail */}
        {selectedBreakdown && (
          <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
            <Text style={[Typography.label, { color: colors.textSub, marginBottom: 10 }]}>
              FARE BREAKDOWN
            </Text>
            {[
              { label: 'Base fare',                                          value: selectedBreakdown.baseFare },
              { label: `Distance (${selectedBreakdown.distanceKm.toFixed(1)} km)`, value: selectedBreakdown.distanceFare },
              { label: `Time (${selectedBreakdown.durationMin} min)`,        value: selectedBreakdown.timeFare },
              ...(selectedBreakdown.waitingFare > 0
                ? [{ label: 'Waiting charge', value: selectedBreakdown.waitingFare }]
                : []),
              ...(selectedBreakdown.nightChargeAmount > 0
                ? [{ label: 'Night charge',   value: selectedBreakdown.nightChargeAmount }]
                : []),
              ...(selectedBreakdown.surgeAmount > 0
                ? [{ label: `Surge (${selectedBreakdown.surgeMultiplier.toFixed(1)}x)`, value: selectedBreakdown.surgeAmount }]
                : []),
              ...(selectedBreakdown.platformFee > 0
                ? [{ label: 'Platform fee',   value: selectedBreakdown.platformFee }]
                : []),
              ...(selectedBreakdown.gst > 0
                ? [{ label: 'GST',            value: selectedBreakdown.gst }]
                : []),
            ].map(({ label, value }) => (
              <View key={label} style={styles.breakdownRow}>
                <Text style={[Typography.body, { color: colors.textSub }]}>{label}</Text>
                <Text style={[Typography.body, { color: colors.text }]}>{formatCurrency(value)}</Text>
              </View>
            ))}
            {selectedBreakdown.memberDiscountAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[Typography.body, { color: Colors.success }]}>Member discount</Text>
                <Text style={[Typography.body, { color: Colors.success }]}>
                  -{formatCurrency(selectedBreakdown.memberDiscountAmount)}
                </Text>
              </View>
            )}
            <View style={[styles.breakdownDivider, { borderColor: colors.border }]} />
            <View style={styles.breakdownRow}>
              <Text style={[Typography.label, { color: colors.text }]}>Total</Text>
              <Text style={[Typography.h4, { color: Colors.primary }]}>
                {formatCurrency(selectedBreakdown.totalFare)}
              </Text>
            </View>
            {selectedBreakdown.minimumFareApplied && (
              <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
                Minimum fare applied
              </Text>
            )}
            {selectedBreakdown.cancellationFee > 0 && (
              <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                Cancellation fee: {formatCurrency(selectedBreakdown.cancellationFee)} after 2 min
              </Text>
            )}
          </View>
        )}

        {/* Payment method selector */}
        <TouchableOpacity
          style={[styles.paymentRow, { backgroundColor: colors.card }]}
          onPress={() => setShowPaymentModal(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={paymentMethodConfigs[paymentMethod].icon as any}
            size={20}
            color={Colors.primary}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[Typography.label, { color: colors.text }]}>
              {paymentMethodConfigs[paymentMethod].label}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {paymentMethodConfigs[paymentMethod].alias}
            </Text>
          </View>
          <Text style={[Typography.label, { color: Colors.primary }]}>Change</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Method Picker Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[Typography.h4, { color: colors.text, marginBottom: 20 }]}>
              Payment Method
            </Text>
            {SELECTABLE_PAYMENT_METHODS.map((method) => {
              const cfg = paymentMethodConfigs[method];
              const isSelected = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentOption,
                    {
                      borderColor:       isSelected ? Colors.primary : colors.border,
                      backgroundColor:   isSelected ? `${Colors.primary}10` : colors.card,
                    },
                  ]}
                  onPress={() => {
                    setPaymentMethod(method);
                    setShowPaymentModal(false);
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialIcons
                    name={cfg.icon as any}
                    size={22}
                    color={isSelected ? Colors.primary : colors.textSub}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[Typography.label, { color: isSelected ? Colors.primary : colors.text }]}>
                      {cfg.label}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted }]}>
                      {cfg.alias}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CTA */}
      <View style={[styles.footer, { backgroundColor: colors.surface, ...Shadows.md }]}>
        {selectedVehicle && (
          <View style={styles.fareSummary}>
            <View>
              <Text style={[Typography.caption, { color: colors.textSub }]}>Estimated fare</Text>
              <Text style={[Typography.h3, { color: colors.text }]}>
                {formatCurrency(selectedVehicle.fare)}
              </Text>
            </View>
            {surgeConfig.key !== 'none' && (
              <View style={[styles.surgePill, { backgroundColor: `${surgeConfig.color}20` }]}>
                <Text style={[Typography.captionBold, { color: surgeConfig.color }]}>
                  {surgeConfig.alias}
                </Text>
              </View>
            )}
          </View>
        )}
        <Button
          label={
            createRide.isPending || paymentLoading || cancelRide.isPending
              ? 'Processing…'
              : selected
              ? requiresOnlinePayment
                ? `Pay & Book ${vehicleConfigs[selected as keyof typeof vehicleConfigs]?.alias ?? selected}`
                : `Book ${vehicleConfigs[selected as keyof typeof vehicleConfigs]?.alias ?? selected}`
              : 'Select a Ride'
          }
          onPress={handleConfirm}
          isDisabled={!selected || createRide.isPending || paymentLoading || cancelRide.isPending}
          isLoading={createRide.isPending || paymentLoading || cancelRide.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  routeCard:     { margin: Spacing.base, borderRadius: BorderRadius.md, padding: Spacing.base },
  routeRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot:           { width: 10, height: 10, borderRadius: 5 },
  vertLine:      { width: 1, height: 16, backgroundColor: 'rgba(128,128,128,0.2)', marginLeft: 4, marginVertical: 4 },
  routeMeta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  surgeBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  scroll:        { paddingHorizontal: Spacing.base, paddingBottom: 16 },
  paymentRow:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.md, marginTop: 8 },
  footer:        { padding: Spacing.base, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.15)' },
  fareSummary:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  surgePill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  errorBox:      { alignItems: 'center', paddingVertical: 40 },
  retryBtn:      { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  unavailable:   { opacity: 0.6 },
  unavailableBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 6,
    borderRadius: BorderRadius.sm, marginTop: -6, marginBottom: 10,
  },
  breakdownCard: { borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: 12 },
  breakdownRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakdownDivider: { borderTopWidth: 1, marginVertical: 8 },
  // Payment modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: BorderRadius.md,
    padding: Spacing.base, marginBottom: 10,
  },
});
