// addressFormatter.ts — clean display-ready address strings from raw geocoder output
// Handles Google Places description strings, reverseGeocode strings, and address_components arrays.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = new Set([
  'Gujarat', 'Maharashtra', 'Rajasthan', 'Delhi', 'Karnataka',
  'Tamil Nadu', 'Telangana', 'Kerala', 'Goa', 'Punjab', 'Haryana',
  'Uttar Pradesh', 'Bihar', 'West Bengal', 'Odisha', 'Assam',
  'Himachal Pradesh', 'Uttarakhand', 'Chhattisgarh', 'Jharkhand',
  'Madhya Pradesh', 'Andhra Pradesh', 'Jammu & Kashmir', 'Ladakh',
]);

// Plus code: word chars 2-8 + '+' + word chars 2-5, optionally preceded by digits (compound codes)
const PLUS_CODE_RE = /\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,5}\b,?\s*/g;

// Indian 6-digit postal codes (PIN codes)
const PIN_CODE_RE = /\b\d{6}\b,?\s*/g;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Remove plus codes, 6-digit PIN codes, "India", and Indian state names
 * from a raw address string and normalise whitespace/commas.
 */
export function cleanRawAddress(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let s = raw;

  // 1. Strip plus codes (e.g. "RPQM+5XV, " or "GC8Q+4G ")
  s = s.replace(PLUS_CODE_RE, '');

  // 2. Strip 6-digit PIN codes (may be preceded by a space inside a segment)
  s = s.replace(PIN_CODE_RE, '');

  // 3. Split into comma-separated segments, drop country + states, rejoin
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  const cleaned = parts.filter((part) => {
    if (part === 'India') return false;
    if (INDIAN_STATES.has(part)) return false;
    // State name may appear as "Gujarat 370421" — after PIN strip it becomes "Gujarat"
    // but also handle any residual trailing/leading state name
    const trimmed = part.trim();
    if (INDIAN_STATES.has(trimmed)) return false;
    return true;
  });

  return cleaned.join(', ');
}

// ─── address_components extraction ───────────────────────────────────────────

/**
 * From a Google address_components array, extract the best "landmark/area" part
 * and the "city" part according to the priority rules.
 * Returns { landmark: string | null, city: string | null }
 */
function extractFromComponents(components: AddressComponent[]): {
  landmark: string | null;
  city: string | null;
} {
  const find = (...typeGroups: string[][]): string | null => {
    for (const group of typeGroups) {
      for (const comp of components) {
        if (group.some((t) => comp.types.includes(t))) {
          return comp.long_name;
        }
      }
    }
    return null;
  };

  const landmark = find(
    ['transit_station', 'establishment', 'point_of_interest', 'premise'],
    ['sublocality_level_1', 'sublocality'],
  );

  const city = find(
    ['locality'],
    ['administrative_area_level_3'],
    ['administrative_area_level_2'],
  );

  return { landmark, city };
}

// ─── String-based extraction ──────────────────────────────────────────────────

/**
 * From a cleaned comma-separated address string, heuristically pull out
 * the best display segment(s).
 * Returns { landmark: string | null, city: string | null }
 */
function extractFromString(cleaned: string): {
  landmark: string | null;
  city: string | null;
} {
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) return { landmark: null, city: null };
  if (parts.length === 1) return { landmark: null, city: parts[0] };

  // Last part is treated as city/area; everything before is potential landmark/sublocality.
  // Pick the first meaningful segment as landmark (skip very short or numeric-only tokens).
  const city = parts[parts.length - 1];
  const landmarkCandidates = parts.slice(0, parts.length - 1);
  const landmark = landmarkCandidates.find((p) => p.length > 2 && !/^\d+$/.test(p)) ?? null;

  return { landmark, city };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * formatAddress — primary display string.
 * Input can be a raw address string OR a Google address_components array.
 * Output: "Landmark/Sub-locality, City"  or  "City"
 */
export function formatAddress(input: string | AddressComponent[]): string {
  if (Array.isArray(input)) {
    const { landmark, city } = extractFromComponents(input);
    if (landmark && city) return `${landmark}, ${city}`;
    if (city) return city;
    if (landmark) return landmark;
    return '';
  }

  const cleaned = cleanRawAddress(input);
  const { landmark, city } = extractFromString(cleaned);
  if (landmark && city) return `${landmark}, ${city}`;
  if (city) return city;
  if (landmark) return landmark;
  return cleaned;
}

/**
 * formatAddressShort — city only.
 * Output: "City"
 */
export function formatAddressShort(input: string | AddressComponent[]): string {
  if (Array.isArray(input)) {
    const { city } = extractFromComponents(input);
    return city ?? '';
  }

  const cleaned = cleanRawAddress(input);
  const { city, landmark } = extractFromString(cleaned);
  return city ?? landmark ?? cleaned;
}

/**
 * formatAddressFull — sub-locality + city (2-part format, same as formatAddress for strings).
 * For address_components, prefers sublocality over establishment for the first part.
 * Output: "Sub-locality, City"  or  "City"
 */
export function formatAddressFull(input: string | AddressComponent[]): string {
  if (Array.isArray(input)) {
    const find = (...typeGroups: string[][]): string | null => {
      for (const group of typeGroups) {
        for (const comp of input as AddressComponent[]) {
          if (group.some((t) => comp.types.includes(t))) {
            return comp.long_name;
          }
        }
      }
      return null;
    };

    const subLocality = find(
      ['sublocality_level_1', 'sublocality'],
      ['transit_station', 'establishment', 'point_of_interest', 'premise'],
    );
    const city = find(
      ['locality'],
      ['administrative_area_level_3'],
      ['administrative_area_level_2'],
    );

    if (subLocality && city) return `${subLocality}, ${city}`;
    if (city) return city;
    if (subLocality) return subLocality;
    return '';
  }

  // For string input, full and standard are equivalent after cleaning
  return formatAddress(input);
}
