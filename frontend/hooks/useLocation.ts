import { useState, useEffect, useCallback } from 'react';
import { LocationService, LocationResult } from '../services/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await LocationService.getCurrentLocationWithAddress();
      setLocation(result);
      if (!result) setError('Location permission denied');
    } catch {
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { location, isLoading, error, refetch: fetchLocation, requestPermission: LocationService.requestPermission };
};
