import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import { Map, Camera, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { RoutePolyline } from './RoutePolyline';
import { DriverMarker } from './DriverMarker';
import { NearbyDriversLayer } from './NearbyDriversLayer';
import { LocationPin } from './LocationPin';
import type { DirectionsResult } from '../../services/maps/directions.service';
import type { DriverLocation } from '../../hooks/useRideTracking';
import type { NearbyDriver } from '../../hooks/useNearbyDrivers';
import type { VehicleType } from '../../constants/enums';
import { Colors } from '../../theme';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [72.877, 19.076];
const DEFAULT_ZOOM = 12;

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface RideMapRef {
  fitToRoute: () => void;
  fitToDriver: () => void;
  animateToRegion: (coord: MapCoordinate, zoom?: number) => void;
}

interface RideMapProps {
  pickup?: (MapCoordinate & { label?: string }) | null;
  destination?: (MapCoordinate & { label?: string }) | null;
  route?: DirectionsResult | null;
  activeDriver?: {
    driverId: string;
    vehicleType: VehicleType;
    location: DriverLocation;
  } | null;
  nearbyDrivers?: NearbyDriver[];
  showNearby?: boolean;
  progressFraction?: number;
  onDriverPress?: (driverId: string) => void;
  onMapPress?: (coord: MapCoordinate) => void;
  children?: React.ReactNode;
  style?: object;
}

export const RideMap = forwardRef<RideMapRef, RideMapProps>(function RideMap(
  {
    pickup,
    destination,
    route,
    activeDriver,
    nearbyDrivers = [],
    showNearby = false,
    progressFraction,
    onDriverPress,
    onMapPress,
    children,
    style,
  },
  ref,
) {
  const cameraRef = useRef<CameraRef>(null);

  useImperativeHandle(ref, () => ({
    fitToRoute() {
      if (!route?.coordinates.length) return;
      const lngs = route.coordinates.map((c) => c.longitude);
      const lats  = route.coordinates.map((c) => c.latitude);
      cameraRef.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: 80, right: 60, bottom: 200, left: 60 }, duration: 800 },
      );
    },
    fitToDriver() {
      if (!activeDriver) return;
      cameraRef.current?.flyTo({
        center: [activeDriver.location.lng, activeDriver.location.lat],
        zoom:   16,
        duration: 600,
      });
    },
    animateToRegion(coord: MapCoordinate, zoom = 16) {
      cameraRef.current?.flyTo({ center: [coord.lng, coord.lat], zoom, duration: 600 });
    },
  }));

  const handleMapPress = useCallback(
    (e: any) => {
      const coords = e?.geometry?.coordinates ?? e?.coordinates;
      if (!coords) return;
      onMapPress?.({ lat: coords[1], lng: coords[0] });
    },
    [onMapPress],
  );

  return (
    <Map
      style={[StyleSheet.absoluteFill, style]}
      mapStyle={MAP_STYLE}
      onPress={handleMapPress}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
      />

      <UserLocation visible animated />

      {route && (
        <RoutePolyline
          coordinates={route.coordinates}
          strokeColor={Colors.primary}
          strokeWidth={5}
          completedColor={`${Colors.primary}50`}
          progressFraction={progressFraction}
        />
      )}

      {pickup && (
        <LocationPin id="pickup" lat={pickup.lat} lng={pickup.lng} color={Colors.success} />
      )}

      {destination && (
        <LocationPin id="destination" lat={destination.lat} lng={destination.lng} color={Colors.error} />
      )}

      {activeDriver && (
        <DriverMarker
          driverId={activeDriver.driverId}
          lat={activeDriver.location.lat}
          lng={activeDriver.location.lng}
          heading={activeDriver.location.heading}
          vehicleType={activeDriver.vehicleType}
          isActive
          onPress={() => onDriverPress?.(activeDriver.driverId)}
        />
      )}

      {showNearby && (
        <NearbyDriversLayer
          drivers={nearbyDrivers}
          onDriverPress={(d) => onDriverPress?.(d.driverId)}
        />
      )}

      {children}
    </Map>
  );
});
