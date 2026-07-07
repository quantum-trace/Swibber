import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Typography } from '../../theme';
import { AuthProviderEnum, type AuthProviderConfig } from '../../constants/authEnums';
import type { AuthProvider } from '../../constants/authEnums';

/**
 * Fallback metadata when no DB-driven config is available.
 * Values here are never shown to users in production (they come from the DB);
 * this table is only a last-resort safety net during local development or if
 * the network is unavailable and there is no cached config yet.
 */
const FALLBACK_META: Record<
  AuthProvider,
  { iconName: string; iconColor: string; label: string }
> = {
  [AuthProviderEnum.GOOGLE]: {
    iconName: 'google',
    iconColor: '#DB4437',
    label: 'Continue with Google',
  },
  [AuthProviderEnum.APPLE]: {
    iconName: 'apple',
    iconColor: '#FFFFFF',
    label: 'Continue with Apple',
  },
  [AuthProviderEnum.PHONE]: {
    iconName: 'phone',
    iconColor: '#4C35E8',
    label: 'Continue with Phone',
  },
  [AuthProviderEnum.EMAIL]: {
    iconName: 'email-outline',
    iconColor: '#A0A0B8',
    label: 'Continue with Email',
  },
};

export interface SocialAuthButtonProps {
  provider: AuthProvider;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  /**
   * Pass the full AuthProviderConfig from the DB (via useAuthConfig) to
   * override label and icon. When omitted the button uses FALLBACK_META.
   */
  config?: AuthProviderConfig;
  /** Direct label override — takes priority over config.alias */
  label?: string;
  animationDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SocialAuthButton({
  provider,
  onPress,
  isLoading = false,
  isDisabled = false,
  config,
  label,
  animationDelay = 0,
  style,
}: SocialAuthButtonProps) {
  const { colors, isDark } = useTheme();
  const fallback = FALLBACK_META[provider];

  // DB config takes precedence over hard-coded fallback
  const displayLabel = label ?? config?.alias ?? fallback.label;
  const iconName = config?.iconName ?? fallback.iconName;
  const iconColor = config?.primaryColor ?? fallback.iconColor;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(animationDelay, withTiming(1, { duration: 380 }));
    translateY.value = withDelay(animationDelay, withSpring(0, { damping: 18, stiffness: 200 }));
  }, [animationDelay]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(withTiming(1.02, { duration: 80 }), withSpring(1, { damping: 12 }));
  };

  const disabled = isDisabled || isLoading;

  return (
    <Animated.View style={[containerStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.button,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(255,255,255,0.92)',
            borderColor: isDark
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(0,0,0,0.08)',
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          {isLoading ? (
            <ActivityIndicator size={20} color={iconColor} />
          ) : (
            <MaterialCommunityIcons
              name={iconName as never}
              size={22}
              color={iconColor}
            />
          )}
        </View>

        <Text
          style={[
            Typography.labelLarge,
            styles.label,
            { color: isDark ? '#FFFFFF' : '#0A0A1A' },
          ]}
          numberOfLines={1}
        >
          {isLoading ? 'Please wait…' : displayLabel}
        </Text>

        {/* Right spacer keeps the label visually centred */}
        <View style={styles.iconWrap} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
