import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Linking, Share, Platform, TouchableOpacity,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  createAnimatedComponent,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useRideTracking } from '../../hooks/useRideTracking';
import { useDirections } from '../../hooks/useDirections';
import { useNearbyDrivers } from '../../hooks/useNearbyDrivers';
import {
  RideStatusEnum, rideStatusConfigs, type RideStatus, type VehicleType,
} from '../../constants/enums';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { RideMap, type RideMapRef } from '../../components/maps/RideMap';
import { RideStatusCard } from '../../components/ride/RideStatusCard';
import { OTPVerificationCard } from '../../components/ride/OTPVerificationCard';
import DriverCard from '../../components/ride/DriverCard';
import Button from '../../components/common/Button';
import { useCancelRide } from '../../hooks/useRideQuery';
import { formatCurrency } from '../../utils/formatters';

const AnimatedTouchable = createAnimatedComponent(TouchableOpacity);

type TrackNav   = StackNavigationProp<RideStackParamList, 'LiveTracking'>;
type TrackRoute = RouteProp<RideStackParamList, 'LiveTracking'>;

const SHEET_HEIGHTS: Partial<Record<RideStatus, number>> = {
  searching:       80,
  driver_assigned: 220,
  driver_arriving: 260,
  driver_arrived:  310,
  in_progress:     180,
  completed:       120,
  cancelled:       80,
};

