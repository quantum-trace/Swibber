import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { Config } from '../constants/config';

/**
 * Firebase is initialized once and reused across the app.
 * getApps() guard ensures we never call initializeApp twice (safe for
 * hot-reload / Fast Refresh in development).
 */
const firebaseApp = getApps().length === 0 ? initializeApp(Config.FIREBASE) : getApp();

/**
 * Set up auth with React Native AsyncStorage persistence.
 * initializeAuth throws 'auth/already-initialized' if called more than once,
 * so we catch that specific case and fall through to getAuth() which returns
 * the already-created instance.
 */
let firebaseAuth: Auth;

try {
  // Lazy-require to stay compatible with web/Jest environments that don't
  // have the native modules available.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err: unknown) {
  /**
   * Two expected error cases:
   *  1. 'auth/already-initialized' — hot reload hit initializeAuth a second time
   *  2. Module not found — running in a web/Jest env without native modules
   * In both cases getAuth() returns the existing (or default) instance.
   */
  firebaseAuth = getAuth(firebaseApp);
}

export { firebaseAuth };
export default firebaseApp;
