import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';

interface LocationPinProps {
  id: string;
  lat: number;
  lng: number;
  color: string;
}

export const LocationPin = React.memo(function LocationPin({
  id,
  lat,
  lng,
  color,
}: LocationPinProps) {
  return (
    <Marker id={id} lngLat={[lng, lat]}>
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={[styles.stem, { backgroundColor: color }]} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  stem: { width: 2, height: 10 },
});
