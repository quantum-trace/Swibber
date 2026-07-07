import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { usePressScale } from '../../animations/scaleAnimation';
import { BorderRadius, Shadows, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
  pressScale?: number;
}

export default function Card({
  children,
  onPress,
  style,
  elevated = false,
  noPadding = false,
  pressScale = 0.97,
}: CardProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(pressScale);

  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.cardElevated : colors.card,
    borderRadius: BorderRadius.lg,
    padding: noPadding ? 0 : Spacing.base,
    ...Shadows.md,
    ...(style as object),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[cardStyle, animatedStyle]}>{children}</Animated.View>
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
