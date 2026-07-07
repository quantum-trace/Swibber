import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { usePressScale } from '../../animations/scaleAnimation';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  couponCode: string;
  discount: string;
  expiresIn: string;
  gradient: string[];
  onPress?: () => void;
}

export default function PromoBanner({
  title,
  subtitle,
  couponCode,
  discount,
  expiresIn,
  gradient,
  onPress,
}: PromoBannerProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={gradient as [string, string]}
          style={styles.banner}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <View style={styles.left}>
            <Text style={styles.discount}>{discount} OFF</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.expiry}>
              <Text style={styles.expiryText}>⏰ Expires: {expiresIn}</Text>
            </View>
          </View>
          <View style={styles.couponContainer}>
            <Text style={styles.useText}>USE CODE</Text>
            <View style={styles.couponBox}>
              <Text style={styles.couponCode}>{couponCode}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 110,
    overflow: 'hidden',
  },
  left: { flex: 1, marginRight: Spacing.base },
  discount: { ...Typography.overline, color: `${Colors.white}CC`, marginBottom: 4 },
  title: { ...Typography.h4, color: Colors.white, marginBottom: 2 },
  subtitle: { ...Typography.caption, color: `${Colors.white}BB`, marginBottom: 8 },
  expiry: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  expiryText: { ...Typography.captionBold, color: Colors.white, fontSize: 10 },
  couponContainer: { alignItems: 'center' },
  useText: { ...Typography.captionBold, color: `${Colors.white}CC`, marginBottom: 4, fontSize: 9, letterSpacing: 1 },
  couponBox: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  couponCode: { ...Typography.labelLarge, color: Colors.white, letterSpacing: 1 },
});
