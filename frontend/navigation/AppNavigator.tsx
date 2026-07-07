import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { StorageService } from '../services/storageService';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ForceUpdateScreen from '../screens/ForceUpdateScreen';
import { Colors } from '../theme';
import { apiClient } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { Config } from '../constants/config';

// Returns true if `current` is strictly older than `minimum` (semver)
function isVersionBehind(current: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [cMaj, cMin, cPat] = parse(current);
  const [mMaj, mMin, mPat] = parse(minimum);
  if (cMaj !== mMaj) return cMaj < mMaj;
  if (cMin !== mMin) return cMin < mMin;
  return cPat < mPat;
}

interface VersionState {
  required: boolean;
  apkUrl:   string;
}

const Stack = createStackNavigator<RootStackParamList>();

// ── Branded loading view shown during auth bootstrap ─────────────────────────

function BootstrapLoader() {
  const { colors } = useTheme();
  return (
    <View style={[styles.loader, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// ── Inner navigator — rendered inside NavigationContainer ────────────────────

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [versionState, setVersionState] = useState<VersionState | null>(null);

  useEffect(() => {
    const checkVersion = async (): Promise<VersionState> => {
      try {
        const { data } = await apiClient.get(Endpoints.APP_CONFIG, { timeout: 8000 });
        const { minVersion, apkDownloadUrl } = data.data;
        return { required: isVersionBehind(Config.APP_VERSION, minVersion), apkUrl: apkDownloadUrl ?? '' };
      } catch {
        return { required: false, apkUrl: '' };
      }
    };

    Promise.all([
      StorageService.isOnboardingDone(),
      checkVersion(),
    ]).then(([done, version]) => {
      setOnboardingDone(done);
      setVersionState(version);
    });
  }, []);

  useEffect(() => {
    if (!isLoading && onboardingDone !== null && versionState !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, onboardingDone, versionState]);

  // Hard fallback: force-hide splash after 10s regardless of state
  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Wait for auth bootstrap, onboarding flag, and version check before rendering
  if (isLoading || onboardingDone === null || versionState === null) {
    return <BootstrapLoader />;
  }

  // Block access entirely if the installed version is below the minimum
  if (versionState.required) {
    return <ForceUpdateScreen apkUrl={versionState.apkUrl} />;
  }

  console.log('[AUTH] Bootstrap complete — isAuthenticated:', isAuthenticated, '| onboardingDone:', onboardingDone);

  if (isAuthenticated) {
    // User is logged in → go straight to app
    console.log('[NAVIGATING_HOME] Rendering Main stack');
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    );
  }

  if (!onboardingDone) {
    // First-time user — show onboarding then auth
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // Returning user not yet authenticated
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
      <Stack.Screen name="Auth" component={AuthNavigator} />
    </Stack.Navigator>
  );
}

// ── Root navigator — owns NavigationContainer ─────────────────────────────────

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: '#4C35E8',
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: '#4C35E8',
        },
      }}
    >
      <AppContent />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
