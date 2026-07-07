import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../theme';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function LoadingSpinner({ size = 40, color = Colors.primary, style }: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: `${color}40`,
            borderTopColor: color,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
