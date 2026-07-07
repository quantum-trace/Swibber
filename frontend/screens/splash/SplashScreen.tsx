import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { StorageService } from '../../services/storageService';
import { Colors, Typography } from '../../theme';

const { width, height } = Dimensions.get('window');

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNav>();
  const { isAuthenticated } = useAuth();

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const glowOpacity = useSharedValue(0);
  const ring1Scale = useSharedValue(0);
  const ring2Scale = useSharedValue(0);
  const ring1Opacity = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const navigate = async () => {
    const onboardingDone = await StorageService.isOnboardingDone();
    if (isAuthenticated) {
      navigation.replace('Main' as any);
    } else if (onboardingDone) {
      navigation.replace('Auth' as any);
    } else {
      navigation.replace('Onboarding');
    }
  };

  useEffect(() => {
    const spring = { damping: 14, stiffness: 200 };

    // Glow pulse
    glowOpacity.value = withTiming(0.6, { duration: 800 });

    // Logo burst in
    logoScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 180 }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    // Ring animations
    ring1Scale.value = withDelay(500, withTiming(1.4, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    ring1Opacity.value = withDelay(500, withSequence(withTiming(0.5, { duration: 600 }), withTiming(0, { duration: 600 })));

    ring2Scale.value = withDelay(700, withTiming(1.8, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    ring2Opacity.value = withDelay(700, withSequence(withTiming(0.3, { duration: 700 }), withTiming(0, { duration: 700 })));

    // Tagline fade in
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    taglineY.value = withDelay(900, withSpring(0, spring));

    // Navigate after 2.4s
    const timer = setTimeout(() => runOnJS(navigate)(), 2400);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0A0A0F', '#14103A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Glow blob */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Pulse rings */}
      <Animated.View style={[styles.ring, ring1Style, { borderColor: `${Colors.primary}40` }]} />
      <Animated.View style={[styles.ring, ring2Style, { borderColor: `${Colors.accent}20` }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <LinearGradient
          colors={Colors.gradientAccent as [string, string]}
          style={styles.logoBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>S</Text>
        </LinearGradient>
      </Animated.View>

      {/* App name + tagline */}
      <Animated.View style={[styles.textContainer, taglineStyle]}>
        <Text style={styles.appName}>Swibber</Text>
        <Text style={styles.tagline}>One App. Every Move.</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.loadingContainer, taglineStyle]}>
        {[0, 1, 2].map((i) => (
          <LoadingDot key={i} delay={i * 150} />
        ))}
      </Animated.View>
    </View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay + 1200,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, marginHorizontal: 4 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0F',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    top: height / 2 - 170,
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    alignSelf: 'center',
  },
  logoContainer: { marginBottom: 24 },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.white,
    includeFontPadding: false,
  },
  textContainer: { alignItems: 'center' },
  appName: {
    ...Typography.display2,
    color: Colors.white,
    letterSpacing: 2,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: `${Colors.accent}CC`,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
