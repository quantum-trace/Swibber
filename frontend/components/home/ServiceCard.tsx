import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { usePressScale } from '../../animations/scaleAnimation';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import type { ServiceTypeConfig } from '../../constants/enums';

interface ServiceCardProps {
  config: ServiceTypeConfig;
  onPress: () => void;
  stat?: string;
}

export default function ServiceCard({ config, onPress, stat }: ServiceCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.94);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.wrapper}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={config.gradient as [string, string]}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name={config.icon as any} size={28} color={Colors.white} />
          </View>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={styles.label}>{config.alias}</Text>
          <Text style={styles.description}>{config.description}</Text>
          {stat && (
            <View style={styles.statBadge}>
              <Text style={styles.statText}>{stat}</Text>
            </View>
          )}
          <View style={styles.arrowRow}>
            <Text style={styles.cta}>{config.ctaLabel}</Text>
            <MaterialIcons name="arrow-forward" size={16} color={`${Colors.white}CC`} />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    minHeight: 160,
    ...Shadows.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 32, marginBottom: 4 },
  label: { ...Typography.h4, color: Colors.white, marginBottom: 4 },
  description: { ...Typography.caption, color: `${Colors.white}CC`, marginBottom: 12 },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statText: { ...Typography.caption, color: Colors.white },
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cta: { ...Typography.captionBold, color: `${Colors.white}CC` },
});
