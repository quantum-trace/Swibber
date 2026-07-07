import axios from 'axios';
import { ETASourceEnum, type ETASource } from '../types/enums';

// ─── Public API endpoints ─────────────────────────────────────────────────────
// Nominatim (OpenStreetMap geocoding) — usage policy: 1 req/s, User-Agent required
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
// OSRM public routing engine
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

const NOMINATIM_HEADERS = {
  'User-Agent': 'SwibberApp/1.0 (contact@swibber.app)',
  'Accept-Language': 'en',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface DirectionsResult {
  coordinates: RouteCoordinate[];
  distanceKm: number;
  durationMin: number;
  steps: Array<{ instruction: string; distance: string }>;
  source: 'osrm' | 'haversine';
}

export interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
}

export interface GeocodedAddress {
  address: string;
  lat: number;
  lng: number;
}

// ─── PlaceId encoding ─────────────────────────────────────────────────────────
// Format: "nominatim:{lat}:{lng}" — stores coordinates directly so
// getPlaceDetails never needs a second API call.

function encodePlaceId(lat: number, lng: number): string {
  return `nominatim:${lat}:${lng}`;
}

function decodePlaceId(placeId: string): { lat: number; lng: number } | null {
  if (!placeId.startsWith('nominatim:')) return null;
  const parts = placeId.split(':');
  if (parts.length !== 3) return null;
  const lat = parseFloat(parts[1]);
  const lng = parseFloat(parts[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

// ─── Step instruction builder ─────────────────────────────────────────────────

function buildInstruction(step: {
  name?: string;
  maneuver?: { type?: string; modifier?: string };
  distance?: number;
}): string {
  const name = step.name?.trim() || '';
  const type = step.maneuver?.type ?? '';
  const modifier = step.maneuver?.modifier ?? '';

  if (type === 'depart') return name ? `Head onto ${name}` : 'Depart';
  if (type === 'arrive') return 'Arrive at destination';
  if (type === 'turn' && modifier) return `Turn ${modifier}${name ? ` onto ${name}` : ''}`;
  if (type === 'continue') return name ? `Continue onto ${name}` : 'Continue straight';
  if (type === 'merge') return name ? `Merge onto ${name}` : 'Merge';
  if (type === 'ramp') return name ? `Take ramp onto ${name}` : 'Take ramp';
  if (type === 'fork' && modifier) return `Keep ${modifier}${name ? ` onto ${name}` : ''}`;
  if (type === 'end of road') return `Turn ${modifier}${name ? ` onto ${name}` : ''}`;
  if (type === 'roundabout') return `Enter roundabout`;
  return name ? `Head on ${name}` : 'Continue';
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

// ─── Haversine fallback ───────────────────────────────────────────────────────

/**
 * Straight-line distance between two lat/lng points using the Haversine formula.
 * Earth radius: 6371 km.
 */
export const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// ─── OSRM Routing ─────────────────────────────────────────────────────────────

export const getDirections = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<DirectionsResult> => {
  const url = `${OSRM_BASE}/${originLng},${originLat};${destLng},${destLat}`;

  console.log('[MAPS] OSRM request', { originLat, originLng, destLat, destLng, url });

  try {
    const { data } = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true,
      },
      timeout: 10_000,
    });

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found via OSRM');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // GeoJSON coordinates are [lng, lat] — swap to {lat, lng}
    const coordinates: RouteCoordinate[] = (
      route.geometry.coordinates as Array<[number, number]>
    ).map(([lng, lat]) => ({ lat, lng }));

    const steps = (leg.steps ?? []).map((s: any) => ({
      instruction: buildInstruction(s),
      distance: formatDistance(s.distance ?? 0),
    }));

    const result: DirectionsResult = {
      coordinates,
      distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
      durationMin: Math.ceil(route.duration / 60),
      steps,
      source: 'osrm',
    };

    console.log('[MAPS] OSRM response', {
      distanceKm: result.distanceKm,
      durationMin: result.durationMin,
      stepsCount: result.steps.length,
      source: result.source,
    });

    return result;
  } catch (err: any) {
    console.warn('[MAPS] OSRM failed, using haversine fallback', {
      error: err?.message ?? String(err),
      originLat,
      originLng,
      destLat,
      destLng,
    });

    const distanceKm = haversineDistanceKm(originLat, originLng, destLat, destLng);
    // Approximate duration at 30 km/h: distanceKm / 0.5 km/min = minutes
    const durationMin = parseFloat((distanceKm / 0.5).toFixed(1));

    const result: DirectionsResult = {
      coordinates: [
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
      ],
      distanceKm,
      durationMin,
      steps: [],
      source: 'haversine',
    };

    console.log('[MAPS] Haversine fallback result', {
      distanceKm: result.distanceKm,
      durationMin: result.durationMin,
      source: result.source,
    });

    return result;
  }
};

// ─── Nominatim Geocoding ──────────────────────────────────────────────────────

export const geocodeAddress = async (address: string): Promise<GeocodedAddress> => {
  const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
    params: { q: address, format: 'jsonv2', limit: 1, addressdetails: 1 },
    headers: NOMINATIM_HEADERS,
    timeout: 8_000,
  });
  if (!data?.length) throw new Error('Address not found');
  const r = data[0];
  return {
    address: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  };
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const { data } = await axios.get(`${NOMINATIM_BASE}/reverse`, {
    params: { lat, lon: lng, format: 'json' },
    headers: NOMINATIM_HEADERS,
    timeout: 8_000,
  });
  return data?.display_name ?? 'Unknown location';
};

