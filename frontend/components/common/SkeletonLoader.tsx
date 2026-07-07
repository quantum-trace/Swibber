import React, { useEffect } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonItem({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const baseColor = isDark ? '#2A2A3A' : '#E8E8F0';
  const highlightColor = isDark ? '#3A3A50' : '#F0F0F8';

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: baseColor },
        animStyle,
        style,
      ]}
    />
  );
}

export function CardSkeleton({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <SkeletonItem width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <SkeletonItem height={14} width="60%" />
          <SkeletonItem height={12} width="40%" />
        </View>
      </View>
      <SkeletonItem height={12} />
      <View style={{ marginTop: 6 }}>
        <SkeletonItem height={12} width="80%" />
      </View>
    </View>
  );
}

export function RestaurantSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.restaurantCard, { backgroundColor: colors.card }]}>
      <SkeletonItem height={140} borderRadius={12} style={{ marginBottom: 12 }} />
      <SkeletonItem height={16} width="70%" style={{ marginBottom: 6 }} />
      <SkeletonItem height={12} width="50%" style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonItem height={12} width={60} />
        <SkeletonItem height={12} width={60} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3, style }: { count?: number; style?: ViewStyle }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} style={style} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  restaurantCard: { borderRadius: 16, padding: 12, marginBottom: 12 },
});
