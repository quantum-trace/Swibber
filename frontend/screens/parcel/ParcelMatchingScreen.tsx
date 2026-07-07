import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Map, Camera, UserLocation, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParcelStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/common/Header';
import { getSocket, connectSocket } from '../../socket/socketManager';
import { vehicleConfigs, packageTypeConfigs, type VehicleType } from '../../constants/enums';
import { LocationPin } from '../../components/maps/LocationPin';
import { useCancelParcel } from '../../hooks/useParcelQuery';
import { useDialog } from '../../context/DialogContext';
import { useQueryClient } from '@tanstack/react-query';

type MatchNav   = StackNavigationProp<ParcelStackParamList, 'ParcelMatching'>;
type MatchRoute = RouteProp<ParcelStackParamList, 'ParcelMatching'>;

const MAP_STYLE     = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [72.877, 19.076];

interface AssignedRider {
  name?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  rating?: number;
  etaPickupMin?: number;
  etaDeliveryMin?: number;
}

const SEARCH_TIMEOUT_MS = 60_000;

export default function ParcelMatchingScreen() {
  const navigation = useNavigation<MatchNav>();
  const { params } = useRoute<MatchRoute>();
  const { colors } = useTheme();

  const [riderFound, setRiderFound] = useState(false);
  const [rider, setRider]           = useState<AssignedRider | null>(null);
  const [timedOut, setTimedOut]     = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef  = useRef<CameraRef>(null);

  const { showDialog } = useDialog();
  const cancelParcel   = useCancelParcel();
  const qc             = useQueryClient();

  // Ring animations — RN Animated so they work inside Marker
  const ring1Anim = useRef(new RNAnimated.Value(0)).current;
  const ring2Anim = useRef(new RNAnimated.Value(0)).current;

  // Rider card animation — Reanimated
  const cardOpacity = useSharedValue(0);
  const cardY       = useSharedValue(30);

  const hasPickup = !!(params.pickupLat && params.pickupLng);
  const initialCenter: [number, number] = hasPickup
    ? [params.pickupLng!, params.pickupLat!]
    : DEFAULT_CENTER;

  // Animate camera to pickup when coords become available (handles late-load)
  useEffect(() => {
    if (hasPickup) {
      cameraRef.current?.flyTo({ center: initialCenter, zoom: 15, duration: 600 });
    }
  }, [hasPickup]);

  // Ring loop: ring1 runs continuously, ring2 offset by 800ms
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

  useEffect(() => {
    const listenForRider = async () => {
      await connectSocket();
      const socket = getSocket();
      if (!socket) return;
      socket.on('parcel_rider_assigned', (data) => {
        if (String(data.parcelId) !== params.parcelId) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setRider({
          vehicleType:    (data as any).rider?.vehicleType,
          vehicleNumber:  (data as any).rider?.vehicleNumber,
          name:           (data as any).rider?.name,
          rating:         (data as any).rider?.rating,
          etaPickupMin:   (data as any).etaPickupMin,
          etaDeliveryMin: (data as any).etaDeliveryMin,
        });
        setRiderFound(true);
        cardOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
        cardY.value = withSpring(0, { damping: 14 });
      });
    };
    listenForRider();

    timeoutRef.current = setTimeout(() => setTimedOut(true), SEARCH_TIMEOUT_MS);
    return () => {
      getSocket()?.off('parcel_rider_assigned');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [params.parcelId]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  // Interpolations for RN Animated rings (scale + fade out)
  const ring1Scale   = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 0.4, 0] });
  const ring2Scale   = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 0.4, 0] });

  const vehicleCfg = rider?.vehicleType ? vehicleConfigs[rider.vehicleType as VehicleType] : null;
  const pkgCfg     = params.packageType ? packageTypeConfigs[params.packageType as keyof typeof packageTypeConfigs] : null;

  const handleTrack = () => {
    navigation.replace('ParcelTracking', {
      parcelId:    params.parcelId,
      pickup:      params.pickup,
      dropoff:     params.dropoff,
      pickupLat:   params.pickupLat,
      pickupLng:   params.pickupLng,
      dropLat:     params.dropLat,
      dropLng:     params.dropLng,
      packageType: params.packageType,
    });
  };

  const handleCancel = () => {
    showDialog({
      title:   riderFound ? 'Cancel Parcel?' : 'Cancel Booking?',
      message: riderFound
        ? 'A rider has been assigned. Are you sure you want to cancel this parcel?'
        : 'Cancel the search and go back?',
      type:    'warning',
      buttons: [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text:    'Yes, Cancel',
          style:   'destructive',
          onPress: () => {
            cancelParcel.mutate(params.parcelId, {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: ['active-parcel-check'] });
                navigation.popToTop();
              },
            });
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack={!riderFound}
        title={riderFound ? 'Rider Found! 🏍️' : timedOut ? 'Taking longer than usual...' : 'Finding Rider...'}
      />

      {/* Map area */}
      <View style={styles.mapArea}>
        <Map style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE}>
          <Camera
            ref={cameraRef}
            initialViewState={{ center: initialCenter, zoom: hasPickup ? 15 : 13 }}
          />
          <UserLocation visible animated />

          {/* Pulsing rings anchored to pickup coordinate */}
          {!riderFound && hasPickup && (
            <Marker id="pulse-pickup" lngLat={[params.pickupLng!, params.pickupLat!]}>
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

          {/* Drop pin */}
          {params.dropLat && params.dropLng && (
            <LocationPin
              id="drop"
              lat={params.dropLat}
              lng={params.dropLng}
              color={Colors.error}
            />
          )}
        </Map>
      </View>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
        <View style={styles.sheetHandle} />

        {!riderFound ? (
          <View>
            <Text style={[Typography.h4, { color: colors.text, marginBottom: 4 }]}>
              {timedOut ? 'High demand in your area' : 'Finding nearest rider...'}
            </Text>
            <Text style={[Typography.body, { color: colors.textSub, marginBottom: Spacing.base }]}>
              {timedOut
                ? 'Still searching — you can wait or try again later.'
                : 'Usually takes under 30 seconds'}
            </Text>

            {/* Route card */}
            <View style={[styles.routeCard, { backgroundColor: colors.card }]}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.captionBold, { color: colors.textMuted, letterSpacing: 0.4 }]}>PICKUP</Text>
                  <Text style={[Typography.body, { color: colors.text, marginTop: 1 }]} numberOfLines={1}>
                    {params.pickup || 'Pickup location'}
                  </Text>
                </View>
              </View>
              <View style={styles.routeConnector}>
                <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
              </View>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.captionBold, { color: colors.textMuted, letterSpacing: 0.4 }]}>DROPOFF</Text>
                  <Text style={[Typography.body, { color: colors.text, marginTop: 1 }]} numberOfLines={1}>
                    {params.dropoff || 'Dropoff location'}
                  </Text>
                </View>
              </View>
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={{ fontSize: 14 }}>{pkgCfg?.emoji ?? '📦'}</Text>
                  <Text style={[Typography.captionBold, { color: colors.textSub, marginLeft: 6 }]}>
                    {pkgCfg?.label ?? params.packageType ?? 'Parcel'}
                  </Text>
                </View>
                <View style={[styles.fareBadge, { backgroundColor: `${Colors.primary}12` }]}>
                  <Text style={[Typography.label, { color: Colors.primary }]}>
                    {formatCurrency(params.fare)}
                  </Text>
                </View>
              </View>
            </View>

            {timedOut && (
              <TouchableOpacity
                onPress={handleTrack}
                style={[styles.trackBtn, { backgroundColor: Colors.primary, marginTop: Spacing.base }]}
              >
                <Text style={[Typography.label, { color: Colors.white }]}>Go to tracking anyway →</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelParcel.isPending}
              style={[styles.cancelBtn, { borderColor: Colors.error }]}
            >
              {cancelParcel.isPending
                ? <ActivityIndicator size="small" color={Colors.error} />
                : <Text style={[Typography.label, { color: Colors.error }]}>Cancel Booking</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={cardStyle}>
            <View style={styles.riderRow}>
              <View style={[styles.riderAvatar, { backgroundColor: `${Colors.primary}20` }]}>
                <Text style={{ fontSize: 28 }}>🧑</Text>
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={[Typography.labelLarge, { color: colors.text }]}>
                  {rider?.name ?? 'Delivery Partner'}
                </Text>
                <View style={styles.ratingRow}>
                  {rider?.rating != null && (
                    <>
                      <MaterialIcons name="star" size={14} color={Colors.warning} />
                      <Text style={[Typography.caption, { color: colors.textSub, marginLeft: 3 }]}>
                        {rider.rating.toFixed(1)}
                      </Text>
                    </>
                  )}
                </View>
                {(vehicleCfg || rider?.vehicleNumber) && (
                  <Text style={[Typography.caption, { color: colors.textSub }]}>
                    {vehicleCfg?.label ?? rider?.vehicleType ?? 'Vehicle'}
                    {rider?.vehicleNumber ? ` • ${rider.vehicleNumber}` : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.success}15` }]}>
                <MaterialIcons name="call" size={20} color={Colors.success} />
              </TouchableOpacity>
            </View>

            <View style={[styles.fareRow, { backgroundColor: `${Colors.primary}10` }]}>
              <View>
                <Text style={[Typography.caption, { color: colors.textSub }]}>Parcel fare</Text>
                <Text style={[Typography.h4, { color: Colors.primary }]}>
                  {formatCurrency(params.fare)}
                </Text>
              </View>
              <View>
                <Text style={[Typography.caption, { color: colors.textSub }]}>ETA pickup</Text>
                <Text style={[Typography.label, { color: colors.text }]}>
                  {rider?.etaPickupMin != null ? `~${rider.etaPickupMin} min` : '—'}
                </Text>
              </View>
              <View>
                <Text style={[Typography.caption, { color: colors.textSub }]}>Delivery</Text>
                <Text style={[Typography.label, { color: colors.text }]}>
                  {rider?.etaDeliveryMin != null ? `~${rider.etaDeliveryMin} min` : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.riderActions}>
              <TouchableOpacity
                onPress={handleTrack}
                style={[styles.trackBtn, { backgroundColor: Colors.primary, flex: 1 }]}
              >
                <Text style={[Typography.label, { color: Colors.white }]}>Track Parcel Live →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={cancelParcel.isPending}
                style={[styles.cancelChip, { borderColor: Colors.error }]}
              >
                {cancelParcel.isPending
                  ? <ActivityIndicator size="small" color={Colors.error} />
                  : <Text style={[Typography.captionBold, { color: Colors.error }]}>Cancel</Text>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const PULSE_SIZE = 160;

const styles = StyleSheet.create({
  container:      { flex: 1 },
  mapArea:        { flex: 1, overflow: 'hidden' },
  // Pulse marker — fixed square container centered on the coordinate
  pulseContainer: {
    width: PULSE_SIZE, height: PULSE_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE, height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    borderWidth: 2,
  },
  pulseCenter: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  bottomSheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 48, ...Shadows.xxl },
  sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 18 },
  routeCard:      { borderRadius: BorderRadius.xl, padding: Spacing.base },
  routeRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot:       { width: 11, height: 11, borderRadius: 6, marginTop: 5 },
  routeConnector: { paddingLeft: 4, paddingVertical: 3 },
  connectorLine:  { width: 2, height: 18 },
  cardDivider:    { height: 1, marginVertical: Spacing.base },
  metaRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaChip:       { flexDirection: 'row', alignItems: 'center' },
  fareBadge:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  riderRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  riderAvatar:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  actionBtn:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fareRow:        { flexDirection: 'row', justifyContent: 'space-around', padding: Spacing.base, borderRadius: BorderRadius.md, marginBottom: 14 },
  trackBtn:       { padding: Spacing.base, borderRadius: BorderRadius.md, alignItems: 'center' },
  cancelBtn:      { marginTop: 12, paddingVertical: 13, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1.5 },
  riderActions:   { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  cancelChip:     { paddingHorizontal: 16, paddingVertical: 13, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
});