// ─── Nominatim Places Autocomplete ───────────────────────────────────────────

export const getPlacesAutocomplete = async (
  input: string,
  lat?: number,
  lng?: number,
): Promise<PlaceResult[]> => {
  const params: Record<string, unknown> = {
    q: input,
    format: 'jsonv2',
    limit: 7,
    addressdetails: 1,
    'accept-language': 'en',
  };

  // Bias results toward the user's location using a viewbox (±0.5° ≈ 55 km)
  if (lat && lng) {
    params.viewbox = `${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}`;
    params.bounded = 0; // don't restrict — just bias
  }

  const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
    params,
    headers: NOMINATIM_HEADERS,
    timeout: 8_000,
  });

  return (data ?? []).map((r: any) => {
    const addr = r.address ?? {};
    const mainText =
      addr.amenity ?? addr.building ?? addr.road ?? addr.suburb ?? r.name ?? r.display_name.split(',')[0];
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? '';
    const state = addr.state ?? '';
    const country = addr.country ?? '';
    const secondary = [city, state, country].filter(Boolean).join(', ');

    return {
      placeId: encodePlaceId(parseFloat(r.lat), parseFloat(r.lon)),
      description: r.display_name,
      mainText: mainText.trim(),
      secondaryText: secondary || r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
  });
};

export const getPlaceDetails = async (placeId: string): Promise<GeocodedAddress> => {
  // Decode coordinates from placeId — no extra API call needed
  const coords = decodePlaceId(placeId);
  if (!coords) throw new Error(`Invalid placeId: ${placeId}`);

  // Reverse-geocode to get a formatted address
  const address = await reverseGeocode(coords.lat, coords.lng);
  return { address, lat: coords.lat, lng: coords.lng };
};

// ─── Nearby Places (Nominatim category search) ────────────────────────────────

export const getNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusM = 5000,
  category = 'restaurant',
): Promise<Array<{ name: string; placeId: string; lat: number; lng: number; rating?: number }>> => {
  // Compute viewbox from radius (1° ≈ 111 km)
  const delta = radiusM / 111_000;
  const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;

  const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
    params: {
      q: category,
      format: 'jsonv2',
      limit: 20,
      viewbox,
      bounded: 1,
      addressdetails: 1,
      'accept-language': 'en',
    },
    headers: NOMINATIM_HEADERS,
    timeout: 10_000,
  });

  return (data ?? []).slice(0, 20).map((r: any) => ({
    name: r.name ?? r.display_name.split(',')[0],
    placeId: encodePlaceId(parseFloat(r.lat), parseFloat(r.lon)),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
};
