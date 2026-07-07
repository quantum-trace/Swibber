import React, { useMemo } from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { Colors } from '../../theme';
import { MapRouteStateEnum, type MapRouteState } from '../../constants/enums';

export interface RoutePolylineProps {
  coordinates: Array<{ latitude: number; longitude: number }>;
  routeState?: MapRouteState;
  strokeColor?: string;
  strokeWidth?: number;
  completedColor?: string;
  progressFraction?: number;
}

function toLineGeoJSON(
  coords: Array<{ latitude: number; longitude: number }>,
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords.map((c) => [c.longitude, c.latitude]),
    },
    properties: {},
  };
}

export const RoutePolyline = React.memo(function RoutePolyline({
  coordinates,
  routeState = MapRouteStateEnum.READY,
  strokeColor = Colors.primary,
  strokeWidth = 5,
  completedColor,
  progressFraction,
}: RoutePolylineProps) {
  if (routeState !== MapRouteStateEnum.READY || coordinates.length < 2) return null;

  const { remaining, completed } = useMemo(() => {
    if (progressFraction === undefined || !completedColor) {
      return { remaining: coordinates, completed: [] };
    }
    const splitIdx = Math.floor(coordinates.length * progressFraction);
    return {
      completed: coordinates.slice(0, Math.max(splitIdx, 1)),
      remaining: coordinates.slice(splitIdx),
    };
  }, [coordinates, progressFraction, completedColor]);

  return (
    <>
      {completed.length > 1 && completedColor && (
        <GeoJSONSource id="route-completed" data={toLineGeoJSON(completed)}>
          <Layer
            id="route-completed-line"
            type="line"
            paint={{
              'line-color': completedColor,
              'line-width': strokeWidth - 1,
              'line-dasharray': [4, 4],
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </GeoJSONSource>
      )}

      {remaining.length > 1 && (
        <GeoJSONSource id="route-remaining" data={toLineGeoJSON(remaining)}>
          <Layer
            id="route-remaining-line"
            type="line"
            paint={{ 'line-color': strokeColor, 'line-width': strokeWidth }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </GeoJSONSource>
      )}
    </>
  );
});