export default function LiveTrackingScreen() {
  const navigation = useNavigation<TrackNav>();
  const { params }  = useRoute<TrackRoute>();
  const { colors }  = useTheme();
  const insets      = useSafeAreaInsets();

  const { rideStatus, rideData, driverLocation, etaUpdate, isLoading, isTerminal } =
    useRideTracking(params.rideId);

  const cancelRide     = useCancelRide();
  const { showDialog } = useDialog();
  const mapRef         = useRef<RideMapRef>(null);

  const ridePickup = rideData?.pickup ?? null;
  const rideDest   = rideData?.destination ?? null;

  const routeOrigin = rideStatus === RideStatusEnum.IN_PROGRESS && driverLocation
    ? { lat: driverLocation.lat, lng: driverLocation.lng }
    : ridePickup;

  const { route } = useDirections(routeOrigin, rideDest);

  const sheetHeight = useSharedValue(SHEET_HEIGHTS.searching ?? 80);
  const sheetStyle  = useAnimatedStyle(() => ({ height: sheetHeight.value }));
  const fabStyle    = useAnimatedStyle(() => ({ bottom: sheetHeight.value + 16 }));

  useEffect(() => {
    if (rideStatus) {
      sheetHeight.value = withSpring(SHEET_HEIGHTS[rideStatus] ?? 200, { damping: 18, stiffness: 200 });
    }
  }, [rideStatus]);

  useEffect(() => {
    if (rideStatus === RideStatusEnum.COMPLETED) {
      const fare = rideData?.fare ?? rideData?.fareBreakdown?.totalFare ?? 0;
      const dist = (rideData?.fareBreakdown?.distanceKm ?? 0).toFixed(1) + ' km';
      const dur  = (rideData?.fareBreakdown?.durationMin ?? 0) + ' min';
      setTimeout(() => {
        navigation.replace('RideComplete', { rideId: params.rideId, fare, distance: dist, duration: dur });
      }, 1500);
    }
    if (rideStatus === RideStatusEnum.CANCELLED) {
      showDialog({
        title:   'Ride Cancelled',
        message: 'Your ride has been cancelled.',
        type:    'error',
        buttons: [{ text: 'OK', onPress: () => navigation.popToTop() }],
      });
    }
  }, [rideStatus, rideData, navigation, params.rideId]);

  useEffect(() => {
    if (driverLocation && mapRef.current) {
      if (rideStatus === RideStatusEnum.IN_PROGRESS) {
        mapRef.current.animateToRegion({ lat: driverLocation.lat, lng: driverLocation.lng });
      }
    }
  }, [driverLocation, rideStatus]);

  const handleCancel = useCallback(() => {
    showDialog({
      title:   'Cancel Ride?',
      message: 'Cancellation fees may apply.',
      type:    'confirm',
      buttons: [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: () => {
            cancelRide.mutate(
              { rideId: params.rideId, reason: 'User cancelled during tracking' },
              {
                onSuccess: () => navigation.popToTop(),
                onError:   () => showDialog({ title: 'Could Not Cancel', message: 'Please try again or contact support.', type: 'error' }),
              },
            );
          },
        },
      ],
    });
  }, [cancelRide, navigation, params.rideId, showDialog]);

  const driver        = rideData?.driver;
  const vehicleType   = (rideData?.fareBreakdown?.vehicleType ?? 'mini') as VehicleType;
  const statusConfig  = rideStatus ? rideStatusConfigs[rideStatus] : null;
  const showOTP       = rideStatus === RideStatusEnum.DRIVER_ARRIVED && rideData?.otp;
  const CANCELLABLE_STATES = new Set<RideStatus>([
    RideStatusEnum.SEARCHING,
    RideStatusEnum.DRIVER_ASSIGNED,
    RideStatusEnum.DRIVER_ARRIVING,
  ]);
  const isCancellable = rideStatus && CANCELLABLE_STATES.has(rideStatus);

  const activeDriverForMap = driverLocation && driver
    ? { driverId: driver.id, vehicleType, location: driverLocation }
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full-screen map */}
      <RideMap
        ref={mapRef}
        pickup={ridePickup}
        destination={rideDest}
        route={route}
        activeDriver={activeDriverForMap}
        showNearby={rideStatus === RideStatusEnum.SEARCHING}
      />

      {/* Status badge */}
      {statusConfig && (
        <View style={[styles.statusBadge, { backgroundColor: colors.surface, ...Shadows.md }, { top: insets.top + 60 }]}>
          <MaterialIcons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
          <Text style={[Typography.captionBold, { color: statusConfig.color, marginLeft: 6 }]}>
            {statusConfig.alias}
          </Text>
          {etaUpdate && rideStatus !== RideStatusEnum.COMPLETED && rideStatus !== RideStatusEnum.CANCELLED && (
            <Text style={[Typography.captionBold, { color: Colors.primary, marginLeft: 8 }]}>
              {etaUpdate.etaMin} min
            </Text>
          )}
        </View>
      )}

      {/* Locate-to-driver FAB — bottom tracks the animated sheet height */}
      {driverLocation && (
        <AnimatedTouchable
          style={[styles.locateFab, { backgroundColor: colors.card, ...Shadows.md }, fabStyle]}
          onPress={() => mapRef.current?.fitToDriver()}
        >
          <MaterialIcons name="navigation" size={22} color={Colors.primary} />
        </AnimatedTouchable>
      )}

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { backgroundColor: colors.surface }, sheetStyle]}>
        <View style={styles.sheetHandle} />

        {/* Driver card (shows once assigned) */}
        {driver && rideStatus !== RideStatusEnum.SEARCHING && (
          <View style={styles.driverCardWrap}>
            <DriverCard
              name={driver.name ?? 'Your Driver'}
              vehicleNumber={driver.vehicleNumber ?? '—'}
              vehicleModel={driver.vehicleModel ?? '—'}
              rating={driver.rating ?? 5}
              eta={etaUpdate?.etaMin ?? rideData?.eta ?? 0}
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
          </View>
        )}

        {/* OTP card (driver arrived) */}
        {showOTP && rideData?.otp && (
          <OTPVerificationCard otp={rideData.otp} colors={colors} />
        )}

        {/* Searching text */}
        {rideStatus === RideStatusEnum.SEARCHING && (
          <View style={styles.searchingRow}>
            <Text style={[Typography.body, { color: colors.text }]}>Looking for nearby drivers…</Text>
          </View>
        )}

        {/* In-progress: route info */}
        {rideStatus === RideStatusEnum.IN_PROGRESS && route && (
          <View style={[styles.routeInfo, { backgroundColor: `${Colors.primary}10` }]}>
            <MaterialIcons name="navigation" size={16} color={Colors.primary} />
            <Text style={[Typography.label, { color: Colors.primary, marginLeft: 8 }]}>
              {route.distanceKm.toFixed(1)} km remaining
              {etaUpdate ? ` · ${etaUpdate.etaMin} min` : ''}
            </Text>
          </View>
        )}

        {/* Status progress + cancel */}
        {rideStatus && (
          <RideStatusCard
            status={rideStatus}
            etaUpdate={etaUpdate}
            driverName={driver?.name}
            onCancel={isCancellable ? handleCancel : undefined}
            colors={colors}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  statusBadge:   {
    position:  'absolute', left: Spacing.base, right: Spacing.base,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  locateFab:     {
    position: 'absolute', right: 16,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sheet:         {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 32,
  },
  sheetHandle:   {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center', marginVertical: 12,
  },
  driverCardWrap: { paddingHorizontal: Spacing.base },
  searchingRow:   { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  routeInfo:      {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.base, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
});
