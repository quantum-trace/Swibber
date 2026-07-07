import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlaceResult {
  // placeId format: "nominatim:{lat}:{lng}" — coordinates are embedded
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  /** Coordinates are available directly from Nominatim search — no second call needed */
  lat?: number;
  lng?: number;
}

export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
}

export interface RecentSearch {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
  lat?: number;
  lng?: number;
  savedAt: number;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const RECENT_KEY = 'swibber:recent_searches';
const MAX_RECENT = 8;
const AUTOCOMPLETE_CACHE_TTL_MS = 30 * 1000;

interface AutocompleteCache {
  results: PlaceResult[];
  expiresAt: number;
}

const autocompleteCache = new Map<string, AutocompleteCache>();

function autocompleteCacheKey(input: string, lat?: number, lng?: number): string {
  return `${input.toLowerCase().trim()}:${lat?.toFixed(3) ?? ''}:${lng?.toFixed(3) ?? ''}`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const PlacesService = {
  async autocomplete(
    input: string,
    lat?: number,
    lng?: number,
    signal?: AbortSignal,
  ): Promise<PlaceResult[]> {
    if (!input.trim()) return [];

    const key = autocompleteCacheKey(input, lat, lng);
    const cached = autocompleteCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.results;

    const { data } = await apiClient.get('/maps/autocomplete', {
      params: { input: input.trim(), lat, lng },
      signal,
    });

    // Backend now returns lat/lng directly in each result
    const results: PlaceResult[] = (data.data ?? []).map((r: any) => ({
      placeId:       r.placeId,
      description:   r.description,
      mainText:      r.mainText,
      secondaryText: r.secondaryText,
      lat:           r.lat,
      lng:           r.lng,
    }));

    autocompleteCache.set(key, { results, expiresAt: Date.now() + AUTOCOMPLETE_CACHE_TTL_MS });
    return results;
  },

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    // Optimisation: if placeId encodes lat/lng (nominatim format), decode inline
    if (placeId.startsWith('nominatim:')) {
      const parts = placeId.split(':');
      if (parts.length === 3) {
        const lat = parseFloat(parts[1]);
        const lng = parseFloat(parts[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Use reverse-geocode for a formatted address string
          try {
            const { data } = await apiClient.get('/maps/reverse-geocode', { params: { lat, lng } });
            return { address: (data.data as { address: string }).address, lat, lng };
          } catch {
            return { address: placeId, lat, lng };
          }
        }
      }
    }
    // Fallback: ask backend to resolve
    const { data } = await apiClient.get('/maps/place-details', { params: { placeId } });
    return data.data as PlaceDetails;
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const { data } = await apiClient.get('/maps/reverse-geocode', { params: { lat, lng } });
    return (data.data as { address: string }).address;
  },

  async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as RecentSearch[];
    } catch {
      return [];
    }
  },

  async saveRecentSearch(place: Omit<RecentSearch, 'savedAt'>): Promise<void> {
    try {
      const existing = await PlacesService.getRecentSearches();
      const filtered = existing.filter((r) => r.placeId !== place.placeId);
      const updated: RecentSearch[] = [{ ...place, savedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch { /* non-critical */ }
  },

  async clearRecentSearches(): Promise<void> {
    await AsyncStorage.removeItem(RECENT_KEY);
  },
};
