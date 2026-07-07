import { apiClient } from '../api/client';

export interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
}

export interface DirectionsResult {
  distanceKm: number;
  durationMin: number;
  polyline: string;
}

export const MapsService = {
  async autocomplete(input: string, lat?: number, lng?: number): Promise<PlaceResult[]> {
    const { data } = await apiClient.get('/maps/autocomplete', { params: { input, lat, lng } });
    return data.data;
  },

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const { data } = await apiClient.get('/maps/place-details', { params: { placeId } });
    return data.data;
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const { data } = await apiClient.get('/maps/reverse-geocode', { params: { lat, lng } });
    return data.data.address;
  },

  async getDirections(originLat: number, originLng: number, destLat: number, destLng: number): Promise<DirectionsResult> {
    const { data } = await apiClient.get('/maps/directions', { params: { originLat, originLng, destLat, destLng } });
    return data.data;
  },

  async getNearbyPlaces(lat: number, lng: number, type = 'restaurant'): Promise<PlaceResult[]> {
    const { data } = await apiClient.get('/maps/nearby', { params: { lat, lng, type } });
    return data.data;
  },
};
