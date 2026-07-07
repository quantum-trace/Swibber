import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { VehicleType } from '../../constants/enums';
import { Colors } from '../../theme';

interface VehicleMarkerConfig {
  iconName: string;
  color: string;
  size: number;
}

const VEHICLE_CONFIGS: Record<VehicleType, VehicleMarkerConfig> = {
  bike:    { iconName: 'motorbike',       color: '#FF6B35', size: 22 },
  auto:    { iconName: 'taxi',            color: '#9B59B6', size: 20 },
  mini:    { iconName: 'car',             color: '#3498DB', size: 20 },
  sedan:   { iconName: 'car-sports',      color: '#2ECC71', size: 22 },
  xl:      { iconName: 'car-estate',      color: '#E74C3C', size: 20 },
  premium: { iconName: 'car-convertible', color: '#F39C12', size: 22 },
};

export interface DriverMarkerProps {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  vehicleType: VehicleType;
  isActive?: boolean;
  onPress?: () => void;
}

export const DriverMarker = React.memo(function DriverMarker({
  driverId,
  lat,
  lng,
  heading = 0,
  vehicleType,
  isActive = false,
  onPress,
}: DriverMarkerProps) {
  const rotateAnim     = useRef(new Animated.Value(heading)).current;
  const scaleAnim      = useRef(new Animated.Value(1)).current;
  const prevHeadingRef = useRef(heading);
  const prevCoordRef   = useRef({ lat, lng });

  useEffect(() => {
    const prev  = prevHeadingRef.current;
    let delta   = heading - prev;
    if (delta > 180)  delta -= 360;
    if (delta < -180) delta += 360;
    const target = prev + delta;
    prevHeadingRef.current = target;
    Animated.timing(rotateAnim, { toValue: target, duration: 800, useNativeDriver: true }).start();
  }, [heading, rotateAnim]);

  useEffect(() => {
    if (prevCoordRef.current.lat !== lat || prevCoordRef.current.lng !== lng) {
      prevCoordRef.current = { lat, lng };
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [lat, lng, scaleAnim]);

  const config = VEHICLE_CONFIGS[vehicleType] ?? VEHICLE_CONFIGS.mini;
  const rotate = rotateAnim.interpolate({
    inputRange:  [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Marker id={`driver-${driverId}`} lngLat={[lng, lat]} onPress={onPress}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {isActive && <View style={styles.activeRing} />}
        <Animated.View style={[styles.bubble, { transform: [{ rotate }] }]}>
          <MaterialCommunityIcons
            name={config.iconName as any}
            size={config.size}
            color={config.color}
          />
        </Animated.View>
      </Animated.View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          50,
    height:         50,
  },
  activeRing: {
    position:     'absolute',
    width:        46,
    height:       46,
    borderRadius: 23,
    borderWidth:  2,
    borderColor:  Colors.primary,
    opacity:      0.4,
  },
  bubble: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOpacity:   0.2,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       6,
  },
});
