/**
 * AuthConfigService — fetches auth provider configuration from the backend
 * so button labels, icons, enabled flags and ordering can be managed in the DB
 * without a client release.
 *
 * Cache strategy: 5-minute in-memory TTL + AsyncStorage persistence.
 * Falls back to DEFAULT_PROVIDER_CONFIGS if the network call fails.
 */
import { apiClient } from '../api/client';
import { StorageService } from './storageService';
import {
  DEFAULT_PROVIDER_CONFIGS,
  type AuthProviderConfig,
} from '../constants/authEnums';

const STORAGE_KEY = '@swibber/auth_provider_config';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PersistedConfig {
  providers: AuthProviderConfig[];
  cachedAt: number;
}

// In-memory layer so repeated calls within the same session are instant
let _memCache: PersistedConfig | null = null;

const isFresh = (entry: PersistedConfig | null): boolean =>
  !!entry && Date.now() - entry.cachedAt < CACHE_TTL_MS;

export const AuthConfigService = {
  /**
   * Returns the ordered list of provider configs.
   * Order: memory cache → AsyncStorage cache → backend fetch → hard-coded defaults.
   */
  async getProviders(): Promise<AuthProviderConfig[]> {
    if (isFresh(_memCache)) return _memCache!.providers;

    const stored = await StorageService.get<PersistedConfig>(STORAGE_KEY);
    if (isFresh(stored)) {
      _memCache = stored!;
      return stored!.providers;
    }

    try {
      const { data } = await apiClient.get<{
        success: boolean;
        data: AuthProviderConfig[];
      }>('/auth/config');

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const entry: PersistedConfig = {
          providers: data.data,
          cachedAt: Date.now(),
        };
        _memCache = entry;
        await StorageService.set(STORAGE_KEY, entry);
        return data.data;
      }
    } catch {
      // Network unavailable — fall through to stale cache or defaults
    }

    // Stale cache beats hard-coded defaults
    if (stored?.providers.length) {
      _memCache = stored;
      return stored.providers;
    }

    return DEFAULT_PROVIDER_CONFIGS;
  },

  /** Force the next call to re-fetch from the backend. */
  async invalidate(): Promise<void> {
    _memCache = null;
    await StorageService.remove(STORAGE_KEY);
  },
};
