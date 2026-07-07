import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParcelStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useParcelTracking } from '../../hooks/useParcelTracking';
import { useDirections } from '../../hooks/useDirections';
import { useCancelParcel } from '../../hooks/useParcelQuery';
import { RideMap, type RideMapRef } from '../../components/maps/RideMap';
import ParcelTrackingCard from '../../components/parcel/ParcelTrackingCard';
import {
  ParcelStatusEnum,
  parcelStatusConfigs,
  type ParcelStatus,
  type VehicleType,
  type PackageType,
} from '../../constants/enums';

type TrackNav   = StackNavigationProp<ParcelStackParamList, 'ParcelTracking'>;
type TrackRoute = RouteProp<ParcelStackParamList, 'ParcelTracking'>;

// ── Timeline step definition ─────────────────────────────────────────────────

const TIMELINE_STEPS: Array<{ status: ParcelStatus; label: string }> = [
  { status: ParcelStatusEnum.SEARCHING_RIDER,  label: 'Order Confirmed'      },
  { status: ParcelStatusEnum.RIDER_ASSIGNED,   label: 'Partner Assigned'     },
  { status: ParcelStatusEnum.PICKUP_ARRIVED,   label: 'Partner at Pickup'    },
  { status: ParcelStatusEnum.PICKED_UP,        label: 'Package Picked Up'    },
  { status: ParcelStatusEnum.IN_TRANSIT,       label: 'In Transit'           },
  { status: ParcelStatusEnum.NEAR_DESTINATION, label: 'Near Destination'     },
  { status: ParcelStatusEnum.DELIVERED,        label: 'Delivered'            },
];

const CANCELLED_STEP: { status: ParcelStatus; label: string } = {
  status: ParcelStatusEnum.CANCELLED,
  label:  'Cancelled',
};

// ── Memoised timeline component ──────────────────────────────────────────────

