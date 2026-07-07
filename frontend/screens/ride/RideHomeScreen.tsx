import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Map, Camera, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { addressTypeConfigs } from '../../constants/enums';
import { formatAddress } from '../../utils/addressFormatter';
import { useSavedAddresses } from '../../hooks/useProfileQuery';
import Header from '../../components/common/Header';
import { LocationPin } from '../../components/maps/LocationPin';
import { useActiveBookings } from '../../hooks/useActiveBookings';
import { rideStatusConfigs, RideStatusEnum, type RideStatus } from '../../constants/enums';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const { height } = Dimensions.get('window');
type RideHomeNav = StackNavigationProp<RideStackParamList, 'RideHome'>;

const SHEET_HEIGHT = height * 0.44;

export default function RideHomeScreen() {
  const navigation = useNavigation<RideHomeNav>();
  const { colors, isDark } = useTheme();
  const { location } = useLocation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);

  const { data: savedAddresses = [], isLoading: addressesLoading } = useSavedAddresses();
  const { activeRide } = useActiveBookings();

  const sheetY     = useSharedValue(SHEET_HEIGHT);
  const mapOpacity = useSharedValue(0);

  useEffect(() => {
    mapOpacity.value = withTiming(1, { duration: 500 });
    sheetY.value     = withDelay(150, withSpring(0, { damping: 20, stiffness: 180 }));
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const mapStyle   = useAnimatedStyle(() => ({ opacity: mapOpacity.value }));

  const handleLocateMe = () => {
    if (!location) return;
    cameraRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 15, duration: 600 });
  };

  const resumeRide = () => {
    if (!activeRide) return;
    const inProgress = [
      RideStatusEnum.DRIVER_ARRIVING,
      RideStatusEnum.DRIVER_ARRIVED,
      RideStatusEnum.IN_PROGRESS,
    ].includes(activeRide.status as any);
    if (inProgress) {
      navigation.navigate('LiveTracking', { rideId: activeRide.rideId });
    } else {
      navigation.navigate('DriverMatching', { rideId: activeRide.rideId });
    }
  };

  const navigateToVehicleSelect = (destLabel: string, destLat?: number, destLng?: number) => {
    navigation.navigate('VehicleSelect', {
      pickup:      location?.address ?? 'Current location',
      destination: destLabel,
      pickupLat:   location?.lat,
      pickupLng:   location?.lng,
      destLat,
      destLng,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Book a Ride" transparent />

      {/* Map */}
      <Animated.View style={[styles.mapContainer, mapStyle]}>
        {location ? (
          <Map
            style={StyleSheet.absoluteFill}
            mapStyle={MAP_STYLE}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{ center: [location.lng, location.lat], zoom: 15 }}
            />
            <UserLocation visible animated />
            <LocationPin id="user-loc" lat={location.lat} lng={location.lng} color={Colors.primary} />
          </Map>
        ) : (
          <LinearGradient
            colors={isDark ? ['#0A0A1A', '#1A1A2E'] : ['#E8F0FE', '#F0F4FF']}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.mapPlaceholderContent}>
              <MaterialIcons name="location-searching" size={36} color={`${Colors.primary}80`} />
              <Text style={[Typography.caption, { color: `${Colors.primary}80`, marginTop: 8 }]}>
                Getting your location…
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Locate-me FAB */}
        <TouchableOpacity
          style={[styles.locateBtn, { backgroundColor: colors.card, ...Shadows.md }]}
          onPress={handleLocateMe}
        >
          <MaterialIcons name="my-location" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { backgroundColor: colors.surface }, sheetStyle]}>
        <View style={styles.sheetHandle} />

        {activeRide ? (
          /* ── Active ride block ── */
          <View>
            <Text style={[Typography.h3, { color: colors.text, marginBottom: 4 }]}>
              Active Ride
            </Text>
            <Text style={[Typography.body, { color: colors.textSub, marginBottom: 16 }]}>
              Finish or cancel your current ride before booking a new one.
            </Text>
            <View style={[styles.activeCard, { backgroundColor: `${Colors.primary}10`, borderColor: `${Colors.primary}30` }]}>
              <View style={styles.activeCardRow}>
                <Text style={{ fontSize: 28 }}>
                  {rideStatusConfigs[activeRide.status as RideStatus]?.emoji ?? '🚗'}
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.label, { color: Colors.primary }]}>
                    {rideStatusConfigs[activeRide.status as RideStatus]?.alias ?? activeRide.status}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>
                    Ride #{activeRide.rideId.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.resumeBtn, { backgroundColor: Colors.primary }]}
                  onPress={resumeRide}
                >
                  <Text style={[Typography.captionBold, { color: Colors.white }]}>Resume →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ── Normal booking UI ── */
          <>
            <Text style={[Typography.h3, { color: colors.text, marginBottom: 16 }]}>
              Where are you going?
            </Text>

            <View style={[styles.locationBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <Text style={[Typography.body, { color: colors.textSub, flex: 1 }]} numberOfLines={2} ellipsizeMode="tail">
                {location?.address ? formatAddress(location.address) : 'Your current location'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.locationBar, styles.locationBarDest, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('LocationSelect')}
            >
              <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
              <Text style={[Typography.body, { color: colors.textMuted, flex: 1 }]}>Where to?</Text>
              <MaterialIcons name="search" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={[Typography.label, { color: colors.textSub, marginTop: 16, marginBottom: 10 }]}>
              QUICK SELECT
            </Text>

            {savedAddresses.length > 0 ? (
              savedAddresses.slice(0, 3).map((addr: any) => {
                const addrConfig = addressTypeConfigs[addr.type as keyof typeof addressTypeConfigs];
                return (
                  <TouchableOpacity
                    key={addr._id ?? addr.id}
                    style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                    onPress={() => navigateToVehicleSelect(addr.label ?? addr.address, addr.lat, addr.lng)}
                  >
                    <View style={[styles.suggIconBox, { backgroundColor: `${Colors.primary}15` }]}>
                      <Text style={{ fontSize: 18 }}>{addrConfig?.emoji ?? '📍'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[Typography.label, { color: colors.text }]}>
                        {addr.label ?? addrConfig?.label ?? 'Address'}
                      </Text>
                      <Text style={[Typography.caption, { color: colors.textSub }]} numberOfLines={1}>
                        {formatAddress(addr.address)}
                      </Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })
            ) : !addressesLoading ? (
              <View style={styles.emptyAddresses}>
                <Text style={[Typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
                  No saved addresses yet. Add Home & Work for faster booking.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1 },
  mapContainer:          { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.58, overflow: 'hidden' },
  mapPlaceholderContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  locateBtn: {
    position: 'absolute', bottom: 16, right: 16,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 40, ...Shadows.xxl,
  },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 20 },
  locationBar:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 8, gap: 12 },
  locationBarDest: { borderStyle: 'dashed' },
  dot:             { width: 10, height: 10, borderRadius: 5 },
  suggestionRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5 },
  suggIconBox:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyAddresses:  { paddingVertical: 16, paddingHorizontal: 8 },
  activeCard:      { borderRadius: BorderRadius.xl, borderWidth: 1.5, padding: Spacing.base },
  activeCardRow:   { flexDirection: 'row', alignItems: 'center' },
  resumeBtn:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.lg },
});
