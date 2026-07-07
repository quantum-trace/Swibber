import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Linking, Share,
  Modal, TouchableOpacity, Pressable, ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring,
} from 'react-native-reanimated';
import { Map, Camera, UserLocation, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useRideTracking } from '../../hooks/useRideTracking';
import { RideStatusEnum, rideStatusConfigs, VehicleTypeEnum, type VehicleType } from '../../constants/enums';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';
import DriverCard from '../../components/ride/DriverCard';
import Button from '../../components/common/Button';
import { SkeletonItem } from '../../components/common/SkeletonLoader';
import { useCancelRide } from '../../hooks/useRideQuery';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '../../utils/formatters';
import { useDialog } from '../../context/DialogContext';
import { LocationPin } from '../../components/maps/LocationPin';
import { DriverMarker } from '../../components/maps/DriverMarker';

type MatchNav   = StackNavigationProp<RideStackParamList, 'DriverMatching'>;
type MatchRoute = RouteProp<RideStackParamList, 'DriverMatching'>;

const MAP_STYLE     = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [72.877, 19.076];

const CANCEL_REASONS = [
  'Wait time too long',
  'Changed my mind',
  'Wrong destination entered',
  'Booked by mistake',
  'Emergency',
  'Other',
];

// Statuses that incur a ₹50 fee (mirrors backend logic)
const FEE_STATUSES = new Set([
  RideStatusEnum.DRIVER_ASSIGNED,
  RideStatusEnum.DRIVER_ARRIVING,
  RideStatusEnum.DRIVER_ARRIVED,
]);
const CANCEL_FEE = 50;

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  visible: boolean;
  step: 'reason' | 'fee';
  selectedReason: string | null;
  fee: number;
  cancelling: boolean;
  onSelectReason: (r: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onConfirmCancel: () => void;
  onDismiss: () => void;
}

