/**
 * useAuthConfig — returns the auth provider list from the backend (DB-driven).
 *
 * Behaviours:
 *  • Initialises immediately from DEFAULT_PROVIDER_CONFIGS so the UI renders
 *    without waiting for any network call.
 *  • Replaces the list once the remote fetch resolves (silent update).
 *  • Filters out disabled providers and platform-mismatched ones (e.g. Apple on Android).
 *  • Sorted by the `order` field set in the DB.
 */
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  DEFAULT_PROVIDER_CONFIGS,
  AuthPlatformEnum,
  type AuthProviderConfig,
} from '../constants/authEnums';
import { AuthConfigService } from '../services/authConfigService';

const filterForPlatform = (configs: AuthProviderConfig[]): AuthProviderConfig[] => {
  const os = Platform.OS as 'ios' | 'android';
  const platformMap: Record<string, string> = { ios: AuthPlatformEnum.IOS, android: AuthPlatformEnum.ANDROID };
  const currentPlatform = platformMap[os];

  return configs
    .filter(
      (c) =>
        c.enabled &&
        (c.platform === AuthPlatformEnum.BOTH || c.platform === currentPlatform),
    )
    .sort((a, b) => a.order - b.order);
};

interface UseAuthConfigResult {
  providers: AuthProviderConfig[];
  isLoading: boolean;
  refetch: () => void;
}

export function useAuthConfig(): UseAuthConfigResult {
  const [providers, setProviders] = useState<AuthProviderConfig[]>(
    filterForPlatform(DEFAULT_PROVIDER_CONFIGS),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    AuthConfigService.getProviders()
      .then((raw) => {
        if (!cancelled) {
          const filtered = filterForPlatform(raw);
          setProviders(filtered.length > 0 ? filtered : filterForPlatform(DEFAULT_PROVIDER_CONFIGS));
        }
      })
      .catch(() => {
        // Silently fall back to defaults already in state
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [revision]);

  const refetch = () => {
    AuthConfigService.invalidate().then(() => setRevision((r) => r + 1));
  };

  return { providers, isLoading, refetch };
}
