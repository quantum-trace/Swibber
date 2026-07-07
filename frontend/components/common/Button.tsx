import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { usePressScale } from '../../animations/scaleAnimation';
import { Colors, BorderRadius, Typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  isSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: string[];
  fullWidth?: boolean;
}

const SIZE_MAP: Record<ButtonSize, { height: number; paddingH: number; textStyle: object }> = {
  sm: { height: 40, paddingH: 16, textStyle: Typography.buttonSmall },
  md: { height: 52, paddingH: 20, textStyle: Typography.button },
  lg: { height: 60, paddingH: 24, textStyle: Typography.buttonLarge },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  isDisabled = false,
  isSuccess = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  gradient,
  fullWidth = true,
}: ButtonProps) {
  const { isDark } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);
  const [pressed, setPressed] = useState(false);

  const sizeConfig = SIZE_MAP[size];
  const disabled = isDisabled || isLoading;

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  const handlePressIn = () => {
    if (!disabled) { onPressIn(); setPressed(true); }
  };

  const handlePressOut = () => {
    onPressOut(); setPressed(false);
  };

  const resolveGradient = (): string[] => {
    if (gradient) return gradient;
    if (isSuccess) return Colors.gradientSuccess;
    if (variant === 'primary') return Colors.gradientPrimary;
    if (variant === 'danger') return [Colors.error, Colors.errorLight];
    return [];
  };

  const useGradient = variant === 'primary' || variant === 'danger' || variant === 'secondary' || !!gradient || isSuccess;

  const getOuterStyle = (): ViewStyle => ({
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingH,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: fullWidth ? 'stretch' : 'center',
    opacity: disabled ? 0.5 : 1,
    ...(!useGradient && variant === 'outline' && {
      borderWidth: 1.5,
      borderColor: Colors.primary,
      backgroundColor: Colors.transparent,
    }),
    ...(!useGradient && variant === 'ghost' && {
      backgroundColor: Colors.transparent,
    }),
    ...(style as object),
  });

  const getTextColor = (): string => {
    if (variant === 'outline' || variant === 'ghost') return Colors.primary;
    return Colors.white;
  };

  const content = (
    <Animated.View
      style={[
        styles.inner,
        { flexDirection: 'row', alignItems: 'center', gap: 8 },
        animatedStyle,
        getOuterStyle(),
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[sizeConfig.textStyle, { color: getTextColor() }, textStyle]}>
            {isSuccess ? '✓ Done' : label}
          </Text>
          {rightIcon}
        </>
      )}
    </Animated.View>
  );

  if (useGradient && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{ borderRadius: BorderRadius.xxl, overflow: 'hidden', alignSelf: fullWidth ? 'stretch' : 'center' }}
      >
        <LinearGradient
          colors={resolveGradient() as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height: sizeConfig.height, paddingHorizontal: sizeConfig.paddingH }]}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              {leftIcon}
              <Text style={[sizeConfig.textStyle, { color: Colors.white }, textStyle]}>
                {isSuccess ? '✓ Done' : label}
              </Text>
              {rightIcon}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
