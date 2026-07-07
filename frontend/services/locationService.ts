import * as ExpoLocation from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coordinates: Coordinates;
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export const LocationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<Coordinates | null> {
    const hasPermission = await LocationService.requestPermission();
    if (!hasPermission) return null;

    const location = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    return { lat: location.coords.latitude, lng: location.coords.longitude };
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!result) return 'Unknown location';
    const parts = [result.name, result.street, result.district, result.city].filter(Boolean);
    return parts.join(', ');
  },

  async getCurrentLocationWithAddress(): Promise<LocationResult | null> {
    const coords = await LocationService.getCurrentLocation();
    if (!coords) return null;

    const address = await LocationService.reverseGeocode(coords.lat, coords.lng);
    const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
    const city = result?.city ?? 'Mumbai';

    return { coordinates: coords, lat: coords.lat, lng: coords.lng, address, city };
  },

  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};