const TimelineView = memo(function TimelineView({
  currentStatus,
  colors,
}: {
  currentStatus: ParcelStatus;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const steps = currentStatus === ParcelStatusEnum.CANCELLED
    ? [...TIMELINE_STEPS, CANCELLED_STEP]
    : TIMELINE_STEPS;

  const currentStep = parcelStatusConfigs[currentStatus]?.step ?? 0;

  return (
    <View style={styles.timeline}>
      {steps.map((step, idx) => {
        const cfg   = parcelStatusConfigs[step.status];
        const done  = cfg.step >= 0 && cfg.step < currentStep;
        const active = step.status === currentStatus;
        const isCancelled = step.status === ParcelStatusEnum.CANCELLED;

        return (
          <View key={step.status} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      done || active
                        ? isCancelled ? Colors.error : cfg.color
                        : colors.surface,
                    borderColor:
                      done || active
                        ? isCancelled ? Colors.error : cfg.color
                        : colors.border,
                  },
                ]}
              >
                {done && !isCancelled && (
                  <MaterialIcons name="check" size={10} color={Colors.white} />
                )}
                {active && (
                  <MaterialIcons
                    name={cfg.icon as any}
                    size={10}
                    color={Colors.white}
                  />
                )}
              </View>
              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor:
                        done ? cfg.color : colors.border,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  Typography.label,
                  {
                    color:
                      done || active ? colors.text : colors.textMuted,
                    fontWeight: active ? '700' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
              {active && (
                <Text style={[Typography.caption, { color: cfg.color }]}>
                  {cfg.alias}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

// ── Socket status badge ───────────────────────────────────────────────────────

const SocketBadge = memo(function SocketBadge({
  connected,
}: {
  connected: boolean;
}) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (connected) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [connected]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={socketStyles.container}>
      <Animated.View
        style={[
          socketStyles.dot,
          { backgroundColor: connected ? Colors.success : Colors.error },
          pulseStyle,
        ]}
      />
      <Text style={[Typography.caption, { color: Colors.white }]}>
        {connected ? 'Live' : 'Reconnecting...'}
      </Text>
    </View>
  );
});

const socketStyles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:    20,
    gap:             5,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 4,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ParcelTrackingScreen() {
  const navigation = useNavigation<TrackNav>();
  const { params }  = useRoute<TrackRoute>();
  const { colors }  = useTheme();
  const mapRef      = useRef<RideMapRef>(null);

  const [showTimeline, setShowTimeline] = useState(false);

  const {
    parcelStatus,
    riderLocation,
    etaUpdate,
    riderInfo,
    pickupCoords: livePickup,
    dropCoords:   liveDrop,
    isLoading,
    isTerminal,
    isSocketConnected,
  } = useParcelTracking(params.parcelId);

  const { mutate: cancelParcel } = useCancelParcel();
  const { showDialog } = useDialog();

  // Derive coords — prefer live data from API, fall back to route params coords
  const pickupCoord = useMemo(
    () =>
      livePickup ??
      ((params as any).pickupLat != null
        ? { lat: (params as any).pickupLat, lng: (params as any).pickupLng }
        : null),
    [livePickup, params],
  );

  const dropCoord = useMemo(
    () =>
      liveDrop ??
      ((params as any).dropLat != null
        ? { lat: (params as any).dropLat, lng: (params as any).dropLng }
        : null),
    [liveDrop, params],
  );

  // Directions: route from rider to destination (or pickup → drop when no rider yet)
  const routeOrigin = useMemo(() => {
    if (riderLocation) return { lat: riderLocation.lat, lng: riderLocation.lng };
    return pickupCoord;
  }, [riderLocation, pickupCoord]);

  const routeDest = useMemo(() => {
    const afterPickup =
      parcelStatus != null &&
      parcelStatusConfigs[parcelStatus]?.step >= parcelStatusConfigs[ParcelStatusEnum.PICKED_UP].step;
    return afterPickup ? dropCoord : pickupCoord;
  }, [parcelStatus, dropCoord, pickupCoord]);

  const { route, isLoading: isRouteLoading } = useDirections(routeOrigin, routeDest);

  // Fit map to route when ready
  useEffect(() => {
    if (route) {
      setTimeout(() => mapRef.current?.fitToRoute(), 200);
    }
  }, [route]);

  // Navigate to completion screen on delivery
  useEffect(() => {
    if (parcelStatus === ParcelStatusEnum.DELIVERED) {
      const t = setTimeout(() => {
        navigation.replace('ParcelComplete', { parcelId: params.parcelId });
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [parcelStatus, navigation, params.parcelId]);

  const handleShare = useCallback(() => {
    Share.share({
      title:   'Track my Swibber parcel',
      message: `Track parcel #${params.parcelId.slice(-8).toUpperCase()} on Swibber`,
    });
  }, [params.parcelId]);

  const handleCancel = useCallback(() => {
    showDialog({
      title:   'Cancel Parcel',
      message: 'Are you sure you want to cancel this delivery?',
      type:    'confirm',
      buttons: [
        { text: 'No', style: 'cancel' },
        {
          text:    'Yes, Cancel',
          style:   'destructive',
          onPress: () => cancelParcel(params.parcelId, {
            onSuccess: () => navigation.popToTop(),
          }),
        },
      ],
    });
  }, [cancelParcel, params.parcelId, showDialog]);

  const activeDriver = useMemo(() => {
    if (!riderLocation) return null;
    return {
      driverId:    riderInfo?.name ?? 'rider',
      vehicleType: (riderInfo?.vehicleType ?? 'bike') as VehicleType,
      location:    riderLocation,
    };
  }, [riderLocation, riderInfo]);

  const statusCfg = parcelStatus ? parcelStatusConfigs[parcelStatus] : null;

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <View style={StyleSheet.absoluteFill}>
        <RideMap
          ref={mapRef}
          pickup={pickupCoord
            ? { lat: pickupCoord.lat, lng: pickupCoord.lng, label: params.pickup }
            : undefined}
          destination={dropCoord
            ? { lat: dropCoord.lat, lng: dropCoord.lng, label: params.dropoff }
            : undefined}
          route={route}
          activeDriver={activeDriver ?? undefined}
        />
      </View>

      {/* Top overlay — back + share + socket badge */}
      <Animated.View
        entering={FadeIn.delay(200)}
        style={styles.topBar}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconBtn, { backgroundColor: colors.card }, Shadows.md]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <SocketBadge connected={isSocketConnected} />

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.iconBtn, { backgroundColor: colors.card }, Shadows.md]}
        >
          <MaterialIcons name="share" size={20} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Status bubble on map */}
      {statusCfg && (
        <Animated.View
          entering={FadeIn}
          style={[styles.statusBubble, { backgroundColor: statusCfg.color }]}
        >
          <MaterialIcons name={statusCfg.icon as any} size={14} color={Colors.white} />
          <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 5 }]}>
            {statusCfg.alias}
          </Text>
        </Animated.View>
      )}

      {/* Bottom sheet */}
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        style={styles.bottomSheet}
      >
        {/* Timeline toggle pill */}
        <TouchableOpacity
          style={styles.pillRow}
          onPress={() => setShowTimeline((v) => !v)}
        >
          <View style={[styles.pill, { backgroundColor: colors.border }]} />
        </TouchableOpacity>

        {/* Tracking card */}
        <ParcelTrackingCard
          parcelId={params.parcelId}
          status={parcelStatus ?? ParcelStatusEnum.SEARCHING_RIDER}
          etaMin={etaUpdate?.etaMin}
          distanceKm={etaUpdate?.distanceKm}
          riderName={riderInfo?.name}
          riderPhone={riderInfo?.phone}
          riderRating={riderInfo?.rating}
          vehicleType={riderInfo?.vehicleType as VehicleType | undefined}
          vehicleNumber={riderInfo?.vehicleNumber}
          packageType={(params as any).packageType as PackageType | undefined}
          weightKg={(params as any).weightKg}
          onCancelPress={
            parcelStatus != null &&
            !parcelStatusConfigs[parcelStatus]?.isTerminal &&
            parcelStatusConfigs[parcelStatus]?.step < 3
              ? handleCancel
              : undefined
          }
        />

        {/* Expandable timeline */}
        {showTimeline && parcelStatus && (
          <Animated.View entering={FadeIn} style={[styles.timelineCard, { backgroundColor: colors.card }]}>
            <Text style={[Typography.label, { color: colors.text, marginBottom: Spacing.base }]}>
              Delivery Timeline
            </Text>
            <TimelineView currentStatus={parcelStatus} colors={colors} />
          </Animated.View>
        )}

        {/* Route summary strip */}
        <View style={[styles.routeStrip, { backgroundColor: colors.surface }]}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <Text
              style={[Typography.caption, { color: colors.textSub, flex: 1 }]}
              numberOfLines={1}
            >
              {params.pickup}
            </Text>
          </View>
          <View style={[styles.routeConnector, { backgroundColor: colors.border }]} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
            <Text
              style={[Typography.caption, { color: colors.textSub, flex: 1 }]}
              numberOfLines={1}
            >
              {params.dropoff}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    position:          'absolute',
    top:               52,
    left:              Spacing.xl,
    right:             Spacing.xl,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    zIndex:            10,
  },
  iconBtn: {
    width:        40,
    height:       40,
    borderRadius: 20,
    alignItems:   'center',
    justifyContent: 'center',
  },

  statusBubble: {
    position:        'absolute',
    top:             104,
    alignSelf:       'center',
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:    20,
    zIndex:          9,
    ...Shadows.md,
  },

  bottomSheet: {
    position:  'absolute',
    bottom:    0,
    left:      0,
    right:     0,
    zIndex:    10,
  },
  pillRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  pill: {
    width:        40,
    height:       4,
    borderRadius: 2,
  },

  timelineCard: {
    marginHorizontal: Spacing.xl,
    marginTop:        8,
    borderRadius:     BorderRadius.xl,
    padding:          Spacing.base,
    ...Shadows.md,
  },
  timeline: {},
  timelineRow: {
    flexDirection: 'row',
    marginBottom:  2,
  },
  timelineLeft: {
    alignItems: 'center',
    width:      24,
  },
  timelineDot: {
    width:        20,
    height:       20,
    borderRadius: 10,
    borderWidth:  1.5,
    alignItems:   'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width:     2,
    flex:      1,
    minHeight: 16,
    marginVertical: 2,
  },
  timelineContent: {
    flex:          1,
    paddingLeft:   10,
    paddingBottom: 12,
  },

  routeStrip: {
    marginHorizontal: Spacing.xl,
    marginTop:        8,
    marginBottom:     Spacing.xl,
    borderRadius:     BorderRadius.md,
    padding:          Spacing.base,
    gap:              4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  routeDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  routeConnector: {
    width:  2,
    height: 12,
    marginLeft: 3,
    marginVertical: 2,
  },
});
