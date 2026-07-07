import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing } from '../../theme';
import { AuthProviderEnum } from '../../constants/authEnums';
import type { AuthProvider } from '../../constants/authEnums';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth } from '../../hooks/useAppleAuth';
import { useAuthConfig } from '../../hooks/useAuthConfig';
import SocialAuthButton from '../../components/auth/SocialAuthButton';

type WelcomeNav = StackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation     = useNavigation<WelcomeNav>();
  const { showDialog } = useDialog();

  // Native Google Sign-In via @react-native-google-signin/google-signin
  const {
    signIn: googleSignIn,
    isLoading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();

  // Apple Sign In — iOS only
  const {
    signIn: appleSignIn,
    isAvailable: appleAvailable,
    isLoading: appleLoading,
    error: appleError,
    clearError: clearAppleError,
  } = useAppleAuth();

  // DB-driven provider config (labels, icons, enabled flags, order)
  const { providers } = useAuthConfig();

  const [authError, setAuthError] = useState<string | null>(null);

  // Surface any provider-level error as an Alert
  useEffect(() => {
    const err = googleError ?? appleError;
    if (err) {
      setAuthError(err);
      clearGoogleError();
      clearAppleError();
    }
  }, [googleError, appleError]);

  useEffect(() => {
    if (authError) {
      showDialog({
        title:   'Sign In Failed',
        message: authError,
        type:    'error',
        buttons: [{ text: 'OK', onPress: () => setAuthError(null) }],
      });
    }
  }, [authError]);

  // ── Entrance animations ──────────────────────────────────────────────────
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.65);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(28);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 550 }));
    logoScale.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 160 }));
    titleOpacity.value = withDelay(450, withTiming(1, { duration: 480 }));
    titleY.value = withDelay(450, withSpring(0, { damping: 14, stiffness: 180 }));
    buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const isAnyLoading = googleLoading || appleLoading;

  // ── Provider action map ──────────────────────────────────────────────────
  // Maps each AuthProvider key to the action that should execute on press.
  // Handlers are keyed by the DB enum value so they survive alias changes.
  const providerActions: Record<AuthProvider, () => void> = {
    [AuthProviderEnum.GOOGLE]: () => !isAnyLoading && googleSignIn(),
    [AuthProviderEnum.APPLE]: () => !isAnyLoading && appleSignIn(),
    [AuthProviderEnum.PHONE]: () => navigation.navigate('PhoneAuth'),
    [AuthProviderEnum.EMAIL]: () => navigation.navigate('EmailAuth', { mode: 'login' }),
  };

  const providerDisabled: Partial<Record<AuthProvider, boolean>> = {
    [AuthProviderEnum.GOOGLE]: isAnyLoading,
    [AuthProviderEnum.APPLE]: isAnyLoading,
    [AuthProviderEnum.PHONE]: isAnyLoading,
    [AuthProviderEnum.EMAIL]: isAnyLoading,
  };

  const providerLoading: Partial<Record<AuthProvider, boolean>> = {
    [AuthProviderEnum.GOOGLE]: googleLoading,
    [AuthProviderEnum.APPLE]: appleLoading,
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#08080E', '#0E0820', '#08080E']} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoSection, logoStyle]}>
          <LinearGradient
            colors={Colors.gradientAccent as [string, string]}
            style={styles.logoBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoLetter}>S</Text>
          </LinearGradient>
          <Text style={styles.brandName}>Swibber</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineSection, titleStyle]}>
          <Text style={styles.taglineLine}>One App.</Text>
          <Text style={[styles.taglineLine, { color: Colors.accent }]}>Every Move.</Text>
          <Text style={styles.subtitle}>Rides · Food · Parcels</Text>
        </Animated.View>

        {/* Auth buttons — driven by DB config, Apple gated to iOS */}
        <Animated.View style={[styles.authSection, buttonsStyle]}>
          {providers.map((providerConfig, index) => {
            // Apple is physically unavailable on Android — skip even if DB says enabled
            if (providerConfig.key === AuthProviderEnum.APPLE && !appleAvailable) return null;

            return (
              <SocialAuthButton
                key={providerConfig.key}
                provider={providerConfig.key}
                config={providerConfig}
                onPress={providerActions[providerConfig.key]}
                isLoading={providerLoading[providerConfig.key] ?? false}
                isDisabled={providerDisabled[providerConfig.key] ?? false}
                animationDelay={index * 80}
              />
            );
          })}

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={{ color: Colors.accent }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: Colors.accent }}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080E' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 320, height: 320, backgroundColor: 'rgba(76,53,232,0.14)', top: -100, left: -80 },
  orb2: { width: 220, height: 220, backgroundColor: 'rgba(0,212,255,0.08)', bottom: 120, right: -70 },
  orb3: { width: 180, height: 180, backgroundColor: 'rgba(123,47,190,0.10)', top: '35%', right: -50 },

  logoSection: { alignItems: 'center', paddingTop: 100, paddingBottom: 24 },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  logoLetter: { fontSize: 46, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  brandName: { fontSize: 32, fontWeight: '800', color: Colors.white, letterSpacing: 2.5 },

  taglineSection: { alignItems: 'center', paddingBottom: 52 },
  taglineLine: { fontSize: 36, fontWeight: '700', color: Colors.white, lineHeight: 44, letterSpacing: -0.5 },
  subtitle: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.40)',
    marginTop: 14,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
  },

  authSection: { paddingHorizontal: Spacing.xl, gap: 12 },
  terms: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: Spacing.base,
  },
});
