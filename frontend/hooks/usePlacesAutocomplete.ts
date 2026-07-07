import { useState, useEffect, useRef, useCallback } from 'react';
import { PlacesService, PlaceResult, RecentSearch } from '../services/maps/places.service';

interface UsePlacesAutocompleteOptions {
  debounceMs?: number;
  userLat?: number;
  userLng?: number;
  minQueryLength?: number;
}

interface UsePlacesAutocompleteResult {
  results: PlaceResult[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  error: string | null;
  saveSearch: (place: PlaceResult, lat?: number, lng?: number) => Promise<void>;
  clearRecent: () => Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function usePlacesAutocomplete(
  query: string,
  options: UsePlacesAutocompleteOptions = {},
): UsePlacesAutocompleteResult {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    userLat,
    userLng,
    minQueryLength = MIN_QUERY_LENGTH,
  } = options;

  const [results, setResults] = useState<PlaceResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    PlacesService.getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (!query.trim() || query.trim().length < minQueryLength) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const data = await PlacesService.autocomplete(query, userLat, userLng, abortRef.current.signal);
        setResults(data);
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setError('Could not fetch suggestions');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, userLat, userLng, debounceMs, minQueryLength]);

  const saveSearch = useCallback(async (place: PlaceResult, lat?: number, lng?: number) => {
    await PlacesService.saveRecentSearch({
      placeId:       place.placeId,
      mainText:      place.mainText,
      secondaryText: place.secondaryText,
      description:   place.description,
      lat,
      lng,
    });
    const updated = await PlacesService.getRecentSearches();
    setRecentSearches(updated);
  }, []);

  const clearRecent = useCallback(async () => {
    await PlacesService.clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return { results, recentSearches, isLoading, error, saveSearch, clearRecent };
}