function CancelModal({
  visible, step, selectedReason, fee, cancelling,
  onSelectReason, onContinue, onBack, onConfirmCancel, onDismiss,
}: CancelModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={cancelling ? undefined : onDismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={styles.handle} />

          {step === 'reason' && (
            <>
              <Text style={[Typography.h4, { color: colors.text, marginBottom: 4 }]}>
                Why are you cancelling?
              </Text>
              <Text style={[Typography.body, { color: colors.textSub, marginBottom: 20 }]}>
                This helps us improve the experience
              </Text>

              {CANCEL_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonRow,
                    {
                      borderColor:     selectedReason === reason ? Colors.primary : colors.border,
                      backgroundColor: selectedReason === reason ? `${Colors.primary}10` : colors.background,
                    },
                  ]}
                  onPress={() => onSelectReason(reason)}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.radio,
                    { borderColor: selectedReason === reason ? Colors.primary : colors.border },
                  ]}>
                    {selectedReason === reason && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>{reason}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1.5 }]}
                  onPress={onDismiss}
                >
                  <Text style={[Typography.label, { color: colors.textSub }]}>Keep Ride</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    { backgroundColor: selectedReason ? Colors.error : `${Colors.error}40` },
                  ]}
                  onPress={onContinue}
                  disabled={!selectedReason}
                >
                  <Text style={[Typography.label, { color: '#fff' }]}>Continue →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'fee' && (
            <>
              {/* Fee warning card */}
              <View style={[styles.feeCard, { backgroundColor: `${Colors.error}12`, borderColor: `${Colors.error}30` }]}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>⚠️</Text>
                <Text style={[Typography.h4, { color: Colors.error, marginBottom: 6 }]}>
                  Cancellation Fee Applies
                </Text>
                <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', lineHeight: 22 }]}>
                  Since a driver has already been assigned, a cancellation fee of
                </Text>
                <Text style={[Typography.h2, { color: Colors.error, marginTop: 8 }]}>
                  {formatCurrency(fee)}
                </Text>
                <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                  will be charged to your account
                </Text>
              </View>

              <View style={styles.reasonConfirm}>
                <Text style={[Typography.captionBold, { color: colors.textMuted }]}>REASON</Text>
                <Text style={[Typography.body, { color: colors.text, marginTop: 4 }]}>{selectedReason}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1.5 }]}
                  onPress={onBack}
                  disabled={cancelling}
                >
                  <Text style={[Typography.label, { color: colors.textSub }]}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: Colors.error, opacity: cancelling ? 0.7 : 1 }]}
                  onPress={onConfirmCancel}
                  disabled={cancelling}
                >
                  {cancelling
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={[Typography.label, { color: '#fff' }]}>Pay {formatCurrency(fee)} & Cancel</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DriverMatchingScreen() {
  const navigation     = useNavigation<MatchNav>();
  const { params }     = useRoute<MatchRoute>();
  const { colors }     = useTheme();
  const { showDialog } = useDialog();

  const { rideStatus, rideData, driverLocation, etaUpdate, isLoading } = useRideTracking(params.rideId);
  const cancelRide      = useCancelRide();
  const cameraRef       = useRef<CameraRef>(null);
  const qc              = useQueryClient();
  const userCancelledRef = useRef(false);

  const cardOpacity = useSharedValue(0);
  const cardY       = useSharedValue(40);

  // Pulse ring animations — RN Animated so they work inside Marker
  const ring1Anim = useRef(new RNAnimated.Value(0)).current;
  const ring2Anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const loop1 = RNAnimated.loop(
      RNAnimated.timing(ring1Anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
    );
    const loop2 = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(800),
        RNAnimated.timing(ring2Anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        RNAnimated.timing(ring2Anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ]),
    );
    loop1.start();
    loop2.start();
    return () => { loop1.stop(); loop2.stop(); };
  }, []);

  const ring1Scale   = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 0.4, 0] });
  const ring2Scale   = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 0.4, 0] });

  const isSearching    = !rideStatus || rideStatus === RideStatusEnum.SEARCHING;
  const driverAssigned = rideStatus && rideStatus !== RideStatusEnum.SEARCHING && rideStatus !== RideStatusEnum.CANCELLED;
  const isCancelled    = rideStatus === RideStatusEnum.CANCELLED;

  // Cancel modal state
  const [modalStep, setModalStep]         = useState<'hidden' | 'reason' | 'fee'>('hidden');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [cancelling, setCancelling]       = useState(false);

  const applicableFee = rideStatus && FEE_STATUSES.has(rideStatus as any) ? CANCEL_FEE : 0;

  useEffect(() => {
    if (driverAssigned) {
      cardOpacity.value = withTiming(1, { duration: 500 });
      cardY.value       = withSpring(0, { damping: 16 });
    }
  }, [driverAssigned]);

  // Zoom to pickup once rideData resolves
  useEffect(() => {
    if (rideData?.pickup) {
      cameraRef.current?.flyTo({
        center:   [rideData.pickup.lng, rideData.pickup.lat],
        zoom:     15,
        duration: 600,
      });
    }
  }, [rideData?.pickup]);

  // Auto-follow driver in real time
  useEffect(() => {
    if (driverAssigned && driverLocation) {
      cameraRef.current?.flyTo({
        center:   [driverLocation.lng, driverLocation.lat],
        zoom:     16,
        duration: 800,
      });
    }
  }, [driverLocation, driverAssigned]);

  useEffect(() => {
    if (rideStatus === RideStatusEnum.DRIVER_ARRIVING || rideStatus === RideStatusEnum.DRIVER_ARRIVED || rideStatus === RideStatusEnum.IN_PROGRESS) {
      navigation.replace('LiveTracking', { rideId: params.rideId });
    }
    if (isCancelled && !userCancelledRef.current) {
      qc.invalidateQueries({ queryKey: ['active-ride-check'] });
      showDialog({
        title:   'Ride Cancelled',
        message: 'No driver accepted your ride. Please try again.',
        type:    'error',
        buttons: [{ text: 'OK', onPress: () => navigation.popToTop() }],
      });
    }
  }, [rideStatus, isCancelled, navigation, params.rideId]);

  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ translateY: cardY.value }] }));

  function openCancelModal() {
    setSelectedReason(null);
    setModalStep('reason');
  }

  function handleReasonContinue() {
    if (!selectedReason) return;
    if (applicableFee > 0) {
      setModalStep('fee');
    } else {
      performCancel();
    }
  }

  async function performCancel() {
    if (!selectedReason) return;
    userCancelledRef.current = true;
    setCancelling(true);
    cancelRide.mutate(
      { rideId: params.rideId, reason: selectedReason },
      {
        onSuccess: () => {
          setModalStep('hidden');
          setCancelling(false);
          navigation.popToTop();
        },
        onError: () => {
          setCancelling(false);
          showDialog({ title: 'Could Not Cancel', message: 'Please try again.', type: 'error' });
        },
      },
    );
  }

  const driver      = rideData?.driver;
  const vehicleType = (rideData?.fareBreakdown?.vehicleType ?? VehicleTypeEnum.MINI) as VehicleType;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={false} title={driverAssigned ? 'Driver Found! 🎉' : 'Finding Driver...'} />

      {/* Map area */}
      <View style={styles.mapArea}>
        <Map style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE}>
          <Camera
            ref={cameraRef}
            initialViewState={{ center: DEFAULT_CENTER, zoom: 13 }}
          />
          <UserLocation visible animated />

          {/* Pulsing rings at pickup while searching; plain pin once driver assigned */}
          {rideData?.pickup && isSearching && (
            <Marker id="pulse-pickup" lngLat={[rideData.pickup.lng, rideData.pickup.lat]}>
              <View style={styles.pulseContainer}>
                <RNAnimated.View style={[
                  styles.pulseRing,
                  { borderColor: `${Colors.primary}50`, transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
                ]} />
                <RNAnimated.View style={[
                  styles.pulseRing,
                  { borderColor: `${Colors.primary}35`, transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
                ]} />
                <View style={[styles.pulseCenter, { backgroundColor: Colors.success }]} />
              </View>
            </Marker>
          )}
          {rideData?.pickup && !isSearching && (
            <LocationPin
              id="pickup"
              lat={rideData.pickup.lat}
              lng={rideData.pickup.lng}
              color={Colors.success}
            />
          )}

          {rideData?.destination && (
            <LocationPin
              id="destination"
              lat={rideData.destination.lat}
              lng={rideData.destination.lng}
              color={Colors.error}
            />
          )}

          {driverAssigned && driverLocation && rideData?.driver && (
            <DriverMarker
              driverId={rideData.driver.id}
              lat={driverLocation.lat}
              lng={driverLocation.lng}
              heading={driverLocation.heading}
              vehicleType={vehicleType}
              isActive
            />
          )}
        </Map>

      </View>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
        {isLoading && (
          <View>
            <SkeletonItem height={60} borderRadius={16} style={{ marginBottom: 12 }} />
            <SkeletonItem height={16} width="60%" style={{ marginBottom: 8 }} />
            <SkeletonItem height={12} width="40%" />
            <Button
              label="Cancel Search"
              onPress={openCancelModal}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {isSearching && !isLoading && (
          <View>
            <Text style={[Typography.h4, { color: colors.text, marginBottom: 4 }]}>Finding nearby drivers…</Text>
            <Text style={[Typography.body, { color: colors.textSub }]}>
              This usually takes under a minute. Hang tight!
            </Text>
            {rideData?.fareBreakdown && (
              <View style={[styles.farePill, { backgroundColor: `${Colors.primary}15` }]}>
                <Text style={[Typography.label, { color: Colors.primary }]}>
                  Estimated fare: {formatCurrency(rideData.fareBreakdown.totalFare)}
                </Text>
              </View>
            )}
            <Button
              label="Cancel Search"
              onPress={openCancelModal}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {driverAssigned && driver && (
          <Animated.View style={cardStyle}>
            <DriverCard
              name={driver.name ?? 'Your Driver'}
              vehicleNumber={driver.vehicleNumber ?? '—'}
              vehicleModel={driver.vehicleModel ?? '—'}
              rating={driver.rating ?? 5}
              eta={etaUpdate?.etaMin ?? rideData?.eta ?? 5}
              phoneNumber={driver.phone ?? ''}
              onCall={() => driver.phone && Linking.openURL(`tel:${driver.phone}`)}
              onChat={() => navigation.navigate('DriverChat', {
                rideId:      params.rideId,
                driverName:  driver.name ?? 'Driver',
                driverPhone: driver.phone ?? '',
              })}
              onSOS={() => Linking.openURL('tel:112')}
              onShare={async () => {
                try {
                  await Share.share({ message: `Track my Swibber ride! https://swibber.app/track/${params.rideId}` });
                } catch { /* ignore */ }
              }}
            />

            {etaUpdate && (
              <View style={[styles.etaCard, { backgroundColor: `${Colors.primary}12` }]}>
                <Text style={{ fontSize: 22 }}>⏱️</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[Typography.h4, { color: Colors.primary }]}>{etaUpdate.etaMin} min away</Text>
                  <Text style={[Typography.caption, { color: colors.textSub }]}>
                    {etaUpdate.distanceKm > 0 ? `${etaUpdate.distanceKm.toFixed(1)} km • ` : ''}
                    Confidence: {etaUpdate.confidence}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.driverActions}>
              <Button
                label="Track Live →"
                onPress={() => navigation.replace('LiveTracking', { rideId: params.rideId })}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                style={[styles.cancelChip, { borderColor: Colors.error }]}
                onPress={openCancelModal}
              >
                <Text style={[Typography.captionBold, { color: Colors.error }]}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Cancel Modal */}
      <CancelModal
        visible={modalStep !== 'hidden'}
        step={modalStep === 'hidden' ? 'reason' : modalStep}
        selectedReason={selectedReason}
        fee={applicableFee}
        cancelling={cancelling}
        onSelectReason={setSelectedReason}
        onContinue={handleReasonContinue}
        onBack={() => setModalStep('reason')}
        onConfirmCancel={performCancel}
        onDismiss={() => { if (!cancelling) setModalStep('hidden'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  mapArea:        { flex: 1, overflow: 'hidden' },
  pulseContainer: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  pulseRing:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2 },
  pulseCenter:    { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  bottomSheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 48, ...Shadows.xxl },
  farePill:     { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  etaCard:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.md, marginTop: 16 },
  driverActions:{ flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center' },
  cancelChip:   { paddingHorizontal: 16, paddingVertical: 13, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
  // Modal
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 40 },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 22 },
  reasonRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: BorderRadius.lg, borderWidth: 1.5, marginBottom: 10 },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  actions:      { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn:          { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
  feeCard:      { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', marginBottom: 20 },
  reasonConfirm:{ padding: Spacing.base, borderRadius: BorderRadius.md, backgroundColor: 'transparent', marginBottom: 8 },
});
